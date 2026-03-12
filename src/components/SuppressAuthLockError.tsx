"use client";

import { useEffect } from "react";

/**
 * Supabase Auth 在多标签/并发下会触发 "Lock broken by another request with the 'steal' option"，
 * 此处统一吞掉该 AbortError，避免弹出 Next 错误遮罩。
 */
export function SuppressAuthLockError() {
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      if (!reason) return;
      const isAbort =
        reason?.name === "AbortError" ||
        (typeof reason?.message === "string" && reason.message.includes("Lock broken"));
      if (isAbort) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);
  return null;
}
