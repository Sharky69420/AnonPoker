# CP-HANDOFF — ZEC Poker / "Anon Poker" — Common S3nse Hackathon

**Generated:** Tuesday, September 1, 2026, ~17:00 UTC
**Written by:** Claude (prior session), for a fresh Claude session to pick up with zero re-explanation.
**If you are that fresh session:** read this whole document before touching anything. It replaces re-deriving context from scratch.

---

## ⏰ CRITICAL DATES/TIMES — read this section first

| When | What | Status |
|---|---|---|
| **Aug 31, 2026** | Build week began | Past |
| **Tue Sep 1, 2026** | *This document was written* | **Today** |
| **Wed Sep 2 – Thu Sep 3** | Remaining build days before the event | **2 days left** |
| **Fri Sep 4 – Sat Sep 5, 2026** | **Common S3nse hackathon, Cypherpunk Week Amsterdam** — the event itself | 3 days away |

**Location:** Amsterdam (Cypherpunk Week). Sharky's travel/lodging/visa logistics for physically getting to Amsterdam are **not recorded anywhere in prior context** — this needs to be confirmed directly with Sharky, not assumed. Flag this explicitly if it hasn't come up.

**Platform:** Submission is hosted on **Taikai** (`taikai.network`), under the Common S3nse hackathon, project titled **"Anon Poker"** (note: differs from the internal working name "ZEC Poker" used throughout code/docs — this naming inconsistency is intentional per Sharky, not a bug).

**Time pressure summary:** as of this writing, there are **~2 build days and 3 calendar days** before the event starts. Prioritize accordingly — see "What's actually left" below.

---

## 🚫 THE ONE HARD BOUNDARY — read before doing anything

Sharky has a **separate, unrelated personal project referred to as "L.O.C."** He has explicitly instructed:

> "Personal project. DO NOT TOUCH. No files named similarly or contradictory."

**Never reference, create, name, or touch anything related to L.O.C.** in this project's files, repo, or conversation. If a task ever seems adjacent to it, stop and ask rather than guess. This is a standing instruction from a prior session and remains in force.

---

## What this project is

**ZEC Poker** ("Anon Poker" on Taikai): a privacy-first, single-file HTML poker platform. Pitch: *"Online poker with a choice: fully shielded and anonymous on Zcash, or an operator-backed compliant rail — same table, same fairness, your call."* Built around **provably-fair dealing** (SHA-256 commit/reveal, verifiable in-app) as the centerpiece demo moment, and a two-rail settlement design (direct ZEC staking vs. operator-backed "Zchip" confidential asset on Zano).

The hackathon's own framing matters: the **poker engine itself is pre-existing work**; the **Zano integration is the actual hackathon deliverable**. Keep that distinction in mind when deciding what counts as "build week work" vs. "already done."

---

## Where everything lives

All files are in `/mnt/user-data/outputs/` (persisted per-conversation; re-upload if starting a genuinely new chat with no shared file access):

| File | What it is |
|---|---|
| `zec-poker-preview.html` | **The current build.** Single stable filename now — see "File naming convention" below. |
| `zec-poker-*-tests.js` (19 files) | The full automated test suite. See "Testing discipline" below. |
| `ZEC-POKER-SETTLEMENT-DESIGN.md` | v1.1 settlement/escrow/custody design doc. |
| `anon-poker-repo.zip` | A prepared (but not yet pushed) GitHub repo scaffold — see "GitHub" below. |

**File naming convention (as of this session):** Sharky asked to stop incrementing preview numbers ("preview-47," "preview-48," etc.) and instead **always overwrite the same `zec-poker-preview.html`** to conserve space. All prior numbered versions were deleted. Continue this practice — do not create `preview-51.html` etc.

---

## Current build state (as of `zec-poker-preview.html`)

Extremely feature-complete for a hackathon demo. Highlights:

- **Provably-fair dealing** — SHA-256 commit/reveal, pure-JS hash implementation (deliberately not dependent on `crypto.subtle`, which fails in non-secure/local contexts — this was a real shipped bug, now fixed and tested), in-app verifier panel showing commit → reveal → re-hash → match.
- **Capability-based betting** — every action offered is derived from what the actual stack can legally do; short stacks can never be offered an impossible bet.
- **All-in runout rule** — implements the official poker rule: once fewer than two players can still bet, no one is asked to act again; remaining streets deal out automatically to showdown.
- **Card rendering** — redesigned this session: one large central rank/letter character, one suit symbol isolated top-left, sized at a ~π ratio between them. Ace unified into the same system (no more special-case pip).
- **4-color deck toggle**, **mainnet/testnet toggle** (mainnet click is honestly disclosed as "not wired up in this preview" rather than faked), **sound on/off toggle**.
- **DJ / table music system** — real local audio playback (file upload + Spotify official embed), per-table state, bottom ticker. **Explicitly disclosed as local-preview only** — there is no multiplayer server in this build, so "everyone at the table hears the same song" needs backend work that doesn't exist yet. Don't let this get miscommunicated as already-shared.
- **Turn timer** — currently set to **3 seconds for testing** (`HERO_TIME=3000` constant). Built so the described live-format spec (10s normal + last 5s pulsing = 15s total) falls out automatically from a proportional pulse-zone fraction — flipping the one constant to `15000` reproduces the live spec with no other code changes.
- **Lobby** — compacted via viewport-height-based `clamp()` sizing; table cards now show a real thumbnail preview (using actual embedded scene art) under each table name.
- **Six real embedded scene backgrounds** (Casino, Club Room, Basement, Rooftop Villa, Half-Court, Ballpark) generated via Grok Imagine and embedded as base64 JPEG. **Spaceship scene slot exists in code (id 7) but has no real art yet** — it's a CSS-gradient placeholder using the exact same pattern the other six used before their art existed. A ready-to-use generation prompt was written for it; check recent conversation history for the exact prompt text if regenerating.
- **Showdown ceremony** — staggered reveal, best-five glow, mucked-hand dimming, winner banner.
- **Wallet UI** — cash-out and send-to-player forms exist and validate real inputs (amount, address, minimums), but the actual transfer is **simulated locally**, clearly labeled as such in the UI copy. This is intentional, matching the same "local preview, not yet backend-connected" pattern as the DJ system.
- **Blind sounds** — fixed this session: were firing twice per blind (once on seat fade-in, once on actual chip post) and the big blind was using the small blind's sound weight. Now fires exactly once per blind, correctly weighted.

## Testing discipline — DO NOT SKIP

**19 automated test files, ~1,645+ assertions, all green as of this session.** This is not optional ceremony — it has caught real, ship-blocking bugs repeatedly (a frozen-table crypto bug, duplicate UI elements, CSS regressions, cascade conflicts, math errors in betting logic). Standing rule from Sharky: **"Make no mistakes"** — treated as a hard requirement, not a suggestion.

**Before shipping any change:**
1. Copy the edited `zec-poker-preview.html` into the extracted repo's `app/index.html` location (tests read from there, not from `/tmp`).
2. Run every test file: `cd tests && for f in *.js; do node "$f"; done` — every single one must print `0 failed`.
3. Also run the two full-session interactive harnesses if available in your working directory (`domstub6.js` multi-handed, `domstub_hu.js` heads-up) — these simulate entire hands end-to-end and have caught bugs the unit-style suites missed.
4. Verify on disk with `grep`/direct file reads after every edit — Python `.replace()` calls have silently no-op'd more than once this project when the target string didn't match exactly (stale cached text, cascade duplicates, escaping mismatches). **Never assume a patch applied — check.**
5. Only then copy to `/mnt/user-data/outputs/zec-poker-preview.html` and present it.

If you don't have the `/tmp` test harness files (`domstub6.js` etc.) in a fresh sandbox, they'll need to be reconstructed or the equivalent coverage rebuilt — check whether they're referenced/embedded anywhere recoverable before treating that as lost.

---

## What's actually left — split personal vs. build, in priority order

### 🧍 Personal / non-code tasks (Sharky must do these; Claude can prep but not execute)

1. **Confirm Amsterdam travel logistics.** Not recorded anywhere. Needs immediate attention given the event is 3 days out.
2. **Testnet wallet — in progress.** Sharky was pointed to a working faucet (found one himself) and to **`leakix.github.io/zcash-web-wallet`** as a browser-based, client-side testnet wallet (open source, generates real testnet Unified Addresses, no install). As of last contact, Sharky had not yet confirmed generating an address or receiving faucet funds. **Check in on this first** — it's a blocker for any real Zano/Zcash testing during build week.
3. **Zano Companion install** — status unconfirmed. Needs a testnet wallet created inside it (separate from the Zcash wallet above — Companion is for the Zano/Zchip side).
4. **MCP server config** (Zano MCP server, 45 blockchain tools) — not yet done. Would let Claude query the chain directly during build week instead of debugging blind.
5. **License decision for the GitHub repo** — undecided. Sharky rejected MIT explicitly ("definitely not"), was presented Apache-2.0 vs. Business Source License (BSL) as the two live options (Apache = fully open, strong patent protection, signals well at a cypherpunk hackathon; BSL = visible/auditable now, commercially protected for a set period). **Needs a decision before the repo goes live.**
6. **Create the actual GitHub repo** — a full scaffold is prepared (`anon-poker-repo.zip`: README, `.gitignore`, LICENSE placeholder, CI workflow, `app/index.html`, `docs/SETTLEMENT-DESIGN.md`, all 19 tests verified to run standalone from that exact folder structure). **Repo itself has not been created yet.** Sharky wants it **private**, with judges given access via GitHub's "Invite via link" collaborator feature (not a public-link scheme — GitHub doesn't offer that for private repos). **He explicitly asked for a walkthrough of this once he's done building** — that conversation hasn't happened yet. Also flagged: confirm with Taikai/organizers whether a *public* repo is actually required for judging before committing to staying private through the deadline.
7. **Taikai submission — still a draft, unpublished.** Title "Anon Poker," tagline and description were rewritten and handed to Sharky to paste in (tightened to name Zcash's shielded pool explicitly, softened "regulatory compliant" to avoid an unverifiable compliance claim). **Still needed before Publish:** the Loom demo video (a full shot list was written — ends on the provably-fair verification as the closing beat, since that's the strongest moment), a few screenshots for the gallery slider, and then **the actual Publish click** — a judge cannot see a draft project.
8. **Generate real Spaceship scene art** via Grok Imagine using the prompt already written (check recent history), then hand the image back to Claude for the same compress-and-embed pipeline used for the other six scenes.

### 💻 Build / code tasks (Claude executes, Sharky directs)

These are the literal hackathon deliverable per the event's own framing — the poker engine is "done," Zano integration is "the build":

1. **Zano Companion wallet connect** — `REQUEST_ACCESS` + `REQUEST_MESSAGE_SIGN` flow (note: Companion's permissions system changed **June 15, 2026** — request access explicitly before requesting a signature, don't skip that step). This replaces the current fake `utest1de...` placeholder identity with a real signed wallet address — this is the single most demo-visible change possible, prioritize it first.
2. **POKER Confidential Asset mint** — the Zchip becomes a real on-chain private token on Zano instead of a JS variable.
3. **Ionic Swaps** for buy-in and cash-out — atomic swaps, replacing the currently-simulated wallet cash-out/send UI with real functionality.
4. Post-Zano polish, if time allows: reserve attestation, the fuller Divvy-style layout research (explicitly deferred as a *post-hackathon* project, not for this week — don't reopen that unless Sharky asks again).

---

## Working style reminders (carried over, still in force)

- **Brutal honesty required.** No softening bad news, no claiming something works when it's simulated — say "local preview" or "simulated" explicitly, every time, the way the DJ system and wallet already do.
- **Numbered, plain-English steps** for anything procedural — Sharky is non-technical and prefers this over prose.
- **Screenshot-driven feedback loop** — Sharky tests on laptop (Opera/Chromium) and Android via the artifact viewer; expect rounds of "screenshot → root-cause → fix → verify → reship."
- **Never claim a fix without verifying on disk.** This project has had multiple close calls where a Python patch silently didn't apply and would have shipped unchanged if not caught by grep/test failures before presenting.
- Sharky sometimes asks for analysis/verdicts **before** continuing build (e.g., the earlier "Option A vs Option B" layout decision) — respect that pattern when a request is ambiguous or architecturally risky; present a clear recommendation and wait rather than just building the biggest interpretation.

---

## Immediate first move for whoever picks this up

1. Ask Sharky: *"Where are we — did the testnet wallet/faucet work, is Companion installed, and do you want the GitHub walkthrough now?"* Don't assume; the last known state was "in progress, unconfirmed."
2. If starting Zano work: confirm `REQUEST_ACCESS` → `REQUEST_MESSAGE_SIGN` flow first, since it unblocks everything else and is the most visible change for Friday.
3. Whatever you build: **test suite green, verify on disk, then ship** — no exceptions, three days out is not the time to loosen that.

Good luck. — prior Claude session, Sept 1, 2026
