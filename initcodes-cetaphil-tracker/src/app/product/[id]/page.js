"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PriceChart from "@/components/PriceChart";
import PlatformPriceTable from "@/components/PlatformPriceTable";

const PLATFORM_COLORS = {
    amazon: "#ea580c",
    flipkart: "#2563eb",
    nykaa: "#db2777",
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
            <div style={{ padding: "48px 24px" }}>
                <div className="container">
                    <div className="skeleton" style={{ height: 36, width: 280, marginBottom: 20 }} />
                    <div className="skeleton" style={{ height: 200, marginBottom: 20 }} />
                    <div className="skeleton" style={{ height: 300 }} />
                </div>
            </div>
        );
    }

    if (!product || product.error) {
        return (
            <div style={{ padding: "80px 24px", textAlign: "center" }}>
                <h2 style={{ color: "#7aab90" }}>Product not found</h2>
            </div>
        );
    }

    const { name, brand, image_url, description, platform_prices = {}, buy_links = {} } = product;
    const allPrices = Object.values(platform_prices).map((v) => v.price).filter(Boolean);
    const lowestPrice = allPrices.length ? Math.min(...allPrices) : null;
    const highestPrice = allPrices.length ? Math.max(...allPrices) : null;
    const savings = lowestPrice && highestPrice ? highestPrice - lowestPrice : null;

    return (
        <div style={{ minHeight: "100vh", background: "#f0faf4", paddingBottom: 80 }}>

            {/* Header */}
            <div style={{
                background: "linear-gradient(160deg, #f0fdf4, #dcfce7)",
                borderBottom: "1px solid #d1e8da",
                padding: "36px 24px 32px",
            }}>
                <div className="container">
                    <a
                        href="/"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#7aab90", fontSize: 14, textDecoration: "none", marginBottom: 22, fontWeight: 500 }}
                        onMouseEnter={e => e.currentTarget.style.color = "#16a34a"}
                        onMouseLeave={e => e.currentTarget.style.color = "#7aab90"}
                    >
                        ← Back to all products
                    </a>

                    <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                        {/* Image */}
                        <div style={{
                            width: 190, height: 190,
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid #d1e8da",
                            boxShadow: "0 2px 16px rgba(22,163,74,0.08)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            {image_url ? (
                                <img src={image_url} alt={name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 16 }} />
                            ) : (
                                <span style={{ fontSize: 72, opacity: 0.35 }}>🧴</span>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 240 }}>
                            {brand && (
                                <p style={{ color: "#16a34a", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                                    {brand}
                                </p>
                            )}
                            <h1 style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 800, lineHeight: 1.25, color: "#0f2b1a", marginBottom: 10 }}>
                                {name}
                            </h1>
                            {description && (
                                <p style={{ fontSize: 15, color: "#3d6b52", lineHeight: 1.6, marginBottom: 20 }}>
                                    {description}
                                </p>
                            )}

                            {lowestPrice && (
                                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                                    <div>
                                        <div style={{ fontSize: 30, fontWeight: 800, color: "#16a34a" }}>
                                            ₹{lowestPrice.toLocaleString("en-IN")}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#7aab90" }}>Lowest price</div>
                                    </div>
                                    {savings > 0 && (
                                        <div>
                                            <div style={{ fontSize: 30, fontWeight: 800, color: "#059669" }}>
                                                ₹{savings.toLocaleString("en-IN")}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#7aab90" }}>Max savings</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: "36px 24px" }}>
                <div className="container">
                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

                        {/* Price Comparison */}
                        <div className="card" style={{ padding: 28 }}>
                            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: "#0f2b1a" }}>
                                💰 Current Prices
                            </h2>
                            <PlatformPriceTable platformPrices={platform_prices} buyLinks={buy_links} />
                        </div>

                        {/* Price History */}
                        <div className="card" style={{ padding: 28 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f2b1a" }}>📈 Price History</h2>

                                {/* Platform filter */}
                                <div style={{ display: "flex", gap: 8 }}>
                                    {Object.entries(PLATFORM_COLORS).map(([platform, color]) => {
                                        const isActive = activePlatforms.includes(platform);
                                        return (
                                            <button
                                                key={platform}
                                                onClick={() => togglePlatform(platform)}
                                                style={{
                                                    padding: "6px 14px", borderRadius: 999,
                                                    border: `1px solid ${isActive ? color : "#d1e8da"}`,
                                                    background: isActive ? `${color}18` : "#fff",
                                                    color: isActive ? color : "#7aab90",
                                                    fontSize: 12, fontWeight: 600,
                                                    cursor: "pointer", textTransform: "capitalize",
                                                    transition: "all 0.18s ease",
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
