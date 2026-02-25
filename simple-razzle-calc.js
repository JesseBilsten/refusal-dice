// Exact probability calculation for Razzle
const p = 1/3; // P(1 or 6)

// dp[roll][keepers] = probability
const dp = [[],[],[],[]];
for (let i = 0; i < 4; i++) {
  dp[i] = new Array(6).fill(0);
}

dp[0][0] = 1.0;

function C(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) {
    r *= (n - i) / (i + 1);
  }
  return r;
}

function binomial(n, k, p) {
  return C(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

for (let roll = 0; roll < 3; roll++) {
  for (let k = 0; k <= 5; k++) {
    if (dp[roll][k] === 0) continue;
    if (k === 5) {
      dp[roll + 1][5] += dp[roll][5];
      continue;
    }
    const dice = 5 - k;
    for (let newK = 0; newK <= dice; newK++) {
      dp[roll + 1][k + newK] += dp[roll][k] * binomial(dice, newK, p);
    }
  }
}

const prob = dp[3][5];
console.log("Exact P(5 matching in Razzle):", (prob * 100).toFixed(4) + "%");
console.log("Tie probability:", (prob * prob * 100).toFixed(4) + "%");
