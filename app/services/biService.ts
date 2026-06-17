import { supabase } from '../../lib/supabaseClient';

const N8N_SOCIALS_URL = process.env.N8N_SOCIALS_WEBHOOK_URL;

// ========================================
// Supabase BI Service Layer
// Primary Backend for BI Operations
// ========================================

// --- READ: Get all BI Data ---
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
    { data: contentsData },
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
    supabase.from('contents').select('*'),
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
    startDate: r.start_date || '',
    endDate: r.end_date || '',
  }));

  const mappedSocials = (socials || []).map(r => ({
    month: r.month,
    week: r.week,
    platform: r.platform,
    metric: r.metric,
    value: r.value,
    created_at: r.created_at,
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

  const mappedContents = (contentsData || []).map(r => ({
    title: r.title,
    platform: r.platform,
    account: r.account,
    contentType: r.content_type,
    date: r.date,
    status: r.status,
    pic: r.pic
  }));

  // --- Kanban Data ---
  function getFallbackYearAndQuarter(dateStr?: string) {
    if (!dateStr) return { year: '', quarter: '' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { year: '', quarter: '' };
    const year = d.getFullYear().toString();
    const quarter = `Q${Math.floor(d.getMonth() / 3) + 1}`;
    return { year, quarter };
  }

  const mappedKanbanProjects = (kanbanProjects || []).map(r => {
    const fallback = getFallbackYearAndQuarter(r.close_date);
    return {
      id: r.id,
      client: r.client,
      projectName: r.project_name,
      pseId: r.pse_id,
      stage: r.stage,
      progress: r.progress_pct,
      priority: r.priority,
      projectType: r.project_type || 'data',
      notes: r.notes || '',
      picSales: r.pic_sales || '',
      contactName: r.contact_name || '',
      contactNumber: r.contact_number || '',
      forecastedValue: r.forecasted_value || 0,
      nextStep: r.next_step || '',
      closeDate: r.close_date || '',
      probability: r.probability || 0,
      closeYear: r.close_year || fallback.year,
      closeQuarter: r.close_quarter || fallback.quarter,
    };
  });

  const leadsToFreeze: string[] = [];

  const mappedKanbanLeads = (kanbanLeads || []).map(r => {
    let stage = r.stage || 'Lead Generation';
    
    // Auto-freeze logic
    if (r.last_interacted_on && stage !== 'Closed Lost' && stage !== 'Closed Won' && stage !== 'Done' && stage !== 'Freeze') {
      const lastInteract = new Date(r.last_interacted_on);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      if (lastInteract < oneMonthAgo) {
        stage = 'Freeze';
        leadsToFreeze.push(r.id);
      }
    }

    const fallback = getFallbackYearAndQuarter(r.expected_close_date);

    return {
      id: r.id,
      name: r.lead_name,
      pseId: r.pse_id,
      isClosed: r.is_closed,
      stage: stage,
      progress: r.progress || 0,
      priority: r.priority || 'Medium',
      projectType: r.project_type || 'data',
      notes: r.notes || '',
      picSales: r.pic_sales || '',
      contactName: r.contact_name || '',
      contactEmail: r.contact_email || '',
      contactNumber: r.contact_number || '',
      forecastedValue: r.forecasted_value || 0,
      probability: r.probability || 0,
      demoDate: r.demo_date || '',
      expectedCloseDate: r.expected_close_date || '',
      lastInteractedOn: r.last_interacted_on || '',
      nextStep: r.next_step || '',
      proposalLink: r.proposal_link || '',
      partnerId: r.partner_id || '',
      closeYear: r.close_year || fallback.year,
      closeQuarter: r.close_quarter || fallback.quarter,
    };
  });

  // Batch auto-freeze update (fire-and-forget, single query)
  if (leadsToFreeze.length > 0) {
    supabase.from('pse_leads').update({ stage: 'Freeze' }).in('id', leadsToFreeze).then(() => {
      console.log(`[AutoFreeze] Froze ${leadsToFreeze.length} inactive leads`);
    });
  }

  const mappedKanbanPartners = (kanbanPartners || []).map(r => ({
    id: r.id,
    name: r.partner_name,
    pseId: r.pse_id,
    isActive: r.is_active,
    type: r.type || 'Technology',
    projectType: r.project_type || 'data',
    stage: r.stage || 'Sourcing',
    progress: r.progress || 0,
    priority: r.priority || 'Medium',
    notes: r.notes || '',
    picPartner: r.pic_partner || '',
    contactName: r.contact_name || '',
    contactNumber: r.contact_number || '',
    nextStep: r.next_step || '',
  }));

  // --- PSE Workload Calculation ---
  const pseWorkloads = (pseMembers || []).map(pse => {
    const maxCap = pse.max_capacity || 30;

    // Weight Multipliers — by project type (data=1x, dev/survey=3x)
    const getWeight = (projectType: string) => {
      const t = (projectType || 'data').toLowerCase();
      if (t === 'dev' || t === 'survey') return 3.0;
      return 1.0; // data (default)
    };

    const projItems = (kanbanProjects || []).filter(p =>
      p.pse_id === pse.id && !['Done', 'Lost', 'Freeze'].includes(p.stage)
    );
    const leadItems = (kanbanLeads || []).filter(l =>
      l.pse_id === pse.id && l.is_closed === false && l.stage !== 'Freeze'
    );
    const partnerItems = (kanbanPartners || []).filter(p =>
      p.pse_id === pse.id && p.is_active === true && p.stage !== 'Freeze'
    );

    const projectPoints = projItems.reduce((sum, p) => sum + (3 * getWeight(p.project_type)), 0);
    const leadPoints = leadItems.reduce((sum, l) => sum + (1 * getWeight(l.project_type)), 0);
    const partnerPoints = partnerItems.reduce((sum, p) => sum + (1 * getWeight(p.project_type)), 0);

    const totalPoints = projectPoints + leadPoints + partnerPoints;
    const loadPercentage = maxCap > 0 ? Math.round((totalPoints / maxCap) * 100) : 0;

    return {
      pseId: pse.id,
      name: pse.name,
      activeProjectsCount: projItems.length,
      activeLeadsCount: leadItems.length,
      activePartnersCount: partnerItems.length,
      activeProjects: projectPoints, // For Charts
      activeLeads: leadPoints,        // For Charts
      activePartners: partnerPoints,  // For Charts
      totalPoints,
      maxCapacity: maxCap,
      loadPercentage,
      isActive: pse.is_active,
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
    contents: mappedContents,
  };
}


// --- WRITE: Handle POST actions ---

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
    project_type: payload.projectType || 'data',
    notes: payload.notes || '',
    pic_sales: payload.picSales || null,
    contact_name: payload.contactName || null,
    contact_number: payload.contactNumber || null,
    forecasted_value: payload.forecastedValue || 0,
    next_step: payload.nextStep || null,
    close_date: payload.closeDate || null,
    probability: payload.probability || 0,
    close_year: payload.closeYear || null,
    close_quarter: payload.closeQuarter || null,
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
    project_type: payload.projectType || 'data',
    notes: payload.notes || '',
    pic_sales: payload.picSales || null,
    contact_name: payload.contactName || null,
    contact_number: payload.contactNumber || null,
    forecasted_value: payload.forecastedValue || 0,
    next_step: payload.nextStep || null,
    close_date: payload.closeDate || null,
    probability: payload.probability || 0,
    close_year: payload.closeYear || null,
    close_quarter: payload.closeQuarter || null,
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
    project_type: payload.projectType || 'data',
    notes: payload.notes || '',
    pic_sales: payload.picSales || null,
    contact_name: payload.contactName || null,
    contact_email: payload.contactEmail || null,
    contact_number: payload.contactNumber || null,
    forecasted_value: payload.forecastedValue || 0,
    probability: payload.probability || 0,
    demo_date: payload.demoDate || null,
    expected_close_date: payload.expectedCloseDate || null,
    last_interacted_on: payload.lastInteractedOn || null,
    next_step: payload.nextStep || null,
    proposal_link: payload.proposalLink || null,
    partner_id: payload.partnerId || null,
    close_year: payload.closeYear || null,
    close_quarter: payload.closeQuarter || null,
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
    project_type: payload.projectType || 'data',
    notes: payload.notes || '',
    pic_sales: payload.picSales || null,
    contact_name: payload.contactName || null,
    contact_email: payload.contactEmail || null,
    contact_number: payload.contactNumber || null,
    forecasted_value: payload.forecastedValue || 0,
    probability: payload.probability || 0,
    demo_date: payload.demoDate || null,
    expected_close_date: payload.expectedCloseDate || null,
    last_interacted_on: payload.lastInteractedOn || null,
    next_step: payload.nextStep || null,
    proposal_link: payload.proposalLink || null,
    partner_id: payload.partnerId || null,
    close_year: payload.closeYear || null,
    close_quarter: payload.closeQuarter || null,
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
    project_type: payload.projectType || 'data',
    stage: payload.stage,
    progress: payload.progress || 0,
    priority: payload.priority || 'Medium',
    notes: payload.notes || '',
    pic_partner: payload.picPartner || null,
    contact_name: payload.contactName || null,
    contact_number: payload.contactNumber || null,
    next_step: payload.nextStep || null,
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
    project_type: payload.projectType || 'data',
    stage: payload.stage,
    progress: payload.progress || 0,
    priority: payload.priority || 'Medium',
    notes: payload.notes || '',
    pic_partner: payload.picPartner || null,
    contact_name: payload.contactName || null,
    contact_number: payload.contactNumber || null,
    next_step: payload.nextStep || null,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateKanbanPartner(partnerId: string, newStage: string) {
  const { error } = await supabase.from('pse_partners').update({ stage: newStage }).eq('id', partnerId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteKanbanProject(id: string) {
  const { error } = await supabase.from('kanban_projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteKanbanLead(id: string) {
  const { error } = await supabase.from('pse_leads').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteKanbanPartner(id: string) {
  const { error } = await supabase.from('pse_partners').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updatePseMember(pseId: string, maxCapacity: number, isActive: boolean) {
  const { error } = await supabase.from('pse_members').update({
    max_capacity: maxCapacity,
    is_active: isActive,
  }).eq('id', pseId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function addPseMember(pseId: string, name: string, maxCapacity: number, isActive: boolean) {
  const { error } = await supabase.from('pse_members').insert({
    id: pseId,
    name: name,
    max_capacity: maxCapacity,
    is_active: isActive,
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

// ========================================
// Daily Standup CRUD
// ========================================

export async function getStandupByDate(date: string) {
  const { data, error } = await supabase
    .from('daily_standup')
    .select('*')
    .eq('date', date)
    .order('member_name');
  if (error) throw new Error(error.message);
  return (data || []).map(r => ({
    id: r.id,
    date: r.date,
    memberName: r.member_name,
    task: r.task,
    status: r.status || 'In Progress',
    notes: r.notes || '',
    hambatan: r.hambatan || '',
    link: r.link || '',
  }));
}

export async function getStandupByRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('daily_standup')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('member_name');
  if (error) throw new Error(error.message);
  return (data || []).map(r => ({
    id: r.id,
    date: r.date,
    memberName: r.member_name,
    task: r.task,
    status: r.status || 'In Progress',
    notes: r.notes || '',
    hambatan: r.hambatan || '',
    link: r.link || '',
  }));
}

export async function addStandupTask(payload: any) {
  const { data, error } = await supabase.from('daily_standup').insert({
    date: payload.date,
    member_name: payload.memberName,
    task: payload.task,
    status: payload.status || 'In Progress',
    notes: payload.notes || '',
    hambatan: payload.hambatan || '',
    link: payload.link || '',
  }).select('id').single();
  if (error) throw new Error(error.message);
  return { success: true, newId: data.id };
}

export async function editStandupTask(id: string, payload: any) {
  const { error } = await supabase.from('daily_standup').update({
    task: payload.task,
    status: payload.status,
    notes: payload.notes || '',
    hambatan: payload.hambatan || '',
    member_name: payload.memberName,
    link: payload.link || '',
  }).eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteStandupTask(id: string) {
  const { error } = await supabase.from('daily_standup').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateStandupStatus(id: string, status: string) {
  const { error } = await supabase.from('daily_standup').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getStandupGeneral(date: string) {
  const { data, error } = await supabase
    .from('daily_standup_general')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data || { date, general_links: [], general_notes: '', member_links: {} };
}

export async function saveStandupGeneral(date: string, payload: any) {
  const { error } = await supabase
    .from('daily_standup_general')
    .upsert({
      date,
      general_links: payload.generalLinks || [],
      general_notes: payload.generalNotes || '',
      member_links: payload.memberLinks || {},
      updated_at: new Date().toISOString()
    });
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
    await replaceTable('campaigns', biData.campaigns.map((r: any) => ({ 
      campaign_name: r.name, 
      period: r.period || '', 
      status: r.status, 
      leads: r.leads, 
      participants: r.participants, 
      conversion_pct: r.conversion,
      start_date: r.startDate || null,
      end_date: r.endDate || null
    })));
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
  if (biData.contents) {
    await replaceTable('contents', biData.contents.map((r: any) => ({ title: r.title, platform: r.platform, account: r.account || null, content_type: r.contentType, date: r.date || null, status: r.status, pic: r.pic || null })));
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

export async function getWaCrmData(startDate?: string, endDate?: string) {
  console.log(`Fetching WA CRM Data (SalesMAPID) | Range: ${startDate || 'All'} to ${endDate || 'All'}`);
  
  // Format dates for inclusive range
  const start = startDate ? `${startDate}T00:00:00Z` : null;
  const end = endDate ? `${endDate}T23:59:59Z` : null;

  const { data: contacts, error: cError } = await supabase
    .from('mapid_wa_manager_contacts')
    .select('*')
    .eq('session_id', 'salesmapid');

  if (cError) {
    console.error('Error fetching contacts:', cError);
    return [];
  }

  let messageQuery = supabase
    .from('mapid_wa_manager_messages')
    .select('*')
    .eq('session_id', 'salesmapid');

  if (start) messageQuery = messageQuery.gte('sent_at', start);
  if (end) messageQuery = messageQuery.lte('sent_at', end);

  const { data: messages, error: mError } = await messageQuery.order('sent_at', { ascending: true, nullsFirst: false });

  if (mError) {
    console.warn('sent_at filter failed, attempting with created_at fallback');
    let fallbackQuery = supabase
      .from('mapid_wa_manager_messages')
      .select('*')
      .eq('session_id', 'salesmapid');
      
    if (start) fallbackQuery = fallbackQuery.gte('created_at', start);
    if (end) fallbackQuery = fallbackQuery.lte('created_at', end);

    const { data: fallbackMessages, error: fError } = await fallbackQuery.order('id', { ascending: true, nullsFirst: false });
      
    if (fError) {
      console.error('Error fetching messages:', fError);
      return [];
    }
    return processCrmData(contacts, fallbackMessages, true);
  }

  return processCrmData(contacts, messages, !!(startDate || endDate));
}

function processCrmData(contacts: any[], messages: any[], isFiltered: boolean) {
  if (!contacts || contacts.length === 0) return [];

  // Group messages by contact and calculate inbound/outbound
  const contactMap = new Map();
  const activeContactIds = new Set();
  
  (contacts || []).forEach(c => {
    // Map either id, phone, wa_number, or chat_id as key
    // We'll store it under multiple keys if necessary to ensure linking
    const key = c.id || c.wa_number || c.phone || c.chat_id;
    if (key) {
      const contactObj = {
        ...c,
        inboundCount: 0,
        outboundCount: 0,
        lastMessage: '',
        conversationSummary: [],
        messages: [],
        responseRate: 0
      };
      contactMap.set(key, contactObj);
      
      // Also map secondary keys if they exist to the same object reference
      if (c.wa_number) contactMap.set(c.wa_number, contactObj);
      if (c.chat_id) contactMap.set(c.chat_id, contactObj);
      if (c.phone) contactMap.set(c.phone, contactObj);
    }
  });

  (messages || []).forEach(m => {
    // Try to find the contact in our map using all possible linking fields
    const contactIdentifier = m.chat_id || m.wa_number || m.contact_id || m.contact_uuid || m.phone || m.number;
    const contact = contactMap.get(contactIdentifier);
    
    if (contact) {
      activeContactIds.add(contact); // Mark contact as having messages in range
      // Robustly determine direction
      const isInbound = m.direction === 'inbound' || m.is_outbound === false || m.type === 'inbound' || m.is_inbound === true;
      
      if (isInbound) {
        contact.inboundCount++;
      } else {
        contact.outboundCount++;
      }
      
      // Robustly get message text
      const msgText = m.message || m.text || m.content || m.body || '';
      contact.lastMessage = msgText;
      contact.conversationSummary.push(`${isInbound ? 'User' : 'Sales'}: ${msgText}`);
      
      contact.messages.push({
        isInbound,
        time: new Date(m.sent_at || m.created_at || m.timestamp).getTime(),
        text: msgText
      });
    }
  });

  // Calculate Response Rate based on 1-hour SOP
  for (const contact of contactMap.values()) {
    const msgs = contact.messages || [];
    let inboundBlocks = 0;
    let validResponses = 0;
    let totalResponseTimeMs = 0;
    let respondedBlocks = 0;
    
    let firstInboundInBlock: number | null = null;
    
    msgs.forEach((m: any) => {
      if (m.isInbound) {
        if (firstInboundInBlock === null) {
          firstInboundInBlock = m.time;
          inboundBlocks++;
        }
      } else {
        // Outbound reply!
        if (firstInboundInBlock !== null) {
          const diffMs = m.time - firstInboundInBlock;
          totalResponseTimeMs += diffMs;
          respondedBlocks++;
          
          if (diffMs <= 1 * 60 * 60 * 1000) { // Under 1 hour
            validResponses++;
          }
          firstInboundInBlock = null; // Reset for next inbound block
        }
      }
    });
    
    // If there is a pending inbound block at the end without any response yet:
    if (firstInboundInBlock !== null) {
      const diffMs = Date.now() - firstInboundInBlock;
      if (diffMs > 1 * 60 * 60 * 1000) {
        // counted as failed response because it's past 1 hour
      } else {
        // Still pending response within the 1 hour window, exclude it to avoid penalizing unfairly.
        inboundBlocks = Math.max(0, inboundBlocks - 1);
      }
    }
    
    contact.responseRate = inboundBlocks > 0 
      ? Math.min(Math.round((validResponses / inboundBlocks) * 100), 100) 
      : 0;
      
    contact.avgResponseTimeMs = respondedBlocks > 0 
      ? Math.round(totalResponseTimeMs / respondedBlocks) 
      : null;

    contact.isPendingReply = firstInboundInBlock !== null;
    contact.lastActivityTime = msgs.length > 0 ? msgs[msgs.length - 1].time : 0;
  }

  let finalArray = Array.from(new Set(contactMap.values()));
  if (isFiltered) {
    finalArray = Array.from(activeContactIds);
  }

  // Sort by lastActivityTime DESC (newest first)
  finalArray.sort((a: any, b: any) => (b.lastActivityTime || 0) - (a.lastActivityTime || 0));

  return finalArray;
}

export async function deleteWaCrmContact(identifier: string) {
  // We'll try to delete from contacts table using id, wa_number, or chat_id
  const { error } = await supabase
    .from('mapid_wa_manager_contacts')
    .delete()
    .or(`id.eq.${identifier},wa_number.eq.${identifier},chat_id.eq.${identifier}`)
    .eq('session_id', 'salesmapid');

  if (error) {
    console.error('Error deleting contact:', error);
    throw new Error(error.message);
  }
  
  return { success: true };
}

// --- WA Blast Functions ---
export async function getWaBlastContacts(groupName?: string) {
  let query = supabase.from('wa_blast_contacts').select('*').order('created_at', { ascending: false });
  
  if (groupName) {
    query = query.eq('group_name', groupName);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function saveWaBlastContacts(contacts: any[]) {
  const { data, error } = await supabase
    .from('wa_blast_contacts')
    .insert(contacts)
    .select();
    
  if (error) throw error;
  return data;
}

export async function deleteWaBlastGroup(groupName: string) {
  const { error } = await supabase
    .from('wa_blast_contacts')
    .delete()
    .eq('group_name', groupName);
    
  if (error) throw error;
  return { success: true };
}

