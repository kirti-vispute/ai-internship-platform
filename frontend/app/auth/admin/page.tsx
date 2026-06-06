import { AdminAuthForm } from "@/components/auth/admin-auth-form";
import { AuthPageShell } from "@/components/layout/auth-page-shell";

export default function AdminAuthPage() {
  return (
    <AuthPageShell>
      <AdminAuthForm />
    </AuthPageShell>
  );
}
