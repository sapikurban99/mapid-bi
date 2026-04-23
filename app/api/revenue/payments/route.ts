import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const category = searchParams.get('category'); // optional filter

    try {
        let query = supabase.from('revenue_payments').select('*');

        if (startDate) query = query.gte('payment_date', startDate);
        if (endDate) query = query.lte('payment_date', endDate);
        if (category) query = query.eq('category', category);

        const { data, error } = await query.order('payment_date', { ascending: false });
        if (error) throw error;

        // Aggregate total by category
        const totals: Record<string, number> = {};
        (data || []).forEach((p: any) => {
            const cat = p.category || 'Other';
            totals[cat] = (totals[cat] || 0) + (Number(p.amount) || 0);
        });

        return NextResponse.json({
            success: true,
            payments: data || [],
            totals,
            totalAmount: Object.values(totals).reduce((s, v) => s + v, 0),
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
