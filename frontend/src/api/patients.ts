import client from './client'
export function listPatients(query: any) { return client.get('/patients', { params: query }).then(r => r.data) }
export function getPatient(id: number) { return client.get(`/patients/${id}`).then(r => r.data) }
export function createPatient(data: any) { return client.post('/patients', data).then(r => r.data) }
export function updatePatient(id: number, data: any) { return client.put(`/patients/${id}`, data).then(r => r.data) }
export function deletePatient(id: number) { return client.delete(`/patients/${id}`).then(r => r.data) }
