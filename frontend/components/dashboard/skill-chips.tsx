type SkillChipsProps = {
  skills: string[];
};

export function SkillChips({ skills }: SkillChipsProps) {
  if (!skills || skills.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No skills extracted yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 shadow-soft transition-all duration-200 hover:border-primary-500/60 hover:bg-primary-900/30 hover:text-primary-300"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}
