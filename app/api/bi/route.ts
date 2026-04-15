import { NextResponse } from 'next/server';
import {
  getAllBIData,
  saveAdminConfig,
  updateKanbanStage,
  addKanbanProject,
  editKanbanProject,
  addKanbanLead,
  editKanbanLead,
  updateKanbanLead,
  addKanbanPartner,
  editKanbanPartner,
  updateKanbanPartner,
  deleteKanbanProject,
  deleteKanbanLead,
  deleteKanbanPartner,
  updatePseMember,
  addPseMember,
  getStandupByDate,
  getStandupByRange,
  addStandupTask,
  editStandupTask,
  deleteStandupTask,
  updateStandupStatus,
} from '../../services/biService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Handle standup-specific GET requests
    const standupDate = searchParams.get('standupDate');
    const standupStart = searchParams.get('standupStart');
    const standupEnd = searchParams.get('standupEnd');
    
    if (standupDate) {
      const data = await getStandupByDate(standupDate);
      return NextResponse.json({ success: true, data });
    }
    
    if (standupStart && standupEnd) {
      const data = await getStandupByRange(standupStart, standupEnd);
      return NextResponse.json({ success: true, data });
    }

    const data = await getAllBIData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      isError: true,
      title: 'Supabase Fetch Error',
      message: error.message,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    switch (body.action) {
      case 'saveConfig':
        return NextResponse.json(await saveAdminConfig(body.data));

      case 'updateKanban':
        return NextResponse.json(await updateKanbanStage(body.projectId, body.newStage));

      case 'addKanbanProject':
        return NextResponse.json(await addKanbanProject(body));

      case 'editKanbanProject':
        return NextResponse.json(await editKanbanProject(body.id, body));

      case 'addKanbanLead':
        return NextResponse.json(await addKanbanLead(body));

      case 'editKanbanLead':
        return NextResponse.json(await editKanbanLead(body.id, body));

      case 'updateKanbanLead':
        return NextResponse.json(await updateKanbanLead(body.leadId, body.newStage));

      case 'addKanbanPartner':
        return NextResponse.json(await addKanbanPartner(body));

      case 'editKanbanPartner':
        return NextResponse.json(await editKanbanPartner(body.id, body));

      case 'updateKanbanPartner':
        return NextResponse.json(await updateKanbanPartner(body.partnerId, body.newStage));
      
      case 'deleteKanbanProject':
        return NextResponse.json(await deleteKanbanProject(body.id));
      
      case 'deleteKanbanLead':
        return NextResponse.json(await deleteKanbanLead(body.id));
      
      case 'deleteKanbanPartner':
        return NextResponse.json(await deleteKanbanPartner(body.id));
      
      case 'updatePseMember':
        return NextResponse.json(await updatePseMember(body.pseId, body.maxCapacity, body.isActive));
      
      case 'addPseMember':
        return NextResponse.json(await addPseMember(body.pseId, body.name, body.maxCapacity, body.isActive));

      // Daily Standup Actions
      case 'addStandupTask':
        return NextResponse.json(await addStandupTask(body));
      
      case 'editStandupTask':
        return NextResponse.json(await editStandupTask(body.id, body));
      
      case 'deleteStandupTask':
        return NextResponse.json(await deleteStandupTask(body.id));
      
      case 'updateStandupStatus':
        return NextResponse.json(await updateStandupStatus(body.id, body.status));

      default:
        return NextResponse.json({ success: false, message: 'Unknown action' });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}