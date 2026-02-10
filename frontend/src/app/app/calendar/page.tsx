'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Car, DollarSign, Users, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: 'REMINDER' | 'FOLLOW_UP' | 'PAYMENT' | 'INSPECTION';
    description?: string;
    isManual?: boolean;
}

const EVENT_COLORS: Record<string, string> = {
    REMINDER: 'bg-blue-500',
    FOLLOW_UP: 'bg-purple-500',
    PAYMENT: 'bg-amber-500',
    INSPECTION: 'bg-emerald-500',
};

const EVENT_LABELS: Record<string, string> = {
    REMINDER: 'Pengingat',
    FOLLOW_UP: 'Follow-up',
    PAYMENT: 'Pembayaran',
    INSPECTION: 'Inspeksi',
};

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Load manual events from localStorage
function loadManualEvents(): CalendarEvent[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem('otohub_calendar_events');
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
}

function saveManualEvents(events: CalendarEvent[]) {
    localStorage.setItem('otohub_calendar_events', JSON.stringify(events));
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [eventForm, setEventForm] = useState({
        title: '',
        date: '',
        type: 'REMINDER' as CalendarEvent['type'],
        description: '',
    });

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/reminders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const apiEvents: CalendarEvent[] = [];

                if (res.ok) {
                    const data = await res.json();

                    // Map tax reminders
                    (data.taxReminders || []).forEach((r: any) => {
                        apiEvents.push({
                            id: `tax-${r.id}`,
                            title: `STNK ${r.licensePlate}`,
                            date: r.stnkExpiry?.split('T')[0] || formatDate(new Date()),
                            type: 'REMINDER',
                            description: r.name,
                        });
                    });

                    // Map credit reminders
                    (data.creditReminders || []).forEach((r: any) => {
                        apiEvents.push({
                            id: `credit-${r.id}`,
                            title: `Pembayaran ${r.customerName || 'Kredit'}`,
                            date: r.nextDueDate?.split('T')[0] || formatDate(new Date()),
                            type: 'PAYMENT',
                            description: `Cicilan Rp ${new Intl.NumberFormat('id-ID').format(r.monthlyPayment || 0)}`,
                        });
                    });
                } else if (res.status === 401) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_info');
                    window.location.href = '/auth';
                    return;
                }

                // Merge API events + manual events from localStorage
                const manualEvents = loadManualEvents();
                setEvents([...apiEvents, ...manualEvents]);
            } catch (err) {
                console.error('Error fetching reminders:', err);
                // Still load manual events even if API fails
                setEvents(loadManualEvents());
            }
        };

        fetchReminders();
    }, []);

    function formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
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

    const openAddModal = (preselectedDate?: string) => {
        setEventForm({
            title: '',
            date: preselectedDate || selectedDate || formatDate(new Date()),
            type: 'REMINDER',
            description: '',
        });
        setShowAddModal(true);
    };

    const handleAddEvent = () => {
        if (!eventForm.title.trim()) {
            toast.error('Judul event wajib diisi');
            return;
        }
        if (!eventForm.date) {
            toast.error('Tanggal wajib dipilih');
            return;
        }

        const newEvent: CalendarEvent = {
            id: `manual-${Date.now()}`,
            title: eventForm.title.trim(),
            date: eventForm.date,
            type: eventForm.type,
            description: eventForm.description.trim() || undefined,
            isManual: true,
        };

        const manualEvents = loadManualEvents();
        manualEvents.push(newEvent);
        saveManualEvents(manualEvents);

        setEvents(prev => [...prev, newEvent]);
        setShowAddModal(false);
        toast.success('Event berhasil ditambahkan');
    };

    const handleDeleteEvent = (eventId: string) => {
        const manualEvents = loadManualEvents().filter(e => e.id !== eventId);
        saveManualEvents(manualEvents);
        setEvents(prev => prev.filter(e => e.id !== eventId));
        toast.success('Event dihapus');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Kalender</h1>
                    <p className="text-gray-500 mt-1">Kelola jadwal dan pengingat</p>
                </div>
                <button
                    onClick={() => openAddModal()}
                    className="flex items-center gap-2 bg-[#00bfa5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#00a896] transition-colors shadow-lg"
                >
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
                                    onDoubleClick={() => openAddModal(dateStr)}
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
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Event Mendatang'}
                        </h3>
                        {selectedDate && (
                            <button
                                onClick={() => openAddModal(selectedDate)}
                                className="p-1.5 rounded-lg text-[#00bfa5] hover:bg-[#00bfa5]/10 transition-colors"
                                title="Tambah event di tanggal ini"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {(selectedDate ? selectedEvents : events.slice(0, 5)).map((event) => (
                            <div key={event.id} className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-full min-h-[3rem] rounded-full ${EVENT_COLORS[event.type]}`} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-gray-800 dark:text-white text-sm">{event.title}</p>
                                            {event.isManual && (
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Hapus event"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#00bfa5] mt-0.5">{EVENT_LABELS[event.type]}</p>
                                        {event.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(event.date + 'T00:00:00').toLocaleDateString('id-ID')}
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
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Pengingat</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /> Follow-up</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> Pembayaran</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Inspeksi</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Tambah Event</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Judul *</label>
                                <input
                                    type="text"
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                    placeholder="Contoh: Follow-up customer Budi"
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Tanggal *</label>
                                <input
                                    type="date"
                                    value={eventForm.date}
                                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Tipe Event</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['REMINDER', 'FOLLOW_UP', 'PAYMENT', 'INSPECTION'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setEventForm({ ...eventForm, type: t })}
                                            className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${eventForm.type === t
                                                ? 'bg-[#00bfa5] text-white shadow-lg'
                                                : 'bg-[#ecf0f3] dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none'
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[t]}`} />
                                            {EVENT_LABELS[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Deskripsi</label>
                                <textarea
                                    value={eventForm.description}
                                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                    placeholder="Detail tambahan..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] resize-none text-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAddEvent}
                                    className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] transition-all"
                                >
                                    Simpan Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
