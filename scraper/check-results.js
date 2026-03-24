import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking latest price history...");
  const { data, error } = await supabase
    .from("price_history")
    .select("platform, price, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("❌ Error fetching price history:", error.message);
    return;
  }

  console.table(data);
}

check();
