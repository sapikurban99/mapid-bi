import { supabase } from '../../lib/supabaseClient';

const N8N_SOCIALS_URL = process.env.N8N_SOCIALS_WEBHOOK_URL;

// ========================================
// Supabase BI Service Layer
// Replaces Google Apps Script doGet/doPost
// ========================================

// --- READ: Get all BI Data (replaces GAS doGet) ---
export async function getAllBIData() {
  const [
    { data: revenue },
    { data: projects },
    { data: pipeline },
    { data: campaigns },
    { data: socials },
    { data: userGrowth },
    { data: trends },
    { data: docs },
    { data: academy },
    { data: budget },
    { data: pseMembers },
    { data: kanbanProjects },
    { data: kanbanLeads },
    { data: kanbanPartners },
    { data: adminConfigRows },
  ] = await Promise.all([
    supabase.from('revenue').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('pipeline').select('*'),
    supabase.from('campaigns').select('*'),
    supabase.from('socials').select('*'),
    supabase.from('user_growth').select('*'),
    supabase.from('trends').select('*'),
    supabase.from('docs').select('*'),
    supabase.from('academy').select('*'),
    supabase.from('budget').select('*'),
    supabase.from('pse_members').select('*').eq('is_active', true),
    supabase.from('kanban_projects').select('*'),
    supabase.from('pse_leads').select('*'),
    supabase.from('pse_partners').select('*'),
    supabase.from('admin_config').select('*').eq('key', 'main'),
  ]);

  // --- Map to same shape expected by frontend ---
  const mappedRevenue = (revenue || []).map(r => ({
    subProduct: r.sub_product,
    quarter: r.quarter,
    target: r.target,
    actual: r.actual,
    achievement: r.achievement_pct,
  }));

  const mappedProjects = (projects || []).map(r => ({
    name: r.name,
    phase: r.phase,
    progress: r.progress,
    issue: r.issue,
  }));

  const mappedPipeline = (pipeline || []).map(r => ({
    client: r.client,
    industry: r.industry,
    stage: r.stage,
    value: r.value_idr,
    action: r.action,
    eta: r.eta,
  }));

  const mappedCampaigns = (campaigns || []).map(r => ({
    name: r.campaign_name,
    period: r.period,
    status: r.status,
    leads: r.leads,
    participants: r.participants,
    conversion: r.conversion_pct,
  }));

  const mappedSocials = (socials || []).map(r => ({
    month: r.month,
    week: r.week,
    platform: r.platform,
    metric: r.metric,
    value: r.value,
  }));

  const mappedUserGrowth = (userGrowth || []).map(r => ({
    month: r.month,
    week: r.week,
    newRegist: r.new_regist,
    activeGeoUsers: r.active_geo_users,
    conversion: r.conversion_rate,
  }));

  const mappedTrends = (trends || []).map(r => ({
    category: r.timeframe,
    label: r.label,
    revenue: r.revenue_m,
    dealSize: r.dealsizeavg_m,
  }));

  const mappedDocs = (docs || []).map(r => ({
    title: r.title,
    category: r.category,
    format: r.format,
    link: r.link,
    desc: r.description,
  }));

  const mappedAcademy = (academy || []).map(r => ({
    program: r.program,
    batch: r.batch,
    registrants: r.registrants,
    converted: r.converted,
  }));

  const mappedBudget = (budget || []).map(r => ({
    date: r.date,
    category: r.category,
    amount: r.amount,
    description: r.description,
  }));

  // --- Kanban Data ---
  const mappedKanbanProjects = (kanbanProjects || []).map(r => ({
    id: r.id,
    client: r.client,
    projectName: r.project_name,
    pseId: r.pse_id,
    stage: r.stage,
    progress: r.progress_pct,
    priority: r.priority,
    notes: r.notes || '',
  }));

  const mappedKanbanLeads = (kanbanLeads || []).map(r => ({
    id: r.id,
    name: r.lead_name,
    pseId: r.pse_id,
    isClosed: r.is_closed,
    stage: r.stage || 'Lead Generation',
    progress: r.progress || 0,
    priority: r.priority || 'Medium',
    notes: r.notes || '',
  }));

  const mappedKanbanPartners = (kanbanPartners || []).map(r => ({
    id: r.id,
    name: r.partner_name,
    pseId: r.pse_id,
    isActive: r.is_active,
    type: r.type || 'Technology',
    stage: r.stage || 'Lead Generation',
    progress: r.progress || 0,
    priority: r.priority || 'Medium',
    notes: r.notes || '',
  }));

  // --- PSE Workload Calculation ---
  const pseWorkloads = (pseMembers || []).map(pse => {
    const maxCap = pse.max_capacity || 15;
    const activeProjects = (kanbanProjects || []).filter(p => p.pse_id === pse.id && p.stage !== 'Done').length;
    const activeLeads = (kanbanLeads || []).filter(l => l.pse_id === pse.id && l.is_closed === false).length;
    const activePartners = (kanbanPartners || []).filter(p => p.pse_id === pse.id && p.is_active === true).length;
    const totalPoints = (activeProjects * 3) + (activeLeads * 1) + (activePartners * 1);
    const loadPercentage = maxCap > 0 ? Math.round((totalPoints / maxCap) * 100) : 0;

    return {
      pseId: pse.id,
      name: pse.name,
      activeProjects,
      activeLeads,
      activePartners,
      totalPoints,
      maxCapacity: maxCap,
      loadPercentage,
    };
  });

  // --- Admin Config ---
  const adminConfig = adminConfigRows && adminConfigRows.length > 0 ? adminConfigRows[0].data : null;

  return {
    revenue: mappedRevenue,
    projects: mappedProjects,
    pipeline: mappedPipeline,
    campaigns: mappedCampaigns,
    socials: mappedSocials,
    userGrowth: mappedUserGrowth,
    trends: mappedTrends,
    docs: mappedDocs,
    academy: mappedAcademy,
    budget: mappedBudget,
    kanbanProjects: mappedKanbanProjects,
    kanbanLeads: mappedKanbanLeads,
    kanbanPartners: mappedKanbanPartners,
    pseWorkloads,
    adminConfig,
  };
}


// --- WRITE: Handle POST actions (replaces GAS doPost) ---

export async function saveAdminConfig(configData: any) {
  // Clone and strip biData before saving config
  const clone = JSON.parse(JSON.stringify(configData));
  if (clone.biData) {
    await syncBiDataToTables(clone.biData);
    delete clone.biData;
  }
  const { error } = await supabase.from('admin_config').upsert({ key: 'main', data: clone, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Config saved to Supabase!' };
}

export async function updateKanbanStage(projectId: string, newStage: string) {
  const { error } = await supabase.from('kanban_projects').update({ stage: newStage }).eq('id', projectId);
  if (error) throw new Error(error.message);
  return { success: true, message: 'Kanban stage updated' };
}

export async function addKanbanProject(payload: any) {
  const { data, error } = await supabase.from('kanban_projects').insert({
    client: payload.client,
    project_name: payload.projectName,
    pse_id: payload.pseId || null,
    stage: payload.stage,
    progress_pct: payload.progress || 0,
    priority: payload.priority || 'Medium',
    notes: payload.notes || '',
  }).select('id').single();
  if (error) throw new Error(error.message);
  return { success: true, newId: data.id };
}

export async function editKanbanProject(id: string, payload: any) {
  const { error } = await supabase.from('kanban_projects').update({
    client: payload.client,
    project_name: payload.projectName,
    pse_id: payload.pseId || null,
    stage: payload.stage,
    progress_pct: payload.progress || 0,
    priority: payload.priority || 'Medium',
    notes: payload.notes || '',
  }).eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function addKanbanLead(payload: any) {
  const { data, error } = await supabase.from('pse_leads').insert({
    lead_name: payload.name,
    pse_id: payload.pseId || null,
    is_closed: false,
    stage: payload.stage,
    progress: payload.progress || 0,
    priority: payload.priority || 'Medium',
    notes: payload.notes || '',
  }).select('id').single();
  if (error) throw new Error(error.message);
  return { success: true, newId: data.id };
}

export async function editKanbanLead(id: string, payload: any) {
  const { error } = await supabase.from('pse_leads').update({
    lead_name: payload.name,
    pse_id: payload.pseId || null,
    is_closed: payload.isClosed !== undefined ? payload.isClosed : false,
    stage: payload.stage,
    progress: payload.progress || 0,
    priority: payload.priority || 'Medium',
    notes: payload.notes || '',
  }).eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateKanbanLead(leadId: string, newStage: string) {
  const { error } = await supabase.from('pse_leads').update({ stage: newStage }).eq('id', leadId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function addKanbanPartner(payload: any) {
  const { data, error } = await supabase.from('pse_partners').insert({
    partner_name: payload.name,
    pse_id: payload.pseId || null,
    is_active: true,
    type: payload.type,
    stage: payload.stage,
    progress: payload.progress || 0,
    priority: payload.priority || 'Medium',
    notes: payload.notes || '',
  }).select('id').single();
  if (error) throw new Error(error.message);
  return { success: true, newId: data.id };
}

export async function editKanbanPartner(id: string, payload: any) {
  const { error } = await supabase.from('pse_partners').update({
    partner_name: payload.name,
    pse_id: payload.pseId || null,
    is_active: payload.isActive !== undefined ? payload.isActive : true,
    type: payload.type,
    stage: payload.stage,
    progress: payload.progress || 0,
    priority: payload.priority || 'Medium',
    notes: payload.notes || '',
  }).eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateKanbanPartner(partnerId: string, newStage: string) {
  const { error } = await supabase.from('pse_partners').update({ stage: newStage }).eq('id', partnerId);
  if (error) throw new Error(error.message);
  return { success: true };
}

// --- Sync BI Data from admin panel to individual tables ---
async function syncBiDataToTables(biData: any) {
  async function replaceTable(tableName: string, rows: any[]) {
    if (!rows || rows.length === 0) return;
    await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    await supabase.from(tableName).insert(rows);
  }

  if (biData.pipeline) {
    await replaceTable('pipeline', biData.pipeline.map((r: any) => ({ client: r.client, industry: r.industry, stage: r.stage, value_idr: r.value, action: r.action, eta: r.eta })));
  }
  if (biData.campaigns) {
    await replaceTable('campaigns', biData.campaigns.map((r: any) => ({ campaign_name: r.name, period: r.period || '', status: r.status, leads: r.leads, participants: r.participants, conversion_pct: r.conversion })));
  }
  if (biData.socials) {
    await replaceTable('socials', biData.socials.map((r: any) => ({ month: r.month, week: r.week, platform: r.platform, metric: r.metric, value: r.value })));
  }
  if (biData.userGrowth) {
    await replaceTable('user_growth', biData.userGrowth.map((r: any) => ({ month: r.month, week: r.week, new_regist: r.newRegist, active_geo_users: r.activeGeoUsers, conversion_rate: r.conversion })));
  }
  if (biData.projects) {
    await replaceTable('projects', biData.projects.map((r: any) => ({ name: r.name, phase: r.phase, progress: r.progress, issue: r.issue })));
  }
  if (biData.docs) {
    await replaceTable('docs', biData.docs.map((r: any) => ({ title: r.title, category: r.category, format: r.format, link: r.link, description: r.desc })));
  }
  if (biData.trends) {
    await replaceTable('trends', biData.trends.map((r: any) => ({ timeframe: r.category || 'month', label: r.label, revenue_m: r.revenue, dealsizeavg_m: r.dealSize })));
  }
  if (biData.academy) {
    await replaceTable('academy', biData.academy.map((r: any) => ({ program: r.program, batch: r.batch, registrants: r.registrants, converted: r.converted })));
  }
  if (biData.budget) {
    await replaceTable('budget', biData.budget.map((r: any) => ({ date: r.date, category: r.category, amount: r.amount, description: r.description })));
  }
  if (biData.revenue) {
    await replaceTable('revenue', biData.revenue.map((r: any) => ({ sub_product: r.subProduct, quarter: r.quarter || '', target: r.target, actual: r.actual, achievement_pct: r.achievement })));
  }
}

// --- SOCIAL SCRAPING LOGIC ---

export async function getSocialScrapeLogs() {
  const { data, error } = await supabase
    .from('social_scrape_logs')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
}

export async function syncSocialsFromN8n(platform: string) {
  if (!N8N_SOCIALS_URL) throw new Error('N8N_SOCIALS_WEBHOOK_URL is not defined in environment variables');

  try {
    const res = await fetch(N8N_SOCIALS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, action: 'scrape' }),
    });

    if (!res.ok) throw new Error(`n8n responded with ${res.status}`);
    const json = await res.json();

    // EXPECTED PAYLOAD: { platform: 'Instagram', month: 'Feb 2026', week: 'Week 4', metrics: [{ metric: 'Followers', value: 1200 }, ...] }
    const payload = Array.isArray(json) ? json[0] : json;

    if (payload && payload.metrics) {
      const upsertRows = payload.metrics.map((m: any) => ({
        platform: payload.platform || platform,
        month: payload.month,
        week: payload.week,
        metric: m.metric,
        value: m.value,
        updated_at: new Date().toISOString(),
      }));

      // In Supabase, we don't have a simple "composite unique" upsert unless we define it in DB.
      // So we'll do it manually: delete matching records first, then insert.
      for (const row of upsertRows) {
        await supabase.from('socials')
          .delete()
          .eq('platform', row.platform)
          .eq('month', row.month)
          .eq('week', row.week)
          .eq('metric', row.metric);
      }
      
      const { error: insertError } = await supabase.from('socials').insert(upsertRows);
      if (insertError) throw new Error(insertError.message);

      // Log success
      await supabase.from('social_scrape_logs').insert({
        platform,
        status: 'Success',
        details: payload,
      });

      return { success: true, message: `Successfully synced ${platform} data!` };
    } else {
      throw new Error('No metrics data returned from n8n');
    }
  } catch (error: any) {
    // Log failure
    await supabase.from('social_scrape_logs').insert({
      platform,
      status: 'Failed',
      details: { error: error.message },
    });
    throw error;
  }
}

