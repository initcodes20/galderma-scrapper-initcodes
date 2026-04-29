"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PLATFORM_META = {
    amazon: { label: "Amazon", color: "var(--amazon)", bg: "var(--amazon-bg)" },
    flipkart: { label: "Flipkart", color: "var(--flipkart)", bg: "var(--flipkart-bg)" },
    nykaa: { label: "Nykaa", color: "var(--nykaa)", bg: "var(--nykaa-bg)" },
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

    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.preventDefault();
        
        if (!confirm(`Are you sure you want to stop tracking "${name}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete product");
            
            router.refresh();
        } catch (err) {
            alert(err.message);
            setIsDeleting(false);
        }
    };

    return (
        <Link href={`/product/${id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
            <div
                className="glass-panel"
                style={{ overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
            >
                {/* Image Area */}
                <div
                    style={{
                        background: "rgba(255,255,255,0.02)",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 220,
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    {/* Subtle glow behind image */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 100, height: 100, background: "var(--accent)", filter: "blur(60px)", opacity: 0.15, borderRadius: "50%" }}></div>

                    {image_url ? (
                        <img src={image_url} alt={name} style={{ maxHeight: "85%", maxWidth: "85%", objectFit: "contain", position: "relative", zIndex: 1, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))", mixBlendMode: "lighten" }} />
                    ) : (
                        <div style={{ fontSize: 64, opacity: 0.2, filter: "grayscale(1)" }}>🔭</div>
                    )}

                    {/* Delete Button */}
                    <div 
                        onClick={handleDelete}
                        style={{
                            position: "absolute", top: 12, left: 12,
                            background: "rgba(239, 68, 68, 0.15)", color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            fontSize: 18, width: 32, height: 32,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "50%", cursor: "pointer",
                            backdropFilter: "blur(4px)",
                            transition: "all 0.2s",
                            opacity: isDeleting ? 0.5 : 0.7,
                            zIndex: 10
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)" }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)" }}
                        title="Delete Product"
                    >
                        ×
                    </div>

                    {/* Best Price Badge */}
                    {bestPlatform && (
                        <div style={{
                            position: "absolute", top: 12, right: 12,
                            background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-light)",
                            border: "1px solid var(--border-glow)",
                            fontSize: 12, fontWeight: 700,
                            padding: "6px 12px", borderRadius: 999,
                            backdropFilter: "blur(8px)",
                            boxShadow: "0 4px 12px var(--accent-glow)",
                            zIndex: 10
                        }}>
                            Lowest: {formatPrice(bestPrice)}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        {brand && (
                            <div style={{ fontSize: 11, color: "var(--accent-light)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                                {brand}
                            </div>
                        )}
                        <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, color: "var(--text-primary)" }}>
                            {name || "Untitled Product"}
                        </h3>
                    </div>

                    {description && (
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {description}
                        </p>
                    )}

                    {/* Platform prices */}
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        {validPrices.length === 0 ? (
                            <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>No price data yet. Pending scrape...</p>
                        ) : (
                            validPrices.map(([platform, data]) => {
                                const meta = PLATFORM_META[platform] || { label: platform, color: "var(--text-secondary)", bg: "rgba(255,255,255,0.05)" };
                                const isBest = platform === bestPlatform;
                                return (
                                    <div
                                        key={platform}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "10px 14px", borderRadius: 10,
                                            background: isBest ? "rgba(16, 185, 129, 0.08)" : meta.bg,
                                            border: `1px solid ${isBest ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.03)"}`,
                                            position: "relative",
                                            overflow: "hidden"
                                        }}
                                    >
                                        {isBest && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--accent)" }}></div>}
                                        <span style={{ fontSize: 13, color: meta.color, fontWeight: 700, paddingLeft: isBest ? 6 : 0 }}>{meta.label}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: isBest ? "var(--accent-light)" : "var(--text-primary)" }}>
                                                {formatPrice(data.price)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
