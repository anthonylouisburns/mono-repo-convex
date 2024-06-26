# Fullstack monorepo template feat. Expo, Turbo, Next.js, Convex, Clerk

This is a modern TypeScript monorepo template with AI web and native apps featuring:

- Turborepo: Monorepo management
- Next.js 13: Web app & marketing page
- React Native [Expo](https://expo.dev/): Mobile/native app
- [Convex](https://convex.dev): Backend, database, server functions
- [Clerk](https://clerk.dev): User authentication
- OpenAI: Text summarization (optional)

The example app is a note taking app that can summarize notes using AI.
Features include:
- Marketing page
- Dashboard page (web & native)
- Note taking page (web & native)
- Backend API that serves web & native with the same API
- Relational database
- End to end type safety (schema definition to frontend API clients)
- User authentication
- Asynchronous call to an OpenAI
- Everything is realtime by default

## Using this example

**1)** Install dependencies with `yarn` or `pnpm i`.  

- I used yarn
- pasted in .env.local to packages/, apps/web/, apps/native

**2)** Configure Convex:

> Note: The following commands will throw an error and ask you to add the appropriate environment variables to proceed. Continue reading on for how to do that.

```sh
npm run setup --workspace packages/backend
```

- old project, check CONVEX_URL matches url from dashboard

The script will log you into Convex if you aren't already and prompt you to
create a project (free). It will then wait to deploy your code until you
set the environment variables in the dashboard.

Configure Clerk with [this guide](https://docs.convex.dev/auth/clerk). Then add the `CLERK_ISSUER_URL` found in the "convex" template [here](https://dashboard.clerk.com/last-active?path=jwt-templates), to your Convex environment variables [here](https://dashboard.convex.dev/deployment/settings/environment-variables&var=CLERK_ISSUER_URL).

After that, optionally add the `OPENAI_API_KEY` env var from [OpenAI](https://platform.openai.com/account/api-keys) to your Convex environment variables to get AI summaries.

**3)** Create a `.env` file using the `.example.env` as a template and fill out your Convex and Clerk environment variables.

There is one in each of apps/web and apps/native.

- Use the `CONVEX_URL` in packages/backend/.env.local for `{NEXT,EXPO}_PUBLIC_CONVEX_URL`.
- The Clerk publishable & secret keys can be found [here](https://dashboard.clerk.com/last-active?path=api-keys).

**4)** Run the following command to run both the web and mobile apps:

```sh
npm run dev
```

## What's inside?

This monorepo template includes the following packages/apps:

### Apps and Packages

- `web`: a [Next.js 14](https://nextjs.org/) app with TailwindCSS and Clerk
- `native`: a [React Native](https://reactnative.dev/) app built with [expo](https://docs.expo.dev/)
- `packages/backend`: a [Convex](https://www.convex.dev/) folder with the database schema and shared functions

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [Expo](https://docs.expo.dev/) for native development
- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Prettier](https://prettier.io) for code formatting

# What is Convex?

[Convex](https://convex.dev) is a hosted backend platform with a
built-in database that lets you write your
[database schema](https://docs.convex.dev/database/schemas) and
[server functions](https://docs.convex.dev/functions) in
[TypeScript](https://docs.convex.dev/typescript). Server-side database
[queries](https://docs.convex.dev/functions/query-functions) automatically
[cache](https://docs.convex.dev/functions/query-functions#caching--reactivity) and
[subscribe](https://docs.convex.dev/client/react#reactivity) to data, powering a
[realtime `useQuery` hook](https://docs.convex.dev/client/react#fetching-data) in our
[React client](https://docs.convex.dev/client/react). There are also clients for
[Python](https://docs.convex.dev/client/python),
[Rust](https://docs.convex.dev/client/rust),
[ReactNative](https://docs.convex.dev/client/react-native), and
[Node](https://docs.convex.dev/client/javascript), as well as a straightforward
[HTTP API](https://github.com/get-convex/convex-js/blob/main/src/browser/http_client.ts#L40).

The database supports
[NoSQL-style documents](https://docs.convex.dev/database/document-storage) with
[relationships](https://docs.convex.dev/database/document-ids) and
[custom indexes](https://docs.convex.dev/database/indexes/)
(including on fields in nested objects).

The
[`query`](https://docs.convex.dev/functions/query-functions) and
[`mutation`](https://docs.convex.dev/functions/mutation-functions) server functions have transactional,
low latency access to the database and leverage our
[`v8` runtime](https://docs.convex.dev/functions/runtimes) with
[determinism guardrails](https://docs.convex.dev/functions/runtimes#using-randomness-and-time-in-queries-and-mutations)
to provide the strongest ACID guarantees on the market:
immediate consistency,
serializable isolation, and
automatic conflict resolution via
[optimistic multi-version concurrency control](https://docs.convex.dev/database/advanced/occ) (OCC / MVCC).

The [`action` server functions](https://docs.convex.dev/functions/actions) have
access to external APIs and enable other side-effects and non-determinism in
either our
[optimized `v8` runtime](https://docs.convex.dev/functions/runtimes) or a more
[flexible `node` runtime](https://docs.convex.dev/functions/runtimes#nodejs-runtime).

Functions can run in the background via
[scheduling](https://docs.convex.dev/scheduling/scheduled-functions) and
[cron jobs](https://docs.convex.dev/scheduling/cron-jobs).

Development is cloud-first, with
[hot reloads for server function](https://docs.convex.dev/cli#run-the-convex-dev-server) editing via the
[CLI](https://docs.convex.dev/cli). There is a
[dashboard UI](https://docs.convex.dev/dashboard) to
[browse and edit data](https://docs.convex.dev/dashboard/deployments/data),
[edit environment variables](https://docs.convex.dev/production/environment-variables),
[view logs](https://docs.convex.dev/dashboard/deployments/logs),
[run server functions](https://docs.convex.dev/dashboard/deployments/functions), and more.

There are built-in features for
[reactive pagination](https://docs.convex.dev/database/pagination),
[file storage](https://docs.convex.dev/file-storage),
[reactive search](https://docs.convex.dev/text-search),
[https endpoints](https://docs.convex.dev/functions/http-actions) (for webhooks),
[streaming import/export](https://docs.convex.dev/database/import-export/), and
[runtime data validation](https://docs.convex.dev/database/schemas#validators) for
[function arguments](https://docs.convex.dev/functions/args-validation) and
[database data](https://docs.convex.dev/database/schemas#schema-validation).

Everything scales automatically, and it’s [free to start](https://www.convex.dev/plans).


<!-- 
[ ] MINIMUM VIABLE PRODUCT
[x]  play audio 
[x]  scroll view - https://www.daily.co/blog/understanding-react-natives-flatlist-scrollview-and-sectionlist-components/
[x] save user and email -  https://docs.convex.dev/auth/database-auth
[x] web save user info https://docs.convex.dev/auth/database-auth
[x] web navigation
[x] keep track of play position - play history
[x] web play track
[x] web change tracks
[x] web save play position
[x] add spans on timeline page - not on podcast page
[ ] WEB - delete unused code
[x] sort timeline
[x] add links from timeline to update edit box at top
[x] reformat podcast page - remove add spans from that page? maybe
[x] native delay mutation
[x]  4. clean up delete unused code


[ ] RELEASE
[x] enroll as Apple Developer
[ ]  check everything works - add tests
[ ]  check everything in
[ ] release - build EAS
[ ] play in background - should work double check - continue play in background change tab - Expo Go app or Expo development build, the background audio mode will not work - https://dev.to/josie/how-to-add-background-audio-to-expo-apps-3fgc 
[ ] tests
[ ] daily back ups
TO[ ]DO: development build


[ ] NEW FEATURES
[ ] load position before start - safe duration to backend
[ ] remove title from create podcast
[ ] change query to be more efficient
[ ] AI suggestions
[ ] add apple login
[ ]  e. expand details - timeline expand contract
[ ] use history
[ ] paginated queries
[ ] let podcast owner claim podcast - write instructions include public key 
[ ] security only I can delete podcast
[ ] only creator(and me) can see rss url before resolved
[ ] iphone store  no logo


original command cd ../.. && turbo run build --filter={/apps/web}...


native .env.local
-->


# Build Native
1. build for release
    1. eas build --platform all 
    2. eas build --platform android (need to finish registration and find android device)
    3. eas build --platform ios (crashes in testflight)
2. build for simulator
    1. eas build -p all --profile preview (haven't tried)
    1. eas build -p ios --profile preview (crashes in simulator)
    1. eas build -p android --profile preview
3. build locally for simulator
    1. eas build -p ios --profile preview --local 
    2. eas build -p android --profile preview --local


    eas secret:push --scope project --env-file .env