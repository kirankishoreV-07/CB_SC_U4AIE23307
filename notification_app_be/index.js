require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const { logger } = require('../logging-middleware/logger');

const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://20.207.122.201/evaluation-service';
const TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
const TOP_N = 10;

const WEIGHT = { Placement: 3, Result: 2, Event: 1 };

if (!TOKEN) {
  logger.error('API_TOKEN is missing in .env.local');
  process.exit(1);
}

const HEADERS = { Authorization: `Bearer ${TOKEN}` };

async function getTopNNotifications(n = TOP_N) {
  try {
    logger.info('Fetching notifications from API', { url: `${BASE}/notifications` });

    const res = await axios.get(`${BASE}/notifications`, { headers: HEADERS });
    const notifications = res.data.notifications;

    logger.info('Notifications fetched successfully', { total: notifications.length });

    const sorted = [...notifications].sort((a, b) => {
      const weightDiff = (WEIGHT[b.Type] ?? 0) - (WEIGHT[a.Type] ?? 0);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.Timestamp) - new Date(a.Timestamp);
    });

    logger.info('Full priority ranking preview', {
      ranked: sorted.slice(0, 20).map((n, i) => ({
        rank: i + 1,
        type: n.Type,
        message: n.Message,
        timestamp: n.Timestamp,
      }))
    });

    const top = sorted.slice(0, n);

    logger.info('Priority filtering completed', {
      topN: n,
      breakdown: top.reduce((acc, notif) => {
        acc[notif.Type] = (acc[notif.Type] || 0) + 1;
        return acc;
      }, {}),
    });

    return top;
  } catch (error) {
    logger.error('Failed to fetch priority notifications', { error: error.message });
    throw error;
  }
}

async function main() {
  const top = await getTopNNotifications(TOP_N);

  process.stdout.write(`\n=== TOP ${TOP_N} PRIORITY NOTIFICATIONS ===\n\n`);
  top.forEach((n, i) => {
    process.stdout.write(`${i + 1}. [${n.Type}] ${n.Message} — ${n.Timestamp}\n`);
  });
  process.stdout.write('\n');

  logger.info('Priority inbox processed successfully');
}

main().catch(err => {
  logger.error('Fatal error in main', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
