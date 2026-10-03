# Math Fact Frenzy 1.1.1

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
- `version-history.html` — in-app release history, synchronized with this README

## Running it

Open `index.html` directly in a modern browser, or host the folder as a static site (for example, with GitHub Pages).

## Data storage

Full player data is stored in `localStorage`. A small cookie remembers the active player/profile index. Data never leaves the browser unless the user explicitly exports a JSON backup.

Older version-1 and version-2 player data is migrated automatically when the app loads.

## Level behavior

Single-operation timed challenges can unlock the next level by reaching the displayed target score. Mixed modes normally use the lowest unlocked level among their included operations. A successful assessment can independently unlock a higher level for the selected mixed game without changing its component-operation levels.

Subtraction currently avoids negative answers, and division uses whole-number quotients. The structure is ready for later expansion to fractions, decimals, negatives, exponents, or other practice families.

Release version: 1.1.1 (in development; not yet released). The internal saved-data schema remains version 3 for compatibility with existing player backups.

## Version history

### 1.1.1 — In development (updated October 3, 2026)

- **Cache refresh patch:** Versioned JavaScript and stylesheet URLs request fresh assets when the updated page loads, without clearing saved player data.

### 1.1 — Practice and tablet updates

- **Visual practice:** Optional dots, ten frames, equal groups, and proportional area/tape models. Remember each player's choice.
- **Concepts:** Flexible equations, missing numbers, repeated addition, dot groups, square grids, and labeled bars. Use cm, in, ft, or m; retain full question text when pictures are off.
- **Level assessments:** Test a chosen level with 10 questions (12 for all-four mixed). At least 90% correct on first attempts unlocks it without reducing progress or changing timed records. Results and unlocks are saved and exportable.
- **Tablet-friendly play:** Built-in game keypad without the software keyboard, larger touch targets, compact layouts, fullscreen controls, and improved assessment-dialog spacing.
- **Ready? Set? GO!:** A cancelable countdown starts each game, practice session, and assessment before timing begins.
- **Player preferences:** Custom backgrounds remembered in browser storage and cookies and included in JSON backups.
- **Version history:** A redesigned release-history page linked from the footer.

### 1.0 — Initial suite version

- Timed challenges, untimed practice, player profiles, progress tracking, and JSON backups.
- Teaching Apps copyright, credits, and return link.

The README is the canonical release log; keep version-history.html in sync with it. App release numbers are separate from the saved-data schema version. Keep this development batch at 1.1.1 until committed.
When JavaScript or CSS changes, update the asset query identifiers in index.html and version-history.html together. Use a new build suffix for further changes within the same release.
