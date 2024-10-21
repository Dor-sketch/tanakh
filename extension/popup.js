let bibleData;
let lastVisit = { book: 'בראשית', chapter: 1 };
let useHebrewNumbering = true;

const bookSelect = document.getElementById('book');
const chapterSelect = document.getElementById('chapter');
const contentDiv = document.getElementById('content');
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const prevChapterBtn = document.getElementById('prevChapter');
const nextChapterBtn = document.getElementById('nextChapter');
const toggleNumberingBtn = document.getElementById('toggleNumbering');

// Fetch the bible.json file and parse it
fetch(chrome.runtime.getURL('bible.JSON'))
    .then(response => response.json())
    .then(data => {
        bibleData = data;
        initializeApp(); // Initialize the app only after bibleData is loaded
    })
    .catch(error => console.error('Error fetching bible.json:', error));

function initializeApp() {
    populateBooks();
    chrome.storage.local.get(['lastVisit', 'useHebrewNumbering'], (result) => {
        lastVisit = result.lastVisit || { book: 'בראשית', chapter: 1 };
        useHebrewNumbering = result.useHebrewNumbering !== undefined ? result.useHebrewNumbering : true;
        openLastVisit();
    });
    initializeUIText();
}

function populateBooks() {
    const books = Object.keys(bibleData);
    bookSelect.innerHTML = `<option value="">${chrome.i18n.getMessage('selectBook')}</option>`;
    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        bookSelect.appendChild(option);
    });
    bookSelect.value = lastVisit.book;
}

function populateChapters(book) {
    const chapters = bibleData[book];
    chapterSelect.innerHTML = `<option value="">${chrome.i18n.getMessage('selectChapter')}</option>`;
    chapters.forEach((_, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = `${chrome.i18n.getMessage('chapter')} ${formatNumber(index + 1)}`;
        chapterSelect.appendChild(option);
    });
    chapterSelect.value = lastVisit.chapter;
}

function numberToHebrewLetters(num) {
    const hebChars = "אבגדהוזחטיכלמנסעפצקרשת";
    const hebTens = "יכלמנסעפצ";
    let result = "";

    if (num >= 1000) {
        result = numberToHebrewLetters(Math.floor(num / 1000)) + "'";
        num %= 1000;
    }

    if (num >= 100) {
        result += hebChars[Math.floor(num / 100) - 1];
        num %= 100;
    }

    if (num >= 10) {
        result += hebTens[Math.floor(num / 10) - 1];
        num %= 10;
    }

    if (num > 0) {
        result += hebChars[num - 1];
    }

    result = result.replace('יה', 'טו').replace('יו', 'טז');

    if (result.length === 2) {
        result = result[0] + '"' + result[1];
    } else if (result.length > 2) {
        result += '"';
    } else {
        result += "'";
    }

    return result;
}

function formatNumber(num) {
    return useHebrewNumbering ? numberToHebrewLetters(num) : num.toString();
}

function loadChapterContent(book, chapter) {
    const verses = bibleData[book][chapter - 1];
    contentDiv.innerHTML = verses.map((verse, index) => `
        <p class="verse" data-verse="${index + 1}">
            <span class="verse-number">${formatNumber(index + 1)}</span>
            ${verse}
        </p>
    `).join('');

    chrome.storage.local.set({ lastVisit: { book, chapter } });
}

bookSelect.addEventListener('change', () => {
    const selectedBook = bookSelect.value;
    if (selectedBook) {
        populateChapters(selectedBook);
        loadChapterContent(selectedBook, 1);
    }
});

chapterSelect.addEventListener('change', () => {
    const selectedChapter = chapterSelect.value;
    if (selectedChapter) {
        loadChapterContent(bookSelect.value, selectedChapter);
    }
});

prevChapterBtn.addEventListener('click', () => {
    let currentChapter = parseInt(chapterSelect.value);
    if (currentChapter > 1) {
        chapterSelect.value = currentChapter - 1;
        loadChapterContent(bookSelect.value, currentChapter - 1);
    }
});

nextChapterBtn.addEventListener('click', () => {
    let currentChapter = parseInt(chapterSelect.value);
    if (currentChapter < bibleData[bookSelect.value].length) {
        chapterSelect.value = currentChapter + 1;
        loadChapterContent(bookSelect.value, currentChapter + 1);

        // Scroll to the top of the page with a smooth effect
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});

searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
        performSearch();
    }
});

toggleNumberingBtn.addEventListener('click', () => {
    useHebrewNumbering = !useHebrewNumbering;
    chrome.storage.local.set({ useHebrewNumbering });
    toggleNumberingBtn.textContent = chrome.i18n.getMessage(useHebrewNumbering ? 'useRegularNumbers' : 'useHebrewNumbering');
    populateChapters(bookSelect.value);
    loadChapterContent(bookSelect.value, chapterSelect.value);
});

function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    const regex = new RegExp(removeNikud(query), 'gi');
    contentDiv.innerHTML = '';

    Object.keys(bibleData).forEach(book => {
        bibleData[book].forEach((chapter, chapterIndex) => {
            chapter.forEach((verse, verseIndex) => {
                if (regex.test(removeNikud(verse))) {
                    contentDiv.innerHTML += `
                        <p class="verse">
                            <span class="verse-number">(${book} ${formatNumber(chapterIndex + 1)}:${formatNumber(verseIndex + 1)})</span>
                            ${verse.replace(regex, match => `<span class="highlight">${match}</span>`)}
                        </p>
                    `;
                }
            });
        });
    });

    if (contentDiv.innerHTML === '') {
        contentDiv.innerHTML = `<p>${chrome.i18n.getMessage('noResults')}</p>`;
    }
}

function removeNikud(text) {
    return text.replace(/[\u0591-\u05C7]/g, "");
}

function openLastVisit() {
    const { book, chapter } = lastVisit;
    if (bibleData[book]) {
        populateChapters(book);
        loadChapterContent(book, chapter);
    }
}

function initializeUIText() {
    document.title = chrome.i18n.getMessage('extensionName');
    searchInput.placeholder = chrome.i18n.getMessage('search');
    searchButton.textContent = chrome.i18n.getMessage('searchButton');
    prevChapterBtn.textContent = chrome.i18n.getMessage('prevChapter');
    nextChapterBtn.textContent = chrome.i18n.getMessage('nextChapter');
    toggleNumberingBtn.textContent = chrome.i18n.getMessage('toggleNumbering');
}

document.addEventListener('DOMContentLoaded', () => {
    // The app will be initialized after bibleData is loaded
});