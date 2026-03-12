import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewListingForm } from "@/components/NewListingForm";

export default async function NewListingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/new");

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">发布闲置</h1>
      <NewListingForm />
    </div>
  );
}
