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
        
        # -> Fill the Email and Password fields with the provided credentials and click the 'Log in' button.
        # you@school.edu email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tuanphuong@email.com")
        
        # -> Fill the Email and Password fields with the provided credentials and click the 'Log in' button.
        # •••••••• password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123456")
        
        # -> Fill the Email and Password fields with the provided credentials and click the 'Log in' button.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the module catalog by clicking the 'Modules' link in the navigation bar so a writing exercise can be selected.
        # Modules link
        elem = page.get_by_role('link', name='Modules', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Academic Writing' module by clicking its module card to look for a writing exercise.
        # Academic Writing intermediate Essay structure... link
        elem = page.get_by_role('link', name='Academic Writing intermediate Essay structure, citations, formal register, transitions.', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Persuasive essay' writing exercise by clicking the 'Persuasive essay' item in the exercises list so the writing prompt and response field become visible.
        # ○ 2 . Persuasive essay writing link
        elem = page.get_by_role('link', name='○ 2. Persuasive essay writing', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Your response' textarea with a complete 5-paragraph persuasive essay arguing whether schools should require uniforms, then click the 'Submit' button.
        # Start typing… text area
        elem = page.get_by_placeholder('Start typing…', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Schools should require uniforms because they promote equality, reduce distraction, and enhance safety \u2014 creating a focused learning environment that benefits all students. Uniforms simplify daily choices and remove visible socioeconomic differences that can lead to exclusion or bullying. When students wear the same attire, attention shifts away from appearances and toward learning, which supports improved classroom behavior and fosters a sense of shared purpose.\n\nRequiring uniforms helps reduce socioeconomic stress among students. Clothing can become an overt marker of family income, putting pressure on students to match rapidly changing fashion trends. Uniforms level this aspect of the playing field by limiting visible differences that often translate into teasing or marginalization. As a result, schools that implement uniform policies tend to see fewer incidents of clothing-based bullying and an improved overall atmosphere of mutual respect.\n\nUniforms also reduce distraction and decision fatigue. Each morning, students face choices about what to wear; for some, this becomes a stressor that detracts from mental preparation for school. With uniforms, students and families save time and avoid conflicts over attire, enabling students to focus their mental energy on academic tasks. Teachers report fewer disruptions related to inappropriate or attention-seeking clothing, which allows lessons to proceed more smoothly and efficiently.\n\nSafety and identification are additional practical benefits. Uniforms make it easier for school staff to spot intruders or unauthorized visitors on campus and help identify students quickly during field trips or emergencies. Moreover, uniforms can be more cost-effective over time: while the initial purchase is an expense, families often find that uniforms reduce overall clothing costs because daily wardrobes need fewer trend-driven pieces. Wearing standardized clothing also introduces students to expectations around dress codes and professional appearance, preparing them for future workplaces where similar expectations may apply.\n\nIn conclusion, requiring school uniforms supports equality, reduces distractions, and improves safety and school community cohesion. While respecting individual expression is important, uniforms provide a fair and practical framework that helps students concentrate on learning and fosters a respectful, secure environment. For these reasons, schools should adopt uniform policies thoughtfully and with input from students and families.")
        
        # -> Fill the 'Your response' textarea with a complete 5-paragraph persuasive essay arguing whether schools should require uniforms, then click the 'Submit' button.
        # Submit button
        elem = page.get_by_role('button', name='Submit', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Submissions' link in the site navigation to open the Submissions page and check for the new submission and its status.
        # Submissions link
        elem = page.get_by_role('link', name='Submissions', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify awaiting-review status is shown
        # Assert: Expected the submission's status to read 'Awaiting review'.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/button[3]").nth(0)).to_have_text("Awaiting review", timeout=15000), "Expected the submission's status to read 'Awaiting review'."
        # Assert: Verify the new submission is listed
        assert False, "Expected: Verify the new submission is listed (could not be verified on the page)"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    