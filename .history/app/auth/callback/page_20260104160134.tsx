"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // Handle both PKCE (code) and implicit (hash) flows, including encoded '#' path
        const hash = window.location.hash;
        const decodedPath = decodeURIComponent(window.location.pathname);

        const getFragmentParams = () => {
          if (hash && hash.startsWith("#access_token")) {
            return new URLSearchParams(hash.slice(1));
          }
          // Some providers may return '%23access_token=...' encoded in the path
          if (decodedPath.startsWith("/#access_token")) {
            return new URLSearchParams(decodedPath.slice(2));
          }
          return null;
        };

        const fragmentParams = getFragmentParams();

        if (fragmentParams) {
          const access_token = fragmentParams.get("access_token") || undefined;
          const refresh_token =
            fragmentParams.get("refresh_token") || undefined;
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            if (data?.session) {
              router.replace("/dashboard");
              return;
            }
          }
        }

        // Fallback to PKCE code exchange
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
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
