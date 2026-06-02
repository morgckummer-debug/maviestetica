import { useRef, useState, useCallback, useEffect } from "react";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { promotions } from "@/data/promotions";
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from "@/data/services";

function formatInstallment(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function Promotions() {
  if (promotions.length === 0) return null;

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  // Rastreia posição inicial do toque/clique para distinguir swipe de tap
  const pointerStartX = useRef(0);

  // Quantos cards visíveis por vez (aprox.) — para calcular "página"
  const CARDS_PER_VIEW = 3;
  const totalDots = Math.ceil(promotions.length / CARDS_PER_VIEW);

  const updateState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 8);
    setCanNext(scrollLeft < scrollWidth - clientWidth - 8);
    const pct = scrollLeft / (scrollWidth - clientWidth);
    setActiveIndex(Math.round(pct * (totalDots - 1)));
  }, [totalDots]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateState, { passive: true });
    updateState();
    return () => el.removeEventListener("scroll", updateState);
  }, [updateState]);

  const scroll = (dir: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 320;
    const gap = 20;
    el.scrollBy({ left: dir === "next" ? cardWidth + gap : -(cardWidth + gap), behavior: "smooth" });
  };

  const scrollToDot = (dotIndex: number) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 320;
    const gap = 20;
    const scrollTo = dotIndex * CARDS_PER_VIEW * (cardWidth + gap);
    el.scrollTo({ left: scrollTo, behavior: "smooth" });
  };

  return (
    <section id="promocoes" className="py-14 lg:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">

        {/* Cabeçalho + setas */}
        <div className="flex items-end justify-between gap-6 mb-10 lg:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <p className="text-xs tracking-[0.3em] uppercase text-primary/70 mb-4">
              Promoções do Mês
            </p>
            <h2 className="font-display text-4xl lg:text-5xl text-primary leading-tight">
              Você merece{" "}
              <em className="italic font-normal text-rose">o melhor!</em>
            </h2>
          </motion.div>

          {/* Setas de navegação — desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll("prev")}
              disabled={!canPrev}
              aria-label="Promoção anterior"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center
                         text-foreground/60 hover:text-primary hover:border-primary
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll("next")}
              disabled={!canNext}
              aria-label="Próxima promoção"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center
                         text-foreground/60 hover:text-primary hover:border-primary
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Track do carrossel */}
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory
                     scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {promotions.map((promo, i) => {
            const whatsappMsg = encodeURIComponent(
              `Olá! Vi a promoção de *${promo.sessions} sessões de ${promo.procedure.replace("\n", " ")}* no site e gostaria de saber mais!`
            );
            const totalPrice = promo.installments * promo.installmentPrice;

            const handlePointerDown = (e: React.PointerEvent) => {
              pointerStartX.current = e.clientX;
            };

            const handleClick = (e: React.MouseEvent) => {
              // Se o dedo/mouse se moveu mais de 8px horizontalmente → era swipe, ignora
              if (Math.abs(e.clientX - pointerStartX.current) > 8) return;
              window.open(`${WHATSAPP_URL}?text=${whatsappMsg}`, "_blank", "noreferrer");
            };

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.07, 0.35) }}
                onPointerDown={handlePointerDown}
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Ver promoção: ${promo.sessions} sessões de ${promo.procedure.replace("\n", " ")} — abrir WhatsApp`}
                onKeyDown={(e) => e.key === "Enter" && window.open(`${WHATSAPP_URL}?text=${whatsappMsg}`, "_blank", "noreferrer")}
                className="snap-start shrink-0 flex flex-col rounded-3xl overflow-hidden bg-card
                           border border-border/60 shadow-sm hover:shadow-lg hover:-translate-y-1
                           active:scale-[0.98] cursor-pointer select-none
                           transition-all duration-300 w-[82vw] sm:w-72 lg:w-80
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {/* Corpo */}
                <div className="flex flex-col flex-1 items-center text-center px-7 pt-8 pb-6 gap-4">

                  {/* Badge categoria */}
                  <span className="inline-block text-[11px] font-semibold tracking-widest uppercase
                                   px-4 py-1.5 rounded-full bg-lavender-soft text-primary border border-lavender/40">
                    {promo.category}
                  </span>

                  {/* Sessões */}
                  <p className="text-sm font-medium text-foreground/55 tracking-wide -mb-2">
                    {promo.sessions} sessões de
                  </p>

                  {/* Procedimento */}
                  <h3
                    className="font-sans font-black text-foreground leading-tight whitespace-pre-line"
                    style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}
                  >
                    {promo.procedure}
                  </h3>

                  {/* Coração decorativo */}
                  <span className="text-lavender text-xl select-none" aria-hidden>♡</span>

                  {/* Box preço */}
                  <div className="w-full rounded-2xl bg-lavender/80 text-white px-5 py-4">
                    <p className="text-sm font-medium opacity-90 mb-0.5">
                      {promo.installments}x de
                    </p>
                    <p
                      className="font-black leading-none"
                      style={{ fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}
                    >
                      {formatInstallment(promo.installmentPrice)}
                    </p>
                    <p className="text-xs font-medium opacity-80 mt-1 tracking-wide uppercase">
                      no cartão de crédito
                    </p>
                  </div>

                  {/* Total à vista */}
                  <p className="text-xs text-muted-foreground -mt-1">
                    ou {formatInstallment(totalPrice)} à vista
                  </p>

                  {/* Telefone */}
                  <p className="text-sm font-medium text-primary tracking-wide">
                    {WHATSAPP_DISPLAY}
                  </p>

                  {/* Validade */}
                  <p className="text-xs text-muted-foreground -mt-2">
                    Válido até {promo.validUntil}
                  </p>
                </div>

                {/* CTA visual — hint de que o card é clicável */}
                <div className="px-6 pb-6">
                  <span
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl
                               bg-primary text-primary-foreground px-5 py-3.5 text-sm font-medium
                               shadow-sm shadow-primary/20 pointer-events-none"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Quero aproveitar
                  </span>

                  {promo.note && (
                    <p className="mt-3 text-[10px] text-muted-foreground text-center leading-snug">
                      * {promo.note}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dots de navegação */}
        {totalDots > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalDots }).map((_, di) => (
              <button
                key={di}
                onClick={() => scrollToDot(di)}
                aria-label={`Ir para página ${di + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  di === activeIndex
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-border hover:bg-lavender"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
