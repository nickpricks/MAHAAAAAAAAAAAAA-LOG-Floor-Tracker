# Changelog

All notable changes to Maha Log Floor Tracker are documented here.

## [0.0.6] — 2026-04-06

### Added
- **Edit past days** — tap any log row to redirect +/- buttons to that date
- **Add Past Day** — date picker below the log table to create entries for missing days
- **Delete with undo** — trash icon in edit mode removes a day's entry; 10-second undo toast before permanent deletion
- Edit mode header shows formatted date pill with back-to-today and delete controls
- Active log row gets accent highlight when selected for editing
- `getShortDate` date formatter (e.g. "Wed, Apr 2")
- `deleteRecordFromCloud` Firestore utility

### Changed
- `calculateTapUpdate` now accepts an optional `targetDate` parameter (backward-compatible)
- `TrackerTab` props expanded: `displayTotal`, `editingDate`, `onSelectDate`, `onDelete`
- Edit mode auto-clears on tab switch, page refresh, or tapping "Back to Today"
- Pending deletes commit immediately on tab switch away from Tracker

## [0.0.5] — 2026-03-28

- Post-hardening audit fixes, UI refresh, dark mode fix

## [0.0.4] — 2026-03-27

- Audit hardening pass

## [0.0.3] — 2026-03-26

- Real-time sync, personalization, and architecture sweep
