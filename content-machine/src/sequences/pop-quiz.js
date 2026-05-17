// ============================================
// pop-quiz.js — 4-story quiz sequence. 3 questions + 1 result reveal.
// Each Q is a story-question layout; the result is a story-numbers
// scoreboard with a CTA.
//
// Args:
//   { questions: [{ question, answers }], resultTitle, resultSubline }
// ============================================

const DEFAULTS = {
  questions: [
    { question: '¿CUÁNTOS PAÍSES SEDES TIENE EL MUNDIAL 2026?',
      answers: ['1', '2', '3', '4'] },
    { question: '¿QUIÉN ES NUESTRO CAPITÁN HISTÓRICO?',
      answers: ['JAMES', 'PIBE', 'YEPES', 'PIBE Y JAMES'] },
    { question: '¿CONTRA QUIÉN ABRIMOS EL MUNDIAL?',
      answers: ['BRASIL', 'PORTUGAL', 'UZBEKISTÁN', 'JAPÓN'] },
  ],
  resultTitle: '3/3',
  resultSubline: 'Eres Tricolor de pura cepa',
};

export function generate({ questions, resultTitle, resultSubline } = {}) {
  const qs = questions && questions.length === 3 ? questions : DEFAULTS.questions;
  const title = resultTitle || DEFAULTS.resultTitle;
  const sub = resultSubline || DEFAULTS.resultSubline;

  return [
    {
      step: 1,
      role: 'hook',
      layout: 'question',
      offsetMin: 0,
      question: qs[0].question,
      answers: qs[0].answers,
      bg: 'cream', accent: 'red',
    },
    {
      step: 2,
      role: 'tease',
      layout: 'question',
      offsetMin: 60,
      question: qs[1].question,
      answers: qs[1].answers,
      bg: 'yellow', accent: 'red',
    },
    {
      step: 3,
      role: 'tease',
      layout: 'question',
      offsetMin: 120,
      question: qs[2].question,
      answers: qs[2].answers,
      bg: 'blue', accent: 'yellow',
    },
    {
      step: 4,
      role: 'cta',
      layout: 'numbers',
      offsetMin: 180,
      eyebrow: 'TU PUNTAJE',
      value: title,
      label: sub,
      bg: 'red', accent: 'yellow',
      valueSize: 480,
    },
  ];
}

export const NAME = 'pop-quiz';
export const DESCRIPTION = '4-story quiz · 3 questions + score reveal.';
