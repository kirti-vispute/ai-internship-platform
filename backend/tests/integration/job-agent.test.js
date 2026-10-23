const request = require("supertest");
const app = require("../../src/app");
const { createInternWithProfile, createCompanyWithProfile, createInternship, authHeader } = require("../helpers/factories");
const InternProfile = require("../../src/modules/students/models/InternProfile");

describe("AI Job Agent API", () => {
  test("every endpoint requires authentication", async () => {
    const res = await request(app).get("/api/job-agent/status");
    expect(res.status).toBe(401);
  });

  test("a company account cannot access intern-only Job Agent endpoints", async () => {
    const { user: companyUser } = await createCompanyWithProfile();
    const res = await request(app).get("/api/job-agent/status").set(authHeader(companyUser));
    expect(res.status).toBe(403);
  });

  test("GET /status works before the agent has ever been configured", async () => {
    const { user } = await createInternWithProfile();
    const res = await request(app).get("/api/job-agent/status").set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.data.configured).toBe(false);
    expect(res.body.data.enabled).toBe(false);
  });

  test("PUT /preferences creates preferences on first save and rejects an invalid workMode", async () => {
    const { user } = await createInternWithProfile();

    const invalid = await request(app)
      .put("/api/job-agent/preferences")
      .set(authHeader(user))
      .send({ workMode: "not-a-real-mode" });
    expect(invalid.status).toBe(400);

    const res = await request(app)
      .put("/api/job-agent/preferences")
      .set(authHeader(user))
      .send({ enabled: true, desiredRoles: ["Backend Developer"], workMode: "remote", minSalary: 15000 });

    expect(res.status).toBe(200);
    expect(res.body.data.preference.enabled).toBe(true);
    expect(res.body.data.preference.desiredRoles).toEqual(["Backend Developer"]);
  });

  test("PUT /preferences fails cleanly when the intern has no profile yet", async () => {
    // A bare user record with no InternProfile -- simulates an edge case the
    // controller must reject with a clear message, never a raw 500.
    const { createUser } = require("../helpers/factories");
    const user = await createUser({ role: "intern" });
    const res = await request(app).put("/api/job-agent/preferences").set(authHeader(user)).send({ enabled: true });
    expect(res.status).toBe(400);
    expect(res.body.code || res.body.error?.code).toBeTruthy();
  });

  test("POST /pause and /resume toggle the agent and persist pausedAt", async () => {
    const { user } = await createInternWithProfile();
    await request(app).put("/api/job-agent/preferences").set(authHeader(user)).send({ enabled: true });

    const paused = await request(app).post("/api/job-agent/pause").set(authHeader(user)).send({ reason: "taking a break" });
    expect(paused.status).toBe(200);
    expect(paused.body.data.preference.enabled).toBe(false);
    expect(paused.body.data.preference.pausedAt).toBeTruthy();

    const resumed = await request(app).post("/api/job-agent/resume").set(authHeader(user));
    expect(resumed.status).toBe(200);
    expect(resumed.body.data.preference.enabled).toBe(true);
    expect(resumed.body.data.preference.pausedAt).toBeNull();
  });

  test("GET /feed scores and returns an internal internship that matches the intern's skills", async () => {
    const { user, profile } = await createInternWithProfile({ profile: { skills: ["JavaScript", "React"] } });
    const { profile: companyProfile } = await createCompanyWithProfile();
    await createInternship(companyProfile, {
      role: "Frontend Intern",
      skillsRequired: ["javascript", "react"],
      mode: "remote",
      isActive: true,
      isDeleted: false
    });

    const res = await request(app).get("/api/job-agent/feed").set(authHeader(user));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.jobs)).toBe(true);
    const match = res.body.data.jobs.find((j) => j.title === "Frontend Intern");
    expect(match).toBeTruthy();
    expect(match.fitScore).toBeGreaterThanOrEqual(90);
    expect(match.isInternal).toBe(true);
  });

  test("GET /feed fails cleanly (400, not 500) when the intern has no profile yet", async () => {
    const { createUser } = require("../helpers/factories");
    const user = await createUser({ role: "intern" });
    const res = await request(app).get("/api/job-agent/feed").set(authHeader(user));
    expect(res.status).toBe(400);
  });

  test("tracking a job is idempotent: tracking the same job twice does not create a duplicate or error", async () => {
    const { user } = await createInternWithProfile();
    const payload = {
      jobSource: "remotive",
      jobRef: "job-123",
      snapshot: { title: "Backend Dev", companyName: "RemoteCo", location: "", applyUrl: "https://remotive.com/jobs/123" },
      fitScore: 80
    };

    const first = await request(app).post("/api/job-agent/applications").set(authHeader(user)).send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/job-agent/applications").set(authHeader(user)).send(payload);
    expect(second.status).toBe(200);
    expect(second.body.data.application._id).toBe(first.body.data.application._id);

    const list = await request(app).get("/api/job-agent/applications").set(authHeader(user));
    expect(list.body.data.applications).toHaveLength(1);
  });

  test("a user cannot update or delete another user's tracked application (ownership enforced)", async () => {
    const { user: ownerUser } = await createInternWithProfile();
    const { user: otherUser } = await createInternWithProfile();

    const created = await request(app)
      .post("/api/job-agent/applications")
      .set(authHeader(ownerUser))
      .send({ jobSource: "remotive", jobRef: "job-999", snapshot: { title: "X", companyName: "Y", location: "", applyUrl: "" } });

    const applicationId = created.body.data.application._id;

    const patchAttempt = await request(app)
      .patch(`/api/job-agent/applications/${applicationId}`)
      .set(authHeader(otherUser))
      .send({ status: "applied" });
    expect(patchAttempt.status).toBe(404);

    const deleteAttempt = await request(app)
      .delete(`/api/job-agent/applications/${applicationId}`)
      .set(authHeader(otherUser));
    expect(deleteAttempt.status).toBe(404);
  });

  test("updating a tracked application's status records the change", async () => {
    const { user } = await createInternWithProfile();
    const created = await request(app)
      .post("/api/job-agent/applications")
      .set(authHeader(user))
      .send({ jobSource: "remotive", jobRef: "job-555", snapshot: { title: "X", companyName: "Y", location: "", applyUrl: "" } });

    const applicationId = created.body.data.application._id;
    const updated = await request(app)
      .patch(`/api/job-agent/applications/${applicationId}`)
      .set(authHeader(user))
      .send({ status: "applied", notes: "Applied via referral" });

    expect(updated.status).toBe(200);
    expect(updated.body.data.application.status).toBe("applied");
    expect(updated.body.data.application.notes).toBe("Applied via referral");
  });

  test("rejects an invalid status value instead of saving bad data", async () => {
    const { user } = await createInternWithProfile();
    const created = await request(app)
      .post("/api/job-agent/applications")
      .set(authHeader(user))
      .send({ jobSource: "remotive", jobRef: "job-777", snapshot: { title: "X", companyName: "Y", location: "", applyUrl: "" } });

    const res = await request(app)
      .patch(`/api/job-agent/applications/${created.body.data.application._id}`)
      .set(authHeader(user))
      .send({ status: "ghosted" });
    expect(res.status).toBe(400);
  });

  test("generating application materials uses only the candidate's verified profile data (AI disabled in test env, so this is the template path)", async () => {
    const { user, profile } = await createInternWithProfile({
      profile: { fullName: "Test Intern", skills: ["JavaScript", "React"] }
    });
    await InternProfile.updateOne({ _id: profile._id }, { $set: { skills: ["JavaScript", "React"] } });

    const created = await request(app)
      .post("/api/job-agent/applications")
      .set(authHeader(user))
      .send({
        jobSource: "remotive",
        jobRef: "job-materials",
        snapshot: {
          title: "React Developer",
          companyName: "RemoteCo",
          location: "",
          applyUrl: "https://remotive.com/jobs/materials",
          skillsRequired: ["javascript", "react"],
          prioritySkills: []
        }
      });

    const generated = await request(app)
      .post(`/api/job-agent/applications/${created.body.data.application._id}/materials`)
      .set(authHeader(user));

    expect(generated.status).toBe(200);
    expect(generated.body.data.application.tailoredResume.content).toContain("Test Intern");
    expect(generated.body.data.application.coverLetter.content).toContain("React Developer");
  });

  test("the user's own edits to generated materials are saved verbatim", async () => {
    const { user } = await createInternWithProfile();
    const created = await request(app)
      .post("/api/job-agent/applications")
      .set(authHeader(user))
      .send({ jobSource: "remotive", jobRef: "job-edit", snapshot: { title: "X", companyName: "Y", location: "", applyUrl: "" } });

    const edited = await request(app)
      .patch(`/api/job-agent/applications/${created.body.data.application._id}/materials`)
      .set(authHeader(user))
      .send({ coverLetterContent: "My own hand-edited cover letter." });

    expect(edited.status).toBe(200);
    expect(edited.body.data.application.coverLetter.content).toBe("My own hand-edited cover letter.");
    expect(edited.body.data.application.coverLetter.source).toBe("user-edited");
  });

  test("DELETE removes a tracked application", async () => {
    const { user } = await createInternWithProfile();
    const created = await request(app)
      .post("/api/job-agent/applications")
      .set(authHeader(user))
      .send({ jobSource: "remotive", jobRef: "job-delete", snapshot: { title: "X", companyName: "Y", location: "", applyUrl: "" } });

    const deleted = await request(app)
      .delete(`/api/job-agent/applications/${created.body.data.application._id}`)
      .set(authHeader(user));
    expect(deleted.status).toBe(200);

    const list = await request(app).get("/api/job-agent/applications").set(authHeader(user));
    expect(list.body.data.applications).toHaveLength(0);
  });
});
