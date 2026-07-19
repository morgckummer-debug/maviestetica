import { useEffect, useState } from "react";
import { Send, Copy, Check, MessageCircle, X } from "lucide-react";
import { digitos } from "@/lib/clientes";
import { aplicarMascara } from "@/lib/mascaras";
import { TIPOS, getFicha, nomeCurto, type Tipo } from "@/data/anamnese";
import { PainelModal } from "@/components/PainelModal";

// Painel para gerar e compartilhar o link de uma ficha (anamnese) — link
// genérico (qualquer cliente abre e preenche do zero) ou convite com
// nome/whatsapp pré-preenchidos. Reaproveitado tanto na lista de clientes
// (sem cliente definida ainda) quanto na página de uma cliente já
// cadastrada, prevendo o caso dela se interessar por outro procedimento.
export function EnviarFicha({
  nomeInicial = "",
  celularInicial = "",
  tipoInicial,
  convitePadrao = false,
  onFechar,
}: {
  nomeInicial?: string;
  celularInicial?: string | null;
  tipoInicial?: Tipo;
  convitePadrao?: boolean;
  onFechar?: () => void;
}) {
  const [origin, setOrigin] = useState("");
  const [tipo, setTipo] = useState<Tipo>(tipoInicial ?? "corporal");
  const [copiado, setCopiado] = useState(false);
  const [convite, setConvite] = useState(convitePadrao);
  const [nome, setNome] = useState(nomeInicial);
  const [celular, setCelular] = useState(
    celularInicial ? aplicarMascara("telefone", celularInicial) : "",
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const nomeLimpo = nome.trim();
  const celularDigitos = digitos(celular);
  const celularCompleto = celularDigitos.length >= 10;

  const link =
    convite && (nomeLimpo || celularDigitos)
      ? `${origin}/avaliacao/${tipo}?${[
          nomeLimpo && `nome=${encodeURIComponent(nomeLimpo)}`,
          celularDigitos && `whatsapp=${celularDigitos}`,
        ]
          .filter(Boolean)
          .join("&")}`
      : `${origin}/avaliacao/${tipo}`;

  const primeiroNome = nomeLimpo.split(" ")[0];
  const nomeFicha = (getFicha(tipo)?.nome ?? tipo).toLowerCase();
  const mensagem = `Oi${primeiroNome ? ` ${primeiroNome}` : ""}! 💜 Antes do seu atendimento na MAVI, preencha sua ficha de ${nomeFicha} — leva só alguns minutinhos: ${link}`;
  const whatsapp =
    convite && celularCompleto
      ? `https://wa.me/55${celularDigitos}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <PainelModal onFechar={onFechar} maxWidth="max-w-lg">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-painel-lilac-soft" />
          <h3 className="font-medium text-white">
            {convite ? "Enviar convite" : "Enviar ficha para a cliente"}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setConvite((v) => !v)}
            className="text-xs font-medium text-painel-lilac-soft underline underline-offset-2"
          >
            {convite ? "Usar link genérico" : "Enviar convite"}
          </button>
          {onFechar && (
            <button
              type="button"
              onClick={onFechar}
              title="Fechar"
              className="text-white/50 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              tipo === t
                ? "bg-painel-primary border-painel-primary text-white font-medium"
                : "bg-white/5 border-white/20 text-white/70 hover:border-white/40",
            ].join(" ")}
          >
            {getFicha(t)?.emoji} {nomeCurto(t)}
            {getFicha(t)?.emConstrucao ? " (em breve)" : ""}
          </button>
        ))}
      </div>

      {convite && (
        <div className="grid sm:grid-cols-2 gap-2 mb-4">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Primeiro nome"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-painel-lilac-soft/50"
          />
          <input
            value={celular}
            onChange={(e) => setCelular(aplicarMascara("telefone", e.target.value))}
            placeholder="(31)93998-3485"
            inputMode="tel"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-painel-lilac-soft/50"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={link}
          className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white/70"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:border-white/40 transition-colors"
          >
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
          <a
            href={whatsapp}
            target="whatsapp"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-painel-primary text-white px-4 py-2.5 text-sm font-medium hover:bg-painel-primary/90 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </PainelModal>
  );
}
