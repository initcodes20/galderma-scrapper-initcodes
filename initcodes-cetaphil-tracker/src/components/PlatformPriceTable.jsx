"use client";

const PLATFORM_META = {
    amazon: { label: "Amazon", color: "#ea580c", bg: "rgba(234,88,12,0.06)", border: "rgba(234,88,12,0.2)" },
    flipkart: { label: "Flipkart", color: "#2563eb", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.2)" },
    nykaa: { label: "Nykaa", color: "#db2777", bg: "rgba(219,39,119,0.06)", border: "rgba(219,39,119,0.2)" },
};

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(price);
}

export default function PlatformPriceTable({ platformPrices = {}, buyLinks = {} }) {
    const entries = Object.entries(platformPrices);

    if (entries.length === 0) {
        return (
            <div style={{ padding: 24, textAlign: "center", color: "#7aab90", fontSize: 14 }}>
                No price data yet. Run the scraper to populate prices.
            </div>
        );
    }

    const bestPlatform = entries.reduce(
        (best, [platform, data]) => (!best || data.price < platformPrices[best].price ? platform : best), null
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.map(([platform, data]) => {
                const meta = PLATFORM_META[platform] || { label: platform, color: "#16a34a", bg: "#f0faf4", border: "#d1e8da" };
                const isBest = platform === bestPlatform;
                const buyUrl = buyLinks[platform];

                return (
                    <div
                        key={platform}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "16px 20px", borderRadius: 12,
                            background: isBest ? "#f0fdf4" : meta.bg,
                            border: `1px solid ${isBest ? "#86efac" : meta.border}`,
                            transition: "all 0.18s ease",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 10, height: 10, borderRadius: "50%",
                                background: meta.color, flexShrink: 0,
                            }} />
                            <div>
                                <div style={{ fontWeight: 700, color: meta.color, fontSize: 15 }}>{meta.label}</div>
                                {data.updated_at && (
                                    <div style={{ fontSize: 11, color: "#7aab90", marginTop: 2 }}>
                                        Updated {new Date(data.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {isBest && (
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: "#fff",
                                    background: "#16a34a", padding: "3px 10px", borderRadius: 999,
                                }}>
                                    🏆 BEST PRICE
                                </span>
                            )}
                            <div style={{ fontSize: 22, fontWeight: 800, color: isBest ? "#16a34a" : "#0f2b1a" }}>
                                {formatPrice(data.price)}
                            </div>
                            {buyUrl && (
                                <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"
                                    style={{ fontSize: 13, padding: "8px 14px", textDecoration: "none" }}>
                                    Buy →
                                </a>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
