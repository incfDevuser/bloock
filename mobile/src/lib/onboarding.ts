export const onboardingSteps = [
  "name",
  "email",
  "password",
  "day-start",
  "day-end",
  "weekdays",
  "meals",
  "sport",
  "review",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export type MealConfig = {
  enabled: boolean;
  time: string;
  durationMinutes: number;
};

export type SportConfig = {
  enabled: boolean;
  time: string;
  durationMinutes: number;
};

export type OnboardingDraft = {
  name: string;
  email: string;
  password: string;
  dayStart: string;
  dayEnd: string;
  weekdays: boolean;
  breakfast: MealConfig;
  lunch: MealConfig;
  dinner: MealConfig;
  sport: SportConfig;
};

export type GeneratedBlock = {
  key: string;
  label: string;
  type: "comida" | "deporte";
  startTime: string;
  durationMinutes: number;
  color: string;
};

export const defaultDraft: OnboardingDraft = {
  name: "",
  email: "",
  password: "",
  dayStart: "07:00",
  dayEnd: "21:00",
  weekdays: true,
  breakfast: { enabled: false, time: "08:00", durationMinutes: 30 },
  lunch: { enabled: false, time: "13:30", durationMinutes: 45 },
  dinner: { enabled: false, time: "20:00", durationMinutes: 45 },
  sport: { enabled: false, time: "18:00", durationMinutes: 60 },
};

export const onboardingStepMeta: Record<
  OnboardingStep,
  { title: string; eyebrow: string; helper: string }
> = {
  name: {
    title: "¿Cómo te llamás?",
    eyebrow: "Paso 1",
    helper: "Para no decirte usuario.",
  },
  email: {
    title: "¿Qué correo usamos?",
    eyebrow: "Paso 2",
    helper: "Te va a seguir en todo Block.",
  },
  password: {
    title: "Elegí una contraseña",
    eyebrow: "Paso 3",
    helper: "La vas a usar para volver a entrar.",
  },
  "day-start": {
    title: "¿A qué hora arrancas tu día?",
    eyebrow: "Paso 4",
    helper: "Desde ahí armamos tu primer bloque.",
  },
  "day-end": {
    title: "¿A qué hora cerrás tu día?",
    eyebrow: "Paso 5",
    helper: "Para saber hasta dónde se estira el mapa.",
  },
  weekdays: {
    title: "¿Es así de lunes a viernes?",
    eyebrow: "Paso 6",
    helper: "Si cambia luego, lo ajustás sin drama.",
  },
  meals: {
    title: "¿Comés en horarios fijos?",
    eyebrow: "Paso 7",
    helper: "Desayuno, almuerzo y cena si aplican.",
  },
  sport: {
    title: "¿Hacés deporte?",
    eyebrow: "Paso 8",
    helper: "Si sí, lo convertimos en bloque fijo.",
  },
  review: {
    title: "Así queda tu día",
    eyebrow: "Revisión",
    helper: "Confirmás y entrás con todo listo.",
  },
};

export function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export function getStepIndex(step: OnboardingStep) {
  return onboardingSteps.indexOf(step) + 1;
}

export function getNextStep(step: OnboardingStep) {
  const index = onboardingSteps.indexOf(step);
  return onboardingSteps[index + 1] ?? null;
}

export function getPreviousStep(step: OnboardingStep) {
  const index = onboardingSteps.indexOf(step);
  return onboardingSteps[index - 1] ?? null;
}

export function buildGeneratedBlocks(draft: OnboardingDraft) {
  const blocks: GeneratedBlock[] = [];

  if (draft.breakfast.enabled) {
    blocks.push({
      key: "breakfast",
      label: "Desayuno",
      type: "comida",
      startTime: draft.breakfast.time,
      durationMinutes: draft.breakfast.durationMinutes,
      color: "#5ec26a",
    });
  }

  if (draft.lunch.enabled) {
    blocks.push({
      key: "lunch",
      label: "Almuerzo",
      type: "comida",
      startTime: draft.lunch.time,
      durationMinutes: draft.lunch.durationMinutes,
      color: "#f5a623",
    });
  }

  if (draft.dinner.enabled) {
    blocks.push({
      key: "dinner",
      label: "Cena",
      type: "comida",
      startTime: draft.dinner.time,
      durationMinutes: draft.dinner.durationMinutes,
      color: "#5ec26a",
    });
  }

  if (draft.sport.enabled) {
    blocks.push({
      key: "sport",
      label: "Deporte",
      type: "deporte",
      startTime: draft.sport.time,
      durationMinutes: draft.sport.durationMinutes,
      color: "#f5a623",
    });
  }

  return blocks.sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime));
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!remainder) {
    return `${hours} h`;
  }

  return `${hours} h ${remainder} min`;
}

export function formatBlockSummary(block: GeneratedBlock) {
  return `${block.startTime} · ${formatMinutes(block.durationMinutes)}`;
}

export const weekdayCodes = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function buildOnboardingSetup(draft: OnboardingDraft) {
  const appliesTo = draft.weekdays ? weekdayCodes.slice(0, 5) : [...weekdayCodes];

  return {
    dayConfig: {
      name: draft.weekdays ? "Semana" : "Diario",
      wake_time: draft.dayStart,
      end_time: draft.dayEnd,
      applies_to: appliesTo,
      is_default: true,
    },
    blocks: buildGeneratedBlocks(draft).map((block) => ({
      name: block.label,
      type: block.type,
      start_time: block.startTime,
      duration_minutes: block.durationMinutes,
      color: block.color,
      is_fixed: true,
      is_active: true,
      repeat_rule: draft.weekdays ? "weekdays" : "daily",
      applies_to: appliesTo,
    })),
  };
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
