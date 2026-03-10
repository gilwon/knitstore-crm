-- products 테이블에 구매단가 컬럼 추가
ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_price INTEGER NOT NULL DEFAULT 0;
