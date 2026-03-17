-- 온라인 판매 원가/이익 관리 테이블
-- Design: docs/02-design/features/online-sales-cost.design.md Section 1

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 포장비 템플릿
CREATE TABLE packaging_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 온라인 판매
CREATE TABLE online_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_number TEXT NOT NULL DEFAULT '',
  product_name TEXT NOT NULL,
  sale_amount INTEGER NOT NULL DEFAULT 0,
  shipping_income INTEGER NOT NULL DEFAULT 0,
  order_fee INTEGER NOT NULL DEFAULT 0,
  sales_fee INTEGER NOT NULL DEFAULT 0,
  vat INTEGER NOT NULL DEFAULT 0,
  product_cost INTEGER NOT NULL DEFAULT 0,
  material_cost INTEGER NOT NULL DEFAULT 0,
  packaging_cost INTEGER NOT NULL DEFAULT 0,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_packaging_templates_shop_id ON packaging_templates(shop_id);
CREATE INDEX idx_online_sales_shop_id ON online_sales(shop_id);
CREATE INDEX idx_online_sales_sale_date ON online_sales(sale_date DESC);
CREATE INDEX idx_online_sales_product_name ON online_sales(product_name);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE packaging_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packaging_templates_shop_owner" ON packaging_templates
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

CREATE POLICY "online_sales_shop_owner" ON online_sales
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );
