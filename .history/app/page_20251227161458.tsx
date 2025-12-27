"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
const debugAuth = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

  // Updates log entries (add new items when requested)
  const updatesLog = [
    {
      date: "Dec 22, 2025",
      message: "Google and Facebook authorization added to create an account",
    },
    {
      date: "Dec 27, 2025",
      message: "Drag and drop to rearrange card order function has been added. Link share and Login  "
    }
  ];

  // Password validation
  const validatePassword = (pwd: string) => {
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const isLongEnough = pwd.length >= 8;

    return {
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isLongEnough,
      isValid:
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar &&
        isLongEnough,
    };
  };

  const passwordValidation = validatePassword(password);

  useEffect(() => {
    // Check if user is already logged in
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password requirements for sign up
    if (isSignUp && !passwordValidation.isValid) {
      alert("Please meet all password requirements before signing up.");
      return;
    }

    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Send users to our auth callback so we can exchange codes for a session
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setToastMessage("Confirmation email sent. Check inbox and spam.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setAuthLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
      // Redirect happens automatically by Supabase
    } catch (error: any) {
      console.error("OAuth error:", error);
      alert(error.message || "Sign-in failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      alert("Enter your email to receive a magic link.");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setToastMessage("Magic link sent. Check inbox and spam.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (error: any) {
      console.error("Magic link error:", error);
      alert(error.message || "Could not send magic link.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      alert("Enter your email to resend the confirmation.");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setToastMessage("Confirmation resent. Check inbox and spam.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (error: any) {
      console.error("Resend confirmation error:", error);
      alert(error.message || "Could not resend confirmation email.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-md w-full">
        {showToast && (
          <div className="fixed top-4 right-4 z-50">
            <div className="px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm font-semibold">{toastMessage}</span>
            </div>
          </div>
        )}
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <h1
            className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            style={{
              fontFamily: '"Lobster", sans-serif',
            }}
          >
            CircleCards
          </h1>
          <p className="text-xl text-gray-600">
            Create and share personalized voice message cards
          </p>
        </div>

        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {isSignUp ? "Create Account" : "Welcome Back!"} 🎉
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            {isSignUp
              ? "Sign up to start creating voice message cards"
              : "Sign in to create your personalized voice message cards"}
          </p>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-gray-900"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-gray-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {isSignUp && password && (
                <div className="mt-2 space-y-1 text-xs">
                  <div
                    className={
                      passwordValidation.isLongEnough
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {passwordValidation.isLongEnough ? "✓" : "○"} At least 8
                    characters
                  </div>
                  <div
                    className={
                      passwordValidation.hasUpperCase
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {passwordValidation.hasUpperCase ? "✓" : "○"} One uppercase
                    letter
                  </div>
                  <div
                    className={
                      passwordValidation.hasLowerCase
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {passwordValidation.hasLowerCase ? "✓" : "○"} One lowercase
                    letter
                  </div>
                  <div
                    className={
                      passwordValidation.hasNumber
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {passwordValidation.hasNumber ? "✓" : "○"} One number
                  </div>
                  <div
                    className={
                      passwordValidation.hasSpecialChar
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {passwordValidation.hasSpecialChar ? "✓" : "○"} One special
                    character (!@#$%^&*)
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {/* Passwordless / Resend options */}
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              disabled={authLoading || !email}
              onClick={handleMagicLink}
              className="w-full px-6 py-3 border-2 border-purple-300 rounded-xl hover:border-purple-500 transition-all bg-white text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Email me a magic link
            </button>
            {isSignUp && (
              <button
                type="button"
                disabled={authLoading || !email}
                onClick={handleResendConfirmation}
                className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all bg-white text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend confirmation email
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2 text-center">
              Tip: If you don’t see the email, check Spam or Promotions.
            </p>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs uppercase text-gray-500">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* OAuth Buttons */}
          <div className="grid gap-3">
            <button
              type="button"
              disabled={authLoading}
              onClick={() => handleOAuth("google")}
              className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all bg-white text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.676 31.258 29.223 34 24 34c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.869 4.108 29.706 2 24 2 11.85 2 2 11.85 2 24s9.85 22 22 22 22-9.85 22-22c0-1.341-.138-2.651-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.814C14.297 16.108 18.757 14 24 14c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.869 4.108 29.706 2 24 2 15.317 2 7.957 6.76 4.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 46c5.166 0 9.86-1.977 13.409-5.191l-6.19-5.238C29.172 36.477 26.735 37.5 24 37.5 18.805 37.5 14.373 34.127 12.71 29.5l-6.49 5.002C9.828 41.289 16.428 46 24 46z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.353 3.258-4.63 5.5-8.303 5.5-3.582 0-6.64-2.091-8.004-5.108l-6.49 5.002C14.373 34.127 18.805 37.5 24 37.5 29.223 37.5 33.676 34.758 35.303 32h.001c1.095-1.704 1.743-3.705 1.743-5.917 0-1.341-.138-2.651-.389-3.917z"
                />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              disabled={authLoading}
              onClick={() => handleOAuth("facebook")}
              className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all bg-white text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-[#1877F2]"
              >
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.09 4.388 23.094 10.125 24v-8.438H7.078V12.07h3.047V9.412c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.492 0-1.955.93-1.955 1.887v2.251h3.328l-.532 3.492h-2.796V24C19.612 23.094 24 18.09 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          {debugAuth && (
            <div className="mb-6 p-4 text-left bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-gray-700">
              <div className="font-semibold mb-2">Auth Debug</div>
              <div className="space-y-1">
                <div>
                  <span className="font-mono font-semibold">Supabase URL:</span>{" "}
                  {supabaseUrl || "(missing NEXT_PUBLIC_SUPABASE_URL)"}
                </div>
                <div>
                  <span className="font-mono font-semibold">
                    Expected Google/Facebook Redirect URI:
                  </span>{" "}
                  {supabaseUrl
                    ? `${supabaseUrl}/auth/v1/callback`
                    : "(unavailable)"}
                </div>
                <div>
                  <span className="font-mono font-semibold">
                    App return URL (redirectTo):
                  </span>{" "}
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/auth/callback`
                    : "/auth/callback"}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <div className="text-2xl mb-1">🎨</div>
              <div>Custom Themes</div>
            </div>
            <div>
              <div className="text-2xl mb-1">🎵</div>
              <div>Background Music</div>
            </div>
            <div>
              <div className="text-2xl mb-1">🎤</div>
              <div>Voice Messages</div>
            </div>
          </div>

          {/* Updates button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowUpdates(true)}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all bg-white text-gray-900 font-semibold shadow-sm"
            >
              Updates
            </button>
          </div>
        </div>

        {/* Updates Modal */}
        {showUpdates && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowUpdates(false)}
            />
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Updates</h3>
                <button
                  aria-label="Close updates"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowUpdates(false)}
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {updatesLog.map((u, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-4 text-left"
                  >
                    <div className="text-xs text-gray-500 mb-1">{u.date}</div>
                    <div className="text-sm text-gray-900">{u.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
