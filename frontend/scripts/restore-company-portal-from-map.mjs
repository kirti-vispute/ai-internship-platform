import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const recoveredPath = path.join(__dirname, "../lib/company-portal.recovered.ts");
const outPath = path.join(__dirname, "../lib/company-portal.ts");
const recovered = fs.readFileSync(recoveredPath, "utf8");
const match = recovered.match(/sourceMappingURL=data:application\/json;charset=utf-8;base64,([A-Za-z0-9+/=]+)/);
if (!match) {
  console.error("source map not found");
  process.exit(1);
}
const map = JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
const source = map.sourcesContent?.[0];
if (!source) {
  console.error("sourcesContent missing");
  process.exit(1);
}
const notificationBlock = `
export type CompanyNotification = {
  _id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  metadata?: { conversationId?: string; alertType?: string };
  isRead?: boolean;
  createdAt?: string;
};

export async function fetchCompanyNotifications(force = false) {
  const response = await apiRequest<{ notifications: CompanyNotification[]; unreadCount: number }>(
    "/api/company/notifications?limit=30"
  );
  return {
    notifications: response.notifications || [],
    unreadCount: response.unreadCount || 0
  };
}

export async function markCompanyNotificationRead(notificationId: string) {
  await apiRequest(\`/api/company/notifications/\${notificationId}/read\`, { method: "PATCH" });
}

export async function markAllCompanyNotificationsRead() {
  await apiRequest("/api/company/notifications/read-all", { method: "PATCH" });
}
`;

fs.writeFileSync(outPath, `${source.trim()}\n${notificationBlock}`);
console.log("restored", outPath);
