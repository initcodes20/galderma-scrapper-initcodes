import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

// GET /api/products/[id] — returns single product with current prices per platform
export async function GET(req, { params }) {
    const { id } = await params;

    const { data: product, error } = await supabase
        .from("products")
        .select("id, name, brand, image_url, description")
        .eq("id", id)
        .maybeSingle();

    if (error || !product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get latest price per platform
    const { data: prices } = await supabase
        .from("price_history")
        .select("platform, price, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false });

    const platformPrices = {};
    if (prices) {
        for (const row of prices) {
            if (!platformPrices[row.platform]) {
                platformPrices[row.platform] = {
                    price: row.price,
                    updated_at: row.created_at,
                };
            }
        }
    }

    // Also get sources so we have buy links
    const { data: sources } = await supabase
        .from("product_sources")
        .select("platform, product_url")
        .eq("product_id", id);

    const buyLinks = {};
    if (sources) {
        for (const s of sources) {
            buyLinks[s.platform] = s.product_url;
        }
    }

    return NextResponse.json({ ...product, platform_prices: platformPrices, buy_links: buyLinks });
}
