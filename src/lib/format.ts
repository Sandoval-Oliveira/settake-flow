import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatMoney(value: number | null | undefined) {
  return brl.format(Number(value ?? 0));
}

export function toDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date | null | undefined, pattern = "dd/MM/yyyy") {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: ptBR }) : "—";
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, "dd/MM/yyyy 'às' HH:mm");
}

export function formatTime(value: string | Date | null | undefined) {
  return formatDate(value, "HH:mm");
}

export function formatDayMonth(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? format(d, "dd/MM", { locale: ptBR }) : "—";
}

export function whatsappLink(numero: string | null | undefined) {
  const digits = (numero ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

export function maskWhatsapp(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function normalizeInstagram(value: string) {
  const v = value.trim();
  if (!v) return "";
  return v.startsWith("@") ? v : `@${v.replace(/^https?:\/\/(www\.)?instagram\.com\//, "")}`;
}

export function initials(nome: string | null | undefined) {
  const n = (nome ?? "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

export function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}
