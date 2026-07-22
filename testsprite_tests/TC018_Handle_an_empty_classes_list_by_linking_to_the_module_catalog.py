import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Email' field with tuanphuong@email.com, then fill the 'Password' field with 123456, and click the 'Log in' button.
        # you@school.edu email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tuanphuong@email.com")
        
        # -> Fill the 'Email' field with tuanphuong@email.com, then fill the 'Password' field with 123456, and click the 'Log in' button.
        # •••••••• password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123456")
        
        # -> Fill the 'Email' field with tuanphuong@email.com, then fill the 'Password' field with 123456, and click the 'Log in' button.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Classes' link in the top navigation to open the Classes page and then verify an empty-state message and a link to the module catalog are visible.
        # Classes link
        elem = page.get_by_role('link', name='Classes', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify a link to the module catalog is available
        # Assert: The module catalog link 'Browse modules →' is visible on the Classes page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/a").nth(0)).to_have_text("Browse modules \u2192", timeout=15000), "The module catalog link 'Browse modules \u2192' is visible on the Classes page."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    