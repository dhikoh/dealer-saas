import api from './api';

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get('/notifications');
        // Backend returns { notifications: [...], unreadCount: N }
        const data = response.data;
        return Array.isArray(data) ? data : (data?.notifications || []);
    },

    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data?.unreadCount ?? 0;
    },

    markAsRead: async (id: string) => {
        // Backend: PATCH /notifications/:id/read
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllRead: async () => {
        // Backend: POST /notifications/mark-all-read
        const response = await api.post('/notifications/mark-all-read');
        return response.data;
    },
};
