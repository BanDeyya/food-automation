require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { spawnSync } = require("child_process");
const path = require("path");
const { isAuthValid } = require("./authCheck");

const LOGIN_SCRIPT = path.join(__dirname, "login.js");
const SUBMIT_SCRIPT = path.join(__dirname, "submit.js");
const COLORS = {
  info: "\x1b[36m",
  success: "\x1b[32m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

function runScript(scriptPath) {
  const r = spawnSync(process.execPath, [scriptPath], {
    stdio: "inherit",
    cwd: __dirname,
  });
  if (r.error) {
    console.error(`${COLORS.error}Failed to start script ${scriptPath}:`, r.error, `${COLORS.reset}`);
    return 1;
  }
  return r.status ?? 1;
}

(function main() {
  if (!isAuthValid()) {
    console.log(
      `${COLORS.info}No login session found. Opening browser for you to log in...${COLORS.reset}`,
    );
    const loginStatus = runScript(LOGIN_SCRIPT);
    if (loginStatus !== 0) process.exit(loginStatus);
  }

  console.log(`${COLORS.info}Running submit form...${COLORS.reset}`);
  const submitStatus = runScript(SUBMIT_SCRIPT);

  if (submitStatus === 2) {
    console.log(
      `${COLORS.info}Session expired. Opening browser for you to log in...${COLORS.reset}`,
    );
    const loginStatus = runScript(LOGIN_SCRIPT);
    if (loginStatus !== 0) process.exit(loginStatus);

    console.log(`${COLORS.info}Retrying submission...${COLORS.reset}`);
    const retryStatus = runScript(SUBMIT_SCRIPT);
    if (retryStatus !== 0) process.exit(retryStatus);
  } else if (submitStatus !== 0) {
    process.exit(submitStatus);
  }
})();
