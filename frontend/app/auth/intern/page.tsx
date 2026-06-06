import { RoleAuthForm } from "@/components/auth/role-auth-form";
import { AuthPageShell } from "@/components/layout/auth-page-shell";

export default function InternAuthPage() {
  return (
    <AuthPageShell>
      <RoleAuthForm role="intern" />
    </AuthPageShell>
  );
}
