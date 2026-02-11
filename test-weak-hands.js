const { analyzeRoll } = require('./src/lib/game-validation.js');

// Look for genuinely weak hands
const testHands = [
  [2,3,5,6,3], // User's example
  [2,3,5,6,4], 
  [2,2,2,5,6], 
  [3,3,3,5,6], 
  [4,4,4,2,3],
  [2,3,3,5,6],
  [2,4,4,5,6],
  [2,2,4,5,6],
  [3,3,4,5,6],
  [2,2,2,2,5],
  [3,3,3,3,5],
  [4,4,4,4,2]
];

console.log('Testing hands for weakness:\n');
const results = testHands.map(roll => {
  const analysis = analyzeRoll(roll);
  const games = analysis.variants.filter(v => v.rawStrength > 0);
  const maxStrength = games.length > 0 ? Math.max(...games.map(g => g.rawStrength)) : 0;
  const bestGame = games.length > 0 ? games.reduce((a, b) => a.rawStrength > b.rawStrength ? a : b) : null;
  
  return {
    roll,
    gameCount: games.length,
    maxStrength,
    bestGame: bestGame ? `${bestGame.game} ${bestGame.variant || ''}` : 'none'
  };
});

// Sort by max strength ascending (weakest first)
results.sort((a, b) => a.maxStrength - b.maxStrength);

results.forEach(r => {
  console.log(`[${r.roll.join(',')}]`);
  console.log(`  ${r.gameCount} games available, best: ${r.bestGame} (${r.maxStrength.toFixed(0)})`);
  console.log();
});

console.log('\nWeakest 3 hands:');
results.slice(0, 3).forEach((r, i) => {
  console.log(`${i+1}. [${r.roll.join(',')}] - ${r.gameCount} games, max strength ${r.maxStrength.toFixed(0)}`);
});
