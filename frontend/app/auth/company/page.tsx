import { RoleAuthForm } from "@/components/auth/role-auth-form";
import { AuthPageShell } from "@/components/layout/auth-page-shell";

export default function CompanyAuthPage() {
  return (
    <AuthPageShell>
      <RoleAuthForm role="company" />
    </AuthPageShell>
  );
}
