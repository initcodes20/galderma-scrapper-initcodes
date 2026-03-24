"use client";

import Link from "next/link";

const PLATFORM_COLORS = {
    amazon: "#ea580c",
    flipkart: "#2563eb",
    nykaa: "#db2777",
};

export default function Navbar() {
    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid #d1e8da",
                padding: "0 24px",
                boxShadow: "0 1px 12px rgba(22,163,74,0.07)",
            }}
        >
            <div
                className="container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "62px",
                }}
            >
                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #16a34a, #059669)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 17,
                            boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                        }}
                    >
                        📊
                    </div>
                    <span
                        style={{
                            fontWeight: 800,
                            fontSize: 18,
                            background: "linear-gradient(135deg, #16a34a, #059669)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        PriceTracker
                    </span>
                </Link>

                {/* Platform indicators */}
                <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                    {Object.entries(PLATFORM_COLORS).map(([p, color]) => (
                        <span
                            key={p}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 13,
                                color,
                                fontWeight: 600,
                                textTransform: "capitalize",
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: color,
                                }}
                            />
                            {p}
                        </span>
                    ))}
                </div>
            </div>
        </nav>
    );
}
