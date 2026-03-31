"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PasswordStrength } from "@/components/ui/password-strength";
import { apiRequest } from "@/lib/api-client";
import { clearAuthSession, setAuthSession } from "@/lib/session";
import { validateEmail, validateGST, validatePhone } from "@/lib/validation";

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

export function RoleAuthForm({ role }: { role: AuthRole }) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>("signup");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [internData, setInternData] = useState<InternSignupData>(initialInternData);
  const [companyData, setCompanyData] = useState<CompanySignupData>(initialCompanyData);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
        const response = await apiRequest<{ message: string; token: string; role: AuthRole }>(endpoint, {
          method: "POST",
          body: JSON.stringify(loginData)
        });

        setAuthSession(response.role, response.token);
        setFeedback({ type: "success", message: response.message });
        router.push(response.role === "intern" ? "/dashboard/intern" : "/dashboard/company");
      } catch (error) {
        setFeedback({ type: "error", message: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    },
    [loginData, role, router, validateLogin]
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
          const response = await apiRequest<{ message: string; token: string; role: AuthRole }>("/api/auth/intern/signup", {
            method: "POST",
            body: JSON.stringify({
              fullName: internData.fullName,
              email: internData.email,
              mobile: internData.mobile,
              password: internData.password
            })
          });

          setAuthSession(response.role, response.token);
          setFeedback({ type: "success", message: response.message });
          router.push("/dashboard/intern");
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
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-ink dark:text-slate-100">{roleTitle}</h1>
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
          onClick={() => setModeWithReset("login")}
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

      <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
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
            <button type="button" data-cursor="button" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Forgot password?
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner /> Logging in
              </span>
            ) : (
              `Login as ${role === "intern" ? "Intern" : "Company"}`
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
    </Card>
  );
}

