const https = require("https");

function notify(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.resolve();

  const payload = JSON.stringify({ chat_id: chatId, text });

  return new Promise((resolve) => {
    const req = https.request(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      () => resolve(),
    );
    req.on("error", () => resolve());
    req.end(payload);
  });
}

module.exports = { notify };
