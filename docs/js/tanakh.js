/**
 * Tanakh Reader - Main Application Script
 * ----------------------------------------
 */

// App Configuration
const config = {
    bibleDataUrl: './assets/full_bible.json',
    rashiDataUrl: './assets/rashi_commentary.json',
    storageKeys: {
        lastVisit: 'tanakh-last-visit',
        hebrewNumbering: 'tanakh-hebrew-numbering'
    },
    defaultBook: 'בראשית',
    defaultChapter: 1
};

// App State
let bibleData = {};
let rashiData = {};
let lastVisit = JSON.parse(localStorage.getItem(config.storageKeys.lastVisit)) || {
    book: config.defaultBook,
    chapter: config.defaultChapter
};
let useHebrewNumbering = JSON.parse(localStorage.getItem(config.storageKeys.hebrewNumbering) || 'true');

// DOM Elements
const elements = {
    bookSelect: document.getElementById('book'),
    chapterSelect: document.getElementById('chapter'),
    contentDiv: document.getElementById('content'),
    searchInput: document.getElementById('search'),
    searchButton: document.getElementById('searchButton'),
    prevChapterBtn: document.getElementById('prevChapter'),
    nextChapterBtn: document.getElementById('nextChapter'),
    helpModal: document.getElementById('helpModal'),
    helpBtn: document.getElementById('helpBtn'),
    closeHelpModal: document.getElementById('closeHelpModal'),
    aboutModal: document.getElementById('aboutModal'),
    aboutBtn: document.getElementById('aboutBtn'),
    closeAboutModal: document.getElementById('closeAboutModal'),
    rashiModal: document.getElementById('rashiModal'),
    closeRashiModal: document.getElementById('closeRashiModal'),
    rashiText: document.getElementById('rashiText')
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Initialize the application
 */
async function initApp() {
    // Create Hebrew number toggle button
    createToggleButton();

    // Add event listeners
    setupEventListeners();

    // Load data
    try {
        await Promise.all([
            loadBibleData(),
            loadRashiData()
        ]);

        // If data is loaded successfully, open last visited location
        openLastVisit();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('שגיאה בטעינת נתוני התנ"ך. אנא נסה שוב.');
    }

    // Add modal animation classes
    setupModalAnimations();
}

/**
 * Create the toggle button for Hebrew numbering
 */
function createToggleButton() {
    const toggleNumberingBtn = document.createElement('button');
    toggleNumberingBtn.textContent = useHebrewNumbering ? 'מספרים רגילים' : 'מספור עברי';
    toggleNumberingBtn.id = 'toggleNumbering';
    toggleNumberingBtn.setAttribute('aria-label', 'שנה סוג מספור');
    toggleNumberingBtn.title = 'שנה בין מספור עברי למספור רגיל';

    // Insert before navigation buttons
    const prevNext = document.getElementById('prevNext');
    const parent = prevNext.parentNode;
    parent.insertBefore(toggleNumberingBtn, prevNext);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Book selection
    elements.bookSelect.addEventListener('change', handleBookSelection);

    // Chapter selection
    elements.chapterSelect.addEventListener('change', handleChapterSelection);

    // Navigation buttons
    elements.prevChapterBtn.addEventListener('click', navigateToPreviousChapter);
    elements.nextChapterBtn.addEventListener('click', navigateToNextChapter);

    // Search functionality
    elements.searchButton.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Hebrew numbering toggle
    document.getElementById('toggleNumbering').addEventListener('click', toggleHebrewNumbering);

    // Modal controls
    elements.helpBtn.addEventListener('click', () => showModal(elements.helpModal));
    elements.closeHelpModal.addEventListener('click', () => hideModal(elements.helpModal));

    elements.aboutBtn.addEventListener('click', () => showModal(elements.aboutModal));
    elements.closeAboutModal.addEventListener('click', () => hideModal(elements.aboutModal));

    elements.closeRashiModal.addEventListener('click', () => hideModal(elements.rashiModal));

    // Close modals when clicking outside content
    window.addEventListener('click', event => {
        const modals = [elements.helpModal, elements.aboutModal, elements.rashiModal];
        modals.forEach(modal => {
            if (event.target === modal) {
                hideModal(modal);
            }
        });
    });

    // Keyboard navigation
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            const modals = [elements.helpModal, elements.aboutModal, elements.rashiModal];
            modals.forEach(hideModal);
        }
    });
}

/**
 * Show a modal with animation
 * @param {HTMLElement} modal - The modal element to show
 */
function showModal(modal) {
    modal.style.display = 'flex';
    // Trigger reflow
    modal.offsetHeight;
    modal.classList.add('active');
}

/**
 * Hide a modal with animation
 * @param {HTMLElement} modal - The modal element to hide
 */
function hideModal(modal) {
    modal.classList.remove('active');
    // Wait for animation to complete
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

/**
 * Setup modal animations
 */
function setupModalAnimations() {
    const modals = [elements.helpModal, elements.aboutModal, elements.rashiModal];

    // Add transition end listener to modals
    modals.forEach(modal => {
        modal.addEventListener('transitionend', event => {
            if (event.target === modal && !modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        });
    });
}

/**
 * Load Bible data from JSON file
 */
async function loadBibleData() {
    try {
        const response = await fetch(config.bibleDataUrl);
        if (!response.ok) {
            throw new Error(`Failed to load Bible data: ${response.statusText}`);
        }
        bibleData = await response.json();
        populateBooks();
        return true;
    } catch (error) {
        console.error('Error loading Bible data:', error);
        throw error;
    }
}

/**
 * Load Rashi commentary data
 */
async function loadRashiData() {
    try {
        const response = await fetch(config.rashiDataUrl);
        if (!response.ok) {
            console.warn(`Failed to load Rashi commentaries: ${response.statusText}`);
            return false;
        }
        rashiData = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading Rashi data:', error);
        return false;
    }
}

/**
 * Show error message in content area
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.contentDiv.innerHTML = `
        <div class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Populate book select dropdown
 */
function populateBooks() {
    const books = Object.keys(bibleData);
    elements.bookSelect.innerHTML = '<option value="">בחר ספר</option>';

    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        elements.bookSelect.appendChild(option);
    });

    elements.bookSelect.value = lastVisit.book;
}

/**
 * Populate chapter dropdown based on selected book
 * @param {string} book - Selected book name
 */
function populateChapters(book) {
    const chapters = bibleData[book];
    elements.chapterSelect.innerHTML = '<option value="">בחר פרק</option>';

    chapters.forEach((_, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = `פרק ${formatNumber(index + 1)}`;
        elements.chapterSelect.appendChild(option);
    });

    elements.chapterSelect.value = lastVisit.chapter;
}

/**
 * Convert number to Hebrew letters (Gematria)
 * @param {number} num - Number to convert
 * @returns {string} Hebrew representation of the number
 */
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

    // Special cases for 15 and 16
    result = result.replace('יה', 'טו').replace('יו', 'טז');

    // Insert quotation mark between characters for numbers 11-99
    if (result.length === 2) {
        result = result[0] + '"' + result[1];
    } else if (result.length > 2) {
        result += '"';
    } else {
        result += "'";
    }

    return result;
}

/**
 * Format number based on current numbering system
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return useHebrewNumbering ? numberToHebrewLetters(num) : num.toString();
}

/**
 * Toggle between Hebrew and regular numbering
 */
function toggleHebrewNumbering() {
    useHebrewNumbering = !useHebrewNumbering;
    localStorage.setItem(config.storageKeys.hebrewNumbering, JSON.stringify(useHebrewNumbering));

    // Update button text
    document.getElementById('toggleNumbering').textContent = useHebrewNumbering ? 'מספרים רגילים' : 'מספור עברי';

    // Update UI
    populateChapters(elements.bookSelect.value);
    loadChapterContent(elements.bookSelect.value, elements.chapterSelect.value);
}
/**
 * Hebrew to English book name mapping
 * @type {Object}
 */
const bookNameMapping = {
    'בראשית': 'Genesis',
    'שמות': 'Exodus',
    'ויקרא': 'Leviticus',
    'במדבר': 'Numbers',
    'דברים': 'Deuteronomy',
    // Add more books as needed
};

/**
 * Check if a verse has Rashi commentary
 * @param {string} book - Book name in Hebrew
 * @param {number} chapter - Chapter number
 * @param {number} verse - Verse number
 * @returns {boolean} True if verse has commentary
 */
function hasRashiCommentary(book, chapter, verse) {
    // Skip if rashi data isn't loaded
    if (!rashiData) return false;

    // Convert Hebrew book name to English
    const englishBookName = bookNameMapping[book];
    if (!englishBookName) return false;

    // Check if book exists in Rashi data
    if (!rashiData[englishBookName]) return false;

    // Sefaria data uses 0-based indexing
    const chapterIndex = parseInt(chapter) - 1;
    const verseIndex = parseInt(verse) - 1;

    // Verify that the chapter exists
    if (!rashiData[englishBookName][chapterIndex]) return false;

    // Verify that the verse exists
    if (!rashiData[englishBookName][chapterIndex][verseIndex]) return false;

    // Check if there are any commentaries for this verse
    return rashiData[englishBookName][chapterIndex][verseIndex].length > 0;
}

/**
 * Show Rashi commentary for a verse
 * @param {string} book - Book name in Hebrew
 * @param {number} chapter - Chapter number
 * @param {number} verse - Verse number
 */
function showRashiCommentary(book, chapter, verse) {
    // Clear previous content
    elements.rashiText.innerHTML = '';

    try {
        // Convert Hebrew book name to English
        const englishBookName = bookNameMapping[book];
        if (!englishBookName) {
            elements.rashiText.innerHTML = '<p>אין פירוש רש״י לספר זה</p>';
            showModal(elements.rashiModal);
            return;
        }

        // Check if book exists in Rashi data
        if (!rashiData[englishBookName]) {
            elements.rashiText.innerHTML = '<p>אין פירוש רש״י לספר זה</p>';
            showModal(elements.rashiModal);
            return;
        }

        // Sefaria data uses 0-based indexing
        const chapterIndex = parseInt(chapter) - 1;
        const verseIndex = parseInt(verse) - 1;

        // Check if the requested commentary exists
        if (!rashiData[englishBookName][chapterIndex] ||
            !rashiData[englishBookName][chapterIndex][verseIndex] ||
            rashiData[englishBookName][chapterIndex][verseIndex].length === 0) {

            elements.rashiText.innerHTML = '<p>אין פירוש רש״י לפסוק זה</p>';
            showModal(elements.rashiModal);
            return;
        }

        // Get the commentaries for this verse
        const commentaries = rashiData[englishBookName][chapterIndex][verseIndex];

        // Display verse reference
        const verseRef = document.createElement('div');
        verseRef.className = 'verse-reference';
        verseRef.innerHTML = `<strong>${book} ${formatNumber(chapter)}:${formatNumber(verse)}</strong>`;
        elements.rashiText.appendChild(verseRef);

        // Display each commentary
        commentaries.forEach((commentary, index) => {
            // Create a div for each commentary
            const commentaryDiv = document.createElement('div');
            commentaryDiv.className = 'rashi-commentary';
            commentaryDiv.innerHTML = commentary;

            // Add a separator between commentaries
            if (index < commentaries.length - 1) {
                const separator = document.createElement('hr');
                separator.className = 'commentary-separator';
                commentaryDiv.appendChild(separator);
            }

            elements.rashiText.appendChild(commentaryDiv);
        });

        // Add CSS to ensure bold text is properly displayed
        const style = document.createElement('style');
        style.textContent = `
            .rashi-commentary b {
                font-weight: 700;
                color: var(--accent-color);
            }
            .verse-reference {
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid var(--accent-color-light);
                color: var(--accent-color);
            }
            .commentary-separator {
                margin: 1rem 0;
                border: 0;
                border-top: 1px dashed var(--text-color-light);
                opacity: 0.3;
            }
        `;

        if (!document.getElementById('rashi-styles')) {
            style.id = 'rashi-styles';
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('Error displaying Rashi commentary:', error);
        elements.rashiText.innerHTML = '<p>שגיאה בטעינת פירוש רש״י</p>';
    }

    // Show the modal
    showModal(elements.rashiModal);
}
/**
 * Load content for selected book and chapter
 * @param {string} book - Book name
 * @param {number} chapter - Chapter number
 */
function loadChapterContent(book, chapter) {
    // Skip if data is missing
    if (!book || !chapter || !bibleData[book] || !bibleData[book][chapter - 1]) {
        return;
    }

    const verses = bibleData[book][chapter - 1];

    // Show loading indicator
    elements.contentDiv.innerHTML = '<div class="loading">טוען תוכן...</div>';

    // Build HTML for verses with a slight delay to show loading
    setTimeout(() => {
        elements.contentDiv.innerHTML = verses.map((verse, index) => {
            const verseNum = index + 1;
            const hasRashi = hasRashiCommentary(book, chapter, verseNum);

            return `
                <p class="verse ${hasRashi ? 'has-rashi' : ''}"
                   data-verse="${verseNum}"
                   data-book="${book}"
                   data-chapter="${chapter}">
                    <span class="verse-number">${formatNumber(verseNum)}</span>
                    ${verse}
                    ${hasRashi ? '<span class="rashi-indicator" title="פירוש רש״י">רש״י</span>' : ''}
                </p>
            `;
        }).join('');

        // Add click event listeners to verses with Rashi
        document.querySelectorAll('.has-rashi').forEach(verseElement => {
            verseElement.addEventListener('click', () => {
                const verseNum = verseElement.getAttribute('data-verse');
                const bookName = verseElement.getAttribute('data-book');
                const chapterNum = verseElement.getAttribute('data-chapter');
                showRashiCommentary(bookName, chapterNum, verseNum);
            });
        });

        // Store last visit in localStorage
        localStorage.setItem(config.storageKeys.lastVisit, JSON.stringify({ book, chapter }));

        // Update page title
        document.title = `${book} ${formatNumber(chapter)} | תנ״ך מקוון`;
    }, 100);
}

/**
 * Handle book selection change
 */
function handleBookSelection() {
    const selectedBook = elements.bookSelect.value;
    if (selectedBook) {
        populateChapters(selectedBook);
        loadChapterContent(selectedBook, 1); // Load first chapter by default
    }
}

/**
 * Handle chapter selection change
 */
function handleChapterSelection() {
    const selectedBook = elements.bookSelect.value;
    const selectedChapter = elements.chapterSelect.value;
    if (selectedBook && selectedChapter) {
        loadChapterContent(selectedBook, selectedChapter);
    }
}

/**
 * Navigate to previous chapter
 */
function navigateToPreviousChapter() {
    const currentBook = elements.bookSelect.value;
    let currentChapter = parseInt(elements.chapterSelect.value);

    if (currentChapter > 1) {
        // Go to previous chapter in same book
        currentChapter--;
        elements.chapterSelect.value = currentChapter;
        loadChapterContent(currentBook, currentChapter);
    } else {
        // TODO: Navigate to previous book, last chapter
        // This would require more implementation
    }
}

/**
 * Navigate to next chapter
 */
function navigateToNextChapter() {
    const currentBook = elements.bookSelect.value;
    let currentChapter = parseInt(elements.chapterSelect.value);
    const maxChapters = bibleData[currentBook].length;

    if (currentChapter < maxChapters) {
        // Go to next chapter in same book
        currentChapter++;
        elements.chapterSelect.value = currentChapter;
        loadChapterContent(currentBook, currentChapter);

        // Scroll to the top of the page with a smooth effect
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        // TODO: Navigate to next book, first chapter
        // This would require more implementation
    }
}

/**
 * Load last visited location
 */
function openLastVisit() {
    const { book, chapter } = lastVisit;
    if (bibleData[book]) {
        populateChapters(book);
        loadChapterContent(book, chapter);
    }
}

/**
 * Remove Nikud (diacritical marks) from Hebrew text
 * @param {string} text - Hebrew text with nikud
 * @returns {string} Hebrew text without nikud
 */
function removeNikud(text) {
    return text.replace(/[\u0591-\u05C7]/g, "");  // Unicode range for Hebrew Nikud
}

/**
 * Perform search across the Bible
 */
function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    const regex = new RegExp(removeNikud(query), 'gi');

    // Show loading indicator
    elements.contentDiv.innerHTML = '<div class="loading">מחפש...</div>';

    // Delay search slightly to show loading
    setTimeout(() => {
        let resultsHTML = '';
        let resultCount = 0;

        Object.keys(bibleData).forEach(book => {
            bibleData[book].forEach((chapter, chapterIndex) => {
                chapter.forEach((verse, verseIndex) => {
                    if (regex.test(removeNikud(verse))) {
                        // Check if verse has Rashi commentary
                        const hasRashi = hasRashiCommentary(book, chapterIndex + 1, verseIndex + 1);
                        resultCount++;

                        resultsHTML += `
                            <p class="verse ${hasRashi ? 'has-rashi' : ''}"
                               data-verse="${verseIndex + 1}"
                               data-book="${book}"
                               data-chapter="${chapterIndex + 1}">
                                <span class="verse-number">(${book} ${formatNumber(chapterIndex + 1)}:${formatNumber(verseIndex + 1)})</span>
                                ${verse.replace(regex, match => `<span class="highlight">${match}</span>`)}
                                ${hasRashi ? '<span class="rashi-indicator" title="פירוש רש״י">רש״י</span>' : ''}
                            </p>
                        `;
                    }
                });
            });
        });

        if (resultsHTML) {
            elements.contentDiv.innerHTML = `
                <div class="search-results-header">
                    <p>נמצאו ${resultCount} תוצאות עבור "${query}"</p>
                    <button id="clearSearch" class="clear-search">נקה חיפוש</button>
                </div>
                <div class="search-results">${resultsHTML}</div>
            `;

            // Add event listener to clear search button
            document.getElementById('clearSearch').addEventListener('click', () => {
                elements.searchInput.value = '';
                openLastVisit();
            });
        } else {
            elements.contentDiv.innerHTML = `
                <div class="no-results">
                    <p>לא נמצאו תוצאות עבור "${query}"</p>
                    <button id="clearSearch" class="clear-search">נקה חיפוש</button>
                </div>
            `;

            document.getElementById('clearSearch').addEventListener('click', () => {
                elements.searchInput.value = '';
                openLastVisit();
            });
        }

        // Add click event listeners to verses with Rashi
        document.querySelectorAll('.has-rashi').forEach(verseElement => {
            verseElement.addEventListener('click', () => {
                const verseNum = verseElement.getAttribute('data-verse');
                const bookName = verseElement.getAttribute('data-book');
                const chapterNum = verseElement.getAttribute('data-chapter');
                showRashiCommentary(bookName, chapterNum, verseNum);
            });
        });
    }, 300);
}