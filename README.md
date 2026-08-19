# Orvay status

The public status page for Orvay, served at **https://status.orvayos.com**.

## If you are here because that page will not load

You are in the right place. This repository is the fallback, and it works when
the page does not, because GitHub serves it and nothing about it depends on our
domain or our hosting provider.

The current state is in **[`summary.json` on the `gh-pages` branch](../../blob/gh-pages/summary.json)**.
It is the same data the page renders. Two fields are worth knowing:

- `states` is one entry per component. `operational` means a check ran and
  passed. `unknown` means we tried and could not get an answer, which is not the
  same as broken. `not-measured` means nothing watches it yet.
- `generatedAt` is when the file was written, in milliseconds. If it is hours
  old, our publisher is what is broken, and that is worth knowing too.

**[`history.json`](../../blob/gh-pages/history.json)** holds every state change
we have ever recorded, and the commit log of the `gh-pages` branch is its audit
trail.

## Why this repository exists at all

Orvay runs entirely on Cloudflare, and both of its domains resolve through
Cloudflare nameservers. A status page served from that same infrastructure goes
dark during precisely the incident it exists to report. Cloudflare does not
accept this arrangement for itself either: `cloudflarestatus.com` answers
`server: Google Frontend` and delegates to `googledomains.com` nameservers.

So the page is built by GitHub Actions and served by GitHub Pages, which is
fronted by Fastly, and reached through a **DNS-only** record on a subdomain
Orvay already owns. A Workers, KV, R2 or Cloudflare edge failure does not take
it down.

## What is in here

| Path | What it is |
|---|---|
| `build.mjs` | **Generated.** The prober and renderer, bundled from the Orvay monorepo. |
| `.github/workflows/status.yml` | The schedule that runs it. Holds no secret. |
| `gh-pages` branch | The published output, and the history, in git. |

`build.mjs` is a build artifact, not source. It is committed because GitHub Pages
requires a public repository on this plan while the monorepo is private, so the
bundle crosses the boundary rather than the source. Every `summary.json` it
writes carries a `sourceCommit` field naming the monorepo commit that produced
it, so what is running can be checked from outside rather than inferred.

To refresh it after changing the prober, from the monorepo:

```
pnpm --filter @orvay/status-page bundle
cp apps/status/.build/build.mjs <this repo>/build.mjs
```

## What the page will not do

It does not publish an uptime percentage. Every percentage a status page shows
is ultimately derived from its publisher's own account of its own incidents,
which is the proposer verifying itself on the most public surface a company has.

It does not paint a row green because a check returned 200 once. A row whose
measurement is older than its own freshness budget reads `Unknown`, and a row
nothing watches reads `Not measured` and can never read anything else.

It collects no personal data. There is no email sign-up, so there is no consent
record to keep, no revocation path to build, and nothing to erase. Changes are
published as an Atom feed.
