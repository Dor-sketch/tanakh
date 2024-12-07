import json
import os
from pathlib import Path
from urllib.parse import quote

def load_bible_data(json_path):
    """Load the Bible data from JSON file."""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def number_to_hebrew_letters(num):
    """Convert number to Hebrew letters with correct quotation placement."""
    heb_chars = "אבגדהוזחטיכלמנסעפצקרשת"
    heb_tens = "יכלמנסעפצ"
    result = ""

    if num >= 1000:
        result = number_to_hebrew_letters(num // 1000) + "'"
        num %= 1000

    if num >= 100:
        result += heb_chars[num // 100 - 1]
        num %= 100

    if num >= 10:
        result += heb_tens[num // 10 - 1]
        num %= 10

    if num > 0:
        result += heb_chars[num - 1]

    # Special cases for 15 and 16
    result = result.replace('יה', 'טו').replace('יו', 'טז')

    # Insert quotation mark between characters for numbers 11-99
    if len(result) == 2:
        result = result[0] + '"' + result[1]
    elif len(result) > 2:
        result += '"'
    else:
        result += "'"

    return result

def get_navigation_urls(bible_data, current_book, current_chapter):
    """Generate navigation URLs for previous and next chapters."""
    books = list(bible_data.keys())
    current_book_index = books.index(current_book)
    total_chapters = len(bible_data[current_book])

    prev_url = next_url = "#"

    # Previous chapter
    if current_chapter > 1:
        prev_url = f"/tanakh/{quote(current_book)}/{current_chapter - 1}"
    elif current_book_index > 0:
        prev_book = books[current_book_index - 1]
        prev_chapter = len(bible_data[prev_book])
        prev_url = f"/tanakh/{quote(prev_book)}/{prev_chapter}"

    # Next chapter
    if current_chapter < total_chapters:
        next_url = f"/tanakh/{quote(current_book)}/{current_chapter + 1}"
    elif current_book_index < len(books) - 1:
        next_book = books[current_book_index + 1]
        next_url = f"/tanakh/{quote(next_book)}/1"

    return prev_url, next_url

def generate_chapter_html(book_name, chapter_num, verses, template, bible_data):
    """Generate HTML content for a specific chapter."""
    # Generate verse content
    chapter_content = '\n'.join([
        f'<p class="verse" data-verse="{i+1}">'
        f'<span class="verse-number">{number_to_hebrew_letters(i+1)}</span>'
        f'{verse}</p>'
        for i, verse in enumerate(verses)
    ])

    # Get navigation URLs
    prev_url, next_url = get_navigation_urls(bible_data, book_name, chapter_num)

    # Replace all placeholders in template
    replacements = {
        '{{BOOK_NAME}}': book_name,
        '{{CHAPTER_NUM}}': str(chapter_num),
        '{{CHAPTER_NUM_HEB}}': number_to_hebrew_letters(chapter_num),
        '{{CONTENT}}': chapter_content,
        '{{PREV_CHAPTER_URL}}': prev_url,
        '{{NEXT_CHAPTER_URL}}': next_url
    }

    html_content = template
    for key, value in replacements.items():
        html_content = html_content.replace(key, value)

    return html_content

def create_directory_structure(output_dir):
    """Create the necessary directory structure."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

def generate_sitemap(bible_data, output_dir):
    """Generate sitemap.xml for all chapters."""
    sitemap_content = ['<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    # Add home page
    sitemap_content.append("""
    <url>
        <loc>https://dorpascal.com/tanakh</loc>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
    </url>""")

    # Add book and chapter pages
    for book_name in bible_data.keys():
        # Add book main page
        sitemap_content.append(f"""
    <url>
        <loc>https://dorpascal.com/tanakh/{quote(book_name)}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>""")

        # Add chapter pages
        for chapter_num in range(1, len(bible_data[book_name]) + 1):
            sitemap_content.append(f"""
    <url>
        <loc>https://dorpascal.com/tanakh/{quote(book_name)}/{chapter_num}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>""")

    sitemap_content.append('</urlset>')

    # Write sitemap file
    sitemap_path = os.path.join(output_dir, 'sitemap.xml')
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sitemap_content))

    print(f'Generated sitemap.xml at {sitemap_path}')

def generate_robots_txt(output_dir):
    """Generate robots.txt file."""
    robots_content = """User-agent: *
Allow: /
Sitemap: https://dorpascal.com/sitemap.xml

# Crawl-delay for specific bots
User-agent: AhrefsBot
Crawl-delay: 5

User-agent: Baiduspider
Crawl-delay: 5

User-agent: SemrushBot
Crawl-delay: 5"""

    robots_path = os.path.join(output_dir, 'robots.txt')
    with open(robots_path, 'w', encoding='utf-8') as f:
        f.write(robots_content)

    print(f'Generated robots.txt at {robots_path}')

def generate_book_index_pages(bible_data, template_dir, output_dir):
    """Generate index pages for each book."""
    # Load book index template
    with open(os.path.join(template_dir, 'book_template.html'), 'r', encoding='utf-8') as f:
        book_template = f.read()

    for book_name, chapters in bible_data.items():
        # Generate chapter list
        chapter_links = '\n'.join([
            f'<li><a href="/tanakh/{quote(book_name)}/{i+1}">פרק {number_to_hebrew_letters(i+1)}</a></li>'
            for i in range(len(chapters))
        ])

        # Replace placeholders
        content = book_template.replace('{{BOOK_NAME}}', book_name)
        content = content.replace('{{CHAPTER_LIST}}', chapter_links)

        # Save the file
        book_dir = os.path.join(output_dir, book_name)
        Path(book_dir).mkdir(exist_ok=True)
        index_path = os.path.join(book_dir, 'index.html')

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f'Generated index page for {book_name}')

def main():
    # Load the template
    with open('template.html', 'r', encoding='utf-8') as f:
        template = f.read()

    # Load Bible data
    bible_data = load_bible_data('./docs/assets/full_bible.json')

    # Create output directory
    output_dir = './docs'
    create_directory_structure(output_dir)

    # Generate HTML files for each chapter
    for book_name, chapters in bible_data.items():
        book_dir = os.path.join(output_dir, book_name)
        Path(book_dir).mkdir(exist_ok=True)

        for chapter_num, verses in enumerate(chapters, 1):
            html_content = generate_chapter_html(
                book_name,
                chapter_num,
                verses,
                template,
                bible_data
            )

            # Save the file
            file_path = os.path.join(book_dir, f'chapter_{chapter_num}.html')
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(html_content)

            print(f'Generated {book_name} Chapter {chapter_num}')

    # Generate book index pages
    generate_book_index_pages(bible_data, '.', output_dir)

    # Generate sitemap.xml
    generate_sitemap(bible_data, output_dir)

    # Generate robots.txt
    generate_robots_txt(output_dir)

    print('\nGeneration complete! Generated files:')
    print(f'- HTML chapters in {output_dir}/')
    print(f'- Book index pages')
    print(f'- sitemap.xml')
    print(f'- robots.txt')

if __name__ == '__main__':
    main()