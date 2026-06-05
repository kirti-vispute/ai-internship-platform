import { cn } from "@/lib/utils";

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  return (
    <div>
      <label className="ds-input-label">Enter OTP</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        className={cn("ds-input tracking-[0.4em]", disabled && "cursor-not-allowed opacity-70")}
        placeholder="_ _ _ _ _ _"
      />
    </div>
  );
}
