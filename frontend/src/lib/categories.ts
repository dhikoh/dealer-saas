'use client';

import { Car, Bike, Truck, Bus, Wrench, Package, CircleDot } from 'lucide-react';
import React from 'react';

// Default vehicle categories with icons
export interface VehicleCategory {
    id: string;
    name: string;
    nameId: string; // Indonesian
    icon: string; // Icon key
    color: string;
}

export const VEHICLE_ICONS: Record<string, React.ComponentType<any>> = {
    car: Car,
    bike: Bike,
    truck: Truck,
    bus: Bus,
    wrench: Wrench,
    package: Package,
    circle: CircleDot,
};

export const DEFAULT_CATEGORIES: VehicleCategory[] = [
    { id: 'CAR', name: 'Car', nameId: 'Mobil', icon: 'car', color: 'teal' },
    { id: 'MOTORCYCLE', name: 'Motorcycle', nameId: 'Motor', icon: 'bike', color: 'blue' },
    { id: 'TRUCK', name: 'Truck', nameId: 'Truk', icon: 'truck', color: 'amber' },
    { id: 'BUS', name: 'Bus', nameId: 'Bus', icon: 'bus', color: 'purple' },
    { id: 'BICYCLE', name: 'Bicycle', nameId: 'Sepeda', icon: 'bike', color: 'green' },
    { id: 'EQUIPMENT', name: 'Equipment', nameId: 'Alat Berat', icon: 'wrench', color: 'orange' },
    { id: 'OTHER', name: 'Other', nameId: 'Lainnya', icon: 'package', color: 'gray' },
];

const STORAGE_KEY = 'otohub_categories';

export function getCategories(): VehicleCategory[] {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const custom = JSON.parse(stored);
            return [...DEFAULT_CATEGORIES, ...custom];
        } catch {
            return DEFAULT_CATEGORIES;
        }
    }
    return DEFAULT_CATEGORIES;
}

export function addCategory(category: Omit<VehicleCategory, 'id'>): VehicleCategory {
    const newCategory: VehicleCategory = {
        ...category,
        id: category.name.toUpperCase().replace(/\s+/g, '_'),
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const custom = stored ? JSON.parse(stored) : [];
    custom.push(newCategory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));

    return newCategory;
}

export function getCategoryIcon(iconKey: string): React.ComponentType<any> {
    return VEHICLE_ICONS[iconKey] || CircleDot;
}

export function getCategoryById(id: string): VehicleCategory | undefined {
    return getCategories().find(c => c.id === id);
}

export const ICON_OPTIONS = [
    { key: 'car', label: 'Mobil' },
    { key: 'bike', label: 'Motor/Sepeda' },
    { key: 'truck', label: 'Truk' },
    { key: 'bus', label: 'Bus' },
    { key: 'wrench', label: 'Alat' },
    { key: 'package', label: 'Paket' },
    { key: 'circle', label: 'Lainnya' },
];

export const COLOR_OPTIONS = [
    { key: 'teal', label: 'Teal', class: 'bg-teal-500' },
    { key: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { key: 'amber', label: 'Amber', class: 'bg-amber-500' },
    { key: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { key: 'green', label: 'Green', class: 'bg-green-500' },
    { key: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { key: 'red', label: 'Red', class: 'bg-red-500' },
    { key: 'gray', label: 'Gray', class: 'bg-gray-500' },
];
