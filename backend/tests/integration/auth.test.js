const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/modules/authentication/models/User");
const { createUser, createAdmin, authHeader } = require("../helpers/factories");

describe("POST /api/auth/intern/login", () => {
  test("logs in with correct credentials and returns a token", async () => {
    const user = await createUser({ role: "intern", email: "intern.login@test.com" });
    const res = await request(app)
      .post("/api/auth/intern/login")
      .send({ email: user.email, password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.role).toBe("intern");
  });

  test("rejects wrong password", async () => {
    const user = await createUser({ role: "intern", email: "intern.badpass@test.com" });
    const res = await request(app)
      .post("/api/auth/intern/login")
      .send({ email: user.email, password: "WrongPassword!" });

    expect(res.status).toBe(401);
  });

  test("rejects login for a role the account does not have (company logging in via intern route)", async () => {
    const user = await createUser({ role: "company", email: "company.viaintern@test.com" });
    const res = await request(app)
      .post("/api/auth/intern/login")
      .send({ email: user.email, password: "Password123!" });

    expect(res.status).toBe(401);
  });

  test("rejects login for a disabled/inactive account", async () => {
    const user = await createUser({ role: "intern", email: "intern.disabled@test.com", isActive: false });
    const res = await request(app)
      .post("/api/auth/intern/login")
      .send({ email: user.email, password: "Password123!" });

    expect(res.status).toBe(403);
  });

  test("rejects unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/intern/login")
      .send({ email: "nobody@nowhere.test", password: "Password123!" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/admin/login", () => {
  test("rejects admin account with no adminRole provisioned", async () => {
    // User.create() runs the model's pre("save") hook, which always defaults
    // adminRole to super_admin for role="admin" — so an unprovisioned record
    // can only exist via a raw update that bypasses that hook (e.g. a bad
    // migration or direct DB edit), which this simulates.
    const user = await createUser({ role: "admin", email: "admin.unprovisioned@test.com" });
    await User.updateOne({ _id: user._id }, { $set: { adminRole: null } });

    const res = await request(app)
      .post("/api/auth/admin/login")
      .send({ email: user.email, password: "Password123!" });

    expect(res.status).toBe(403);
  });

  test("logs in a fully provisioned super_admin", async () => {
    const admin = await createAdmin({ email: "admin.super@test.com" });
    const res = await request(app)
      .post("/api/auth/admin/login")
      .send({ email: admin.email, password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.data.adminRole).toBe("super_admin");
  });
});

describe("GET /api/auth/me", () => {
  test("returns the authenticated user with a valid token", async () => {
    const user = await createUser({ role: "intern", email: "intern.me@test.com" });
    const res = await request(app).get("/api/auth/me").set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
  });

  test("rejects a request with no Authorization header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.code || res.body.error?.code).toBeTruthy();
  });

  test("rejects a malformed/invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set({ Authorization: "Bearer not-a-real-token" });
    expect(res.status).toBe(401);
  });

  test("rejects a token for a user that was deleted after issuance", async () => {
    const user = await createUser({ role: "intern", email: "intern.deleted@test.com" });
    const header = authHeader(user);
    user.isDeleted = true;
    await user.save();

    const res = await request(app).get("/api/auth/me").set(header);
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/auth/theme", () => {
  test("requires authentication", async () => {
    const res = await request(app).patch("/api/auth/theme").send({ themePreference: "ocean" });
    expect(res.status).toBe(401);
  });
});
