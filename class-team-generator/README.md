# Quick Team Generator 1.3

Open `index.html` or serve this folder as a static website. Keep the accompanying CSS, JavaScript, and question bank beside it.

## Version history

### 1.3 ? In development (October 22, 2026)

- Separate countdown and stopwatch tools: larger digital displays, stopwatch tenths, and analog views. Countdown also offers a rounded glass sand timer and animated dynamite with a traveling fuse flame and explosion, plus optional matching alarm sounds.
- Consistent sidebar headers for all four tools, with a left collapse arrow and right enlarge/restore, pop-out, and drag controls. Remember collapsed panels and tool order; Alt + arrow keys also reorder tools.
- Community builder includes 270 supplied icebreaker questions, a daily question, and a centered new-question button. Question text follows the app font-size controls.
- Read-only Display for class sits in the top toolbar and shows groups with teacher-written activity instructions above them. Suggested instructions append directly to the text box below settings.
- Choose numbers, letters, or no member labels beside Show names; labels carry through classroom display and exports.
- Picker avoids recent repeats even when repeats are allowed, or cycles through all eligible choices when disabled. One member from every group now chooses independently within each group. Selected students are highlighted, with a subtle centered Clear highlights control.
- Image and text exports and share links can optionally include activity instructions and highlighted members. Both options start off and remember preferences via cookies.
- New preferences and instructions persist between visits and are included in JSON backups. Running clocks and random-pick history are session-only; popped-out clocks continue from their current time.

- Fresh random groups on each page load, while preserving saved classes, absent students, grouping rules, and settings. Centered community questions, lighter move handles, and selection highlights that contain the student controls.

Earlier release notes and the canonical running history are in [Version history](version-history.html).

Sound is synthesized locally after a user gesture. Device sleep or browser background throttling can delay alarms. Pop-outs require the browser to allow a new window. Pop-outs use a snapshot of the current class.
