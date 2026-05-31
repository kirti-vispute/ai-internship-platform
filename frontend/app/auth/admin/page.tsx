import { AdminAuthForm } from "@/components/auth/admin-auth-form";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function AdminAuthPage() {
  return (
    <main>
      <Navbar />
      <section className="container-shell py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <AdminAuthForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
