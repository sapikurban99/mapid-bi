import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // 1. Fetch KPI Configurations
    const { data: configs, error: configError } = await supabase
      .from('kpi_configs')
      .select('*');

    if (configError) throw configError;

    // 2. Process Data
    const summary: any[] = [];
    const individuals: Record<string, any[]> = {};

    (configs || []).forEach(config => {
      // PARSE MANUAL VALUE FROM DATA_KEY
      let actual = 0;
      if (config.data_key && config.data_key.startsWith('manual:')) {
        const valStr = config.data_key.replace('manual:', '');
        actual = Number(valStr) || 0;
      }

      const kpiData = {
        id: config.id,
        kpi_name: config.kpi_name,
        role: config.role,
        actual_value: actual,
        target_value: config.target_value,
        is_percentage: config.is_percentage,
        owner_type: config.owner_type,
        thresholds: {
          green: config.threshold_green,
          yellow: config.threshold_yellow,
          red: config.threshold_red,
        }
      };

      // Group into summary (Role Level)
      if (config.owner_type === 'role') {
        summary.push(kpiData);
      } else if (config.owner_type === 'individual') {
        // Find owner name from column or brackets in kpi_name
        let ownerName = config.owner_name;
        if (!ownerName && config.kpi_name.includes('(')) {
          const match = config.kpi_name.match(/\(([^)]+)\)/);
          if (match) ownerName = match[1];
        }

        if (ownerName) {
          if (!individuals[ownerName]) {
            individuals[ownerName] = [];
          }
          individuals[ownerName].push(kpiData);
        } else {
            // Fallback to summary if no owner found
            summary.push(kpiData);
        }
      }
    });

    return NextResponse.json({
      summary,
      individuals
    });
  } catch (error: any) {
    console.error('KPI Calculation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
