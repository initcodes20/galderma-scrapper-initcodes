import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function mock() {
  console.log("Inserting mock price data...");

  // Get the product
  const { data: product } = await supabase.from("products").select("id").eq("name", "Gentle Skin Cleanser").single();
  if (!product) {
    console.error("Product not found. Run check-db.js first.");
    return;
  }

  // Get the sources
  const { data: sources } = await supabase.from("product_sources").select("id, platform").eq("product_id", product.id);
  
  if (!sources || sources.length === 0) {
    console.error("Sources not found. Run check-db.js first.");
    return;
  }

  const history = [];
  const now = new Date();

  for (const source of sources) {
    const basePrice = source.platform === 'amazon' ? 450 : source.platform === 'flipkart' ? 480 : 510;
    
    // Create 5 days of history
    for (let i = 0; i < 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        history.push({
            product_id: product.id,
            source_id: source.id,
            platform: source.platform,
            price: basePrice + Math.floor(Math.random() * 20) - 10,
            created_at: date.toISOString()
        });
    }
  }

  const { error } = await supabase.from("price_history").insert(history);

  if (error) {
    console.error("❌ Failed to insert mock data:", error.message);
  } else {
    console.log("✅ Inserted 15 mock price records. Refresh your dashboard!");
  }
}

mock();
