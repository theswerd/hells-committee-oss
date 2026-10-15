![Hell’s Committee: a live party game for 3–8 players where you write punishments and vote for your favorites.](public/social/readme-header.png)

# Hell’s Committee

A live party game for 3–8 players. One person hosts on a TV, and everyone else joins on a phone. Each game draws three cases from 30 sinners. Players invent punishments, vote for their favorites, and see the final scoreboard.

**Play:** [hell.swerdlow.dev](https://hell.swerdlow.dev)

## Routes

- `/`: game entrance with Host and Join actions.
- `/host`: create a new room with the default comedy direction, display its code and QR link, and control the rounds.
- `/join?room=CODE`: claim a demon, submit a punishment, and vote.
- `/play`: alias for previously shared game links.

The chair opens each case. Players have 90 seconds to write a 3–140 character punishment. Voting also has a 90-second clock. If everybody finishes early, the phase closes automatically. The chair can add time, advance to the next case, and start a rematch after the final scoreboard.

The new sinner portraits are generated from the repository’s illustrated sprite library. Run `npm run sprites:sinners` to rebuild their idle and shocked WebP poses from [`sprites/generate-game-sinners.mjs`](sprites/generate-game-sinners.mjs).

The host can loop optional background music after the chair starts the game, with a music control in the footer. The final scoreboard can play an optional winner video. Add your own media in [`public/media/`](public/media/README.md); recordings are not included in the source repository.

The host and each player get a private URL containing the room code and an access ticket in the URL fragment. Reloading that exact URL resumes the seat. Opening `/host` without a room always creates a new game. The QR code shares only the join URL and room code; keep the host URL private. No seat or draft is saved in browser storage, so an unsent draft is lost on reload. Rooms expire after 24 hours.

## Local development

Use Node.js 24.

```sh
npm ci
npm run dev:rooms
# In another terminal:
npm run dev
```

The client runs at `http://localhost:4173`; `/api` is forwarded to the local room server at port 4175. This adapter applies generated SQL migrations to ignored `.local/committee.sqlite` and persists rooms across restarts.

```sh
npm run db:generate   # after a schema change
npm run check
npm test
npm run build
```

To preview the built Cloudflare Pages app with local D1, copy `wrangler.example.jsonc` to the ignored `wrangler.jsonc`:

```sh
cp wrangler.example.jsonc wrangler.jsonc
npx wrangler d1 migrations apply DB --local --persist-to .wrangler/state
npm start
```

The preview runs at `http://127.0.0.1:4174`.

## Deployment

Cloudflare Pages hosts the static game and room Worker. Create your own D1 database, copy `wrangler.example.jsonc` to the ignored `wrangler.jsonc`, and replace the example `database_id` with the ID returned by Cloudflare. Apply migrations before each deployment:

```sh
npm run build
npx wrangler d1 migrations apply DB --remote
npx wrangler pages deploy dist/client --project-name hells-committee
```

The demo at `hell.swerdlow.dev` uses a separate Cloudflare Pages project and D1 database.

## Game state

`src/room-engine.ts` owns phases, deadlines, memberships, submissions, voting, scoring, and round history. `worker/index.ts` exposes create, join, read, and action endpoints. A versioned D1 room record uses compare-and-swap updates for concurrent joins and submissions; API reads use a primary D1 session.

Device tickets are cryptographically random and only their hashes are stored on the server. Player responses contain their own draft and ballot plus public progress. Authors and scores are revealed at the verdict. The API validates membership, host controls, phase, round, question order, and eligible choices. Confirmed picks are idempotent.

`src/favorites.ts` builds seeded, balanced anonymous ballots. Each group has at most three entries. Voters see every rival’s entry, and no group includes their own. Reloading preserves the same questions and order. Only confirmed comparisons count toward scoring; missing submissions and votes are never fabricated. An entry’s score is `round(1000 × favorites / appearances)`, plus 250 for a winning approval rate. Equal rates produce co-winners.

`src/live.ts` synchronizes independent devices through TanStack Query. Access tickets live in the URL fragment, while the server remains authoritative for votes. A slow response cannot replace a newer room revision.

## Verification

- `npm test` covers ballot balance, ties, invalid picks, room phases, deadlines, concurrent submissions, duplicate retries, seat claims, and access checks.

## License

The tracked source code and original artwork are available under the [MIT License](LICENSE). Optional recordings in [`public/media/`](public/media/README.md) are supplied separately and are not covered by that license.
