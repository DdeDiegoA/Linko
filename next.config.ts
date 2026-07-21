import type { NextConfig } from "next";

// Forces the one-time schema migration to run here, in the single main CLI
// process, before `next build` spawns its parallel page-data workers — each
// of which imports lib/db.ts too. Migrating in one place first means every
// worker just sees an already-migrated db (fast no-op read) instead of all
// racing SQLite's write lock on a freshly-created file at once.
import "./lib/db";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next's standalone server only registers /public files present at boot;
  // uploads written after startup 404 otherwise. Route them through an API
  // handler that reads the disk fresh on every request instead.
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }];
  },
};

export default nextConfig;
