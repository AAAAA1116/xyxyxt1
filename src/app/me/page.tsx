import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MyListingCard } from "@/components/MyListingCard";

export default async function MePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/me");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, student_id")
    .eq("id", user.id)
    .single();

  const { data: listings } = await supabase
    .from("listings")
    .select(`
      id, title, description, price, image_url, status, created_at,
      profiles!seller_id (id, nickname)
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const nickname = (profile as { nickname?: string | null } | null)?.nickname;
  const studentId = (profile as { student_id?: string | null } | null)?.student_id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <section className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-medium text-gray-500 mb-3">我的资料</h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-gray-500">邮箱</dt>
            <dd className="text-gray-900">{user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">昵称</dt>
            <dd className="text-gray-900">{nickname || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">学号</dt>
            <dd className="text-gray-900">{studentId || "—"}</dd>
          </div>
        </dl>
        <p className="mt-3">
          <Link href="/me/edit" className="text-indigo-600 hover:underline text-sm">编辑资料</Link>
        </p>
      </section>

      <h1 className="text-xl font-semibold text-gray-900 mb-4">我的发布</h1>

      {process.env.NODE_ENV === "development" && (
        <p className="mb-4 text-xs text-gray-500 font-mono">
          [调试] 当前登录：email={user.email ?? "(无)"} · id 末8位={user.id.slice(-8)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {(listings ?? []).map((l: Record<string, unknown>) => (
          <MyListingCard key={String(l.id)} listing={l as never} />
        ))}
      </div>

      {(listings?.length ?? 0) === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无发布</p>
          <Link href="/new" className="mt-2 inline-block text-indigo-600 hover:underline">
            去发布
          </Link>
        </div>
      )}

      <p className="mt-6 text-center">
        <Link href="/" className="text-indigo-600 hover:underline text-sm">返回首页</Link>
      </p>
    </div>
  );
}
