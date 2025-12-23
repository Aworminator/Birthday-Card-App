"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
        if (data?.session) {
          router.replace("/dashboard");
        } else {
          router.replace("/");
        }
      } catch (e) {
        console.error("Auth callback error", e);
        router.replace("/");
      }
    };
    run();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </main>
  );
}
