"use client";

import { Award } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { learningPaths } from "@/data/dummy";
import {
  SectionBlock,
  SectionHeading,
  EmbedMatrix,
  EmbedCell,
  SkillChip,
  TileTitle,
  TileText
} from "@/components/home/home-primitives";

const COURSES = learningPaths.slice(0, 3);

export function CoursesSection() {
  return (
    <SectionBlock id="courses">
      <ScrollReveal variant="fade-up" distance={6}>
        <SectionHeading
          eyebrow="Learning"
          title="Courses & certifications"
          description="Curated paths to strengthen your placement profile."
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" distance={5}>
        <EmbedMatrix cols={3}>
          {COURSES.map((course) => (
            <EmbedCell key={course.id}>
              <div className="flex items-center justify-between gap-2">
                <SkillChip>{course.category}</SkillChip>
                <Award className="h-3.5 w-3.5 text-internai-cyan" strokeWidth={1.75} aria-hidden />
              </div>
              <TileTitle className="mt-2">{course.title}</TileTitle>
              <TileText className="mt-1">{course.summary}</TileText>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-internai-muted">
                {course.duration} · {course.level}
              </p>
            </EmbedCell>
          ))}
        </EmbedMatrix>
      </ScrollReveal>
    </SectionBlock>
  );
}
