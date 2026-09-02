const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/['"]+/g, '').trim() : null;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.replace(/['"]+/g, '').trim() : null;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.replace(/['"]+/g, '').trim() : null;

let supabase = null;
let supabaseAnon = null;

// Check if Supabase is configured
const isConfigured = supabaseUrl && supabaseUrl.startsWith("http");

if (isConfigured) {
  // Service role client (bypasses RLS) - for backend operations
  supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Anon client (respects RLS) - for client-facing operations
  supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

  console.log("✅ Supabase connected successfully");
} else {
  console.warn("⚠️  Supabase not configured. Set SUPABASE_URL in .env file.");
  console.warn("⚠️  API routes requiring database will return errors.");

  // Create a proxy that throws helpful errors
    const handler = {
      get: (target, prop) => {
        if (prop === "from") {
          return () => {
            const chainable = {
              select: () => chainable,
              insert: () => chainable,
              update: () => chainable,
              delete: () => chainable,
              eq: () => chainable,
              in: () => chainable,
              single: async () => ({
                data: null,
                error: { message: "Supabase not configured on server" },
              }),
              then: (resolve) => resolve({
                data: null,
                error: { message: "Supabase not configured on server" },
              })
            };
            return chainable;
          };
        }
        return undefined;
      },
  };

  supabase = new Proxy({}, handler);
  supabaseAnon = new Proxy({}, handler);
}

module.exports = { supabase, supabaseAnon, isConfigured };
