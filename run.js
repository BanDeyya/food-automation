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
  return r.status ?? 1;
}

(function main() {
  if (!isAuthValid()) {
    console.log(
      "No login session found. Opening browser for you to log in...",
    );
    const loginStatus = runScript(LOGIN_SCRIPT);
    if (loginStatus !== 0) process.exit(loginStatus);
  }

  console.log("Running submit form...");
  const submitStatus = runScript(SUBMIT_SCRIPT);

  if (submitStatus === 2) {
    console.log("Session expired. Opening browser for you to log in...");
    const loginStatus = runScript(LOGIN_SCRIPT);
    if (loginStatus !== 0) process.exit(loginStatus);

    console.log("Retrying submission...");
    const retryStatus = runScript(SUBMIT_SCRIPT);
    if (retryStatus !== 0) process.exit(retryStatus);
  } else if (submitStatus !== 0) {
    process.exit(submitStatus);
  }
})();
