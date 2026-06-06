"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, StickyNote, Trash2, X } from "lucide-react";
import type { CalendarDayEntry } from "@/lib/calendar-stickers";
import { CALENDAR_NOTE_MAX_LENGTH } from "@/lib/calendar-stickers";
import {
  createCalendarNote,
  createCalendarSticker,
  deleteCalendarEntry,
  updateCalendarNote,
  updateCalendarSticker
} from "@/lib/calendar-personalization";
import { CalendarEmojiPicker } from "@/components/calendar/emoji-picker";
import { Sticker3D } from "@/components/calendar/sticker-3d";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type CalendarDayDetailModalProps = {
  open: boolean;
  dateKey: string | null;
  dateLabel: string;
  entries: CalendarDayEntry[];
  onClose: () => void;
  onEntriesChange: (entries: CalendarDayEntry[]) => void;
};

export function CalendarDayDetailModal({
  open,
  dateKey,
  dateLabel,
  entries,
  onClose,
  onEntriesChange
}: CalendarDayDetailModalProps) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteDraft, setEditingNoteDraft] = useState("");
  const [editingStickerId, setEditingStickerId] = useState<string | null>(null);

  const stickers = useMemo(() => entries.filter((entry) => entry.entryType === "sticker"), [entries]);
  const notes = useMemo(() => entries.filter((entry) => entry.entryType === "note"), [entries]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setNoteDraft("");
      setEditingNoteId(null);
      setEditingNoteDraft("");
      setEditingStickerId(null);
    }
  }, [open, dateKey]);

  const runAction = useCallback(
    async (key: string, action: () => Promise<void>) => {
      setBusy(key);
      try {
        await action();
      } catch (error) {
        pushToast({
          title: "Calendar update failed",
          message: error instanceof Error ? error.message : "Something went wrong.",
          variant: "error"
        });
      } finally {
        setBusy(null);
      }
    },
    [pushToast]
  );

  if (!open || !dateKey) return null;

  const noteLength = noteDraft.trim().length;
  const noteValid = noteLength > 0 && noteLength <= CALENDAR_NOTE_MAX_LENGTH;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} aria-label="Close day details" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-day-detail-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
              Your calendar
            </p>
            <h2 id="calendar-day-detail-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {dateLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Stickers</h3>
              <span className="text-xs text-slate-500">{stickers.length} added</span>
            </div>
            {stickers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-700">
                No stickers yet — pick one below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stickers.map((sticker) => (
                  <div key={sticker._id} className="group relative">
                    <Sticker3D emoji={sticker.emoji || "😶‍🌫️"} size="md" />
                    <div className="absolute -right-1 -top-1 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => {
                          setEditingStickerId(sticker._id);
                          setEditingNoteId(null);
                        }}
                        className="rounded-full bg-white p-1 shadow ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600"
                        aria-label="Edit sticker"
                      >
                        <Pencil className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() =>
                          runAction(`delete-sticker-${sticker._id}`, async () => {
                            await deleteCalendarEntry(sticker._id);
                            onEntriesChange(entries.filter((entry) => entry._id !== sticker._id));
                            pushToast({ title: "Sticker removed", variant: "success" });
                          })
                        }
                        className="rounded-full bg-white p-1 shadow ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600"
                        aria-label="Remove sticker"
                      >
                        {busy === `delete-sticker-${sticker._id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-rose-600" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingStickerId ? (
              <div className="mt-3 rounded-xl border border-primary-200 bg-primary-50/50 p-3 dark:border-primary-900/40 dark:bg-primary-950/20">
                <p className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-200">Choose a new emoji</p>
                <CalendarEmojiPicker
                  selected={stickers.find((s) => s._id === editingStickerId)?.emoji}
                  onSelect={(emoji) =>
                    runAction(`edit-sticker-${editingStickerId}`, async () => {
                      const updated = await updateCalendarSticker(editingStickerId, emoji);
                      onEntriesChange(entries.map((entry) => (entry._id === updated._id ? updated : entry)));
                      setEditingStickerId(null);
                      pushToast({ title: "Sticker updated", variant: "success" });
                    })
                  }
                />
                <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => setEditingStickerId(null)}>
                  Cancel edit
                </Button>
              </div>
            ) : (
              <div className="mt-3">
                <CalendarEmojiPicker
                  onSelect={(emoji) =>
                    runAction("add-sticker", async () => {
                      const created = await createCalendarSticker(dateKey, emoji);
                      onEntriesChange([...entries, created]);
                      pushToast({ title: "Sticker added", variant: "success" });
                    })
                  }
                />
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <StickyNote className="h-4 w-4 text-amber-500" />
                Notes
              </h3>
              <span className="text-xs text-slate-500">{notes.length} saved</span>
            </div>

            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  {editingNoteId === note._id ? (
                    <>
                      <textarea
                        value={editingNoteDraft}
                        onChange={(event) => setEditingNoteDraft(event.target.value.slice(0, CALENDAR_NOTE_MAX_LENGTH))}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-primary-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          {editingNoteDraft.trim().length}/{CALENDAR_NOTE_MAX_LENGTH}
                        </span>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              Boolean(busy) ||
                              !editingNoteDraft.trim() ||
                              editingNoteDraft.trim().length > CALENDAR_NOTE_MAX_LENGTH
                            }
                            onClick={() =>
                              runAction(`edit-note-${note._id}`, async () => {
                                const updated = await updateCalendarNote(note._id, editingNoteDraft.trim());
                                onEntriesChange(entries.map((entry) => (entry._id === updated._id ? updated : entry)));
                                setEditingNoteId(null);
                                pushToast({ title: "Note updated", variant: "success" });
                              })
                            }
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{note.content}</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={Boolean(busy)}
                          onClick={() => {
                            setEditingNoteId(note._id);
                            setEditingNoteDraft(note.content || "");
                            setEditingStickerId(null);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={Boolean(busy)}
                          onClick={() =>
                            runAction(`delete-note-${note._id}`, async () => {
                              await deleteCalendarEntry(note._id);
                              onEntriesChange(entries.filter((entry) => entry._id !== note._id));
                              pushToast({ title: "Note deleted", variant: "success" });
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/40">
              <label htmlFor="calendar-note-draft" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Add a note
              </label>
              <textarea
                id="calendar-note-draft"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value.slice(0, CALENDAR_NOTE_MAX_LENGTH))}
                rows={3}
                placeholder="Write a reminder or personal note for this date…"
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-primary-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-[11px]",
                    noteLength > CALENDAR_NOTE_MAX_LENGTH ? "text-rose-600" : "text-slate-500"
                  )}
                >
                  {noteLength}/{CALENDAR_NOTE_MAX_LENGTH}
                </span>
                <Button
                  type="button"
                  size="sm"
                  disabled={Boolean(busy) || !noteValid}
                  onClick={() =>
                    runAction("add-note", async () => {
                      const created = await createCalendarNote(dateKey, noteDraft.trim());
                      onEntriesChange([...entries, created]);
                      setNoteDraft("");
                      pushToast({ title: "Note added", variant: "success" });
                    })
                  }
                >
                  {busy === "add-note" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Add note
                </Button>
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-700">
          <Button type="button" size="sm" variant="ghost" className="w-full sm:w-auto" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
