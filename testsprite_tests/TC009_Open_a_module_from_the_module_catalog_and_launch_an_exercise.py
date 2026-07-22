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
        
        # -> Fill the 'Email' field with the provided email, fill the 'Password' field with the provided password, then click the 'Log in' button to sign in.
        # you@school.edu email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tuanphuong@email.com")
        
        # -> Fill the 'Email' field with the provided email, fill the 'Password' field with the provided password, then click the 'Log in' button to sign in.
        # •••••••• password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123456")
        
        # -> Fill the 'Email' field with the provided email, fill the 'Password' field with the provided password, then click the 'Log in' button to sign in.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Modules' link in the top navigation to open the modules list page.
        # Modules link
        elem = page.get_by_role('link', name='Modules', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Everyday Conversations' module by clicking its module card on the Modules page.
        # Everyday Conversations beginner Real-life... link
        elem = page.locator('a[href="/modules/1"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Ordering at a cafe' exercise (the list item labeled '1. Ordering at a cafe') to start the exercise and load the exercise page.
        # ○ 1 . Ordering at a cafe speaking link
        elem = page.get_by_role('link', name='○ 1. Ordering at a cafe speaking', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the exercise page is displayed
        # Assert: The browser is on the exercise page /exercises/1.
        await expect(page).to_have_url(re.compile("/exercises/1"), timeout=15000), "The browser is on the exercise page /exercises/1."
        # Assert: The prompt label 'Your recording (paste an audio URL)' is visible on the exercise page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/label").nth(0)).to_have_text("Your recording (paste an audio URL)", timeout=15000), "The prompt label 'Your recording (paste an audio URL)' is visible on the exercise page."
        
        # --> Verify the exercise prompt is visible
        await page.locator("xpath=/html/body/div[2]/main/div/label").nth(0).scroll_into_view_if_needed()
        # Assert: The exercise prompt's recording label 'Your recording (paste an audio URL)' is visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/label").nth(0)).to_be_visible(timeout=15000), "The exercise prompt's recording label 'Your recording (paste an audio URL)' is visible."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    