// HL7 FHIR-compliant MongoDB Schema for VitalSync

import mongoose, { Schema, Document } from 'mongoose';

// FHIR-aligned Vital Signs
const VitalSignsSchema = new Schema({
    heartRate: { type: Number, required: true }, // beats/min
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    oxygenSaturation: { type: Number }, // SpO2 %
    temperature: { type: Number }, // Celsius
    respiratoryRate: { type: Number }, // breaths/min
    glasgowComaScale: { type: Number, min: 3, max: 15 }, // GCS
    recordedAt: { type: Date, default: Date.now },
});

// FHIR Attachment (encrypted file links)
const AttachmentSchema = new Schema({
    resourceType: { type: String, default: 'DocumentReference' },
    contentType: { type: String }, // 'image/jpeg', 'application/pdf'
    encryptedUrl: { type: String, required: true }, // AES-256 encrypted S3/storage URL
    title: { type: String },
    createdAt: { type: Date, default: Date.now },
    hash: { type: String }, // SHA-256 for integrity verification
});

// FHIR Condition
const ConditionSchema = new Schema({
    code: { type: String }, // ICD-10 code
    display: { type: String },
    severity: { type: String, enum: ['critical', 'high', 'moderate', 'low'] },
    onsetDateTime: { type: Date },
});

// Main Patient Record - FHIR Patient Resource aligned
export interface IPatientRecord extends Document {
    fhirResourceType: string;
    patientId: string;
    mrn: string; // Medical Record Number
    name: { given: string[]; family: string };
    birthDate: Date;
    gender: string;
    bloodType: string;
    conditions: typeof ConditionSchema[];
    allergies: string[];
    currentMedications: string[];
    vitals: typeof VitalSignsSchema[];
    attachments: typeof AttachmentSchema[];
    triageLevel: number; // 1-5 (ESI triage)
    admittedAt: Date;
    currentHospital: string;
    encryptionKey: string; // Key ID reference (not actual key)
    createdAt: Date;
    updatedAt: Date;
}

const PatientRecordSchema = new Schema<IPatientRecord>(
    {
        fhirResourceType: { type: String, default: 'Patient' },
        patientId: { type: String, required: true, unique: true, index: true },
        mrn: { type: String, required: true, unique: true },
        name: {
            given: [{ type: String }],
            family: { type: String, required: true },
        },
        birthDate: { type: Date, required: true },
        gender: { type: String, enum: ['male', 'female', 'other', 'unknown'] },
        bloodType: { type: String },
        conditions: [ConditionSchema],
        allergies: [{ type: String }],
        currentMedications: [{ type: String }],
        vitals: [VitalSignsSchema],
        attachments: [AttachmentSchema],
        triageLevel: { type: Number, min: 1, max: 5 },
        admittedAt: { type: Date, default: Date.now },
        currentHospital: { type: String },
        encryptionKey: { type: String }, // References KMS key ID
    },
    { timestamps: true }
);

// ReferralHandshake - tracks transfer status
export interface IReferralHandshake extends Document {
    referralId: string;
    patientId: string;
    fromHospital: { id: string; name: string; lat: number; lng: number };
    toHospital: { id: string; name: string; lat: number; lng: number };
    status: 'pending' | 'accepted' | 'en-route' | 'arrived' | 'cancelled';
    initiatedAt: Date;
    acceptedAt?: Date;
    enRouteAt?: Date;
    arrivedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    ambulanceId?: string;
    ambulanceLat?: number;
    ambulanceLng?: number;
    preArrivalPacketSent: boolean;
    urgencyLevel: 'critical' | 'high' | 'moderate';
    notes: string;
}

const ReferralHandshakeSchema = new Schema<IReferralHandshake>(
    {
        referralId: { type: String, required: true, unique: true, index: true },
        patientId: { type: String, required: true, index: true },
        fromHospital: {
            id: { type: String },
            name: { type: String },
            lat: { type: Number },
            lng: { type: Number },
        },
        toHospital: {
            id: { type: String },
            name: { type: String },
            lat: { type: Number },
            lng: { type: Number },
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'en-route', 'arrived', 'cancelled'],
            default: 'pending',
        },
        initiatedAt: { type: Date, default: Date.now },
        acceptedAt: { type: Date },
        enRouteAt: { type: Date },
        arrivedAt: { type: Date },
        cancelledAt: { type: Date },
        cancelReason: { type: String },
        ambulanceId: { type: String },
        ambulanceLat: { type: Number },
        ambulanceLng: { type: Number },
        preArrivalPacketSent: { type: Boolean, default: false },
        urgencyLevel: { type: String, enum: ['critical', 'high', 'moderate'] },
        notes: { type: String },
    },
    { timestamps: true }
);

export const PatientRecord =
    mongoose.models.PatientRecord ||
    mongoose.model<IPatientRecord>('PatientRecord', PatientRecordSchema);

export const ReferralHandshake =
    mongoose.models.ReferralHandshake ||
    mongoose.model<IReferralHandshake>('ReferralHandshake', ReferralHandshakeSchema);
