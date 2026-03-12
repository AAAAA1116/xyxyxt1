import { createClient } from "@supabase/supabase-js";

/** 服务端用 Service Role Key，绕过 RLS，用于自动回复插入消息等 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  return createClient(url, key);
}
