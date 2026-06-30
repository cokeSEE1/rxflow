import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

const VALID_CATEGORIES = ['antibiotic', 'antipyretic', 'enzyme', 'other']

export async function createAllergen(data: {
  name: string
  category: string
  description?: string
}) {
  if (!data.name?.trim()) {
    throw new AppError(400, '过敏原名称不能为空')
  }
  if (!VALID_CATEGORIES.includes(data.category)) {
    throw new AppError(400, `过敏原分类无效，允许值：${VALID_CATEGORIES.join('、')}`)
  }

  try {
    return await prisma.allergen.create({
      data: {
        name: data.name.trim(),
        category: data.category,
        description: data.description || null,
      },
    })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      throw new AppError(409, '过敏原名称已存在')
    }
    throw e
  }
}

export async function updateAllergen(
  id: number,
  data: {
    name?: string
    category?: string
    description?: string
  },
) {
  if (data.name !== undefined && !data.name.trim()) {
    throw new AppError(400, '过敏原名称不能为空')
  }
  if (data.category !== undefined && !VALID_CATEGORIES.includes(data.category)) {
    throw new AppError(400, `过敏原分类无效，允许值：${VALID_CATEGORIES.join('、')}`)
  }

  try {
    return await prisma.allergen.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
      },
    })
  } catch (e: any) {
    if (e?.code === 'P2025') {
      throw new AppError(404, '过敏原不存在')
    }
    if (e?.code === 'P2002') {
      throw new AppError(409, '过敏原名称已存在')
    }
    throw e
  }
}

export async function deleteAllergen(id: number) {
  try {
    return await prisma.allergen.delete({ where: { id } })
  } catch (e: any) {
    if (e?.code === 'P2025') {
      throw new AppError(404, '过敏原不存在')
    }
    if (e?.code === 'P2003') {
      throw new AppError(409, '该过敏原已被药品或过敏档案引用，无法删除')
    }
    throw e
  }
}
