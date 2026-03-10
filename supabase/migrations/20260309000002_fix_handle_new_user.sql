-- Fix: handle_new_user trigger search_path issue
-- SECURITY DEFINER 함수는 반드시 SET search_path를 명시해야 함
-- 미설정 시 auth 스키마 컨텍스트에서 public.shops를 찾지 못해
-- "Database error saving new user" 발생

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.shops (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'shop_name', '내 공방'),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
