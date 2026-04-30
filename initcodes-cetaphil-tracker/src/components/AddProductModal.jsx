"use client";

import { useState } from "react";

export default function AddProductModal({ isOpen, onClose, onRefresh }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setSearchError("");
    setSearchResults(null);

    try {
      const scraperUrl = process.env.NEXT_PUBLIC_SCRAPER_API_URL || "http://localhost:5001";
      const res = await fetch(`${scraperUrl}/search-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: name })
      });

      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setSearchError(err.message || "Failed to search product.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!searchResults) return;
    setLoading(true);

    const sources = ["amazon", "flipkart", "nykaa"]
      .map(platform => {
        const platformData = searchResults.results[platform];
        if (platformData && platformData.url) {
          return { platform, url: platformData.url, price: platformData.price };
        }
        return null;
      })
      .filter(Boolean);

    try {
      const res = await fetch("/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brand: "Searched Product", description, sources })
      });

      if (!res.ok) throw new Error("Failed to add product to tracker");

      onRefresh?.();
      onClose();
      setName("");
      setDescription("");
      setSearchResults(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.75)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
      backdropFilter: "blur(12px)"
    }}>
      <div className="animate-fade-in" style={{
        background: "var(--bg-secondary)", padding: "32px", borderRadius: "24px",
        width: "90%", maxWidth: "520px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)", position: "relative",
        overflow: "hidden"
      }}>
        {/* Glow effect */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 200, height: 200, background: "var(--accent)", filter: "blur(80px)", opacity: 0.15, borderRadius: "50%", pointerEvents: "none" }}></div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>✨</span> Track New Item
          </h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", cursor: "pointer", color: "var(--text-secondary)", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.1)" }} onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", zIndex: 1 }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cetaphil Cleanser 118ml"
              style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", outline: "none", boxSizing: "border-box", color: "#fff", fontSize: 15, transition: "border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.15)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none" }}
              disabled={loading || searchResults}
            />
          </div>

          {!searchResults && !loading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "-8px" }}>
              {[
                "CETAPHIL Cleanser Lotion 118ml",
                "CETAPHIL Moisturizer Cream 100g",
                "CETAPHIL Baby Daily Lotion 400ml",
                "CETAPHIL Oily Skin Cleanser 118ml",
                "CETAPHIL Sun SPF50+ Cream Gel 50ml",
                "CETAPHIL Gentle Skin Cleanser 236ml"
              ].map(item => (
                <button
                  key={item}
                  onClick={() => setName(item)}
                  style={{
                    fontSize: "11px",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)" }}
                >
                  {item.replace("CETAPHIL ", "")}
                </button>
              ))}
            </div>
          )}

          {!searchResults && (
            <button
              onClick={handleSearch}
              disabled={loading || !name.trim()}
              className="btn btn-primary"
              style={{ padding: "16px", width: "100%", fontSize: 16, marginTop: 8 }}
            >
              {loading ? (
                 <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Scraping Platforms...
                 </span>
              ) : "Find Best Prices"}
            </button>
          )}

          {searchError && <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 10, color: "#f87171", fontSize: "13px" }}>{searchError}</div>}

          {searchResults && (
            <div className="animate-fade-in" style={{ marginTop: "8px", padding: "20px", borderRadius: "16px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-light)" }}>Search Results</h3>
                {searchResults.cached && <span style={{ fontSize: "11px", color: "var(--accent)", background: "var(--accent-bg)", padding: "4px 8px", borderRadius: 999, fontWeight: 700 }}>CACHED</span>}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {['amazon', 'flipkart', 'nykaa'].map(platform => {
                  const data = searchResults.results[platform];
                  const hasMismatch = data && data.quantity_mismatch;
                  
                  // Default colors
                  let platformColor = "var(--text-secondary)";
                  if (platform === 'amazon') platformColor = "var(--amazon)";
                  if (platform === 'flipkart') platformColor = "var(--flipkart)";
                  if (platform === 'nykaa') platformColor = "var(--nykaa)";

                  return (
                    <div key={platform} style={{
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: hasMismatch ? "rgba(245, 158, 11, 0.05)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${hasMismatch ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.05)"}`
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 700, color: platformColor }}>{platform}</span>
                        <span style={{ fontWeight: 800, color: data && data.price ? "#fff" : "var(--text-muted)" }}>
                          {data && data.price
                            ? `₹${data.price.toLocaleString('en-IN')}`
                            : <span>Not Found</span>
                          }
                        </span>
                      </div>

                      {data && data.name && (
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px", lineClamp: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {data.name}
                        </div>
                      )}

                      {hasMismatch && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          marginTop: "8px", fontSize: "12px", color: "#fbbf24",
                          background: "rgba(245, 158, 11, 0.1)", borderRadius: "8px", padding: "6px 10px"
                        }}>
                          <span>⚠️</span>
                          <span>
                            Wanted <strong>{data.requested_qty}</strong> — Found <strong>{data.found_qty || "different size"}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#fff", fontSize: "16px" }}>
                <span>Best Available Price:</span>
                <span style={{ color: "var(--accent-light)" }}>{searchResults.best_price ? `₹${searchResults.best_price.toLocaleString('en-IN')}` : 'N/A'}</span>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: "24px", width: "100%", padding: "16px", fontSize: 16 }}
              >
                {loading ? "Adding to Dashboard..." : "Track This Product"}
              </button>
              
              <button
                onClick={() => setSearchResults(null)}
                disabled={loading}
                className="btn btn-ghost"
                style={{ marginTop: "12px", width: "100%", padding: "12px", fontSize: 14 }}
              >
                ← Edit Search Query
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
