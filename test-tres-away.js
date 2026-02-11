const data = require('./src/data/unique-rolls.json');

console.log('TRES AWAY TIERED STRENGTH ANALYSIS\n');

console.log('Five 3s (Perfect - 100% flexibility):');
['33333'].forEach(test);

console.log('\nFour 3s (High flexibility - can choose to roll or keep last die):');
['13333', '23333', '33334', '33335', '33336'].forEach(test);

console.log('\nThree 3s (Moderate flexibility):');
['13335', '23336', '33345', '33356', '33366'].forEach(test);

console.log('\nTwo 3s (Some flexibility):');
['13356', '23456', '33456', '33566'].forEach(test);

console.log('\nOne 3 (Limited flexibility):');
['13456', '23456', '34566', '35666'].forEach(test);

console.log('\nNo 3s - Multiple 1s (Safe rounds give control):');
['11111', '11114', '11122', '11156', '11223', '11456'].forEach(test);

console.log('\nNo 3s - Multiple 2s (Less safe than 1s):');
['22222', '22224', '22245', '22456'].forEach(test);

console.log('\nNo 3s - High dice (Lowest die critical):');
['16666', '26666', '45666', '56666', '66666'].forEach(test);

function test(rollStr) {
  const r = data.uniqueRolls.find(r => r.roll.join('') === rollStr);
  const ta = r?.analysis.variants.find(v => v.game === 'tres-away');
  if (ta) {
    const scoreMatch = ta.details.match(/Score: (\d+)/);
    const score = scoreMatch ? scoreMatch[1] : '?';
    console.log(`  ${rollStr}: strength=${String(ta.rawStrength).padStart(3)} (score: ${score})`);
  }
}
