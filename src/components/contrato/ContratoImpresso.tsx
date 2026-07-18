// Versão impressa do contrato — só o que vai para o papel. Renderizado tanto
// na pré-visualização (dentro da "folha" no painel) quanto na impressão de
// verdade (ver #contrato-imprimir no styles.css, que esconde todo o resto da
// página quando a Marina manda imprimir). Cabe em 2 folhas A4 — página 1 tem
// os dados da contratante e a Cláusula 1 (objeto); página 2 tem pagamento,
// condições gerais, rescisão e as assinaturas. As linhas de assinatura ficam
// em branco de propósito — a cliente assina a caneta, no papel.

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
    <p className="text-[9pt] leading-snug mb-1">
      <span className="font-semibold">{label}: </span>
      <span className="border-b border-black/70">{valor || " ".repeat(32)}</span>
    </p>
  );
}

function ItemClausula({
  letra,
  texto,
  extra,
}: {
  letra: string;
  texto: string;
  extra?: React.ReactNode;
}) {
  return (
    <p className="text-[8.3pt] leading-snug text-justify mb-1.5">
      {letra}) {texto}
      {extra}
    </p>
  );
}

function Pagina({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="contrato-pagina bg-white text-black mb-6 shadow-md print:shadow-none print:mb-0"
      style={{
        fontFamily: "Arial, sans-serif",
        width: "210mm",
        minHeight: "297mm",
        padding: "14mm 16mm",
      }}
    >
      {children}
    </div>
  );
}

export function ContratoImpresso({ dados }: { dados: DadosContrato }) {
  const itensValidos = dados.itens.filter((i) => i.descricao.trim() && i.quantidade.trim());
  const mesPorExtenso = MESES_PT[Number(dados.dataMes) - 1] ?? dados.dataMes;
  let contador = 0; // letra sequencial (a, b, c...) através das 4 cláusulas

  return (
    <div id="contrato-imprimir">
      <Pagina>
        <h1 className="text-center font-bold text-[13pt] mb-3">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS
        </h1>

        <p className="text-[9pt] leading-snug mb-4">{CONTRATADA_TEXTO}</p>

        <div className="grid grid-cols-2 gap-x-6 mb-5">
          <div className="col-span-2">
            <CampoPreenchido label="CONTRATANTE" valor={dados.nome} />
          </div>
          <CampoPreenchido label="Profissão" valor={dados.profissao} />
          <CampoPreenchido label="Estado civil" valor={dados.estadoCivil} />
          <CampoPreenchido label="Data de nascimento" valor={dados.nascimento} />
          <CampoPreenchido label="CPF" valor={dados.cpf} />
          <CampoPreenchido label="Telefone" valor={dados.telefone} />
          <div className="col-span-2">
            <CampoPreenchido label="Endereço" valor={dados.endereco} />
          </div>
        </div>

        <p className="text-[8.3pt] leading-snug mb-4">{CLAUSULA_1_INTRO}</p>

        <h2 className="font-bold text-[10pt] mb-2">CLÁUSULA 1 - DO OBJETO</h2>
        <p className="text-[8.3pt] leading-snug mb-1.5">{CLAUSULA_1_OBJETO_INTRO}</p>
        <div className="mb-3 min-h-[60px] border-y border-black/40 py-1.5">
          {itensValidos.length === 0 ? (
            <p className="text-[9pt]">&nbsp;</p>
          ) : (
            <ul className="text-[9pt] leading-snug list-none font-bold">
              {itensValidos.map((item) => (
                <li key={item.chave}>
                  {item.quantidade} sessão(ões) de {item.descricao}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {CLAUSULA_1_ITENS.map((texto) => (
            <ItemClausula key={texto} letra={String.fromCharCode(97 + contador++)} texto={texto} />
          ))}
        </div>
      </Pagina>

      <Pagina>
        <h2 className="font-bold text-[10pt] mb-2">CLÁUSULA 2 - DO PAGAMENTO</h2>
        <p className="text-[8.3pt] leading-snug mb-1.5">{CLAUSULA_2_INTRO}</p>
        <div className="mb-3 min-h-[35px] border-y border-black/40 py-1.5">
          <p className="text-[9pt] leading-snug whitespace-pre-wrap font-bold">
            {dados.formaPagamento || " "}
          </p>
        </div>
        <div className="mb-4">
          {CLAUSULA_2_ITENS.map((texto) => (
            <ItemClausula key={texto} letra={String.fromCharCode(97 + contador++)} texto={texto} />
          ))}
        </div>

        <h2 className="font-bold text-[10pt] mb-2">CLÁUSULA 3 - DAS CONDIÇÕES GERAIS</h2>
        <div className="mb-4">
          {CLAUSULA_3_ITENS.map((texto, i) => {
            const ultima = i === CLAUSULA_3_ITENS.length - 1;
            return (
              <ItemClausula
                key={texto}
                letra={String.fromCharCode(97 + contador++)}
                texto={texto}
                extra={
                  ultima ? (
                    <span className="ml-1 whitespace-nowrap font-semibold">
                      {dados.autorizaFoto ? "(X)" : "( )"} SIM {dados.autorizaFoto ? "( )" : "(X)"}{" "}
                      NÃO
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </div>

        <h2 className="font-bold text-[10pt] mb-2">CLÁUSULA 4 - DA RESCISÃO</h2>
        <div className="mb-4">
          {CLAUSULA_4_ITENS.map((texto) => (
            <ItemClausula key={texto} letra={String.fromCharCode(97 + contador++)} texto={texto} />
          ))}
        </div>

        <p className="text-[8.3pt] leading-snug text-justify mb-6">{FORO_TEXTO}</p>

        <p className="text-[9pt] text-center mb-6">
          Sete Lagoas, {dados.dataDia || "____"} de{" "}
          {dados.dataMes ? mesPorExtenso : "________________"} de {dados.dataAno || "________"}
        </p>

        <div className="grid grid-cols-2 gap-10 text-center text-[9pt]">
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
      </Pagina>
    </div>
  );
}
