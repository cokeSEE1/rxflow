import client from './client'
export function getStats() { return client.get('/dashboard/stats').then((r) => r.data) }
