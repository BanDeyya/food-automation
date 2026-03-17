require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { chromium } = require("playwright");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const fs = require("fs");
const path = require("path");
const { notify } = require("./notify");

const STATE_FILE = path.join(__dirname, "lastSubmission.json");
const BROWSER_DATA_DIR = path.join(__dirname, "browser-data");
const SUBMIT_FORM_URL = process.env.SUBMIT_FORM_URL;
const USER_EMAIL = process.env.USER_EMAIL;
const FOOD_CHOICE = process.env.FOOD_CHOICE || "Nonveg";

const IST_OFFSET_MINUTES = 5 * 60 + 30; // 5:30 for IST
const COLORS = {
  info: "\x1b[36m",
  success: "\x1b[32m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

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
  const today = nowIST().format("YYYY-MM-DD");

  if (alreadySubmittedToday()) {
    await notify(`Skipped — already submitted today (${today})`);
    console.log(`${COLORS.info}Already submitted today.${COLORS.reset}`);
    return;
  }

  const now = nowIST();
  const hour = now.hour();
  const minute = now.minute();

  // Only allow 12:30 PM–6:30 PM IST
  const beforeStart = hour < 12 || (hour === 12 && minute < 30);
  const afterEnd = hour > 18 || (hour === 18 && minute > 30);
  if (beforeStart || afterEnd) {
    await notify(
      `Skipped — outside 12:30–6:30 PM IST window (${now.format("HH:mm")})`,
    );
    console.log(
      `${COLORS.info}Not within allowed time window (12:30–6:30 PM IST).${COLORS.reset}`,
    );
    return;
  }

  if (!SUBMIT_FORM_URL || !USER_EMAIL) {
    await notify("Error — missing SUBMIT_FORM_URL or USER_EMAIL in .env");
    console.error(
      `${COLORS.error}Missing SUBMIT_FORM_URL or USER_EMAIL in .env${COLORS.reset}`,
    );
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
      console.log(
        `${COLORS.info}[notify] Sending session-expired notification...${COLORS.reset}`,
      );
      await notify(`Session expired — re-login needed (${today})`);
      console.log(
        `${COLORS.info}[notify] Session-expired notification sent.${COLORS.reset}`,
      );
      console.error(
        `${COLORS.error}Form did not load — session may have expired. Re-login needed.${COLORS.reset}`,
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
    console.log(
      `${COLORS.info}[notify] Sending success notification...${COLORS.reset}`,
    );
    await notify(`Submitted: ${FOOD_CHOICE} on ${today}`);
    console.log(
      `${COLORS.success}Form submitted successfully. Notification sent.${COLORS.reset}`,
    );
  } catch (err) {
    console.log(
      `${COLORS.info}[notify] Sending failure notification...${COLORS.reset}`,
    );
    await notify(`Failed — ${err.message}`);
    console.log(
      `${COLORS.error}Failure notification sent.${COLORS.reset}`,
    );
    throw err;
  } finally {
    await context.close();
  }
}

submitForm();
