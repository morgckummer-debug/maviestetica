import { MessageCircle, Instagram } from "lucide-react";
import { motion } from "motion/react";
import heroBg from "@/assets/hero-bg.jpg";
import { OrganicBlob } from "@/components/ui/OrganicBlob";
import { WHATSAPP_URL, INSTAGRAM_URL, CITY } from "@/data/services";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
      {/* Fundo claro com um leve toque lavanda */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-b from-lavender-soft/40 via-background to-background"
      />

      <OrganicBlob
        variant={1}
        className="absolute -top-40 -left-48 w-[620px] h-[620px] text-lavender-soft/60 -z-10"
      />
      <OrganicBlob
        variant={2}
        className="absolute -bottom-40 -right-32 w-[520px] h-[520px] text-lavender/30 -z-10"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <p className="text-[11px] tracking-[0.32em] uppercase text-muted-foreground mb-6">
              Centro de Estética · {CITY}
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-foreground leading-[1.02]">
              <span className="text-foreground/90">“Seja a sua</span>
              <br />
              <em className="italic font-normal text-primary">melhor versão”</em>
            </h1>

            <div className="mt-8 flex items-start gap-4">
              <span aria-hidden className="mt-3 block h-px w-12 bg-primary/40 shrink-0" />
              <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
                Tratamentos faciais e corporais com tecnologia, sensibilidade
                e o cuidado que sua pele merece.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-medium hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                <MessageCircle className="h-4 w-4" />
                Agendar avaliação
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] lg:rounded-[3rem] shadow-2xl shadow-primary/15">
              <img
                src={heroBg}
                alt="Tratamento estético na MAVI"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}