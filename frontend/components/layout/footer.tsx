export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-shell grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-ink">InternAI</p>
          <p className="mt-2 text-sm text-slate-600">
            Career acceleration for interns. Intelligent hiring for companies.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li>Intern Matching</li>
            <li>Company Verification</li>
            <li>Skill Analytics</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Resources</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li>Help Center</li>
            <li>Privacy</li>
            <li>Terms</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Contact</p>
          <p className="mt-2 text-sm text-slate-600">support@internai.example</p>
          <p className="text-sm text-slate-600">+91 90000 00000</p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} InternAI Platform. All rights reserved.
      </div>
    </footer>
  );
}
