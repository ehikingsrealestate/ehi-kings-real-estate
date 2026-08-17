/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assistant from "../assistant.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as conversations from "../conversations.js";
import type * as crm from "../crm.js";
import type * as crypto from "../crypto.js";
import type * as customer from "../customer.js";
import type * as defaults from "../defaults.js";
import type * as http from "../http.js";
import type * as inbox from "../inbox.js";
import type * as instagram from "../instagram.js";
import type * as lib from "../lib.js";
import type * as marketing from "../marketing.js";
import type * as match from "../match.js";
import type * as permissions from "../permissions.js";
import type * as posts from "../posts.js";
import type * as properties from "../properties.js";
import type * as sales from "../sales.js";
import type * as seed from "../seed.js";
import type * as site from "../site.js";
import type * as social from "../social.js";
import type * as suite from "../suite.js";
import type * as support from "../support.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as zoho from "../zoho.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assistant: typeof assistant;
  auth: typeof auth;
  chat: typeof chat;
  conversations: typeof conversations;
  crm: typeof crm;
  crypto: typeof crypto;
  customer: typeof customer;
  defaults: typeof defaults;
  http: typeof http;
  inbox: typeof inbox;
  instagram: typeof instagram;
  lib: typeof lib;
  marketing: typeof marketing;
  match: typeof match;
  permissions: typeof permissions;
  posts: typeof posts;
  properties: typeof properties;
  sales: typeof sales;
  seed: typeof seed;
  site: typeof site;
  social: typeof social;
  suite: typeof suite;
  support: typeof support;
  tasks: typeof tasks;
  users: typeof users;
  zoho: typeof zoho;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
