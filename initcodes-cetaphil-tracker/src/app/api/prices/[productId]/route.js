import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

export async function GET(req, { params }) {
  const { productId } = await params;
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform"); // optional filter

  let query = supabase
    .from("price_history")
    .select("price, created_at, platform")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (platform) query = query.eq("platform", platform);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}