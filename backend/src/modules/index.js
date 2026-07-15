const authRoutes = require("../routes/auth.routes");
const internRoutes = require("../routes/intern.routes");
const companyRoutes = require("../routes/company.routes");
const internshipRoutes = require("../routes/internship.routes");
const applicationRoutes = require("../routes/application.routes");
const aiRoutes = require("../routes/ai.routes");
const adminRoutes = require("../routes/admin.routes");
const candidateRoutes = require("../routes/candidate.routes");
const skillRoutes = require("../routes/skill.routes");
const companiesRoutes = require("../routes/companies.routes");
const chatRoutes = require("../routes/chat.routes");
const interviewRoutes = require("../routes/interview.routes");

/**
 * Single-deploy modular domains.
 * Each module maps to an existing route bundle — no microservice split required.
 */
const MODULES = Object.freeze([
  { domain: "auth", path: "/auth", router: authRoutes, description: "Authentication + sessions" },
  { domain: "users", path: "/intern", router: internRoutes, description: "Intern profiles + applications" },
  { domain: "users", path: "/company", router: companyRoutes, description: "Company hiring portal" },
  { domain: "users", path: "/applications", router: applicationRoutes, description: "Shared application APIs" },
  { domain: "users", path: "/candidates", router: candidateRoutes, description: "Recruiter candidate search" },
  { domain: "users", path: "/companies", router: companiesRoutes, description: "Public company pages" },
  { domain: "users", path: "/internships", router: internshipRoutes, description: "Internship listings" },
  { domain: "users", path: "/skills", router: skillRoutes, description: "Skill taxonomy" },
  { domain: "users", path: "/admin", router: adminRoutes, description: "Admin moderation" },
  { domain: "ai", path: "/ai", router: aiRoutes, description: "AI hiring + resume intelligence" },
  { domain: "tests", path: "/intern", router: null, description: "Mock tests served via intern module + frontend lazy loaders" },
  { domain: "interviews", path: "/interview", router: interviewRoutes, description: "Interview rooms + WebRTC signaling" },
  { domain: "messaging", path: "/chat", router: chatRoutes, description: "Realtime messaging" },
  { domain: "analytics", path: "/company", router: null, description: "Hiring analytics via company dashboards + optional Neon events" }
]);

function mountModularApi(app, prefix = "/api") {
  const mounted = new Set();

  for (const module of MODULES) {
    if (!module.router || mounted.has(`${prefix}${module.path}`)) continue;
    app.use(`${prefix}${module.path}`, module.router);
    mounted.add(`${prefix}${module.path}`);
  }
}

function getModuleManifest() {
  return MODULES.map(({ domain, path, description }) => ({ domain, path, description }));
}

module.exports = {
  MODULES,
  mountModularApi,
  getModuleManifest
};
