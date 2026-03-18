import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReferralHandshake } from '@/models/PatientRecord';

// GET all active referrals
export async function GET() {
  try {
    await dbConnect();
    const referrals = await ReferralHandshake.find({}).sort({ createdAt: -1 }).limit(10);
    return NextResponse.json(referrals);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST a new referral (Handshake)
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const newReferral = await ReferralHandshake.create({
      referralId: body.id,
      patientId: body.patientId,
      fromHospital: { name: body.fromHospital }, // Simplified for sync
      toHospital: { name: body.toHospital },
      status: body.status || 'pending',
      urgencyLevel: body.urgency || 'high',
      initiatedAt: new Date(),
      notes: body.condition || 'Manual Patient Entry',
      fullPatientData: body.fullPatientData,
    });
    
    return NextResponse.json(newReferral);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
