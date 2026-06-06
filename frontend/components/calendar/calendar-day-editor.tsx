"use client";

import { useCallback, useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { CalendarDayEntry } from "@/lib/calendar-stickers";
import { CALENDAR_NOTE_MAX_LENGTH, CALENDAR_STICKER_EMOJIS } from "@/lib/calendar-stickers";
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

type CalendarDayEditorProps = {
  dateKey: string;
  entries: CalendarDayEntry[];
  onEntriesChange: (entries: CalendarDayEntry[]) => void;
  variant?: "compact" | "full";
  className?: string;
};

export function CalendarDayEditor({
  dateKey,
  entries,
  onEntriesChange,
  variant = "full",
  className
}: CalendarDayEditorProps) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteDraft, setEditingNoteDraft] = useState("");
  const [editingStickerId, setEditingStickerId] = useState<string | null>(null);
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);

  const stickers = useMemo(() => entries.filter((entry) => entry.entryType === "sticker"), [entries]);
  const notes = useMemo(() => entries.filter((entry) => entry.entryType === "note"), [entries]);

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

  const stopBubble = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
  };

  const noteLength = noteDraft.trim().length;
  const noteValid = noteLength > 0 && noteLength <= CALENDAR_NOTE_MAX_LENGTH;
  const compact = variant === "compact";
  const quickEmojis = CALENDAR_STICKER_EMOJIS.slice(0, compact ? 10 : CALENDAR_STICKER_EMOJIS.length);

  const addSticker = (emoji: string) =>
    runAction("add-sticker", async () => {
      const created = await createCalendarSticker(dateKey, emoji);
      onEntriesChange([...entries, created]);
      setShowFullEmojiPicker(false);
      pushToast({ title: "Sticker added", variant: "success" });
    });

  const addNote = () =>
    runAction("add-note", async () => {
      const created = await createCalendarNote(dateKey, noteDraft.trim());
      onEntriesChange([...entries, created]);
      setNoteDraft("");
      pushToast({ title: "Note added", variant: "success" });
    });

  return (
    <div
      className={cn("space-y-2", className)}
      onClick={stopBubble}
      onKeyDown={stopBubble}
      role="group"
      aria-label="Edit stickers and notes"
    >
      <div>
        <div className="mb-1 flex items-center justify-between gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Stickers</p>
          {stickers.length > 0 ? (
            <span className="text-[10px] text-slate-400">{stickers.length}</span>
          ) : null}
        </div>

        {stickers.length > 0 ? (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {stickers.map((sticker) => (
              <div key={sticker._id} className="group relative">
                <Sticker3D emoji={sticker.emoji || "😶‍🌫️"} size={compact ? "xs" : "sm"} interactive={false} />
                <div className="absolute -right-0.5 -top-0.5 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      setEditingStickerId(sticker._id);
                      setEditingNoteId(null);
                      setShowFullEmojiPicker(true);
                    }}
                    className="rounded-full bg-white p-0.5 shadow ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600"
                    aria-label="Change sticker"
                  >
                    <Pencil className="h-2.5 w-2.5 text-slate-600 dark:text-slate-300" />
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
                    className="rounded-full bg-white p-0.5 shadow ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600"
                    aria-label="Remove sticker"
                  >
                    {busy === `delete-sticker-${sticker._id}` ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-600" />
                    ) : (
                      <Trash2 className="h-2.5 w-2.5 text-rose-600" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {editingStickerId && showFullEmojiPicker ? (
          <div className="mb-1.5 rounded-lg border border-primary-200 bg-primary-50/50 p-2 dark:border-primary-900/40 dark:bg-primary-950/20">
            <CalendarEmojiPicker
              selected={stickers.find((s) => s._id === editingStickerId)?.emoji}
              className="border-0 bg-transparent p-0"
              onSelect={(emoji) =>
                runAction(`edit-sticker-${editingStickerId}`, async () => {
                  const updated = await updateCalendarSticker(editingStickerId, emoji);
                  onEntriesChange(entries.map((entry) => (entry._id === updated._id ? updated : entry)));
                  setEditingStickerId(null);
                  setShowFullEmojiPicker(false);
                  pushToast({ title: "Sticker updated", variant: "success" });
                })
              }
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-1 h-7 px-2 text-xs"
              onClick={() => {
                setEditingStickerId(null);
                setShowFullEmojiPicker(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : null}

        {!editingStickerId || !showFullEmojiPicker ? (
          compact ? (
            <div className="space-y-1">
              <div className="flex gap-0.5 overflow-x-auto pb-0.5">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => addSticker(emoji)}
                    className="shrink-0 rounded-md p-0.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label={`Add ${emoji}`}
                    title={`Add ${emoji}`}
                  >
                    <Sticker3D emoji={emoji} size="xs" interactive={false} />
                  </button>
                ))}
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => setShowFullEmojiPicker((open) => !open)}
                  className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <Plus className="h-2.5 w-2.5" />
                  More
                </button>
              </div>
              {showFullEmojiPicker ? (
                <CalendarEmojiPicker
                  className="p-2"
                  onSelect={(emoji) => {
                    setEditingStickerId(null);
                    addSticker(emoji);
                  }}
                />
              ) : null}
            </div>
          ) : (
            <CalendarEmojiPicker
              className="p-2"
              onSelect={(emoji) => {
                setEditingStickerId(null);
                addSticker(emoji);
              }}
            />
          )
        ) : null}
      </div>

      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Notes</p>

        {notes.length > 0 ? (
          <div className="mb-1.5 space-y-1">
            {notes.map((note) => (
              <div
                key={note._id}
                className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-1.5 dark:border-amber-900/40 dark:bg-amber-950/30"
              >
                {editingNoteId === note._id ? (
                  <>
                    <textarea
                      value={editingNoteDraft}
                      onChange={(event) => setEditingNoteDraft(event.target.value.slice(0, CALENDAR_NOTE_MAX_LENGTH))}
                      rows={compact ? 2 : 3}
                      className="w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none ring-primary-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <div className="mt-1 flex justify-end gap-1">
                      <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingNoteId(null)}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
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
                  </>
                ) : (
                  <div className="group flex items-start gap-1">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left text-[11px] leading-snug text-amber-900 dark:text-amber-100"
                      onClick={() => {
                        setEditingNoteId(note._id);
                        setEditingNoteDraft(note.content || "");
                        setEditingStickerId(null);
                      }}
                    >
                      {note.content}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        runAction(`delete-note-${note._id}`, async () => {
                          await deleteCalendarEntry(note._id);
                          onEntriesChange(entries.filter((entry) => entry._id !== note._id));
                          pushToast({ title: "Note deleted", variant: "success" });
                        })
                      }
                      className="shrink-0 rounded p-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3 text-rose-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-950/40">
          <textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value.slice(0, CALENDAR_NOTE_MAX_LENGTH))}
            rows={compact ? 2 : 3}
            placeholder="Add a note…"
            className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-900 outline-none ring-primary-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-500">
              {noteLength}/{CALENDAR_NOTE_MAX_LENGTH}
            </span>
            <Button type="button" size="sm" className="h-7 px-2 text-xs" disabled={Boolean(busy) || !noteValid} onClick={addNote}>
              {busy === "add-note" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Add note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
