# Setup guide (from clone to daily 2 PM run on Mac)

Use this if you’ve just cloned the repo and want to run it on your Mac like the original author. All steps use Terminal.

---

## 1. Prerequisites

- **Node.js** (v18 or newer). Check:
  ```bash
  node -v
  ```
  If missing, install from [nodejs.org](https://nodejs.org/) or with Homebrew: `brew install node`

- **pnpm**. Install if you don’t have it:
  ```bash
  npm install -g pnpm
  ```

---

## 2. Clone and go into the project

```bash
# If you haven’t cloned yet (replace with your repo URL):
git clone <repo-url> food-automation
cd food-automation
```

If you already cloned and are in another folder:

```bash
cd /path/to/food-automation
```

Use the **full path** to your project (e.g. `~/projects/food-automation` or `/Users/yourname/food-automation`). You’ll need this path later for cron and the Launch Agent.

---

## 3. Install dependencies

```bash
pnpm install
```

Install the browser used by the script (Chromium):

```bash
npx playwright install chromium
```

---

## 4. Create your `.env` file

The repo has no `.env` (it’s gitignored). Copy the example and edit it with your values:

```bash
cp .env.example .env
```

Edit `.env` (replace URLs and email with your own):

```bash
nano .env
```

Or open in your editor:

```bash
open -e .env
```

Set at least:

- `LOGIN_FORM_URL` – Google form URL where you sign in (same form as the one you’ll submit).
- `SUBMIT_FORM_URL` – Full URL of the food submission form (e.g. `https://docs.google.com/forms/d/e/.../viewform`).
- `USER_EMAIL` – Your email (must match the “Record your@email.com” option in the form).
- `FOOD_CHOICE` – Exact label of the food option, e.g. `Nonveg` or `Veg`.

Save and close (in nano: Ctrl+O, Enter, Ctrl+X).

---

## 5. First-time Google login

The script needs a saved Google session. Run the login script once; a browser will open. Sign in when prompted, then wait for it to finish (it saves to `auth.json`):

```bash
pnpm run login
```

When the browser closes and you see “Login saved to auth.json.” you’re done.

---

## 6. Test the full flow

Run the main script (checks auth, then submits the form if it’s 2–6 PM IST on a weekday and you haven’t submitted today):

```bash
pnpm start
```

If it’s outside 2–6 PM IST or already submitted today, it will say so and exit. Otherwise it should open the form and submit. If that works, you’re ready to schedule it.

---

## 7. Schedule daily run at 2 PM IST (Mon–Fri) with cron

Cron runs the script at **2:00 PM IST, Monday–Friday**. On macOS, cron uses your **system’s local time**, so use 2 PM in that time (e.g. `0 14` when your Mac is set to India). You need the **full path** to the project and to `node`.

**7.1 – Get paths**

```bash
# Your project folder (use the path it prints):
pwd

# Path to node (use this in the cron line below):
which node
```

**7.2 – Open your crontab**

```bash
crontab -e
```

Pick an editor if asked (e.g. nano).

**7.3 – Add one line**

Add this single line, then replace:

- `FULL_PATH_TO_PROJECT` → output of `pwd` (e.g. `/Users/yourname/food-automation`)
- `FULL_PATH_TO_NODE` → output of `which node` (e.g. `/opt/homebrew/bin/node`)

Use **2 PM local time** (if Mac is set to India, that’s 14:00):

```cron
0 14 * * 1-5 cd FULL_PATH_TO_PROJECT && FULL_PATH_TO_NODE run.js
```

Example (yours will differ):

```cron
0 14 * * 1-5 cd /Users/yourname/food-automation && /opt/homebrew/bin/node run.js
```

Save and exit (nano: Ctrl+O, Enter, Ctrl+X).

**7.4 – Check it’s installed**

```bash
crontab -l
```

You should see your line. The job will run at 2 PM IST on weekdays when the Mac is on (and ideally awake).

---

## 8. (Optional) Catch-up when laptop was closed at 2 PM

If the Mac was **asleep at 2 PM**, cron won’t run. You can run a small “catch-up” at **login** so that if you open the laptop before 6 PM IST on a weekday and haven’t submitted today, it runs the script once.

**8.1 – Copy the plist into LaunchAgents**

```bash
cp /FULL_PATH_TO_PROJECT/com.food-automation.catchup.plist ~/Library/LaunchAgents/
```

Use the same full project path as in step 7 (e.g. `/Users/yourname/food-automation`).

**8.2 – Edit the plist with your paths**

```bash
nano ~/Library/LaunchAgents/com.food-automation.catchup.plist
```

Replace:

- Every `/Users/priyanshubaranwal/personal-repo/food-automation` with **your** full project path.
- `/opt/homebrew/bin/node` with the output of `which node` (if different on your Mac).

Save and exit.

**8.3 – Load the agent**

```bash
launchctl load ~/Library/LaunchAgents/com.food-automation.catchup.plist
```

**8.4 – Confirm it’s loaded**

```bash
launchctl list | grep food-automation
```

You should see `com.food-automation.catchup`. After that, each time you log in, if it’s a weekday, 2–6 PM IST, and you haven’t submitted today, it will run the script once.

---

## 9. Quick reference – all commands in order

Assumes project path is `~/food-automation` and you’re in your home folder. Replace paths if yours differ.

```bash
# Clone (if needed)
git clone <repo-url> food-automation
cd food-automation

# Dependencies
pnpm install
npx playwright install chromium

# Config
cp .env.example .env
nano .env
# (fill LOGIN_FORM_URL, SUBMIT_FORM_URL, USER_EMAIL, FOOD_CHOICE)

# First-time login
pnpm run login

# Test
pnpm start

# Cron (after: pwd + which node)
crontab -e
# Add: 0 14 * * 1-5 cd /Users/YOUR_USERNAME/food-automation && /path/from/which/node run.js

# Optional catch-up agent
cp /Users/YOUR_USERNAME/food-automation/com.food-automation.catchup.plist ~/Library/LaunchAgents/
nano ~/Library/LaunchAgents/com.food-automation.catchup.plist
# (set your project path and node path)
launchctl load ~/Library/LaunchAgents/com.food-automation.catchup.plist
```

---

## 10. Troubleshooting

- **“Missing LOGIN_FORM_URL / SUBMIT_FORM_URL / USER_EMAIL”**  
  Create `.env` from `.env.example` and set those variables (see step 4).

- **“Google login expired or missing”**  
  Run `pnpm run login` again and sign in in the browser.

- **Cron doesn’t seem to run**  
  Cron only runs when the Mac is on (and usually awake). Use full paths in the cron line (`which node` and `pwd`). Check logs: `cat ~/Library/Logs/...` or the project’s `catchup.log` / `catchup.err.log` if you use the Launch Agent.

- **Catch-up agent not running**  
  Run `launchctl list | grep food-automation`. If missing, run `launchctl load ~/Library/LaunchAgents/com.food-automation.catchup.plist` again. Ensure paths inside the plist are your project path and your `node` path.
