const fs = require('fs');
const path = require('path');

// Generate all possible dice rolls
const diceRolls = [];
for (let i = 1; i <= 6; i++) {
  for (let j = 1; j <= 6; j++) {
    for (let k = 1; k <= 6; k++) {
      for (let l = 1; l <= 6; l++) {
        for (let m = 1; m <= 6; m++) {
          diceRolls.push([i, j, k, l, m]);
        }
      }
    }
  }
}

console.log(`Generated ${diceRolls.length} total rolls`);

// Calculate unique rolls and their counts
const countsMap = new Map();

diceRolls.forEach((roll, index) => {
  const normalized = [...roll].sort((a, b) => a - b).join('');
  if (!countsMap.has(normalized)) {
    countsMap.set(normalized, { 
      roll: roll,
      indices: [], 
      count: 0 
    });
  }
  countsMap.get(normalized).indices.push(index);
  countsMap.get(normalized).count++;
});

// Convert to array for JSON
const uniqueRollsArray = Array.from(countsMap.values());

console.log(`Found ${uniqueRollsArray.length} unique roll combinations`);

// Write to JSON file
const outputPath = path.join(__dirname, 'unique-rolls.json');
fs.writeFileSync(outputPath, JSON.stringify({
  totalRolls: diceRolls.length,
  uniqueCount: uniqueRollsArray.length,
  uniqueRolls: uniqueRollsArray
}, null, 2));

console.log(`Saved to ${outputPath}`);
