"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Package, ShieldCheck, Zap, Award,
  TrendingUp, Users, Star, MapPin, ChevronRight, Sparkles
} from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

const features = [
  {
    icon: Package,
    title: "Miles de Productos",
    description: "Artículos únicos de vendedores locales verificados en todo México",
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
  },
  {
    icon: ShieldCheck,
    title: "Compra Segura",
    description: "Protección completa al comprador en cada transacción",
    color: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
  },
  {
    icon: Zap,
    title: "Comunidad Activa",
    description: "Conecta con compradores y vendedores de tu zona",
    color: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
  },
  {
    icon: Award,
    title: "Calidad Garantizada",
    description: "Vendedores verificados con historial de confianza",
    color: "from-violet-400 to-purple-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
    iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
  },
];

const stats = [
  { icon: TrendingUp, value: "10K+", label: "Productos activos", color: "text-amber-400" },
  { icon: Users, value: "5K+", label: "Vendedores activos", color: "text-orange-400" },
  { icon: Star, value: "4.9", label: "Calificación promedio", color: "text-yellow-400" },
  { icon: MapPin, value: "32", label: "Estados de México", color: "text-red-400" },
];

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  onSale?: boolean;
  salePrice?: number;
  saleLabel?: string;
}

interface InicioPageClientProps {
  featuredProducts: Product[];
}

function getDisplayPrice(product: Product) {
  const hasOffer = product.onSale && product.salePrice && product.salePrice < product.price;
  return hasOffer ? product.salePrice! : product.price;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
} as const;

export function InicioPageClient({ featuredProducts }: InicioPageClientProps) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div className="w-full overflow-x-hidden">

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-[96vh] flex items-center bg-[#0f0d0b] overflow-hidden"
      >
        {/* Background layers */}
        <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 pointer-events-none">
          {/* Radial glows */}
          <div className="absolute -top-32 -right-32 w-[800px] h-[800px] rounded-full bg-amber-600/8 blur-[140px]" />
          <div className="absolute -bottom-48 -left-48 w-[700px] h-[700px] rounded-full bg-orange-700/8 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-amber-500/5 blur-[80px]" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
              backgroundSize: "64px 64px"
            }}
          />
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
        </motion.div>

        <motion.div
          style={{ y: heroY }}
          className="container mx-auto px-6 relative z-10 py-28 lg:py-0"
        >
          <div className="grid lg:grid-cols-2 gap-20 items-center">

            {/* LEFT COLUMN */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              {/* Pill badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-full px-5 py-2 mb-8 backdrop-blur-sm"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-300 text-sm font-medium tracking-wide">Nuevas ofertas cada día</span>
              </motion.div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] xl:text-[5.5rem] font-black text-white leading-[1.02] tracking-tight mb-8">
                Tu Mercado
                <span className="block gradient-text-animated py-1">
                  Favorito
                </span>
                <span className="text-white/90">en Línea</span>
              </h1>

              <p className="text-lg text-white/55 mb-12 max-w-md mx-auto lg:mx-0 leading-relaxed font-light">
                Descubre productos únicos de vendedores locales verificados.
                Compra, vende y conecta con tu comunidad.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/catalogo">
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl h-14 px-9 text-base font-bold shadow-[0_8px_30px_rgba(217,119,6,0.35)] border-0 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(217,119,6,0.5)]"
                  >
                    Explorar Productos
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-2xl h-14 px-9 text-base font-semibold border-white/15 text-white/90 bg-white/5 hover:bg-white/10 hover:border-white/25 backdrop-blur-sm transition-all duration-300"
                  >
                    Vender ahora
                  </Button>
                </Link>
              </div>

              {/* Stats row */}
              <div className="mt-16 flex flex-wrap gap-x-8 gap-y-4 justify-center lg:justify-start">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex flex-col items-center lg:items-start gap-0.5"
                  >
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-white/35 tracking-wide uppercase">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT COLUMN — floating product cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
              className="hidden lg:grid grid-cols-2 gap-5 relative"
            >
              {/* Glow behind grid */}
              <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-3xl -z-10" />

              {featuredProducts.slice(0, 4).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.12 }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  className={[
                    "glass rounded-3xl overflow-hidden cursor-pointer group",
                    i === 1 ? "mt-10" : "",
                    i === 3 ? "-mt-6" : "",
                  ].join(" ")}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover opacity-85 group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    {product.onSale && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                          🔥 Oferta
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-semibold text-sm truncate leading-tight">{product.name}</p>
                      <p className="text-amber-300 font-black text-lg mt-0.5">
                        ${getDisplayPrice(product).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {featuredProducts.length === 0 && [0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`bg-white/5 border border-white/10 rounded-3xl aspect-square animate-pulse ${i === 1 ? "mt-10" : ""} ${i === 3 ? "-mt-6" : ""}`}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── FEATURES ── */}
      <section className="py-28 bg-white relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-amber-50 rounded-full blur-[80px] opacity-60" />

        <div className="container mx-auto px-6 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
            className="text-center mb-20"
          >
            <motion.p
              variants={itemVariants}
              className="inline-flex items-center gap-2 text-amber-600 font-semibold uppercase tracking-widest text-xs mb-4 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5"
            >
              <Sparkles className="h-3 w-3" />
              ¿Por qué MiBazar?
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight"
            >
              Diseñado para <span className="gradient-text">ti</span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="mt-4 text-gray-500 text-lg max-w-xl mx-auto font-light"
            >
              Todo lo que necesitas para comprar y vender con confianza
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group relative ${feature.bg} border ${feature.border} rounded-3xl p-8 hover:shadow-2xl hover:shadow-amber-100/80 transition-all duration-300 card-shine`}
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 font-headline">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-amber-600 transition-colors">
                  Saber más <ChevronRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRODUCTOS DESTACADOS ── */}
      {featuredProducts.length > 0 && (
        <section className="py-28 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />

          <div className="container mx-auto px-6 relative">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={containerVariants}
              className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6"
            >
              <div>
                <motion.p
                  variants={itemVariants}
                  className="inline-flex items-center gap-2 text-amber-600 font-semibold uppercase tracking-widest text-xs mb-4 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5"
                >
                  <Star className="h-3 w-3" />
                  Selección especial
                </motion.p>
                <motion.h2
                  variants={itemVariants}
                  className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight"
                >
                  Productos{" "}
                  <span className="gradient-text">Destacados</span>
                </motion.h2>
              </div>
              <motion.div variants={itemVariants}>
                <Link href="/catalogo">
                  <Button
                    variant="ghost"
                    className="group text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-semibold rounded-2xl border border-amber-100 hover:border-amber-200 px-5 h-11 transition-all duration-200"
                  >
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {featuredProducts.map((product) => {
                const hasOffer = product.onSale && product.salePrice && product.salePrice < product.price;
                const discount = hasOffer
                  ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
                  : 0;
                const displayPrice = hasOffer ? product.salePrice! : product.price;

                return (
                  <motion.div key={product.id} variants={itemVariants}>
                    <Link href={`/catalogo/${product.id}`}>
                      <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-amber-200/70 hover:shadow-[0_20px_60px_-12px_rgba(180,83,9,0.15)] transition-all duration-350 card-shine">
                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-600"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Badge */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            {hasOffer ? (
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs font-bold shadow-lg flex items-center gap-1">
                                🔥 -{discount}%
                              </Badge>
                            ) : (
                              <Badge className="bg-white/90 text-gray-600 border border-gray-100/80 text-xs font-medium shadow-sm backdrop-blur-sm">
                                {product.category}
                              </Badge>
                            )}
                          </div>

                          {/* Quick view hint on hover */}
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
                              Ver detalle →
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 mb-3 rounded-full px-2.5"
                          >
                            {product.category}
                          </Badge>
                          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors line-clamp-1 text-[15px]">
                            {product.name}
                          </h3>
                          <div className="flex items-baseline justify-between mt-3">
                            <div>
                              <span className="text-2xl font-black text-amber-700">
                                ${displayPrice.toFixed(2)}
                              </span>
                              {hasOffer && (
                                <span className="text-sm line-through text-gray-300 ml-2">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                              Stock: {product.stock}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-28 bg-[#0f0d0b] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-amber-600/8 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-orange-600/5 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">Gratis para siempre</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
              ¿Listo para{" "}
              <span className="gradient-text-animated">empezar?</span>
            </h2>
            <p className="text-white/45 mb-12 text-lg leading-relaxed font-light">
              Únete a nuestra comunidad de compradores y vendedores.
              Crea tu cuenta gratis hoy y descubre lo mejor del mercado local.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl h-14 px-10 text-base font-bold shadow-[0_8px_30px_rgba(217,119,6,0.35)] border-0 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(217,119,6,0.5)] transition-all duration-300"
                >
                  Crear Cuenta Gratis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/catalogo">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl h-14 px-10 text-base font-semibold border-white/15 text-white/80 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  Ver Catálogo
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/25 text-xs">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Sin tarjeta requerida
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Registro en 1 minuto
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" /> 4.9★ valoración
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
