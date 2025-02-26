/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as audioProxy from "../audioProxy.js";
import type * as auth from "../auth.js";
import type * as batch_coordination from "../batch_coordination.js";
import type * as crons from "../crons.js";
import type * as everwhz from "../everwhz.js";
import type * as everwhz_ai from "../everwhz_ai.js";
import type * as geminiBatchPodcast from "../geminiBatchPodcast.js";
import type * as http from "../http.js";
import type * as load_episodes from "../load_episodes.js";
import type * as load_podcasts from "../load_podcasts.js";
import type * as taddy from "../taddy.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  audioProxy: typeof audioProxy;
  auth: typeof auth;
  batch_coordination: typeof batch_coordination;
  crons: typeof crons;
  everwhz: typeof everwhz;
  everwhz_ai: typeof everwhz_ai;
  geminiBatchPodcast: typeof geminiBatchPodcast;
  http: typeof http;
  load_episodes: typeof load_episodes;
  load_podcasts: typeof load_podcasts;
  taddy: typeof taddy;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
