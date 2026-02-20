require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { chromium } = require("playwright");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "lastSubmission.json");
const BROWSER_DATA_DIR = path.join(__dirname, "browser-data");
const SUBMIT_FORM_URL = process.env.SUBMIT_FORM_URL;
const USER_EMAIL = process.env.USER_EMAIL;
const FOOD_CHOICE = process.env.FOOD_CHOICE || "Nonveg";

const IST_OFFSET_MINUTES = 5 * 60 + 30; // 5:30 for IST

function nowIST() {
  return dayjs().utcOffset(IST_OFFSET_MINUTES);
}

function alreadySubmittedToday() {
  if (!fs.existsSync(STATE_FILE)) return false;

  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8").trim();
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data.date === nowIST().format("YYYY-MM-DD");
  } catch {
    return false;
  }
}

function markSubmitted() {
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ date: nowIST().format("YYYY-MM-DD") }),
  );
}

async function submitForm() {
  if (alreadySubmittedToday()) {
    console.log("Already submitted today.");
    return;
  }

  const now = nowIST();
  const hour = now.hour();

  // Only allow 2 PM–6 PM IST (14:00 to 17:59)
  if (hour < 14 || hour >= 18) {
    console.log("Not within allowed time window (2–6 PM IST).");
    return;
  }

  if (!SUBMIT_FORM_URL || !USER_EMAIL) {
    console.error("Missing SUBMIT_FORM_URL or USER_EMAIL in .env");
    return;
  }

  const context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
    headless: false,
    slowMo: 600,
  });

  try {
    const page = context.pages()[0] || (await context.newPage());
    await page.goto(SUBMIT_FORM_URL);

    const emailPattern = new RegExp(
      "Record " + USER_EMAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    // Wait for the form checkbox — if it doesn't appear, session likely expired
    const formLoaded = await page
      .getByRole("checkbox", { name: emailPattern })
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (!formLoaded) {
      console.error(
        "Form did not load — session may have expired. Re-login needed.",
      );
      process.exit(2);
    }

    // checkbox
    await page.getByRole("checkbox", { name: emailPattern }).click();

    // open dropdown
    const dropdown = page.getByRole("listbox");
    await dropdown.click();

    // wait for Yes option to be visible
    const yesOption = page.getByRole("option", { name: "Yes" });
    await yesOption.waitFor({ state: "visible" });

    // click Yes
    await yesOption.click();

    // radio
    await page.getByRole("radio", { name: FOOD_CHOICE }).click();

    // submit
    await page.getByRole("button", { name: /submit/i }).click();

    // wait for confirmation
    await page.getByText(/response has been recorded/i).waitFor();

    markSubmitted();
    console.log("Form submitted successfully.");
  } finally {
    await context.close();
  }
}

submitForm();
