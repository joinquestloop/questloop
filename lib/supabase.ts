import { createClient } from "@supabase/supabase-js";

// These values are public browser configuration, not privileged credentials.
// Environment variables allow a different project to be used for previews,
// while the fallback keeps Cloudflare's static renderer from failing because
// Workers Builds does not forward build variables into the render environment.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xwidmxukceslmsklniaw.supabase.co";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_YVgdCGmBYivHKrSw8xBP3Q_zrpvM3rz";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
