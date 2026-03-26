import { cn } from "@/lib/utils";

export type UserRole = "intern" | "company";

type RoleSelectorProps = {
  role: UserRole;
  onChange: (role: UserRole) => void;
};

export function RoleSelector({ role, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => onChange("intern")}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-semibold transition",
          role === "intern" ? "bg-white text-slate-900 shadow-soft" : "text-slate-500"
        )}
      >
        Intern
      </button>
      <button
        type="button"
        onClick={() => onChange("company")}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-semibold transition",
          role === "company" ? "bg-white text-slate-900 shadow-soft" : "text-slate-500"
        )}
      >
        Company
      </button>
    </div>
  );
}
