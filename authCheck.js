const fs = require("fs");
const path = require("path");

const BROWSER_DATA_DIR = path.join(__dirname, "browser-data");

/**
 * Basic check: persistent browser profile exists with a Cookies database.
 * The real session validation happens in submit.js (exit code 2 on expiry).
 */
function isAuthValid() {
  const cookiesFile = path.join(BROWSER_DATA_DIR, "Default", "Cookies");
  return fs.existsSync(cookiesFile);
}

module.exports = { isAuthValid };
