-- shops 테이블에 스마트스토어 API 자격 증명 컬럼 추가
ALTER TABLE shops
  ADD COLUMN smartstore_client_id TEXT,
  ADD COLUMN smartstore_client_secret TEXT;
