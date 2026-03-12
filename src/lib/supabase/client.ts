import { createBrowserClient } from "@supabase/ssr";

/** 与 .env.local 一致：NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 供页面做“环境变量是否加载”检查用 */
export function getSupabaseEnv() {
  return { url: SUPABASE_URL ?? "", anonKey: SUPABASE_ANON_KEY ?? "" };
}

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!
  );
}
