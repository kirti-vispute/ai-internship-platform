import { cn } from "@/lib/utils";

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">Enter OTP</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        className={cn(
          "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm tracking-[0.4em] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
          disabled && "cursor-not-allowed bg-slate-50"
        )}
        placeholder="_ _ _ _ _ _"
      />
    </div>
  );
}
