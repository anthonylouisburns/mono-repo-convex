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
import type * as crons from "../crons.js";
import type * as everwhz from "../everwhz.js";
import type * as everwhz_ai from "../everwhz_ai.js";
import type * as gemini from "../gemini.js";
import type * as http from "../http.js";
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
  crons: typeof crons;
  everwhz: typeof everwhz;
  everwhz_ai: typeof everwhz_ai;
  gemini: typeof gemini;
  http: typeof http;
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
