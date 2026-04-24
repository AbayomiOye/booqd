// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin
  const adminHash = await bcrypt.hash('admin1234', 12)
  await prisma.user.upsert({
    where: { email: 'admin@booqd.ng' },
    update: {},
    create: { name: 'Platform Admin', email: 'admin@booqd.ng', passwordHash: adminHash, role: 'ADMIN' },
  })

  // Provider 1
  const p1Hash = await bcrypt.hash('password123', 12)
  const p1User = await prisma.user.upsert({
    where: { email: 'zara@booqd.ng' },
    update: {},
    create: { name: 'Zara Beauty', email: 'zara@booqd.ng', passwordHash: p1Hash, role: 'PROVIDER' },
  })
  const p1 = await prisma.provider.upsert({
    where: { userId: p1User.id },
    update: {},
    create: {
      userId: p1User.id,
      businessName: "Zara's Glam Studio",
      description: "Professional makeup artist and hair stylist with 6 years experience. Specialising in bridal looks, gele tying, and natural hair care.",
      location: "Lekki Phase 1, Lagos",
      phone: "08012345678",
      category: "Makeup & Hair",
      verified: true,
    },
  })
  await prisma.service.createMany({
    skipDuplicates: true,
    data: [
      { providerId: p1.id, serviceName: 'Bridal Makeup', description: 'Full glam bridal look including airbrush foundation, lashes, and setting spray', durationMin: 120, price: 35000 },
      { providerId: p1.id, serviceName: 'Gele Tying', description: 'Traditional aso-oke gele in any style', durationMin: 45, price: 8000 },
      { providerId: p1.id, serviceName: 'Natural Hair Styling', description: 'Wash, condition, and style for 4C natural hair', durationMin: 90, price: 12000 },
      { providerId: p1.id, serviceName: 'Everyday Makeup', description: 'Light to medium coverage everyday beat', durationMin: 60, price: 15000 },
    ],
  })
  await prisma.portfolio.createMany({
    skipDuplicates: true,
    data: [
      { providerId: p1.id, imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400', caption: 'Bridal glam' },
      { providerId: p1.id, imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400', caption: 'Natural hair styling' },
      { providerId: p1.id, imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', caption: 'Evening beat' },
    ],
  })

  // Provider 2
  const p2Hash = await bcrypt.hash('password123', 12)
  const p2User = await prisma.user.upsert({
    where: { email: 'grace@booqd.ng' },
    update: {},
    create: { name: 'Grace Nails', email: 'grace@booqd.ng', passwordHash: p2Hash, role: 'PROVIDER' },
  })
  const p2 = await prisma.provider.upsert({
    where: { userId: p2User.id },
    update: {},
    create: {
      userId: p2User.id,
      businessName: "Grace Nail Bar",
      description: "Premium nail technician offering gel, acrylic, and nail art services. Based in Abuja, home service available.",
      location: "Wuse 2, Abuja",
      phone: "08098765432",
      category: "Nails",
      verified: true,
    },
  })
  await prisma.service.createMany({
    skipDuplicates: true,
    data: [
      { providerId: p2.id, serviceName: 'Gel Manicure', description: 'Gel polish manicure with cuticle care, last 2-3 weeks', durationMin: 60, price: 6500 },
      { providerId: p2.id, serviceName: 'Acrylic Full Set', description: 'Full set of acrylic nails with your choice of length and shape', durationMin: 90, price: 14000 },
      { providerId: p2.id, serviceName: 'Nail Art', description: 'Custom nail art designs — 3D, chrome, ombre, or freehand', durationMin: 75, price: 10000 },
      { providerId: p2.id, serviceName: 'Pedicure', description: 'Classic pedicure with scrub, massage, and polish', durationMin: 50, price: 5000 },
    ],
  })
  await prisma.portfolio.createMany({
    skipDuplicates: true,
    data: [
      { providerId: p2.id, imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400', caption: 'Gel nails' },
      { providerId: p2.id, imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400', caption: 'Nail art' },
    ],
  })

  // Provider 3
  const p3Hash = await bcrypt.hash('password123', 12)
  const p3User = await prisma.user.upsert({
    where: { email: 'fatima@booqd.ng' },
    update: {},
    create: { name: 'Fatima Skincare', email: 'fatima@booqd.ng', passwordHash: p3Hash, role: 'PROVIDER' },
  })
  const p3 = await prisma.provider.upsert({
    where: { userId: p3User.id },
    update: {},
    create: {
      userId: p3User.id,
      businessName: "Fatima's Skin Clinic",
      description: "Licensed esthetician specialising in skin care for melanin-rich skin. Facials, brightening treatments, and acne management.",
      location: "GRA, Port Harcourt",
      phone: "08055512345",
      category: "Skincare",
      verified: true,
    },
  })
  await prisma.service.createMany({
    skipDuplicates: true,
    data: [
      { providerId: p3.id, serviceName: 'Deep Cleansing Facial', description: 'Steam, extraction, mask, and moisturize for all skin types', durationMin: 75, price: 18000 },
      { providerId: p3.id, serviceName: 'Brightening Treatment', description: 'Vitamin C and kojic acid treatment for hyperpigmentation', durationMin: 60, price: 22000 },
      { providerId: p3.id, serviceName: 'Acne Management Facial', description: 'Targeted treatment for active breakouts and acne scarring', durationMin: 90, price: 25000 },
    ],
  })

  // Sample client
  const cHash = await bcrypt.hash('password123', 12)
  await prisma.user.upsert({
    where: { email: 'client@booqd.ng' },
    update: {},
    create: { name: 'Amara Obi', email: 'client@booqd.ng', passwordHash: cHash, role: 'CLIENT' },
  })

  console.log('Seeding complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
