"use client";

const PLATFORM_META = {
    amazon: { label: "Amazon", color: "var(--amazon)", bg: "var(--amazon-bg)", border: "rgba(249, 115, 22, 0.2)" },
    flipkart: { label: "Flipkart", color: "var(--flipkart)", bg: "var(--flipkart-bg)", border: "rgba(59, 130, 246, 0.2)" },
    nykaa: { label: "Nykaa", color: "var(--nykaa)", bg: "var(--nykaa-bg)", border: "rgba(236, 72, 153, 0.2)" },
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
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 15, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)" }}>
                No price data currently available. Scrape pending...
            </div>
        );
    }

    const bestPlatform = entries.reduce(
        (best, [platform, data]) => (!best || data.price < platformPrices[best].price ? platform : best), null
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {entries.map(([platform, data]) => {
                const meta = PLATFORM_META[platform] || { label: platform, color: "var(--accent-light)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" };
                const isBest = platform === bestPlatform;
                const buyUrl = buyLinks[platform];

                return (
                    <div
                        key={platform}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "20px 24px", borderRadius: 16,
                            background: isBest ? "rgba(16, 185, 129, 0.06)" : meta.bg,
                            border: `1px solid ${isBest ? "rgba(16, 185, 129, 0.4)" : meta.border}`,
                            transition: "all 0.2s ease",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: isBest ? "0 4px 20px rgba(16, 185, 129, 0.15)" : "none"
                        }}
                    >
                        {isBest && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--accent)", boxShadow: "0 0 12px var(--accent-glow)" }}></div>}
                        
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{
                                width: 12, height: 12, borderRadius: "50%",
                                background: meta.color, flexShrink: 0,
                                boxShadow: `0 0 12px ${meta.color}`
                            }} />
                            <div>
                                <div style={{ fontWeight: 800, color: meta.color, fontSize: 16, textTransform: "capitalize", letterSpacing: "0.02em" }}>{meta.label}</div>
                                {data.updated_at && (
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                                        Last checked: {new Date(data.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            {isBest && (
                                <span style={{
                                    fontSize: 11, fontWeight: 800, color: "#fff",
                                    background: "linear-gradient(135deg, var(--accent), var(--accent-dark))", padding: "4px 12px", borderRadius: 999,
                                    letterSpacing: "0.05em", boxShadow: "0 2px 10px var(--accent-glow)"
                                }}>
                                    🏆 BEST VALUE
                                </span>
                            )}
                            <div style={{ fontSize: 28, fontWeight: 800, color: isBest ? "var(--accent-light)" : "var(--text-primary)", letterSpacing: "-0.02em" }}>
                                {formatPrice(data.price)}
                            </div>
                            {buyUrl && (
                                <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"
                                    style={{ fontSize: 14, padding: "10px 20px", textDecoration: "none", borderRadius: 12 }}>
                                    Go to Store →
                                </a>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
