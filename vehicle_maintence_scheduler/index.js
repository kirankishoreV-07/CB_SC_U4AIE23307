// Initial configuration and dependency loading
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const knapsack = require('./knapsack');
const { logger } = require('../logging-middleware/logger');

const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://20.207.122.201/evaluation-service';
const TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN;

if (!TOKEN) {
  logger.error('API_TOKEN (NEXT_PUBLIC_ACCESS_TOKEN) is missing in .env.local');
  process.exit(1);
}

const HEADERS = { Authorization: `Bearer ${TOKEN}` };

async function fetchDepots() {
  try {
    logger.info('Fetching depots from API', { url: `${BASE}/depots` });
    const res = await axios.get(`${BASE}/depots`, { headers: HEADERS });
    const depots = res.data.depots;
    logger.info('Fetched depots successfully', { count: depots.length });
    return depots;
  } catch (error) {
    logger.error('Failed to fetch depots', { error: error.message });
    throw error;
  }
}

async function fetchVehicles() {
  try {
    logger.info('Fetching vehicles from API', { url: `${BASE}/vehicles` });
    const res = await axios.get(`${BASE}/vehicles`, { headers: HEADERS });
    const vehicles = res.data.vehicles;
    logger.info('Fetched vehicles successfully', { count: vehicles.length });
    return vehicles;
  } catch (error) {
    logger.error('Failed to fetch vehicles', { error: error.message });
    throw error;
  }
}

async function main() {
  const depots = await fetchDepots();
  const vehicles = await fetchVehicles();

  // Processing each depot to find the best set of maintenance tasks
  const results = depots.map(depot => {
    const { maxImpact, selectedTasks, hoursUsed } = knapsack(vehicles, depot.MechanicHours);

    logger.info('Knapsack calculation completed for depot', {
      depotId: depot.ID,
      budget: depot.MechanicHours,
      hoursUsed,
      maxImpact,
      taskCount: selectedTasks.length,
    });

    return {
      depotId: depot.ID,
      budget: depot.MechanicHours,
      hoursUsed,
      totalImpact: maxImpact,
      taskCount: selectedTasks.length,
      selectedTasks: selectedTasks.map(t => t.TaskID),
    };
  });

  logger.info('Final scheduling results', { results });

  process.stdout.write('\n=== VEHICLE SCHEDULING RESULTS ===\n\n');
  results.forEach(r => {
    process.stdout.write(`Depot ${r.depotId} | Budget: ${r.budget}h | Used: ${r.hoursUsed}h | Impact: ${r.totalImpact} | Tasks: ${r.taskCount}\n`);
  });
  process.stdout.write('\n');

  logger.info('All depots processed successfully');
}

main().catch(err => {
  logger.error('Fatal error in main', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
