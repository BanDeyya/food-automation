require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { spawnSync } = require("child_process");
const path = require("path");
const { isAuthValid } = require("./authCheck");

const LOGIN_SCRIPT = path.join(__dirname, "login.js");
const SUBMIT_SCRIPT = path.join(__dirname, "submit.js");

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
  if (!isAuthValid()) {
    console.log("Google login expired or missing. Opening browser for you to log in...");
    runScript(LOGIN_SCRIPT);
    console.log("Login finished. Running submit form...");
  }

  console.log("Running submit form...");
  runScript(SUBMIT_SCRIPT);
})();
