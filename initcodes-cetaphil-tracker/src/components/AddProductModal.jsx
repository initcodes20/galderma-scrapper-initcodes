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
      background: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "#fff", padding: "32px", borderRadius: "20px",
        width: "90%", maxWidth: "500px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f2b1a" }}>Search & Add Product</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#7aab90" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#3d6b52", marginBottom: "6px" }}>Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cetaphil Cleanser 118ml"
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d1e8da", outline: "none", boxSizing: "border-box" }}
              disabled={loading || searchResults}
            />
          </div>

          {!searchResults && (
            <button
              onClick={handleSearch}
              disabled={loading || !name.trim()}
              style={{
                padding: "14px",
                background: "linear-gradient(135deg, #16a34a, #059669)",
                color: "#fff", border: "none", borderRadius: "12px",
                fontWeight: 700, cursor: "pointer", fontSize: "15px",
                boxShadow: "0 4px 12px rgba(22,163,74,0.2)",
                opacity: loading || !name.trim() ? 0.7 : 1
              }}
            >
              {loading ? "Searching Multi-Platform..." : "Find Product"}
            </button>
          )}

          {searchError && <p style={{ color: "red", fontSize: "13px" }}>{searchError}</p>}

          {searchResults && (
            <div style={{ marginTop: "16px", padding: "16px", borderRadius: "12px", background: "#f0fdf4", border: "1px solid #dcfce7" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#166534", marginBottom: "12px" }}>Search Results</h3>
              {searchResults.cached && <p style={{ fontSize: "12px", color: "green", marginBottom: "8px" }}>Loaded from cache!</p>}
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {['amazon', 'flipkart', 'nykaa'].map(platform => {
                  const data = searchResults.results[platform];
                  return (
                    <div key={platform} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#065f46" }}>
                      <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{platform}:</span>
                      <span>{data && data.price ? `₹${data.price}` : <span style={{color: "red"}}>Not Found</span>}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#166534", fontSize: "16px" }}>
                <span>Best Price:</span>
                <span>{searchResults.best_price ? `₹${searchResults.best_price}` : 'N/A'}</span>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  marginTop: "24px", width: "100%", padding: "14px",
                  background: "#059669", color: "#fff", border: "none", borderRadius: "12px",
                  fontWeight: 700, cursor: "pointer", fontSize: "15px"
                }}
              >
                {loading ? "Saving to Tracker..." : "Save to Tracker"}
              </button>
              
              <button
                onClick={() => setSearchResults(null)}
                disabled={loading}
                style={{
                  marginTop: "8px", width: "100%", padding: "10px",
                  background: "transparent", color: "#059669", border: "1px solid #059669", borderRadius: "12px",
                  fontWeight: 600, cursor: "pointer", fontSize: "14px"
                }}
              >
                Try Another Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
