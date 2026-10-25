const request = require("supertest");
const app = require("../../src/app");
const { createInternWithProfile, authHeader } = require("../helpers/factories");
const JobAgentApplication = require("../../src/modules/job-agent/models/JobAgentApplication");

describe("AI Job Agent Security & Data Integrity Audit", () => {
  test("malformed ID in :id parameter returns 400 with INVALID_OBJECT_ID", async () => {
    const { user } = await createInternWithProfile();

    const patchRes = await request(app)
      .patch("/api/job-agent/applications/not-a-valid-object-id")
      .set(authHeader(user))
      .send({ status: "applied" });

    expect(patchRes.status).toBe(400);
    expect(patchRes.body.code).toBe("INVALID_OBJECT_ID");

    const deleteRes = await request(app)
      .delete("/api/job-agent/applications/123-invalid")
      .set(authHeader(user));

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.code).toBe("INVALID_OBJECT_ID");

    const materialsRes = await request(app)
      .post("/api/job-agent/applications/xyz/materials")
      .set(authHeader(user));

    expect(materialsRes.status).toBe(400);
    expect(materialsRes.body.code).toBe("INVALID_OBJECT_ID");
  });

  test("tracking job with malicious javascript: URL sanitizes snapshot.applyUrl to empty string", async () => {
    const { user } = await createInternWithProfile();

    const res = await request(app)
      .post("/api/job-agent/applications")
      .set(authHeader(user))
      .send({
        jobSource: "remotive",
        jobRef: "xss-test-1",
        snapshot: {
          title: "Frontend Engineer",
          companyName: "SafeCorp",
          applyUrl: "javascript:alert(document.cookie)"
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.data.application.snapshot.applyUrl).toBe("");

    // Verify stored document in MongoDB also has safe/sanitized applyUrl
    const stored = await JobAgentApplication.findById(res.body.data.application._id).lean();
    expect(stored.snapshot.applyUrl).toBe("");
  });

  test("user isolation: User B cannot access, patch, or delete User A's tracked applications", async () => {
    const { user: userA } = await createInternWithProfile();
    const { user: userB } = await createInternWithProfile();

    // User A tracks a job
    const created = await request(app)
      .post("/api/job-agent/applications")
      .set(authHeader(userA))
      .send({
        jobSource: "remotive",
        jobRef: "isolated-job-1",
        snapshot: { title: "Private Job", companyName: "User A Corp", applyUrl: "https://example.com/apply" }
      });
    expect(created.status).toBe(201);
    const appId = created.body.data.application._id;

    // User B tries to update User A's application
    const patchRes = await request(app)
      .patch(`/api/job-agent/applications/${appId}`)
      .set(authHeader(userB))
      .send({ status: "interview", notes: "User B intrusion" });
    expect(patchRes.status).toBe(404);

    // User B tries to delete User A's application
    const deleteRes = await request(app)
      .delete(`/api/job-agent/applications/${appId}`)
      .set(authHeader(userB));
    expect(deleteRes.status).toBe(404);

    // User B tries to generate materials for User A's application
    const materialsRes = await request(app)
      .post(`/api/job-agent/applications/${appId}/materials`)
      .set(authHeader(userB));
    expect(materialsRes.status).toBe(404);

    // User B's list does not contain User A's job
    const listRes = await request(app)
      .get("/api/job-agent/applications")
      .set(authHeader(userB));
    expect(listRes.body.data.applications).toHaveLength(0);
  });

  test("preferences gracefully bounds oversized desiredRoles and locations arrays", async () => {
    const { user } = await createInternWithProfile();

    const hugeRoles = Array.from({ length: 100 }, (_, i) => `Role ${i} `);
    const hugeLocations = Array.from({ length: 80 }, (_, i) => `City ${i} `);

    const res = await request(app)
      .put("/api/job-agent/preferences")
      .set(authHeader(user))
      .send({
        desiredRoles: hugeRoles,
        locations: hugeLocations,
        workMode: "remote"
      });

    expect(res.status).toBe(200);
    // Bounded to max 50 items
    expect(res.body.data.preference.desiredRoles.length).toBeLessThanOrEqual(50);
    expect(res.body.data.preference.locations.length).toBeLessThanOrEqual(50);
    // Strings trimmed
    expect(res.body.data.preference.desiredRoles[0]).toBe("Role 0");
  });
});
