const fs = require('fs');
const path = require('path');
const { checkGame, getKickerStrength } = require('../lib/game-validation.js');
const uniqueRollsData = require('./unique-rolls.json');

const GAMES = [
  { id: '10-3', name: '10-3' },
  { id: '10-2', name: '10-2' },
  { id: 'vegas', name: "7's" },
  { id: 'ship-captain-crew', name: 'Ship, Captain, Crew' },
  { id: 'pairs', name: 'Pairs' },
  { id: 'monterey', name: 'Monterey' },
  { id: '10-4', name: '10-4' },
  { id: 'razzle', name: 'Razzle' },
  { id: 'boss', name: 'Boss' },
  { id: 'tres-away', name: 'Tres Away' },
];

/**
 * Generate a pre-computed matrix of which games each unique roll satisfies
 * This eliminates the need to validate 7,776 rolls at runtime - only 252 lookups needed
 */
function generateRollGameMatrix() {
  console.log('Starting roll-game matrix generation...');
  console.log(`Processing ${uniqueRollsData.uniqueRolls.length} unique rolls against ${GAMES.length} games...`);
  
  const matrix = {};
  let totalValidCombinations = 0;
  
  // Process each unique roll
  uniqueRollsData.uniqueRolls.forEach((rollData, index) => {
    const roll = rollData.roll;
    const rollKey = roll.join(''); // e.g., "11123"
    
    const validGames = [];
    const kickerStrengths = {};
    
    // Check each game
    GAMES.forEach(game => {
      if (checkGame(roll, game.id)) {
        validGames.push(game.id);
        
        // Calculate kicker strength for games that use it
        const kickerStrength = getKickerStrength(roll, game.id);
        if (kickerStrength) {
          kickerStrengths[game.id] = kickerStrength;
        }
        
        totalValidCombinations++;
      }
    });
    
    matrix[rollKey] = {
      roll: roll,
      games: validGames,
      kickerStrengths: kickerStrengths,
      // Keep indices for runtime mapping
      indices: rollData.indices,
      count: rollData.count
    };
    
    // Progress indicator
    if ((index + 1) % 50 === 0) {
      console.log(`Processed ${index + 1}/${uniqueRollsData.uniqueRolls.length} rolls...`);
    }
  });
  
  console.log(`Generated matrix with ${Object.keys(matrix).length} entries`);
  console.log(`Total valid roll-game combinations: ${totalValidCombinations}`);
  
  return matrix;
}

/**
 * Main function - generates and saves the matrix
 */
function generate() {
  try {
    const matrix = generateRollGameMatrix();
    
    const outputPath = path.join(__dirname, 'roll-game-matrix.json');
    const jsonOutput = JSON.stringify(matrix, null, 2);
    
    fs.writeFileSync(outputPath, jsonOutput, 'utf8');
    console.log(`Successfully wrote roll-game matrix to ${outputPath}`);
    console.log(`File size: ${(jsonOutput.length / 1024).toFixed(2)} KB`);
    
    return matrix;
  } catch (error) {
    console.error('Error generating roll-game matrix:', error);
    throw error;
  }
}

// Allow running as a script or importing as a module
if (require.main === module) {
  generate();
} else {
  module.exports = generate;
}
