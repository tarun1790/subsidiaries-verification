import asyncio
from playwright.async_api import async_playwright
import os
import sys

# Fix for Windows loop policy
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

async def generate_pdf():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        html_path = f"file:///{current_dir}/documentation.html".replace("\\", "/")
        
        await page.goto(html_path, wait_until="networkidle")
        
        # Wait for Mermaid JS to render the mindmap
        await page.wait_for_timeout(2000)
        
        pdf_path = os.path.join(current_dir, "Subsidiaries_Verification_AI_Documentation.pdf")
        await page.pdf(
            path=pdf_path,
            format="A4",
            print_background=True,
            margin={"top": "20mm", "bottom": "20mm", "left": "20mm", "right": "20mm"}
        )
        await browser.close()
        print(f"PDF successfully generated at: {pdf_path}")

if __name__ == "__main__":
    asyncio.run(generate_pdf())
