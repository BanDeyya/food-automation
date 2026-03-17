# Food Automation 🥣

Automated Google Form submission for daily lunch/dinner choices.

## 🚀 Setup

1. **Initialize the project:**
   Run the initialization script to install dependencies and set up the cron job.
   ```bash
   chmod +x init.sh
   ./init.sh
   ```

2. **Configure credentials:**
   Edit the `.env` file created by the script:
   ```bash
   nano .env
   ```
   Set `LOGIN_FORM_URL`, `SUBMIT_FORM_URL`, `USER_EMAIL`, and `FOOD_CHOICE`.

3. **Log in to Google:**
   Run the login script to save your session (one-time setup):
   ```bash
   pnpm run login
   ```
   A browser will open. Sign in to your Google account and wait for the "Login saved" message.

4. **Test the flow:**
   ```bash
   pnpm start
   ```

## 📅 Scheduling

The `init.sh` script automatically adds a cron job to run every weekday (Mon-Fri) at 2:00 PM. 

To view or edit your crontab:
```bash
crontab -e
```

## 📂 Project Structure

- `run.js`: Main entry point (orchestrator).
- `submit.js`: Logic for form submission.
- `login.js`: Helper script for manual login.
- `authCheck.js`: Validates the existing session.
- `notify.js`: Handles desktop notifications.
- `browser-data/`: Directory where the Chromium profile and session are stored.

## 📝 Logs

The cron job output is redirected to `cron.log` in the project directory.
