/**
 * Run at login/wake: if it's a weekday, 2–6 PM IST, and we haven't submitted
 * today, run the main script (so missed 2 PM runs get caught when laptop opens).
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const IST_OFFSET_MINUTES = 5 * 60 + 30; // 5:30
const STATE_FILE = path.join(__dirname, "lastSubmission.json");

function nowIST() {
  return dayjs().utcOffset(IST_OFFSET_MINUTES);
}

function alreadySubmittedToday() {
  if (!fs.existsSync(STATE_FILE)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return data.date === nowIST().format("YYYY-MM-DD");
  } catch {
    return false;
  }
}

function shouldRunCatchUp() {
  const now = nowIST();
  const weekday = now.day(); // 0 Sun, 1 Mon, ..., 5 Fri, 6 Sat
  const hour = now.hour();

  if (weekday === 0 || weekday === 6) return false; // weekend
  if (hour < 14 || hour >= 18) return false; // outside 2 PM–6 PM IST
  if (alreadySubmittedToday()) return false;

  return true;
}

(function main() {
  if (!shouldRunCatchUp()) process.exit(0);

  const runPath = path.join(__dirname, "run.js");
  const r = spawnSync("node", [runPath], {
    stdio: "inherit",
    cwd: __dirname,
  });
  process.exit(r.status ?? 0);
})();
