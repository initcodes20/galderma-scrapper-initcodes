import ProductCard from "@/components/ProductCard";
import AddProductButton from "@/components/AddProductButton";
import { createClient } from "@supabase/supabase-js";

async function getProducts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );

  const { data: products } = await supabase
    .from("products")
    .select("id, name, brand, image_url, description");

  if (!products) return [];

  const enriched = await Promise.all(
    products.map(async (product) => {
      const { data: prices } = await supabase
        .from("price_history")
        .select("platform, price, created_at")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });

      const platformPrices = {};
      if (prices) {
        for (const row of prices) {
          if (!platformPrices[row.platform]) {
            platformPrices[row.platform] = { price: row.price, updated_at: row.created_at };
          }
        }
      }
      return { ...product, platform_prices: platformPrices };
    })
  );
  return enriched;
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      
      {/* Dynamic Background Glow */}
      <div style={{
        position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 1000, height: 600,
        background: "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15), transparent 70%)",
        pointerEvents: "none", zIndex: -1
      }}></div>

      {/* Hero */}
      <section style={{
        padding: "80px 24px 64px",
        textAlign: "center",
        position: "relative",
        borderBottom: "1px solid var(--border)"
      }}>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="animate-fade-in" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 999, padding: "8px 18px",
            fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 32,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            backdropFilter: "blur(12px)"
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-light)", display: "inline-block", boxShadow: "0 0 10px var(--accent-light)" }} />
            Live Market Tracking
          </div>

          <h1 className="animate-fade-in" style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16, color: "#fff", animationDelay: "100ms" }}>
            Track{" "}
            <span className="gradient-text" style={{ position: "relative", display: "inline-block" }}>
              Market Prices
              <span style={{ position: "absolute", inset: 0, background: "inherit", filter: "blur(20px)", opacity: 0.5, zIndex: -1 }}></span>
            </span>
            <br />Across Every Platform
          </h1>

          <p className="animate-fade-in" style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 540, margin: "0 auto 48px", lineHeight: 1.6, animationDelay: "200ms" }}>
            Compare real-time data on Amazon, Flipkart, and Nykaa. Instantly identify the lowest price and save money.
          </p>

          {/* Stats */}
          <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", animationDelay: "300ms" }}>
            {[
              { label: "Products Tracked", value: products.length },
              { label: "Platforms", value: 3 },
              { label: "Update Cycle", value: "Live" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center", padding: "16px 32px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.2)" }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Products Grid */}
      <section style={{ padding: "64px 24px 100px" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              Tracked Items
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-light)", background: "var(--accent-bg)", padding: "4px 12px", borderRadius: 999, border: "1px solid var(--border-glow)" }}>
                {products.length} {products.length === 1 ? "Item" : "Items"}
              </span>
            </h2>
            <AddProductButton />
          </div>

          {products.length === 0 ? (
            <div className="glass-panel" style={{
              textAlign: "center", padding: "100px 24px",
              display: "flex", flexDirection: "column", alignItems: "center"
            }}>
              <div style={{ fontSize: 72, marginBottom: 24, filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))" }}>🔭</div>
              <h3 style={{ fontSize: 24, marginBottom: 12, color: "#fff", fontWeight: 800 }}>No Products Yet</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 400, margin: "0 auto" }}>
                Your tracker is currently empty. Start adding products to compare prices instantly.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 }}>
              {products.map((product, i) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${(i % 10) * 80}ms`, height: "100%" }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}