"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

const PLATFORM_COLORS = {
  amazon: "#ea580c",
  flipkart: "#2563eb",
  nykaa: "#db2777",
};

function formatPrice(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #d1e8da",
      borderRadius: 10,
      padding: "12px 16px",
      boxShadow: "0 4px 20px rgba(22,163,74,0.12)",
    }}>
      <p style={{ fontSize: 12, color: "#7aab90", marginBottom: 8 }}>
        {new Date(label).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, fontWeight: 700, fontSize: 14 }}>
          {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}: {formatPrice(entry.value)}
        </p>
      ))}
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
    return <div className="skeleton" style={{ height: 300, width: "100%" }} />;
  }

  if (chartData.length === 0) {
    return (
      <div style={{ height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ fontSize: 40 }}>📉</span>
        <p style={{ color: "#7aab90", fontSize: 14 }}>No price history yet. Run the scraper to start tracking.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f5ee" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          stroke="#d1e8da"
          tick={{ fill: "#7aab90", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
          stroke="#d1e8da"
          tick={{ fill: "#7aab90", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
          formatter={(value) => (
            <span style={{ color: PLATFORM_COLORS[value] || "#3d6b52", textTransform: "capitalize", fontWeight: 600 }}>
              {value}
            </span>
          )}
        />
        {platforms.map((platform) => (
          <Line
            key={platform}
            type="monotone"
            dataKey={platform}
            stroke={PLATFORM_COLORS[platform] || "#16a34a"}
            strokeWidth={2.5}
            dot={{ r: 3, fill: PLATFORM_COLORS[platform], strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}