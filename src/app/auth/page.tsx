import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-8 animate-pulse h-64 bg-gray-100 rounded" />}>
      <AuthForm />
    </Suspense>
  );
}
