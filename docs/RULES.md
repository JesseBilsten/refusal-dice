# Refusal Dice — Rules Specification

This is the **authoritative rules reference** for the game engine (`src/engine/`, see [ROADMAP.md](../ROADMAP.md)). It's more precise than the player-facing Rules page, and the engine's tests are written against it. When a rule changes, update this file first.

Each rule is tagged by where it came from:

- **[confirmed]**: stated by the project owner (2026-10-14).
- **[site]**: taken from the existing site copy (`rules.js`, `games.js`, `glossary.js`); not contradicted.
- **[inferred]**: our best reading; needs confirmation. These are also listed under _Open questions_.

---

## 1. Setup

- 2–8 players, 5 dice each, ante into a pot (amount and whether it's played for money are house rules). [site]
- **Piddle:** everyone rolls one die; highest roll takes the **Hammer**; ties re-roll. [site]
- Each player starts with 0 **pencils**. 3 pencils = out. Last player standing wins the pot. [site]

## 2. A round

1. **Roll.** Everyone rolls all 5 dice and keeps them hidden. This roll is everyone's **roll 1** for whatever game ends up being played, including after a second call. [site] [confirmed]
2. **Call or bark.** The Hammer looks at their dice and either:
   - **calls** a game, including a high/low variant for kicker games (e.g. "10-3 High"), or
   - **barks:** the Hammer passes to the player on the left, everyone picks up, and the round starts over with a fresh roll and the new Hammer calling. [confirmed]
3. **Refusal.**
   - **1st refusal** (Hammer's left) accepts or refuses.
   - If they refuse, **2nd refusal** (two seats left) accepts or refuses. [site]
   - If either accepts, **everyone plays the call**, including a refuser who refused. A refuser who already has the game keeps their roll and doesn't have to re-roll; nobody is forced to re-roll because they refused. [confirmed]
   - If both refuse, the Hammer makes a **second call**. It must be a different game (not just the other variant), and it can't be refused. Everyone plays it. [site] [confirmed]
4. **Play** the called game (section 3), then **find the loser** (section 4).
5. **Score.** The loser takes a pencil and becomes the next Hammer. [site]
   - A player with 3 pencils is out; if the Hammer would pass to them, it goes to the next active player on the left. [site]

## 3. Playing a game

### 3.1 Default: kicker games (10-2, 10-3, 10-4, Ship Captain Crew, Monterey, 7's, Pairs)

- **Up to 3 rolls total.** The initial hidden roll is roll 1. [confirmed]
- Between rolls a player keeps whatever dice they choose and re-rolls the rest. Re-rolling is optional, and a player can stop at any time. [confirmed]
  - **No rule forces a player to keep dice.** A player may re-roll any dice, including all five, even dice that already made the game. New players sometimes do this by accident. In practice nobody breaks up a made game, and the table might object, but there's no hard rule against it. The engine allows it. Strategy tools should flag it as almost always a mistake (to be checked case by case with the owner). [confirmed]
- **Everyone rolls at the same time** (not in turn order). [confirmed]
- **Dice are visible to everyone** from the start of play onward; only the initial roll is hidden (until play starts). [confirmed]
- A player tries to **make the game** and then get kickers that beat the worst kicker at the table (e.g. in 10-3, roll until you have the game and a better kicker than the worst player). [confirmed]
- **Kickers** are the dice not used to make the game, scored as an **additive total**:
  - **High:** higher total wins; **Low:** lower total wins.
  - Example: kickers 5+6 = 11 beat 5+5 = 10 in High. [confirmed]
  - When several dice combinations make the game, the player uses the combination that gives the best kicker total for the called variant. [inferred]
- **Only kickers** decide between players who made the game. The dice that made the game never matter (e.g. in Pairs, 6-6-5-5 and 2-2-3-3 are equal before kickers; in SCC, 1-2-3 and 4-5-6 are equal). A player only has a kicker once they've made the game. [confirmed]

**Making each game** (any dice order): [site] (matches `checkGame` in `game-validation.js`)

| Game | Made with | Kickers |
|---|---|---|
| 10-2 | 2 dice summing to 10 | other 3 |
| 10-3 ("Frankie") | 3 dice summing to 10 | other 2 |
| 10-4 ("Shotgun") | 4 dice summing to 10 | other 1 |
| Ship Captain Crew | 1-2-3 or 4-5-6 | other 2 |
| Monterey | 2-3-4 or 3-4-5 | other 2 |
| 7's ("Vegas") | two separate pairs, each summing to 7 or 11 | other 1 |
| Pairs | two pairs (four of a kind counts) | other 1 |

### 3.2 Tres Away

- **Score:** sum of the dice, where **3s count 0**. **Lowest score wins**; **highest score loses**. Perfect = 0 (five 3s), worst = 30 (five 6s). [site] [confirmed]
- **Hidden dice:** a player's rolled dice stay hidden until they put dice out. Put-out dice are shown and added to their score; the rest stay hidden. A last single die doesn't matter, since it's put out as soon as it's rolled. [confirmed]
- **Putting out dice:** after every roll a player must **put out at least 1 die**, and may put out more. Put-out dice are final. The player re-rolls only the dice still in hand, so a player rolls at most 5 times (5, 4, 3, 2, 1 dice). A player with no dice left is done. [confirmed]
- **The caller sets the pace.** [confirmed]
  1. The caller puts out dice from their roll.
  2. Everyone else must keep rolling until they have **as many dice out as the caller**.
  3. Starting with the player on the caller's left and going around, each player rolls until they've matched the caller's count, then the next player goes.
  4. Then the caller puts out another die (or several) and the cycle repeats until all dice are out.
- The loser is the highest score once everyone has all 5 dice out. [site]

### 3.3 Boss

- **Hands** (high to low), poker-style without straights or flushes: five of a kind, four of a kind, full house, three of a kind, two pair, pair, high card. Ties use poker tie-breaks (e.g. 6s-over-2s beats 5s-over-4s). [site]
- **Flow:** [confirmed] [site]
  1. Everyone reveals their initial roll. The best hand is the **Boss**.
  2. The Boss rolls **once more**, **hidden** from the table, and **must keep the dice that made them the Boss** (e.g. no dice from a full house may be picked up). Breaking the hand would mean they're no longer the Boss.
  3. Then the Boss chooses:
     - **"Come up":** every other player gets **one last roll** to avoid losing. They may keep any dice or re-roll all five, and each result is shown as soon as it's rolled. Then **the worst hand at the table loses, and that can be the Boss.** For example, a Boss who calls everyone up on two pair loses if everyone else rolls three of a kind.
     - **"Don't come up"** (also "pick them up"): the game ends with **no loser**, and play passes left.
  - Common strategy debate: holding a single 6, keep it and roll 4 dice, or re-roll all 5?
- **Tie for worst hand:** the tied players play again, just them. Hands only tie if they match exactly; otherwise poker rules decide (a pair of 6s beats a pair of 5s; 5s over 2s beats 4s over 3s). [confirmed]
- In principle the other players act in order, but they often roll early when waiting gains them nothing. A player deciding between strategies (e.g. two pair: go for a full house?) may wait to see what the players before them do. [confirmed]

### 3.4 Razzle

- **3 rolls**, everyone at once, dice visible (same as the default). [confirmed]
- **Score:** the most of any one number, with **1s wild for any number**. Example: 1-1-1-4-x is four 4s. [confirmed]
- **Lowest score loses.** Equal scores tie (e.g. two players each with three 1s and a 4 both have four 4s), and the tied lowest hands play Razzle again until one loses. [confirmed]
- Re-rolling everything is common and allowed. For example, a player holding three 2s may pick them all up to chase 1s and 6s once someone else shows three 6s. [confirmed]

## 4. Finding the loser

- **Kicker games:** [confirmed]
  - Anyone who made the game beats anyone who didn't.
  - **Exactly one** player misses: they lose.
  - **Two or more** miss: everyone who made it is **safe**. The players who missed start a new **cycle**: the same called game (variant included) with 3 fresh rolls each. This repeats with whoever still misses until a single loser emerges. If everyone in a cycle makes it, the worst kicker among them loses.
  - **Everyone** made it: the worst kicker total loses.
- **Ties for the loser:**
  - The tied players **replay the same called game, variant included**, starting over with fresh rolls, until one loser remains. [confirmed]
  - **Exception, 2-player table:** when only 2 players are left in the whole game and they tie, no pencil is taken and the Hammer passes to the other player. [site]

## 5. House rules (configurable)

House rules must be **selectable site-wide** (header or user preferences). Changing them **recalculates every probability** on the site. Game detail pages should also explain common variations and their effect on the odds, because experts may be checking the odds for the exact variant their table is playing. [confirmed]

Known variations to support:

- **Ante** amount; extra money added at **parity** (all remaining players have 2 pencils); some groups reset pencils at parity. [site]
- **Barking** allowed or not. [site]
- **Monterey keep requirement:** some tables only require keeping a 3 or 4, rather than 2-3 / 3-4 / 4-5 partials. [confirmed, example given by owner]
- More will be collected as they come up; each needs a precise definition here before it's implemented.

## 6. Open questions

1. **Boss: tie for the best initial hand.** If two players tie for the best initial hand, who's the Boss?
2. **Razzle: face value.** Does a higher face break a tie between equal counts (four 6s vs four 4s), or is it count only?
3. **Two players left: refusal.** With only 2 players, there's no second refusal seat. [inferred: the one refuser decides; if they refuse, the Hammer makes a second call]
4. **2-player tie vs. missing.** At a 2-player table, if both players miss the game, is that a "tie" (no pencil, Hammer passes) or a new cycle? [inferred: a new cycle, since missing isn't a kicker tie]

## Resolved questions (2026-10-14)

Players who miss the game cycle until there's one loser; dice are visible during play (except Tres Away/Boss); the initial roll counts after a second call; re-rolling is unrestricted except in Tres Away; Boss re-rolls once keeping their hand, others keep anything, and the Boss can lose; Razzle 1s are wild for any number; only kickers break ties.
