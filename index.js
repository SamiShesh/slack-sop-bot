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

// ✅ Express instance to add optional routes
const app = receiver.app;

// ✅ Root GET route for Render health check
app.get('/', (req, res) => {
  res.send('✅ Slack SOP Bot is running');
});

// ✅ Handle Slack URL verification challenge
app.post('/slack/events', (req, res, next) => {
  if (req.body.type === 'url_verification') {
    return res.status(200).send(req.body.challenge);
  }
  next();
});

// ✅ Google client setup (optional)
const jwtClient = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  privateKey,
  ['https://www.googleapis.com/auth/cloud-platform']
);

// ✅ Slack event listener
boltApp.event('app_mention', async ({ event, say }) => {
  await say(`👋 Hi <@${event.user}>! What SOP are you looking for?`);
});

// ✅ Start the bot + server (Render fix)
(async () => {
  const port = process.env.PORT || 3000;

  await boltApp.start(); // Start Bolt internals

  app.listen(port, () => {
    console.log(`⚡️ Slack SOP Bot is running on port ${port}!`);
  });
})();