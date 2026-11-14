import asyncio
from playwright.async_api import async_playwright

async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True)
    page=await browser.new_page(viewport={'width':393,'height':852})
    errors=[]
    page.on('console', lambda msg: errors.append(msg.text) if msg.type=='error' else None)
    await page.goto('http://localhost:8080', wait_until='networkidle')
    await page.get_by_role('button', name='Toggle menu').click()
    await page.get_by_role('link', name='Fire Map').click()
    await page.get_by_role('button', name='VIIRS', exact=True).click()
    await page.get_by_role('button', name='Rectangle').click()
    await page.locator('input[type="date"]').fill('2026-09-12')
    await page.locator('#comparison').scroll_into_view_if_needed()
    await page.get_by_role('button', name='Harmonized', exact=True).click()
    await page.locator('#calendar').scroll_into_view_if_needed()
    await page.get_by_role('button', name='Sep 2026').click()
    overflow=await page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
    print({'errors': errors, 'overflow': overflow, 'title': await page.title()})
    await browser.close()
asyncio.run(main())
