import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT=Path('.lovable/verification')
async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True)
    page=await browser.new_page(viewport={'width':1280,'height':1800})
    await page.goto('http://localhost:8080', wait_until='networkidle')
    await page.screenshot(path=str(OUT/'desktop.png'))
    await page.get_by_role('button', name='Launch Demo').first.click()
    await page.wait_for_timeout(2200)
    await page.locator('#map').screenshot(path=str(OUT/'map.png'))
    await page.locator('#calendar').scroll_into_view_if_needed()
    await page.wait_for_timeout(400)
    await page.locator('#calendar').screenshot(path=str(OUT/'calendar.png'))
    await browser.close()
asyncio.run(main())
