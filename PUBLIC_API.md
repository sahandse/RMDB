# RMDB Public API · v1

RMDB publishes **read-only static JSON snapshots** from Wikidata, with no API key.
The website is statically exported to GitHub Pages; these URLs are **not** server endpoints and do not support query parameters, authentication, arbitrary search, pagination, rate limits, or custom response headers.

## Endpoints
- https://sahandse.github.io/RMDB/api/v1/index.json — API metadata
- https://sahandse.github.io/RMDB/api/v1/movies.json — Wikidata movie records
- https://sahandse.github.io/RMDB/api/v1/people.json — Wikidata people records

Example:
```js
const response = await fetch('https://sahandse.github.io/RMDB/api/v1/movies.json');
if (!response.ok) throw new Error('Catalog unavailable');
const {items,updatedAt} = await response.json();
console.log(items.length, updatedAt);
```

## Record structure
The stable `id` is `wd-Q...`, and `wikidataId` is `Q...`.
`title.display` is the actual Wikidata result according to source language preference, **not** a guaranteed Persian translation; `title.en` is supplied only when an English label exists. Missing information is `null`, never invented.

## Reuse and attribution
Only structured **Wikidata CC0** records are included. Please credit Wikidata as good practice: https://www.wikidata.org/wiki/Wikidata:Data_access/en.
**TVmaze** records (CC BY-SA), Wikipedia prose, TVmaze posters, and Wikimedia Commons images are **excluded** from these API files. Their license requirements differ and must be checked independently before redistribution.

This release does not provide a hosted service with authentication, usage quotas, API keys, or SLA. A future dynamic API can reuse these stable record IDs and provenance.
