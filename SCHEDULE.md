# Running the food form daily at 2 PM IST (Mon–Fri)

Use **cron** on your Mac to run the script automatically.

## 0. Environment variables (.env)

Sensitive config (form URLs, email) lives in **`.env`** in the project root. Copy from `.env.example` and fill in:

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

Use **2 PM in your system time**. If your Mac is set to **India (IST)**, use `0 14` (14:00 = 2 PM):

```cron
0 14 * * 1-5 cd /Users/priyanshubaranwal/personal-repo/food-automation && PATH_TO_NODE run.js
```

Example with Homebrew (Mac set to India):

```cron
0 14 * * 1-5 cd /Users/priyanshubaranwal/personal-repo/food-automation && /opt/homebrew/bin/node run.js
```

- `0 14` = 2:00 PM **local time** (so 2 PM IST when Mac is set to India)
- `* * 1-5` = Monday (1) through Friday (5)

Replace `PATH_TO_NODE` with the path from Step 1 (e.g. `/opt/homebrew/bin/node`). Save and exit (nano: Ctrl+O, Enter, Ctrl+X).

### Step 4: Confirm it’s installed

```bash
crontab -l
```

You should see your line. Cron will run it at 2 PM IST on weekdays as long as the Mac is on (and preferably awake) at that time.

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
