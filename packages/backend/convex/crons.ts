import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();



crons.daily(
    "download_taddy_charts_history",
    { hourUTC: 1, minuteUTC: 14 }, 
    internal.taddy.taddyDownloadCharts,
    { chart_type: "PODCASTSERIES_HISTORY", page: 1 }, 
);
crons.daily(
    "download_taddy_charts_film",
    { hourUTC: 1, minuteUTC: 16 }, 
    internal.taddy.taddyDownloadCharts,
    { chart_type: "PODCASTSERIES_TV_AND_FILM_HISTORY", page: 1 }, 
);
crons.daily(
    "download_taddy_charts_music",
    { hourUTC: 1, minuteUTC: 12 }, 
    internal.taddy.taddyDownloadCharts,
    { chart_type: "PODCASTSERIES_MUSIC_HISTORY", page: 1 }, 
);

crons.daily(
    "test_taddy",
    { hourUTC: 1, minuteUTC: 8 }, 
    internal.taddy.testTaddy,
    {}, 
);

export default crons;