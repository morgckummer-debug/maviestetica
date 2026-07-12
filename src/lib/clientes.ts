// Agrupa as fichas por PESSOA. Uma mesma cliente pode ter mais de uma ficha
// (ex.: depilação a laser + limpeza de pele). NUNCA agrupamos só por
// telefone ou só por CPF: telefone é comum ser compartilhado (mãe e filha
// usando o mesmo WhatsApp da família) e CPF é campo de texto livre sem
// validação, fácil de digitar errado ou repetir por engano. Por isso só
// consideramos a mesma pessoa quando o NOME bate (normalizado) E pelo
// menos um dos dois (telefone OU CPF) também bate — assim nunca escondemos
// uma cliente atrás do cartão de outra pessoa.

import type { Ficha } from "./painel";
import type { Tipo } from "@/data/anamnese";

// Só os dígitos (para comparar telefone/CPF sem depender da máscara).
export function digitos(v: string | null | undefined): string {
  return String(v ?? "").replace(/\D/g, "");
}

// Nome normalizado para comparar sem depender de acentos/maiúsculas/espaços.
function normalizarNome(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export type Cliente = {
  id: string; // ficha representante (a mais recente) — usada na URL
  nome: string;
  telefone: string | null;
  cpf: string; // dígitos, se houver
  fichas: Ficha[]; // mais recentes primeiro
  tipos: Tipo[]; // tipos distintos, na ordem em que aparecem
  alertas: number; // total de alertas somando as fichas
  autorizaFoto: boolean; // alguma ficha autoriza imagem
  algumMasculino: boolean;
};

function cpfDaFicha(f: Ficha): string {
  return digitos(f.respostas?.cpf as string | undefined);
}

function paraCliente(fichas: Ficha[]): Cliente {
  // fichas já vêm mais recentes primeiro (listarFichas ordena por created_at).
  const rep = fichas[0];
  const tipos: Tipo[] = [];
  for (const f of fichas) if (!tipos.includes(f.tipo)) tipos.push(f.tipo);
  return {
    id: rep.id,
    nome: rep.nome,
    telefone: fichas.find((f) => f.telefone)?.telefone ?? null,
    cpf: fichas.map(cpfDaFicha).find((c) => c) ?? "",
    fichas,
    tipos,
    alertas: fichas.reduce((n, f) => n + (f.alertas?.length ?? 0), 0),
    autorizaFoto: fichas.some((f) => f.autoriza_foto),
    algumMasculino: fichas.some((f) => f.respostas?.sexo === "Masculino"),
  };
}

// Une (union-find) fichas do MESMO NOME que também compartilhem telefone
// OU CPF. Nome sozinho não basta (duas clientes podem ter nome parecido),
// e telefone/CPF sozinhos também não (ver motivo acima) — precisa das duas
// coisas juntas.
export function agruparClientes(fichas: Ficha[]): Cliente[] {
  const n = fichas.length;
  const pai = Array.from({ length: n }, (_, i) => i);
  const achar = (i: number): number => {
    while (pai[i] !== i) {
      pai[i] = pai[pai[i]];
      i = pai[i];
    }
    return i;
  };
  const unir = (a: number, b: number) => {
    pai[achar(a)] = achar(b);
  };

  // Chave = nome normalizado + telefone (ou + CPF). Só une fichas cujo
  // nome E identificador coincidem exatamente.
  const porNomeTelefone = new Map<string, number>();
  const porNomeCpf = new Map<string, number>();
  fichas.forEach((f, i) => {
    const nome = normalizarNome(f.nome);
    if (!nome) return;
    const tel = digitos(f.telefone);
    const cpf = cpfDaFicha(f);
    if (tel) {
      const chave = `${nome}::${tel}`;
      const j = porNomeTelefone.get(chave);
      if (j !== undefined) unir(i, j);
      else porNomeTelefone.set(chave, i);
    }
    if (cpf) {
      const chave = `${nome}::${cpf}`;
      const j = porNomeCpf.get(chave);
      if (j !== undefined) unir(i, j);
      else porNomeCpf.set(chave, i);
    }
  });

  // Mantém a ordem de chegada (fichas já ordenadas por mais recente).
  const grupos = new Map<number, Ficha[]>();
  fichas.forEach((f, i) => {
    const r = achar(i);
    const arr = grupos.get(r);
    if (arr) arr.push(f);
    else grupos.set(r, [f]);
  });

  return [...grupos.values()].map(paraCliente);
}

// Acha o cliente (grupo) que contém uma determinada ficha.
export function clientePorFichaId(fichas: Ficha[], fichaId: string): Cliente | null {
  const clientes = agruparClientes(fichas);
  return clientes.find((c) => c.fichas.some((f) => f.id === fichaId)) ?? null;
}
