// Versão impressa do contrato — só o que vai para o papel. Renderizado tanto
// na pré-visualização (dentro da "folha" no painel) quanto na impressão de
// verdade (ver #contrato-imprimir no styles.css, que esconde todo o resto da
// página quando a Marina manda imprimir). Precisa caber numa única folha A4 —
// por isso o texto das cláusulas (letra miúda, igual a qualquer contrato de
// adesão) roda em duas colunas, e só o que interessa mais no dia a dia
// (itens do pacote, forma de pagamento) fica em destaque, fora das colunas.
// As linhas de assinatura ficam em branco de propósito — a cliente assina a
// caneta, no papel.

import {
  CONTRATADA_TEXTO,
  CONTRATADA_NOME,
  CONTRATADA_CNPJ,
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
    <p className="text-[7.5pt] leading-tight">
      <span className="font-semibold">{label}: </span>
      <span className="border-b border-black/70">{valor || " ".repeat(28)}</span>
    </p>
  );
}

// Um item de cláusula (a, b, c...) da letra miúda — corre dentro do bloco de
// duas colunas, então não pode quebrar no meio entre uma coluna e outra.
function ItemMiudo({ letra, texto }: { letra: string; texto: string }) {
  return (
    <p className="text-[6.6pt] leading-[1.25] text-justify mb-1.5 [break-inside:avoid]">
      {letra}) {texto}
    </p>
  );
}

export function ContratoImpresso({ dados }: { dados: DadosContrato }) {
  const itensValidos = dados.itens.filter((i) => i.descricao.trim() && i.quantidade.trim());
  const mesPorExtenso = MESES_PT[Number(dados.dataMes) - 1] ?? dados.dataMes;
  let contador = 0; // letra sequencial (a, b, c...) através das 4 cláusulas

  return (
    <div id="contrato-imprimir">
      <div
        className="contrato-pagina bg-white text-black shadow-md print:shadow-none"
        style={{
          fontFamily: "Arial, sans-serif",
          width: "210mm",
          height: "297mm",
          padding: "9mm 11mm",
        }}
      >
        <h1 className="text-center font-bold text-[11.5pt] mb-1.5">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS
        </h1>

        <p className="text-[7.5pt] leading-tight mb-2">{CONTRATADA_TEXTO}</p>

        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 mb-2">
          <div className="col-span-3">
            <CampoPreenchido label="CONTRATANTE" valor={dados.nome} />
          </div>
          <CampoPreenchido label="Profissão" valor={dados.profissao} />
          <CampoPreenchido label="Estado civil" valor={dados.estadoCivil} />
          <CampoPreenchido label="Nascimento" valor={dados.nascimento} />
          <CampoPreenchido label="CPF" valor={dados.cpf} />
          <div className="col-span-2">
            <CampoPreenchido label="Telefone" valor={dados.telefone} />
          </div>
          <div className="col-span-3">
            <CampoPreenchido label="Endereço" valor={dados.endereco} />
          </div>
        </div>

        {/* Objeto do contrato e forma de pagamento — o que muda a cada venda,
            em destaque fora da letra miúda. */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="rounded border border-black/50 p-1.5">
            <p className="text-[7pt] font-bold mb-0.5">CLÁUSULA 1 — OBJETO (sessões contratadas)</p>
            {itensValidos.length === 0 ? (
              <p className="text-[7.5pt]">&nbsp;</p>
            ) : (
              <ul className="text-[7.5pt] leading-tight list-none font-bold">
                {itensValidos.map((item) => (
                  <li key={item.chave}>
                    {item.quantidade} sessão(ões) de {item.descricao}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded border border-black/50 p-1.5">
            <p className="text-[7pt] font-bold mb-0.5">CLÁUSULA 2 — FORMA DE PAGAMENTO</p>
            <p className="text-[7.5pt] leading-tight whitespace-pre-wrap font-bold">
              {dados.formaPagamento || " "}
            </p>
          </div>
        </div>

        {/* Letra miúda — todas as condições gerais, em duas colunas pra caber
            na folha. Mesmo texto do contrato de papel em uso. */}
        <div className="text-[6.6pt] leading-[1.25] text-justify [column-count:2] [column-gap:6mm]">
          <p className="mb-1.5 [break-inside:avoid]">{CLAUSULA_1_INTRO}</p>
          <p className="mb-1.5 font-semibold [break-inside:avoid]">{CLAUSULA_1_OBJETO_INTRO}</p>
          {CLAUSULA_1_ITENS.map((texto) => (
            <ItemMiudo key={texto} letra={String.fromCharCode(97 + contador++)} texto={texto} />
          ))}

          <p className="mb-1.5 font-semibold [break-inside:avoid]">{CLAUSULA_2_INTRO}</p>
          {CLAUSULA_2_ITENS.map((texto) => (
            <ItemMiudo key={texto} letra={String.fromCharCode(97 + contador++)} texto={texto} />
          ))}

          <p className="mb-1.5 font-bold [break-inside:avoid]">CLÁUSULA 3 - DAS CONDIÇÕES GERAIS</p>
          {CLAUSULA_3_ITENS.map((texto, i) => {
            const ultima = i === CLAUSULA_3_ITENS.length - 1;
            const letra = String.fromCharCode(97 + contador++);
            return (
              <p
                key={texto}
                className="text-[6.6pt] leading-[1.25] text-justify mb-1.5 [break-inside:avoid]"
              >
                {letra}) {texto}
                {ultima && (
                  <span className="ml-1 whitespace-nowrap font-semibold">
                    {dados.autorizaFoto ? "(X)" : "( )"} SIM {dados.autorizaFoto ? "( )" : "(X)"}{" "}
                    NÃO
                  </span>
                )}
              </p>
            );
          })}

          <p className="mb-1.5 font-bold [break-inside:avoid]">CLÁUSULA 4 - DA RESCISÃO</p>
          {CLAUSULA_4_ITENS.map((texto) => (
            <ItemMiudo key={texto} letra={String.fromCharCode(97 + contador++)} texto={texto} />
          ))}

          <p className="mb-0 [break-inside:avoid]">{FORO_TEXTO}</p>
        </div>

        <p className="text-[7.5pt] text-center mt-2 mb-1">
          Sete Lagoas, {dados.dataDia || "____"} de{" "}
          {dados.dataMes ? mesPorExtenso : "________________"} de {dados.dataAno || "________"}
        </p>

        <div className="grid grid-cols-2 gap-8 text-center text-[7.5pt] mt-3">
          <div className="border-t border-black pt-1">
            {dados.nome}
            <br />
            CPF: {dados.cpf}
          </div>
          <div className="border-t border-black pt-1">
            {CONTRATADA_NOME}
            <br />
            CNPJ: {CONTRATADA_CNPJ}
          </div>
        </div>
      </div>
    </div>
  );
}
