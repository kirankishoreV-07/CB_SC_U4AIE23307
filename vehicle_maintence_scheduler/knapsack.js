// update
function knapsack(tasks, capacity) {
  const n = tasks.length;
  const dp = new Array(capacity + 1).fill(0);
  const keep = Array.from({ length: n }, () => new Array(capacity + 1).fill(false));

  for (let i = 0; i < n; i++) {
    const { Duration: dur, Impact: val } = tasks[i];
    for (let w = capacity; w >= dur; w--) {
      if (dp[w - dur] + val > dp[w]) {
        dp[w] = dp[w - dur] + val;
        keep[i][w] = true;
      }
    }
  }

  const selected = [];
  let w = capacity;
  for (let i = n - 1; i >= 0; i--) {
    if (keep[i][w]) {
      selected.push(tasks[i]);
      w -= tasks[i].Duration;
    }
  }

  return {
    maxImpact: dp[capacity],
    selectedTasks: selected,
    hoursUsed: selected.reduce((sum, t) => sum + t.Duration, 0),
  };
}

module.exports = knapsack;
