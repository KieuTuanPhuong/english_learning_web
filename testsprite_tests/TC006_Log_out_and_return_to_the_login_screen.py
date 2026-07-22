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
        
        # -> input
        # you@school.edu email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tuanphuong@email.com")
        
        # -> input
        # •••••••• password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123456")
        
        # -> click
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the profile page by clicking the 'Me' tab in the bottom navigation to access the logout control.
        # Me link
        elem = page.get_by_role('link', name='Me', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Log out' button on the profile page to sign out and return to the login screen.
        # Log out button
        elem = page.get_by_role('button', name='Log out', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the login screen is displayed
        # Assert: The browser is on the /login page.
        await expect(page).to_have_url(re.compile("/login"), timeout=15000), "The browser is on the /login page."
        await page.locator("xpath=/html/body/div[3]/div/form/label[1]/input").nth(0).scroll_into_view_if_needed()
        # Assert: The Email input is visible on the login screen.
        await expect(page.locator("xpath=/html/body/div[3]/div/form/label[1]/input").nth(0)).to_be_visible(timeout=15000), "The Email input is visible on the login screen."
        await page.locator("xpath=/html/body/div[3]/div/form/label[2]/input").nth(0).scroll_into_view_if_needed()
        # Assert: The Password input is visible on the login screen.
        await expect(page.locator("xpath=/html/body/div[3]/div/form/label[2]/input").nth(0)).to_be_visible(timeout=15000), "The Password input is visible on the login screen."
        await page.locator("xpath=/html/body/div[3]/div/form/button").nth(0).scroll_into_view_if_needed()
        # Assert: The Log in button is visible on the login screen.
        await expect(page.locator("xpath=/html/body/div[3]/div/form/button").nth(0)).to_be_visible(timeout=15000), "The Log in button is visible on the login screen."
        
        # --> Verify the user is signed out
        # Assert: The browser is on the login page (URL contains /login).
        await expect(page).to_have_url(re.compile("/login"), timeout=15000), "The browser is on the login page (URL contains /login)."
        # Assert: The Email label is present on the login form.
        await expect(page.locator("xpath=/html/body/div[3]/div/form/label[1]").nth(0)).to_have_text("Email", timeout=15000), "The Email label is present on the login form."
        # Assert: The Log in button is visible on the login form.
        await expect(page.locator("xpath=/html/body/div[3]/div/form/button").nth(0)).to_have_text("Log in", timeout=15000), "The Log in button is visible on the login form."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    