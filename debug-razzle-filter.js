const { calculateRawStrength, calculateOffensiveStrength, estimateTieProbability, getRazzleScore, calculateOpponentTieOrBeatProbability, generateHammerStrategy, gameOddsMap, checkGame } = require('./src/lib/game-validation');

// Test several rolls for razzle
const testRolls = [
  [6,2,3,4,5],  // worst: single 6, no wilds
  [2,2,3,4,5],  // pair of 2s
  [1,2,3,4,5],  // one wild
  [2,2,2,4,5],  // three 2s
  [1,1,2,3,4],  // two wilds  
  [1,1,1,2,3],  // three wilds
  [6,6,6,2,3],  // three 6s
  [6,6,6,6,2],  // four 6s
  [6,6,6,6,6],  // five 6s
];

console.log('=== Razzle analysis ===');
testRolls.forEach(roll => {
  const rs = getRazzleScore(roll);
  const raw = calculateRawStrength(roll, 'razzle');
  const tieProbEst = estimateTieProbability(raw, 'razzle');
  const offensive = calculateOffensiveStrength(raw, 3, 'razzle');
  const percentile = raw / 100;
  const pStrictlyBetter = Math.max(0, percentile - tieProbEst);
  console.log(JSON.stringify({
    roll: roll.join(','),
    bestCount: rs.bestCount,
    bestNum: rs.bestNumber,
    rawStrength: raw,
    percentile: percentile.toFixed(2),
    tieProbEst: tieProbEst.toFixed(2),
    pStrictlyBetter: pStrictlyBetter.toFixed(4),
    offensiveStrength: offensive.toFixed(2),
    FILTERED_OUT: offensive === 0
  }));
});

// Now check boss and tres-away on a weak roll
console.log('\n=== Boss / Tres-Away analysis ===');
const weakRoll = [2,3,4,5,6];
const bossRaw = calculateRawStrength(weakRoll, 'boss');
const bossOff = calculateOffensiveStrength(bossRaw, 3, 'boss');
console.log('Boss [2,3,4,5,6]:', JSON.stringify({ rawStrength: bossRaw, offensiveStrength: bossOff.toFixed(2), filtered: bossOff === 0 }));

const tresRaw = calculateRawStrength(weakRoll, 'tres-away');
const tresOff = calculateOffensiveStrength(tresRaw, 3, 'tres-away');
console.log('Tres [2,3,4,5,6]:', JSON.stringify({ rawStrength: tresRaw, offensiveStrength: tresOff.toFixed(2), filtered: tresOff === 0 }));

// Tres with 1 three
const tresRaw2 = calculateRawStrength([3,2,4,5,6], 'tres-away');
const tresOff2 = calculateOffensiveStrength(tresRaw2, 3, 'tres-away');
console.log('Tres [3,2,4,5,6]:', JSON.stringify({ rawStrength: tresRaw2, offensiveStrength: tresOff2.toFixed(2), filtered: tresOff2 === 0 }));

// Check what homepage would show for [2,3,4,5,6]
console.log('\n=== Homepage output for [2,3,4,5,6] ===');
const result = generateHammerStrategy([2,3,4,5,6], 3, gameOddsMap);
const recs = (result.allRecommendations || []);
console.log('Total recommendations (before filter):', recs.length);
recs.forEach(r => console.log('  ', r.game, r.variant || '', 'raw:', r.rawStrength, 'off:', r.offensiveStrength.toFixed(2), r.offensiveStrength > 0 ? 'SHOWN' : 'HIDDEN'));
const filtered = recs.filter(r => r.offensiveStrength > 0);
console.log('After offensiveStrength > 0 filter:', filtered.length);
console.log('Games shown:', filtered.map(r => r.game + (r.variant ? '-' + r.variant : '')).join(', '));

// Also check a common roll
console.log('\n=== Homepage output for [1,3,3,4,5] ===');
const result2 = generateHammerStrategy([1,3,3,4,5], 3, gameOddsMap);
const recs2 = (result2.allRecommendations || []);
recs2.forEach(r => console.log('  ', r.game, r.variant || '', 'raw:', r.rawStrength, 'off:', r.offensiveStrength.toFixed(2), r.offensiveStrength > 0 ? 'SHOWN' : 'HIDDEN'));
