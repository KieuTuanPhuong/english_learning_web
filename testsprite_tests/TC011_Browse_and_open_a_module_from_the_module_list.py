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
        
        # -> Fill the Email field with the student's email, fill the Password field with the provided password, and click the 'Log in' button.
        # you@school.edu email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tuanphuong@email.com")
        
        # -> Fill the Email field with the student's email, fill the Password field with the provided password, and click the 'Log in' button.
        # •••••••• password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123456")
        
        # -> Fill the Email field with the student's email, fill the Password field with the provided password, and click the 'Log in' button.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Modules' navigation link to open the Modules page and then verify the modules list appears.
        # Modules link
        elem = page.get_by_role('link', name='Modules', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type 'IELTS' into the 'Search modules…' field, submit the search, apply the 'Advanced' difficulty filter, then open the 'IELTS Mastery' module card to view its detail page and exercise list.
        # Search modules… text field
        elem = page.get_by_placeholder('Search modules…', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("IELTS")
        
        # -> Type 'IELTS' into the 'Search modules…' field, submit the search, apply the 'Advanced' difficulty filter, then open the 'IELTS Mastery' module card to view its detail page and exercise list.
        # advanced button
        elem = page.get_by_role('button', name='advanced', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type 'IELTS' into the 'Search modules…' field, submit the search, apply the 'Advanced' difficulty filter, then open the 'IELTS Mastery' module card to view its detail page and exercise list.
        # IELTS Mastery advanced Full IELTS prep: Reading... link
        elem = page.get_by_role('link', name='IELTS Mastery advanced Full IELTS prep: Reading, Writing, Listening, Speaking strategies.', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the module overview and exercise list are displayed
        # Assert: The exercise 'IELTS Writing Task 2' is shown in the module's exercise list.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[1]").nth(0)).to_contain_text("IELTS Writing Task 2", timeout=15000), "The exercise 'IELTS Writing Task 2' is shown in the module's exercise list."
        # Assert: The exercise 'IELTS Speaking Part 2' is shown in the module's exercise list.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[2]").nth(0)).to_contain_text("IELTS Speaking Part 2", timeout=15000), "The exercise 'IELTS Speaking Part 2' is shown in the module's exercise list."
        # Assert: The exercise 'IELTS vocabulary quiz' is shown in the module's exercise list.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[3]").nth(0)).to_contain_text("IELTS vocabulary quiz", timeout=15000), "The exercise 'IELTS vocabulary quiz' is shown in the module's exercise list."
        # Assert: The exercise 'IELTS Writing Task 1' is shown in the module's exercise list.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/a[4]").nth(0)).to_contain_text("IELTS Writing Task 1", timeout=15000), "The exercise 'IELTS Writing Task 1' is shown in the module's exercise list."
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
    