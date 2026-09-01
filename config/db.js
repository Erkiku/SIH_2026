const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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
        return () => ({
          select: () => ({
            data: null,
            error: { message: "Supabase not configured" },
          }),
          insert: () => ({
            data: null,
            error: { message: "Supabase not configured" },
          }),
          update: () => ({
            data: null,
            error: { message: "Supabase not configured" },
          }),
          delete: () => ({
            data: null,
            error: { message: "Supabase not configured" },
          }),
        });
      }
      return undefined;
    },
  };

  supabase = new Proxy({}, handler);
  supabaseAnon = new Proxy({}, handler);
}

module.exports = { supabase, supabaseAnon, isConfigured };
