-- sale_items.subscription_id FK를 ON DELETE SET NULL으로 변경
-- 판매 이력은 유지하되, 수강권 삭제 시 subscription_id를 NULL로 설정

ALTER TABLE sale_items
  DROP CONSTRAINT sale_items_subscription_id_fkey;

ALTER TABLE sale_items
  ADD CONSTRAINT sale_items_subscription_id_fkey
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
