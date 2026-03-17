const https = require("https");

function notify(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.resolve();

  const payload = JSON.stringify({ chat_id: chatId, text });
  console.log(`[Telegram] Sending payload: ${payload}`);

  return new Promise((resolve) => {
    const req = https.request(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => { responseBody += chunk; });
        res.on("end", () => {
          console.log(`[Telegram] Status: ${res.statusCode}, Response: ${responseBody}`);
          resolve();
        });
      },
    );
    req.on("error", (err) => {
      console.error(`[Telegram] Request Error: ${err.message}`);
      resolve();
    });
    req.end(payload);
  });
}

module.exports = { notify };
