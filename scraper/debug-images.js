import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, image_url");

  if (error) {
    console.error("error", error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

check();
