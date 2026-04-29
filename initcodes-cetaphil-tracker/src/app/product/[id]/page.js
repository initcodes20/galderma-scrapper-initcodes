"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PriceChart from "@/components/PriceChart";
import PlatformPriceTable from "@/components/PlatformPriceTable";

const PLATFORM_COLORS = {
    amazon: "var(--amazon)",
    flipkart: "var(--flipkart)",
    nykaa: "var(--nykaa)",
};

export default function ProductPage() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [activePlatforms, setActivePlatforms] = useState(["amazon", "flipkart", "nykaa"]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProduct() {
            const res = await fetch(`/api/products/${id}`);
            const json = await res.json();
            setProduct(json);
            setLoading(false);
        }
        fetchProduct();
    }, [id]);

    function togglePlatform(platform) {
        setActivePlatforms((prev) =>
            prev.includes(platform)
                ? prev.length > 1 ? prev.filter((p) => p !== platform) : prev
                : [...prev, platform]
        );
    }

    if (loading) {
        return (
            <div style={{ padding: "64px 24px" }}>
                <div className="container">
                    <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 24 }} />
                    <div className="skeleton" style={{ height: 240, marginBottom: 32, borderRadius: 24 }} />
                    <div className="skeleton" style={{ height: 400, borderRadius: 24 }} />
                </div>
            </div>
        );
    }

    if (!product || product.error) {
        return (
            <div style={{ padding: "100px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.5 }}>⚠️</div>
                <h2 style={{ color: "var(--text-secondary)", fontSize: 24, fontWeight: 800 }}>Product not found</h2>
            </div>
        );
    }

    const { name, brand, image_url, description, platform_prices = {}, buy_links = {} } = product;
    const allPrices = Object.values(platform_prices).map((v) => v.price).filter(Boolean);
    const lowestPrice = allPrices.length ? Math.min(...allPrices) : null;
    const highestPrice = allPrices.length ? Math.max(...allPrices) : null;
    const savings = lowestPrice && highestPrice ? highestPrice - lowestPrice : null;

    return (
        <div style={{ minHeight: "100vh", paddingBottom: 100 }}>
            {/* Header Area */}
            <div style={{
                position: "relative",
                padding: "48px 24px 64px",
                borderBottom: "1px solid var(--border)",
                overflow: "hidden"
            }}>
                {/* Background glow */}
                <div style={{ position: "absolute", top: -100, right: 0, width: "50%", height: 400, background: "var(--accent)", filter: "blur(120px)", opacity: 0.08, zIndex: -1 }}></div>

                <div className="container">
                    <a
                        href="/"
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14, textDecoration: "none", marginBottom: 32, fontWeight: 600, transition: "color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--accent-light)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
                    >
                        ← Return to Dashboard
                    </a>

                    <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
                        {/* Image Panel */}
                        <div style={{
                            width: 280, height: 280,
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: 24,
                            border: "1px solid rgba(255,255,255,0.05)",
                            boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            position: "relative"
                        }}>
                            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 150, height: 150, background: "var(--accent)", filter: "blur(60px)", opacity: 0.1, borderRadius: "50%" }}></div>
                            {image_url ? (
                                <img src={image_url} alt={name} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain", position: "relative", zIndex: 1, filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.6))", mixBlendMode: "lighten" }} />
                            ) : (
                                <span style={{ fontSize: 80, opacity: 0.2, filter: "grayscale(1)" }}>🔭</span>
                            )}
                        </div>

                        {/* Product Info */}
                        <div style={{ flex: 1, minWidth: 300 }}>
                            {brand && (
                                <div style={{ display: "inline-block", color: "var(--accent)", background: "var(--accent-bg)", padding: "4px 12px", borderRadius: 999, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, border: "1px solid var(--border-glow)" }}>
                                    {brand}
                                </div>
                            )}
                            <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 16, letterSpacing: "-0.02em" }}>
                                {name}
                            </h1>
                            {description && (
                                <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 32, maxWidth: 600 }}>
                                    {description}
                                </p>
                            )}

                            {lowestPrice && (
                                <div style={{ display: "flex", gap: 40, flexWrap: "wrap", padding: "20px 24px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", display: "inline-flex" }}>
                                    <div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 4 }}>Best Market Price</div>
                                        <div className="gradient-text" style={{ fontSize: 36, fontWeight: 800 }}>
                                            ₹{lowestPrice.toLocaleString("en-IN")}
                                        </div>
                                    </div>
                                    {savings > 0 && (
                                        <div style={{ paddingLeft: 40, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 4 }}>Maximum Savings</div>
                                            <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)" }}>
                                                ₹{savings.toLocaleString("en-IN")}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div style={{ padding: "48px 24px" }}>
                <div className="container">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 32, alignItems: "start" }}>

                        {/* Live Prices */}
                        <div className="glass-panel" style={{ padding: 32 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 24 }}>🛒</span> Live Vendor Prices
                            </h2>
                            <PlatformPriceTable platformPrices={platform_prices} buyLinks={buy_links} />
                        </div>

                        {/* Chart Analytics */}
                        <div className="glass-panel" style={{ padding: 32 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 24 }}>📈</span> Price Analytics
                                </h2>

                                {/* Platform filter toggles */}
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {Object.entries(PLATFORM_COLORS).map(([platform, color]) => {
                                        const isActive = activePlatforms.includes(platform);
                                        return (
                                            <button
                                                key={platform}
                                                onClick={() => togglePlatform(platform)}
                                                style={{
                                                    padding: "8px 16px", borderRadius: 999,
                                                    border: `1px solid ${isActive ? color : "rgba(255,255,255,0.1)"}`,
                                                    background: isActive ? `${color}22` : "rgba(255,255,255,0.03)",
                                                    color: isActive ? color : "var(--text-muted)",
                                                    fontSize: 13, fontWeight: 700,
                                                    cursor: "pointer", textTransform: "capitalize",
                                                    transition: "all 0.2s ease",
                                                    boxShadow: isActive ? `0 0 12px ${color}33` : "none"
                                                }}
                                            >
                                                {platform}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <PriceChart productId={id} activePlatforms={activePlatforms} />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
