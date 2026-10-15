/**
 * Roll query engine — describe any requirement on a roll of 1–5 dice and
 * count exactly which outcomes satisfy it.
 *
 * A query is a list of patterns; a roll matches if ANY pattern matches.
 * A pattern is a list of rules; a pattern matches if ALL its rules hold.
 *
 * Rules that name a number of dice ("specific dice", "run", "of a kind",
 * "sum of 2 dice", "3 dice each ≥ 4") each claim their own dice — no die is
 * shared between them — mirroring how games like 7's need two *separate*
 * pairs. "Remaining" rules look at the dice no other rule claimed (kickers);
 * "all" rules and count rules look at the whole roll.
 *
 * Probabilities are exact: every unique roll is evaluated once and weighted
 * by how many ordered outcomes (of 6^n) produce it.
 *
 * Pure functions, CommonJS so Jest and Node scripts can load it directly.
 */

const MAX_DICE = 5

const OPS = {
  eq: '=',
  ne: '≠',
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
  in: 'one of',
}

const RULE_TYPES = {
  faces: 'Specific dice',
  straight: 'Run (straight)',
  kind: 'Of a kind',
  sum: 'Dice add up to',
  each: 'Each die is',
  count: 'Count of dice',
}

function compare(x, op, value, values) {
  switch (op) {
    case 'eq':
      return x === value
    case 'ne':
      return x !== value
    case 'lt':
      return x < value
    case 'lte':
      return x <= value
    case 'gt':
      return x > value
    case 'gte':
      return x >= value
    case 'in':
      return (values || []).includes(x)
    default:
      return true
  }
}

const sum = (dice) => dice.reduce((a, b) => a + b, 0)

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1))

/** Number of ordered outcomes that sort to this roll (multinomial). */
function arrangements(roll) {
  const counts = {}
  roll.forEach((d) => (counts[d] = (counts[d] || 0) + 1))
  return Object.values(counts).reduce(
    (acc, c) => acc / factorial(c),
    factorial(roll.length)
  )
}

/** Every unique (sorted ascending) roll of n dice with its ordered-outcome count. */
function enumerateRolls(n) {
  const out = []
  const rec = (start, acc) => {
    if (acc.length === n) {
      out.push({ roll: acc.slice(), count: arrangements(acc) })
      return
    }
    for (let f = start; f <= 6; f++) {
      acc.push(f)
      rec(f, acc)
      acc.pop()
    }
  }
  rec(1, [])
  return out
}

/** How many dice a rule claims for itself (0 = looks at the whole roll or the rest). */
function diceClaimed(rule) {
  switch (rule.type) {
    case 'faces':
      return (rule.values || []).length
    case 'straight':
      return rule.length || 0
    case 'kind':
      return rule.size || 0
    case 'sum':
    case 'each':
      return typeof rule.dice === 'number' ? rule.dice : 0
    default:
      return 0
  }
}

/** Does this set of claimed dice satisfy the rule? */
function claimedDiceSatisfy(rule, dice) {
  const sorted = dice.slice().sort((a, b) => a - b)
  switch (rule.type) {
    case 'faces': {
      const want = rule.values.slice().sort((a, b) => a - b)
      return want.every((v, i) => v === sorted[i])
    }
    case 'straight':
      return (
        sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1) &&
        (rule.start == null || sorted[0] === rule.start)
      )
    case 'kind':
      return (
        sorted.every((v) => v === sorted[0]) &&
        (rule.op == null ||
          rule.op === 'any' ||
          compare(sorted[0], rule.op, rule.value, rule.values))
      )
    case 'sum':
      return compare(sum(sorted), rule.op, rule.value, rule.values)
    case 'each':
      return sorted.every((v) => compare(v, rule.op, rule.value, rule.values))
    default:
      return true
  }
}

/** Rules that don't claim dice: "remaining"/"all" scopes and counts. */
function wholeRollRuleHolds(rule, roll, remaining) {
  const scope = rule.dice === 'rest' ? remaining : roll
  switch (rule.type) {
    case 'sum':
      return compare(sum(scope), rule.op, rule.value, rule.values)
    case 'each':
      return scope.every((v) => compare(v, rule.op, rule.value, rule.values))
    case 'count': {
      const c = roll.filter((v) =>
        compare(v, rule.op, rule.value, rule.values)
      ).length
      if (rule.quant === 'exactly') return c === rule.n
      if (rule.quant === 'atMost') return c <= rule.n
      return c >= rule.n
    }
    default:
      return true
  }
}

function combinations(items, k) {
  if (k === 0) return [[]]
  const out = []
  items.forEach((item, i) => {
    combinations(items.slice(i + 1), k - 1).forEach((rest) =>
      out.push([item, ...rest])
    )
  })
  return out
}

/**
 * Try to satisfy every rule in a pattern.
 * Returns null when it can't, otherwise an array mapping each die index to
 * the index of the rule that claimed it (-1 = unclaimed, i.e. a kicker).
 */
function matchPattern(roll, rules) {
  const claiming = []
  const wholeRoll = []
  rules.forEach((rule, ruleIndex) => {
    if (diceClaimed(rule) > 0) claiming.push({ rule, ruleIndex })
    else wholeRoll.push(rule)
  })

  const owner = new Array(roll.length).fill(-1)

  const assign = (i) => {
    if (i === claiming.length) {
      const remaining = roll.filter((_, idx) => owner[idx] === -1)
      return wholeRoll.every((rule) => wholeRollRuleHolds(rule, roll, remaining))
    }
    const { rule, ruleIndex } = claiming[i]
    const free = roll.map((_, idx) => idx).filter((idx) => owner[idx] === -1)
    const k = diceClaimed(rule)
    if (k > free.length) return false
    for (const combo of combinations(free, k)) {
      if (!claimedDiceSatisfy(rule, combo.map((idx) => roll[idx]))) continue
      combo.forEach((idx) => (owner[idx] = ruleIndex))
      if (assign(i + 1)) return true
      combo.forEach((idx) => (owner[idx] = -1))
    }
    return false
  }

  return assign(0) ? owner : null
}

/**
 * Evaluate a query against every possible roll.
 * Query shape: { diceCount, patterns: [{ rules: [...] }], invert }
 * A query with no rules at all matches everything.
 */
function evaluateQuery(query) {
  const n = query.diceCount
  const patterns = (query.patterns || []).filter(
    (p) => p.rules && p.rules.length > 0
  )
  let matched = 0
  let uniqueMatched = 0

  const rolls = enumerateRolls(n).map(({ roll, count }) => {
    let owner = null
    let patternIndex = -1
    if (patterns.length === 0) {
      owner = new Array(n).fill(-1)
    } else {
      for (let i = 0; i < patterns.length && !owner; i++) {
        owner = matchPattern(roll, patterns[i].rules)
        if (owner) patternIndex = i
      }
    }
    const match = query.invert ? !owner : !!owner
    if (match) {
      matched += count
      uniqueMatched += 1
    }
    return {
      roll,
      count,
      key: roll.join(''),
      match,
      owner: match && !query.invert ? owner : null,
      patternIndex: match && !query.invert ? patternIndex : -1,
    }
  })

  const total = Math.pow(6, n)
  return {
    rolls,
    total,
    matched,
    uniqueMatched,
    probability: matched / total,
  }
}

/** Chance at least one of `players` independent rolls matches. */
const atLeastOneOf = (p, players) => 1 - Math.pow(1 - p, players)

/** Problems that make a query impossible or confusing, for the UI. */
function validateQuery(query) {
  const issues = []
  ;(query.patterns || []).forEach((pattern, pi) => {
    const label = `Pattern ${String.fromCharCode(65 + pi)}`
    const needed = (pattern.rules || []).reduce(
      (acc, r) => acc + diceClaimed(r),
      0
    )
    if (needed > query.diceCount) {
      issues.push(
        `${label} needs ${needed} dice but you're rolling ${query.diceCount}, so it can never match.`
      )
    }
    ;(pattern.rules || []).forEach((r) => {
      if (r.type === 'straight' && r.start != null && r.start + r.length - 1 > 6) {
        issues.push(`${label}: a run of ${r.length} can't start at ${r.start}.`)
      }
      if (r.type === 'count' && r.n > query.diceCount) {
        issues.push(
          `${label}: can't have ${r.n} dice out of ${query.diceCount}.`
        )
      }
    })
  })
  return issues
}

/* ── Plain-English descriptions ── */

const KIND_NAMES = {
  2: 'a pair',
  3: 'three of a kind',
  4: 'four of a kind',
  5: 'five of a kind',
}

function listOr(values) {
  if (values.length <= 1) return String(values[0] ?? '?')
  return `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}`
}

function opPhrase(op, value, values) {
  switch (op) {
    case 'eq':
      return `${value}`
    case 'ne':
      return `anything but ${value}`
    case 'lt':
      return `less than ${value}`
    case 'lte':
      return `${value} or less`
    case 'gt':
      return `more than ${value}`
    case 'gte':
      return `${value} or more`
    case 'in':
      return listOr(values || [])
    default:
      return ''
  }
}

const diceWord = (n) => (n === 1 ? '1 die' : `${n} dice`)

function describeRule(rule) {
  switch (rule.type) {
    case 'faces':
      return rule.values.length
        ? `dice showing ${rule.values.join(', ')}`
        : 'specific dice (none chosen yet)'
    case 'straight':
      return rule.start == null
        ? `a run of ${rule.length} in a row`
        : `the run ${Array.from({ length: rule.length }, (_, i) => rule.start + i).join('-')}`
    case 'kind': {
      const name = KIND_NAMES[rule.size] || `${rule.size} of a kind`
      return rule.op == null || rule.op === 'any'
        ? name
        : `${name} of ${opPhrase(rule.op, rule.value, rule.values)}`
    }
    case 'sum': {
      const who =
        rule.dice === 'rest'
          ? 'the remaining dice'
          : rule.dice === 'all'
            ? 'all the dice'
            : diceWord(rule.dice)
      return `${who} adding up to ${opPhrase(rule.op, rule.value, rule.values)}`
    }
    case 'each': {
      const who =
        rule.dice === 'rest'
          ? 'every remaining die'
          : rule.dice === 'all'
            ? 'every die'
            : `${diceWord(rule.dice)}, each`
      return `${who} showing ${opPhrase(rule.op, rule.value, rule.values)}`
    }
    case 'count': {
      const quant =
        rule.quant === 'exactly'
          ? 'exactly'
          : rule.quant === 'atMost'
            ? 'at most'
            : 'at least'
      const dice = rule.n === 1 ? 'die' : 'dice'
      return `${quant} ${rule.n} ${dice} showing ${opPhrase(rule.op, rule.value, rule.values)}`
    }
    default:
      return ''
  }
}

function describePattern(pattern) {
  const parts = (pattern.rules || []).map(describeRule)
  if (parts.length === 0) return 'any roll'
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/* ── Presets ── */

// Game presets mirror checkGame() in game-validation.js exactly; the test
// suite verifies every one against it across all 7,776 rolls.
/* ── Shareable links: /odds-lab/?q=<base64url JSON>&compare=<gameId> ── */

/** A query as a URL-safe string (UI-only `id` fields dropped) */
function encodeQuery(query) {
  const json = JSON.stringify(query, (k, v) => (k === 'id' ? undefined : v))
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/** The query in a `q` parameter, with anything unknown dropped; null if invalid */
function decodeQueryParam(param) {
  try {
    const q = JSON.parse(atob(param.replace(/-/g, '+').replace(/_/g, '/')))
    if (!Number.isInteger(q.diceCount) || q.diceCount < 1 || q.diceCount > MAX_DICE) return null
    if (!Array.isArray(q.patterns)) return null
    const patterns = q.patterns.map((p) => ({
      rules: (Array.isArray(p.rules) ? p.rules : []).filter(
        (r) =>
          r &&
          RULE_TYPES[r.type] &&
          (r.op == null || r.op === 'any' || OPS[r.op]) &&
          (r.values == null || (Array.isArray(r.values) && r.values.every(isNum)))
      ),
    }))
    return { diceCount: q.diceCount, invert: !!q.invert, patterns }
  } catch (e) {
    return null
  }
}

/**
 * The Odds Lab path that opens with `query` loaded, for linking from any
 * odds explanation. `compare` (a kicker game id) checks it against the
 * site's definition of that game.
 */
function oddsLabPath(query, { compare, view } = {}) {
  const params = new URLSearchParams({ q: encodeQuery(query) })
  if (compare) params.set('compare', compare)
  if (view) params.set('view', view)
  return `/odds-lab/?${params}`
}

const faces = (...values) => ({ type: 'faces', values })
const sumOf = (dice, op, value, values) => ({ type: 'sum', dice, op, value, values })

const PRESETS = [
  {
    id: 'ship-captain-crew',
    label: 'Ship, Captain, Crew',
    gameId: 'ship-captain-crew',
    query: { diceCount: 5, patterns: [{ rules: [faces(4, 5, 6)] }, { rules: [faces(1, 2, 3)] }] },
  },
  {
    id: 'monterey',
    label: 'Monterey',
    gameId: 'monterey',
    query: { diceCount: 5, patterns: [{ rules: [faces(2, 3, 4)] }, { rules: [faces(3, 4, 5)] }] },
  },
  {
    id: '10-2',
    label: '10-2',
    gameId: '10-2',
    query: { diceCount: 5, patterns: [{ rules: [sumOf(2, 'eq', 10)] }] },
  },
  {
    id: '10-3',
    label: '10-3',
    gameId: '10-3',
    query: { diceCount: 5, patterns: [{ rules: [sumOf(3, 'eq', 10)] }] },
  },
  {
    id: '10-4',
    label: '10-4',
    gameId: '10-4',
    query: { diceCount: 5, patterns: [{ rules: [sumOf(4, 'eq', 10)] }] },
  },
  {
    id: 'vegas',
    label: "7's",
    gameId: 'vegas',
    query: {
      diceCount: 5,
      patterns: [{ rules: [sumOf(2, 'in', 7, [7, 11]), sumOf(2, 'in', 7, [7, 11])] }],
    },
  },
  {
    id: 'pairs',
    label: 'Pairs',
    gameId: 'pairs',
    query: {
      diceCount: 5,
      patterns: [{ rules: [{ type: 'kind', size: 2, op: 'any' }, { type: 'kind', size: 2, op: 'any' }] }],
    },
  },
  {
    id: 'high-kickers',
    label: 'SCC with high crew',
    query: {
      diceCount: 5,
      patterns: [{ rules: [faces(4, 5, 6), { type: 'each', dice: 'rest', op: 'gte', value: 5 }] }],
    },
  },
  {
    id: 'five-kind',
    label: 'Five of a kind',
    query: { diceCount: 5, patterns: [{ rules: [{ type: 'kind', size: 5, op: 'any' }] }] },
  },
  {
    id: 'large-straight',
    label: 'Five in a row',
    query: { diceCount: 5, patterns: [{ rules: [{ type: 'straight', length: 5, start: null }] }] },
  },
  {
    id: 'razzle-wilds',
    label: '3+ Razzle wilds (1s & 6s)',
    query: {
      diceCount: 5,
      patterns: [{ rules: [{ type: 'count', quant: 'atLeast', n: 3, op: 'in', value: 1, values: [1, 6] }] }],
    },
  },
  {
    id: 'seven-eleven',
    label: '2 dice: 7 or 11',
    query: { diceCount: 2, patterns: [{ rules: [sumOf('all', 'in', 7, [7, 11])] }] },
  },
]

const api = {
  MAX_DICE,
  OPS,
  RULE_TYPES,
  PRESETS,
  compare,
  arrangements,
  enumerateRolls,
  diceClaimed,
  matchPattern,
  evaluateQuery,
  validateQuery,
  atLeastOneOf,
  describeRule,
  describePattern,
  encodeQuery,
  decodeQueryParam,
  oddsLabPath,
}

module.exports = api
