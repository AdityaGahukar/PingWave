import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";
import { ENV } from "./env.js";

const aj = arcjet({
  key: ENV.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: "LIVE" }),
    // Create a bot detection rule
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a sliding window rate limit. Other algorithms are supported.
    slidingWindow({
        mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
        max: 100, // Max 100 requests
        interval: 60, // Per 60 seconds
        // Optionally, customize how to identify unique clients
        // By default, IP address is used
        // keyGenerator: (req) => req.headers["x-api-key"] || req.ip,
    })
  ],
});

export default aj;

/*
1. Block common attacks via shield()
2. Block bots except search engines via detectBot()
3. Apply a rate limit of 100 requests per 60 seconds using a sliding window algorithm

The sliding window calculates the request count based on the exact timestamps of previous requests — not just fixed blocks.
This means:
    Each IP (default key) can make up to 100 requests per rolling 60 seconds.
    The counter updates dynamically — not just every minute.
    When exceeded, Arcjet automatically returns a 429 (Too Many Requests) response.
*/