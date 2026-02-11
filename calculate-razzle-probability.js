/**
 * Calculate the exact probability of getting 5 matching dice (1s or 6s) in Razzle
 * using dynamic programming.
 * 
 * Rules:
 * - 3 rolls total (including initial roll)
 * - Keep any 1s and 6s after each roll
 * - Re-roll remaining dice
 * - Each die has P(1 or 6) = 2/6 = 1/3
 */

// Binomial coefficient
function C(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i);
    result /= (i + 1);
  }
  return result;
}

// Probability of getting exactly k successes in n trials with probability p
function binomialProb(n, k, p) {
  return C(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function calculateRazzleProbability() {
  const p = 1/3; // Probability of rolling a 1 or 6
  const targetKeepers = 5;
  const maxRolls = 3;
  
  // dp[roll][keepers] = probability of having exactly 'keepers' after 'roll' rolls
  const dp = Array(maxRolls + 1).fill(0).map(() => Array(targetKeepers + 1).fill(0));
  
  // Initial state: 0 keepers before any rolls
  dp[0][0] = 1.0;
  
  console.log("Dynamic Programming Calculation:");
  console.log("================================\n");
  
  // For each roll
  for (let roll = 0; roll < maxRolls; roll++) {
    console.log(`After roll ${roll}:`);
    for (let currentKeepers = 0; currentKeepers <= targetKeepers; currentKeepers++) {
      if (dp[roll][currentKeepers] === 0) continue;
      
      console.log(`  ${currentKeepers} keepers: probability = ${(dp[roll][currentKeepers] * 100).toFixed(4)}%`);
      
      // If we already have 5 keepers, we're done (carry probability forward)
      if (currentKeepers === targetKeepers) {
        dp[roll + 1][currentKeepers] += dp[roll][currentKeepers];
        continue;
      }
      
      // Number of dice to roll
      const diceToRoll = targetKeepers - currentKeepers;
      
      // Try all possible outcomes of this roll
      for (let newKeepers = 0; newKeepers <= diceToRoll; newKeepers++) {
        const totalKeepers = currentKeepers + newKeepers;
        const probOutcome = binomialProb(diceToRoll, newKeepers, p);
        dp[roll + 1][totalKeepers] += dp[roll][currentKeepers] * probOutcome;
      }
    }
    console.log();
  }
  
  console.log(`After roll ${maxRolls}:`);
  for (let keepers = 0; keepers <= targetKeepers; keepers++) {
    console.log(`  ${keepers} keepers: ${(dp[maxRolls][keepers] * 100).toFixed(4)}%`);
  }
  
  const exactProb = dp[maxRolls][targetKeepers];
  console.log("\n================================");
  console.log(`EXACT probability of 5 matching: ${(exactProb * 100).toFixed(4)}%`);
  console.log(`As decimal: ${exactProb.toFixed(6)}`);
  
  // If BOTH players have this probability, tie probability is:
  const tieProb = exactProb * exactProb;
  console.log(`\nIf both players play Razzle:`);
  console.log(`Tie probability (both get perfect): ${(tieProb * 100).toFixed(4)}%`);
  console.log(`As decimal: ${tieProb.toFixed(6)}`);
  
  return exactProb;
}

// Also run Monte Carlo simulation for verification
function monteCarloRazzle(iterations = 500000) {
  let perfectHands = 0;
  
  for (let i = 0; i < iterations; i++) {
    let keepers = 0;
    
    for (let roll = 0; roll < 3 && keepers < 5; roll++) {
      const diceToRoll = 5 - keepers;
      for (let d = 0; d < diceToRoll; d++) {
        const die = Math.floor(Math.random() * 6) + 1;
        if (die === 1 || die === 6) keepers++;
      }
    }
    
    if (keepers === 5) perfectHands++;
  }
  
  const simulatedProb = perfectHands / iterations;
  console.log(`\n================================`);
  console.log(`Monte Carlo Verification (${iterations.toLocaleString()} iterations):`);
  console.log(`Simulated probability: ${(simulatedProb * 100).toFixed(4)}%`);
  console.log(`Perfect hands: ${perfectHands.toLocaleString()} / ${iterations.toLocaleString()}`);
  
  return simulatedProb;
}

console.log("RAZZLE PROBABILITY CALCULATION");
console.log("==============================\n");
console.log("Goal: Get 5 dice showing 1s or 6s over 3 rolls");
console.log("Each die: P(1 or 6) = 2/6 = 1/3");
console.log("Strategy: Keep all 1s and 6s, re-roll others\n");

const exactProb = calculateRazzleProbability();
const simulatedProb = monteCarloRazzle(500000);

console.log(`\n================================`);
console.log(`SUMMARY:`);
console.log(`  Exact (math):      ${(exactProb * 100).toFixed(4)}%`);
console.log(`  Simulated (MC):    ${(simulatedProb * 100).toFixed(4)}%`);
console.log(`  Difference:        ${Math.abs((exactProb - simulatedProb) * 100).toFixed(4)}%`);
console.log(`\nRecommended tie probability for code: ${(exactProb * exactProb * 100).toFixed(4)}%`);
