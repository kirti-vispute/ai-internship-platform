import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="block w-full">
      {label && <span className="ds-input-label">{label}</span>}
      <input className={cn("ds-input", error && "border-[rgba(248,113,113,0.45)]", className)} {...props} />
      {error && <span className="ds-input-error">{error}</span>}
    </label>
  );
}
