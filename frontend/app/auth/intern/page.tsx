import { RoleAuthForm } from "@/components/auth/role-auth-form";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function InternAuthPage() {
  return (
    <main>
      <Navbar />
      <section className="container-shell py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <RoleAuthForm role="intern" />
        </div>
      </section>
      <Footer />
    </main>
  );
}
