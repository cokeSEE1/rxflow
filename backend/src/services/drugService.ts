import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

interface DrugResult {
  id: number
  name: string
  genericName: string
  spec: string
  maker: string
  insurance: string
  price: number
  unit: string
  dosageForm: string
  pinyinInitial: string
  searchCode: string
}

interface DrugSearchResult extends DrugResult {
  allergyRisk?: 'severe' | 'moderate' | 'compatible' | null
  allergenName?: string
}

function mapToResult(drug: any): DrugResult {
  return {
    id: drug.id,
    name: drug.standardName,
    genericName: drug.genericName,
    spec: drug.specification,
    maker: drug.manufacturer || '',
    insurance: drug.insuranceCategory,
    price: Number(drug.referencePrice) || 0,
    unit: drug.unit,
    dosageForm: drug.dosageForm,
    pinyinInitial: drug.pinyinInitial,
    searchCode: drug.searchCode,
  }
}

export async function listDrugs(query: { page?: string; pageSize?: string }) {
  const page = parseInt(query.page || '1')
  const pageSize = Math.min(parseInt(query.pageSize || '20'), 100)

  const where = { isActive: true }

  const [data, total] = await Promise.all([
    prisma.drug.findMany({
      where,
      include: { batches: { where: { quantity: { gt: 0 } }, orderBy: { expireDate: 'asc' } } },
      orderBy: { id: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.drug.count({ where }),
  ])

  return {
    data: data.map(mapToResult),
    total,
    page,
    pageSize,
  }
}

export async function getDrug(id: number) {
  const drug = await prisma.drug.findUnique({
    where: { id },
    include: {
      batches: { where: { quantity: { gt: 0 } }, orderBy: { expireDate: 'asc' } },
      ingredients: { include: { allergen: true } },
    },
  })

  if (!drug) throw new AppError(404, '药品不存在')

  return { data: mapToResult(drug) }
}

export async function searchDrugs(query: {
  keyword?: string
  patientId?: string
  pageSize?: string
}) {
  const keyword = (query.keyword || '').trim()
  if (!keyword) return { data: [], total: 0 }

  const pageSize = Math.min(parseInt(query.pageSize || '20'), 100)
  const keywordLower = keyword.toLowerCase()

  const where: any = {
    isActive: true,
    OR: [
      { standardName: { contains: keyword } },
      { genericName: { contains: keyword } },
      { pinyinInitial: { startsWith: keywordLower } },
      { searchCode: { contains: keywordLower } },
    ],
  }

  const drugs = await prisma.drug.findMany({
    where,
    include: { ingredients: { include: { allergen: true } } },
    take: pageSize,
  })

  const patientId = query.patientId ? parseInt(query.patientId) : null
  let results: DrugSearchResult[] = drugs.map(mapToResult)

  if (patientId && drugs.length > 0) {
    results = await computeAllergyRisk(drugs, patientId, results)
  }

  return { data: results, total: results.length }
}

async function computeAllergyRisk(
  drugs: any[],
  patientId: number,
  results: DrugSearchResult[],
): Promise<DrugSearchResult[]> {
  const patientAllergies = await prisma.patientAllergy.findMany({
    where: { patientId },
    include: { allergen: true },
  })

  if (patientAllergies.length === 0) return results

  const allergenSeverity = new Map<number, string>()
  for (const pa of patientAllergies) {
    allergenSeverity.set(pa.allergenId, pa.severity || 'moderate')
  }

  return results.map((result, i) => {
    const drug = drugs[i]
    if (!drug.ingredients || drug.ingredients.length === 0) return result

    let worstSeverity: 'severe' | 'moderate' | 'compatible' | null = null
    let matchedAllergenName: string | undefined

    for (const ing of drug.ingredients) {
      const severity = allergenSeverity.get(ing.allergenId)
      if (!severity) continue

      if (severity === 'severe') {
        return { ...result, allergyRisk: 'severe', allergenName: ing.allergen.name }
      }
      if (severity === 'moderate') {
        worstSeverity = 'moderate'
        matchedAllergenName = ing.allergen.name
      }
      if (severity === 'mild' && !worstSeverity) {
        worstSeverity = 'compatible'
        matchedAllergenName = ing.allergen.name
      }
    }

    if (!worstSeverity && matchedAllergenName) {
      worstSeverity = 'compatible'
    }

    if (worstSeverity) {
      return { ...result, allergyRisk: worstSeverity, allergenName: matchedAllergenName }
    }
    return result
  })
}
