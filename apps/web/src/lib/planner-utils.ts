export const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
export const DAY_NAMES_FULL = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

/** Returns YYYY-MM-DD of Monday for the week containing `date` */
export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

/** Get the Date object for a specific day_of_week given weekStart */
export function getDateForDay(weekStart: string, dayOfWeek: number): Date {
  const d = parseDate(weekStart);
  d.setDate(d.getDate() + dayOfWeek);
  return d;
}

/** Format: "17 - 23 Fev 2026" */
export function formatWeekRange(weekStart: string): string {
  const mon = parseDate(weekStart);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  if (mon.getMonth() === sun.getMonth()) {
    return `${mon.getDate()} - ${sun.getDate()} ${monthNames[mon.getMonth()]} ${mon.getFullYear()}`;
  }
  return `${mon.getDate()} ${monthNames[mon.getMonth()]} - ${sun.getDate()} ${monthNames[sun.getMonth()]} ${sun.getFullYear()}`;
}

/** Format: "Seg 17" */
export function formatDayShort(weekStart: string, dayOfWeek: number): string {
  const d = getDateForDay(weekStart, dayOfWeek);
  return `${DAY_NAMES[dayOfWeek]} ${d.getDate()}`;
}

/** Check if a given day in the week is today */
export function isToday(weekStart: string, dayOfWeek: number): boolean {
  const d = getDateForDay(weekStart, dayOfWeek);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** 90 → "1h30", 60 → "1h", 45 → "45min" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** YYYY-MM-DD string → Date (local timezone, no UTC shift) */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date → YYYY-MM-DD */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Shift weekStart by N weeks (positive = forward) */
export function shiftWeek(weekStart: string, weeks: number): string {
  const d = parseDate(weekStart);
  d.setDate(d.getDate() + weeks * 7);
  return formatDate(d);
}

/** Mapa padronizado de cores por especialidade médica */
const SPECIALTY_COLOR_MAP: Record<string, string> = {
  cardiologia:            "#DC2626", // Vermelho — coração
  clinica_medica:         "#2563EB", // Azul — medicina interna
  cirurgia_geral:         "#0D9488", // Teal — bisturi/aço
  pediatria:              "#65A30D", // Verde-lima — crescimento
  ginecologia_obstetricia:"#EC4899", // Rosa — feminino
  medicina_preventiva:    "#059669", // Esmeralda — saúde pública
  saude_mental:           "#7C3AED", // Roxo — mente
  emergencia:             "#EA580C", // Laranja — urgência
  ortopedia:              "#64748B", // Cinza-aço — ossos
  endocrinologia:         "#D97706", // Âmbar — metabolismo
  gastroenterologia:      "#F97316", // Laranja-escuro — TGI
  nefrologia:             "#0EA5E9", // Azul-céu — rim/água
  pneumologia:            "#38BDF8", // Azul-claro — pulmão/ar
  neurologia:             "#4F46E5", // Índigo — cérebro
  infectologia:           "#84CC16", // Verde-limão — micro
  dermatologia:           "#F472B6", // Rosa-claro — pele
  oftalmologia:           "#06B6D4", // Ciano — olho
  otorrinolaringologia:   "#A78BFA", // Lilás
  urologia:               "#14B8A6", // Teal-claro
  farmacologia:           "#E11D48", // Rosa-vermelho — fármaco
};

const FALLBACK_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6",
  "#6366F1", "#A855F7", "#EC4899", "#0EA5E9", "#10B981",
];

export function getSpecialtyColor(slug: string): string {
  if (SPECIALTY_COLOR_MAP[slug]) return SPECIALTY_COLOR_MAP[slug];
  // Fallback para especialidades futuras
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}
