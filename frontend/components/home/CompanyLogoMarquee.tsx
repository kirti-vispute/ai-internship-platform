import { cn } from "@/lib/utils";

type CompanyLogo = {
  name: string;
  file: string;
};

const COMPANIES: CompanyLogo[] = [
  { name: "Google", file: "google" },
  { name: "Microsoft", file: "microsoft" },
  { name: "Apple", file: "apple" },
  { name: "Amazon", file: "amazon" },
  { name: "Meta", file: "meta" },
  { name: "NVIDIA", file: "nvidia" },
  { name: "IBM", file: "ibm" },
  { name: "Adobe", file: "adobe" },
  { name: "Salesforce", file: "salesforce" },
  { name: "Oracle", file: "oracle" },
  { name: "Intel", file: "intel" },
  { name: "SAP", file: "sap" },
  { name: "Accenture", file: "accenture" },
  { name: "Deloitte", file: "deloitte" },
  { name: "Tata Consultancy Services", file: "tcs" },
  { name: "Infosys", file: "infosys" },
  { name: "Wipro", file: "wipro" },
  { name: "Capgemini", file: "capgemini" },
  { name: "JPMorgan Chase", file: "jpmorgan-chase" },
  { name: "Goldman Sachs", file: "goldman-sachs" }
];

type Row = {
  companies: CompanyLogo[];
  direction: "normal" | "reverse";
  durationSeconds: number;
};

const ROWS: Row[] = [
  { companies: COMPANIES.slice(0, 7), direction: "normal", durationSeconds: 42 },
  { companies: COMPANIES.slice(7, 14), direction: "reverse", durationSeconds: 34 },
  { companies: COMPANIES.slice(14, 20), direction: "normal", durationSeconds: 50 }
];

function LogoItem({ company, decorative }: { company: CompanyLogo; decorative: boolean }) {
  return (
    <div className="flex shrink-0 items-center justify-center px-6 sm:px-8" aria-hidden={decorative || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/logos/${company.file}.svg`}
        alt={decorative ? "" : `${company.name} logo`}
        loading="lazy"
        draggable={false}
        className="company-marquee-logo h-6 w-auto max-w-[110px] object-contain sm:h-8 sm:max-w-[130px]"
      />
    </div>
  );
}

function MarqueeRow({ row, className }: { row: Row; className?: string }) {
  const track = [...row.companies, ...row.companies];

  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <div
        className="company-marquee-track flex w-max items-center"
        style={{
          animationDuration: `${row.durationSeconds}s`,
          animationDirection: row.direction
        }}
      >
        {track.map((company, index) => (
          <LogoItem key={`${company.file}-${index}`} company={company} decorative={index >= row.companies.length} />
        ))}
      </div>
    </div>
  );
}

export function CompanyLogoMarquee() {
  return (
    <div
      className="company-marquee-mask relative flex w-full flex-col gap-5 py-2 sm:gap-6"
      role="list"
      aria-label="Companies InternAI candidates have joined"
    >
      <MarqueeRow row={ROWS[0]} />
      <MarqueeRow row={ROWS[1]} />
      <MarqueeRow row={ROWS[2]} className="hidden sm:block" />
    </div>
  );
}
