import { MessageCircle, Instagram } from "lucide-react";
import { motion } from "motion/react";
import heroImg from "@/assets/hero-stilllife.jpg";
import { OrganicBlob } from "@/components/ui/OrganicBlob";
import { WHATSAPP_URL, INSTAGRAM_URL, CITY } from "@/data/services";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
      <OrganicBlob
        variant={1}
        className="absolute -top-32 -left-40 w-[680px] h-[680px] text-lavender-soft -z-10"
      />
      <OrganicBlob
        variant={2}
        className="absolute -bottom-40 right-[-15%] w-[520px] h-[520px] text-lavender/40 -z-10"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary/70 mb-6">
            Centro de Estética · {CITY}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-primary leading-[1.05]">
            Seja a sua
            <br />
            <em className="italic font-normal text-rose">melhor versão</em>.
          </h1>
          <p className="mt-8 text-lg text-foreground/70 max-w-md leading-relaxed">
            Tratamentos faciais e corporais conduzidos com tecnologia avançada,
            sensibilidade e o cuidado que sua pele merece.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-medium hover:bg-primary/90 transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" />
              Agendar avaliação
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 text-primary px-7 py-3.5 text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative"
        >
          <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/10">
            <img
              src={heroImg}
              alt="Produtos de cuidado com lavanda em ambiente de spa"
              className="w-full h-full object-cover"
              width={1280}
              height={1280}
            />
          </div>
          <div className="absolute -bottom-8 -left-8 hidden md:block bg-cream rounded-2xl px-6 py-4 shadow-xl">
            <p className="font-display italic text-2xl text-primary">+4 anos</p>
            <p className="text-xs text-muted-foreground tracking-wide">de cuidado e transformação</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}