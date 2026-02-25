const rollMatrix = require('./src/data/roll-game-matrix.json');

// Count distributions for Razzle hands
const razzleDistribution = {};
let totalRazzleRolls = 0;

Object.values(rollMatrix).forEach(rollData => {
  if (rollData.games && rollData.games.includes('razzle')) {
    // Count 1s and 6s (1s are wild)
    const roll = rollData.roll;
    const ones = roll.filter(d => d === 1).length;
    const sixes = roll.filter(d => d === 6).length;
    const totalWild = ones + sixes;
    
    const count = rollData.count || 1;
    razzleDistribution[totalWild] = (razzleDistribution[totalWild] || 0) + count;
    totalRazzleRolls += count;
  }
});

console.log('Razzle Distribution (1s + 6s):');
for (let i = 5; i >= 0; i--) {
  const count = razzleDistribution[i] || 0;
  const pct = ((count / totalRazzleRolls) * 100).toFixed(2);
  const cumulative = Object.keys(razzleDistribution)
    .filter(k => parseInt(k) >= i)
    .reduce((sum, k) => sum + razzleDistribution[k], 0);
  const cumPct = ((cumulative / totalRazzleRolls) * 100).toFixed(2);
  console.log(`  ${i}+: ${count} rolls (${pct}%) - Cumulative: ${cumPct}%`);
}

console.log(`\nTotal Razzle rolls: ${totalRazzleRolls} / 7776 (${((totalRazzleRolls/7776)*100).toFixed(2)}%)`);
