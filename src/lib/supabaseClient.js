import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nozcahuoluihxtacerru.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_w8FunRGA1K6WQzmS-AMRYQ_mxw2C_Xm";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
