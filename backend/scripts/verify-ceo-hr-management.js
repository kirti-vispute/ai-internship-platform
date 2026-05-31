require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const API = process.env.API_BASE_URL || "http://localhost:5000";

async function login(email, password) {
  const res = await fetch(`${API}/api/auth/company/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json();
  const token = body.data?.accessToken || body.accessToken;
  if (!res.ok || !token) throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  return token;
}

async function api(method, path, token, payload) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined
  });
  const body = await res.json();
  return { status: res.status, body: body.data ?? body };
}

async function main() {
  const ceoToken = await login("ceo@novatech.example", "CompanyCeo@123");
  const hrToken = await login("hr@novatech.example", "CompanyHr@123");

  const insightsBefore = await api("GET", "/api/company/hr/insights", ceoToken);
  console.log("GET /hr/insights", insightsBefore.status, "hr count:", insightsBefore.body.hrUsers?.length);

  const create = await api("POST", "/api/company/hr/create", ceoToken, {
    name: "Test HR",
    email: `test.hr.${Date.now()}@novatech.example`,
    password: "TestHr@12345",
    permissions: ["application:review", "pipeline:update"]
  });
  console.log("POST /hr/create", create.status, create.body.hrUser?.email);
  const newHrId = create.body.hrUser?.id;

  const hrBlocked = await api("POST", "/api/company/hr/create", hrToken, {
    name: "Blocked",
    email: `blocked.${Date.now()}@novatech.example`,
    password: "Blocked@12345"
  });
  console.log("HR create blocked:", hrBlocked.status, hrBlocked.body.message || hrBlocked.body);

  const patch = await api("PATCH", `/api/company/hr/${newHrId}/permissions`, ceoToken, {
    permissions: ["application:review", "feedback:write", "company:analytics:recruiter"]
  });
  console.log("PATCH permissions", patch.status, patch.body.hrUser?.permissions);

  const del = await api("DELETE", `/api/company/hr/${newHrId}`, ceoToken);
  console.log("DELETE /hr/:id", del.status, del.body.deleted);

  const insightsAfter = await api("GET", "/api/company/hr/insights", ceoToken);
  console.log("After delete hr count:", insightsAfter.body.hrUsers?.length);
  console.log("SUCCESS: CEO HR management verified");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
