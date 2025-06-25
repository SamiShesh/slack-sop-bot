require('dotenv').config();

const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const { google } = require('googleapis');

// ✅ Format the Google private key
const privateKey = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

// ✅ Create a custom ExpressReceiver
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events',
});

// ✅ Slack Bolt App with custom receiver
const boltApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
  receiver,
});

// ✅ Express instance to add custom routes
const app = receiver.app;

// ✅ Optional root handler for testing from browser or health checks
app.get('/', (req, res) => {
  res.status(200).send('✅ Slack SOP Bot is running');
});

// ✅ Respond to Slack's challenge request for event verification
app.post('/slack/events', express.json(), (req, res, next) => {
  if (req.body.type === 'url_verification') {
    return res.status(200).send(req.body.challenge);
  }
  next(); // Let Bolt handle other events
});

// ✅ Google API client setup (if needed for SOP retrieval from Sheets)
const jwtClient = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  privateKey,
  ['https://www.googleapis.com/auth/cloud-platform']
);

// ✅ Handle "app_mention" events
boltApp.event('app_mention', async ({ event, say }) => {
  await say(`👋 Hi <@${event.user}>! What SOP are you looking for?`);
});

// ✅ Start the Slack bot
(async () => {
  const port = process.env.PORT || 10000;
  await boltApp.start(port);
  console.log(`⚡️ Slack SOP Bot is running on port ${port}!`);
})();