import { cn } from "@/lib/utils";

type AlertProps = {
  type: "success" | "error";
  message: string;
};

export function Alert({ type, message }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      )}
    >
      {message}
    </div>
  );
}
