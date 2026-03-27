"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PasswordStrength } from "@/components/ui/password-strength";
import { RoleSelector, UserRole } from "@/components/ui/role-selector";
import { apiRequest, testBackendConnectivity } from "@/lib/api-client";
import { clearAuthSession, setAuthSession } from "@/lib/session";
import { validateEmail, validateGST, validatePhone, validateUrl } from "@/lib/validation";

type FormMode = "signup" | "login";

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
  website: string;
  address: string;
  description: string;
  password: string;
  confirmPassword: string;
  fileName: string;
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
  website: "",
  address: "",
  description: "",
  password: "",
  confirmPassword: "",
  fileName: ""
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>("signup");
  const [role, setRole] = useState<UserRole>("intern");

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
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "company") {
      setRole("company");
    }

    testBackendConnectivity()
      .then((result) => {
        console.info("[auth] Backend connectivity ok", result);
      })
      .catch((error) => {
        console.error("[auth] Backend connectivity failed", error);
      });
  }, []);

  function handleRoleChange(nextRole: UserRole) {
    setRole(nextRole);
    setErrors({});
    setFeedback(null);
  }

  function validateLogin(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!validateEmail(loginData.email)) nextErrors.loginEmail = "Enter a valid email";
    if (!loginData.password) nextErrors.loginPassword = "Password is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateInternSignup(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!internData.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!validateEmail(internData.email)) nextErrors.email = "Enter a valid email";
    if (!validatePhone(internData.mobile)) nextErrors.mobile = "Enter a valid 10-digit mobile number";
    if (internData.password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (internData.password !== internData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateCompanySignup(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!companyData.companyName.trim()) nextErrors.companyName = "Company name is required";
    if (!validateEmail(companyData.companyEmail)) nextErrors.companyEmail = "Enter a valid company email";
    if (!validateGST(companyData.gst)) nextErrors.gst = "Enter a valid GSTIN";
    if (!companyData.contactName.trim()) nextErrors.contactName = "Contact name is required";
    if (!validatePhone(companyData.phone)) nextErrors.phone = "Enter a valid 10-digit mobile number";
    if (!validateUrl(companyData.website)) nextErrors.website = "Enter a valid website URL";
    if (!companyData.address.trim()) nextErrors.address = "Address is required";
    if (!companyData.description.trim()) nextErrors.description = "Description is required";
    if (companyData.password.length < 8) nextErrors.companyPassword = "Password must be at least 8 characters";
    if (companyData.password !== companyData.confirmPassword) nextErrors.companyConfirmPassword = "Passwords do not match";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateLogin()) return;

    try {
      setIsLoading(true);
      setFeedback(null);

      const endpoint = role === "intern" ? "/api/auth/intern/login" : "/api/auth/company/login";
      const response = await apiRequest<{ message: string; token: string; role: UserRole }>(endpoint, {
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
  }

  async function handleSignupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isValid = role === "intern" ? validateInternSignup() : validateCompanySignup();
    if (!isValid) return;

    try {
      setIsLoading(true);
      setFeedback(null);

      if (role === "intern") {
        const response = await apiRequest<{ message: string; token: string; role: UserRole }>("/api/auth/intern/signup", {
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
      } else {
        const response = await apiRequest<{ message: string; verificationStatus: string }>("/api/auth/company/signup", {
          method: "POST",
          body: JSON.stringify({
            companyName: companyData.companyName,
            companyEmail: companyData.companyEmail,
            gst: companyData.gst,
            contactName: companyData.contactName,
            phone: companyData.phone,
            website: companyData.website,
            address: companyData.address,
            description: companyData.description,
            password: companyData.password
          })
        });

        setVerificationPending(true);
        setFeedback({ type: "success", message: `${response.message} (${response.verificationStatus})` });
      }
    } catch (error) {
      setFeedback({ type: "error", message: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <Navbar />
      <section className="container-shell py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <Card className="animate-reveal">
            <div className="mb-6">
              <h1 className="text-3xl font-black tracking-tight text-ink dark:text-slate-100">Welcome to InternAI</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Create your account or log in to continue.</p>
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setFeedback(null);
                  setErrors({});
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mode === "signup" ? "bg-white text-slate-900 shadow-soft dark:bg-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Signup
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFeedback(null);
                  setErrors({});
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-white text-slate-900 shadow-soft dark:bg-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Login
              </button>
            </div>

            <div className="mb-6">
              <RoleSelector role={role} onChange={handleRoleChange} />
            </div>

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
                    className="font-medium text-primary-600 hover:text-primary-700"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Hide Password" : "Show Password"}
                  </button>
                  <button type="button" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
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
                      label="Company Email"
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
                      label="Contact Name"
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
                      label="Website"
                      placeholder="company.com"
                      value={companyData.website}
                      onChange={(event) => setCompanyData((prev) => ({ ...prev, website: event.target.value }))}
                      error={errors.website}
                    />
                    <Input
                      label="Address"
                      placeholder="Registered office address"
                      value={companyData.address}
                      onChange={(event) => setCompanyData((prev) => ({ ...prev, address: event.target.value }))}
                      error={errors.address}
                    />

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Company Description</span>
                      <textarea
                        className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-400 dark:focus:ring-primary-500/20"
                        placeholder="Tell us about your company"
                        value={companyData.description}
                        onChange={(event) => setCompanyData((prev) => ({ ...prev, description: event.target.value }))}
                      />
                      {errors.description && <span className="mt-1 block text-xs text-rose-600">{errors.description}</span>}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Upload Verification Document</span>
                      <input
                        type="file"
                        className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        onChange={(event) => {
                          const name = event.target.files?.[0]?.name ?? "";
                          setCompanyData((prev) => ({ ...prev, fileName: name }));
                        }}
                      />
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {companyData.fileName ? `Selected file: ${companyData.fileName}` : "File upload placeholder for KYC documents."}
                      </span>
                    </label>

                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                      Verification info: Company accounts are reviewed before posting internships.
                    </p>

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
                        className="font-medium text-primary-600 hover:text-primary-700"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? "Hide Password" : "Show Password"}
                      </button>
                    </div>

                    <PasswordStrength password={companyData.password} />

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
        </div>
      </section>
      <Footer />
    </main>
  );
}
