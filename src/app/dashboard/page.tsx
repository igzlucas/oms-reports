"use client"

import { useMemo } from "react";
import { DollarSign, Store as StoreIcon, ShoppingCart, TrendingUp, Package, ArrowUpRight } from "lucide-react";
import { collection, query, orderBy, where } from "firebase/firestore";
import { format, subDays } from 'date-fns';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SalesOverTimeChart } from "./components/sales-over-time-chart";
import { TopProductsChart } from "./components/top-products-chart";
import { useCollection, useFirebase } from "@/firebase";
import { SalesTicket, Product } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "./layout";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className={`rounded-2xl border-0 shadow-sm ${i === 3 ? "col-span-2 md:col-span-1" : ""}`}>
            <CardContent className="p-4">
              <Skeleton className="h-9 w-9 rounded-xl mb-3" />
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-7 w-24 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {[1, 2].map(i => (
          <Card key={i} className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2 px-4 pt-4">
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent className="h-[220px] md:h-[260px] px-4 pb-4">
              <Skeleton className="h-full w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const statConfig = [
  {
    key: "revenue" as const,
    title: "INGRESOS TOTALES",
    icon: DollarSign,
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    cardBg: "bg-gradient-to-br from-amber-50 to-orange-50",
    border: "border-amber-100",
    valueColor: "text-amber-700",
    trend: "+12%",
  },
  {
    key: "sales" as const,
    title: "VENTAS TOTALES",
    icon: ShoppingCart,
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
    cardBg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    border: "border-blue-100",
    valueColor: "text-blue-700",
    trend: "+8%",
  },
  {
    key: "stock" as const,
    title: "PRODUCTOS EN STOCK",
    icon: Package,
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    cardBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    border: "border-emerald-100",
    valueColor: "text-emerald-700",
    trend: null,
  },
];

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { activeStore, isLoadingStores } = useDashboard();

  const salesQuery = useMemo(() => {
    if (!activeStore) return null;
    return query(collection(firestore, `stores/${activeStore.id}/saleTickets`), orderBy("date", "desc"));
  }, [firestore, activeStore]);

  const productsQuery = useMemo(() => {
    if (!activeStore) return null;
    return query(collection(firestore, `products`), where("storeId", "==", activeStore.id));
  }, [firestore, activeStore]);

  const { data: sales, isLoading: isLoadingSales } = useCollection<SalesTicket>(salesQuery);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const dashboardData = useMemo(() => {
    if (!sales || !products) return null;

    const totalRevenue = sales.reduce((acc, s) => acc + s.totalSales, 0);
    const totalSales = sales.length;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    const dailySalesData = last7Days.map(dateStr => {
      const forDay = sales.filter(s => format(new Date(s.date), 'yyyy-MM-dd') === dateStr);
      return {
        date: format(new Date(dateStr), 'MMM d'),
        sales: forDay.reduce((acc, s) => acc + s.totalSales, 0),
      };
    });

    const productSalesCount = sales
      .flatMap(s => s.items || [])
      .reduce((acc, item) => {
        if (item?.productId) acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

    const topProductsData = Object.entries(productSalesCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const p = products.find(p => p.id === productId);
        return { id: productId, name: p?.name || 'Producto Desconocido', sales: quantity, price: p?.price || 0 };
      });

    return { totalRevenue, totalSales, productsInStock: products.length, dailySalesData, topProductsData };
  }, [sales, products]);

  if (isLoadingStores || isLoadingSales || isLoadingProducts) return <DashboardSkeleton />;

  if (!activeStore) {
    return (
      <div className="max-w-lg mx-auto mt-8 px-2">
        <Alert className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
          <StoreIcon className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold">No hay ninguna tienda seleccionada</AlertTitle>
          <AlertDescription className="text-amber-700/80 mt-1">
            Por favor,{" "}
            <Link href="/dashboard/stores" className="font-bold underline text-amber-700 hover:text-amber-900">
              crea o selecciona una tienda
            </Link>{" "}
            para ver tu panel de control.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) return <DashboardSkeleton />;

  const statValues: Record<typeof statConfig[number]["key"], string> = {
    revenue: `$${dashboardData.totalRevenue.toFixed(2)}`,
    sales: `+${dashboardData.totalSales}`,
    stock: `${dashboardData.productsInStock}`,
  };

  const statSubtitles: Record<typeof statConfig[number]["key"], string> = {
    revenue: `De ${dashboardData.totalSales} ventas`,
    sales: `Transacciones registradas`,
    stock: `Productos únicos activos`,
  };

  return (
    <div className="space-y-4 md:space-y-6">

      {/* ── STORE HEADER ── */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h1 className="text-lg md:text-2xl font-black text-gray-900 leading-tight">{activeStore.name}</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-0.5">Resumen general del panel</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Activa
        </div>
      </div>

      {/* ── STAT CARDS ──
        Mobile  → 2 columns: card1 | card2 — card3 spans full row
        Tablet+ → 3 columns equally
      ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {statConfig.map((cfg, idx) => (
          <Card
            key={cfg.key}
            className={[
              "rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md",
              cfg.cardBg,
              cfg.border,
              /* 3rd card: full-width row on mobile, normal on md+ */
              idx === 2 ? "col-span-2 md:col-span-1" : "",
            ].join(" ")}
          >
            <CardContent className="p-4 md:p-5">
              {/* Icon row */}
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center shadow-sm shrink-0`}>
                  <cfg.icon className="h-4 w-4 text-white" />
                </div>
                {cfg.trend && (
                  <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                    <TrendingUp className="h-2.5 w-2.5" />
                    {cfg.trend}
                  </span>
                )}
              </div>

              {/* Label */}
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-tight">
                {cfg.title}
              </p>

              {/* Value — smaller on mobile to avoid overflow */}
              <p className={`text-xl md:text-2xl lg:text-3xl font-black ${cfg.valueColor} leading-none break-all`}>
                {statValues[cfg.key]}
              </p>

              {/* Subtitle */}
              <p className="text-[10px] md:text-xs text-gray-400 mt-1.5 leading-tight">
                {statSubtitles[cfg.key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── CHARTS ──
        Mobile  → stacked (1 column)
        Tablet+ → side by side (2 columns)
      ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-1 px-4 pt-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-sm md:text-base font-bold text-gray-900 leading-tight">
                  Ventas a lo largo del tiempo
                </CardTitle>
                <CardDescription className="text-[11px] md:text-xs mt-0.5">Últimos 7 días</CardDescription>
              </div>
              <Link
                href="/dashboard/sales"
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors shrink-0 mt-0.5 whitespace-nowrap"
              >
                Ver todo <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[260px] px-2 pb-3">
            <SalesOverTimeChart data={dashboardData.dailySalesData} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-1 px-4 pt-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-sm md:text-base font-bold text-gray-900 leading-tight">
                  Productos más vendidos
                </CardTitle>
                <CardDescription className="text-[11px] md:text-xs mt-0.5">Este mes</CardDescription>
              </div>
              <Link
                href="/dashboard/products"
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors shrink-0 mt-0.5 whitespace-nowrap"
              >
                Ver todo <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[260px] px-2 pb-3">
            <TopProductsChart data={dashboardData.topProductsData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
