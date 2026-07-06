"use client";

import { Suspense } from "react";
import { MessagePage } from "@/components/dashboard/message-page";

export default function InternChatPage() {
  return (
    <Suspense fallback={<div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading chat...</div>}>
      <MessagePage role="intern" />
    </Suspense>
  );
}
