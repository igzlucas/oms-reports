"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import type { DailySales } from "@/lib/types"

interface SalesOverTimeChartProps {
  data: DailySales[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl px-4 py-3 text-sm">
        <p className="text-gray-400 text-xs font-medium mb-1">{label}</p>
        <p className="text-amber-700 font-black text-lg">${payload[0].value.toFixed(2)}</p>
        <p className="text-gray-400 text-[10px]">en ventas</p>
      </div>
    )
  }
  return null;
}

export function SalesOverTimeChart({ data }: SalesOverTimeChartProps) {
  const totalSales = data.reduce((acc, curr) => acc + curr.sales, 0);

  if (totalSales === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-center">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <span className="text-lg">📈</span>
        </div>
        <p className="text-gray-400 text-sm font-medium">Sin ventas los últimos 7 días</p>
        <p className="text-gray-300 text-xs">Registra una venta para ver la gráfica</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
      >
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="#f1f5f9"
          strokeDasharray="4 4"
        />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#f59e0b", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Line
          dataKey="sales"
          type="monotone"
          stroke="#f59e0b"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#fff", stroke: "#f59e0b", strokeWidth: 2.5 }}
          activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
