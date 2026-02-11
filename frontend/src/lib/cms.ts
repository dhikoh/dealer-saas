
import { API_URL } from "./api";

export interface LandingContent {
    hero: {
        title: string;
        subtitle: string;
        ctaText: string;
        ctaLink: string;
        bgImage?: string;
    };
    features: {
        icon: string;
        title: string;
        description: string;
        badge?: string;
    }[];
    pricing: any[]; // We'll merge this with Plan data
    faq: {
        question: string;
        answer: string;
    }[];
    footer: {
        copyright: string;
        links: { label: string; url: string }[];
        socials: { platform: string; url: string }[];
    };
}

export interface PublicPlan {
    id: string;
    name: string;
    slug: string;
    price: string; // Decimal comes as string often
    description: string;
    features: any; // JSON
    canCreateGroup: boolean;
}

export async function getLandingContent(): Promise<LandingContent | null> {
    try {
        // Add cache: 'no-store' for dynamic, or 'force-cache' for SSG
        // For now, next: { revalidate: 60 } is a good balance
        const res = await fetch(`${API_URL}/public/content`, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch landing content:", error);
        return null;
    }
}

export async function getPublicPlans(): Promise<PublicPlan[]> {
    try {
        const res = await fetch(`${API_URL}/plans/public`, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error("Failed to fetch public plans:", error);
        return [];
    }
}
