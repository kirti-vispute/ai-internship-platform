export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container-shell grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-ink dark:text-slate-100">InternAI</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Career acceleration for interns. Intelligent hiring for companies.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold dark:text-slate-100">Product</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>Intern Matching</li>
            <li>Company Verification</li>
            <li>Skill Analytics</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold dark:text-slate-100">Resources</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>Help Center</li>
            <li>Privacy</li>
            <li>Terms</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold dark:text-slate-100">Contact</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">support@internai.example</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">+91 90000 00000</p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        © {new Date().getFullYear()} InternAI Platform. All rights reserved.
      </div>
    </footer>
  );
}
