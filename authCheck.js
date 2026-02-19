const fs = require("fs");
const path = require("path");

// Always resolve relative to this script's directory (project root)
const AUTH_FILE = path.join(__dirname, "auth.json");
/** Consider session expired this many seconds before cookie expiry */
const BUFFER_SECONDS = 5 * 60;

/** Google session cookie names that indicate a valid login */
const SESSION_COOKIE_NAMES = new Set([
  "SID",
  "__Secure-1PSID",
  "__Secure-3PSID",
]);

/**
 * Returns true if auth.json exists and key Google session cookies are not expired.
 * @returns {boolean}
 */
function isAuthValid() {
  if (!fs.existsSync(AUTH_FILE)) return false;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"));
  } catch {
    return false;
  }

  const cookies = data.cookies;
  if (!Array.isArray(cookies) || cookies.length === 0) return false;

  const now = Date.now() / 1000;
  const cutoff = now + BUFFER_SECONDS;

  // Valid if at least one key session cookie has a future expiry
  for (const c of cookies) {
    if (
      SESSION_COOKIE_NAMES.has(c.name) &&
      typeof c.expires === "number" &&
      c.expires > cutoff
    ) {
      return true;
    }
  }

  return false;
}

module.exports = { isAuthValid };
