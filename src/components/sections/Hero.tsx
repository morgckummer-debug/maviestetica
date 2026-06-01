import { MessageCircle, Instagram } from "lucide-react";
import { motion } from "motion/react";
import heroBg from "@/assets/hero-bg.jpg";
import { OrganicBlob } from "@/components/ui/OrganicBlob";
import { WHATSAPP_URL, INSTAGRAM_URL, CITY } from "@/data/services";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 lg:pt-40 lg:pb-48">
      {/* Imagem de fundo translúcida */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-center bg-cover opacity-75"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-br from-primary/55 via-primary/30 to-background/60"
      />

      <OrganicBlob
        variant={1}
        className="absolute -top-32 -left-40 w-[680px] h-[680px] text-lavender-soft -z-10"
      />
      <OrganicBlob
        variant={2}
        className="absolute -bottom-40 right-[-15%] w-[520px] h-[520px] text-lavender/40 -z-10"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-white/80 mb-6">
            Centro de Estética · {CITY}
          </p>
          <h1
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05]"
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0.35)" }}
          >
            Seja a sua
            <br />
            <em className="italic font-normal text-lavender-soft">melhor versão</em>.
          </h1>
          <p
            className="mt-8 text-lg text-white/90 max-w-md leading-relaxed"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}
          >
            Tratamentos faciais e corporais conduzidos com tecnologia avançada,
            sensibilidade e o cuidado que sua pele merece.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-7 py-3.5 text-sm font-medium hover:bg-white/90 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
            >
              <MessageCircle className="h-4 w-4" />
              Agendar avaliação
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 text-white px-7 py-3.5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}