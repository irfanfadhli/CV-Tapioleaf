# Fix Custom Period + Add Month Picker — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan.

**Goal:** Fix custom period filter and add a "Pilih Bulan" period picker in the `/laporan` Reports module.

**Architecture:** Server-side validation + date range logic changes; UI changes for period buttons and month picker; PDF export label changes.

**Tech Stack:** SvelteKit, Zod, pdfkit, Svelte 5 runes

---

## Root Cause

When URL has `period=custom` but no `startDate`/`endDate`, Zod `.refine()` rejects the schema → `safeParse` fails → server fallback uses `period: 'month'` → UI shows wrong button and wrong data.

## Files to Change

1. `src/lib/server/reports/validation.ts` — Add `month-pick` + `month` to enum, relax custom validation
2. `src/routes/(app)/laporan/+page.server.ts` — Add `month-pick` handler, fix custom fallback
3. `src/routes/(app)/laporan/+page.svelte` — Fix class: directive, add month picker, add `month-pick` button
4. `src/routes/(app)/laporan/export/+server.ts` — Handle `month-pick` period label
5. `src/lib/server/reports/pdf.ts` — (no change needed, uses label from caller)

---

## Task 1: Update Validation Schema

**File:** `src/lib/server/reports/validation.ts`

- Add `'month-pick'` to `periodEnum`
- Change Zod refinement: for `custom`, only fail if one date is provided without the other (not if both missing)
- Add `month` field (optional string, format `YYYY-MM`)

## Task 2: Update Server Date Range Logic

**File:** `src/routes/(app)/laporan/+page.server.ts`

- In `getDateRange`:
  - `month-pick`: parse `month` param, compute first/last day of that month with timezone
  - `custom` without dates: return `null` (not month fallback)
- Fix the Zod fallback: don't override period when parse fails

## Task 3: Fix UI — Class Directives + Month Picker

**File:** `src/routes/(app)/laporan/+page.svelte`

- Replace `class:bg-primary={query.period === p}` with conditional class strings (Svelte 5 safe)
- Add `'month-pick'` to `periodLabels`
- Add month picker UI when `query.period === 'month-pick'`
- Add `setMonth()` handler
- Fix custom date range input to show even when no dates provided

## Task 4: Update Export Endpoint Labels

**File:** `src/routes/(app)/laporan/export/+server.ts`

- Handle `month-pick` in PDF period label: "Bulan: {Month} {Year}"
- Handle `custom` with/without dates

## Task 5: Verify

- `bun run check` — 0 errors
- `bun run test` — 81/81 pass
- `bun run build` — success
