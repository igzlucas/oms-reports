"use client"

import {
  MoreHorizontal, PlusCircle, CheckCircle2, XCircle,
  Clock, ShoppingCart, AlertCircle, ArrowUpRight, Receipt,
  Search, ChevronLeft, ChevronRight, LayoutGrid
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState, useMemo } from "react"
import { collection, query, doc, updateDoc, orderBy } from "firebase/firestore"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { SalesTicket } from "@/lib/types"
import { useCollection, useFirebase } from "@/firebase"
import { AddSaleModal } from "./add-sale-modal"
import { useDashboard } from "../../layout"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type StatusKey = "pending" | "completed" | "cancelled"
type FilterKey = "all" | StatusKey

const statusConfig: Record<StatusKey, { label: string; badge: string; dot: string }> = {
  pending:   { label: "Pendiente",  badge: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-400" },
  completed: { label: "Completado", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  cancelled: { label: "Cancelado",  badge: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-400" },
}

// Stat-filter cards config
const statFilters: {
  key: FilterKey
  label: string
  // inactive styles
  bg: string
  border: string
  iconBg: string
  valueColor: string
  // active (selected) styles
  activeBg: string
  activeBorder: string
  activeIconBg: string
  activeValueColor: string
  activeRing: string
}[] = [
  {
    key: "all",
    label: "Total",
    bg: "bg-white",                border: "border-gray-100",
    iconBg: "bg-gray-100",         valueColor: "text-gray-800",
    activeBg: "bg-gray-900",       activeBorder: "border-gray-900",
    activeIconBg: "bg-white/15",   activeValueColor: "text-white",
    activeRing: "ring-2 ring-gray-900 ring-offset-1",
  },
  {
    key: "completed",
    label: "Completadas",
    bg: "bg-emerald-50",           border: "border-emerald-100",
    iconBg: "bg-emerald-100",      valueColor: "text-emerald-700",
    activeBg: "bg-emerald-600",    activeBorder: "border-emerald-600",
    activeIconBg: "bg-white/20",   activeValueColor: "text-white",
    activeRing: "ring-2 ring-emerald-500 ring-offset-1",
  },
  {
    key: "pending",
    label: "Pendientes",
    bg: "bg-amber-50",             border: "border-amber-100",
    iconBg: "bg-amber-100",        valueColor: "text-amber-700",
    activeBg: "bg-amber-500",      activeBorder: "border-amber-500",
    activeIconBg: "bg-white/20",   activeValueColor: "text-white",
    activeRing: "ring-2 ring-amber-400 ring-offset-1",
  },
  {
    key: "cancelled",
    label: "Canceladas",
    bg: "bg-red-50",               border: "border-red-100",
    iconBg: "bg-red-100",          valueColor: "text-red-600",
    activeBg: "bg-red-500",        activeBorder: "border-red-500",
    activeIconBg: "bg-white/20",   activeValueColor: "text-white",
    activeRing: "ring-2 ring-red-400 ring-offset-1",
  },
]

const statIcon: Record<FilterKey, React.ElementType> = {
  all: LayoutGrid,
  completed: CheckCircle2,
  pending: Clock,
  cancelled: XCircle,
}

const PAGE_SIZE = 8

export function SalesTable() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { firestore } = useFirebase()
  const { activeStore } = useDashboard()

  const salesQuery = useMemo(() => {
    if (!activeStore) return null
    return query(collection(firestore, `stores/${activeStore.id}/saleTickets`), orderBy("date", "desc"))
  }, [firestore, activeStore])

  const { data: sales, isLoading: isLoadingSales } = useCollection<SalesTicket>(salesQuery)

  const handleStatusChange = async (ticketId: string, status: StatusKey) => {
    if (!activeStore) return
    try {
      await updateDoc(doc(firestore, `stores/${activeStore.id}/saleTickets`, ticketId), { status })
      toast({ title: "Estado actualizado", description: `Marcada como ${statusConfig[status].label}.` })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado." })
    }
  }

  const counts = useMemo(() => {
    if (!sales) return { all: 0, completed: 0, pending: 0, cancelled: 0 }
    return {
      all:       sales.length,
      completed: sales.filter(s => (s.status || "pending") === "completed").length,
      pending:   sales.filter(s => (s.status || "pending") === "pending").length,
      cancelled: sales.filter(s => (s.status || "pending") === "cancelled").length,
    }
  }, [sales])

  const filtered = useMemo(() => {
    if (!sales) return []
    let list = [...sales]
    if (activeFilter !== "all") list = list.filter(s => (s.status || "pending") === activeFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s => s.ticketNumber?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q))
    }
    return list
  }, [sales, activeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const changeFilter = (f: FilterKey) => { setActiveFilter(f); setPage(1) }
  const changeSearch = (v: string) => { setSearch(v); setPage(1) }

  // No store
  if (!activeStore) {
    return (
      <Card className="rounded-3xl border-amber-100 bg-amber-50 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <p className="font-bold text-amber-800">No hay tienda activa</p>
            <p className="text-amber-600/70 text-sm mt-1">
              <Link href="/dashboard/stores" className="underline font-semibold">Selecciona o crea una tienda</Link> para gestionar las ventas.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasSales = !isLoadingSales && sales && sales.length > 0

  return (
    <>
      <AddSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        storeId={activeStore.id}
        onSaleAdded={() => {}}
      />

      <div className="space-y-4">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shrink-0">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-gray-900 leading-tight">Ventas</h1>
              <p className="text-xs text-gray-400">{activeStore.name}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-sm font-semibold gap-1.5 h-9 px-3"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-sm">Nueva Venta</span>
          </Button>
        </div>

        {/* ── STAT-FILTER CARDS ──
            Each card IS the filter. Click to activate.
            Active card = filled background + ring.
            Grid: 2×2 on mobile, 4 columns on sm+
        ── */}
        {isLoadingSales ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse h-[88px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statFilters.map(sf => {
              const isActive = activeFilter === sf.key
              const Icon = statIcon[sf.key]
              const count = counts[sf.key]
              return (
                <button
                  key={sf.key}
                  onClick={() => changeFilter(sf.key)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all duration-200 hover:shadow-md w-full",
                    isActive
                      ? `${sf.activeBg} ${sf.activeBorder} ${sf.activeRing} shadow-sm`
                      : `${sf.bg} ${sf.border} hover:border-gray-200`
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      isActive ? sf.activeIconBg : sf.iconBg
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : sf.valueColor)} />
                    </div>
                    {isActive && (
                      <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Activo</span>
                    )}
                  </div>
                  <p className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide mb-0.5 leading-tight",
                    isActive ? "text-white/70" : "text-gray-400"
                  )}>
                    {sf.label}
                  </p>
                  <p className={cn(
                    "text-2xl font-black leading-none",
                    isActive ? sf.activeValueColor : sf.valueColor
                  )}>
                    {count}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {/* ── MAIN CARD (search + table) ── */}
        <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="px-5 pt-4 pb-5">

            {/* Search */}
            {hasSales && (
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 pointer-events-none" />
                <Input
                  value={search}
                  onChange={e => changeSearch(e.target.value)}
                  placeholder="Buscar por número de ticket…"
                  className="pl-9 h-9 rounded-xl border-gray-100 bg-gray-50 focus:bg-white text-sm placeholder:text-gray-300 focus:border-amber-300 transition-all"
                />
              </div>
            )}

            {/* Loading */}
            {isLoadingSales && (
              <div className="space-y-2.5">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                    <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-20" /></div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            )}

            {/* No sales ever */}
            {!isLoadingSales && (!sales || sales.length === 0) && (
              <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <Receipt className="h-7 w-7 text-gray-200" />
                </div>
                <p className="font-semibold text-gray-400 text-sm">No hay ventas aún</p>
                <p className="text-gray-300 text-xs">Crea tu primera venta con el botón de arriba</p>
              </div>
            )}

            {/* Filter no results */}
            {hasSales && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <Search className="h-5 w-5 text-gray-200" />
                </div>
                <p className="font-semibold text-gray-400 text-sm">Sin resultados</p>
                <p className="text-gray-300 text-xs">Intenta con otro filtro o búsqueda</p>
                <button
                  onClick={() => { changeFilter("all"); changeSearch("") }}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Table */}
            {!isLoadingSales && paginated.length > 0 && (
              <>
                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-gray-100">
                        <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-4 py-3">Nº de Ticket</TableHead>
                        <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-3">Estado</TableHead>
                        <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell py-3">Fecha</TableHead>
                        <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right py-3">Monto</TableHead>
                        <TableHead className="w-10 py-3" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((ticket: SalesTicket) => {
                        const status = ((ticket.status as StatusKey) || "pending")
                        const cfg = statusConfig[status]
                        return (
                          <TableRow key={ticket.id} className="hover:bg-amber-50/30 transition-colors border-gray-50">
                            <TableCell className="pl-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                  <Receipt className="h-3.5 w-3.5 text-amber-500" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800 text-sm leading-tight">#{ticket.ticketNumber}</p>
                                  <p className="text-[10px] text-gray-400 md:hidden">
                                    {format(new Date(ticket.date), "d MMM yyyy", { locale: es })}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-2.5 py-1 ${cfg.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-400 py-3">
                              {format(new Date(ticket.date), "d 'de' MMM, yyyy", { locale: es })}
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <span className="font-black text-gray-900 text-sm">${ticket.totalSales.toFixed(2)}</span>
                            </TableCell>
                            <TableCell className="pr-3 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-amber-50 hover:text-amber-700 transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Acciones</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-xl border border-gray-100 p-1">
                                  <DropdownMenuLabel className="text-xs text-gray-400 font-normal px-3 py-1.5">Acciones</DropdownMenuLabel>
                                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer px-3 py-2">
                                    <Link href={`/dashboard/sales/${ticket.id}`} className="flex items-center gap-2.5">
                                      <ArrowUpRight className="h-4 w-4 text-blue-500" />
                                      <span className="text-sm font-medium">Ver Detalles</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "completed")} disabled={status === "completed"} className="rounded-xl cursor-pointer px-3 py-2 flex items-center gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-sm font-medium">Marcar como Completada</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "pending")} disabled={status === "pending"} className="rounded-xl cursor-pointer px-3 py-2 flex items-center gap-2.5">
                                    <Clock className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm font-medium">Marcar como Pendiente</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "cancelled")} disabled={status === "cancelled"} className="rounded-xl cursor-pointer px-3 py-2 flex items-center gap-2.5 text-red-500 focus:text-red-600 focus:bg-red-50">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Marcar como Cancelada</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 font-medium">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de{" "}
                      <span className="text-gray-600 font-bold">{filtered.length}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="h-8 w-8 rounded-xl hover:bg-amber-50 hover:text-amber-700 disabled:opacity-30">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .reduce<(number | string)[]>((acc, p, i, arr) => {
                          if (i > 0 && typeof arr[i-1] === "number" && (p as number) - (arr[i-1] as number) > 1) acc.push("…")
                          acc.push(p); return acc
                        }, [])
                        .map((p, i) => p === "…"
                          ? <span key={`d${i}`} className="text-gray-300 text-xs w-8 text-center">…</span>
                          : <button key={p} onClick={() => setPage(p as number)}
                              className={cn("h-8 w-8 rounded-xl text-xs font-bold transition-all",
                                page === p ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm"
                                           : "text-gray-500 hover:bg-amber-50 hover:text-amber-700")}>
                              {p}
                            </button>
                        )}
                      <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="h-8 w-8 rounded-xl hover:bg-amber-50 hover:text-amber-700 disabled:opacity-30">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
