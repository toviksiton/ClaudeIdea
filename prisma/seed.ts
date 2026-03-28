import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // מרכיבים לדוגמה
  const patty = await prisma.ingredient.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'קציצת המבורגר', unit: 'יח\'', quantity: 30, alertLevel: 5 },
  })
  const bun = await prisma.ingredient.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'לחמניית המבורגר', unit: 'יח\'', quantity: 30, alertLevel: 5 },
  })
  const lettuce = await prisma.ingredient.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'חסה', unit: 'עלה', quantity: 60, alertLevel: 10 },
  })
  const sauce = await prisma.ingredient.upsert({
    where: { id: 4 },
    update: {},
    create: { name: 'רוטב המבורגר', unit: 'מ"ל', quantity: 500, alertLevel: 50 },
  })
  const schnitzel = await prisma.ingredient.upsert({
    where: { id: 5 },
    update: {},
    create: { name: 'שניצל עוף', unit: 'יח\'', quantity: 20, alertLevel: 5 },
  })
  const falafel = await prisma.ingredient.upsert({
    where: { id: 6 },
    update: {},
    create: { name: 'קציצות פלאפל', unit: 'יח\'', quantity: 100, alertLevel: 20 },
  })
  const pita = await prisma.ingredient.upsert({
    where: { id: 7 },
    update: {},
    create: { name: 'פיתה', unit: 'יח\'', quantity: 40, alertLevel: 10 },
  })
  const tahini = await prisma.ingredient.upsert({
    where: { id: 8 },
    update: {},
    create: { name: 'טחינה', unit: 'מ"ל', quantity: 1000, alertLevel: 100 },
  })

  // פריטי תפריט לדוגמה
  const burger = await prisma.menuItem.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'המבורגר ביתי',
      description: 'המבורגר טרי עם קציצה ביתית, חסה, עגבנייה ורוטב מיוחד',
      price: 45,
      category: 'המבורגרים',
      isActive: true,
      isAvailable: true,
      sortOrder: 1,
    },
  })

  const schnitzelItem = await prisma.menuItem.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'שניצל קריספי',
      description: 'שניצל עוף פריך עם לחמניה וחסה',
      price: 40,
      category: 'עיקריות',
      isActive: true,
      isAvailable: true,
      sortOrder: 2,
    },
  })

  const falafelItem = await prisma.menuItem.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'פלאפל בפיתה',
      description: '5 קציצות פלאפל בפיתה טרייה עם טחינה',
      price: 25,
      category: 'אוכל רחוב',
      isActive: true,
      isAvailable: true,
      sortOrder: 3,
    },
  })

  // קישור מרכיבים לפריטי תפריט
  await prisma.menuItemIngredient.createMany({
    data: [
      // המבורגר
      { menuItemId: burger.id, ingredientId: patty.id, quantity: 1 },
      { menuItemId: burger.id, ingredientId: bun.id, quantity: 1 },
      { menuItemId: burger.id, ingredientId: lettuce.id, quantity: 2 },
      { menuItemId: burger.id, ingredientId: sauce.id, quantity: 30 },
      // שניצל
      { menuItemId: schnitzelItem.id, ingredientId: schnitzel.id, quantity: 1 },
      { menuItemId: schnitzelItem.id, ingredientId: bun.id, quantity: 1 },
      { menuItemId: schnitzelItem.id, ingredientId: lettuce.id, quantity: 2 },
      // פלאפל
      { menuItemId: falafelItem.id, ingredientId: falafel.id, quantity: 5 },
      { menuItemId: falafelItem.id, ingredientId: pita.id, quantity: 1 },
      { menuItemId: falafelItem.id, ingredientId: tahini.id, quantity: 50 },
    ],
  })

  // הגדרות מערכת
  await prisma.setting.createMany({
    data: [
      { key: 'business_name', value: 'מטבח הכפר' },
      { key: 'business_phone', value: '050-1234567' },
      { key: 'paybox_link', value: 'https://payboxapp.page.link/your-link-here' },
      { key: 'bit_phone', value: '050-1234567' },
      { key: 'admin_password', value: 'admin123' },
      { key: 'event_active', value: 'true' },
    ],
  })

  console.log('✅ Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
