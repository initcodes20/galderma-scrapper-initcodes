import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

// GET /api/products — returns all products with their latest price per platform
export async function GET() {
    // Fetch all products
    const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, brand, image_url, description");

    if (productsError) {
        return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // For each product, get the latest price per platform
    const enriched = await Promise.all(
        products.map(async (product) => {
            const { data: prices } = await supabase
                .from("price_history")
                .select("platform, price, created_at")
                .eq("product_id", product.id)
                .order("created_at", { ascending: false });

            // Reduce to latest price per platform
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

            return { ...product, platform_prices: platformPrices };
        })
    );

    return NextResponse.json(enriched);
}
