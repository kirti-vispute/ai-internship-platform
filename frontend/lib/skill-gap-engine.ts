import type { InternProfile } from "@/lib/intern-portal";
import {
  TARGET_ROLE_PROFILES,
  TIER_WEIGHT,
  type RoleSkillProfile,
  type SkillTier
} from "@/lib/data/role-skill-profiles";
import {
  GENERIC_BLOCKLIST,
  KNOWN_SKILL_DICTIONARY,
  SEMANTIC_EQUIVALENTS,
  SKILL_CANONICAL_MAP,
  SKILL_CATEGORY_MAP,
  SKILL_EFFORT_HINTS,
  SKILL_QUICK_WIN_ACTIONS,
  SOFT_SKILL_BLOCKLIST,
  SUMMARY_CATEGORY_KEYS,
  SUMMARY_CATEGORY_LABELS,
  type SkillCategoryKey,
  type SummaryCategoryKey
} from "@/lib/skill-gap-dictionary";
import { normalizeSkillList, toDisplaySkill } from "@/lib/skill-normalizer";

export type SkillStatus = "present" | "partial" | "missing";
export type ConfidenceTier = "high" | "medium" | "low";
export type MatchLayer = "exact" | "semantic" | "context" | "none";

export type SkillEvidence = {
  source: "skills" | "project" | "experience" | "certification" | "profile" | "implicit";
  label: string;
  pass: 1 | 2 | 3;
};

export type SkillAssessment = {
  skill: string;
  displayName: string;
  normalized: string;
  status: SkillStatus;
  proficiency: number;
  tier: SkillTier;
  confidence: number;
  confidenceTier: ConfidenceTier;
  matchLayer: MatchLayer;
  verified: boolean;
  explanation: string;
  evidence: SkillEvidence[];
};

export type SkillVisualStatus = "missing" | "partial" | "strong";

export type CategorySummaryBar = {
  key: SummaryCategoryKey;
  category: string;
  userScore: number;
  requiredScore: number;
};

export type ProgressBarItem = {
  skill: string;
  displayName: string;
  userLevel: number;
  requiredLevel: number;
  status: SkillVisualStatus;
  tier: SkillTier;
  confidence: number;
  verified: boolean;
  tooltip: string;
};

/** Unified row produced by STEP 2 before chart aggregation */
export type StructuredSkillRow = {
  skillName: string;
  normalized: string;
  category: SkillTier;
  skillArea: SkillCategoryKey;
  userLevel: number;
  requiredLevel: number;
  status: SkillStatus;
  confidence: number;
  verified: boolean;
  explanation: string;
};

export type ChartValidationResult<T> = {
  valid: boolean;
  data: T[];
};

export type QuickWinEffort = "Low" | "Medium";
export type QuickWinImpact = "High" | "Medium";

export type QuickWinItem = {
  skill: string;
  displayName: string;
  why: string;
  effort: QuickWinEffort;
  impact: QuickWinImpact;
  action: string;
};

export type SkillGapResult = {
  roleKey: string;
  roleLabel: string;
  roleMappingReliable: boolean;
  matchPercent: number;
  matchPercentLow: number;
  matchPercentHigh: number;
  showMatchRange: boolean;
  analysisConfidence: number;
  lowConfidenceAnalysis: boolean;
  present: SkillAssessment[];
  partial: SkillAssessment[];
  missing: SkillAssessment[];
  verifiedPresent: SkillAssessment[];
  criticalMissing: SkillAssessment[];
  optionalMissing: SkillAssessment[];
  strongSkills: SkillAssessment[];
  priorityRoadmap: SkillAssessment[];
  quickWins: QuickWinItem[];
  structuredSkills: StructuredSkillRow[];
  categorySummary: CategorySummaryBar[];
  categorySummaryValid: boolean;
  progressBars: ProgressBarItem[];
  progressBarsChartValid: boolean;
  extractedSkillCount: number;
  verifiedSkillCount: number;
  hasResumeData: boolean;
  insufficientData: boolean;
};

export type ExtractedResumeSkills = {
  pass1: Set<string>;
  pass2: Set<string>;
  pass3: Set<string>;
  verified: Set<string>;
  all: Set<string>;
  evidence: Map<string, SkillEvidence[]>;
  projectCount: number;
  experienceCount: number;
  extractionQuality: number;
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function canonicalForGap(raw: string): string {
  const cleaned = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";

  const fromNormalizer = normalizeSkillList([cleaned])[0] || cleaned;
  return SKILL_CANONICAL_MAP[fromNormalizer] || SKILL_CANONICAL_MAP[cleaned] || fromNormalizer;
}

function isValidTechnicalSkill(canonical: string): boolean {
  if (!canonical || canonical.length < 2) return false;
  if (SOFT_SKILL_BLOCKLIST.has(canonical)) return false;
  if (GENERIC_BLOCKLIST.has(canonical)) return false;
  return KNOWN_SKILL_DICTIONARY.has(canonical);
}

function addEvidence(
  map: Map<string, SkillEvidence[]>,
  skill: string,
  entry: SkillEvidence
) {
  const list = map.get(skill) || [];
  if (!list.some((e) => e.source === entry.source && e.label === entry.label && e.pass === entry.pass)) {
    list.push(entry);
    map.set(skill, list);
  }
}

function registerSkill(
  bucket: Set<string>,
  verified: Set<string>,
  evidence: Map<string, SkillEvidence[]>,
  raw: string,
  entry: SkillEvidence
) {
  const c = canonicalForGap(raw);
  if (!c || SOFT_SKILL_BLOCKLIST.has(c) || GENERIC_BLOCKLIST.has(c)) return;
  if (!isValidTechnicalSkill(c)) return;

  bucket.add(c);
  addEvidence(evidence, c, entry);
  if (entry.pass <= 2 || entry.source === "skills" || entry.source === "profile") {
    verified.add(c);
  }
}

function textContainsSkill(text: string, skill: string): boolean {
  if (!text || !skill) return false;
  const escaped = skill.replace(/[.+#]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text.toLowerCase());
}

function scanTextForKnownSkills(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const skill of KNOWN_SKILL_DICTIONARY) {
    if (textContainsSkill(lower, skill)) found.push(skill);
  }
  for (const [alias, canonical] of Object.entries(SKILL_CANONICAL_MAP)) {
    if (alias.length >= 2 && textContainsSkill(lower, alias) && isValidTechnicalSkill(canonical)) {
      found.push(canonical);
    }
  }
  return [...new Set(found.map(canonicalForGap))];
}

/** PASS 1: direct | PASS 2: context | PASS 3: implicit */
export function extractSkillsFromResume(profile: InternProfile | null): ExtractedResumeSkills {
  const parsed = profile?.resume?.parsed;
  const pass1 = new Set<string>();
  const pass2 = new Set<string>();
  const pass3 = new Set<string>();
  const verified = new Set<string>();
  const evidence = new Map<string, SkillEvidence[]>();

  const addPass1 = (skills: unknown, label = "Resume skills section") => {
    for (const s of normalizeSkillList(skills)) {
      registerSkill(pass1, verified, evidence, s, { source: "skills", label, pass: 1 });
    }
  };

  addPass1(parsed?.skills);
  addPass1(parsed?.technicalSkills);
  addPass1(profile?.skills);
  addPass1((profile?.skillDetails || []).map((d) => d.name).filter(Boolean));

  for (const s of normalizeSkillList(profile?.softSkills)) {
    const c = canonicalForGap(s);
    if (c && isValidTechnicalSkill(c)) {
      registerSkill(pass1, verified, evidence, c, { source: "profile", label: "Profile skills", pass: 1 });
    }
  }

  const projects = parsed?.projects || profile?.profileSections?.projects || [];
  for (const proj of projects) {
    const title = proj.title || "Project";
    for (const s of normalizeSkillList(proj.techStack)) {
      registerSkill(pass2, verified, evidence, s, { source: "project", label: title, pass: 2 });
    }
    const blob = [proj.title, proj.description].filter(Boolean).join(" ");
    for (const s of scanTextForKnownSkills(blob)) {
      registerSkill(pass2, verified, evidence, s, { source: "project", label: title, pass: 2 });
    }
  }

  const experience = parsed?.experience || profile?.profileSections?.experience || [];
  for (const exp of experience) {
    const label = [exp.role, exp.company].filter(Boolean).join(" @ ") || "Experience";
    const blob = [exp.role, exp.company, exp.description].filter(Boolean).join(" ");
    for (const s of scanTextForKnownSkills(blob)) {
      registerSkill(pass2, verified, evidence, s, { source: "experience", label, pass: 2 });
    }
  }

  const certs =
    parsed?.certifications || profile?.certificationEntries || profile?.profileSections?.certifications || [];
  for (const cert of certs) {
    const name = cert.name || "Certification";
    const blob = [cert.name, cert.issuer].filter(Boolean).join(" ");
    for (const s of scanTextForKnownSkills(blob)) {
      registerSkill(pass2, verified, evidence, s, { source: "certification", label: name, pass: 2 });
    }
  }

  const resumeText = profile?.resume?.text || "";
  const summary = parsed?.summary || profile?.summary || "";
  for (const s of scanTextForKnownSkills(`${summary} ${resumeText.slice(0, 8000)}`)) {
    if (!pass1.has(s) && !pass2.has(s)) {
      registerSkill(pass3, verified, evidence, s, { source: "implicit", label: "Resume context", pass: 3 });
    }
  }

  for (const s of pass1) pass3.delete(s);
  for (const s of pass2) pass3.delete(s);

  const all = new Set([...pass1, ...pass2, ...pass3]);
  const dictionaryHits = [...all].filter((s) => KNOWN_SKILL_DICTIONARY.has(s)).length;
  const extractionQuality = all.size ? dictionaryHits / all.size : 0;

  return {
    pass1,
    pass2,
    pass3,
    verified,
    all,
    evidence,
    projectCount: projects.length,
    experienceCount: experience.length,
    extractionQuality
  };
}

export function getTargetRoleSkills(roleKey: string): {
  roleKey: string;
  profile: RoleSkillProfile;
  core: string[];
  secondary: string[];
  optional: string[];
  tiers: Array<{ skill: string; tier: SkillTier }>;
  mappingReliable: boolean;
} {
  const mappingReliable = Boolean(TARGET_ROLE_PROFILES[roleKey]);
  const profile = TARGET_ROLE_PROFILES[roleKey] || TARGET_ROLE_PROFILES.full_stack_developer;
  const core = profile.coreSkills.map(canonicalForGap).filter(Boolean);
  const secondary = profile.secondarySkills.map(canonicalForGap).filter(Boolean);
  const optional = profile.optionalSkills.map(canonicalForGap).filter(Boolean);
  const tiers: Array<{ skill: string; tier: SkillTier }> = [
    ...core.map((skill) => ({ skill, tier: "core" as SkillTier })),
    ...secondary.map((skill) => ({ skill, tier: "secondary" as SkillTier })),
    ...optional.map((skill) => ({ skill, tier: "optional" as SkillTier }))
  ];
  return {
    roleKey: mappingReliable ? roleKey : "full_stack_developer",
    profile,
    core,
    secondary,
    optional,
    tiers,
    mappingReliable
  };
}

function userHasExact(skill: string, extracted: ExtractedResumeSkills): boolean {
  return extracted.pass1.has(skill) || extracted.verified.has(skill);
}

function userHasSemantic(skill: string, extracted: ExtractedResumeSkills): string | null {
  const equivalents = SEMANTIC_EQUIVALENTS[skill] || [skill];
  for (const eq of equivalents) {
    const c = canonicalForGap(eq);
    if (extracted.all.has(c)) return c;
  }
  return null;
}

function hasContextEvidence(skill: string, extracted: ExtractedResumeSkills): boolean {
  const ev = extracted.evidence.get(skill) || [];
  return ev.some((e) => e.source === "project" || e.source === "experience" || e.source === "certification");
}

function tierFromConfidence(c: number): ConfidenceTier {
  if (c >= 0.8) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

function buildExplanation(
  skill: string,
  displayName: string,
  status: SkillStatus,
  layer: MatchLayer,
  evidence: SkillEvidence[]
): string {
  if (status === "present") {
    if (layer === "exact") return `${displayName} verified in resume skills section`;
    if (layer === "semantic") return `${displayName} matched via equivalent skill naming`;
    return `${displayName} supported by project or experience evidence`;
  }
  if (status === "partial") {
    const src = evidence[0]?.source || "context";
    return `${displayName} found in ${src} only — limited evidence`;
  }
  return `${displayName} marked missing because no project or skills evidence found`;
}

function assessOneSkill(
  normalized: string,
  tier: SkillTier,
  extracted: ExtractedResumeSkills
): SkillAssessment {
  const displayName = toDisplaySkill(normalized) || normalized;
  const evidence = [...(extracted.evidence.get(normalized) || [])];

  const semanticHit = userHasSemantic(normalized, extracted);
  if (semanticHit && semanticHit !== normalized && !evidence.some((e) => e.label.includes(semanticHit))) {
    evidence.push(...(extracted.evidence.get(semanticHit) || []));
  }

  const uniqueEvidence = evidence.filter(
    (e, i, arr) => arr.findIndex((x) => x.source === e.source && x.label === e.label) === i
  );

  let matchLayer: MatchLayer = "none";
  let confidence = 0;

  const exact = userHasExact(normalized, extracted) || extracted.pass1.has(normalized);
  const semantic = Boolean(semanticHit);
  const context = hasContextEvidence(normalized, extracted) || uniqueEvidence.some((e) => e.pass === 2);

  if (exact && context) {
    matchLayer = "exact";
    confidence = 0.95;
  } else if (exact) {
    matchLayer = "exact";
    confidence = 0.85;
  } else if (semantic && context) {
    matchLayer = "semantic";
    confidence = 0.75;
  } else if (semantic) {
    matchLayer = "semantic";
    confidence = 0.65;
  } else if (context && uniqueEvidence.length >= 2) {
    matchLayer = "context";
    confidence = 0.6;
  } else if (context || uniqueEvidence.length === 1) {
    matchLayer = "context";
    confidence = 0.4;
  }

  const verified = confidence >= 0.5;
  let status: SkillStatus = "missing";
  let proficiency = 0;

  if (confidence >= 0.8) {
    status = "present";
    proficiency = clamp(confidence * 100);
  } else if (confidence >= 0.5) {
    status = "present";
    proficiency = clamp(confidence * 100 - 5);
  } else if (confidence >= 0.35) {
    status = "partial";
    proficiency = clamp(confidence * 100);
  } else {
    status = "missing";
    proficiency = 0;
  }

  return {
    skill: normalized,
    displayName,
    normalized,
    status,
    proficiency,
    tier,
    confidence,
    confidenceTier: tierFromConfidence(confidence),
    matchLayer,
    verified,
    explanation: buildExplanation(normalized, displayName, status, matchLayer, uniqueEvidence),
    evidence: uniqueEvidence
  };
}

function computeWeightedMatch(assessments: SkillAssessment[]): number {
  let numerator = 0;
  let denominator = 0;

  for (const a of assessments) {
    const w = TIER_WEIGHT[a.tier];
    denominator += w;
    if (a.verified && a.status === "present") {
      numerator += w;
    } else if (a.verified && a.status === "partial") {
      numerator += w * 0.5;
    }
  }

  if (!denominator) return 0;
  return clamp((numerator / denominator) * 100);
}

function computeAnalysisConfidence(
  extracted: ExtractedResumeSkills,
  profile: InternProfile | null,
  mappingReliable: boolean
): number {
  let score = 0;

  const hasExplicit = extracted.pass1.size > 0 ? 0.35 : 0;
  const hasContext = extracted.pass2.size > 0 || extracted.projectCount > 0 ? 0.25 : 0;
  const clarity = extracted.extractionQuality * 0.2;
  const resumeQuality = profile?.resume?.analysis?.quality?.isReliable ? 0.1 : 0.05;
  const roleMap = mappingReliable ? 0.1 : 0.03;

  score = hasExplicit + hasContext + clarity + resumeQuality + roleMap;

  if (!profile?.resumeUploaded) score *= 0.5;
  if (extracted.all.size < 3) score *= 0.7;

  return clamp(score * 100);
}

export function calculateSkillGap(profile: InternProfile | null, roleKey: string): SkillGapResult {
  const extracted = extractSkillsFromResume(profile);
  const { roleKey: resolvedKey, profile: roleProfile, tiers, mappingReliable } = getTargetRoleSkills(roleKey);

  const hasResumeData =
    Boolean(profile?.resumeUploaded) &&
    (extracted.pass1.size > 0 || extracted.pass2.size > 0 || extracted.projectCount > 0);

  const assessments: SkillAssessment[] = tiers.map(({ skill, tier }) =>
    assessOneSkill(skill, tier, extracted)
  );

  const present = assessments.filter((a) => a.status === "present");
  const partial = assessments.filter((a) => a.status === "partial");
  const missing = assessments.filter((a) => a.status === "missing");
  const verifiedPresent = assessments.filter((a) => a.verified && a.status === "present");
  const criticalMissing = missing.filter((a) => a.tier === "core");
  const optionalMissing = missing.filter((a) => a.tier === "optional");
  const strongSkills = present.filter((a) => a.confidence >= 0.8);

  const matchPercent = computeWeightedMatch(assessments);
  const analysisConfidence = computeAnalysisConfidence(extracted, profile, mappingReliable);
  const lowConfidenceAnalysis = analysisConfidence < 70 || !hasResumeData;

  const variance = lowConfidenceAnalysis ? Math.max(5, Math.round((100 - analysisConfidence) * 0.15)) : 3;
  const matchPercentLow = clamp(matchPercent - variance);
  const matchPercentHigh = clamp(matchPercent + variance);
  const showMatchRange = analysisConfidence < 70;

  const priorityRoadmap = [...criticalMissing, ...partial.filter((p) => p.tier === "core")]
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, 5);

  const chartDatasets = buildChartDatasets(assessments, extracted);

  return {
    roleKey: resolvedKey,
    roleLabel: roleProfile.label,
    roleMappingReliable: mappingReliable,
    matchPercent,
    matchPercentLow,
    matchPercentHigh,
    showMatchRange,
    analysisConfidence,
    lowConfidenceAnalysis,
    present,
    partial,
    missing,
    verifiedPresent,
    criticalMissing,
    optionalMissing,
    strongSkills,
    priorityRoadmap,
    quickWins: buildQuickWins(assessments, roleProfile.label),
    structuredSkills: chartDatasets.structured,
    categorySummary: chartDatasets.categorySummary,
    categorySummaryValid: chartDatasets.categorySummaryValid,
    progressBars: chartDatasets.progressBars,
    progressBarsChartValid: chartDatasets.progressBarsValid,
    extractedSkillCount: extracted.all.size,
    verifiedSkillCount: extracted.verified.size,
    hasResumeData,
    insufficientData: !hasResumeData || tiers.length === 0
  };
}

const REQUIRED_LEVEL_BY_TIER: Record<SkillTier, number> = {
  core: 100,
  secondary: 85,
  optional: 70
};

const IMPACT_RANK: Record<QuickWinImpact, number> = { High: 2, Medium: 1 };
const EFFORT_RANK: Record<QuickWinEffort, number> = { Low: 0, Medium: 1 };

function quickWinImpact(tier: SkillTier): QuickWinImpact {
  return tier === "core" ? "High" : "Medium";
}

function quickWinEffort(skill: string, tier: SkillTier): QuickWinEffort {
  const canonical = canonicalForGap(skill);
  if (SKILL_EFFORT_HINTS[canonical]) return SKILL_EFFORT_HINTS[canonical];
  return tier === "optional" ? "Low" : "Medium";
}

function quickWinWhy(assessment: SkillAssessment, roleLabel: string): string {
  if (assessment.tier === "core" && assessment.status === "missing") {
    return `Core requirement for ${roleLabel} roles`;
  }
  if (assessment.status === "missing") {
    return `Commonly expected in ${roleLabel} positions`;
  }
  return `Needs stronger proof for ${roleLabel} hiring`;
}

function quickWinAction(skill: string, displayName: string, tier: SkillTier): string {
  const canonical = canonicalForGap(skill);
  if (SKILL_QUICK_WIN_ACTIONS[canonical]) return SKILL_QUICK_WIN_ACTIONS[canonical];
  if (tier === "core") return `Complete a focused ${displayName} practice exercise`;
  return `Try a short ${displayName} tutorial`;
}

/** Missing or weak skills ranked for Quick Wins (impact → effort) */
export function buildQuickWins(assessments: SkillAssessment[], roleLabel: string): QuickWinItem[] {
  const weak = assessments.filter(
    (a) => a.status === "missing" || a.status === "partial" || (a.status === "present" && !a.verified)
  );

  const seen = new Set<string>();
  const items: QuickWinItem[] = [];

  for (const a of weak) {
    if (seen.has(a.normalized)) continue;
    seen.add(a.normalized);
    items.push({
      skill: a.normalized,
      displayName: a.displayName,
      why: quickWinWhy(a, roleLabel),
      effort: quickWinEffort(a.normalized, a.tier),
      impact: quickWinImpact(a.tier),
      action: quickWinAction(a.normalized, a.displayName, a.tier)
    });
  }

  return items
    .sort((a, b) => {
      const impactDiff = IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact];
      if (impactDiff !== 0) return impactDiff;
      return EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort];
    })
    .slice(0, 5);
}

function safeChartNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (value == null || !Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return clamp(n);
}

function getSkillArea(skill: string): SkillCategoryKey {
  const canonical = canonicalForGap(skill);
  return SKILL_CATEGORY_MAP[canonical] || "tools";
}

/** Fold internal areas into the 6 summary categories shown in flat bar chart */
function toSummaryCategory(area: SkillCategoryKey): SummaryCategoryKey | null {
  if (area === "data_ml") return "programming";
  if (SUMMARY_CATEGORY_KEYS.includes(area as SummaryCategoryKey)) return area as SummaryCategoryKey;
  return null;
}

function toVisualStatus(row: StructuredSkillRow): SkillVisualStatus {
  if (row.status === "missing" || row.userLevel === 0) return "missing";
  if (
    row.status === "partial" ||
    row.confidence < 0.7 ||
    row.userLevel < row.requiredLevel * 0.7
  ) {
    return "partial";
  }
  return "strong";
}

/** STEP 1 — normalize, dedupe, and drop invalid extracted skills */
export function cleanRawExtractedSkills(extracted: ExtractedResumeSkills): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of extracted.all) {
    const canonical = canonicalForGap(raw);
    if (!canonical || seen.has(canonical)) continue;
    if (!isValidTechnicalSkill(canonical)) continue;
    seen.add(canonical);
    cleaned.push(canonical);
  }
  return cleaned;
}

/** STEP 2 — unified structure for mapping + chart layers */
export function structureSkillData(assessments: SkillAssessment[]): StructuredSkillRow[] {
  return assessments.map((a) => {
    const chartStatus: SkillStatus =
      a.confidence < 0.7 && a.status === "present" ? "partial" : a.status;
    const userLevel = chartStatus === "missing" ? 0 : safeChartNumber(a.proficiency, 0);

    return {
      skillName: a.displayName,
      normalized: a.normalized,
      category: a.tier,
      skillArea: getSkillArea(a.normalized),
      userLevel,
      requiredLevel: REQUIRED_LEVEL_BY_TIER[a.tier],
      status: chartStatus,
      confidence: a.confidence,
      verified: a.verified && a.confidence >= 0.7,
      explanation: a.explanation
    };
  });
}

/** STEP 3A — flat category summary bars (linear comparison, not radar) */
export function aggregateCategorySummary(rows: StructuredSkillRow[]): CategorySummaryBar[] {
  return SUMMARY_CATEGORY_KEYS.map((key) => {
    const inCategory = rows.filter((r) => toSummaryCategory(r.skillArea) === key);
    if (!inCategory.length) {
      return {
        key,
        category: SUMMARY_CATEGORY_LABELS[key],
        userScore: 0,
        requiredScore: 0
      };
    }

    let userWeighted = 0;
    let requiredWeighted = 0;
    let totalWeight = 0;

    for (const row of inCategory) {
      const w = TIER_WEIGHT[row.category];
      totalWeight += w;
      userWeighted += row.userLevel * w;
      requiredWeighted += row.requiredLevel * w;
    }

    return {
      key,
      category: SUMMARY_CATEGORY_LABELS[key],
      userScore: totalWeight ? safeChartNumber(userWeighted / totalWeight, 0) : 0,
      requiredScore: totalWeight ? safeChartNumber(requiredWeighted / totalWeight, 0) : 0
    };
  });
}

/** Categories with role requirements — used for summary display */
export function getActiveCategorySummary(bars: CategorySummaryBar[]): CategorySummaryBar[] {
  return bars.filter((bar) => bar.requiredScore > 0);
}

/** STEP 3B — progress bar matrix: top deduped skills (CORE → SECONDARY → OPTIONAL) */
export function aggregateProgressBarDataset(rows: StructuredSkillRow[], limit = 10): ProgressBarItem[] {
  const tierOrder: Record<SkillTier, number> = { core: 0, secondary: 1, optional: 2 };
  const statusOrder: Record<SkillVisualStatus, number> = { missing: 0, partial: 1, strong: 2 };
  const seen = new Set<string>();

  return rows
    .filter((r) => {
      if (seen.has(r.normalized)) return false;
      seen.add(r.normalized);
      return r.verified || r.status === "missing" || r.status === "partial";
    })
    .map((r) => {
      const visualStatus = toVisualStatus(r);
      return {
        skill: r.normalized,
        displayName: r.skillName,
        userLevel: safeChartNumber(r.userLevel, 0),
        requiredLevel: safeChartNumber(r.requiredLevel, 100),
        status: visualStatus,
        tier: r.category,
        confidence: r.confidence,
        verified: r.verified,
        tooltip: r.explanation
      };
    })
    .sort((a, b) => {
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      const gapA = a.requiredLevel - a.userLevel;
      const gapB = b.requiredLevel - b.userLevel;
      return gapB - gapA;
    })
    .slice(0, limit);
}

/** Safety validation before category summary bars render */
export function validateCategorySummaryData(
  bars: CategorySummaryBar[]
): ChartValidationResult<CategorySummaryBar> {
  if (!Array.isArray(bars)) return { valid: false, data: [] };

  const byKey = new Map<string, CategorySummaryBar>();
  for (const bar of bars) {
    if (!bar?.key) continue;
    const key = bar.key as SummaryCategoryKey;
    byKey.set(bar.key, {
      key,
      category: String(bar.category || SUMMARY_CATEGORY_LABELS[key] || bar.key),
      userScore: safeChartNumber(bar.userScore, 0),
      requiredScore: safeChartNumber(bar.requiredScore, 0)
    });
  }

  const data = getActiveCategorySummary(
    SUMMARY_CATEGORY_KEYS.map((key) =>
      byKey.get(key) ?? {
        key,
        category: SUMMARY_CATEGORY_LABELS[key],
        userScore: 0,
        requiredScore: 0
      }
    )
  );

  const valid =
    data.length > 0 &&
    data.every(
      (d) =>
        d.category.length > 0 &&
        Number.isFinite(d.userScore) &&
        Number.isFinite(d.requiredScore)
    );

  return { valid, data: valid ? data : [] };
}

export function validateProgressBarChartData(
  bars: ProgressBarItem[]
): ChartValidationResult<ProgressBarItem> {
  if (!Array.isArray(bars) || bars.length === 0) return { valid: false, data: [] };

  const seen = new Set<string>();
  const data = bars
    .map((bar) => ({
      skill: String(bar?.skill ?? "").trim(),
      displayName: String(bar?.displayName ?? bar?.skill ?? "").trim(),
      userLevel: safeChartNumber(bar?.userLevel ?? (bar as { proficiency?: number }).proficiency, 0),
      requiredLevel: safeChartNumber(bar?.requiredLevel, 100),
      status: (["strong", "partial", "missing"].includes(bar?.status)
        ? bar.status
        : "missing") as SkillVisualStatus,
      tier: (["core", "secondary", "optional"].includes(bar?.tier)
        ? bar.tier
        : "secondary") as SkillTier,
      confidence: safeChartNumber(bar?.confidence, 0),
      verified: Boolean(bar?.verified),
      tooltip: String(bar?.tooltip ?? "")
    }))
    .filter((bar) => {
      if (!bar.skill.length || !bar.displayName.length || seen.has(bar.skill)) return false;
      seen.add(bar.skill);
      return true;
    });

  const valid =
    data.length > 0 &&
    data.every(
      (bar) =>
        Number.isFinite(bar.userLevel) &&
        Number.isFinite(bar.requiredLevel) &&
        bar.userLevel >= 0 &&
        bar.userLevel <= 100 &&
        bar.requiredLevel >= 0 &&
        bar.requiredLevel <= 100
    );

  return { valid, data: valid ? data : [] };
}

function buildChartDatasets(
  assessments: SkillAssessment[],
  extracted: ExtractedResumeSkills
): {
  structured: StructuredSkillRow[];
  categorySummary: CategorySummaryBar[];
  categorySummaryValid: boolean;
  progressBars: ProgressBarItem[];
  progressBarsValid: boolean;
} {
  cleanRawExtractedSkills(extracted);
  const structured = structureSkillData(assessments);
  const rawSummary = aggregateCategorySummary(structured);
  const rawBars = aggregateProgressBarDataset(structured, 10);
  const summaryValidation = validateCategorySummaryData(rawSummary);
  const barsValidation = validateProgressBarChartData(rawBars);

  return {
    structured,
    categorySummary: summaryValidation.data,
    categorySummaryValid: summaryValidation.valid,
    progressBars: barsValidation.data,
    progressBarsValid: barsValidation.valid
  };
}

/** @deprecated use buildChartDatasets pipeline */
export function generateProgressBarData(assessments: SkillAssessment[]): ProgressBarItem[] {
  const structured = structureSkillData(assessments);
  return validateProgressBarChartData(aggregateProgressBarDataset(structured, 10)).data;
}

/** @deprecated use buildChartDatasets pipeline */
export function generateCategorySummary(assessments: SkillAssessment[]): CategorySummaryBar[] {
  const structured = structureSkillData(assessments);
  return validateCategorySummaryData(aggregateCategorySummary(structured)).data;
}
