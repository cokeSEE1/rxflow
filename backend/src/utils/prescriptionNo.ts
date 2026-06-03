export function generatePrescriptionNo(id: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `PRS-${date}-${String(id).padStart(6, '0')}`
}
