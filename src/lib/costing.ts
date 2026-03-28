import { prisma } from './prisma'

export const LABOR_RATE_PER_HOUR = 50 // ₪50 לשעה
export const VAT_RATE = 0.17 // 17% מע"מ

/**
 * מחשב עלות חומרי גלם למנה אחת
 */
export function calcIngredientCost(
  ingredients: { quantity: number; ingredient: { costPerUnit: number } }[]
): number {
  return ingredients.reduce((sum, i) => sum + i.quantity * i.ingredient.costPerUnit, 0)
}

/**
 * מחשב עלות עבודה למנה לפי זמן הכנה
 */
export function calcLaborCost(prepTimeMinutes: number): number {
  return (prepTimeMinutes / 60) * LABOR_RATE_PER_HOUR
}

/**
 * מחשב עלות כוללת למנה
 */
export function calcTotalCost(
  ingredients: { quantity: number; ingredient: { costPerUnit: number } }[],
  prepTimeMinutes: number
): { ingredientCost: number; laborCost: number; totalCost: number } {
  const ingredientCost = calcIngredientCost(ingredients)
  const laborCost = calcLaborCost(prepTimeMinutes)
  return { ingredientCost, laborCost, totalCost: ingredientCost + laborCost }
}

/**
 * מחשב סיכום כספי
 */
export async function getFinancialSummary(fromDate?: Date, toDate?: Date) {
  const dateFilter = fromDate && toDate
    ? { gte: fromDate, lte: toDate }
    : fromDate
    ? { gte: fromDate }
    : undefined

  const [orders, expenses, purchases] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { not: 'CANCELLED' },
        paymentStatus: 'PAID',
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
    }),
    prisma.expense.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
    }),
    prisma.purchase.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
    }),
  ])

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0)
  // VAT included in price: vat = revenue * 17/117
  const vatFromRevenue = totalRevenue * (VAT_RATE / (1 + VAT_RATE))
  const revenueBeforeVat = totalRevenue - vatFromRevenue

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalPurchases = purchases.reduce((s, p) => s + p.totalAmount, 0)

  const totalCosts = totalExpenses + totalPurchases
  const profit = totalRevenue - totalCosts

  return {
    totalRevenue,
    vatFromRevenue,
    revenueBeforeVat,
    totalExpenses,
    totalPurchases,
    totalCosts,
    profit,
    orderCount: orders.length,
  }
}
