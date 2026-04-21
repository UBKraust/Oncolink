import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare Workers config.
 *
 * MVP note: no R2 incremental cache configured. Dynamic pages re-render
 * per request via Workers; that's fine for this app's traffic profile.
 * Add r2IncrementalCache + binding in wrangler.jsonc later if needed.
 */
export default defineCloudflareConfig({});
