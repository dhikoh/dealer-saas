'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Car, DollarSign, Users, AlertTriangle } from 'lucide-react';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: 'REMINDER' | 'FOLLOW_UP' | 'PAYMENT' | 'INSPECTION';
    description?: string;
}

const EVENT_COLORS: Record<string, string> = {
    REMINDER: 'bg-blue-500',
    FOLLOW_UP: 'bg-purple-500',
    PAYMENT: 'bg-amber-500',
    INSPECTION: 'bg-emerald-500',
};

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/reminders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Map API response to calendar events format
                    const mappedEvents: CalendarEvent[] = [];

                    // Map tax reminders
                    (data.taxReminders || []).forEach((r: any) => {
                        mappedEvents.push({
                            id: `tax-${r.id}`,
                            title: `STNK ${r.licensePlate}`,
                            date: r.stnkExpiry?.split('T')[0] || formatDate(new Date()),
                            type: 'REMINDER',
                            description: r.name,
                        });
                    });

                    // Map credit reminders
                    (data.creditReminders || []).forEach((r: any) => {
                        mappedEvents.push({
                            id: `credit-${r.id}`,
                            title: `Pembayaran ${r.customerName || 'Kredit'}`,
                            date: r.nextDueDate?.split('T')[0] || formatDate(new Date()),
                            type: 'PAYMENT',
                            description: `Cicilan Rp ${new Intl.NumberFormat('id-ID').format(r.monthlyPayment || 0)}`,
                        });
                    });

                    setEvents(mappedEvents);
                } else {
                    setEvents([]);
                }
            } catch (err) {
                console.error('Error fetching reminders:', err);
                setEvents([]);
            }
        };

        fetchReminders();
    }, []);

    function formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getEventsForDate = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const todayStr = formatDate(new Date());
    const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Kalender</h1>
                    <p className="text-gray-500 mt-1">Kelola jadwal dan pengingat</p>
                </div>
                <button className="flex items-center gap-2 bg-[#00bfa5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#00a896] transition-colors shadow-lg">
                    <Plus className="w-5 h-5" /> Tambah Event
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] dark:shadow-none">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            {MONTHS[month]} {year}
                        </h2>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {DAYS.map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells before first day */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-20 rounded-lg"></div>
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayEvents = getEventsForDate(day);
                            const isToday = dateStr === todayStr;
                            const isSelected = dateStr === selectedDate;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`h-20 rounded-lg p-2 text-left transition-all ${isSelected ? 'ring-2 ring-[#00bfa5]' :
                                        isToday ? 'bg-[#00bfa5]/10' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className={`text-sm font-medium ${isToday ? 'text-[#00bfa5]' : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {day}
                                    </span>
                                    <div className="mt-1 space-y-0.5">
                                        {dayEvents.slice(0, 2).map(e => (
                                            <div
                                                key={e.id}
                                                className={`w-full h-1.5 rounded-full ${EVENT_COLORS[e.type]}`}
                                            />
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <span className="text-xs text-gray-400">+{dayEvents.length - 2}</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Event List */}
                <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] dark:shadow-none">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Event Mendatang'}
                    </h3>

                    <div className="space-y-3">
                        {(selectedDate ? selectedEvents : events.slice(0, 5)).map((event) => (
                            <div key={event.id} className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-full min-h-[3rem] rounded-full ${EVENT_COLORS[event.type]}`} />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 dark:text-white text-sm">{event.title}</p>
                                        {event.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(event.date).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {((selectedDate && selectedEvents.length === 0) || (!selectedDate && events.length === 0)) && (
                            <p className="text-center text-gray-500 py-8">Tidak ada event</p>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 mb-2">Legenda:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Reminder</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /> Follow-up</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> Payment</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Inspeksi</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
