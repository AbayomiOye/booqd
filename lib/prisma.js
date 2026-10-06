// lib/prisma.js
const { PrismaClient } = require('@prisma/client')

const globalForPrisma = globalThis

const options = {}
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  const runtimeUrl = new URL(process.env.DATABASE_URL)
  runtimeUrl.searchParams.set('connection_limit', '1')
  options.datasources = { db: { url: runtimeUrl.toString() } }
}
const prisma = globalForPrisma.prisma ?? new PrismaClient(options)

globalForPrisma.prisma = prisma

module.exports = { prisma }
