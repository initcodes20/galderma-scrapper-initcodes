"use client";

import Link from "next/link";

const PLATFORM_META = {
    amazon: { label: "Amazon", color: "#ea580c", bg: "rgba(234,88,12,0.07)" },
    flipkart: { label: "Flipkart", color: "#2563eb", bg: "rgba(37,99,235,0.07)" },
    nykaa: { label: "Nykaa", color: "#db2777", bg: "rgba(219,39,119,0.07)" },
};

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(price);
}

export default function ProductCard({ product }) {
    const { id, name, brand, image_url, description, platform_prices = {} } = product;

    const prices = Object.entries(platform_prices);
    const validPrices = prices.filter(([, v]) => v?.price != null);
    const bestEntry = validPrices.reduce(
        (best, curr) => (!best || curr[1].price < best[1].price ? curr : best), null
    );
    const bestPlatform = bestEntry?.[0];
    const bestPrice = bestEntry?.[1]?.price;

    return (
        <Link href={`/product/${id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
            <div
                className="card"
                style={{ overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
            >
                {/* Image */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 200,
                        borderRadius: "16px 16px 0 0",
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    {image_url ? (
                        <img src={image_url} alt={name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 16 }} />
                    ) : (
                        <div style={{ fontSize: 64, opacity: 0.4 }}>🧴</div>
                    )}

                    {bestPlatform && (
                        <div style={{
                            position: "absolute", top: 12, right: 12,
                            background: "#16a34a", color: "#fff",
                            fontSize: 11, fontWeight: 700,
                            padding: "4px 10px", borderRadius: 999,
                            boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
                        }}>
                            Best: {formatPrice(bestPrice)}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    {brand && (
                        <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {brand}
                        </span>
                    )}

                    <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: "#0f2b1a" }}>
                        {name || "Untitled Product"}
                    </h3>

                    {description && (
                        <p style={{ fontSize: 13, color: "#3d6b52", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {description}
                        </p>
                    )}

                    {/* Platform prices */}
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
                        {validPrices.length === 0 ? (
                            <p style={{ fontSize: 13, color: "#7aab90" }}>No price data yet — run the scraper.</p>
                        ) : (
                            validPrices.map(([platform, data]) => {
                                const meta = PLATFORM_META[platform] || { label: platform, color: "#3d6b52", bg: "#f0faf4" };
                                const isBest = platform === bestPlatform;
                                return (
                                    <div
                                        key={platform}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "8px 12px", borderRadius: 8,
                                            background: isBest ? "#f0fdf4" : meta.bg,
                                            border: `1px solid ${isBest ? "#86efac" : "transparent"}`,
                                        }}
                                    >
                                        <span style={{ fontSize: 13, color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: isBest ? "#16a34a" : "#0f2b1a" }}>
                                                {formatPrice(data.price)}
                                            </span>
                                            {isBest && (
                                                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#16a34a", padding: "2px 6px", borderRadius: 999 }}>
                                                    LOWEST
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div style={{ color: "#16a34a", fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                        View price history →
                    </div>
                </div>
            </div>
        </Link>
    );
}
