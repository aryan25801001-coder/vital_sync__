// VitalSync - Smart Hospital Discovery Algorithm
// Ranks hospitals using multi-factor scoring for golden-hour optimization

export interface Hospital {
    id: string;
    name: string;
    lat: number;
    lng: number;
    specializations: string[];
    availableBeds: number;
    totalBeds: number;
    specialistsOnDuty: string[];
    icuBeds: number;
    availableIcuBeds: number;
    traumaCenter: boolean;
    helipadsAvailable: boolean;
    avgResponseTime: number; // minutes
    successRate: number; // 0-100
    distanceKm?: number;
    travelTimeMin?: number;
}

export interface PatientCase {
    condition: string; // 'trauma' | 'cardiac' | 'stroke' | 'burn' | 'pediatric'
    severity: 'critical' | 'high' | 'moderate';
    requiredSpecialists: string[];
    currentLat: number;
    currentLng: number;
    needsIcu: boolean;
    needsHeli: boolean;
}

export interface HospitalScore {
    hospital: Hospital;
    totalScore: number;
    breakdown: {
        specializationScore: number;
        distanceScore: number;
        resourceScore: number;
        traumaBonus: number;
        successRateScore: number;
    };
    recommendation: string;
    eta: number;
}

// Haversine formula for distance calculation
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Specialization priority map for condition types
const SPECIALIZATION_MAP: Record<string, string[]> = {
    trauma: ['Neurosurgery', 'Orthopedics', 'General Surgery', 'Trauma Surgery', 'Vascular Surgery'],
    cardiac: ['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology', 'Critical Care'],
    stroke: ['Neurology', 'Neurosurgery', 'Interventional Radiology', 'Critical Care'],
    burn: ['Plastic Surgery', 'Burn Unit', 'Critical Care', 'Dermatology'],
    pediatric: ['Pediatrics', 'Pediatric Surgery', 'PICU', 'Neonatology'],
};

export function findOptimalHospital(patient: PatientCase, hospitals: Hospital[]): HospitalScore[] {
    const prioritySpecs = SPECIALIZATION_MAP[patient.condition] || patient.requiredSpecialists;

    const scored: HospitalScore[] = hospitals.map((hospital) => {
        // 1. SPECIALIZATION SCORE (0-40 points)
        let specializationScore = 0;
        const matchedSpecs = hospital.specializations.filter((s) =>
            prioritySpecs.some((p) => s.toLowerCase().includes(p.toLowerCase()))
        );
        const specialistMatch = hospital.specialistsOnDuty.filter((s) =>
            prioritySpecs.some((p) => s.toLowerCase().includes(p.toLowerCase()))
        );
        specializationScore = Math.min(40, matchedSpecs.length * 8 + specialistMatch.length * 6);

        // 2. DISTANCE SCORE (0-30 points) - closer = better
        const distKm = haversineDistance(
            patient.currentLat, patient.currentLng,
            hospital.lat, hospital.lng
        );
        const travelTime = distKm * 1.8; // avg ambulance speed factor
        const distanceScore = Math.max(0, 30 - distKm * 1.5);

        // 3. RESOURCE LOAD SCORE (0-20 points)
        const bedOccupancy = 1 - hospital.availableBeds / hospital.totalBeds;
        const icuOccupancy = hospital.availableIcuBeds > 0 ? 1 : 0;
        let resourceScore = (1 - bedOccupancy) * 10 + icuOccupancy * 10;
        if (patient.needsIcu && hospital.availableIcuBeds === 0) resourceScore -= 15;

        // 4. TRAUMA CENTER BONUS (0-10 points)
        let traumaBonus = 0;
        if (patient.condition === 'trauma' && hospital.traumaCenter) traumaBonus += 8;
        if (patient.needsHeli && hospital.helipadsAvailable) traumaBonus += 2;

        // 5. SUCCESS RATE SCORE (0-10 points)
        const successRateScore = (hospital.successRate / 100) * 10;

        const totalScore = specializationScore + distanceScore + resourceScore + traumaBonus + successRateScore;

        // Generate recommendation message
        let recommendation = '';
        if (totalScore >= 70) recommendation = '✅ OPTIMAL MATCH - Immediate Transfer Recommended';
        else if (totalScore >= 50) recommendation = '⚡ VIABLE - Good match, proceed with caution';
        else if (totalScore >= 30) recommendation = '⚠️ SUBOPTIMAL - Use only if no better option';
        else recommendation = '❌ POOR MATCH - Seek alternatives';

        return {
            hospital: { ...hospital, distanceKm: Math.round(distKm * 10) / 10, travelTimeMin: Math.round(travelTime) },
            totalScore: Math.round(totalScore * 10) / 10,
            breakdown: {
                specializationScore: Math.round(specializationScore),
                distanceScore: Math.round(distanceScore * 10) / 10,
                resourceScore: Math.round(resourceScore * 10) / 10,
                traumaBonus,
                successRateScore: Math.round(successRateScore * 10) / 10,
            },
            recommendation,
            eta: Math.round(travelTime),
        };
    });

    return scored.sort((a, b) => b.totalScore - a.totalScore);
}
