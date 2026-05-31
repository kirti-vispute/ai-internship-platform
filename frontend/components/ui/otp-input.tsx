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
          "surface-input h-11 w-full px-3 text-sm tracking-[0.4em]",
          disabled && "cursor-not-allowed bg-slate-800/60"
        )}
        placeholder="_ _ _ _ _ _"
      />
    </div>
  );
}
