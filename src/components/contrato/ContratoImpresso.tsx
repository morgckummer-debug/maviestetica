// Versão impressa do contrato — só o que vai para o papel. Renderizado tanto
// na pré-visualização (dentro de uma "folha" no painel) quanto na impressão
// de verdade (ver #contrato-imprimir no styles.css, que esconde todo o resto
// da página quando a Marina manda imprimir). As linhas de assinatura ficam
// em branco de propósito — a cliente assina a caneta, no papel.

import {
  CONTRATADA_TEXTO,
  CONTRATADA_NOME,
  CONTRATADA_RG,
  CLAUSULA_1_INTRO,
  CLAUSULA_1_OBJETO_INTRO,
  CLAUSULA_1_ITENS,
  CLAUSULA_2_INTRO,
  CLAUSULA_2_ITENS,
  CLAUSULA_3_ITENS,
  CLAUSULA_4_ITENS,
  FORO_TEXTO,
  MESES_PT,
  type DadosContrato,
} from "@/data/contrato";

function CampoPreenchido({ label, valor }: { label: string; valor: string }) {
  return (
    <p className="text-[11pt] leading-relaxed mb-1">
      <span className="font-semibold">{label}: </span>
      <span className="border-b border-black/70">{valor || " ".repeat(40)}</span>
    </p>
  );
}

function Pagina({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="contrato-pagina bg-white text-black px-10 py-10 mb-6 shadow-md print:shadow-none print:mb-0"
      style={{ fontFamily: "Arial, sans-serif", width: "210mm", minHeight: "297mm" }}
    >
      {children}
    </div>
  );
}

export function ContratoImpresso({ dados }: { dados: DadosContrato }) {
  const itensValidos = dados.itens.filter((i) => i.descricao.trim() && i.quantidade.trim());
  const mesPorExtenso = MESES_PT[Number(dados.dataMes) - 1] ?? dados.dataMes;

  return (
    <div id="contrato-imprimir">
      <Pagina>
        <h1 className="text-center font-bold text-[13pt] mb-6">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS
        </h1>

        <p className="text-[11pt] leading-relaxed mb-6">{CONTRATADA_TEXTO}</p>

        <div className="mb-6">
          <CampoPreenchido label="CONTRATANTE" valor={dados.nome} />
          <CampoPreenchido label="Profissão" valor={dados.profissao} />
          <div className="flex gap-8">
            <span className="flex-1">
              <CampoPreenchido label="Estado Civil" valor={dados.estadoCivil} />
            </span>
            <span className="flex-1">
              <CampoPreenchido label="Data de Nascimento" valor={dados.nascimento} />
            </span>
          </div>
          <div className="flex gap-8">
            <span className="flex-1">
              <CampoPreenchido label="CPF" valor={dados.cpf} />
            </span>
            <span className="flex-1">
              <CampoPreenchido label="Telefone" valor={dados.telefone} />
            </span>
          </div>
          <CampoPreenchido label="Endereço" valor={dados.endereco} />
        </div>

        <p className="text-[11pt] leading-relaxed mb-6">{CLAUSULA_1_INTRO}</p>

        <h2 className="font-bold text-[11.5pt] mb-3">CLÁUSULA 1 - DO OBJETO</h2>
        <p className="text-[11pt] leading-relaxed mb-2">{CLAUSULA_1_OBJETO_INTRO}</p>
        <div className="mb-4 min-h-[90px] border-y border-black/40 py-2">
          {itensValidos.length === 0 ? (
            <p className="text-[11pt]">&nbsp;</p>
          ) : (
            <ul className="text-[11pt] leading-relaxed list-none">
              {itensValidos.map((item) => (
                <li key={item.chave}>
                  {item.quantidade} sessão(ões) de {item.descricao}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          {CLAUSULA_1_ITENS.map((texto, i) => (
            <p key={i} className="text-[10.5pt] leading-relaxed text-justify">
              {String.fromCharCode(97 + i)}) {texto}
            </p>
          ))}
        </div>
      </Pagina>

      <Pagina>
        <h2 className="font-bold text-[11.5pt] mb-3">CLÁUSULA 2 - DO PAGAMENTO</h2>
        <p className="text-[11pt] leading-relaxed mb-2">{CLAUSULA_2_INTRO}</p>
        <div className="mb-4 min-h-[50px] border-y border-black/40 py-2">
          <p className="text-[11pt] leading-relaxed whitespace-pre-wrap">
            {dados.formaPagamento || " "}
          </p>
        </div>
        <div className="space-y-2 mb-6">
          {CLAUSULA_2_ITENS.map((texto, i) => (
            <p key={i} className="text-[10.5pt] leading-relaxed text-justify">
              {String.fromCharCode(97 + i)}) {texto}
            </p>
          ))}
        </div>

        <h2 className="font-bold text-[11.5pt] mb-3">CLÁUSULA 3 - DAS CONDIÇÕES GERAIS</h2>
        <div className="space-y-2 mb-4">
          {CLAUSULA_3_ITENS.map((texto, i) => (
            <p key={i} className="text-[10.5pt] leading-relaxed text-justify">
              {String.fromCharCode(97 + i)}) {texto}
              {i === CLAUSULA_3_ITENS.length - 1 && (
                <span className="ml-2 whitespace-nowrap">( ) SIM &nbsp;&nbsp; ( ) NÃO</span>
              )}
            </p>
          ))}
        </div>
      </Pagina>

      <Pagina>
        <h2 className="font-bold text-[11.5pt] mb-3">CLÁUSULA 4 - DA RESCISÃO</h2>
        <div className="space-y-2 mb-6">
          {CLAUSULA_4_ITENS.map((texto, i) => (
            <p key={i} className="text-[10.5pt] leading-relaxed text-justify">
              {String.fromCharCode(97 + i)}) {texto}
            </p>
          ))}
        </div>

        <p className="text-[10.5pt] leading-relaxed text-justify mb-10">{FORO_TEXTO}</p>

        <p className="text-[11pt] text-center mb-16">
          Sete Lagoas, {dados.dataDia || "____"} de{" "}
          {dados.dataMes ? mesPorExtenso : "________________"} de {dados.dataAno || "________"}
        </p>

        <div className="space-y-16 text-center text-[11pt]">
          <div className="mx-auto w-[70%] border-t border-black pt-1">
            {dados.nome}
            <br />
            CPF: {dados.cpf}
          </div>
          <div className="mx-auto w-[70%] border-t border-black pt-1">
            {CONTRATADA_NOME}
            <br />
            RG: {CONTRATADA_RG}
          </div>
          <div className="mx-auto w-[70%] border-t border-black pt-1">CPF:</div>
        </div>
      </Pagina>
    </div>
  );
}
