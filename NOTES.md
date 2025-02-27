```mermaid
%%{init: {'theme': 'base', 'sequence': { 'actorFontSize': 14, 'actorBackground': '#ff9999' }}}%%
sequenceDiagram
    participant T as Taddy 
    participant td as taddy_charts
    participant p as podcast
    participant f as files
    participant e as episode
    participant g as gemini


    rect rgb(191, 223, 255)
    T->>T: for genres:[PODCASTSERIES_HISTORY, PODCASTSERIES_MUSIC_HISTORY, PODCASTSERIES_TV_AND_FILM_HISTORY], limitPerPage:25,  page:[1..8]
    T->>td: download charts 1 page at a time
    td->>p: for new podcast set rss 
    td->>p: set chart and rank and chart date
    p->>p: set rank to 201 for old chart dates
    end

    rect rgb(255, 192, 203)
    p->>p: for each podcast   
    note over p: both sub-boxes could be in parallel
    note over p: ? how to filter eppisodes that are already updated ? currnetly using order by maybe use guid ?
    rect rgb(191, 223, 255)
    note right of p: rss update for a podcast
    p->>f: for all podcast download rss and set status - check last modified and etag and skip if unchanged
    f->>p: set pod fields 
    f->>e: create new episodes
    p->>e: set chart and rank for all episodes
    end

    rect rgb(191, 223, 255) 
    e->>e: get all episodes without year data
    e->>g: get year data from model save to prompt cache
    g->>e: get year data from prompt cache
    note over e: index(first_year, last_year, rank, chart, pod_id, id) all should be set
    end

    end
    rect rgb(191, 191, 191) 
    f->>f: delete old files, delete pending podcast table
    end

```


My 2 cents on testing -- use convex-test to write unit tests for your backend functions, use a fake of the ConvexReactClient to test any complicated render logic in your UI, write a few e2e tests (e.g. against a staging project or against a preview deployment) to check that all the major flows work all the way through.

There's less test coverage on things that cross backend <-> UI (e.g. there could be a bug that's not caught by tests because the fake implementation for your backend functions used in UI tests doesn't match up with the actual implementation), but hopefully the majority of issues get caught by the unit tests.

Re: dependency injection + backend functions -- I kind of view convex-test as something that dependency injects ctx with something that gives you easy methods to set up data in your db, set up auth, etc.
testing jiust backend 
https://docs.convex.dev/testing/convex-test
mock convex client 
https://stack.convex.dev/testing-react-components-with-convex


async function patchPodcastRssJsonFunction(ctx: MutationCtx, args: { podcast_id: Id<"podcast">, rss_json: any, date: string }) {

  const { podcast_id, rss_json } = args;
  const podcast = await ctx.runQuery(api.load_episodes.getPodcast, {
    id: podcast_id,
  });
  if (podcast == null) {
    console.error("podcast not found");
    return;
  }
  const items = rss_json.rss.channel.item;
  const max_episode = items.length;
  const podcast_title = rss_json.rss.channel.title;
  const podcast_description = rss_json.rss.channel.description;
  console.log("patchPodcastRssJson patching podcast", podcast_title, podcast._id);
  ctx.db.patch(podcast._id, { number_of_episodes: max_episode, title: podcast_title, description: podcast_description });
  for (const [index, item] of rss_json.rss.channel.item.entries()) {
    const e_n = Math.ceil(max_episode - index);
    const episode = await ctx.db
      .query("episode")
      .withIndex("podcast_episode_number", (q) =>
        q.eq("podcast_id", args.podcast_id).eq("episode_number", e_n),
      )
      .unique();

    // console.log("item", item.title);
    const title = item.title;
    //[ ] set mp3_link :   const mp3_link = episode?.body.enclosure["@_url"];
    if (episode) {
      ctx.db.patch(episode._id, {
        podcast_id: args.podcast_id,
        episode_number: Math.ceil(max_episode - index),
        body: item,
        title: title,
        podcast_title: podcast_title,
        chart: podcast.chart,
        rank: podcast.rank,
        updated_date: args.date
      });
    } else {
      ctx.db.insert("episode", {
        podcast_id: args.podcast_id,
        episode_number: Math.ceil(max_episode - index),
        body: item,
        title: title,
        podcast_title: podcast_title,
        chart: podcast.chart,
        rank: podcast.rank,
        updated_date: args.date
      });
    }
  }
  //   delete if extra episodes in db
  const episodes = await ctx.db
    .query("episode")
    .withIndex("podcast_episode_number", (q) =>
      q.eq("podcast_id", args.podcast_id).gt("episode_number", max_episode),
    )
    .collect();
  for (const episode of episodes) {
    ctx.db.delete(episode._id);
  }
  console.log("patchPodcastRssJson done", podcast_title, podcast._id);
}