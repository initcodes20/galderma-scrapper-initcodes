"use client";

import Link from "next/link";

const PLATFORM_COLORS = {
    amazon: "var(--amazon)",
    flipkart: "var(--flipkart)",
    nykaa: "var(--nykaa)",
};

export default function Navbar() {
    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: "var(--bg-glass)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--border)",
                padding: "0 24px",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
            }}
        >
            <div
                className="container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "68px",
                }}
            >
                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            boxShadow: "0 0 16px var(--accent-glow)",
                            border: "1px solid rgba(255,255,255,0.2)"
                        }}
                    >
                        🔭
                    </div>
                    <span
                        className="gradient-text"
                        style={{
                            fontWeight: 800,
                            fontSize: 20,
                            letterSpacing: "-0.03em"
                        }}
                    >
                        PriceTracker
                    </span>
                </Link>

                {/* Platform indicators */}
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    {Object.entries(PLATFORM_COLORS).map(([p, color]) => (
                        <span
                            key={p}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 13,
                                color: "var(--text-secondary)",
                                fontWeight: 600,
                                textTransform: "capitalize",
                                letterSpacing: "0.02em"
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: color,
                                    boxShadow: `0 0 8px ${color}`,
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
