// Helpers de link (confirmação pública + WhatsApp), compartilhados entre o
// histórico de sessões e o alerta de pendências do painel.

export function linkConfirmacao(origin: string, token: string): string {
  return `${origin}/confirmar/${token}`;
}

// Número em formato internacional para o link do WhatsApp abrir direto na
// conversa da cliente (sem pedir pra escolher o contato). Números salvos
// são sempre nacionais (DDD + número, 10 ou 11 dígitos) — prefixamos o
// código do Brasil (55).
export function numeroWhatsapp(telefone: string | null | undefined): string {
  const d = String(telefone ?? "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

export function dataBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

export function linkWhatsapp(telefone: string | null | undefined, mensagem: string): string {
  return `https://wa.me/${numeroWhatsapp(telefone)}?text=${encodeURIComponent(mensagem)}`;
}
