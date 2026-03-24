"use client";

import { useState } from "react";

export default function AddProductModal({ isOpen, onClose, onRefresh }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Cetaphil");
  const [description, setDescription] = useState("");
  const [urls, setUrls] = useState({
    amazon: "",
    flipkart: "",
    nykaa: ""
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sources = Object.entries(urls).map(([platform, url]) => ({
      platform,
      url: url.trim()
    })).filter(s => s.url);

    try {
      const res = await fetch("/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brand, description, sources })
      });

      if (!res.ok) throw new Error("Failed to add product");

      onRefresh?.();
      onClose();
      // Reset form
      setName("");
      setDescription("");
      setUrls({ amazon: "", flipkart: "", nykaa: "" });
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
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f2b1a" }}>Add New Product</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#7aab90" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#3d6b52", marginBottom: "6px" }}>Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bright Healthy Radiance Day Cream"
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d1e8da", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#3d6b52", marginBottom: "6px" }}>Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the product..."
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d1e8da", outline: "none", height: "80px", resize: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f2b1a" }}>Store URLs</p>
            
            {["Amazon", "Flipkart", "Nykaa"].map(platform => (
              <div key={platform}>
                <label style={{ display: "block", fontSize: "12px", color: "#7aab90", marginBottom: "4px" }}>{platform} URL</label>
                <input
                  type="url"
                  value={urls[platform.toLowerCase()]}
                  onChange={(e) => setUrls({...urls, [platform.toLowerCase()]: e.target.value})}
                  placeholder={`https://www.${platform.toLowerCase()}.in/...`}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1e8da", outline: "none", fontSize: "13px" }}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "12px", padding: "14px",
              background: "linear-gradient(135deg, #16a34a, #059669)",
              color: "#fff", border: "none", borderRadius: "12px",
              fontWeight: 700, cursor: "pointer", fontSize: "15px",
              boxShadow: "0 4px 12px rgba(22,163,74,0.2)"
            }}
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
