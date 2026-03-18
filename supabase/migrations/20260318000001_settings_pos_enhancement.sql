-- ============================================================
-- Settings: shops 테이블 프로필 확장 + 온보딩
-- ============================================================
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS business_hours text,
  ADD COLUMN IF NOT EXISTS business_number text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- ============================================================
-- POS: sales 테이블 확장 (할인/결제수단)
-- ============================================================
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS discount_amount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_type text,
  ADD COLUMN IF NOT EXISTS discount_rate numeric,
  ADD COLUMN IF NOT EXISTS original_amount integer,
  ADD COLUMN IF NOT EXISTS memo text;

-- 기존 데이터 보정: original_amount = total_amount (할인 없었으므로)
UPDATE sales SET original_amount = total_amount WHERE original_amount IS NULL;

-- ============================================================
-- POS: refunds 테이블 신설
-- ============================================================
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id),
  shop_id uuid NOT NULL REFERENCES shops(id),
  refund_amount integer NOT NULL,
  reason text,
  refunded_items jsonb NOT NULL DEFAULT '[]',
  payment_method text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refunds_select_own" ON refunds
  FOR SELECT USING (shop_id = (SELECT id FROM shops WHERE owner_id = auth.uid()));

CREATE POLICY "refunds_insert_own" ON refunds
  FOR INSERT WITH CHECK (shop_id = (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_refunds_sale_id ON refunds(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_shop_type_created ON sales(shop_id, type, created_at);

-- ============================================================
-- POS: process_refund 함수
-- ============================================================
CREATE OR REPLACE FUNCTION process_refund(
  p_sale_id uuid,
  p_shop_id uuid,
  p_refund_amount integer,
  p_reason text DEFAULT NULL,
  p_refunded_items jsonb DEFAULT '[]',
  p_payment_method text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refund_id uuid;
  v_item jsonb;
  v_lot_id uuid;
  v_quantity integer;
BEGIN
  -- 환불 레코드 생성
  INSERT INTO refunds (sale_id, shop_id, refund_amount, reason, refunded_items, payment_method)
  VALUES (p_sale_id, p_shop_id, p_refund_amount, p_reason, p_refunded_items, p_payment_method)
  RETURNING id INTO v_refund_id;

  -- 각 환불 항목의 재고 복원
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_refunded_items)
  LOOP
    v_lot_id := (v_item->>'lot_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    IF v_lot_id IS NOT NULL AND v_quantity > 0 THEN
      -- 재고 복원
      UPDATE lots SET stock_quantity = stock_quantity + v_quantity WHERE id = v_lot_id;

      -- 입고 이력 기록
      INSERT INTO stock_movements (lot_id, type, quantity, reason, memo)
      VALUES (v_lot_id, 'in', v_quantity, 'return', '환불 처리 (sale: ' || p_sale_id::text || ')');
    END IF;
  END LOOP;

  RETURN v_refund_id;
END;
$$;
