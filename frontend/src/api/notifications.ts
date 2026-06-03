import client from './client'
export function listNotifications(query?: any) { return client.get('/notifications', { params: query }).then(r => r.data) }
export function markAsRead(id: number) { return client.put(`/notifications/${id}/read`).then(r => r.data) }
export function markAllRead() { return client.put('/notifications/read-all').then(r => r.data) }
