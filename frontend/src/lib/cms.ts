
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
        const res = await fetch(`${API_URL}/public/content`, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error("Failed to fetch landing content:", error);
        return null;
    }
}

export async function getPublicPlans(): Promise<PublicPlan[]> {
    try {
        const res = await fetch(`${API_URL}/plans/public`, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        const text = await res.text();
        return text ? JSON.parse(text) : [];
    } catch (error) {
        console.error("Failed to fetch public plans:", error);
        return [];
    }
}
