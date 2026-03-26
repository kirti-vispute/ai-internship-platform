import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="block w-full">
      {label && <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>}
      <input
        className={cn(
          "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-100",
          className
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
