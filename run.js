require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const fs = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");
const { isAuthValid } = require("./authCheck");

const LOGIN_SCRIPT = path.join(__dirname, "login.js");
const SUBMIT_SCRIPT = path.join(__dirname, "submit.js");
const AUTH_FILE = path.join(__dirname, "auth.json");
const STATE_FILE = path.join(__dirname, "lastSubmission.json");

/** Create auth.json and lastSubmission.json with minimal content if missing (first run). */
function ensureAppFiles() {
  if (!fs.existsSync(AUTH_FILE)) {
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }), "utf8");
  }
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({}), "utf8");
  }
}

function runScript(scriptPath) {
  const r = spawnSync("node", [scriptPath], {
    stdio: "inherit",
    cwd: __dirname,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

(function main() {
  ensureAppFiles();

  if (!isAuthValid()) {
    console.log("Google login expired or missing. Opening browser for you to log in...");
    runScript(LOGIN_SCRIPT);
    console.log("Login finished. Running submit form...");
  }

  console.log("Running submit form...");
  runScript(SUBMIT_SCRIPT);
})();
