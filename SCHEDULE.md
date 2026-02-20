# Running the food form daily at 2 PM IST (Mon–Fri)

Use **cron** on your Mac to run the script automatically.

## 0. Environment variables (.env)

Sensitive config (form URLs, email) lives in **`.env`** in the project root. Copy from `.env.example` and fill in:

- `PROJECT_PATH` – Full path to this project (e.g. output of `pwd` when inside the project). Use this same path in your crontab and plist.
- `LOGIN_FORM_URL` – Google form URL used for login
- `SUBMIT_FORM_URL` – Food submission form URL
- `USER_EMAIL` – Your email (for the “Record …” checkbox)
- `FOOD_CHOICE` – e.g. `Nonveg` or `Veg`

**Cron:** The cron job runs `cd /path/to/food-automation && node run.js`, so the process starts in the project directory. `run.js` loads `.env` from the script directory (`path.join(__dirname, '.env')`), so cron picks up the same `.env` as when you run `pnpm start` locally. No extra setup needed.

## 1. Use the common run script

From the project folder:

```bash
pnpm start
```

This will:
- Check if Google login (auth) is still valid.
- If expired: open the browser for you to log in, then run the form submit.
- If valid: run the form submit only.

## 2. Crontab setup (Mac)

Run at **2 PM IST, Monday–Friday**.

**Important:** On macOS, cron uses your **system’s local time**. So the cron time is whatever your Mac’s clock is set to (e.g. India = IST).

### Step 1: Get full path to `node`

In Terminal:

```bash
which node
```

Example results:
- Homebrew (M1/M2): `/opt/homebrew/bin/node`
- Intel Homebrew: `/usr/local/bin/node`
- nvm/fnm: something like `/Users/priyanshubaranwal/.nvm/versions/node/v20.x.x/bin/node`

Copy the path; you’ll use it in the cron line.

### Step 2: Open crontab

```bash
crontab -e
```

- If asked to choose an editor, pick **nano** (easiest: arrow keys, edit, then Ctrl+O Enter to save, Ctrl+X to exit) or **vim** if you prefer.
- If the file is empty, that’s fine; you’re adding your first job.

### Step 3: Add the cron line

The job runs **every 30 minutes** between 2 PM and 6 PM (Mon–Fri). If the 2 PM run was missed (e.g. Mac was asleep), the next run at 2:30, 3:00, … will try. Once submitted for the day, later runs exit without re-submitting.

Use your **PROJECT_PATH** from `.env` and the path from Step 1 for `node`:

```cron
0,30 14-17 * * 1-5 cd PROJECT_PATH_FROM_ENV && PATH_TO_NODE run.js
```

Example (Mac set to India; replace with your PROJECT_PATH and node path):

```cron
0,30 14-17 * * 1-5 cd /Users/yourname/food-automation && /opt/homebrew/bin/node run.js
```

- `0,30 14-17` = at :00 and :30 past the hour, for hours 14–17 (2 PM, 2:30 PM, 3 PM, 3:30 PM, 4 PM, 4:30 PM, 5 PM, 5:30 PM) **local time**
- `* * 1-5` = Monday through Friday

Replace `PROJECT_PATH_FROM_ENV` with the value of `PROJECT_PATH` in your `.env`, and `PATH_TO_NODE` with the path from Step 1. Save and exit (nano: Ctrl+O, Enter, Ctrl+X).

### Step 4: Confirm it’s installed

```bash
crontab -l
```

You should see your line. Cron will run it every 30 minutes between 2 PM and 6 PM IST on weekdays whenever the Mac is on (and preferably awake).

## 3. Important for cron

- **Display**: The script uses Playwright with a browser. Cron runs without a graphical session, so use **headless** for scheduled runs, or ensure the machine is logged in and the script can open a visible browser (e.g. you’re at the Mac at 2 PM).
- **Auth**: If the saved Google login has expired, the 2 PM run cannot log in by itself (no one to interact). Run `pnpm start` manually every few weeks when you’re at the Mac so it can re-login and save a fresh `auth.json`.
- **PATH**: Cron’s PATH is minimal. Use full paths for `node` and the project directory as in the examples above.

## 4. Catch-up when laptop was closed at 2 PM

If your Mac was **closed or asleep** at 2 PM, cron does **not** run. To still submit for that day when you open the laptop:

- A **Launch Agent** runs once each time you **log in** (e.g. after opening the lid).
- It checks: weekday (Mon–Fri), time 2–6 PM IST, and that you haven’t submitted today.
- If all match, it runs the same flow as `pnpm start` and updates `lastSubmission.json` for the day.

So: **2 PM with laptop open** → cron runs and submits. **2 PM with laptop closed, then you open at 4 PM** → at login the agent runs, sees “weekday, 4 PM IST, not submitted” and submits, then updates `lastSubmission.json`.

The agent is already installed and loaded (plist: `com.food-automation.catchup.plist` in `~/Library/LaunchAgents/`). To uninstall later: `launchctl unload ~/Library/LaunchAgents/com.food-automation.catchup.plist` then remove the plist file.

## 5. Optional: run in headless for cron

If you want the scheduled run to use a headless browser (no window), we can add a `HEADLESS=1` (or `--headless`) option to the submit script and use it only when running from cron. Right now the scripts use a visible browser.
