import { Fragment, useEffect, useState } from "react";
import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Camera,
  CameraOff,
  Check,
  Archive,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { getFicha, nomeTipo, type Campo } from "@/data/anamnese";
import { obterFicha, atualizarFicha, excluirFicha, type Ficha } from "@/lib/painel";
import { mascaraTelefone, mascaraCpf, formatarDataBR, aplicarMascara } from "@/lib/mascaras";
import { RamosWatermark } from "@/components/RamosWatermark";

// Etapa de dados pessoais (nome, telefone, endereço...) — é a única que a
// Marina pode editar depois, para atualizar celular/endereço da cliente.
const TITULO_DADOS_PESSOAIS = "Seus dados";

export const Route = createFileRoute("/painel/$id")({
  component: DetalheFicha,
});

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function valorResposta(v: string | boolean | null | undefined): string | null {
  if (v === true) return "Sim";
  if (v === false) return "Não";
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

type NivelImc = "normal" | "sobrepeso" | "obesidade";

// Classificação do IMC (OMS).
function classificarImc(imc: number): string {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade I";
  if (imc < 40) return "Obesidade II";
  return "Obesidade III";
}

function nivelImc(imc: number): NivelImc {
  if (imc < 25) return "normal";
  if (imc < 30) return "sobrepeso";
  return "obesidade";
}

// IMC a partir da altura e peso digitados. Aceita altura em metros (1.70) ou
// centímetros (170), e vírgula ou ponto como decimal.
function calcularImc(
  alturaRaw?: string,
  pesoRaw?: string,
): { valor: number; classe: string; nivel: NivelImc } | null {
  const altura = parseFloat(String(alturaRaw ?? "").replace(",", "."));
  const peso = parseFloat(String(pesoRaw ?? "").replace(",", "."));
  if (!altura || !peso || altura <= 0 || peso <= 0) return null;
  const metros = altura > 3 ? altura / 100 : altura;
  const valor = peso / (metros * metros);
  if (!isFinite(valor) || valor <= 0 || valor > 200) return null;
  return { valor, classe: classificarImc(valor), nivel: nivelImc(valor) };
}

// Formata o valor exibido conforme o campo (celular, CPF, data de nascimento).
function formatarValorCampo(campo: Campo, val: string): string {
  if (campo.tipo !== "texto") return val;
  if (campo.mascara === "telefone") return mascaraTelefone(val);
  if (campo.mascara === "cpf") return mascaraCpf(val);
  if (campo.inputMode === "date") return formatarDataBR(val);
  return val;
}

function DetalheFicha() {
  const { id } = useParams({ from: "/painel/$id" });
  const navigate = useNavigate();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  const [medidas, setMedidas] = useState<Record<string, string>>({});
  const [relatorio, setRelatorio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [editandoDados, setEditandoDados] = useState(false);
  const [dadosForm, setDadosForm] = useState<Record<string, string>>({});
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [erroDados, setErroDados] = useState<string | null>(null);

  useEffect(() => {
    obterFicha(id)
      .then((f) => {
        if (!f) {
          setNaoEncontrada(true);
          return;
        }
        setFicha(f);
        setMedidas(f.medidas ?? {});
        setRelatorio(f.relatorio ?? "");
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, [id]);

  const salvar = async () => {
    setSalvando(true);
    setSalvo(false);
    setErro(null);
    try {
      await atualizarFicha(id, { medidas, relatorio });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const arquivar = async () => {
    if (!ficha) return;
    const novo = !ficha.arquivada;
    try {
      await atualizarFicha(id, { arquivada: novo });
      setFicha({ ...ficha, arquivada: novo });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao arquivar.");
    }
  };

  // A cliente pode mudar de ideia sobre autorizar o uso de imagem depois de
  // enviar a ficha — a Marina atualiza aqui, sem precisar reenviar tudo.
  const alternarAutorizaFoto = async () => {
    if (!ficha) return;
    const novo = !ficha.autoriza_foto;
    try {
      await atualizarFicha(id, { autoriza_foto: novo });
      setFicha({ ...ficha, autoriza_foto: novo });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar a autorização de imagem.");
    }
  };

  const camposDadosPessoais = (): Campo[] => {
    if (!ficha) return [];
    const etapa = getFicha(ficha.tipo)?.etapas.find((e) => e.titulo === TITULO_DADOS_PESSOAIS);
    return etapa?.campos ?? [];
  };

  const iniciarEdicaoDados = () => {
    if (!ficha) return;
    const inicial: Record<string, string> = {};
    for (const c of camposDadosPessoais()) {
      inicial[c.id] = String(ficha.respostas?.[c.id] ?? "");
    }
    setDadosForm(inicial);
    setErroDados(null);
    setEditandoDados(true);
  };

  const salvarDados = async () => {
    if (!ficha) return;
    setSalvandoDados(true);
    setErroDados(null);
    try {
      const respostas = { ...ficha.respostas };
      for (const c of camposDadosPessoais()) {
        respostas[c.id] = dadosForm[c.id]?.trim() || null;
      }
      // As colunas "telefone" e "nome" (usadas na lista, no topo da ficha e
      // para agrupar as fichas da mesma cliente) espelham os campos
      // "whatsapp" e "nome" das respostas — não bastava atualizar só o
      // JSON de respostas.
      const telefone = respostas.whatsapp ? String(respostas.whatsapp) : null;
      const nome = respostas.nome ? String(respostas.nome).trim() : ficha.nome;
      await atualizarFicha(id, { respostas, telefone, nome });
      setFicha({ ...ficha, respostas, telefone, nome });
      setEditandoDados(false);
    } catch (e) {
      setErroDados(e instanceof Error ? e.message : "Erro ao salvar os dados.");
    } finally {
      setSalvandoDados(false);
    }
  };

  const excluir = async () => {
    setExcluindo(true);
    setErro(null);
    try {
      await excluirFicha(id);
      navigate({ to: "/painel" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir.");
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  };

  if (naoEncontrada) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Ficha não encontrada.</p>
        <Link to="/painel" className="text-primary underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="flex justify-center py-16">
        {erro ? (
          <p className="text-destructive text-sm">{erro}</p>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  const r = ficha.respostas ?? {};
  const def = getFicha(ficha.tipo);
  const etapas = def?.etapas ?? [];
  const camposMedidas = def?.camposMedidas ?? [];
  const avaliacao = def?.avaliacao ?? [];
  const imc = calcularImc(medidas.altura, medidas.peso);
  // Paciente masculino: bordas em azul para a Marina identificar de cara.
  const masculino = r.sexo === "Masculino";
  const bordaCard = masculino ? "border-sky-400/50" : "border-border";

  const setMedida = (id: string, v: string) => setMedidas((prev) => ({ ...prev, [id]: v }));
  const toggleAchado = (id: string, op: string) => {
    const atual = String(medidas[id] ?? "")
      .split(", ")
      .filter(Boolean);
    const novo = atual.includes(op) ? atual.filter((x) => x !== op) : [...atual, op];
    setMedida(id, novo.join(", "));
  };

  return (
    <div>
      <RamosWatermark className="fixed -right-14 top-24 hidden h-[75vh] max-h-[640px] w-auto opacity-[0.05] sm:block" />
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/painel"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas as clientes
        </Link>
        {/* A página da cliente aceita o id de qualquer ficha do grupo. */}
        <Link
          to="/painel/cliente/$id"
          params={{ id }}
          className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
        >
          Página da cliente · sessões
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <span className="inline-block text-xs rounded-full bg-lavender-soft px-2.5 py-0.5 text-primary mb-2">
            {def?.emoji ?? ""} {nomeTipo(ficha.tipo)}
          </span>
          <h2 className="font-display text-3xl text-primary">{ficha.nome}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {ficha.telefone ? mascaraTelefone(ficha.telefone) : "sem telefone"} · enviada em{" "}
            {formatarData(ficha.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={arquivar}
            className={`inline-flex items-center gap-1.5 rounded-full border ${bordaCard} px-4 py-2 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors`}
          >
            <Archive className="h-4 w-4" />
            {ficha.arquivada ? "Desarquivar" : "Arquivar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      {confirmandoExclusao && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3.5 mb-6">
          <p className="text-sm text-destructive flex-1">
            Excluir a ficha de <strong>{ficha.nome}</strong>? Essa ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(false)}
              disabled={excluindo}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={excluir}
              disabled={excluindo}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-40"
            >
              {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Excluir definitivamente
            </button>
          </div>
        </div>
      )}

      {ficha.alertas.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-rose/40 bg-rose/10 px-4 py-3.5 text-sm text-rose mb-6">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <ul className="space-y-1">
            {ficha.alertas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
            ficha.termo_aceito ? "bg-lavender-soft text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          Termo {ficha.termo_aceito ? "aceito" : "não aceito"}
        </span>
        <button
          type="button"
          onClick={alternarAutorizaFoto}
          title="A cliente mudou de ideia? Clique para atualizar."
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
            ficha.autoriza_foto
              ? "bg-lavender-soft text-primary hover:bg-lavender-soft/70"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
          }`}
        >
          {ficha.autoriza_foto ? (
            <Camera className="h-3.5 w-3.5" />
          ) : (
            <CameraOff className="h-3.5 w-3.5" />
          )}
          {ficha.autoriza_foto ? "Autorizou imagem" : "Não autorizou imagem"}
        </button>
      </div>

      {/* Respostas da anamnese */}
      <div className="space-y-6 mb-10">
        {etapas.map((etapa) => {
          const linhas = etapa.campos
            .map((c) => {
              const bruto = valorResposta(r[c.id]);
              if (bruto === null) return null;
              const val = formatarValorCampo(c, bruto);
              const detalhe =
                c.tipo === "simnao" || c.tipo === "selecao"
                  ? valorResposta(r[`${c.id}__detalhe`])
                  : null;
              return { id: c.id, label: c.label, val, detalhe };
            })
            .filter(
              (x): x is { id: string; label: string; val: string; detalhe: string | null } =>
                x !== null,
            );

          if (linhas.length === 0) return null;

          const ehDadosPessoais = etapa.titulo === TITULO_DADOS_PESSOAIS;
          const editandoEsta = ehDadosPessoais && editandoDados;
          const podeSalvarDados = etapa.campos.every(
            (c) => !("obrigatorio" in c && c.obrigatorio) || String(dadosForm[c.id] ?? "").trim(),
          );

          return (
            <div key={etapa.titulo} className={`rounded-2xl border ${bordaCard} bg-card p-5`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-medium text-primary">{etapa.titulo}</h3>
                {ehDadosPessoais && !editandoDados && (
                  <button
                    type="button"
                    onClick={iniciarEdicaoDados}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar dados
                  </button>
                )}
              </div>

              {editandoEsta ? (
                <div>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    {etapa.campos.map((c) => (
                      <div key={c.id}>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          {c.label}
                        </label>
                        {c.tipo === "selecao" ? (
                          <div className="flex flex-wrap gap-2">
                            {c.opcoes.map((op) => (
                              <button
                                key={op}
                                type="button"
                                onClick={() => setDadosForm((prev) => ({ ...prev, [c.id]: op }))}
                                className={[
                                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                                  dadosForm[c.id] === op
                                    ? "bg-lavender-soft border-lavender text-primary font-medium"
                                    : "bg-card border-border text-foreground/70 hover:border-primary/40",
                                ].join(" ")}
                              >
                                {op}
                              </button>
                            ))}
                          </div>
                        ) : c.tipo === "texto" ? (
                          <input
                            type={c.inputMode === "date" ? "date" : "text"}
                            inputMode={
                              c.inputMode === "tel" || c.inputMode === "email" || c.inputMode === "numeric"
                                ? c.inputMode
                                : undefined
                            }
                            value={dadosForm[c.id] ?? ""}
                            onChange={(e) =>
                              setDadosForm((prev) => ({
                                ...prev,
                                [c.id]: aplicarMascara(c.mascara, e.target.value),
                              }))
                            }
                            placeholder={c.placeholder}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {erroDados && <p className="text-sm text-destructive mb-3">{erroDados}</p>}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={salvarDados}
                      disabled={salvandoDados || !podeSalvarDados}
                      className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
                    >
                      {salvandoDados ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoDados(false)}
                      disabled={salvandoDados}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors disabled:opacity-40"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="grid md:grid-cols-2 gap-x-8">
                  {linhas.map((l) => (
                    <div
                      key={l.id}
                      className="flex justify-between gap-4 py-1.5 text-sm border-b border-border/50"
                    >
                      <dt className="text-muted-foreground">{l.label}</dt>
                      <dd className="text-right text-foreground font-medium shrink-0">
                        {l.val}
                        {l.detalhe && (
                          <span className="block text-muted-foreground font-normal">{l.detalhe}</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          );
        })}
      </div>

      {/* Avaliação clínica (preenchida pela Marina) */}
      {avaliacao.map((grupo) => (
        <div
          key={grupo.titulo}
          className={`rounded-2xl border ${bordaCard} bg-card p-5 sm:p-6 mb-6`}
        >
          <h3 className="font-display text-2xl text-primary mb-1">{grupo.titulo}</h3>
          <p className="text-sm text-muted-foreground mb-5">Preenchido no atendimento.</p>
          <div className="space-y-5">
            {grupo.campos.map((c) => {
              const selecionados =
                c.tipo === "multi"
                  ? String(medidas[c.id] ?? "")
                      .split(", ")
                      .filter(Boolean)
                  : [];
              return (
                <div key={c.id}>
                  <label className="block text-sm font-medium mb-2">{c.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {c.opcoes.map((op) => {
                      const sel = c.tipo === "multi" ? selecionados.includes(op) : medidas[c.id] === op;
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() =>
                            c.tipo === "multi"
                              ? toggleAchado(c.id, op)
                              : setMedida(c.id, medidas[c.id] === op ? "" : op)
                          }
                          className={[
                            "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                            sel
                              ? "bg-lavender-soft border-lavender text-primary font-medium"
                              : "bg-card border-border text-foreground/70 hover:border-primary/40",
                          ].join(" ")}
                        >
                          {op}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Medidas + relatório (preenchidos pela Marina) */}
      <div className={`rounded-2xl border ${bordaCard} bg-card p-5 sm:p-6`}>
        <h3 className="font-display text-2xl text-primary mb-1">Medidas e avaliação</h3>
        <p className="text-sm text-muted-foreground mb-5">Preenchido no atendimento.</p>

        {camposMedidas.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {camposMedidas.map((m) => {
              const campoInput = (
                <div key={m.id}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {m.label}
                  </label>
                  <input
                    value={medidas[m.id] ?? ""}
                    onChange={(e) => setMedidas((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              );
              if (m.id !== "peso") return campoInput;
              // IMC calculado automaticamente, ao lado do peso (só no painel).
              return (
                <Fragment key={m.id}>
                  {campoInput}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      IMC
                    </label>
                    <div
                      className={[
                        "w-full rounded-lg border px-3 py-2 text-sm",
                        imc?.nivel === "obesidade"
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : imc?.nivel === "sobrepeso"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-500"
                            : "border-border bg-secondary/40",
                      ].join(" ")}
                    >
                      {imc ? (
                        <span className="font-medium">
                          {imc.valor.toFixed(1)}
                          <span className="font-normal"> · {imc.classe}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">altura e peso</span>
                      )}
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">Minha avaliação</label>
          <textarea
            value={relatorio}
            onChange={(e) => setRelatorio(e.target.value)}
            rows={4}
            placeholder="Procedimento realizado, observações, evolução..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {erro && <p className="text-sm text-destructive mb-3">{erro}</p>}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </button>
          {salvo && (
            <span className="inline-flex items-center gap-1.5 text-sm text-primary">
              <Check className="h-4 w-4" />
              Salvo!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
