# Anon Poker (ZEC Poker)

Online poker with a choice: fully shielded and anonymous on Zcash, or an
operator-backed compliant rail — same table, same fairness, your call.

Built for the **Common S3nse** hackathon, Cypherpunk Week, Amsterdam (Sept 4–5, 2026).

---

## What this is

Every hand is provably fair — the deck is committed with a SHA-256 hash
before dealing and the seed is revealed after, so any player can verify the
shuffle themselves rather than trust the house. Play fully anonymous by
staking Zcash directly, or opt into Zchips (an operator-backed confidential
asset) for a stable, compliant-friendly unit.

A single self-contained HTML file — no build step, no dependencies, no
server required. Open `app/index.html` in any modern browser.

## Project structure

```
app/
  index.html            The full game — single file, all art embedded
docs/
  SETTLEMENT-DESIGN.md   Escrow, custody, and Zcash settlement architecture
  CP-HANDOFF-ZEC-POKER.md  Build/project status handoff notes
  zano-companion-connect.js  Zano Companion wallet-connect module (in progress)
tests/
  *-tests.js             18 automated proof suites, 1,600+ assertions
```

## Running the app

Open `app/index.html` directly in a browser. No install required.

## Running the tests

Each suite is a standalone Node script — no test runner needed.

```bash
cd tests
for f in *.js; do node "$f"; done
```

Every suite must print `0 failed`. This gates every shipped change.

## Status

Testnet-only preview build. No real funds are held or transferred by any
code in this repository. Zano wallet-connect integration in progress.

## License

Business Source License 1.1. Source is visible and free to use for
non-production, testing, evaluation, and non-commercial purposes.
Commercial hosted/managed use requires a separate license from the
Licensor until 2030-09-04, after which it converts automatically to
Apache License 2.0. See [LICENSE](LICENSE) for the full text.
