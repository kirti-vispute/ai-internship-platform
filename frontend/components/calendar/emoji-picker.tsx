"use client";

import { CALENDAR_STICKER_EMOJIS } from "@/lib/calendar-stickers";
import { Sticker3D } from "@/components/calendar/sticker-3d";
import { cn } from "@/lib/utils";

type CalendarEmojiPickerProps = {
  selected?: string | null;
  onSelect: (emoji: string) => void;
  className?: string;
};

export function CalendarEmojiPicker({ selected, onSelect, className }: CalendarEmojiPickerProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/60", className)}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        Sticker picker
      </p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
        {CALENDAR_STICKER_EMOJIS.map((emoji) => {
          const isSelected = selected === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className={cn(
                "flex items-center justify-center rounded-xl p-0.5 transition",
                isSelected && "ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900"
              )}
              aria-label={`Add ${emoji} sticker`}
              title={`Add ${emoji}`}
            >
              <Sticker3D emoji={emoji} size="sm" interactive={false} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
