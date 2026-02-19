require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { chromium } = require("playwright");
const path = require("path");

const AUTH_FILE = path.join(__dirname, "auth.json");
const LOGIN_FORM_URL = process.env.LOGIN_FORM_URL;

(async () => {
  if (!LOGIN_FORM_URL) {
    console.error("Missing LOGIN_FORM_URL in .env");
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(LOGIN_FORM_URL);

    console.log("Login manually within 60 seconds...");

    await page.waitForTimeout(60000);

    await context.storageState({ path: AUTH_FILE });
    console.log("Login saved to auth.json.");
  } finally {
    if (browser) await browser.close();
  }
  process.exit(0);
})();