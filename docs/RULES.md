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
- **Cocked, stacked or off the table: re-roll** (ruled 2026-10-22). A die that doesn't land flat (leaning on the cup, a die or the table edge), lands on top of another, or leaves the table doesn't count and is re-rolled; for stacked dice, both are. Only matters at a real table: the engine's dice always land flat. [confirmed]
- Each player starts with 0 **pencils**. 3 pencils = out. Last player standing wins the pot. [site]

## 2. A round

1. **Roll.** The Hammer says **"coming out"** to start the round, then everyone rolls all 5 dice and keeps them hidden. [confirmed] This roll is everyone's **roll 1** for whatever game ends up being played, including after a second call. [site] [confirmed]
   - Only the Hammer and the refusals need their dice before the call. Everyone else may leave theirs in the cup until the Hammer calls, then roll for the call; that roll is still their roll 1 (ruled 2026-10-21; Play works this way). [confirmed]
2. **Call or bark.** The Hammer looks at their dice and either:
   - **calls** a game, including a high/low variant for kicker games (e.g. "10-3 High"), or
   - **barks:** the Hammer passes to the player on the left, everyone picks up, and the round starts over with a fresh roll and the new Hammer calling. [confirmed]
3. **Refusal.**
   - **1st refusal** (Hammer's left) accepts or refuses.
   - If they refuse, **2nd refusal** (two seats left) accepts or refuses. [site]
   - If either accepts, **everyone plays the call**, including a refuser who refused. A refuser who already has the game keeps their roll and doesn't have to re-roll; nobody is forced to re-roll because they refused. [confirmed]
   - If both refuse, the Hammer makes a **second call**. It must be a different game (not just the other variant), and it can't be refused. Everyone plays it. [site] [confirmed]
   - **2 players:** there's only a 1st refusal. If they refuse, the Hammer makes the second call and both play it. [confirmed]
4. **Play** the called game (section 3), then **find the loser** (section 4).
5. **Score.** The loser takes a pencil and becomes the next Hammer. [site]
   - A player with 3 pencils is out; if the Hammer would pass to them, it goes to the next active player on the left. [site]

## 3. Playing a game

### 3.1 Default: kicker games (10-2, 10-3, 10-4, Ship Captain Crew, Monterey, 7's, Pairs)

- **Up to 3 rolls total.** The initial hidden roll is roll 1. [confirmed]
- Between rolls a player may keep some dice and re-roll the rest, or stop at any time. Re-rolling is optional. [confirmed]
- **Only dice toward the game may be kept** (ruled 2026-10-19). [confirmed]
  - **10-2, 10-3, 10-4:** nothing until the game is made. A 10 has to come in **one roll**, so each roll is a fresh try with all five dice. Once made, keep the dice that make it.
  - **Ship Captain Crew:** keep **1-2 or 5-6**, never both, or the made 1-2-3 / 4-5-6.
  - **Monterey:** keep a connector, **2-3, 3-4 or 4-5**, or the made 2-3-4 / 3-4-5. Some tables also allow a lone 3 or 4 (§5).
  - **7's:** keep **one pair** summing to 7 or 11 (1-6, 2-5, 3-4, 5-6), or both pairs once made. Not three dice toward two pairs (e.g. not 1-5-6).
  - **Pairs:** keep **one pair**, or both pairs once made. Never a kicker die.
  - A player who holds nothing to keep re-rolls all five.
- **Kept dice stay kept.** Once kept, a player is committed to those dice for the rest of their rolls: every later keep holds them (e.g. keep 1-2 in Ship Captain Crew and you can't switch to 5-6 or re-roll all five). [confirmed]
- **Kept dice are part of the game** (ruled 2026-10-20). The game has to be made with the kept dice in it, the rest coming from the dice rolled. [confirmed]
  - 7's and Pairs: a kept pair stays one of the two pairs. Keep 5-6 and the other 7 or 11 has to come from the three dice rolled: the 5 can't pair with a rolled 2, nor the 6 with a rolled 1.
  - Ship Captain Crew: keep 1-2 and only a 3 makes it; a rolled 4-5-6 doesn't. Monterey: keep 2-3 and the game is 2-3-4.
- **A made game can't be re-rolled** (ruled 2026-10-20). Once a player's dice make the game, they keep the dice that make it and re-roll the whole kicker, or stand: e.g. in 10-2, a 5-5 can't be picked up and rolled again. Only Razzle and Boss let a player pick up the dice that make their hand (§3.2, §3.3). [confirmed]
- The engine enforces all of these (`keepProblem` and `evaluateKickerHand` in `src/engine/rules/kicker-games.ts`; the committed dice are `rolling[player].kept`, read back with `keptAt`). Razzle, Boss and Tres Away have their own keep rules (§3.2–3.4).
- **Making the game: everyone who missed rolls on their own** (ruled 2026-10-21; order left to the players, ruled 2026-10-29). Anyone who hasn't made the game rolls when they like, before, after or alongside the others who haven't, until they make it or run out of rolls. There's no fixed order: waiting to see someone else's roll gains nothing here, so players usually roll straight away. Missing is the worst hand, so nobody who made the game rolls meanwhile. [confirmed] (`rollers` in `src/engine/round/game.ts`)
- **Then the worst hand rolls first** (§4), not in seat order: only the player at the bottom rolls, until they climb off it or run out of rolls. [confirmed]
- **Showing the game** (ruled 2026-10-21, revised 2026-10-22; hard mode in Play). A player shows the dice that make their game, or says they missed it. Each pick is checked as it's made: a set that isn't the game (wrong dice, or too many, like 5-3-2 for 10-2) is "not a valid game", and the player either fixes the pick (then shows it and rolls the kicker or stands) or rolls all five. Saying they missed means rolling all five; say it while holding the game and they pick up all five too. Rolling all five this way uses a roll; with no roll left, the hand misses the game. [confirmed] (`showCheck` in `src/components/Play/play-model.ts`; the `misread` action; `isGameSet` checks a shown game)
- **Dice are visible to everyone** from the start of play onward; only the initial roll is hidden (until play starts). [confirmed]
- A player tries to **make the game** and then get a kicker that beats the worst kicker at the table (e.g. in 10-3, roll until you have the game and a better kicker than the worst player). [confirmed]
- **Terminology: "the kicker" is all the remaining dice together** (one die in 10-4, three in 10-2), not each die. Say "a kicker of 6+1", never "kickers 6 and 1" or "a good kicker and a bad one". [confirmed]
- **The kicker is rolled whole.** Once the dice a player keeps make the game, only those dice stay on the table: the player re-rolls the **whole** kicker or stops. They can't keep part of the kicker (e.g. with 10-3 made by 2+4+4 and a kicker of 6+1, they re-roll both the 6 and the 1). This is what makes 10-2 interesting: its three-dice kicker is re-rolled as a block, so a total near the top or bottom of the range is very hard to beat. [confirmed]
  - The engine rejects a keep that holds a set making the game plus extra dice.
- **The kicker** is the dice not used to make the game, scored as an **additive total**:
  - **High:** higher total wins; **Low:** lower total wins.
  - Example: a kicker of 5+6 = 11 beats 5+5 = 10 in High. [confirmed]
  - When several dice combinations make the game, the player uses the combination that gives the best kicker total for the called variant, among those holding their kept dice. [inferred]
- **Only the kicker** decides between players who made the game. The dice that made the game never matter (e.g. in Pairs, 6-6-5-5 and 2-2-3-3 are equal before the kicker; in SCC, 1-2-3 and 4-5-6 are equal). A player only has a kicker once they've made the game. [confirmed]

**Making each game** (any dice order): [site] (matches `checkGame` in `game-validation.js`)

| Game | Made with | Kicker |
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
- **Putting out dice:** after every roll a player must **put out at least 1 die** before rolling again. Put-out dice are final. The player re-rolls only the dice still in hand, so a player rolls at most 5 times (5, 4, 3, 2, 1 dice). A player with no dice left is done. [confirmed]
- **Dice in hand keep their values between turns.** On a later turn a player may put out dice from their hand as they are, without rolling, or roll every die still in hand. That lets them watch the table first: holding a 4 when an opponent has just put out a 6, they can put the 4 out and be sure not to lose to that player. [confirmed]
- **The caller sets the pace.** [confirmed]
  1. The caller puts out dice from their roll: at least 1, as many as they like.
  2. Everyone else puts out dice until they have **as many dice out as the caller, and never more**.
  3. Starting with the player on the caller's left and going around, each player catches up: put out at least 1 die (from their hand, or after a roll), then roll and put out at least 1 after each roll until they've matched the caller's count. Then the next player goes.
  4. Then it's the caller's turn again: they put out another die (or several), from their hand or after rolling, and the cycle repeats until all dice are out.
- **A replay goes one die at a time** (tied highest scores replay, §4): nobody sets the pace; each player puts out exactly one die per turn, instead of matching the caller's count. Only in a replay; the main game keeps the caller's pace. (ruled 2026-10-30) [confirmed] The tied player nearest the caller, going left, goes first [inferred]. (`tresAwayMaxPutOut` in `src/engine/round/game.ts`)
- The loser is the highest score once everyone has all 5 dice out. [site]

### 3.3 Boss

- **Hands** (high to low), poker-style without straights or flushes: five of a kind, four of a kind, full house, three of a kind, two pair, pair, high card. Ties use poker tie-breaks (e.g. 6s-over-2s beats 5s-over-4s). [site]
- **Flow:** [confirmed] [site]
  1. Everyone reveals their initial roll. The best hand is the **Boss**. If two or more players tie for the best hand, there's **no Boss**: the game ends with no loser, the Hammer passes left, and a new game starts. [confirmed]
  2. The Boss rolls **once more**, **hidden** from the table. They may pick up any dice, **except dice that would make someone else the Boss** (ruled 2026-10-20): the dice they keep must still beat every other player's hand on their own. E.g. with a full house they may pick up the pair only if three of a kind still beats the table. The kept dice are ranked as they stand, with no kicker, so matching another hand isn't enough. [confirmed] (`bossKeepProblem` in `src/engine/rules/specialty-games.ts`)
  3. Then the Boss chooses. The Boss may also skip the extra roll and choose straight away (ruled 2026-10-21): roll, come up, or pick 'em up. [confirmed]
     - **"Come up":** every other player gets **one last roll** to avoid losing. They may keep any dice or re-roll all five, and each result is shown as soon as it's rolled. Then **the worst hand at the table loses, and that can be the Boss.** For example, a Boss who calls everyone up on two pair loses if everyone else rolls three of a kind.
     - **"Pick 'em up"** (also "don't come up"): the game ends with **no loser**, and the Hammer passes left.
  - Common strategy debate: holding a single 6, keep it and roll 4 dice, or re-roll all 5?
- **Tie for worst hand:** the tied players play again, just them. Hands only tie if they match exactly; otherwise poker rules decide (a pair of 6s beats a pair of 5s; 5s over 2s beats 4s over 3s). [confirmed] If the replaying players then tie for the best hand, it's the same as in the main game: **no Boss**, nobody loses and the Hammer passes left (ruled 2026-10-29). [confirmed] (`enterPlay` in `src/engine/round/game.ts`)
- **Coming up is in a fixed order** from the Boss's left, as in Tres Away (ruled 2026-10-29): each player takes their last roll in turn, so a player deciding between strategies (e.g. two pair: go for a full house?) sees what the players before them rolled. [confirmed] (`assertActor` in the `comeUp` stage, `src/engine/round/game.ts`)

### 3.4 Razzle

- **3 rolls**, dice visible, played from the bottom like the kicker games (§4): the lowest hand rolls first. [confirmed]
- **Score:** the most of any one number, with **1s wild for any number**. Example: 1-1-1-4-x is four 4s. [confirmed]
- **Lowest score loses.** A higher count beats a lower count; **equal counts are broken by face value** (four 6s beat four 4s). Only identical hands tie (e.g. two players each with three 1s and a 4 both have four 4s), and the tied lowest hands play Razzle again until one loses. [confirmed]
- Example: Ava holds two 5s, the lowest hand, and the next-lowest is your three 2s. Ava rolls until she beats three 2s; if she runs out of rolls first, she takes the pencil and nobody else rolls. Once she beats it, you're the lowest hand, so you roll. [confirmed]
- Example: holding 1-1-1-4 (four 4s) against 6-6-6-1 (four 6s) with a roll left, the first player may pick up the 4 and the other dice and roll for 1s and 6s to tie or beat four 6s. [confirmed]
- Re-rolling everything is common and allowed. For example, a player holding three 2s may pick them all up to chase 1s and 6s once someone else shows three 6s. [confirmed]

## 4. Finding the loser

- **The worst hand rolls first** (kicker games and Razzle; Tres Away and Boss have their own order). [confirmed] After the first roll, whoever holds the worst hand is the loser at that moment, so they roll, and keep rolling until they climb off the bottom or run out of rolls. Then whoever holds the worst hand now rolls. If the worst hand never improves, nobody else has to roll, and they take the pencil. "Worst" follows the call: missing the game is worst; in a Low call, the highest kicker is worst. The engine enforces it (`bottomTurn`, `bottomTarget` in `src/engine/round/game.ts`).
- **All day** means out of rolls: that hand is final. A player whose hand is already better than a hand that's all day is **in the cup** (safe): they can't lose the round and never roll again in it. In Boss a player is in the cup only once their own last roll is taken (a last roll can make a hand worse); in Tres Away, once another player's worst possible score is certainly beaten. `standings()` in `src/engine/round/standings.ts` ranks the table from public information; a random-games test checks nobody in the cup ever takes the pencil.
  - Several players tied at the bottom: whoever has **the most rolls left** rolls first, until the tied players have used the same number of rolls. Then the tied player nearest the Hammer (going left, Hammer first) rolls first, and each tied player in turn decides again: take the tie or roll. A player who ties again after rolling doesn't keep rolling while a tied player has more rolls left. [confirmed] Example: Ben has 1 roll left and Cass 2, so Cass decides first; if she takes the tie, Ben decides (ruled 2026-10-29).
- **Kicker games:** [confirmed]
  - Anyone who made the game beats anyone who didn't.
  - **Exactly one** player misses: they lose.
  - **Two or more** miss: everyone who made it is **safe**. The players who missed start a new **cycle**: the same called game (variant included) with 3 fresh rolls each. This repeats with whoever still misses until a single loser emerges. If everyone in a cycle makes it, the worst kicker among them loses.
  - **Everyone** made it: the **weakest hand** loses. The call (game + High/Low) defines what's weakest, so no separate kicker comparison is needed: in 10-3 High, a player with a kicker of 2+1 = 3 loses to everyone with a higher kicker. [confirmed]
- **Ties for the loser:**
  - The tied players **replay the same called game, variant included**, starting over with fresh rolls, until one loser remains. [confirmed] (A Boss replay can also end with no loser: a tie for the best hand, §3.3.)
  - **No standing at the bottom:** the worst hand has no choice: it rolls while it has rolls, and loses when it's out. The engine rejects `stand` there (`wouldLoseIfStopped`). [confirmed]
  - **Taking a tie:** on their turn, a player tied for the weakest hand who still has a roll left may stand and **take the tie**, or roll in hope of beating it, even while the others tied with them can still roll (ruled 2026-10-29). [confirmed] **A tie needs every tied player to take it:** taking it is an offer. If another tied player rolls instead and climbs off the bottom, the player who took the tie is the worst hand again and rolls with the rolls they have left (two or more left tied who all took it replay); if the roller ends up the worst hand, they lose and there's no tie. The owner: "'Taking a tie' requires multiple players to agree to it before it happens." Tables sometimes refuse a tie on purpose and roll to climb past a higher hand, to "bring him back in": it can be worse odds, but it's shorter and can still hand the leader the pencil. (`wouldLoseIfStopped`, `reopenTie` in `src/engine/round/game.ts`; a missed game still rolls on while another miss can roll.) [confirmed] Tables usually take the tie when the tied kicker is strong; when the chance of losing on a last roll is lower than the chance of losing the replay, rolling is right. `rollOrTakeTie` in `src/strategy/kicker-odds.ts` computes both exactly (e.g. tied at 5+5 in 10-3 High with 2 rolls left: rolling loses ~77% even using both rolls, and 87.5% on a last roll; the replay ~50%). It counts every roll left: falling short means rolling again, and landing level is the same choice again.
  - **Exception, 2-player table:** when only 2 players are left in the whole game and they tie, or **both miss the game**, no pencil is taken and the Hammer passes to the other player. [confirmed]

## 5. House rules (configurable)

House rules must be **selectable site-wide** (header or user preferences). Changing them **recalculates every probability** on the site. Game detail pages should also explain common variations and their effect on the odds, because experts may be checking the odds for the exact variant their table is playing. [confirmed]

Known variations to support:

- **Ante** amount; extra money added at **parity** (all remaining players have 2 pencils); some groups reset pencils at parity. [site]
- **Barking** allowed or not. [site]
- **Monterey keep requirement** (`montereyLoneKeep`, built): some tables let a player keep a lone 3 or 4, not only 2-3 / 3-4 / 4-5. Off by default. Visitors set it under House rules in Settings; every odds figure follows it, using tables generated for both rule sets. [confirmed, example given by owner]
- More will be collected as they come up; each needs a precise definition here before it's implemented.

## 6. Open questions

Engine choices made without a ruling yet (the engine does the [inferred] thing until told otherwise):

1. ~~**Tres Away replay: who sets the pace?**~~ Nobody: in a replay each player puts out one die at a time (ruled 2026-10-30, §3.2). The owner: "each player puts out 1 die at a time in tre's away, rather than defaulting to the number of dice that the Hammer started with … That's only in a tie where they replay Tre's away." Who goes first stays [inferred]: the tied player nearest the caller.
2. ~~**Boss replay: a tie for the best hand.**~~ No Boss, no loser, and the Hammer passes left, as in the main game (ruled 2026-10-29, §3.3). The owner: "If two players tie for the best hand, then there's 'No boss' and the call passes to the left."
3. ~~**Boss: may the Boss skip the extra roll?**~~ Yes: roll, come up, or pick 'em up (ruled 2026-10-21, §3.3).
4. ~~**Tied at the bottom: who rolls first?**~~ Most rolls left decides first, then going left; a tie can be taken while another tied player can still roll, and holds only if every tied player takes it (ruled 2026-10-29, §4). The owner: "If Ben has 1 roll and Cass has 2 rolls, then it's Cass's decision to take a tie or roll. If she opts to take a tie then it goes back to Ben… If one player doesn't agree to it and rolls, if they become the worst hand then they lose and no tie is established." Still open: with equal rolls the owner said "clockwise (left of the dealer)"; the engine starts with the Hammer when the Hammer is tied [inferred].
5. ~~**Boss "come up": strict order?**~~ Yes: a fixed order from the Boss's left, just like Tres Away (ruled 2026-10-29, §3.3). The engine already enforced it.
6. ~~**Making the game: all at once, or in order?**~~ Neither is required: each player rolls when they like (ruled 2026-10-29, §3.1). The owner: "Typically players will roll immediately if there's no advantage to them waiting for another player to roll … Ultimately, I don't think it's a hard/fast rule, so we could leave it up to the player to decide." They added that in Tres Away and Boss a player whose hand might depend on another's result will wait for it, which is why those two games keep a fixed order (question 5).
7. ~~**Cocked and stacked dice**~~: re-rolled, and so is a die off the table (ruled 2026-10-22, §1).
8. ~~**Showing the wrong dice (hard mode)**~~: a pick is checked as it's made; fix it, or roll all five (ruled 2026-10-22, §3.1).

## Resolved questions (2026-10-14)

Players who miss the game cycle until there's one loser; dice are visible during play (except Tres Away/Boss); the initial roll counts after a second call; re-rolling was unrestricted except in Tres Away (superseded 2026-10-19: only dice toward the game may be kept, and kept dice stay kept; 2026-10-20: kept dice are part of the game and a made game can't be re-rolled, §3.1); Boss re-rolls once keeping their hand (2026-10-20: any keep that still beats the table, §3.3), others keep anything, and the Boss can lose; Razzle 1s are wild for any number; only the kicker breaks ties. Boss: a tie for the best initial hand means no Boss and a new game; Razzle: face value breaks equal counts; 2-player table: both missing is a tie (no pencil, Hammer passes); with 2 players there's only a 1st refusal, and a refusal goes straight to the second call.
