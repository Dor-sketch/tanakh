import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

// Root route to handle "/"
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to the Proxy Server</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/fetch-full-bible">Fetch and Save Full Bible</a></li>
      <li><a href="/local-full-bible">View Local Full Bible Data</a></li>
    </ul>
  `);
});

const books = [
  "בראשית", "שמות", "ויקרא", "במדבר", "דברים", "יהושע", "שופטים", "שמואל א", "שמואל ב",
  "מלכים א", "מלכים ב", "ישעיהו", "ירמיהו", "יחזקאל", "הושע", "יואל", "עמוס", "עובדיה",
  "יונה", "מיכה", "נחום", "חבקוק", "צפניה", "חגי", "זכריה", "מלאכי", "תהלים", "משלי",
  "איוב", "שיר השירים", "רות", "איכה", "קהלת", "אסתר", "דניאל", "עזרא", "נחמיה",
  "דברי הימים א", "דברי הימים ב"
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch a chapter with retries
async function fetchChapter(book, chapter, retries = 3) {
  const chapterUrl = `https://www.sefaria.org/api/texts/${encodeURIComponent(book)}.${chapter}?commentary=0&context=0`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching ${book}, chapter ${chapter}: Attempt ${attempt}`);
      const response = await fetch(chapterUrl, { redirect: 'follow' });

      if (!response.ok) {
        throw new Error(`Failed to fetch chapter ${chapter} of ${book}: ${response.statusText}`);
      }

      const chapterData = await response.json();
      if (!chapterData || !chapterData.he) {
        throw new Error(`Error: Chapter ${chapter} of ${book} has no content`);
      }

      return chapterData.he; // Return the Hebrew text for the chapter
    } catch (error) {
      console.error(`Error fetching chapter ${chapter} of ${book}: ${error.message}`);
      if (attempt === retries) throw error; // If final attempt fails, throw the error
    }
    await delay(1000); // Delay between retries to avoid spamming the server
  }
}

// Fetch and save the entire Hebrew Bible
app.get('/fetch-full-bible', async (req, res) => {
  try {
    const fullBible = {};

    for (let book of books) {
      console.log(`Fetching book: ${book}...`);

      const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(book)}.1?commentary=0&context=0`;
      const response = await fetch(url, { redirect: 'follow' });

      if (!response.ok) {
        console.error(`Failed to fetch ${book}: ${response.statusText}`);
        continue; // Skip this book if it fails
      }

      const bookData = await response.json();
      if (!bookData || !bookData.lengths) {
        console.error(`Error: Couldn't fetch chapter info for ${book}`);
        continue;
      }

      const chapterCount = bookData.lengths[0];
      const bookChapters = [];

      // Fetch each chapter with retries
      for (let chapter = 1; chapter <= chapterCount; chapter++) {
        try {
          const chapterData = await fetchChapter(book, chapter);
          bookChapters.push(chapterData); // Add chapter to book
        } catch (error) {
          console.error(`Skipping chapter ${chapter} of ${book} due to repeated errors`);
          continue; // Skip this chapter if all retries fail
        }
      }

      fullBible[book] = bookChapters;
    }

    // Save the full Bible data locally
    const dataPath = path.join(process.cwd(), 'full_bible.json');
    fs.writeFileSync(dataPath, JSON.stringify(fullBible, null, 2));
    console.log('Full Bible saved to:', dataPath);

    res.send('Full Hebrew Bible fetched and saved locally!');
  } catch (error) {
    console.error('Error fetching the full Bible:', error.message);
    res.status(500).send(`Error fetching the full Bible: ${error.message}`);
  }
});

app.get('/local-full-bible', (req, res) => {
  const dataPath = path.join(process.cwd(), 'full_bible.json');
  if (fs.existsSync(dataPath)) {
    const data = fs.readFileSync(dataPath, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.status(404).send('Full Bible data not found');
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});