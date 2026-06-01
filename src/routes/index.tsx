import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { Differentials } from "@/components/sections/Differentials";
import { Testimonials } from "@/components/sections/Testimonials";
import { Contact } from "@/components/sections/Contact";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAVI Centro de Estética — Sete Lagoas" },
      {
        name: "description",
        content:
          "Tratamentos faciais e corporais em Sete Lagoas. Drenagem linfática, depilação a laser, limpeza de pele e mais. Seja a sua melhor versão.",
      },
      { property: "og:title", content: "MAVI Centro de Estética — Sete Lagoas" },
      {
        property: "og:description",
        content: "Tratamentos faciais e corporais em Sete Lagoas. Seja a sua melhor versão.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <About />
      <ServicesGrid />
      <Differentials />
      <Testimonials />
      <Contact />
    </>
  );
}
