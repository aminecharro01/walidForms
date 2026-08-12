"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function ResponsesLineChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13, direction: "rtl" }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Area type="monotone" dataKey="count" name="الردود" stroke="#4f46e5" strokeWidth={2} fill="url(#colorCount)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
