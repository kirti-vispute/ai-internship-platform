type SkillChipsProps = {
  skills: string[];
};

export function SkillChips({ skills }: SkillChipsProps) {
  if (!skills || skills.length === 0) {
    return <p className="text-sm text-slate-500">No skills extracted yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-soft transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}
