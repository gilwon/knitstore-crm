import type { OnlineSale, OnlineSaleCalc, ProductProfitStat, MonthlyProfitData } from '../types'

export function calcOnlineSale(sale: OnlineSale): OnlineSaleCalc {
  const totalIncome = sale.sale_amount + sale.shipping_income
  const totalFee = sale.order_fee + sale.sales_fee
  const totalCost = sale.product_cost + sale.material_cost + sale.packaging_cost + sale.shipping_cost
  const profit = totalIncome - totalFee - sale.vat - totalCost
  const marginRate = totalIncome > 0 ? (profit / totalIncome) * 100 : 0
  return { totalIncome, totalFee, totalCost, profit, marginRate }
}

export function calcSalesStats(sales: OnlineSale[]) {
  let totalRevenue = 0
  let totalProfit = 0
  let saleCount = sales.length

  const productMap = new Map<string, {
    totalRevenue: number
    totalCost: number
    totalProfit: number
    count: number
  }>()

  const monthlyMap = new Map<string, { revenue: number; profit: number }>()

  for (const sale of sales) {
    const calc = calcOnlineSale(sale)
    totalRevenue += calc.totalIncome
    totalProfit += calc.profit

    // 상품별 집계
    const existing = productMap.get(sale.product_name)
    if (existing) {
      existing.totalRevenue += calc.totalIncome
      existing.totalCost += calc.totalFee + sale.vat + calc.totalCost
      existing.totalProfit += calc.profit
      existing.count += 1
    } else {
      productMap.set(sale.product_name, {
        totalRevenue: calc.totalIncome,
        totalCost: calc.totalFee + sale.vat + calc.totalCost,
        totalProfit: calc.profit,
        count: 1,
      })
    }

    // 월별 집계
    const month = sale.sale_date.substring(0, 7) // YYYY-MM
    const m = monthlyMap.get(month)
    if (m) {
      m.revenue += calc.totalIncome
      m.profit += calc.profit
    } else {
      monthlyMap.set(month, { revenue: calc.totalIncome, profit: calc.profit })
    }
  }

  const avgMarginRate = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const productStats: ProductProfitStat[] = Array.from(productMap.entries())
    .map(([product_name, stat]) => ({
      product_name,
      ...stat,
      marginRate: stat.totalRevenue > 0 ? (stat.totalProfit / stat.totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  const monthlyData: MonthlyProfitData[] = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return { totalRevenue, totalProfit, avgMarginRate, saleCount, productStats, monthlyData }
}
