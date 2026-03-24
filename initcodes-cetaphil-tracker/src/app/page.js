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
    <div style={{ minHeight: "100vh", background: "#f0faf4" }}>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(160deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)",
        borderBottom: "1px solid #d1e8da",
        padding: "60px 24px 48px",
        textAlign: "center",
      }}>
        <div className="container">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff", border: "1px solid #86efac",
            borderRadius: 999, padding: "6px 16px",
            fontSize: 13, color: "#16a34a", fontWeight: 600, marginBottom: 24,
            boxShadow: "0 2px 8px rgba(22,163,74,0.1)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            Live Price Tracking
          </div>

          <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 14, color: "#0f2b1a" }}>
            Track{" "}
            <span style={{ background: "linear-gradient(135deg, #16a34a, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Cetaphil Prices
            </span>
            <br />Across Every Platform
          </h1>

          <p style={{ fontSize: 17, color: "#3d6b52", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.6 }}>
            Compare real-time prices on Amazon, Flipkart, and Nykaa. Never overpay again.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", marginBottom: 40 }}>
            {[
              { label: "Products Tracked", value: products.length },
              { label: "Platforms", value: 3 },
              { label: "Updated Every", value: "6h" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#16a34a" }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#7aab90", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <AddProductButton />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section style={{ padding: "44px 24px 80px" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f2b1a" }}>
              Tracked Products
              <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 500, color: "#7aab90" }}>
                {products.length} {products.length === 1 ? "product" : "products"}
              </span>
            </h2>
            <AddProductButton />
          </div>

          {products.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "72px 24px",
              background: "#fff", borderRadius: 20,
              border: "1px solid #d1e8da",
              boxShadow: "0 2px 16px rgba(22,163,74,0.06)",
            }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🧴</div>
              <h3 style={{ fontSize: 20, marginBottom: 8, color: "#0f2b1a" }}>No Products Yet</h3>
              <p style={{ color: "#3d6b52", fontSize: 15, maxWidth: 380, margin: "0 auto 24px" }}>
                Start tracking by adding a product sources from Amazon, Flipkart, or Nykaa.
              </p>
              <AddProductButton />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 24 }}>
              {products.map((product, i) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
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