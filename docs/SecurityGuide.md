# Security Guide: MAHA LOG — Floor Tracker

This document outlines the security architecture and design decisions for the MAHA LOG project. 

## 🛡️ Philosophy: Security through Rules

MAHA LOG follows a "Security through Rules" approach. In modern serverless applications like this one, client-side obfuscation (hiding keys in `.env`) is secondary to server-side enforcement.

### 1. API Key Handling
**Decision:** Firebase configuration keys are stored in the source code (`src/utils/firebase.ts`).

*   **Public Exposure:** In any client-side web application (React, Vue, Vite), these keys are sent to the user's browser to initialize the connection. They are visible via the browser console or network logs.
*   **Mitigation:** These keys are *identifiers*, not *secrets*. They tell the Firebase SDK which project to talk to. They do not grant administrative access.
*   **Hardening:** We recommend using **HTTP Referrer Restrictions** in the Google Cloud Console to ensure these keys can only be used from your specific domain (e.g., `nickpricks.github.io`).

### 2. Data Integrity (Firestore Rules)
Security rules are version-controlled in `firestore.rules` and should be deployed via `firebase deploy --only firestore:rules`.

**Current posture (v0.0.4):**
*   **Authentication Required:** All reads/writes require an anonymous Firebase session (`request.auth != null`).
*   **Known Limitation:** Document paths use a local UUID from the URL, NOT `request.auth.uid`. This means an authenticated user could theoretically read/write another user's data if they know the UUID. The UUID is a 128-bit random value (effectively unguessable), but this is security-by-obscurity, not enforcement.

**Future hardening (tracked in WORKPLAN):**
*   Migrate document paths to use `request.auth.uid` and enforce `request.auth.uid == userId` in rules.
*   Add schema validation rules for `DailyRecord` fields.

### 3. Anonymous Authentication (Ghost Users)
We use Firebase Anonymous Auth to allow users to track data without a friction-filled login process.
*   **UUID Linking:** The local `maha_user_id` (UUID) is linked to a Firebase anonymous session.
*   **Security Note:** If a user loses their local storage or URL, they "lose" the identity associated with that data. This is an intentional trade-off for privacy and speed.

### 4. GitHub Best Practices
*   **No Admin Secrets:** Never commit Service Account JSONs or Firebase Admin SDK keys to this repository.
*   **Audits:** We perform regular dependency audits to prune "Shadow Dependencies" and minimize the attack surface.

---
*Last Updated: 2026-03-17*
