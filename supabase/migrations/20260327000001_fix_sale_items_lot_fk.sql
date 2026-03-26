-- sale_items.lot_id FK를 ON DELETE SET NULL으로 변경
-- 판매 이력은 유지하되, 로트/상품 삭제 시 lot_id를 NULL로 설정

ALTER TABLE sale_items
  DROP CONSTRAINT sale_items_lot_id_fkey;

ALTER TABLE sale_items
  ADD CONSTRAINT sale_items_lot_id_fkey
    FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE SET NULL;
