// Máscaras de formatação usadas nas fichas (formulário) e no painel.

// (31)93998-3485 — aceita fixo (10 dígitos) e celular (11 dígitos)
export function mascaraTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  const p = d.length;
  if (p === 0) return "";
  if (p <= 2) return `(${d}`;
  if (p <= 6) return `(${d.slice(0, 2)})${d.slice(2)}`;
  if (p <= 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7)}`;
}

// 254.654.325-86
export function mascaraCpf(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  let out = d.slice(0, 3);
  if (d.length > 3) out += `.${d.slice(3, 6)}`;
  if (d.length > 6) out += `.${d.slice(6, 9)}`;
  if (d.length > 9) out += `-${d.slice(9, 11)}`;
  return out;
}

export function aplicarMascara(mascara: "telefone" | "cpf" | undefined, v: string): string {
  if (mascara === "telefone") return mascaraTelefone(v);
  if (mascara === "cpf") return mascaraCpf(v);
  return v;
}

// Data de nascimento: "1977-12-30" (do <input type="date">) -> "30.12.1977"
export function formatarDataBR(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v.trim());
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  return v;
}
