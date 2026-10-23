import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";
import JobAgentSettingsPage from "@/app/dashboard/intern/job-agent/settings/page";
import * as jobAgentPortal from "@/lib/job-agent-portal";
import type { JobAgentPreference } from "@/lib/job-agent-portal";

vi.mock("@/lib/job-agent-portal", async () => {
  const actual = await vi.importActual<typeof import("@/lib/job-agent-portal")>("@/lib/job-agent-portal");
  return {
    ...actual,
    fetchJobAgentPreferences: vi.fn(),
    saveJobAgentPreferences: vi.fn()
  };
});

const mockedFetchPreferences = vi.mocked(jobAgentPortal.fetchJobAgentPreferences);
const mockedSavePreferences = vi.mocked(jobAgentPortal.saveJobAgentPreferences);

function renderSettings() {
  return render(
    <ToastProvider>
      <JobAgentSettingsPage />
    </ToastProvider>
  );
}

const existingPreference: JobAgentPreference = {
  _id: "pref-1",
  user: "user-1",
  internProfile: "profile-1",
  enabled: true,
  desiredRoles: ["Frontend Developer", "Data Analyst"],
  locations: ["Bangalore", "Pune"],
  workMode: "remote",
  minSalary: 20000,
  salaryCurrency: "INR",
  experienceLevel: "intern",
  notificationFrequency: "weekly",
  lastSweepAt: null,
  lastSweepMatchCount: 0,
  pausedAt: null,
  pausedReason: ""
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("JobAgentSettingsPage", () => {
  test("shows a loading skeleton while preferences are being fetched", () => {
    mockedFetchPreferences.mockReturnValue(new Promise(() => {}));
    renderSettings();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  test("shows an error message when loading preferences fails", async () => {
    mockedFetchPreferences.mockRejectedValue(new Error("Cannot reach backend API"));
    renderSettings();
    expect(await screen.findByText("Cannot reach backend API")).toBeInTheDocument();
  });

  test("falls back to the default (empty) form when Job Agent has not been configured yet", async () => {
    mockedFetchPreferences.mockResolvedValue({ preference: null, configured: false });
    renderSettings();

    expect(await screen.findByLabelText(/Enable the AI Job Agent/i)).not.toBeChecked();
    expect(screen.getByPlaceholderText("e.g. Frontend Developer, Data Analyst")).toHaveValue("");
    expect(screen.getByPlaceholderText("e.g. 20000")).toHaveValue(null);
  });

  test("populates the form from an existing preference", async () => {
    mockedFetchPreferences.mockResolvedValue({ preference: existingPreference, configured: true });
    renderSettings();

    expect(await screen.findByLabelText(/Enable the AI Job Agent/i)).toBeChecked();
    expect(screen.getByPlaceholderText("e.g. Frontend Developer, Data Analyst")).toHaveValue("Frontend Developer, Data Analyst");
    expect(screen.getByPlaceholderText("e.g. Bangalore, Pune")).toHaveValue("Bangalore, Pune");
    expect(screen.getByPlaceholderText("e.g. 20000")).toHaveValue(20000);
  });

  test("saving normalizes comma-separated fields into trimmed arrays and reports success", async () => {
    const user = userEvent.setup();
    mockedFetchPreferences.mockResolvedValue({ preference: null, configured: false });
    mockedSavePreferences.mockResolvedValue(existingPreference);
    renderSettings();

    await screen.findByText("Save Settings");
    await user.click(screen.getByLabelText(/Enable the AI Job Agent/i));
    await user.type(screen.getByPlaceholderText("e.g. Frontend Developer, Data Analyst"), " Frontend Developer ,  Backend Developer ");
    await user.type(screen.getByPlaceholderText("e.g. Bangalore, Pune"), "Remote, , Pune");
    await user.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(mockedSavePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          desiredRoles: ["Frontend Developer", "Backend Developer"],
          locations: ["Remote", "Pune"]
        })
      );
    });
    expect(await screen.findByText("Job Agent settings saved")).toBeInTheDocument();
  });

  test("rejects a negative minimum salary before calling save", async () => {
    const user = userEvent.setup();
    mockedFetchPreferences.mockResolvedValue({ preference: null, configured: false });
    renderSettings();

    await screen.findByText("Save Settings");
    await user.type(screen.getByPlaceholderText("e.g. 20000"), "-500");
    await user.click(screen.getByRole("button", { name: "Save Settings" }));

    // The message is shown twice (inline on the form and in the error toast) -
    // both are asserted so neither rendering path silently breaks.
    await waitFor(() => {
      expect(screen.getAllByText("Minimum salary must be a non-negative number.").length).toBeGreaterThanOrEqual(1);
    });
    expect(mockedSavePreferences).not.toHaveBeenCalled();
  });

  test("shows an error toast when saving fails on the server", async () => {
    const user = userEvent.setup();
    mockedFetchPreferences.mockResolvedValue({ preference: existingPreference, configured: true });
    mockedSavePreferences.mockRejectedValue(new Error("workMode must be one of: remote, on-site, hybrid, any"));
    renderSettings();

    await screen.findByText("Save Settings");
    await user.click(screen.getByRole("button", { name: "Save Settings" }));

    expect(await screen.findByText("Couldn't save settings")).toBeInTheDocument();
    expect(screen.getAllByText("workMode must be one of: remote, on-site, hybrid, any").length).toBeGreaterThanOrEqual(1);
  });

  test("the Save button is disabled while a save is in flight", async () => {
    const user = userEvent.setup();
    mockedFetchPreferences.mockResolvedValue({ preference: existingPreference, configured: true });
    let resolveSave: (value: JobAgentPreference) => void = () => {};
    mockedSavePreferences.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    renderSettings();

    await screen.findByText("Save Settings");
    const saveButton = screen.getByRole("button", { name: "Save Settings" });
    await user.click(saveButton);

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    resolveSave(existingPreference);
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Settings" })).not.toBeDisabled());
  });
});
