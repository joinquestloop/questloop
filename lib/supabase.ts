import { createClient } from "@supabase/supabase-js";

// Supabase's project URL and publishable key are intentionally public browser
// configuration. Keeping the production values here avoids Cloudflare build
// variables being serialized with quotes or other dashboard formatting.
const supabaseUrl = "https://xwidmxukceslmsklniaw.supabase.co";
const supabasePublishableKey =
  "sb_publishable_YVgdCGmBYivHKrSw8xBP3Q_zrpvM3rz";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
