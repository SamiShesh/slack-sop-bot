const { App } = require('@slack/bolt');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// ⚠️ Step: Respond to Slack's URL verification
app.post('/slack/events', (req, res) => {
  if (req.body.type === 'url_verification') {
    return res.status(200).send(req.body.challenge); // ✅ Respond with challenge
  }

  // Let Bolt handle other events
  boltApp.processEvent(req, res);
});

const boltApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN,
  receiver: {
    expressApp: app,
    router: express.Router(),
  },
});

boltApp.event('app_mention', async ({ event, say }) => {
  await say(`👋 Hi <@${event.user}>! What SOP are you looking for?`);
});

(async () => {
  await boltApp.start(process.env.PORT || 10000);
  console.log('⚡️ Slack SOP Bot is running!');
})();
