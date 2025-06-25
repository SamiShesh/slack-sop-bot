require('dotenv').config();

const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const { google } = require('googleapis');

// Format Google private key
const privateKey = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

// Create ExpressReceiver for custom routing
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events',
});

// Access the Express app
const app = receiver.app;

// ✅ Add custom GET route BEFORE starting
app.get('/', (req, res) => {
  console.log('✅ GET / called');
  res.status(200).send('✅ Slack SOP Bot is running!');
});

// Handle Slack challenge verification
app.post('/slack/events', express.json(), (req, res, next) => {
  if (req.body.type === 'url_verification') {
    return res.status(200).send(req.body.challenge);
  }
  next();
});

// Create Bolt app
const boltApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
  receiver,
});

// Respond to mentions
boltApp.event('app_mention', async ({ event, say }) => {
  await say(`👋 Hi <@${event.user}>! What SOP are you looking for?`);
});

// Start the app
(async () => {
  const port = process.env.PORT || 3000;
  await boltApp.start(port);
  console.log(`⚡️ Slack SOP Bot is running on port ${port}`);
})();