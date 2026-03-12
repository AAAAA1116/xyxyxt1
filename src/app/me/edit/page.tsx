import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./EditProfileForm";

export const dynamic = "force-dynamic";

export default async function MeEditPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/me/edit");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, student_id")
    .eq("id", user.id)
    .single();

  const nickname = (profile as { nickname?: string | null } | null)?.nickname ?? "";
  const studentId = (profile as { student_id?: string | null } | null)?.student_id ?? "";

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">编辑资料</h1>
      <EditProfileForm initialNickname={nickname} initialStudentId={studentId} />
      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/me" className="text-indigo-600 hover:underline">返回我的</Link>
      </p>
    </div>
  );
}
