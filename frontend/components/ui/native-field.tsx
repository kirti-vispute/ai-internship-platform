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
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-400 dark:focus:ring-primary-500/20",
    error && "border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:border-rose-500 dark:focus:ring-rose-500/20",
    className
  );

  if ("as" in props && props.as === "textarea") {
    const { as: _as, label: _label, error: _error, className: _className, ...textareaProps } = props;
    return (
      <label className="block w-full">
        {label && <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
        <textarea className={cn(fieldClass, "min-h-[108px] py-2.5")} {...textareaProps} />
        {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
      </label>
    );
  }

  const { as: _as, label: _label, error: _error, className: _className, ...inputProps } = props as NativeFieldProps;
  return (
    <label className="block w-full">
      {label && <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input className={cn(fieldClass, "h-11")} {...inputProps} />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
