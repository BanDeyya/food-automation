#!/bin/bash

# food-automation initialization script
# Author: Antigravity

set -e

PROJECT_DIR=$(pwd)
NODE_BIN=$(which node)

echo "🚀 Starting food-automation setup..."

# 1. Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm not found. Installing..."
    npm install -g pnpm
else
    echo "✅ pnpm is already installed."
fi

# 2. Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# 3. Install Playwright Chromium
echo "🌐 Installing Playwright Chromium..."
npx playwright install chromium

# 4. Handle .env file
if [ ! -f ".env" ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Action required: Please edit the .env file with your credentials."
else
    echo "✅ .env file already exists."
fi

# 5. Add crontab entry
CRON_JOB="0 14 * * 1-5 cd $PROJECT_DIR && $NODE_BIN run.js >> $PROJECT_DIR/cron.log 2>&1"

echo "📅 Updating crontab..."
# Remove any existing crontab entries for this project (both the old run_form_once.sh and the new run.js ones)
crontab -l 2>/dev/null | grep -v "$PROJECT_DIR" > mycron || true
# Add the new job
echo "$CRON_JOB" >> mycron
crontab mycron
rm mycron
echo "✅ Crontab updated successfully."

echo "------------------------------------------------"
echo "🎉 Setup complete!"
echo "Next steps:"
echo "1. Edit your .env file: nano .env"
echo "2. Run 'pnpm run login' to establish your Google session."
echo "3. Test the script manually: pnpm start"
echo "------------------------------------------------"
