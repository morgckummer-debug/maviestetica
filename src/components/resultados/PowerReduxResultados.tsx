import { Link } from "@tanstack/react-router";
import { MessageCircle, ArrowLeft, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { WHATSAPP_URL } from "@/data/services";
import powerReduxBg from "@/assets/services/power-redux.jpg";

export type ResultadoItem = {
  id: number;
  antes: string;
  depois: string;
  descricao?: string;
};

const resultados: ResultadoItem[] = [
  // Adicione os objetos com antes/depois aqui quando tiver as imagens
  // Exemplo:
  // { id: 1, antes: antesImg1, depois: depoisImg1, descricao: "Após 8 sessões" },
];

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col gap-2">
      <span className="text-xs tracking-[0.2em] uppercase text-primary/60 font-medium">{label}</span>
      <div className="aspect-[3/4] rounded-2xl bg-secondary/60 border border-border/40 flex items-center justify-center">
        <p className="text-sm text-muted-foreground/50">Imagem em breve</p>
      </div>
    </div>
  );
}

function ResultadoCard({ item }: { item: ResultadoItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 bg-white/60 dark:bg-card/60 rounded-3xl p-5 shadow-sm border border-border/30"
    >
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-xs tracking-[0.2em] uppercase text-primary/60 font-medium">Antes</span>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-secondary/40">
            <img
              src={item.antes}
              alt="Antes do tratamento Power Redux"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-xs tracking-[0.2em] uppercase text-primary/60 font-medium">Depois</span>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-secondary/40">
            <img
              src={item.depois}
              alt="Depois do tratamento Power Redux"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
      {item.descricao && (
        <p className="text-sm text-muted-foreground text-center">{item.descricao}</p>
      )}
    </motion.div>
  );
}

export function PowerReduxResultados() {
  const temResultados = resultados.length > 0;

  return (
    <>
      {/* Hero da página */}
      <section className="relative overflow-hidden min-h-[40vh] flex items-center pt-20 pb-16">
        <div className="absolute inset-0 -z-10">
          <img
            src={powerReduxBg}
            alt="Power Redux"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
        </div>

        <div className="mx-auto max-w-6xl px-6 lg:px-10 w-full">
          <Link
            to="/servicos/$slug"
            params={{ slug: "power-redux" }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para Power Redux
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <p className="text-xs tracking-[0.3em] uppercase text-primary/70 mb-4">Resultados reais</p>
            <h1 className="font-display text-4xl lg:text-6xl text-primary leading-[1.05]">
              Power Redux
              <br />
              <span className="italic font-normal">antes & depois</span>
            </h1>
            <p className="mt-6 text-lg text-foreground/75 leading-relaxed max-w-xl">
              Veja as transformações reais das nossas clientes com o protocolo Power Redux — redução de medidas, suavização da celulite e pele mais firme.
            </p>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-medium hover:bg-primary/90 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
            >
              <MessageCircle className="h-4 w-4" />
              Quero meu resultado
            </a>
          </motion.div>
        </div>
      </section>

      {/* Grid de resultados */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          {temResultados ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resultados.map((item) => (
                <ResultadoCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            /* Placeholders enquanto não há imagens */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: n * 0.05 }}
                  className="flex flex-col gap-4 bg-white/60 dark:bg-card/60 rounded-3xl p-5 shadow-sm border border-border/30"
                >
                  <div className="flex gap-3">
                    <PlaceholderCard label="Antes" />
                    <PlaceholderCard label="Depois" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-14 bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl lg:text-4xl text-primary">
              Pronta para o seu
              <br />
              <span className="italic font-normal">resultado?</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Agende sua avaliação e descubra o protocolo ideal para o seu corpo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-medium hover:bg-primary/90 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
              >
                <MessageCircle className="h-4 w-4" />
                Agendar avaliação
              </a>
              <Link
                to="/servicos/$slug"
                params={{ slug: "power-redux" }}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                Conhecer o tratamento <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
