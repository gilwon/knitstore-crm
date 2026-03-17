-- 포장비 템플릿에 실원가, 부자재원가 추가
ALTER TABLE packaging_templates ADD COLUMN product_cost INTEGER NOT NULL DEFAULT 0;
ALTER TABLE packaging_templates ADD COLUMN material_cost INTEGER NOT NULL DEFAULT 0;
