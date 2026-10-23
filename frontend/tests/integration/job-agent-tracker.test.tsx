import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";
import JobAgentTrackerPage from "@/app/dashboard/intern/job-agent/tracker/page";
import * as jobAgentPortal from "@/lib/job-agent-portal";
import type { JobAgentApplication } from "@/lib/job-agent-portal";

vi.mock("@/lib/job-agent-portal", async () => {
  const actual = await vi.importActual<typeof import("@/lib/job-agent-portal")>("@/lib/job-agent-portal");
  return {
    ...actual,
    fetchJobAgentApplications: vi.fn(),
    updateJobAgentApplication: vi.fn(),
    deleteJobAgentApplication: vi.fn(),
    generateJobAgentMaterials: vi.fn(),
    updateJobAgentMaterials: vi.fn()
  };
});

const mockedFetchApplications = vi.mocked(jobAgentPortal.fetchJobAgentApplications);
const mockedUpdateApplication = vi.mocked(jobAgentPortal.updateJobAgentApplication);
const mockedDeleteApplication = vi.mocked(jobAgentPortal.deleteJobAgentApplication);
const mockedGenerateMaterials = vi.mocked(jobAgentPortal.generateJobAgentMaterials);
const mockedUpdateMaterials = vi.mocked(jobAgentPortal.updateJobAgentMaterials);

function renderTracker() {
  return render(
    <ToastProvider>
      <JobAgentTrackerPage />
    </ToastProvider>
  );
}

function makeApplication(overrides: Partial<JobAgentApplication> = {}): JobAgentApplication {
  return {
    _id: "app-1",
    user: "user-1",
    internProfile: "profile-1",
    jobSource: "remotive",
    jobRef: "ext-1",
    internshipId: null,
    externalJobId: "ext-1",
    snapshot: {
      title: "Frontend Engineer Intern",
      companyName: "Acme Corp",
      location: "Remote",
      applyUrl: "https://example.com/apply",
      skillsRequired: ["React"],
      prioritySkills: []
    },
    fitScore: 82,
    status: "saved",
    statusHistory: [],
    tailoredResume: { content: "", generatedAt: null, source: "template" },
    coverLetter: { content: "", generatedAt: null, source: "template" },
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("JobAgentTrackerPage", () => {
  test("shows a loading skeleton while applications are being fetched", () => {
    mockedFetchApplications.mockReturnValue(new Promise(() => {}));
    renderTracker();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  test("shows an error message when loading applications fails", async () => {
    mockedFetchApplications.mockRejectedValue(new Error("Cannot reach backend API"));
    renderTracker();
    expect(await screen.findByText("Cannot reach backend API")).toBeInTheDocument();
  });

  test("shows the empty-tracker state when there is nothing saved yet", async () => {
    mockedFetchApplications.mockResolvedValue([]);
    renderTracker();
    expect(await screen.findByText("No tracked jobs yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse Job Matches" })).toHaveAttribute("href", "/dashboard/intern/job-agent");
  });

  test("renders a tracked application with its status and fit score", async () => {
    mockedFetchApplications.mockResolvedValue([makeApplication()]);
    renderTracker();

    expect(await screen.findByText("Frontend Engineer Intern")).toBeInTheDocument();
    expect(screen.getByText("saved")).toBeInTheDocument();
    expect(screen.getByText("82% fit")).toBeInTheDocument();
  });

  test("clicking a status filter button refetches applications scoped to that status", async () => {
    const user = userEvent.setup();
    mockedFetchApplications.mockResolvedValue([makeApplication()]);
    renderTracker();
    await screen.findByText("Frontend Engineer Intern");

    mockedFetchApplications.mockResolvedValueOnce([makeApplication({ status: "applied" })]);
    await user.click(screen.getByRole("button", { name: "Applied" }));

    await waitFor(() => expect(mockedFetchApplications).toHaveBeenLastCalledWith("applied"));
  });

  test("the All filter refetches with no status scope", async () => {
    const user = userEvent.setup();
    mockedFetchApplications.mockResolvedValue([makeApplication()]);
    renderTracker();
    await screen.findByText("Frontend Engineer Intern");

    await user.click(screen.getByRole("button", { name: "Interview" }));
    await waitFor(() => expect(mockedFetchApplications).toHaveBeenLastCalledWith("interview"));

    await user.click(screen.getByRole("button", { name: "All" }));
    await waitFor(() => expect(mockedFetchApplications).toHaveBeenLastCalledWith(undefined));
  });

  test("changing the status dropdown updates the application in place", async () => {
    const user = userEvent.setup();
    const application = makeApplication();
    mockedFetchApplications.mockResolvedValue([application]);
    mockedUpdateApplication.mockResolvedValue({ ...application, status: "interview" });
    renderTracker();

    await screen.findByText("Frontend Engineer Intern");
    await user.selectOptions(screen.getByRole("combobox"), "interview");

    await waitFor(() => expect(mockedUpdateApplication).toHaveBeenCalledWith("app-1", { status: "interview" }));
    expect(await screen.findByText("interview")).toBeInTheDocument();
  });

  test("shows an error toast when a status update fails", async () => {
    const user = userEvent.setup();
    mockedFetchApplications.mockResolvedValue([makeApplication()]);
    mockedUpdateApplication.mockRejectedValue(new Error("Tracked application not found."));
    renderTracker();

    await screen.findByText("Frontend Engineer Intern");
    await user.selectOptions(screen.getByRole("combobox"), "rejected");

    expect(await screen.findByText("Couldn't update status")).toBeInTheDocument();
  });

  test("removing an application calls delete and drops it from the list", async () => {
    const user = userEvent.setup();
    mockedFetchApplications.mockResolvedValue([makeApplication()]);
    mockedDeleteApplication.mockResolvedValue({ message: "Removed from your tracker." });
    renderTracker();

    await screen.findByText("Frontend Engineer Intern");
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(mockedDeleteApplication).toHaveBeenCalledWith("app-1"));
    await waitFor(() => expect(screen.queryByText("Frontend Engineer Intern")).not.toBeInTheDocument());
    expect(await screen.findByText("Removed from tracker")).toBeInTheDocument();
  });

  test("generating materials fetches them, expands the editor, and pre-fills the drafts", async () => {
    const user = userEvent.setup();
    const application = makeApplication();
    const withMaterials = {
      ...application,
      tailoredResume: { content: "Tailored resume content", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" },
      coverLetter: { content: "Dear hiring manager...", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" }
    };
    mockedFetchApplications.mockResolvedValue([application]);
    mockedGenerateMaterials.mockResolvedValue(withMaterials);
    renderTracker();

    await screen.findByText("Frontend Engineer Intern");
    await user.click(screen.getByRole("button", { name: "Generate Materials" }));

    await waitFor(() => expect(mockedGenerateMaterials).toHaveBeenCalledWith("app-1"));
    // Resume is the default tab -- its content and source badge are visible immediately.
    expect(await screen.findByDisplayValue("Tailored resume content")).toBeInTheDocument();
    expect(screen.getByText("AI-polished (groq)")).toBeInTheDocument();

    // Switching to the Cover Letter tab reveals its own content and badge
    // (the workspace is tabbed, per the redesign, so only one document's
    // editor is mounted at a time).
    await user.click(screen.getByRole("tab", { name: "Cover Letter" }));
    expect(screen.getByDisplayValue("Dear hiring manager...")).toBeInTheDocument();
    expect(screen.getByText("AI-polished (groq)")).toBeInTheDocument();

    expect(screen.getByText("Materials generated — review before using them")).toBeInTheDocument();
  });

  test("editing and saving materials sends the edited content, generated via Generate Materials so both drafts are seeded", async () => {
    const user = userEvent.setup();
    const application = makeApplication();
    const generated = {
      ...application,
      tailoredResume: { content: "Original resume", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" },
      coverLetter: { content: "Original letter", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" }
    };
    mockedFetchApplications.mockResolvedValue([application]);
    mockedGenerateMaterials.mockResolvedValue(generated);
    renderTracker();

    await screen.findByText("Frontend Engineer Intern");
    await user.click(screen.getByRole("button", { name: "Generate Materials" }));

    const resumeBox = await screen.findByDisplayValue("Original resume");
    await user.clear(resumeBox);
    await user.type(resumeBox, "Edited resume content");

    mockedUpdateMaterials.mockResolvedValue({
      ...generated,
      tailoredResume: { content: "Edited resume content", generatedAt: "2026-01-02T00:00:00.000Z", source: "user-edited" }
    });
    await user.click(screen.getByRole("button", { name: "Save My Edits" }));

    await waitFor(() =>
      expect(mockedUpdateMaterials).toHaveBeenCalledWith("app-1", {
        tailoredResumeContent: "Edited resume content",
        coverLetterContent: "Original letter"
      })
    );
    expect(await screen.findByText("Your edits were saved")).toBeInTheDocument();
    expect(screen.getByText("Edited by you")).toBeInTheDocument();
  });

  // Regression guard: if a job was opened straight to "View Materials" (content
  // already existed from an earlier session) and only one field is touched,
  // the draft for the untouched field was never seeded into local state. The
  // save call correctly sends `undefined` for it rather than stale/garbage
  // text -- the backend's updateMaterials only applies string fields and
  // leaves anything else untouched, so this is a safe no-op, not data loss.
  test("saving after editing only one field leaves the other field's content untouched server-side", async () => {
    const user = userEvent.setup();
    const alreadyGenerated = makeApplication({
      tailoredResume: { content: "Original resume", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" },
      coverLetter: { content: "Original letter", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" }
    });
    mockedFetchApplications.mockResolvedValue([alreadyGenerated]);
    renderTracker();

    await screen.findByText("Frontend Engineer Intern");
    await user.click(screen.getByRole("button", { name: "View Materials" }));

    const resumeBox = await screen.findByDisplayValue("Original resume");
    await user.clear(resumeBox);
    await user.type(resumeBox, "Edited resume content");

    mockedUpdateMaterials.mockResolvedValue(alreadyGenerated);
    await user.click(screen.getByRole("button", { name: "Save My Edits" }));

    await waitFor(() =>
      expect(mockedUpdateMaterials).toHaveBeenCalledWith("app-1", {
        tailoredResumeContent: "Edited resume content",
        coverLetterContent: undefined
      })
    );
  });

  test("shows an error toast when generating materials fails", async () => {
    const user = userEvent.setup();
    mockedFetchApplications.mockResolvedValue([makeApplication()]);
    mockedGenerateMaterials.mockRejectedValue(new Error("Complete your CareerSetu profile before using the AI Job Agent."));
    renderTracker();

    await screen.findByText("Frontend Engineer Intern");
    await user.click(screen.getByRole("button", { name: "Generate Materials" }));

    expect(await screen.findByText("Couldn't generate materials")).toBeInTheDocument();
  });

  describe("regenerating materials never silently overwrites existing content", () => {
    function applicationWithExistingMaterials() {
      return makeApplication({
        tailoredResume: { content: "Existing resume content", generatedAt: "2026-01-01T00:00:00.000Z", source: "groq" },
        coverLetter: { content: "Existing cover letter", generatedAt: "2026-01-01T00:00:00.000Z", source: "user-edited" }
      });
    }

    test("clicking Regenerate Materials when materials already exist asks for confirmation instead of calling the API immediately", async () => {
      const user = userEvent.setup();
      mockedFetchApplications.mockResolvedValue([applicationWithExistingMaterials()]);
      renderTracker();

      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "Regenerate Materials" }));

      expect(await screen.findByText("Regenerate application materials?")).toBeInTheDocument();
      expect(mockedGenerateMaterials).not.toHaveBeenCalled();
    });

    test("confirming the dialog proceeds with regeneration", async () => {
      const user = userEvent.setup();
      mockedFetchApplications.mockResolvedValue([applicationWithExistingMaterials()]);
      mockedGenerateMaterials.mockResolvedValue({
        ...applicationWithExistingMaterials(),
        tailoredResume: { content: "Freshly regenerated resume", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" },
        coverLetter: { content: "Freshly regenerated letter", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" }
      });
      renderTracker();

      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "Regenerate Materials" }));
      await screen.findByText("Regenerate application materials?");
      await user.click(screen.getByRole("button", { name: "Regenerate" }));

      await waitFor(() => expect(mockedGenerateMaterials).toHaveBeenCalledWith("app-1"));
      expect(await screen.findByText("Materials generated — review before using them")).toBeInTheDocument();
    });

    test("canceling the dialog leaves the existing materials untouched and never calls the API", async () => {
      const user = userEvent.setup();
      mockedFetchApplications.mockResolvedValue([applicationWithExistingMaterials()]);
      renderTracker();

      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "Regenerate Materials" }));
      await screen.findByText("Regenerate application materials?");
      await user.click(screen.getByRole("button", { name: "Keep current" }));

      await waitFor(() => expect(screen.queryByText("Regenerate application materials?")).not.toBeInTheDocument());
      expect(mockedGenerateMaterials).not.toHaveBeenCalled();
    });

    test("the first-ever Generate Materials click (no existing content) never shows a confirmation", async () => {
      const user = userEvent.setup();
      mockedFetchApplications.mockResolvedValue([makeApplication()]); // empty tailoredResume/coverLetter content
      mockedGenerateMaterials.mockResolvedValue(applicationWithExistingMaterials());
      renderTracker();

      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "Generate Materials" }));

      expect(screen.queryByText("Regenerate application materials?")).not.toBeInTheDocument();
      await waitFor(() => expect(mockedGenerateMaterials).toHaveBeenCalledWith("app-1"));
    });
  });

  describe("materials workspace: unsaved-change handling and preview mode", () => {
    function applicationWithMaterials() {
      return makeApplication({
        tailoredResume: { content: "Original resume", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" },
        coverLetter: { content: "Original letter", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" }
      });
    }

    test("Save My Edits is disabled until a change is made, and the unsaved-changes indicator only appears after editing", async () => {
      const user = userEvent.setup();
      mockedFetchApplications.mockResolvedValue([applicationWithMaterials()]);
      renderTracker();

      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "View Materials" }));

      const saveButton = screen.getByRole("button", { name: "Save My Edits" });
      expect(saveButton).toBeDisabled();
      expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
      expect(screen.getByText("Everything here is saved.")).toBeInTheDocument();

      const resumeBox = screen.getByDisplayValue("Original resume");
      await user.type(resumeBox, " extra");

      expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
      expect(screen.getByText("You have unsaved changes.")).toBeInTheDocument();
      expect(saveButton).toBeEnabled();
    });

    test("Preview mode renders the content read-only without losing the underlying draft text", async () => {
      const user = userEvent.setup();
      mockedFetchApplications.mockResolvedValue([applicationWithMaterials()]);
      renderTracker();

      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "View Materials" }));
      await screen.findByDisplayValue("Original resume");

      await user.click(screen.getByRole("button", { name: "Preview" }));
      expect(screen.queryByDisplayValue("Original resume")).not.toBeInTheDocument();
      expect(screen.getByText("Original resume")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Edit" }));
      expect(screen.getByDisplayValue("Original resume")).toBeInTheDocument();
    });

    test("Preview mode renders a URL in the content as a real, clickable link", async () => {
      const user = userEvent.setup();
      mockedFetchApplications.mockResolvedValue([
        makeApplication({
          tailoredResume: { content: "Aarav Sharma\n\nPROJECTS\nCampus Marketplace\n- Built a marketplace app.\n  Link: https://github.com/aarav/campus", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" },
          coverLetter: { content: "Original letter", generatedAt: "2026-01-02T00:00:00.000Z", source: "groq" }
        })
      ]);
      renderTracker();

      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "View Materials" }));
      await user.click(screen.getByRole("button", { name: "Preview" }));

      const link = screen.getByRole("link", { name: "github.com/aarav/campus" });
      expect(link).toHaveAttribute("href", "https://github.com/aarav/campus");
      expect(link).toHaveAttribute("target", "_blank");
    });

    test("saved edits persist after a simulated refresh (re-fetching the application shows the saved content, not the pre-edit draft)", async () => {
      const user = userEvent.setup();
      const application = applicationWithMaterials();
      mockedFetchApplications.mockResolvedValueOnce([application]);
      const firstRender = renderTracker();

      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "View Materials" }));
      const resumeBox = await screen.findByDisplayValue("Original resume");
      await user.clear(resumeBox);
      await user.type(resumeBox, "Edited and saved resume");

      const savedApplication = { ...application, tailoredResume: { ...application.tailoredResume, content: "Edited and saved resume", source: "user-edited" } };
      mockedUpdateMaterials.mockResolvedValue(savedApplication);
      await user.click(screen.getByRole("button", { name: "Save My Edits" }));
      await waitFor(() => expect(mockedUpdateMaterials).toHaveBeenCalled());

      // Simulate a page refresh: the component unmounts and a fresh fetch
      // returns the now-persisted (saved) application.
      firstRender.unmount();
      mockedFetchApplications.mockResolvedValueOnce([savedApplication]);
      renderTracker();
      await screen.findByText("Frontend Engineer Intern");
      await user.click(screen.getByRole("button", { name: "View Materials" }));
      expect(await screen.findByDisplayValue("Edited and saved resume")).toBeInTheDocument();
    });
  });
});
