import { Recommendation } from "@/lib/intern-portal";
import { normalizeSkillList, toDisplaySkillList } from "@/lib/skill-normalizer";

export function getMissingRequiredSkillsFromRecommendations(recommendations: Recommendation[]): string[] {
  const allMissing = recommendations.flatMap((item) => item.missingRequiredSkills || []);
  const normalized = normalizeSkillList(allMissing);
  return toDisplaySkillList(normalized);
}
