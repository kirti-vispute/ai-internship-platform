"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { OTPInput } from "@/components/ui/otp-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { apiRequest } from "@/lib/api-client";
import { resolvePostLoginRedirect } from "@/lib/auth-routes";
import { clearAuthSession, setAuthSession } from "@/lib/session";
import { validateEmail, validateGST, validatePhone } from "@/lib/validation";
import { AuthBrandHeader } from "@/components/brand/auth-brand-header";

type FormMode = "signup" | "login";
export type AuthRole = "intern" | "company";

type InternSignupData = {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};

type CompanySignupData = {
  companyName: string;
  companyEmail: string;
  gst: string;
  contactName: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialInternData: InternSignupData = {
  fullName: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: ""
};

const initialCompanyData: CompanySignupData = {
  companyName: "",
  companyEmail: "",
  gst: "",
  contactName: "",
  phone: "",
  password: "",
  confirmPassword: ""
};

const COMPANY_PROFILE_PLACEHOLDER = "Pending profile completion";

type InternLoginType = "intern1" | "intern2";

const INTERN_LOGIN_PRESETS: Record<
  InternLoginType,
  { title: string; description: string; email: string; password: string }
> = {
  intern1: {
    title: "Demo Intern 1",
    description: "Pre-seeded profile with resume data, applications, and recommendations.",
    email: "intern1@example.com",
    password: "Intern@123"
  },
  intern2: {
    title: "Demo Intern 2",
    description: "Alternate demo intern account for testing additional flows.",
    email: "intern2@example.com",
    password: "Intern@123"
  }
};

type CompanyLoginType = "hr" | "ceo";

const COMPANY_LOGIN_PRESETS: Record<
  CompanyLoginType,
  { title: string; description: string; email: string; password: string }
> = {
  hr: {
    title: "Company HR",
    description: "Manage applicants, interviews, and hiring pipeline for your organization.",
    email: "hr@novatech.example",
    password: "CompanyHr@123"
  },
  ceo: {
    title: "Company CEO",
    description: "Executive access to company verification, analytics, and hiring oversight.",
    email: "ceo@novatech.example",
    password: "CompanyCeo@123"
  }
};

function AuthPortalLinks({ role }: { role: AuthRole }) {
  return (
    <div className="mt-6 space-y-2 border-t border-[var(--ds-border)] pt-4 text-xs">
      <p className="ds-label">Other portals</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {role !== "intern" && (
          <Link href="/auth/intern" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300" data-cursor="link">
            Intern login
          </Link>
        )}
        {role !== "company" && (
          <Link href="/auth/company" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300" data-cursor="link">
            Company login
          </Link>
        )}
        <Link href="/auth/admin" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300" data-cursor="link">
          Admin login
        </Link>
      </div>
    </div>
  );
}

export function RoleAuthForm({ role }: { role: AuthRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<FormMode>("signup");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [internData, setInternData] = useState<InternSignupData>(initialInternData);
  const [companyData, setCompanyData] = useState<CompanySignupData>(initialCompanyData);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetOtpMode, setResetOtpMode] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [companyLoginType, setCompanyLoginType] = useState<CompanyLoginType>("hr");
  const [internLoginType, setInternLoginType] = useState<InternLoginType>("intern1");

  useEffect(() => {
    clearAuthSession();
  }, []);

  const roleTitle = useMemo(() => (role === "intern" ? "Intern Access" : "Company Access"), [role]);
  const roleCopy = useMemo(
    () =>
      role === "intern"
        ? "Sign up or log in as an intern to manage your profile, resume, and applications."
        : "Sign up or log in as a company to post internships and manage applicants.",
    [role]
  );

  const setModeWithReset = useCallback((nextMode: FormMode) => {
    setMode(nextMode);
    setErrors({});
    setFeedback(null);
  }, []);

  const applyCompanyLoginPreset = useCallback((type: CompanyLoginType) => {
    const preset = COMPANY_LOGIN_PRESETS[type];
    setCompanyLoginType(type);
    setLoginData({ email: preset.email, password: preset.password });
    setErrors({});
    setFeedback(null);
  }, []);

  const applyInternLoginPreset = useCallback((type: InternLoginType) => {
    const preset = INTERN_LOGIN_PRESETS[type];
    setInternLoginType(type);
    setLoginData({ email: preset.email, password: preset.password });
    setErrors({});
    setFeedback(null);
  }, []);

  const validateLogin = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!validateEmail(loginData.email)) nextErrors.loginEmail = "Enter a valid email";
    if (!loginData.password) nextErrors.loginPassword = "Password is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [loginData.email, loginData.password]);

  const validateInternSignup = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!internData.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!validateEmail(internData.email)) nextErrors.email = "Enter a valid email";
    if (!validatePhone(internData.mobile)) nextErrors.mobile = "Enter a valid 10-digit mobile number";
    if (internData.password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (internData.password !== internData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [internData]);

  const validateCompanySignup = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!companyData.companyName.trim()) nextErrors.companyName = "Company name is required";
    if (!validateEmail(companyData.companyEmail)) nextErrors.companyEmail = "Enter a valid company email";
    if (!validateGST(companyData.gst)) nextErrors.gst = "Enter a valid GSTIN";
    if (!companyData.contactName.trim()) nextErrors.contactName = "Contact person is required";
    if (!validatePhone(companyData.phone)) nextErrors.phone = "Enter a valid 10-digit mobile number";
    if (companyData.password.length < 8) nextErrors.companyPassword = "Password must be at least 8 characters";
    if (companyData.password !== companyData.confirmPassword) nextErrors.companyConfirmPassword = "Passwords do not match";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [companyData]);

  const handleLoginSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validateLogin()) return;

      try {
        setIsLoading(true);
        setFeedback(null);

        const endpoint = role === "intern" ? "/api/auth/intern/login" : "/api/auth/company/login";
        const response = await apiRequest<{
          message: string;
          token: string;
          refreshToken?: string;
          role: AuthRole;
          permissions?: string[];
        }>(endpoint, {
          method: "POST",
          body: JSON.stringify(loginData)
        });

        setAuthSession(response.role, response.token, {
          refreshToken: response.refreshToken,
          email: loginData.email.trim().toLowerCase(),
          permissions: response.permissions || []
        });
        setFeedback({ type: "success", message: response.message });
        router.push(resolvePostLoginRedirect(response.role, searchParams.get("next")));
      } catch (error) {
        setFeedback({ type: "error", message: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    },
    [loginData, role, router, searchParams, validateLogin]
  );

  const handleSignupSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const isValid = role === "intern" ? validateInternSignup() : validateCompanySignup();
      if (!isValid) return;

      try {
        setIsLoading(true);
        setFeedback(null);

        if (role === "intern") {
          if (!otpVerified) {
            setFeedback({ type: "error", message: "Please verify OTP before creating your account." });
            return;
          }
          const response = await apiRequest<{ message: string; token: string; refreshToken?: string; role: AuthRole }>(
            "/api/auth/intern/signup",
            {
              method: "POST",
              body: JSON.stringify({
                fullName: internData.fullName,
                email: internData.email,
                mobile: internData.mobile,
                password: internData.password
              })
            }
          );

          setAuthSession(response.role, response.token, {
            refreshToken: response.refreshToken,
            email: internData.email.trim().toLowerCase()
          });
          setFeedback({ type: "success", message: response.message });
          router.push(resolvePostLoginRedirect("intern", searchParams.get("next")));
          return;
        }

        const response = await apiRequest<{ message: string; verificationStatus: string }>("/api/auth/company/signup", {
          method: "POST",
          body: JSON.stringify({
            companyName: companyData.companyName,
            companyEmail: companyData.companyEmail,
            gst: companyData.gst,
            contactName: companyData.contactName,
            phone: companyData.phone,
            website: "",
            address: COMPANY_PROFILE_PLACEHOLDER,
            description: COMPANY_PROFILE_PLACEHOLDER,
            password: companyData.password
          })
        });

        setVerificationPending(true);
        setFeedback({ type: "success", message: `${response.message} (${response.verificationStatus})` });
      } catch (error) {
        setFeedback({ type: "error", message: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    },
    [companyData, internData, role, router, validateCompanySignup, validateInternSignup]
  );

  return (
    <Card className="animate-reveal">
      <AuthBrandHeader />
      <div className="mb-6">
        <h1 className="ds-h1">{roleTitle}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{roleCopy}</p>
      </div>
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setModeWithReset("signup")}
          data-cursor="button"
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
            mode === "signup"
              ? "bg-white text-slate-900 shadow-soft dark:bg-slate-900 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Signup
        </button>
        <button
          type="button"
          onClick={() => {
            setModeWithReset("login");
            if (role === "intern") applyInternLoginPreset(internLoginType);
          }}
          data-cursor="button"
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
            mode === "login"
              ? "bg-white text-slate-900 shadow-soft dark:bg-slate-900 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Login
        </button>
      </div>

      <p className="ds-caption mb-4">
        {role === "intern" ? "Looking for company access?" : "Looking for intern access?"}{" "}
        <Link
          href={role === "intern" ? "/auth/company" : "/auth/intern"}
          className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
          data-cursor="link"
        >
          Switch to {role === "intern" ? "Company" : "Intern"}
        </Link>
      </p>

      {feedback && <Alert type={feedback.type} message={feedback.message} />}

      {mode === "login" ? (
        <form className="mt-5 space-y-4" onSubmit={handleLoginSubmit}>
          {role === "intern" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Demo account
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(INTERN_LOGIN_PRESETS) as InternLoginType[]).map((type) => {
                  const preset = INTERN_LOGIN_PRESETS[type];
                  const active = internLoginType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      data-cursor="button"
                      onClick={() => applyInternLoginPreset(type)}
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-primary-500 bg-primary-50 shadow-soft dark:border-primary-400 dark:bg-primary-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-900 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{preset.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Demo credentials</p>
                <p className="mt-1">
                  Email: <span className="font-mono">{INTERN_LOGIN_PRESETS[internLoginType].email}</span>
                </p>
                <p>
                  Password: <span className="font-mono">{INTERN_LOGIN_PRESETS[internLoginType].password}</span>
                </p>
                <button
                  type="button"
                  className="mt-2 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300"
                  onClick={() => applyInternLoginPreset(internLoginType)}
                >
                  Use these credentials
                </button>
              </div>
            </div>
          )}
          {role === "company" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Company account type
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(COMPANY_LOGIN_PRESETS) as CompanyLoginType[]).map((type) => {
                  const preset = COMPANY_LOGIN_PRESETS[type];
                  const active = companyLoginType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      data-cursor="button"
                      onClick={() => applyCompanyLoginPreset(type)}
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-primary-500 bg-primary-50 shadow-soft dark:border-primary-400 dark:bg-primary-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300  dark:bg-slate-900 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{preset.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Demo credentials</p>
                <p className="mt-1">
                  Email: <span className="font-mono">{COMPANY_LOGIN_PRESETS[companyLoginType].email}</span>
                </p>
                <p>
                  Password: <span className="font-mono">{COMPANY_LOGIN_PRESETS[companyLoginType].password}</span>
                </p>
                <button
                  type="button"
                  className="mt-2 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300"
                  onClick={() => applyCompanyLoginPreset(companyLoginType)}
                >
                  Use these credentials
                </button>
              </div>
            </div>
          )}
          <Input
            label="Email"
            type="email"
            placeholder="name@example.com"
            value={loginData.email}
            onChange={(event) => setLoginData((prev) => ({ ...prev, email: event.target.value }))}
            error={errors.loginEmail}
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={loginData.password}
            onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
            error={errors.loginPassword}
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
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setResetOtpMode((prev) => !prev)}
            >
              Forgot password?
            </button>
          </div>
          {resetOtpMode && (
            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  if (!validateEmail(loginData.email)) {
                    setFeedback({ type: "error", message: "Enter a valid email first." });
                    return;
                  }
                  await apiRequest("/api/auth/password/send-otp", { method: "POST", body: JSON.stringify({ email: loginData.email }) });
                  setResetOtpSent(true);
                  setFeedback({ type: "success", message: "Password reset OTP sent." });
                }}
              >
                Send Reset OTP
              </Button>
              {resetOtpSent && (
                <>
                  <OTPInput value={resetOtp} onChange={setResetOtp} />
                  <Input label="New Password" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      await apiRequest("/api/auth/password/reset", {
                        method: "POST",
                        body: JSON.stringify({ email: loginData.email, otp: resetOtp, newPassword })
                      });
                      setFeedback({ type: "success", message: "Password reset successful. You can now log in." });
                    }}
                  >
                    Reset Password
                  </Button>
                </>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner /> Logging in
              </span>
            ) : role === "company" ? (
              `Login as ${COMPANY_LOGIN_PRESETS[companyLoginType].title}`
            ) : (
              `Login as ${INTERN_LOGIN_PRESETS[internLoginType].title}`
            )}
          </Button>
        </form>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleSignupSubmit}>
          {role === "intern" ? (
            <>
              <Input
                label="Full Name"
                placeholder="Enter full name"
                value={internData.fullName}
                onChange={(event) => setInternData((prev) => ({ ...prev, fullName: event.target.value }))}
                error={errors.fullName}
              />
              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={internData.email}
                onChange={(event) => setInternData((prev) => ({ ...prev, email: event.target.value }))}
                error={errors.email}
              />
              <Input
                label="Mobile"
                placeholder="10-digit mobile number"
                value={internData.mobile}
                onChange={(event) => setInternData((prev) => ({ ...prev, mobile: event.target.value.replace(/\D/g, "") }))}
                error={errors.mobile}
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                value={internData.password}
                onChange={(event) => setInternData((prev) => ({ ...prev, password: event.target.value }))}
                error={errors.password}
              />
              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={internData.confirmPassword}
                onChange={(event) => setInternData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                error={errors.confirmPassword}
              />
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Email Verification OTP</p>
                {!otpSent ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      if (!validateEmail(internData.email)) {
                        setFeedback({ type: "error", message: "Enter a valid email before sending OTP." });
                        return;
                      }
                      await apiRequest("/api/auth/intern/send-otp", {
                        method: "POST",
                        body: JSON.stringify({ email: internData.email })
                      });
                      setOtpSent(true);
                      setFeedback({ type: "success", message: "OTP sent to your email." });
                    }}
                  >
                    Send OTP
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <OTPInput value={otp} onChange={setOtp} />
                    <Button
                      type="button"
                      size="sm"
                      disabled={otpVerified}
                      onClick={async () => {
                        await apiRequest("/api/auth/intern/verify-otp", {
                          method: "POST",
                          body: JSON.stringify({ email: internData.email, otp })
                        });
                        setOtpVerified(true);
                        setFeedback({ type: "success", message: "OTP verified. Complete signup now." });
                      }}
                    >
                      {otpVerified ? "OTP Verified" : "Verify OTP"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  data-cursor="button"
                  className="font-medium text-primary-600 hover:text-primary-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide Password" : "Show Password"}
                </button>
              </div>
              <PasswordStrength password={internData.password} />
            </>
          ) : (
            <>
              <Input
                label="Company Name"
                placeholder="Enter company name"
                value={companyData.companyName}
                onChange={(event) => setCompanyData((prev) => ({ ...prev, companyName: event.target.value }))}
                error={errors.companyName}
              />
              <Input
                label="Official Email"
                type="email"
                placeholder="hr@company.com"
                value={companyData.companyEmail}
                onChange={(event) => setCompanyData((prev) => ({ ...prev, companyEmail: event.target.value }))}
                error={errors.companyEmail}
              />
              <Input
                label="GSTIN"
                placeholder="22AAAAA0000A1Z5"
                value={companyData.gst}
                onChange={(event) => setCompanyData((prev) => ({ ...prev, gst: event.target.value.toUpperCase() }))}
                error={errors.gst}
              />
              <Input
                label="Contact Person"
                placeholder="Hiring manager name"
                value={companyData.contactName}
                onChange={(event) => setCompanyData((prev) => ({ ...prev, contactName: event.target.value }))}
                error={errors.contactName}
              />
              <Input
                label="Phone"
                placeholder="10-digit mobile number"
                value={companyData.phone}
                onChange={(event) => setCompanyData((prev) => ({ ...prev, phone: event.target.value.replace(/\D/g, "") }))}
                error={errors.phone}
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                value={companyData.password}
                onChange={(event) => setCompanyData((prev) => ({ ...prev, password: event.target.value }))}
                error={errors.companyPassword}
              />
              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={companyData.confirmPassword}
                onChange={(event) => setCompanyData((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                error={errors.companyConfirmPassword}
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
              </div>
              <PasswordStrength password={companyData.password} />

              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                Verification info: Company accounts are reviewed before posting internships.
              </p>

              {verificationPending && (
                <p className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700 dark:border-primary-800/70 dark:bg-primary-950/40 dark:text-primary-300">
                  Verification pending: Your company profile is under review.
                </p>
              )}
            </>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner /> Creating account
              </span>
            ) : role === "intern" ? (
              "Create Intern Account"
            ) : (
              "Create Company Account"
            )}
          </Button>
        </form>
      )}

      <AuthPortalLinks role={role} />
    </Card>
  );
}

