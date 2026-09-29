# Codex instructions

Keep edits bounded to conserve credits unless the user explicitly requests broader work.

## Scope discipline

This repository contains many independent teaching apps.

For any requested change:

- Work only in the specific app folder or file(s) relevant to the request.
- Do NOT inspect, search, enumerate, or read unrelated app folders.
- Do NOT perform repository-wide searches unless the user explicitly asks for a repository-wide change.
- Do NOT read every file in the project to understand the architecture.
- Assume each app is self-contained unless there is direct evidence otherwise.
- Start with the exact file(s) named or implied by the user's request.
- If additional files are required, inspect only the minimum additional files necessary.
- If the target is ambiguous, ask before broadening scope.

## Editing discipline

- Make the smallest practical change that satisfies the request.
- Preserve unrelated code, formatting, behavior, and structure.
- Do not refactor unrelated code.
- Do not rename or reorganize files unless explicitly requested.
- Do not modify other teaching apps while working on one app.
- Do not make "cleanup" changes outside the requested task.

## Verification

- Test or inspect only the affected app and the directly changed behavior.
- Do not run repository-wide test or build commands unless required or explicitly requested.
- When finished, briefly report which files were changed.

## Repository structure

The root homepage is independent from the individual apps.

App folders include:

- class-team-generator/
- curve-lab/
- logic-hoops/
- transformation-quest/
- truth-table-master/

When asked to edit one app, treat that folder as the entire working scope unless the user explicitly requests changes elsewhere.
