// Agrupa as fichas por PESSOA. Uma mesma cliente pode ter mais de uma ficha
// (ex.: depilação a laser + limpeza de pele). Identificamos que é a mesma
// pessoa pelo WhatsApp (obrigatório em toda ficha) e reforçamos pelo CPF
// quando ela preencheu. Assim a Marina não fica trocando de ficha.

import type { Ficha } from "./painel";
import type { Tipo } from "@/data/anamnese";

// Só os dígitos (para comparar telefone/CPF sem depender da máscara).
export function digitos(v: string | null | undefined): string {
  return String(v ?? "").replace(/\D/g, "");
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

// Une (union-find) qualquer par de fichas que compartilhe telefone OU CPF.
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

  const porTelefone = new Map<string, number>();
  const porCpf = new Map<string, number>();
  fichas.forEach((f, i) => {
    const tel = digitos(f.telefone);
    const cpf = cpfDaFicha(f);
    if (tel) {
      const j = porTelefone.get(tel);
      if (j !== undefined) unir(i, j);
      else porTelefone.set(tel, i);
    }
    if (cpf) {
      const j = porCpf.get(cpf);
      if (j !== undefined) unir(i, j);
      else porCpf.set(cpf, i);
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
