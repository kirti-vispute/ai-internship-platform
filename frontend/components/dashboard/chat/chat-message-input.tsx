"use client";

import { useCallback, useEffect, useRef } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatMessageInput({
  value,
  onChange,
  onSend,
  sending = false,
  disabled = false,
  placeholder = "Write a message…"
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <div className="border-t border-slate-200/80 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-950/40">
      <div className="flex items-end gap-2">
        <button
          type="button"
          disabled
          title="Attachments coming soon"
          className="mb-1 hidden shrink-0 rounded-lg p-2 text-slate-400 sm:inline-flex"
          aria-label="Attach file"
        >
          <AppIcon icon={Paperclip} size="sm" />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={1}
          disabled={disabled || sending}
          className={cn(
            "max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2.5 text-sm",
            "text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
            "dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
          )}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (value.trim() && !sending) onSend();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={onSend}
          disabled={disabled || sending || !value.trim()}
          className="mb-0.5 shrink-0 rounded-xl px-3"
        >
          <AppIcon icon={SendHorizontal} size="sm" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
      <p className="mt-1.5 hidden text-[11px] text-slate-400 sm:block">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
