import type { ChatConversation, ChatMessage } from "@/lib/chat-portal";

export type ChatRole = "intern" | "company";

export type MessageGroup = {
  id: string;
  senderRole: ChatMessage["senderRole"];
  mine: boolean;
  messages: ChatMessage[];
};

const TIME_GROUP_MS = 5 * 60 * 1000;

export function formatChatTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatListTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000) return "Now";
  if (diff < 86_400_000) return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function conversationTitle(conversation: ChatConversation, role: ChatRole): string {
  if (role === "intern") return conversation.company?.companyName || "Company";
  return conversation.internProfile?.fullName || "Intern";
}

export function isOwnMessage(message: ChatMessage, role: ChatRole): boolean {
  return (role === "intern" && message.senderRole === "intern") || (role === "company" && message.senderRole === "company");
}

export function groupMessages(messages: ChatMessage[], role: ChatRole): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const mine = isOwnMessage(message, role);
    const last = groups[groups.length - 1];
    const lastTime = last ? new Date(last.messages[last.messages.length - 1].createdAt || 0).getTime() : 0;
    const currentTime = new Date(message.createdAt || 0).getTime();
    const sameGroup =
      last &&
      last.senderRole === message.senderRole &&
      Number.isFinite(lastTime) &&
      Number.isFinite(currentTime) &&
      Math.abs(currentTime - lastTime) <= TIME_GROUP_MS;

    if (sameGroup) {
      last.messages.push(message);
    } else {
      groups.push({
        id: `${message._id}-group`,
        senderRole: message.senderRole,
        mine,
        messages: [message]
      });
    }
  }

  return groups;
}

export function createOptimisticMessage(conversationId: string, role: ChatRole, body: string): ChatMessage {
  return {
    _id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversation: conversationId,
    body,
    senderRole: role,
    status: "sent",
    createdAt: new Date().toISOString()
  };
}

export function replaceOptimisticMessage(messages: ChatMessage[], tempId: string, real: ChatMessage): ChatMessage[] {
  const exists = messages.some((m) => m._id === real._id);
  if (exists) return messages.filter((m) => m._id !== tempId);
  return messages.map((m) => (m._id === tempId ? real : m));
}
