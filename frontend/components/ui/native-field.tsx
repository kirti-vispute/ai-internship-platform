import { cn } from "@/lib/utils";

type NativeFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  as?: "input";
};

type NativeTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  as: "textarea";
};

export function NativeField(props: NativeFieldProps | NativeTextareaProps) {
  const { label, error, className } = props;

  const fieldClass = cn(
    "ds-input",
    error && "border-[rgba(248,113,113,0.45)]",
    className
  );

  if ("as" in props && props.as === "textarea") {
    const { as: _as, label: _label, error: _error, className: _className, ...textareaProps } = props;
    return (
      <label className="block w-full">
        {label && <span className="ds-input-label">{label}</span>}
        <textarea className={cn(fieldClass, "ds-textarea min-h-[108px]")} {...textareaProps} />
        {error && <span className="ds-input-error">{error}</span>}
      </label>
    );
  }

  const { as: _as, label: _label, error: _error, className: _className, ...inputProps } = props as NativeFieldProps;
  return (
    <label className="block w-full">
      {label && <span className="ds-input-label">{label}</span>}
      <input className={fieldClass} {...inputProps} />
      {error && <span className="ds-input-error">{error}</span>}
    </label>
  );
}
