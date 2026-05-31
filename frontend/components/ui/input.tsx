import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="block w-full">
      {label && <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input
        className={cn(
          "surface-input h-11 w-full px-3 text-sm",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:border-rose-500 dark:focus:ring-rose-500/20",
          className
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
