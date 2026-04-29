"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

const PLATFORM_COLORS = {
  amazon: "#f97316",
  flipkart: "#3b82f6",
  nykaa: "#ec4899",
};

function formatPrice(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(17, 19, 26, 0.9)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      padding: "16px 20px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    }}>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>
        {new Date(label).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {payload.map((entry) => (
          <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, boxShadow: `0 0 8px ${entry.color}` }}></div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0, display: "flex", justifyContent: "space-between", flex: 1, gap: 16 }}>
              <span style={{ textTransform: "capitalize", color: "#e2e8f0" }}>{entry.name}</span>
              <span style={{ color: entry.color }}>{formatPrice(entry.value)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PriceChart({ productId, activePlatforms }) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      setLoading(true);
      const res = await fetch(`/api/prices/${productId}`);
      const json = await res.json();
      if (Array.isArray(json)) setRawData(json);
      setLoading(false);
    }
    fetchPrices();
  }, [productId]);

  const chartData = (() => {
    const byDate = {};
    for (const row of rawData) {
      const date = row.created_at;
      if (!byDate[date]) byDate[date] = { date };
      byDate[date][row.platform] = row.price;
    }
    return Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));
  })();

  const platforms = activePlatforms || Object.keys(PLATFORM_COLORS);

  if (loading) {
    return <div className="skeleton" style={{ height: 350, width: "100%", borderRadius: 16 }} />;
  }

  if (chartData.length === 0) {
    return (
      <div style={{ height: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <span style={{ fontSize: 48, filter: "grayscale(1) opacity(0.5)" }}>📉</span>
        <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No historical data available yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          stroke="rgba(255,255,255,0.1)"
          tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis
          tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
          stroke="rgba(255,255,255,0.1)"
          tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={70}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '5 5' }} />
        <Legend
          wrapperStyle={{ paddingTop: 24, fontSize: 14 }}
          formatter={(value) => (
            <span style={{ color: "#e2e8f0", textTransform: "capitalize", fontWeight: 700, marginLeft: 6 }}>
              {value}
            </span>
          )}
        />
        {platforms.map((platform) => (
          <Line
            key={platform}
            type="monotone"
            dataKey={platform}
            stroke={PLATFORM_COLORS[platform] || "var(--accent)"}
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--bg-secondary)", stroke: PLATFORM_COLORS[platform], strokeWidth: 2 }}
            activeDot={{ r: 8, strokeWidth: 0, fill: PLATFORM_COLORS[platform], style: { filter: `drop-shadow(0 0 8px ${PLATFORM_COLORS[platform]})` } }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}