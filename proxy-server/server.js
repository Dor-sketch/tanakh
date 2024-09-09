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
      <li><a href="/fetch-and-save">Fetch and Save Data</a></li>
      <li><a href="/local-data">View Local Data</a></li>
    </ul>
  `);
});

// Fetch and save data endpoint
app.get('/fetch-and-save', async (req, res) => {
  try {
    const apiUrl = 'https://www.sefaria.org/api/texts/בראשית.2?commentary=0&context=0';
    console.log('Fetching data from:', apiUrl);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Data received:', data);  // Log the data to check if it's fetched

    // Save the data locally
    const dataPath = path.join(process.cwd(), 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log('Data saved to:', dataPath);

    res.send('Data fetched and saved locally!');
  } catch (error) {
    console.error('Error fetching data:', error.message);  // Log the error message
    res.status(500).send('Error fetching data');
  }
});

// Serve locally stored data
app.get('/local-data', (req, res) => {
  const dataPath = path.join(process.cwd(), 'data.json');
  if (fs.existsSync(dataPath)) {
    const data = fs.readFileSync(dataPath, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.status(404).send('Data not found');
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
