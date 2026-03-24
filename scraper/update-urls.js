import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function update() {
  console.log("Updating product source URLs in Supabase...");

  const updates = [
    { platform: "amazon", new_url: "https://www.amazon.in/Cetaphil-Hydrating-Sulphate-Free-Niacinamide-Sensitive/dp/B01CCGW4OE" },
    { platform: "flipkart", new_url: "https://www.flipkart.com/cetaphil-gentle-skin-cleanser-mild-non-irritating-formula-dry-normal-sensitive-face-wash/p/itmadc9349d60faf" },
    { platform: "nykaa", new_url: "https://www.nykaa.com/cetaphil-cleansing-lotion/p/22032?skuId=22031" }
  ];

  for (const item of updates) {
    const { error } = await supabase
      .from("product_sources")
      .update({ product_url: item.new_url })
      .eq("platform", item.platform);

    if (error) {
      console.error(`❌ Failed to update ${item.platform} URL:`, error.message);
    } else {
      console.log(`✅ Updated ${item.platform} URL.`);
    }
  }
}

update();
