import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { services } from "@/data/services";

export function ServicesGrid() {
  return (
    <section id="servicos" className="py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-xs tracking-[0.3em] uppercase text-primary/70 mb-6">Tratamentos</p>
          <h2 className="font-display text-4xl lg:text-5xl text-primary leading-tight">
            Cada protocolo, pensado <em className="italic font-normal text-rose">para você</em>.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
            >
              <Link
                to="/servicos/$slug"
                params={{ slug: s.slug }}
                className="group block"
              >
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-muted">
                  <img
                    src={s.image}
                    alt={s.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent opacity-80" />
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 text-primary-foreground">
                    <h3 className="font-display text-xl leading-tight">{s.name}</h3>
                    <p className="mt-1 text-xs text-primary-foreground/80">{s.short}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}