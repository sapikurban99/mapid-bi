import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to determine quarter from date
function getQuarter(dateStr: string) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    const q = Math.ceil(month / 3);
    return `Q${q} ${year}`;
}

// Mapper for category names from CSV to Dashboard
const CATEGORY_MAP: Record<string, string> = {
    'MAPID Academy': 'Webgis Academy',
    'Platform': 'Platform',
    // Add others if they appear in CSV
};

export async function POST() {
    try {
        // 1. Fetch aggregated actuals from raw payments
        const { data: payments, error: pError } = await supabase
            .from('revenue_payments')
            .select('*');

        if (pError) throw pError;

        const aggregation: Record<string, Record<string, number>> = {};
        payments.forEach(p => {
            const quarter = getQuarter(p.payment_date);
            const rawCategory = p.category;
            const mappedProduct = CATEGORY_MAP[rawCategory] || rawCategory;

            if (!aggregation[mappedProduct]) aggregation[mappedProduct] = {};
            if (!aggregation[mappedProduct][quarter]) aggregation[mappedProduct][quarter] = 0;
            
            aggregation[mappedProduct][quarter] += Number(p.amount) || 0;
        });

        // 2. Fetch current revenue records (to preserve targets)
        const { data: existingRevenue, error: rError } = await supabase
            .from('revenue')
            .select('*');

        if (rError) throw rError;

        // 3. Prepare updates/inserts
        const updates: any[] = [];
        const processedKeys = new Set<string>();

        // Update existing items
        (existingRevenue || []).forEach((item: any) => {
            const actual = aggregation[item.sub_product]?.[item.quarter] || 0;
            const target = Number(item.target) || 0;
            const achievement = target > 0 ? Number(((actual / target) * 100).toFixed(2)) : 0;

            updates.push({
                ...item,
                actual: actual,
                achievement_pct: achievement
            });
            processedKeys.add(`${item.sub_product}|${item.quarter}`);
        });

        // Add new items from aggregation that don't exist yet
        for (const [product, quarters] of Object.entries(aggregation)) {
            for (const [quarter, actual] of Object.entries(quarters)) {
                if (!processedKeys.has(`${product}|${quarter}`)) {
                    updates.push({
                        sub_product: product,
                        quarter: quarter,
                        actual: actual,
                        target: 0,
                        achievement_pct: 0
                    });
                }
            }
        }

        // 4. Upsert to the 'revenue' table
        // We use delete-and-insert (replaceTable pattern) or straight upsert
        // To be safe and consistent with biService, we'll use the replace approach if many changes
        // But for this API, upsert with id is fine if id exists, or we use the replaceTable pattern
        
        // Let's use delete and insert to be 100% consistent with biService.ts replaceTable
        const { error: dError } = await supabase.from('revenue').delete().neq('sub_product', 'FORCE_KEEP_NONE');
        if (dError) throw dError;

        const { error: iError } = await supabase.from('revenue').insert(updates);
        if (iError) throw iError;

        return NextResponse.json({ 
            success: true, 
            message: 'Revenue aggregation synced successfully!',
            count: updates.length 
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
