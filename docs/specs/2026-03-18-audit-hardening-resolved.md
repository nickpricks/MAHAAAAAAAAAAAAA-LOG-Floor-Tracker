# Audit Hardening Implementation Plan

> **Status:** Complete — all 11 tasks (53 steps) executed in v0.0.4.
> **Summary of resolved items:** [Audit-TLDR.md](Audit-TLDR.md) → "Phase 3: Audit Hardening"

**Goal:** Fix all Critical, Important, and Minor issues identified in the 2026-03-18 full app audit.

**Architecture:** Fixes grouped into three phases: (1) Critical data-integrity and security fixes, (2) Important reliability and UX fixes, (3) Minor code cleanup. Vitest introduced first so all fixes were TDD.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Firebase 12 (Auth + Firestore), Vitest, Tailwind CSS v4, vite-plugin-pwa

## Tasks Completed

| # | Task | IDs |
|---|------|-----|
| 1 | Set up Vitest | — |
| 2 | Fix merge logic (per-field max, TDD) | C2 |
| 3 | Remove discarded cloud fetch | C3 |
| 4 | Add Firestore security rules + SecurityGuide | C1 |
| 5 | Chunk batch writes (499-op limit) | I1 |
| 6 | Enable Firestore offline persistence | I2 |
| 7 | Fix dark mode (all 6 components) | I3 |
| 8 | Fix stale date keys (midnight rollover) | I4, I5 |
| 9 | Add core utility tests (21 tests, 4 suites) | I6 |
| 10 | Code cleanup sweep (strict TS, imports, CI) | I7, minor |
| 11 | Update documentation | — |
