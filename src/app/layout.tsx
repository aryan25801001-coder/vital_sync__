import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'VitalSync — Emergency Medical Interoperability Platform',
    description: 'High-speed emergency medical interoperability platform saving lives during the Golden Hour. Real-time hospital discovery, patient handoff, and ambulance tracking.',
    keywords: ['emergency medicine', 'hospital interoperability', 'HL7 FHIR', 'ambulance tracking', 'golden hour'],
    openGraph: {
        title: 'VitalSync — Saving Lives at the Speed of Data',
        description: 'AI-powered emergency patient transfer & hospital coordination platform',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
                {children}
            </body>
        </html>
    );
}
