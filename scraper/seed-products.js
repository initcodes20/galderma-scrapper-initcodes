import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const products = [
  "CETAPHIL Cleanser Lotion 118ml",
  "CETAPHIL Moisturizer Cream 100g",
  "CETAPHIL Baby Daily Lotion 400ml",
  "CETAPHIL Oily Skin Cleanser 118ml",
  "CETAPHIL Sun SPF50+ Cream Gel 50ml",
  "CETAPHIL Gentle Skin Cleanser 236ml",
];

async function seed() {
  console.log("Seeding hardcoded products...");

  for (const name of products) {
    // Check if product already exists
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      console.log(`- Product "${name}" already exists, skipping.`);
      continue;
    }

    // Insert product
    const { data: newProduct, error } = await supabase
      .from("products")
      .insert({
        name: name,
        brand: "Cetaphil",
        description: `Official ${name} tracker.`
      })
      .select()
      .single();

    if (error) {
      console.error(`- Error inserting "${name}":`, error.message);
    } else {
      console.log(`- Seeded product: "${name}"`);
    }
  }

  console.log("Seeding complete!");
}

seed();
