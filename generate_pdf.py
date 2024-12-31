import asyncio
from playwright.async_api import async_playwright
import os

async def html_to_pdf(input_html_path, output_pdf_path):
    """Convert HTML to PDF using Playwright"""
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Create file URL
        file_url = f'file://{os.path.abspath(input_html_path)}'

        # Go to the HTML file
        await page.goto(file_url)

        # Wait for content to load
        await page.wait_for_load_state('networkidle')

        # Generate PDF
        await page.pdf(
            path=output_pdf_path,
            format='A4',
            margin={'top': '20mm', 'right': '20mm', 'bottom': '20mm', 'left': '20mm'},
            print_background=True
        )

        # Close browser
        await browser.close()

        print(f"Successfully created PDF at: {output_pdf_path}")

def convert_to_pdf(input_html_path, output_pdf_path):
    """Wrapper to run the async function"""
    asyncio.run(html_to_pdf(input_html_path, output_pdf_path))

if __name__ == "__main__":
    input_path = "/Users/dorpascal/projects.nosync/tanakh/docs/assets/hebrew_bible.html"
    output_dir = os.path.dirname(input_path)
    output_path = os.path.join(output_dir, "hebrew_bible.pdf")

    try:
        convert_to_pdf(input_path, output_path)
    except Exception as e:
        print(f"Error: {str(e)}")
        print("\nTip: Make sure the HTML file exists at the specified path.")