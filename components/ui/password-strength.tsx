import { getPasswordStrength } from "@/lib/validation";

type PasswordStrengthProps = {
  password: string;
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label } = getPasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            className={`h-1.5 flex-1 rounded-full ${
              segment <= score
                ? score <= 1
                  ? "bg-rose-500"
                  : score <= 3
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">Password strength: {label}</p>
    </div>
  );
}
