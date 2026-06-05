import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <label className="block w-full">
      {label && <span className="ds-input-label">{label}</span>}
      <textarea className={cn("ds-textarea", error && "border-[rgba(248,113,113,0.45)]", className)} {...props} />
      {error && <span className="ds-input-error">{error}</span>}
    </label>
  );
}
