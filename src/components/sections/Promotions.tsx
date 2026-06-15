import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { promotions } from "@/data/promotions";
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from "@/data/services";
import logoDark from "@/assets/logo-mavi-dark.png";

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  });
}

function getCampaignBadgeLabel(tag?: string) {
  if (!tag) return null;
  if (tag.toLowerCase().includes("combo") || tag.toLowerCase().includes("eu &") || tag.toLowerCase().includes("eu&")) return "COMBO";
  return "PROMO";
}

export function Promotions() {
  if (promotions.length === 0) return null;

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const pointerStartX = useRef(0);

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
    const cardWidth = el.firstElementChild?.clientWidth ?? 260;
    const gap = 20;
    el.scrollBy({ left: dir === "next" ? cardWidth + gap : -(cardWidth + gap), behavior: "smooth" });
  };

  const scrollToDot = (dotIndex: number) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 260;
    const gap = 20;
    el.scrollTo({ left: dotIndex * CARDS_PER_VIEW * (cardWidth + gap), behavior: "smooth" });
  };

  return (
    <section id="promocoes" className="py-8 lg:py-14 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">

        {/* Cabeçalho */}
        <div className="mb-10 lg:mb-12">
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
        </div>

        {/* Carrossel */}
        <div className="relative group/carousel">
          {/* Seta Esquerda */}
          <button
            onClick={() => scroll("prev")}
            disabled={!canPrev}
            aria-label="Promoção anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-6 z-10
                       w-11 h-11 rounded-full bg-white/90 shadow-lg border border-border/80
                       flex items-center justify-center text-primary hover:bg-primary hover:text-white
                       disabled:opacity-0 disabled:pointer-events-none transition-all duration-300
                       backdrop-blur-sm active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Seta Direita */}
          <button
            onClick={() => scroll("next")}
            disabled={!canNext}
            aria-label="Próxima promoção"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-6 z-10
                       w-11 h-11 rounded-full bg-white/90 shadow-lg border border-border/80
                       flex items-center justify-center text-primary hover:bg-primary hover:text-white
                       disabled:opacity-0 disabled:pointer-events-none transition-all duration-300
                       backdrop-blur-sm active:scale-95"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory px-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {promotions.map((promo, i) => {
              const whatsappMsg = encodeURIComponent(
                `Olá! Vi a promoção de *${promo.sessions} sessões de ${promo.procedure.replace("\n", " ")}* no site e gostaria de saber mais!`
              );
              const badgeLabel = getCampaignBadgeLabel(promo.campaignTag);
              const isAVista = promo.installments === 1;

              const handlePointerDown = (e: React.PointerEvent) => {
                pointerStartX.current = e.clientX;
              };
              const handleClick = (e: React.MouseEvent) => {
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
                  className="snap-start shrink-0 relative rounded-[28px] overflow-hidden cursor-pointer select-none
                             hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]
                             transition-all duration-300
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                             w-[62vw] sm:w-[220px] lg:w-[240px]"
                  style={{ minHeight: "480px" }}
                >
                  {/* Foto de fundo */}
                  {promo.bgImage ? (
                    <img
                      src={promo.bgImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-800" />
                  )}

                  {/* Gradiente escuro */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/90" />

                  {/* Conteúdo */}
                  <div className="relative z-10 flex flex-col h-full p-4 text-white" style={{ minHeight: "480px" }}>

                    {/* Topo: logo + validade */}
                    <div className="flex items-center justify-between mb-3">
                      <img src={logoDark} alt="Mavi" className="h-7 brightness-0 invert opacity-90" draggable={false} />
                      <span className="text-[9px] text-white/65 text-right leading-tight">
                        Válido até<br />{promo.validUntil}
                      </span>
                    </div>

                    {/* Badge PROMO / COMBO */}
                    {badgeLabel && (
                      <span className="self-start mb-1 px-3 py-0.5 rounded-full bg-rose text-white text-[10px] font-bold uppercase tracking-wider">
                        {badgeLabel}
                      </span>
                    )}

                    {/* Nome da campanha */}
                    {promo.campaignTag && (
                      <h2 className="font-display text-[1.85rem] italic text-white leading-tight mb-0.5">
                        {promo.campaignTag}
                      </h2>
                    )}

                    {/* Subtítulo da campanha */}
                    {promo.campaignSubtitle && (
                      <p className="text-[8px] uppercase tracking-widest text-white/65 mb-3 leading-snug">
                        {promo.campaignSubtitle}
                      </p>
                    )}

                    {/* Badge categoria */}
                    <span className="self-start mb-3 px-3 py-1 rounded-full bg-rose/90 text-white text-[9px] font-bold uppercase tracking-wide">
                      {promo.category}
                    </span>

                    {/* Sessões */}
                    <p className="text-[11px] text-white/75 mb-0.5 font-medium">
                      {promo.sessions} sessões de
                    </p>

                    {/* Procedimento */}
                    <h3
                      className="font-black text-white leading-tight whitespace-pre-line mb-3"
                      style={{ fontSize: "clamp(1.4rem, 4.5vw, 1.8rem)" }}
                    >
                      {promo.procedure}
                    </h3>

                    {/* Preço */}
                    <div className="mb-0.5">
                      {isAVista ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-white/80">R$</span>
                          <span className="font-black text-rose leading-none" style={{ fontSize: "clamp(2rem, 6vw, 2.6rem)" }}>
                            {formatPrice(promo.installmentPrice)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span className="text-sm text-white/80">{promo.installments}x de R$</span>
                          <span className="font-black text-rose leading-none" style={{ fontSize: "clamp(2rem, 6vw, 2.6rem)" }}>
                            {formatPrice(promo.installmentPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-white/60 mb-3">
                      {isAVista ? "à vista" : "no Cartão de Crédito"}
                    </p>

                    {/* Bônus combo */}
                    {promo.comboBonus && (
                      <div className="rounded-lg bg-rose/80 px-3 py-2 mb-3">
                        <p className="text-[10px] font-semibold text-white leading-snug">
                          <span className="font-black">Fechando este {badgeLabel},</span> {promo.comboBonus}
                        </p>
                      </div>
                    )}

                    {/* Telefone */}
                    <div className="mt-auto rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-center">
                      <p className="text-xs font-bold text-white tracking-wide">{WHATSAPP_DISPLAY}</p>
                    </div>

                    {/* Nota de rodapé */}
                    {promo.note && (
                      <p className="mt-2 text-[8px] text-white/45 text-center leading-snug">
                        * {promo.note}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dots */}
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
