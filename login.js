require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { chromium } = require("playwright");
const path = require("path");

const BROWSER_DATA_DIR = path.join(__dirname, "browser-data");
const LOGIN_FORM_URL = process.env.LOGIN_FORM_URL;

const SESSION_COOKIES = ["SID", "__Secure-1PSID", "__Secure-3PSID"];
const LOGIN_TIMEOUT_MS = 2 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;

async function waitForGoogleLogin(context) {
  const start = Date.now();
  while (Date.now() - start < LOGIN_TIMEOUT_MS) {
    const cookies = await context.cookies("https://google.com");
    const hasSession = SESSION_COOKIES.some((name) =>
      cookies.find((c) => c.name === name && c.value),
    );
    if (hasSession) return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

(async () => {
  if (!LOGIN_FORM_URL) {
    console.error("Missing LOGIN_FORM_URL in .env");
    process.exit(1);
  }

  const context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
    headless: false,
  });

  try {
    const page = context.pages()[0] || (await context.newPage());
    await page.goto(LOGIN_FORM_URL);

    console.log("Please login in the browser window. Waiting up to 2 minutes...");

    const loggedIn = await waitForGoogleLogin(context);
    if (loggedIn) {
      console.log("Login detected. Session saved to browser-data/.");
    } else {
      console.error("Login timed out after 2 minutes.");
      process.exit(1);
    }
  } finally {
    await context.close();
  }
  process.exit(0);
})();
