export type TaskPriority = "high" | "med" | "low";

export type DemoTask = {
  id: string;
  text: string;
  priority: TaskPriority;
  done: boolean;
};

export type DemoBlockType =
  | "trabajo"
  | "deporte"
  | "comida"
  | "emprendimiento"
  | "estudios"
  | "universidad"
  | "fijo"
  | "otro";

export type DemoBlock = {
  id: string;
  type: DemoBlockType;
  name: string;
  start: string;
  end: string;
  tasks: DemoTask[];
};

export const TOKENS = {
  bg: "#F8F8F8",
  surface: "#FFFFFF",
  surface2: "#F0F0F0",
  border: "#E0E0E0",
  primary: "#C8F135",
  primaryDark: "#A8CC1A",
  text: "#0F0F0F",
  textSecondary: "#666666",
  textDisabled: "#BBBBBB",
  blocks: {
    trabajo: { bg: "#4B7BF5", label: "Trabajo" },
    deporte: { bg: "#F5A623", label: "Deporte" },
    comida: { bg: "#5EC26A", label: "Comida" },
    emprendimiento: { bg: "#C8F135", label: "Emprendimiento" },
    estudios: { bg: "#19C2B1", label: "Estudios" },
    universidad: { bg: "#8B5CF6", label: "Universidad" },
    fijo: { bg: "#555555", label: "Fijo" },
    otro: { bg: "#A78BFA", label: "Otro" },
  } as const,
};

export const INITIAL_BLOCKS: DemoBlock[] = [
  {
    id: "b1",
    type: "comida",
    name: "Desayuno",
    start: "07:00",
    end: "08:00",
    tasks: [],
  },
  {
    id: "b2",
    type: "deporte",
    name: "Gym",
    start: "08:00",
    end: "09:00",
    tasks: [
      { id: "t1", text: "Push day · pecho y tríceps", priority: "med", done: true },
      { id: "t2", text: "Cardio 15 min", priority: "low", done: false },
    ],
  },
  {
    id: "b3",
    type: "trabajo",
    name: "Trabajo · Acme",
    start: "09:30",
    end: "13:00",
    tasks: [
      { id: "t3", text: "Daily standup", priority: "med", done: true },
      { id: "t4", text: "Revisar PRs del equipo", priority: "med", done: true },
      { id: "t5", text: "Diseño del flujo de pago — v2", priority: "high", done: false },
      { id: "t6", text: "1:1 con María", priority: "low", done: false },
    ],
  },
  {
    id: "b4",
    type: "comida",
    name: "Almuerzo",
    start: "13:00",
    end: "14:00",
    tasks: [],
  },
  {
    id: "b5",
    type: "trabajo",
    name: "Trabajo · Acme",
    start: "14:00",
    end: "18:00",
    tasks: [
      { id: "t7", text: "Ticket #482 — bug en checkout", priority: "high", done: false },
      { id: "t8", text: "Cerrar specs del Q3 roadmap", priority: "high", done: false },
      { id: "t9", text: "Responder email del legal", priority: "med", done: false },
    ],
  },
  {
    id: "b6",
    type: "emprendimiento",
    name: "Mi proyecto",
    start: "19:00",
    end: "21:30",
    tasks: [
      { id: "t10", text: "Llamada con primer cliente piloto", priority: "high", done: false },
      { id: "t11", text: "Iterar landing — hero copy", priority: "med", done: false },
      { id: "t12", text: "Mandar factura a Estudio Norte", priority: "med", done: false },
      { id: "t13", text: "Pedir feedback a Tomás", priority: "low", done: false },
    ],
  },
  {
    id: "b7",
    type: "comida",
    name: "Cena",
    start: "21:30",
    end: "22:30",
    tasks: [],
  },
];

const now = new Date();
export const NOW_MIN = now.getHours() * 60 + now.getMinutes();

export function timeToMin(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function fmtDuration(start: string, end: string) {
  const duration = timeToMin(end) - timeToMin(start);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours === 0) {
    return `${minutes}min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

export function blockState(block: Pick<DemoBlock, "start" | "end">) {
  const start = timeToMin(block.start);
  const end = timeToMin(block.end);

  if (NOW_MIN >= start && NOW_MIN < end) {
    return "now";
  }

  if (NOW_MIN >= end) {
    return "past";
  }

  return "future";
}

export function minuteLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}
