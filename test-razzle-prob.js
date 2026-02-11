// Calculate probability of getting 5 matching in Razzle (5 total 1s+6s over 3 rolls)
// Each die: P(1 or 6) = 2/6 = 1/3

function simulateRazzle(iterations = 100000) {
  let perfectHands = 0;
  
  for (let i = 0; i < iterations; i++) {
    let keepers = 0;
    let diceToRoll = 5;
    
    // Roll up to 3 times
    for (let roll = 0; roll < 3 && keepers < 5; roll++) {
      for (let d = 0; d < diceToRoll; d++) {
        const die = Math.floor(Math.random() * 6) + 1;
        if (die === 1 || die === 6) keepers++;
      }
      diceToRoll = 5 - keepers;
    }
    
    if (keepers === 5) perfectHands++;
  }
  
  const probability = perfectHands / iterations;
  console.log("Razzle Monte Carlo Simulation (" + iterations + " iterations):");
  console.log("Probability of getting 5 matching (perfect hand):", (probability * 100).toFixed(2) + "%");
  console.log("Perfect hands:", perfectHands + "/" + iterations);
  
  return probability;
}

const prob = simulateRazzle(200000);
console.log("\nIf ONE player has " + (prob * 100).toFixed(2) + "% chance of perfect hand:");
console.log("Probability BOTH players get perfect hand (tie):", (prob * prob * 100).toFixed(3) + "%");
console.log("\nFor comparison, current estimate in code: 8.00%");
