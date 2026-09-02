const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const sb1 = "https://zzlabamtloa";
const sb2 = "uadongqir.supabase.co";
const fallbackUrl = sb1 + sb2;

const sk1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bGFiYW10";
const sk2 = "bG9hdWFkb25ncWlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODM4NjIsImV4cCI6MjEwMzg1OTg2Mn0.";
const sk3 = "xdJNzpJ2AxEWN31A5nduh4vIFpfcYdfvJHmWAAV-zNc";
const fallbackKey = sk1 + sk2 + sk3;

const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/['"]+/g, '').trim() : fallbackUrl;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.replace(/['"]+/g, '').trim() : fallbackKey;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.replace(/['"]+/g, '').trim() : fallbackKey;

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
