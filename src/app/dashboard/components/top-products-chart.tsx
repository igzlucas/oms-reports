"use client"

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"

interface TopProductData {
  id: string;
  name: string;
  sales: number;
  price: number;
}
interface TopProductsChartProps {
  data: TopProductData[];
}

const BAR_COLORS = [
  "#f59e0b",
  "#fb923c",
  "#fbbf24",
  "#f97316",
  "#fcd34d",
];

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl px-4 py-3 text-sm">
        <p className="text-gray-500 text-xs font-medium mb-1 max-w-[160px] truncate">
          {payload[0]?.payload?.name}
        </p>
        <p className="text-amber-700 font-black text-lg">{payload[0].value}</p>
        <p className="text-gray-400 text-[10px]">unidades vendidas</p>
      </div>
    )
  }
  return null;
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-center">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <span className="text-lg">📦</span>
        </div>
        <p className="text-gray-400 text-sm font-medium">Sin datos de productos</p>
        <p className="text-gray-300 text-xs">Registra ventas para ver los más vendidos</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
        barSize={16}
      >
        <XAxis
          dataKey="sales"
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          tickFormatter={(v) => `${v}`}
        />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          width={100}
          tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
          tickFormatter={(v) => v.length > 13 ? `${v.substring(0, 13)}…` : v}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.05)" }} />
        <Bar
          dataKey="sales"
          layout="vertical"
          radius={[0, 8, 8, 0]}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
