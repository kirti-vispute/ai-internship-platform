"use client";

import { Suspense } from "react";
import { ChatWorkspace } from "@/components/dashboard/chat-workspace";

export default function InternChatPage() {
  return (
    <Suspense fallback={<div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading chat...</div>}>
      <ChatWorkspace role="intern" />
    </Suspense>
  );
}
