require('dotenv').config();
const { App } = require('@slack/bolt');
const { google } = require('googleapis');
const fs = require('fs');

// Load Google credentials
const auth = new google.auth.GoogleAuth({
  keyFile: 'google-key.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// When someone types: sop fare dispute
app.message(/^sop (.+)/i, async ({ message, say, context }) => {
  const keyword = context.matches[1].toLowerCase();

  try {
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'SOPs!A2:C', // Assumes headers in row 1, content starts row 2
    });

    const rows = response.data.values;
    const match = rows.find(row => row[0].toLowerCase() === keyword);

    if (match) {
      const [title, summary, link] = match;
      await say(`📘 *${title}*\n\n${summary}\n🔗 <${link}|View Full SOP>`);
    } else {
      await say(`❓ Sorry, I couldn't find an SOP for *${keyword}*.`);
    }
  } catch (err) {
    console.error(err);
    await say('⚠️ There was an error fetching the SOP. Please try again later.');
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack SOP Bot is running!');
})();