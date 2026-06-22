import { PrismaClient } from '@prisma/client'

// Simple PrismaClient instantiation for Prisma 7
const prisma = new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma
}

export default prisma
export { prisma }