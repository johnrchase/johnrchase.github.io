# Math Fact Frenzy 1.0

A browser-only math-facts game for elementary and middle-school students. No server, account, database, framework, or external library is required.

## Features

- Player profiles stored locally in the browser
- 24 avatar choices with animated cheering, dancing, bouncing, and encouragement
- Addition, subtraction, multiplication, and division
- Mixed addition/subtraction, mixed multiplication/division, and all-four-operation modes
- Eight difficulty levels per operation
- 60-second scored challenges
- Untimed practice for every operation and mixed mode; practice contributes to lifetime activity totals but does not affect points, best scores, or unlocks
- Exact problems are never repeated twice in a row (commuted facts such as `0 × 5` then `5 × 0` are allowed)
- Progress dashboard with current level/mastery by core skill, lifetime accuracy, attempts, correct answers, time played, streaks, active days, and recent activity
- One-click next-level play when the next level is available
- Optional browser-generated sound effects and confetti
- Per-player JSON export/import
- Full-game JSON export/import for backing up all players
- Main player screen shows combined time, attempts, correct answers, and accuracy across all saved players
- Responsive on desktop, tablet, and mobile

## Files

- `index.html` — page structure
- `styles.css` — layout, responsive design, and animations
- `app.js` — profiles, question generation, gameplay, persistence, exports, and progress tracking
- `favicon.svg` — site icon

## Running it

Open `index.html` directly in a modern browser, or host the folder as a static site (for example, with GitHub Pages).

## Data storage

Full player data is stored in `localStorage`. A small cookie remembers the active player/profile index. Data never leaves the browser unless the user explicitly exports a JSON backup.

Older version-1 and version-2 player data is migrated automatically when the app loads.

## Level behavior

Single-operation timed challenges can unlock the next level by reaching the displayed target score. Mixed modes use the lowest unlocked level among their included operations, so a mixed level never introduces a difficulty the player has not unlocked in each component skill.

Subtraction currently avoids negative answers, and division uses whole-number quotients. The structure is ready for later expansion to fractions, decimals, negatives, exponents, or other practice families.

Release version: 1.0. The internal saved-data schema remains version 3 for compatibility with existing player backups.
