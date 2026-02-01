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

import type * as carData from "../carData.js";
import type * as crons from "../crons.js";
import type * as links from "../links.js";
import type * as public_ from "../public.js";
import type * as scheduled from "../scheduled.js";
import type * as tessie from "../tessie.js";

/**
 * A utility for referencing Convex functions in your app's API.
 */
declare const fullApi: ApiFromModules<{
  carData: typeof carData;
  crons: typeof crons;
  links: typeof links;
  public: typeof public_;
  scheduled: typeof scheduled;
  tessie: typeof tessie;
}>;

export const api: FilterApi<typeof fullApi, FunctionReference<"query" | "mutation" | "action", "public">> = {} as any;

export const internal: FilterApi<typeof fullApi, FunctionReference<"query" | "mutation" | "action", "internal">> = {} as any;
