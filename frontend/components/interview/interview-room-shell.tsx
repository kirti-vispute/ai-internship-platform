"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  StickyNote,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getAuthSession } from "@/lib/session";
import { getDashboardPathForRole } from "@/lib/auth-routes";
import {
  endInterviewSession,
  fetchInterviewRoom,
  joinInterviewRoom,
  saveInterviewNotes,
  setInterviewOutcome,
  type InterviewChatMessage,
  type InterviewOutcome,
  type InterviewRoomPayload
} from "@/lib/interview-portal";
import { useInterviewSocket, type WebRtcSignal } from "@/lib/use-interview-socket";
import { useWebRtc } from "@/lib/use-webrtc";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

type InterviewRoomShellProps = {
  roomId: string;
};

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function InterviewRoomShell({ roomId }: InterviewRoomShellProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const session = getAuthSession();
  const sendSignalRef = useRef<(signal: WebRtcSignal) => void>(() => {});
  const handleRemoteSignalRef = useRef<(payload: { fromUserId: string; signal: WebRtcSignal }) => void>(() => {});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<InterviewRoomPayload | null>(null);
  const [chatMessages, setChatMessages] = useState<InterviewChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [outcome, setOutcome] = useState<InterviewOutcome>(null);
  const [ending, setEnding] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<"chat" | "profile" | "notes">("chat");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);

  const interviewSocket = useInterviewSocket({
    onSignal: (signalPayload) => handleRemoteSignalRef.current(signalPayload),
    onChat: (message) => {
      setChatMessages((prev) => {
        if (prev.some((item) => item._id === message._id)) return prev;
        return [...prev, message];
      });
    },
    onParticipantUpdate: (update) => {
      if (update.cameraOff !== undefined) setRemoteCameraOff(Boolean(update.cameraOff));
    },
    onEnd: () => {
      setSessionEnded(true);
      pushToast({ title: "Interview ended", message: "The session has been closed.", variant: "success" });
    }
  });

  const webrtc = useWebRtc({
    enabled: socketReady && !sessionEnded && Boolean(payload),
    isInitiator,
    onSignal: (signal) => sendSignalRef.current(signal)
  });

  useEffect(() => {
    sendSignalRef.current = (signal) => interviewSocket.sendSignal(roomId, signal);
    handleRemoteSignalRef.current = webrtc.handleRemoteSignal;
  });

  const isHr = payload?.participantRole === "company";
  const candidate = payload?.application?.intern;
  const jobTitle = payload?.application?.internship?.role || "Interview";
  const companyName = payload?.application?.company?.companyName || "Company";

  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_INTERVIEW_ROOMS) {
      setError("Interview rooms are disabled.");
      setLoading(false);
      return;
    }

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        await joinInterviewRoom(roomId);
        const details = await fetchInterviewRoom(roomId);
        setPayload(details);
        setChatMessages(details.room.chatMessages || []);
        setNotes(details.room.hrNotes || "");
        setOutcome(details.room.outcome || null);
        setIsInitiator(Boolean(details.isInitiator));
        const joined = await interviewSocket.joinRoom(roomId);
        if (!joined.ok) {
          throw new Error(joined.message || "Unable to connect to interview room");
        }
        setIsInitiator(Boolean(joined.isInitiator ?? details.isInitiator));
        setSocketReady(true);
      } catch (err) {
        setError((err as Error).message || "Unable to load interview room.");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [roomId]);

  useEffect(() => {
    if (!payload?.room.startedAt || sessionEnded) return undefined;
    const startedAt = new Date(payload.room.startedAt).getTime();
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [payload?.room.startedAt, sessionEnded]);

  async function handleSendChat() {
    const body = chatInput.trim();
    if (!body) return;
    const result = await interviewSocket.sendChat(roomId, body);
    if (!result.ok) {
      pushToast({ title: "Message failed", message: result.messageText, variant: "error" });
      return;
    }
    if (result.message) {
      setChatMessages((prev) => {
        if (prev.some((item) => item._id === result.message!._id)) return prev;
        return [...prev, result.message!];
      });
    }
    setChatInput("");
  }

  async function handleSaveNotes() {
    if (!isHr) return;
    try {
      setNotesSaving(true);
      const result = await saveInterviewNotes(roomId, notes);
      setPayload((prev) => (prev ? { ...prev, room: result.room } : prev));
      pushToast({ title: "Notes saved", variant: "success" });
    } catch (err) {
      pushToast({ title: "Save failed", message: (err as Error).message, variant: "error" });
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleOutcome(next: "selected" | "rejected" | "on_hold") {
    if (!isHr) return;
    try {
      const result = await setInterviewOutcome(roomId, next);
      setOutcome(result.room.outcome || next);
      setPayload((prev) => (prev ? { ...prev, room: result.room } : prev));
      pushToast({ title: "Outcome updated", message: `Marked as ${next.replace(/_/g, " ")}`, variant: "success" });
    } catch (err) {
      pushToast({ title: "Update failed", message: (err as Error).message, variant: "error" });
    }
  }

  async function handleEndInterview() {
    if (!isHr || ending) return;
    try {
      setEnding(true);
      await interviewSocket.endRoom(roomId);
      await endInterviewSession(roomId);
      setSessionEnded(true);
      pushToast({ title: "Interview ended", message: "Session saved successfully.", variant: "success" });
    } catch (err) {
      pushToast({ title: "End failed", message: (err as Error).message, variant: "error" });
    } finally {
      setEnding(false);
    }
  }

  function handleToggleMute() {
    const next = webrtc.toggleMute();
    interviewSocket.updateParticipantStatus(roomId, { muted: next });
  }

  function handleToggleCamera() {
    const next = webrtc.toggleCamera();
    interviewSocket.updateParticipantStatus(roomId, { cameraOff: next });
  }

  const headerSubtitle = useMemo(() => {
    if (!payload?.room.scheduledTime) return companyName;
    return `${companyName} · ${new Date(payload.room.scheduledTime).toLocaleString()}`;
  }, [companyName, payload?.room.scheduledTime]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Preparing interview room...
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center">
        <p className="text-sm text-rose-300">{error || "Interview room unavailable."}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(session.role ? getDashboardPathForRole(session.role) : "/")}
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{payload.room.roundType || "Interview"}</p>
          <h1 className="text-lg font-semibold text-white">{jobTitle}</h1>
          <p className="text-xs text-slate-400">{headerSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-700 px-3 py-1 font-mono text-sm text-emerald-300">
            {formatDuration(elapsedSeconds)}
          </div>
          {isHr ? (
            <Button
              type="button"
              size="sm"
              className="bg-rose-600 text-white hover:bg-rose-500"
              disabled={sessionEnded || ending}
              onClick={handleEndInterview}
            >
              <PhoneOff className="mr-1.5 h-4 w-4" />
              End Interview
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1 p-4">
            <div className="grid h-full min-h-[420px] grid-cols-1 gap-3 lg:grid-cols-2">
              <VideoTile
                label={isHr ? candidate?.fullName || "Candidate" : companyName}
                videoRef={webrtc.remoteVideoRef}
                showPlaceholder={!webrtc.connected || remoteCameraOff}
                placeholder={remoteCameraOff ? "Camera off" : "Waiting for participant..."}
                primary
              />
              <VideoTile
                label="You"
                videoRef={webrtc.localVideoRef}
                showPlaceholder={webrtc.cameraOff || Boolean(webrtc.mediaError)}
                placeholder={webrtc.cameraOff ? "Camera off" : "Starting camera..."}
                muted
              />
            </div>
            {webrtc.mediaError ? <p className="mt-3 text-center text-xs text-amber-300">{webrtc.mediaError}</p> : null}
            {sessionEnded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 px-6 py-4 text-center">
                  <p className="text-sm font-medium text-white">Interview completed</p>
                  <p className="mt-1 text-xs text-slate-400">You can return to your dashboard.</p>
                  <Button
                    type="button"
                    className="mt-4"
                    variant="secondary"
                    onClick={() => {
                      const role = session.role;
                      router.push(role ? getDashboardPathForRole(role) : "/");
                    }}
                  >
                    Go to dashboard
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-800 px-4 py-3">
            <div className="mx-auto flex max-w-xl items-center justify-center gap-3">
              <ControlButton
                active={webrtc.muted}
                label={webrtc.muted ? "Unmute" : "Mute"}
                icon={webrtc.muted ? MicOff : Mic}
                onClick={handleToggleMute}
              />
              <ControlButton
                active={webrtc.cameraOff}
                label={webrtc.cameraOff ? "Start video" : "Stop video"}
                icon={webrtc.cameraOff ? CameraOff : Camera}
                onClick={handleToggleCamera}
              />
              <button
                type="button"
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 lg:hidden"
                onClick={() => setSidebarOpen((value) => !value)}
              >
                {sidebarOpen ? "Hide panel" : "Show panel"}
              </button>
            </div>
          </div>

          {isHr ? (
            <div className="border-t border-slate-800 px-4 py-3">
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500">Candidate decision</p>
              <div className="flex flex-wrap gap-2">
                <OutcomeButton active={outcome === "selected"} label="Selected" tone="success" onClick={() => handleOutcome("selected")} />
                <OutcomeButton active={outcome === "on_hold"} label="On Hold" tone="warning" onClick={() => handleOutcome("on_hold")} />
                <OutcomeButton active={outcome === "rejected"} label="Rejected" tone="danger" onClick={() => handleOutcome("rejected")} />
              </div>
            </div>
          ) : null}
        </main>

        <aside className={`border-l border-slate-800 bg-slate-900/60 transition-all duration-200 ${sidebarOpen ? "w-full max-w-sm" : "w-12"}`}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-2 py-2">
              {sidebarOpen ? (
                <div className="flex gap-1">
                  <PanelTab active={activePanel === "chat"} icon={MessageSquare} label="Chat" onClick={() => setActivePanel("chat")} />
                  <PanelTab active={activePanel === "profile"} icon={User} label="Profile" onClick={() => setActivePanel("profile")} />
                  {isHr ? (
                    <PanelTab active={activePanel === "notes"} icon={StickyNote} label="Notes" onClick={() => setActivePanel("notes")} />
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
                onClick={() => setSidebarOpen((value) => !value)}
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>

            {sidebarOpen ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {activePanel === "chat" ? (
                  <>
                    <div className="flex-1 space-y-2 overflow-y-auto p-3">
                      {chatMessages.length === 0 ? (
                        <p className="text-xs text-slate-500">No messages yet. Say hello to start the conversation.</p>
                      ) : (
                        chatMessages.map((message) => (
                          <div
                            key={message._id}
                            className={`rounded-xl px-3 py-2 text-sm ${
                              message.senderRole === payload.participantRole
                                ? "ml-8 bg-indigo-600/20 text-indigo-100"
                                : "mr-8 bg-slate-800 text-slate-200"
                            }`}
                          >
                            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                              {message.senderName || message.senderRole}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-slate-800 p-3">
                      <div className="flex gap-2">
                        <input
                          value={chatInput}
                          onChange={(event) => setChatInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") void handleSendChat();
                          }}
                          placeholder="Type a message"
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                          disabled={sessionEnded}
                        />
                        <Button type="button" size="sm" onClick={() => void handleSendChat()} disabled={sessionEnded}>
                          Send
                        </Button>
                      </div>
                    </div>
                  </>
                ) : null}

                {activePanel === "profile" ? (
                  <div className="space-y-3 overflow-y-auto p-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Candidate</p>
                      <p className="mt-1 text-base font-semibold text-white">{candidate?.fullName || "Candidate"}</p>
                      <p className="text-xs text-slate-400">{candidate?.email}</p>
                    </div>
                    {candidate?.summary ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Summary</p>
                        <p className="mt-1 text-slate-300">{candidate.summary}</p>
                      </div>
                    ) : null}
                    {candidate?.skills?.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Skills</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {candidate.skills.slice(0, 12).map((skill) => (
                            <span key={skill} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {candidate?.education?.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Education</p>
                        <ul className="mt-1 space-y-1 text-slate-300">
                          {candidate.education.slice(0, 4).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {activePanel === "notes" && isHr ? (
                  <div className="flex min-h-0 flex-1 flex-col p-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500">Private HR notes</p>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Capture observations, strengths, and concerns..."
                      className="min-h-[220px] flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      disabled={sessionEnded}
                    />
                    <Button
                      type="button"
                      className="mt-3"
                      variant="secondary"
                      disabled={notesSaving || sessionEnded}
                      onClick={() => void handleSaveNotes()}
                    >
                      {notesSaving ? "Saving..." : "Save notes"}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function VideoTile({
  label,
  videoRef,
  placeholder,
  showPlaceholder,
  muted,
  primary = false
}: {
  label: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  placeholder: string;
  showPlaceholder?: boolean;
  muted?: boolean;
  primary?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${primary ? "border-indigo-500/40" : "border-slate-800"} bg-slate-900`}>
      <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full min-h-[240px] w-full object-cover" />
      {showPlaceholder ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <p className="text-sm text-slate-300">{placeholder}</p>
        </div>
      ) : null}
      <div className="absolute bottom-3 left-3 rounded-lg bg-slate-950/70 px-2 py-1 text-xs text-white">{label}</div>
    </div>
  );
}

function ControlButton({
  label,
  icon: Icon,
  active,
  onClick
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs ${
        active ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function PanelTab({
  label,
  icon: Icon,
  active,
  onClick
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs ${
        active ? "bg-indigo-600/20 text-indigo-200" : "text-slate-400 hover:bg-slate-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function OutcomeButton({
  label,
  tone,
  active,
  onClick
}: {
  label: string;
  tone: "success" | "warning" | "danger";
  active?: boolean;
  onClick: () => void;
}) {
  const tones = {
    success: active ? "bg-emerald-600 text-white" : "border-emerald-700 text-emerald-300",
    warning: active ? "bg-amber-600 text-white" : "border-amber-700 text-amber-300",
    danger: active ? "bg-rose-600 text-white" : "border-rose-700 text-rose-300"
  };

  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-xs ${tones[tone]}`}>
      {label}
    </button>
  );
}
