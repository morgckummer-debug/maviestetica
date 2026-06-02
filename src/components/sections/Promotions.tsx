import { MessageCircle, Check, Tag } from "lucide-react";
import { motion } from "motion/react";
import { promotions } from "@/data/promotions";
import { WHATSAPP_URL } from "@/data/services";

function getDaysLeft(validUntil: string): number {
  const [day, month, year] = validUntil.split("/").map(Number);
  const target = new Date(year, month - 1, day, 23, 59, 59);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
}

export function Promotions() {
  if (promotions.length === 0) return null;

  const currentMonth = promotions[0].month;

  return (
    <section id="promocoes" className="py-14 lg:py-20 bg-lavender-soft/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Cabeçalho */}
        <div className="max-w-2xl mb-10 lg:mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-primary/70 mb-4 flex items-center gap-2">
            <Tag className="h-3.5 w-3.5" />
            Promoções
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-primary leading-tight">
            Combos de{" "}
            <em className="italic font-normal text-rose">{currentMonth}</em>
          </h2>
          <p className="mt-4 text-foreground/60 text-base leading-relaxed max-w-lg">
            Todo mês a Mavi prepara combos especiais para você cuidar mais e
            gastar menos. Aproveite enquanto há vagas!
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {promotions.map((promo, i) => {
            const daysLeft = getDaysLeft(promo.validUntil);
            const urgency = daysLeft <= 5 && daysLeft > 0;
            const savings = promo.originalPrice - promo.promoPrice;
            const discountPct = Math.round((savings / promo.originalPrice) * 100);

            const whatsappMsg = encodeURIComponent(
              `Olá! Tenho interesse no *${promo.title}* (promoção de ${promo.month}). Poderia me passar mais informações?`
            );

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col rounded-3xl bg-card border border-border/60 overflow-hidden
                           shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                           hover:border-lavender/50"
              >
                {/* Barra de cor no topo */}
                <div className="h-1.5 w-full bg-gradient-to-r from-lavender via-rose to-lavender/60" />

                <div className="flex flex-col flex-1 p-6">
                  {/* Topo: mês + badge */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <span className="text-[10px] tracking-[0.28em] uppercase text-primary/50 font-medium pt-0.5">
                      ✦ {promo.month}
                    </span>
                    {promo.badge && (
                      <span className="shrink-0 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-lavender-soft text-primary border border-lavender/30">
                        {promo.badge}
                      </span>
                    )}
                  </div>

                  {/* Título e tagline */}
                  <h3 className="font-display text-2xl lg:text-[1.7rem] text-primary leading-tight mb-1">
                    {promo.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    {promo.tagline}
                  </p>

                  {/* Procedimentos */}
                  <ul className="flex flex-col gap-2 mb-6">
                    {promo.services.map((service) => (
                      <li key={service} className="flex items-start gap-2.5 text-sm text-foreground/80">
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-lavender-soft flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />
                        </span>
                        {service}
                      </li>
                    ))}
                  </ul>

                  {/* Espaçador para alinhar preços ao fundo */}
                  <div className="flex-1" />

                  {/* Preços */}
                  <div className="flex items-end justify-between gap-4 mb-5 pt-4 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground line-through mb-0.5">
                        {formatPrice(promo.originalPrice)}
                      </p>
                      <p className="font-display text-3xl text-primary leading-none">
                        {formatPrice(promo.promoPrice)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-rose bg-rose/10 px-2.5 py-1.5 rounded-xl">
                      -{discountPct}%
                    </span>
                  </div>

                  {/* Validade */}
                  <p
                    className={`text-xs mb-5 ${
                      urgency ? "text-rose font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {urgency
                      ? `⚠ Últimos ${daysLeft} dia${daysLeft > 1 ? "s" : ""}!`
                      : `Válido até ${promo.validUntil}`}
                  </p>

                  {/* CTA */}
                  <a
                    href={`${WHATSAPP_URL}?text=${whatsappMsg}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl
                               bg-primary text-primary-foreground px-5 py-3.5 text-sm font-medium
                               hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-sm
                               shadow-primary/20 hover:shadow-primary/30"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Quero aproveitar
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rodapé da seção */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Promoções válidas para agendamentos realizados dentro do período indicado. Sujeitas à disponibilidade de agenda.
        </p>
      </div>
    </section>
  );
}
