# Total Teacher Toolkit 2.0

A browser-based classroom toolkit with Groups & Tools, Seating Chart, and an independent Room Designer. Open `index.html` or serve this folder as a static site. Keep its JavaScript, CSS, artwork, question bank, and backgrounds together.

The canonical folder is `total-teacher-toolkit/`. The old `class-team-generator/` entry points redirect here, preserving query strings and fragments. Browser storage keys and JSON format identifiers retain their legacy names so existing saved data remains compatible. Downloads use the new app name.

## Groups & Tools

Choose a saved class or use New class, Rename, Save, and Delete. Edit names accepts one student per line, including First Last or Last, First. Shared First/Last/Both controls determine displayed names.

Randomize groups, set group count or target size, generate themed names, and choose member labels. The adjacent gear chooses eligible symbols. Jigsaw gathers matching labels across groups; Un-jigsaw restores the original groups. Drag to reorder groups or members, or temporarily remove and restore students/groups. Grouping rules support together/apart preferences.

Display presents groups and optional Activity Instructions. Export includes share links, text, JSON backups, and Export Groups Image. The image dialog controls columns, spacing, fonts, title, colors, borders, member labels, instructions, highlights, and an optional neutral Removed box. Copy PNG, download PNG/JPG, or print the generated image. Show tools hides or reveals the desktop tools dock.

## Room Designer

Room designs contain furniture and seat properties, independently of classes. Class and roster controls are disabled here. Select saved layouts directly; use Rename, New, Save, Save Copy, and confirmed Delete. Copies receive unique Copy of names. Saved! remains visible until the next edit.

New offers Portrait, Landscape, Square, and Custom layouts, including empty rooms, desk grids, table/desk groups, stadium seating, layered horseshoes, and discussion circles. Configure rows, columns, seats, and forward-facing arrangements.

Use the collapsible Objects/Edit tray to add furniture. Adding keeps Objects open; selection shows properties, while double-click also expands a collapsed tray. Support includes drag/resize/rotate, multi-selection, layers, grouping, table groups, snapping, undo/redo, copy/cut/paste/duplicate, arrow movement, bracket-key rotation, and Space-drag pan. Rotation preserves selection centers. Loaded layouts default to Fit room.

Numbering controls sit beside Room Settings. Choose rows, columns, snakes, or clockwise table numbering; drag a number onto another to swap them. Edit individual seat numbers in object properties. Chairs can be unavailable for student assignment. Office and lounge seating starts unavailable; enable it when needed. Surface colors, finishes, labels, and text formatting depend on the object. The trashcan includes an Empty-to-Overflowing slider.

## Seating Chart

Charts belong to the current class. Save alternatives or Save Copy; changing layouts starts a new working chart and clears stale saved-chart selection. Sync roster updates students from the current class. Drag names onto chairs, swap occupied chairs, or select seats for locks/removal. Empty seats remain chair graphics.

The settings gear controls seat-number display, empty-seat labels, and respect for grouping rules, empty seats, priority seating, and locked seats. These respect options default on. With Respect empty seats on, Randomize preserves occupied chair locations; with it off, Randomize can use spare chairs throughout the room. Fill supports random/first-name/surname ordering from the front. Shuffle within tables retains table membership. Turn off Respect empty seats before filling a completely empty room.

Together/apart rules use table or conceptual table-group boundaries. Impossible constrained fills report a warning; manual moves can violate rules and show a toolbar warning emoji with clickable details. Student Priority checkboxes live in the Students tray. Mark priority seat locations in Room Designer. Disabled respect options temporarily ignore saved preferences.

Teacher/Student view rotates the editor perspective. Display for class fills the screen without settings and includes a view switch. Export provides clipboard PNG, PNG/SVG, Print / Save PDF, and seating JSON backup/import. Public images omit private priority/lock markers; image margins are transparent and the floor stays opaque.

## Tools and mobile

The five tools are Random Picker, Countdown timer, Stopwatch, Community Builder, and Clock. Tools can collapse, enlarge, or pop out; pop-outs have tool tabs and responsive controls. Stopwatch decimals can be hidden completely. Community Builder includes previous-question history. Desktop backgrounds and tool visibility/styles are remembered.

Phones get Groups and Tools tabs, readable full-width groups, touch-sized controls, and a single-tool chooser. Desktop version exposes all features, including seating and room design; Mobile version returns to the phone interface.

Groups Undo/Redo beside Jigsaw restores student moves, randomizations, group order and names, removals/restores, sizing, and Jigsaw changes. Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redoes outside text fields. History is session-only, resets on class/roster changes, and new changes clear redo. A warning emoji at the toolbar edge shows the count on hover and opens rule details.

## Data and validation

The shared **? Help** button opens a searchable guide for the current workspace. Press `?` outside a text field for keyboard shortcuts. The guide covers first use, groups, room design, seating settings, seat numbers, saving, privacy, exports, mobile, and troubleshooting. Dialogs support keyboard focus containment and return; menus support arrow navigation and Escape. Visible focus and reduced-motion preferences are supported.

Save indicators distinguish a named **Saved!** version from **Unsaved changes** in an automatically stored browser draft. Failed storage is reported instead of showing a successful save. Empty workspaces offer an appropriate next step.

In Seating Chart, **Export → Substitute-teacher printout** offers a chart preview, date, Teacher/Student perspective (Teacher view by default), optional alphabetical full-name roster table with four blank attendance/data columns (including unseated students), and optional notes. Print / Save PDF uses the browser print dialog. Notes remain in the dialog only for the current session. The packet excludes private priority preferences, rules, and lock controls.

Working state is stored in this browser, on this origin; it is not cloud synchronization. Export backups before clearing browser data or changing devices. Full JSON backups include teacher-only rosters, rules, locks, preferences, and assignments. Share pictures or class displays with students. Room-only backups omit class rosters and charts. Export menus offer current/all seating charts and current/all room layouts. Current exports contain one item; all seating charts includes saved charts and working drafts across classes. One import action accepts single-item and multi-item files. Unmet priority seating is included in the Seating Chart warning emoji and details.

Run focused engine tests with `node --test seating-engine.test.cjs` from this folder. Browser audits should cover saved-class/room/chart reloads, backups/imports, constraints, empty-chair randomization, exports/print, tool pop-outs, keyboard/touch interactions, and narrow screens. Native clipboard, fullscreen, print dialogs, and physical mobile browsers still need a human smoke test before publishing.

Run `node toolkit-experience.browser.test.cjs` with Playwright available to Node and its Chromium installed. Alternatively, set `TOOLKIT_BROWSER` to a Chrome/Chromium executable. This scoped test starts a temporary local server, uses an isolated browser profile, and checks help search, focus handling, save feedback, empty-room guidance, and substitute print content/options. It does not modify your saved classes.

Version 2.0.1 remains in development until the release is confirmed. Maintain the concise user-facing entry in `version-history.html`; committing does not publish a release. Bundled artwork credits are in `flag-art-LICENSE.txt`, `recycling-symbol-LICENSE.txt`, and `backgrounds/credits.json`.
