import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  Flag,
  MessageSquare,
  ScrollText,
  Users
} from "lucide-react";

export const EMPTY_STATE_ICONS: Record<string, LucideIcon> = {
  applications: ClipboardList,
  interviews: Calendar,
  savedInternships: Briefcase,
  notifications: Bell,
  companyNotifications: Bell,
  applicants: Building2,
  reports: Flag,
  users: Users,
  internships: Briefcase,
  companies: Building2,
  activity: Activity,
  chat: MessageSquare,
  feedback: ScrollText
};
