import { cn } from "@/lib/utils";

export type UserRole = "intern" | "company";

type RoleSelectorProps = {
  role: UserRole;
  onChange: (role: UserRole) => void;
};

export function RoleSelector({ role, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onChange("intern")}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-semibold transition duration-200",
          role === "intern"
            ? "bg-white text-slate-900 shadow-soft dark:bg-slate-900 dark:text-slate-100"
            : "text-slate-500 dark:text-slate-400"
        )}
      >
        Intern
      </button>
      <button
        type="button"
        onClick={() => onChange("company")}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-semibold transition duration-200",
          role === "company"
            ? "bg-white text-slate-900 shadow-soft dark:bg-slate-900 dark:text-slate-100"
            : "text-slate-500 dark:text-slate-400"
        )}
      >
        Company
      </button>
    </div>
  );
}
