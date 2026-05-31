"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiRequest } from "@/lib/api-client";
import { clearAuthSession, setAuthSession, type AdminRole, type AuthRole } from "@/lib/session";
import { validateEmail } from "@/lib/validation";

export function AdminAuthForm() {
  const router = useRouter();
  const [loginData, setLoginData] = useState({ email: "", password: "", otp: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    clearAuthSession();
  }, []);

  const validate = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!validateEmail(loginData.email)) nextErrors.email = "Enter a valid email";
    if (!loginData.password) nextErrors.password = "Password is required";
    if (!loginData.otp) nextErrors.otp = "OTP is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [loginData.email, loginData.password, loginData.otp]);

  const handleSendOtp = useCallback(async () => {
    if (!validateEmail(loginData.email)) {
      setErrors((prev) => ({ ...prev, email: "Enter a valid email" }));
      return;
    }
    try {
      setSendingOtp(true);
      setFeedback(null);
      const response = await apiRequest<{ message: string }>("/api/auth/admin/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: loginData.email })
      });
      setFeedback({ type: "success", message: response.message });
    } catch (error) {
      setFeedback({ type: "error", message: (error as Error).message });
    } finally {
      setSendingOtp(false);
    }
  }, [loginData.email]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validate()) return;

      try {
        setIsLoading(true);
        setFeedback(null);

        const response = await apiRequest<{
          message: string;
          token: string;
          refreshToken?: string;
          role: AuthRole;
          adminRole?: AdminRole | null;
          permissions?: string[];
        }>("/api/auth/admin/login", {
          method: "POST",
          body: JSON.stringify(loginData)
        });

        setAuthSession(response.role, response.token, {
          refreshToken: response.refreshToken,
          adminRole: response.adminRole || null,
          permissions: response.permissions || [],
          email: loginData.email.trim().toLowerCase()
        });
        setFeedback({ type: "success", message: response.message });
        router.push("/dashboard/admin");
      } catch (error) {
        setFeedback({ type: "error", message: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    },
    [loginData, router, validate]
  );

  return (
    <Card className="animate-reveal">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 text-white shadow-glow">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3l8 3v6c0 5.5-3.4 8.5-8 10-4.6-1.5-8-4.5-8-10V6z" />
            <path d="M9.3 12.3l2.1 2.1 3.4-3.7" />
          </svg>
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink dark:text-slate-100">Admin Console</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Secure access for platform administrators.
          </p>
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Not an admin? Use one of the role portals below.
      </p>
      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <Link
          href="/auth/intern"
          className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
          data-cursor="link"
        >
          Intern login
        </Link>
        <Link
          href="/auth/company"
          className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
          data-cursor="link"
        >
          Company login
        </Link>
      </div>

      {feedback && <Alert type={feedback.type} message={feedback.message} />}

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Admin Email"
          type="email"
          placeholder="admin@internai.com"
          value={loginData.email}
          onChange={(event) => setLoginData((prev) => ({ ...prev, email: event.target.value }))}
          error={errors.email}
        />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={loginData.password}
          onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
          error={errors.password}
        />
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            data-cursor="button"
            className="font-medium text-primary-600 hover:text-primary-700"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Hide Password" : "Show Password"}
          </button>
          <button
            type="button"
            data-cursor="button"
            className="font-medium text-primary-600 hover:text-primary-700 disabled:opacity-60"
            onClick={handleSendOtp}
            disabled={sendingOtp}
          >
            {sendingOtp ? "Sending OTP..." : "Send OTP"}
          </button>
        </div>
        <Input
          label="One-Time Password"
          type="text"
          placeholder="Enter email OTP"
          value={loginData.otp}
          onChange={(event) => setLoginData((prev) => ({ ...prev, otp: event.target.value }))}
          error={errors.otp}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner /> Signing in
            </span>
          ) : (
            "Sign in to Admin Console"
          )}
        </Button>
      </form>
    </Card>
  );
}
