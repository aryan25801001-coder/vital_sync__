'use client';
import { useEffect, useState, useCallback } from 'react';

export interface Notification {
    id: string;
    type: 'new_referral' | 'status_update' | 'critical_alert' | 'bed_update';
    title: string;
    message: string;
    timestamp: Date;
    urgency: 'critical' | 'high' | 'moderate';
    referralId?: string;
    patientData?: Record<string, unknown>;
}

// Simulated real-time hook (Socket.io simulation for demo)
export function useRealtime() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [newAlert, setNewAlert] = useState<Notification | null>(null);

    const addNotification = useCallback((notif: Notification) => {
        setNotifications((prev) => [notif, ...prev].slice(0, 20));
        setNewAlert(notif);
        setTimeout(() => setNewAlert(null), 5000);
    }, []);

    useEffect(() => {
        // 1. Initial connect
        const connectTimer = setTimeout(() => setIsConnected(true), 800);

        // 2. BACKEND POLLING (Real-time sync across devices)
        const fetchReferrals = async () => {
            try {
                const res = await fetch('/api/sync/referrals');
                const data = await res.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    // Map backend data to notification format
                    const latest = data[0];
                    const newNotif: Notification = {
                        id: latest.referralId || latest._id,
                        type: 'new_referral',
                        title: latest.toHospital?.name?.includes('Intake') ? '🚨 NEW PATIENT INTAKE' : '🚨 NEW SYNCED REFERRAL',
                        message: `${latest.patientId} from ${latest.fromHospital?.name || 'Sender'} · ${latest.notes}`,
                        timestamp: new Date(latest.initiatedAt),
                        urgency: latest.urgencyLevel || 'high',
                        referralId: latest.referralId,
                        patientData: latest.fullPatientData as Record<string, unknown>
                    };

                    // Only add if it's new (check last notification ID to prevent duplicates)
                    setNotifications(prev => {
                        if (prev.length > 0 && prev[0].id === newNotif.id) return prev;
                        setNewAlert(newNotif);
                        setTimeout(() => setNewAlert(null), 5000);
                        return [newNotif, ...prev].slice(0, 20);
                    });
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        // Poll every 3 seconds for hackathon demo
        const pollInterval = setInterval(fetchReferrals, 3000);
        fetchReferrals(); // Initial fetch

        return () => {
            clearTimeout(connectTimer);
            clearInterval(pollInterval);
        };
    }, [addNotification]);

    return { notifications, isConnected, newAlert };
}
