import type { Lot } from '@/types/database'

export interface LotMixCheck {
  hasMix: boolean
  activeLots: Lot[]
}

/**
 * 로트 혼합 여부 확인: 재고 있는 로트가 2개 이상이고 출고 요청 수량을 합산해야 하는 경우
 */
export function checkLotMix(lots: Lot[], requestedQty: number): LotMixCheck {
  const activeLots = lots.filter((l) => l.stock_quantity > 0)
  if (activeLots.length <= 1) return { hasMix: false, activeLots }

  const maxSingleLot = Math.max(...activeLots.map((l) => l.stock_quantity))
  const hasMix = maxSingleLot < requestedQty

  return { hasMix, activeLots }
}
