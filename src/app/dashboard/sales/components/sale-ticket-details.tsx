"use client"

import { useMemo, useEffect, useRef } from "react";
import { doc } from "firebase/firestore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  LoaderCircle, Store as StoreIcon, Printer,
  Flame, MapPin, Phone, Facebook, Instagram, Twitter,
  Tag, ArrowLeft, Download
} from "lucide-react";
import QRCode from "qrcode.react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useDoc, useFirebase } from "@/firebase";
import { SalesTicket, Store } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SaleTicketDetailsProps {
  ticketId: string;
  store: Store;
}

export function SaleTicketDetails({ ticketId, store }: SaleTicketDetailsProps) {
  const { firestore } = useFirebase();
  const searchParams = useSearchParams();
  const ticketRef = useRef<HTMLDivElement>(null);

  const ticketDocRef = useMemo(() => {
    if (!firestore || !store || !ticketId) return null;
    return doc(firestore, `stores/${store.id}/saleTickets`, ticketId);
  }, [firestore, store, ticketId]);

  const { data: ticket, isLoading: isLoadingTicket } = useDoc<SalesTicket>(ticketDocRef);

  useEffect(() => {
    if (searchParams.get("print") === "true" && !isLoadingTicket && ticket) {
      setTimeout(() => window.print(), 600);
    }
  }, [searchParams, isLoadingTicket, ticket]);

  // ── Store URL using slug (e.g. /hyperbolic) ──
  const storeUrl = useMemo(() => {
    if (typeof window === "undefined") return `https://mibazar.app/${store.slug || store.id}`;
    return `${window.location.origin}/${store.slug || store.id}`;
  }, [store]);

  // ── Share as PDF: open print dialog (browser saves as PDF) ──
  const handleSharePdf = () => {
    window.print();
  };

  // ── Direct print ──
  const handlePrint = () => {
    window.print();
  };

  // ── Status config ──
  const statusConfig = {
    completed: { label: "Completado", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
    pending:   { label: "Pendiente",  badge: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
    cancelled: { label: "Cancelado",  badge: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-400" },
  };
  const status = ((ticket?.status as keyof typeof statusConfig) || "pending");
  const cfg = statusConfig[status] ?? statusConfig.pending;

  // ── Loading ──
  if (isLoadingTicket) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <p className="text-gray-500 font-semibold">No se encontró el ticket de venta.</p>
        <Link href="/dashboard/sales" className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a ventas
        </Link>
      </div>
    );
  }

  const hasPromos = ticket.items?.some((item: any) => item.onSale);
  const totalSaved = ticket.items?.reduce((acc: number, item: any) => {
    if (item.onSale && item.originalPrice && item.price < item.originalPrice) {
      return acc + (item.originalPrice - item.price) * item.quantity;
    }
    return acc;
  }, 0) ?? 0;

  return (
    <>
      {/* ── ACTION BAR — hidden on print ── */}
      <div className="print:hidden max-w-2xl mx-auto mb-4 flex items-center justify-between gap-3 px-1">
        <Link
          href="/dashboard/sales"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSharePdf}
            className="rounded-xl h-9 px-4 border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700 gap-2 font-semibold transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guardar PDF</span>
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="rounded-xl h-9 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-semibold gap-2"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          TICKET — this whole div is what prints
      ══════════════════════════════════════════ */}
      <div className="printable-ticket" ref={ticketRef}>
        <div
          id="ticket-content"
          className="ticket-card max-w-xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden print:rounded-none print:border-none print:shadow-none print:max-w-full"
        >

          {/* ── HEADER ── */}
          <div className="ticket-header bg-gradient-to-br from-amber-600 to-orange-700 px-5 py-5 text-center">
            <h1 className="text-xl font-black text-white tracking-tight">{store.name}</h1>
            {store.description && (
              <p className="text-amber-100/75 text-xs mt-1 max-w-sm mx-auto leading-relaxed line-clamp-2">
                {store.description}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2.5">
              {store.phone && (
                <span className="flex items-center gap-1 text-amber-100/80 text-xs">
                  <Phone className="h-3 w-3" />{store.phone}
                </span>
              )}
              {store.municipality && (
                <span className="flex items-center gap-1 text-amber-100/80 text-xs">
                  <MapPin className="h-3 w-3" />{store.municipality}, {store.state}
                </span>
              )}
            </div>
            {/* Social */}
            {store.socials && (
              <div className="flex items-center justify-center gap-3 mt-2">
                {store.socials.facebook && (
                  <a href={store.socials.facebook} target="_blank" rel="noopener" className="text-white/50 hover:text-white">
                    <Facebook className="h-3.5 w-3.5" />
                  </a>
                )}
                {store.socials.instagram && (
                  <a href={store.socials.instagram} target="_blank" rel="noopener" className="text-white/50 hover:text-white">
                    <Instagram className="h-3.5 w-3.5" />
                  </a>
                )}
                {store.socials.x && (
                  <a href={store.socials.x} target="_blank" rel="noopener" className="text-white/50 hover:text-white">
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── BODY ── */}
          <div className="ticket-body px-5 py-4 space-y-4">

            {/* Ticket meta */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Número de Ticket</p>
                <p className="font-black text-gray-900 text-base leading-tight">#{ticket.ticketNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Fecha de Emisión</p>
                <p className="font-semibold text-gray-700 text-sm">
                  {format(new Date(ticket.date), "d 'de' MMM, yyyy", { locale: es })}
                </p>
                <p className="text-gray-400 text-xs">{format(new Date(ticket.date), "hh:mm a")}</p>
              </div>
            </div>

            {/* Status + promo badges */}
            <div className="flex items-center flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-2.5 py-1 ${cfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {hasPromos && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100 rounded-full px-2.5 py-1">
                  <Flame className="h-3 w-3" /> Promoción aplicada
                </span>
              )}
            </div>

            {/* Dashed separator */}
            <div className="border-t border-dashed border-gray-200" />

            {/* Products */}
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Productos</p>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_36px_80px_80px] bg-gray-50 px-3 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Producto</span>
                  <span className="text-center">Cant.</span>
                  <span className="text-right">Precio</span>
                  <span className="text-right">Total</span>
                </div>

                {ticket.items?.map((item: any, index: number) => {
                  const isPromo = item.onSale && item.originalPrice && item.price < item.originalPrice;
                  const itemSaved = isPromo ? (item.originalPrice - item.price) * item.quantity : 0;

                  return (
                    <div
                      key={index}
                      className={cn("px-3 py-2.5 border-t border-gray-50", index % 2 === 0 ? "bg-white" : "bg-gray-50/30")}
                    >
                      <div className="grid grid-cols-[1fr_36px_80px_80px] items-start gap-1">
                        <div>
                          <p className="font-semibold text-gray-900 text-xs leading-tight">{item.productName}</p>
                          {isPromo && (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <span className="text-[9px] font-bold text-orange-500 flex items-center gap-0.5">
                                <Flame className="h-2.5 w-2.5" />{item.saleLabel || "Oferta"}
                              </span>
                              <span className="text-[9px] text-gray-300 line-through">${item.originalPrice?.toFixed(2)}</span>
                              <span className="text-[9px] text-emerald-600 font-bold">-${itemSaved.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-center text-xs font-bold text-gray-700">{item.quantity}</span>
                        <span className={cn("text-right text-xs font-semibold", isPromo ? "text-orange-600" : "text-gray-900")}>
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-right text-xs font-black text-gray-900">
                          ${(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Savings row */}
            {totalSaved > 0 && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">Ahorro total con promociones</span>
                </div>
                <span className="text-sm font-black text-emerald-700">-${totalSaved.toFixed(2)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
              <span className="font-bold text-white/70 text-sm">Total</span>
              <span className="text-xl font-black text-white">${ticket.totalSales.toFixed(2)}</span>
            </div>

            {/* Dashed separator */}
            <div className="border-t border-dashed border-gray-200" />

            {/* QR — links to store slug URL e.g. /hyperbolic */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white border border-gray-100 rounded-xl p-2.5 shadow-sm shrink-0">
                <QRCode
                  value={storeUrl}
                  size={90}
                  fgColor="#1a1a1a"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-gray-600 mb-0.5">Escanea para visitar nuestra tienda</p>
                <p className="text-[10px] text-gray-400 break-all leading-relaxed">{storeUrl}</p>
                <p className="text-[9px] text-gray-300 mt-1">
                  Este ticket es comprobante de tu compra.<br />
                  Gracias por tu preferencia. 🧡
                </p>
              </div>
            </div>
          </div>

          {/* ── FOOTER ACTIONS — hidden on print ── */}
          <div className="px-5 pb-5 flex gap-3 print:hidden">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl h-10 border-gray-200 text-gray-600 font-semibold gap-2 hover:border-amber-300 hover:text-amber-700 text-sm"
              onClick={handleSharePdf}
            >
              <Download className="h-4 w-4" /> Guardar PDF
            </Button>
            <Button
              className="flex-1 rounded-2xl h-10 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-0 gap-2 text-sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
