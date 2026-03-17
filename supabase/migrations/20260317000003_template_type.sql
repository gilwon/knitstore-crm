-- 포장 템플릿 → 원가 템플릿 (포장/실원가/부자재 구분)
-- 이전 마이그레이션(000002)에서 추가한 product_cost, material_cost 제거
ALTER TABLE packaging_templates DROP COLUMN IF EXISTS product_cost;
ALTER TABLE packaging_templates DROP COLUMN IF EXISTS material_cost;

-- type 컬럼 추가
ALTER TABLE packaging_templates ADD COLUMN type TEXT NOT NULL DEFAULT 'packaging'
  CHECK (type IN ('packaging', 'product_cost', 'material_cost'));

CREATE INDEX idx_packaging_templates_type ON packaging_templates(type);
