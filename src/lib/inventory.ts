import { prisma } from './prisma'

/**
 * מחשב כמה פריטים ניתן להכין לפי המלאי הקיים
 * Returns max quantity possible for a menu item based on current stock
 */
export async function getMenuItemMaxQuantity(menuItemId: number): Promise<number> {
  const ingredients = await prisma.menuItemIngredient.findMany({
    where: { menuItemId },
    include: { ingredient: true },
  })

  if (ingredients.length === 0) return 9999 // ללא מרכיבים - אין הגבלה

  let maxQty = Infinity
  for (const mi of ingredients) {
    const possible = Math.floor(mi.ingredient.quantity / mi.quantity)
    if (possible < maxQty) maxQty = possible
  }
  return maxQty === Infinity ? 0 : maxQty
}

/**
 * מוריד מלאי לפי הזמנה
 * Deducts inventory for a confirmed order
 */
export async function deductInventoryForOrder(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              ingredients: {
                include: { ingredient: true },
              },
            },
          },
        },
      },
    },
  })

  if (!order) throw new Error('Order not found')

  for (const item of order.items) {
    for (const ing of item.menuItem.ingredients) {
      await prisma.ingredient.update({
        where: { id: ing.ingredientId },
        data: {
          quantity: {
            decrement: ing.quantity * item.quantity,
          },
        },
      })
    }
  }

  // עדכן זמינות פריטי תפריט
  await refreshMenuAvailability()
}

/**
 * מחזיר מלאי (בביטול הזמנה)
 */
export async function restoreInventoryForOrder(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              ingredients: {
                include: { ingredient: true },
              },
            },
          },
        },
      },
    },
  })

  if (!order) throw new Error('Order not found')

  for (const item of order.items) {
    for (const ing of item.menuItem.ingredients) {
      await prisma.ingredient.update({
        where: { id: ing.ingredientId },
        data: {
          quantity: {
            increment: ing.quantity * item.quantity,
          },
        },
      })
    }
  }

  await refreshMenuAvailability()
}

/**
 * מרענן זמינות כל פריטי התפריט לפי המלאי
 */
export async function refreshMenuAvailability(): Promise<void> {
  const menuItems = await prisma.menuItem.findMany({
    where: { isActive: true },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
  })

  for (const item of menuItems) {
    if (item.ingredients.length === 0) continue

    let canMake = true
    for (const mi of item.ingredients) {
      if (mi.ingredient.quantity < mi.quantity) {
        canMake = false
        break
      }
    }

    if (item.isAvailable !== canMake) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { isAvailable: canMake },
      })
    }
  }
}

/**
 * מחזיר פריטי תפריט עם כמות מקסימלית אפשרית
 */
export async function getMenuWithStock() {
  const items = await prisma.menuItem.findMany({
    where: { isActive: true },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return items.map((item) => {
    let maxQty = 9999
    if (item.ingredients.length > 0) {
      for (const mi of item.ingredients) {
        const possible = Math.floor(mi.ingredient.quantity / mi.quantity)
        if (possible < maxQty) maxQty = possible
      }
    }
    return {
      ...item,
      maxQuantity: maxQty,
      isAvailable: item.isAvailable && maxQty > 0,
    }
  })
}
