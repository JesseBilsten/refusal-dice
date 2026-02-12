// Script to enhance the games page with roll lookup and probabilities
// Run with: node enhance-games-page.js

const fs = require('fs');
const path = require('path');

const rollGameMatrix = require('./src/data/roll-game-matrix.json');

// Calculate probabilities
const calculateGameProbs = () => {
  const probs = {};
  const games = ['10-2', '10-3', '10-4', 'ship-captain-crew', 'monterey', 'vegas', 'pairs', 'razzle', 'boss', 'tres-away'];
  
  games.forEach((gameId) => {
    let totalCount = 0;
    Object.values(rollGameMatrix).forEach(rollData => {
      if (rollData.games && rollData.games.includes(gameId)) {
        totalCount += rollData.count || 0;
      }
    });
    probs[gameId] = ((totalCount / 7776) * 100).toFixed(1);
  });
  
  console.log('Calculated probabilities:', probs);
  return probs;
};

calculateGameProbs();
