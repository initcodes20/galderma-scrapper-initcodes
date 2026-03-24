import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, brand, description, sources } = await request.json();

    if (!name || !sources || !Array.isArray(sources)) {
      return NextResponse.json({ error: "Name and sources are required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for writes
    );

    // 1. Insert product
    const { data: product, error: pError } = await supabase
      .from("products")
      .insert([{ name, brand, description }])
      .select()
      .single();

    if (pError) throw pError;

    // 2. Insert sources
    const sourcesToInsert = sources
      .filter(s => s.url)
      .map(s => ({
        product_id: product.id,
        platform: s.platform.toLowerCase(),
        product_url: s.url
      }));

    if (sourcesToInsert.length > 0) {
      const { data: insertedSources, error: sError } = await supabase
        .from("product_sources")
        .insert(sourcesToInsert)
        .select();
      
      if (sError) throw sError;

      // 3. Insert initial prices into price_history
      const pricesToInsert = [];
      for (const src of insertedSources) {
        // Find the original source payload to get the price
        const originalSource = sources.find(s => s.platform.toLowerCase() === src.platform);
        if (originalSource && originalSource.price) {
          pricesToInsert.push({
            product_id: product.id,
            source_id: src.id,
            platform: src.platform,
            price: Number(originalSource.price)
          });
        }
      }

      if (pricesToInsert.length > 0) {
        const { error: histError } = await supabase
          .from("price_history")
          .insert(pricesToInsert);
        if (histError) console.error("Error saving initial price history:", histError);
      }
    }

    return NextResponse.json({ success: true, productId: product.id });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
