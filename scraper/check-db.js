import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking Supabase connection...");
  
  // 1. Check if 'products' table exists
  const { data: products, error: pError } = await supabase.from("products").select("id").limit(1);
  if (pError) {
    console.error("❌ Error accessing 'products' table:", pError.message);
    console.log("It seems the tables haven't been created yet. Please run the provided SQL in Supabase SQL Editor.");
    return;
  }
  console.log("✅ 'products' table exists.");

  // 2. Check if 'product_sources' table has data
  const { data: sources, error: sError } = await supabase.from("product_sources").select("id");
  if (sError) {
    console.error("❌ Error accessing 'product_sources' table:", sError.message);
    return;
  }

  if (sources.length === 0) {
    console.log("ℹ️ 'product_sources' table is empty. Seeding a sample product...");
    
    // Seed a product
    const { data: newProduct, error: npError } = await supabase.from("products").insert({
      name: "Gentle Skin Cleanser",
      brand: "Cetaphil",
      image_url: "https://images.nykaa.com/media/catalog/product/6/8/683fed76311140604100_1.jpg",
      description: "Soothing, non-irritating cleanser ideal for face and body."
    }).select().single();

    if (npError) {
      console.error("❌ Failed to seed product:", npError.message);
      return;
    }

    console.log("✅ Seeded product:", newProduct.name);

    // Seed sources
    const sampleSources = [
      { product_id: newProduct.id, platform: "amazon", product_url: "https://www.amazon.in/Cetaphil-Gentle-Skin-Cleanser-125ml/dp/B01CCGV4O6" },
      { product_id: newProduct.id, platform: "flipkart", product_url: "https://www.flipkart.com/cetaphil-gentle-skin-cleanser-125-ml/p/itm09100778c75dd" },
      { product_id: newProduct.id, platform: "nykaa", product_url: "https://www.nykaa.com/cetaphil-gentle-skin-cleanser/p/20995" }
    ];

    const { error: seedError } = await supabase.from("product_sources").insert(sampleSources);

    if (seedError) {
      console.error("❌ Failed to seed sources:", seedError.message);
      return;
    }

    console.log("✅ Seeded 3 product sources. You can now run the scraper.");
  } else {
    console.log("✅ Database already contains product sources.");
  }
}

check();
