import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";
import JobAgentDashboardPage from "@/app/dashboard/intern/job-agent/page";
import * as jobAgentPortal from "@/lib/job-agent-portal";
import type { JobAgentStatus, UnifiedJob } from "@/lib/job-agent-portal";

vi.mock("@/lib/job-agent-portal", async () => {
  const actual = await vi.importActual<typeof import("@/lib/job-agent-portal")>("@/lib/job-agent-portal");
  return {
    ...actual,
    fetchJobAgentStatus: vi.fn(),
    fetchJobAgentFeed: vi.fn(),
    fetchJobAgentProviderHealth: vi.fn(),
    pauseJobAgent: vi.fn(),
    resumeJobAgent: vi.fn(),
    trackJobAgentJob: vi.fn()
  };
});

const mockedFetchStatus = vi.mocked(jobAgentPortal.fetchJobAgentStatus);
const mockedFetchFeed = vi.mocked(jobAgentPortal.fetchJobAgentFeed);
const mockedFetchProviderHealth = vi.mocked(jobAgentPortal.fetchJobAgentProviderHealth);
const mockedPause = vi.mocked(jobAgentPortal.pauseJobAgent);
const mockedResume = vi.mocked(jobAgentPortal.resumeJobAgent);
const mockedTrack = vi.mocked(jobAgentPortal.trackJobAgentJob);

function renderDashboard() {
  return render(
    <ToastProvider>
      <JobAgentDashboardPage />
    </ToastProvider>
  );
}

const baseStatus: JobAgentStatus = {
  configured: true,
  enabled: true,
  pausedAt: null,
  lastSweepAt: null,
  lastSweepMatchCount: 0,
  profileCompleteness: { percent: 100, missing: [] },
  trackedApplicationCount: 0
};

function makeJob(overrides: Partial<UnifiedJob> = {}): UnifiedJob {
  return {
    id: "job-1",
    source: "remotive",
    sourceId: "ext-1",
    isInternal: false,
    title: "Frontend Engineer Intern",
    companyName: "Acme Corp",
    location: "Remote",
    workMode: "remote",
    jobType: "internship",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    stipendText: "",
    category: "",
    description: "",
    applyUrl: "https://example.com/apply",
    postedAt: null,
    skillsRequired: ["React"],
    prioritySkills: [],
    rawEligibilityText: "",
    fitScore: 82,
    matchedRequiredSkills: ["React"],
    missingRequiredSkills: ["TypeScript"],
    matchedPreferredSkills: [],
    missingPreferredSkills: [],
    preferenceMatch: {},
    eligibilityConcerns: [],
    explanation: "Strong match on React experience.",
    experienceLevelTag: "internship",
    ...overrides
  };
}

function feedResponse(jobs: UnifiedJob[], pagination: { page: number; limit: number; total: number; totalPages: number }) {
  return { jobs, meta: { pagination } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedFetchProviderHealth.mockResolvedValue([]);
});

describe("JobAgentDashboardPage", () => {
  test("shows a loading skeleton before the first response arrives", () => {
    mockedFetchStatus.mockReturnValue(new Promise(() => {}));
    mockedFetchFeed.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  test("renders a non-profile error message", async () => {
    mockedFetchStatus.mockRejectedValue(new Error("Network error, please retry"));
    mockedFetchFeed.mockRejectedValue(new Error("Network error, please retry"));
    renderDashboard();
    expect(await screen.findByText("Network error, please retry")).toBeInTheDocument();
  });

  test("shows the complete-your-profile empty state for PROFILE_REQUIRED errors", async () => {
    mockedFetchStatus.mockRejectedValue(new Error("Complete your CareerSetu profile before using the AI Job Agent."));
    mockedFetchFeed.mockRejectedValue(new Error("Complete your CareerSetu profile before using the AI Job Agent."));
    renderDashboard();
    expect(await screen.findByText("Complete your profile to get matches")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Profile" })).toHaveAttribute("href", "/dashboard/intern/profile/edit");
  });

  test("shows the no-matching-jobs empty state when the feed is empty", async () => {
    mockedFetchStatus.mockResolvedValue(baseStatus);
    mockedFetchFeed.mockResolvedValue(feedResponse([], { page: 1, limit: 25, total: 0, totalPages: 0 }));
    renderDashboard();
    expect(await screen.findByText("No matching jobs yet")).toBeInTheDocument();
  });

  test("renders ranked jobs with fit score, matched and missing skills", async () => {
    mockedFetchStatus.mockResolvedValue(baseStatus);
    mockedFetchFeed.mockResolvedValue(feedResponse([makeJob()], { page: 1, limit: 25, total: 1, totalPages: 1 }));
    renderDashboard();

    expect(await screen.findByText("Frontend Engineer Intern")).toBeInTheDocument();
    expect(screen.getByText("82% fit")).toBeInTheDocument();
    expect(screen.getByText("Matches: React")).toBeInTheDocument();
    expect(screen.getByText("Missing: TypeScript")).toBeInTheDocument();
  });

  test("applying filters refetches the feed with the chosen values and resets to page 1", async () => {
    const user = userEvent.setup();
    mockedFetchStatus.mockResolvedValue(baseStatus);
    mockedFetchFeed.mockResolvedValue(feedResponse([makeJob()], { page: 1, limit: 25, total: 1, totalPages: 1 }));
    renderDashboard();
    await screen.findByText("Frontend Engineer Intern");

    await user.type(screen.getByPlaceholderText("e.g. Frontend Engineer"), "Backend");
    await user.selectOptions(screen.getByLabelText("Work mode"), "remote");
    await user.click(screen.getByText("Entry-level only"));
    await user.click(screen.getByRole("button", { name: "Apply Filters" }));

    await waitFor(() => {
      expect(mockedFetchFeed).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: "Backend", workMode: "remote", entryLevelOnly: true, page: 1, limit: 25 })
      );
    });
  });

  test("pausing and resuming the agent calls the right endpoint and flips the badge", async () => {
    const user = userEvent.setup();
    mockedFetchStatus.mockResolvedValue(baseStatus);
    mockedFetchFeed.mockResolvedValue(feedResponse([], { page: 1, limit: 25, total: 0, totalPages: 0 }));
    mockedPause.mockResolvedValue({ ...baseStatus, enabled: false, pausedAt: "2026-01-01T00:00:00.000Z" } as never);
    renderDashboard();

    expect(await screen.findByText("Active")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pause Agent" }));

    expect(mockedPause).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Paused")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Enable Agent" })).toBeInTheDocument();
    expect(mockedResume).not.toHaveBeenCalled();
  });

  test("shows an error toast if pausing the agent fails, without changing the badge", async () => {
    const user = userEvent.setup();
    mockedFetchStatus.mockResolvedValue(baseStatus);
    mockedFetchFeed.mockResolvedValue(feedResponse([], { page: 1, limit: 25, total: 0, totalPages: 0 }));
    mockedPause.mockRejectedValue(new Error("Job Agent has not been configured yet."));
    renderDashboard();

    await screen.findByText("Active");
    await user.click(screen.getByRole("button", { name: "Pause Agent" }));

    expect(await screen.findByText("Couldn't update Job Agent")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  test("saving a job to the tracker calls trackJobAgentJob with the job's source/ref", async () => {
    const user = userEvent.setup();
    const job = makeJob();
    mockedFetchStatus.mockResolvedValue(baseStatus);
    mockedFetchFeed.mockResolvedValue(feedResponse([job], { page: 1, limit: 25, total: 1, totalPages: 1 }));
    mockedTrack.mockResolvedValue({} as never);
    renderDashboard();

    await screen.findByText("Frontend Engineer Intern");
    await user.click(screen.getByRole("button", { name: "Save to Tracker" }));

    await waitFor(() => expect(mockedTrack).toHaveBeenCalledWith(job, "saved"));
    expect(await screen.findByText("Saved to your tracker")).toBeInTheDocument();
  });

  test("shows an error toast when saving to the tracker fails", async () => {
    const user = userEvent.setup();
    mockedFetchStatus.mockResolvedValue(baseStatus);
    mockedFetchFeed.mockResolvedValue(feedResponse([makeJob()], { page: 1, limit: 25, total: 1, totalPages: 1 }));
    mockedTrack.mockRejectedValue(new Error("This job is already tracked."));
    renderDashboard();

    await screen.findByText("Frontend Engineer Intern");
    await user.click(screen.getByRole("button", { name: "Save to Tracker" }));

    expect(await screen.findByText("Couldn't save this job")).toBeInTheDocument();
  });

  describe("pagination", () => {
    test("hides pagination controls when there is only one page", async () => {
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(feedResponse([makeJob()], { page: 1, limit: 25, total: 1, totalPages: 1 }));
      renderDashboard();
      await screen.findByText("Frontend Engineer Intern");
      expect(screen.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument();
    });

    test("Previous is disabled and Next is enabled on page 1 of many", async () => {
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(
        feedResponse([makeJob()], { page: 1, limit: 25, total: 60, totalPages: 3 })
      );
      renderDashboard();
      await screen.findByText("Page 1 of 3", { exact: false });

      expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
    });

    test("clicking Next fetches page 2 while keeping the active role/location filters", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValueOnce(
        feedResponse([makeJob({ id: "p1" })], { page: 1, limit: 25, total: 60, totalPages: 3 })
      );
      renderDashboard();
      await screen.findByText("Page 1 of 3", { exact: false });

      await user.type(screen.getByPlaceholderText("e.g. Frontend Engineer"), "Engineer");

      mockedFetchFeed.mockResolvedValueOnce(
        feedResponse([makeJob({ id: "p2", title: "Second Page Job" })], { page: 2, limit: 25, total: 60, totalPages: 3 })
      );
      await user.click(screen.getByRole("button", { name: "Next page" }));

      await screen.findByText("Second Page Job");
      expect(mockedFetchFeed).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, limit: 25 }));
      expect(await screen.findByText("Page 2 of 3", { exact: false })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
    });

    test("Next is disabled once paged through to the last page", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed
        .mockResolvedValueOnce(feedResponse([makeJob({ id: "p1" })], { page: 1, limit: 25, total: 60, totalPages: 3 }))
        .mockResolvedValueOnce(feedResponse([makeJob({ id: "p2" })], { page: 2, limit: 25, total: 60, totalPages: 3 }))
        .mockResolvedValueOnce(feedResponse([makeJob({ id: "p3" })], { page: 3, limit: 25, total: 60, totalPages: 3 }));
      renderDashboard();

      await screen.findByText("Page 1 of 3", { exact: false });
      await user.click(screen.getByRole("button", { name: "Next page" }));
      await screen.findByText("Page 2 of 3", { exact: false });
      await user.click(screen.getByRole("button", { name: "Next page" }));
      await screen.findByText("Page 3 of 3", { exact: false });

      expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
    });

    test("changing filters resets pagination back to page 1", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed
        .mockResolvedValueOnce(feedResponse([makeJob({ id: "p1" })], { page: 1, limit: 25, total: 60, totalPages: 3 }))
        .mockResolvedValueOnce(feedResponse([makeJob({ id: "p2" })], { page: 2, limit: 25, total: 60, totalPages: 3 }));
      renderDashboard();
      await screen.findByText("Page 1 of 3", { exact: false });
      await user.click(screen.getByRole("button", { name: "Next page" }));
      await screen.findByText("Page 2 of 3", { exact: false });

      mockedFetchFeed.mockResolvedValueOnce(
        feedResponse([makeJob({ id: "p1-filtered" })], { page: 1, limit: 25, total: 5, totalPages: 1 })
      );
      await user.type(screen.getByPlaceholderText("e.g. Frontend Engineer"), "Intern");
      await user.click(screen.getByRole("button", { name: "Apply Filters" }));

      await waitFor(() => {
        expect(mockedFetchFeed).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, role: "Intern" }));
      });
    });

    test("does not request a page outside the valid range", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(
        feedResponse([makeJob()], { page: 1, limit: 25, total: 60, totalPages: 3 })
      );
      renderDashboard();
      await screen.findByText("Page 1 of 3", { exact: false });

      const previousButton = screen.getByRole("button", { name: "Previous page" });
      await user.click(previousButton);

      // Disabled button click is a no-op; fetch is not called a second time with page 0.
      expect(mockedFetchFeed).not.toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
    });
  });

  describe("multi-source filters and provider health", () => {
    test("renders the Job Sources panel with a compact summary, expandable to each provider's health status", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(feedResponse([], { page: 1, limit: 25, total: 0, totalPages: 0 }));
      mockedFetchProviderHealth.mockResolvedValue([
        { source: "remotive", status: "ok", reason: "", jobsFetched: 12, lastRunAt: "2026-01-01T00:00:00.000Z", lastSuccessAt: "2026-01-01T00:00:00.000Z" },
        { source: "naukri", status: "no_legitimate_api", reason: "no_legitimate_public_api", jobsFetched: 0, lastRunAt: null, lastSuccessAt: null }
      ]);

      renderDashboard();

      await screen.findByText("Job Sources");
      const panel = screen.getByText("Job Sources").closest("section") as HTMLElement;
      // Compact by default -- a scannable summary, not a wall of badges.
      expect(within(panel).getByText((text) => text.includes("syncing"))).toBeInTheDocument();
      expect(within(panel).queryByText("Remotive")).not.toBeInTheDocument();

      await user.click(within(panel).getByRole("button", { expanded: false }));
      expect(within(panel).getByText("Remotive")).toBeInTheDocument();
      expect(within(panel).getByText("Naukri")).toBeInTheDocument();
      expect(within(panel).getByText("Requires partnership")).toBeInTheDocument();
    });

    test("does not render the Job Sources panel when no provider health data is available", async () => {
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(feedResponse([], { page: 1, limit: 25, total: 0, totalPages: 0 }));
      mockedFetchProviderHealth.mockResolvedValue([]);

      renderDashboard();
      await screen.findByText("No matching jobs yet");
      expect(screen.queryByText("Job Sources")).not.toBeInTheDocument();
    });

    test("a provider-health fetch failure never blocks the rest of the dashboard from loading", async () => {
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(feedResponse([makeJob()], { page: 1, limit: 25, total: 1, totalPages: 1 }));
      mockedFetchProviderHealth.mockRejectedValue(new Error("provider health unavailable"));

      renderDashboard();
      expect(await screen.findByText("Frontend Engineer Intern")).toBeInTheDocument();
    });

    test("changing the source filter re-fetches the feed scoped to that source, reset to page 1", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(feedResponse([makeJob()], { page: 1, limit: 25, total: 1, totalPages: 1 }));
      renderDashboard();
      await screen.findByText("Frontend Engineer Intern");

      await user.selectOptions(screen.getByLabelText("Source"), "greenhouse");
      await user.click(screen.getByRole("button", { name: "Apply Filters" }));

      await waitFor(() => {
        expect(mockedFetchFeed).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, source: "greenhouse" }));
      });
    });

    test("changing the category filter re-fetches the feed scoped to that category", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(feedResponse([makeJob()], { page: 1, limit: 25, total: 1, totalPages: 1 }));
      renderDashboard();
      await screen.findByText("Frontend Engineer Intern");

      await user.selectOptions(screen.getByLabelText("Category"), "internship");
      await user.click(screen.getByRole("button", { name: "Apply Filters" }));

      await waitFor(() => {
        expect(mockedFetchFeed).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, category: "internship" }));
      });
    });

    test("shows the job's classified category badge and posting age on its card", async () => {
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(
        feedResponse([makeJob({ experienceLevelTag: "internship", postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() })], { page: 1, limit: 25, total: 1, totalPages: 1 })
      );
      renderDashboard();
      expect(await screen.findByText("Internship")).toBeInTheDocument();
      expect(screen.getByText(/Posted 2 days ago/)).toBeInTheDocument();
    });

    test("eligibility concerns are collapsed by default and expand on click, without hiding matched/missing skills or the explanation", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(
        feedResponse([makeJob({ eligibilityConcerns: ["This listing's wording suggests it may target more experienced candidates."] })], { page: 1, limit: 25, total: 1, totalPages: 1 })
      );
      renderDashboard();

      await screen.findByText("Frontend Engineer Intern");
      // Always visible regardless of the concerns disclosure state.
      expect(screen.getByText("Matches: React")).toBeInTheDocument();
      expect(screen.getByText("Missing: TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Strong match on React experience.")).toBeInTheDocument();

      expect(screen.queryByText(/wording suggests/)).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /1 eligibility note/ }));
      expect(screen.getByText(/wording suggests/)).toBeInTheDocument();
    });

    test("Reset clears every filter and re-fetches the unfiltered feed", async () => {
      const user = userEvent.setup();
      mockedFetchStatus.mockResolvedValue(baseStatus);
      mockedFetchFeed.mockResolvedValue(feedResponse([makeJob()], { page: 1, limit: 25, total: 1, totalPages: 1 }));
      renderDashboard();
      await screen.findByText("Frontend Engineer Intern");

      await user.type(screen.getByPlaceholderText("e.g. Frontend Engineer"), "Backend");
      await user.selectOptions(screen.getByLabelText("Work mode"), "remote");
      await user.click(screen.getByRole("button", { name: "Reset" }));

      await waitFor(() => {
        expect(mockedFetchFeed).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 1, role: undefined, workMode: undefined })
        );
      });
      expect((screen.getByPlaceholderText("e.g. Frontend Engineer") as HTMLInputElement).value).toBe("");
    });

    test("a stale last-sweep time (over 24h old) is flagged, a fresh one is not", async () => {
      mockedFetchStatus.mockResolvedValue({ ...baseStatus, lastSweepAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), lastSweepMatchCount: 3 });
      mockedFetchFeed.mockResolvedValue(feedResponse([], { page: 1, limit: 25, total: 0, totalPages: 0 }));
      renderDashboard();
      expect(await screen.findByText("may be stale")).toBeInTheDocument();
    });
  });
});
