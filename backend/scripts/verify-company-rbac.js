require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const API = process.env.API_BASE_URL || "http://localhost:5000";

async function login(email, password) {
  const res = await fetch(`${API}/api/auth/company/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${email} login failed: ${JSON.stringify(body)}`);
  return body.data?.accessToken || body.accessToken || body.token;
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function main() {
  const hrToken = await login("hr@novatech.example", "CompanyHr@123");
  const ceoToken = await login("ceo@novatech.example", "CompanyCeo@123");

  const hrInternships = await get("/api/company/internships?limit=50", hrToken);
  const ceoInternships = await get("/api/company/internships?limit=50", ceoToken);
  const hrAnalytics = await get("/api/company/analytics", hrToken);
  const ceoAnalytics = await get("/api/company/analytics", ceoToken);
  const hrPost = await fetch(`${API}/api/company/internships`, {
    method: "POST",
    headers: { Authorization: `Bearer ${hrToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "Test", description: "Should fail" })
  });

  console.log("=== HR internships ===");
  console.log(JSON.stringify({
    total: hrInternships.body.data?.total ?? hrInternships.body.total,
    meta: hrInternships.body.data?.meta ?? hrInternships.body.meta,
    roles: (hrInternships.body.data?.internships ?? hrInternships.body.internships ?? []).map((i) => i.role)
  }, null, 2));

  console.log("=== CEO internships ===");
  console.log(JSON.stringify({
    total: ceoInternships.body.data?.total ?? ceoInternships.body.total,
    meta: ceoInternships.body.data?.meta ?? ceoInternships.body.meta,
    roles: (ceoInternships.body.data?.internships ?? ceoInternships.body.internships ?? []).map((i) => i.role)
  }, null, 2));

  console.log("=== HR analytics keys ===", Object.keys(hrAnalytics.body.data?.analytics ?? hrAnalytics.body.analytics ?? {}));
  console.log("=== CEO analytics keys ===", Object.keys(ceoAnalytics.body.data?.analytics ?? ceoAnalytics.body.analytics ?? {}));
  console.log("=== HR post internship status ===", hrPost.status);

  const hrA = hrAnalytics.body.data?.analytics ?? hrAnalytics.body.analytics;
  const ceoA = ceoAnalytics.body.data?.analytics ?? ceoAnalytics.body.analytics;
  console.log("=== HR personalPipeline ===", JSON.stringify(hrA?.personalPipeline, null, 2));
  console.log("=== CEO salaryAnalytics present ===", Boolean(ceoA?.salaryAnalytics));
  console.log("=== HR salaryAnalytics present ===", Boolean(hrA?.salaryAnalytics));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
