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
        
        # -> Fill the Email field with the student's email, fill the Password field with the student's password, then click the 'Log in' button to submit the form.
        # you@school.edu email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tuanphuong@email.com")
        
        # -> Fill the Email field with the student's email, fill the Password field with the student's password, then click the 'Log in' button to submit the form.
        # •••••••• password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123456")
        
        # -> Fill the Email field with the student's email, fill the Password field with the student's password, then click the 'Log in' button to submit the form.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Modules' link in the top/bottom navigation to open the module catalog and view the module list.
        # Modules link
        elem = page.get_by_role('link', name='Modules', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Everyday Conversations' module by clicking its module card to view the module overview and exercises.
        # Everyday Conversations beginner Real-life... link
        elem = page.locator('a[href="/modules/1"]')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the module overview is displayed
        # Assert: The page URL contains /modules/1, confirming the module page is open.
        await expect(page).to_have_url(re.compile("/modules/1"), timeout=15000), "The page URL contains /modules/1, confirming the module page is open."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The first exercise 'Ordering at a cafe' is visible on the module page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[1]").nth(0)).to_be_visible(timeout=15000), "The first exercise 'Ordering at a cafe' is visible on the module page."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The second exercise 'Asking for directions' is visible on the module page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[2]").nth(0)).to_be_visible(timeout=15000), "The second exercise 'Asking for directions' is visible on the module page."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[3]").nth(0).scroll_into_view_if_needed()
        # Assert: The third exercise 'Greetings quiz' is visible on the module page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[3]").nth(0)).to_be_visible(timeout=15000), "The third exercise 'Greetings quiz' is visible on the module page."
        
        # --> Verify the exercise list is displayed
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Ordering at a cafe' exercise is visible in the exercise list.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[1]").nth(0)).to_be_visible(timeout=15000), "The 'Ordering at a cafe' exercise is visible in the exercise list."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Asking for directions' exercise is visible in the exercise list.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[2]").nth(0)).to_be_visible(timeout=15000), "The 'Asking for directions' exercise is visible in the exercise list."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[3]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Greetings quiz' exercise is visible in the exercise list.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[3]").nth(0)).to_be_visible(timeout=15000), "The 'Greetings quiz' exercise is visible in the exercise list."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    