/**
 * Hard-Coded Math Scoring Engine
 *
 * Rules:
 * 1. For each question, lookup the raw answer.
 * 2. If reverse_scoring is enabled, invert: score = max_option_value - raw_value
 * 3. Sum scores per subscale (if SUBSCALES mode), else sum all for total.
 * 4. Derive interpretation label from interpretation_bands if defined.
 *
 * NO AI is involved here — this is pure deterministic TypeScript math.
 */

import type { RawAnswers, ScoringLogic, Question, CalculatedScore } from "./types";

function getMaxOptionValue(question: Question): number {
  return Math.max(...question.options.map((o) => o.value));
}

function getAnswerScore(
  questionId: string,
  rawAnswers: RawAnswers,
  questions: Question[]
): number {
  const q = questions.find((q) => q.id === questionId);
  if (!q) return 0;

  // textarea and info questions are unscored — they contribute 0
  if (q.type === "textarea" || q.type === "info") return 0;

  const raw = rawAnswers[questionId];
  if (typeof raw !== "number") return 0;

  if (q.reverse_scoring) {
    const max = getMaxOptionValue(q);
    return max - raw;
  }

  return raw;
}

export function calculateTestScore(
  rawAnswers: RawAnswers,
  scoringLogic: ScoringLogic,
  questions: Question[]
): CalculatedScore {
  const subscales: Record<string, number> = {};
  let total = 0;

  if (scoringLogic.type === "SUBSCALES" && scoringLogic.subscales?.length) {
    for (const subscale of scoringLogic.subscales) {
      let subscaleTotal = 0;
      for (const qId of subscale.question_ids) {
        subscaleTotal += getAnswerScore(qId, rawAnswers, questions);
      }
      subscales[subscale.name] = subscaleTotal;
      total += subscaleTotal;
    }
    // Also include any questions NOT in a subscale in total
    const allSubscaleQuestions = scoringLogic.subscales.flatMap((s) => s.question_ids);
    for (const q of questions) {
      if (!allSubscaleQuestions.includes(q.id)) {
        total += getAnswerScore(q.id, rawAnswers, questions);
      }
    }
  } else {
    // SUM mode: add all answered questions
    for (const q of questions) {
      total += getAnswerScore(q.id, rawAnswers, questions);
    }
  }

  // Derive interpretation from bands
  let interpretation: string | undefined;
  if (scoringLogic.interpretation_bands) {
    const band = scoringLogic.interpretation_bands.find(
      (b) => total >= b.min && total <= b.max
    );
    interpretation = band?.label;
  }

  return { total, subscales, interpretation };
}
