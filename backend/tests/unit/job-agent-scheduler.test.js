const { jobAlertKey, isDueForNotification } = require("../../src/modules/job-agent/services/job-agent-scheduler.service");

describe("Job Agent scheduler dedup/frequency helpers", () => {
  test("jobAlertKey is stable and unique per user+source+job", () => {
    const a = jobAlertKey({ userId: "u1", source: "remotive", sourceId: "123" });
    const b = jobAlertKey({ userId: "u1", source: "remotive", sourceId: "123" });
    const c = jobAlertKey({ userId: "u1", source: "adzuna", sourceId: "123" });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  test("realtime notification frequency is always due", () => {
    const preference = { notificationFrequency: "realtime", lastNotifiedAt: new Date() };
    expect(isDueForNotification(preference, Date.now())).toBe(true);
  });

  test("daily frequency is not due again within 24 hours of the last notification", () => {
    const now = Date.now();
    const preference = { notificationFrequency: "daily", lastNotifiedAt: new Date(now - 60 * 60 * 1000) };
    expect(isDueForNotification(preference, now)).toBe(false);
  });

  test("daily frequency is due again after 24 hours have passed", () => {
    const now = Date.now();
    const preference = { notificationFrequency: "daily", lastNotifiedAt: new Date(now - 25 * 60 * 60 * 1000) };
    expect(isDueForNotification(preference, now)).toBe(true);
  });

  test("a preference that has never been notified before is always due, regardless of frequency", () => {
    const preference = { notificationFrequency: "weekly", lastNotifiedAt: null };
    expect(isDueForNotification(preference, Date.now())).toBe(true);
  });
});
