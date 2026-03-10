-- KnitStore Manager - Initial Schema Migration
-- Design: docs/02-design/features/knitstore-crm.design.md Section 3.3

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 공방
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 상품
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  brand TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  color_code TEXT NOT NULL DEFAULT '',
  color_name TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL CHECK (unit IN ('ball', 'g')) DEFAULT 'ball',
  price INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 로트
CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, lot_number)
);

-- 판매 (stock_movements.sale_item_id 참조 때문에 먼저 생성)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product_sale', 'class_fee')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  student_id UUID, -- 나중에 students FK 추가
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 판매 항목
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id),
  subscription_id UUID, -- 나중에 subscriptions FK 추가
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0
);

-- 재고 이동
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL DEFAULT 'purchase',
  memo TEXT,
  sale_item_id UUID REFERENCES sale_items(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 수강생
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sales.student_id FK 추가
ALTER TABLE sales ADD CONSTRAINT sales_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id);

-- 수강권
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('count', 'period')),
  total_count INTEGER,
  remaining INTEGER,
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at DATE,
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'exhausted')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sale_items.subscription_id FK 추가
ALTER TABLE sale_items ADD CONSTRAINT sale_items_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

-- 출석
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  attended_at TIMESTAMPTZ DEFAULT NOW(),
  memo TEXT
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_lots_product_id ON lots(product_id);
CREATE INDEX idx_stock_movements_lot_id ON stock_movements(lot_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_students_shop_id ON students(shop_id);
CREATE INDEX idx_subscriptions_student_id ON subscriptions(student_id);
CREATE INDEX idx_attendances_student_id ON attendances(student_id);
CREATE INDEX idx_sales_shop_id ON sales(shop_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);

-- ============================================================
-- 3. UPDATED_AT 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_lots_updated_at
  BEFORE UPDATE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- shops: 본인 공방만
CREATE POLICY "shops_owner" ON shops
  FOR ALL USING (owner_id = auth.uid());

-- products: 본인 공방 상품만
CREATE POLICY "products_shop_owner" ON products
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- lots: 본인 공방 로트만
CREATE POLICY "lots_shop_owner" ON lots
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN shops s ON s.id = p.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- stock_movements: 본인 공방 이력만
CREATE POLICY "stock_movements_shop_owner" ON stock_movements
  FOR ALL USING (
    lot_id IN (
      SELECT l.id FROM lots l
      JOIN products p ON p.id = l.product_id
      JOIN shops s ON s.id = p.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- students: 본인 공방 수강생만
CREATE POLICY "students_shop_owner" ON students
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- subscriptions: 본인 공방 수강권만
CREATE POLICY "subscriptions_shop_owner" ON subscriptions
  FOR ALL USING (
    student_id IN (
      SELECT st.id FROM students st
      JOIN shops s ON s.id = st.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- attendances: 본인 공방 출석만
CREATE POLICY "attendances_shop_owner" ON attendances
  FOR ALL USING (
    student_id IN (
      SELECT st.id FROM students st
      JOIN shops s ON s.id = st.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- sales: 본인 공방 판매만
CREATE POLICY "sales_shop_owner" ON sales
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- sale_items: 본인 공방 판매항목만
CREATE POLICY "sale_items_shop_owner" ON sale_items
  FOR ALL USING (
    sale_id IN (
      SELECT sa.id FROM sales sa
      JOIN shops s ON s.id = sa.shop_id
      WHERE s.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. DB FUNCTIONS (트랜잭션 보장)
-- ============================================================

-- 입고 처리
CREATE OR REPLACE FUNCTION process_stock_in(
  p_lot_id UUID,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT 'purchase',
  p_memo TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_movement_id UUID;
BEGIN
  INSERT INTO stock_movements (lot_id, type, quantity, reason, memo)
  VALUES (p_lot_id, 'in', p_quantity, p_reason, p_memo)
  RETURNING id INTO v_movement_id;

  UPDATE lots
  SET stock_quantity = stock_quantity + p_quantity, updated_at = NOW()
  WHERE id = p_lot_id;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 출고 처리 (재고 부족 시 예외)
CREATE OR REPLACE FUNCTION process_stock_out(
  p_lot_id UUID,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT 'sale',
  p_memo TEXT DEFAULT NULL,
  p_sale_item_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_stock INTEGER;
  v_movement_id UUID;
BEGIN
  SELECT stock_quantity INTO v_current_stock
  FROM lots WHERE id = p_lot_id FOR UPDATE;

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: 현재고(%)가 출고 요청량(%)보다 적습니다', v_current_stock, p_quantity;
  END IF;

  INSERT INTO stock_movements (lot_id, type, quantity, reason, memo, sale_item_id)
  VALUES (p_lot_id, 'out', p_quantity, p_reason, p_memo, p_sale_item_id)
  RETURNING id INTO v_movement_id;

  UPDATE lots
  SET stock_quantity = stock_quantity - p_quantity, updated_at = NOW()
  WHERE id = p_lot_id;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 출석 + 수강권 차감
CREATE OR REPLACE FUNCTION process_attendance(
  p_student_id UUID,
  p_subscription_id UUID,
  p_memo TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_sub RECORD;
  v_attendance_id UUID;
BEGIN
  SELECT * INTO v_sub
  FROM subscriptions
  WHERE id = p_subscription_id AND student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF v_sub.status != 'active' THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_ACTIVE: 수강권 상태가 %입니다', v_sub.status;
  END IF;

  IF v_sub.type = 'count' AND v_sub.remaining <= 0 THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EXHAUSTED: 잔여 횟수가 없습니다';
  END IF;

  IF v_sub.type = 'period' AND v_sub.expires_at < CURRENT_DATE THEN
    UPDATE subscriptions SET status = 'expired' WHERE id = p_subscription_id;
    RAISE EXCEPTION 'SUBSCRIPTION_EXPIRED: 수강권이 만료되었습니다';
  END IF;

  INSERT INTO attendances (student_id, subscription_id, memo)
  VALUES (p_student_id, p_subscription_id, p_memo)
  RETURNING id INTO v_attendance_id;

  IF v_sub.type = 'count' THEN
    UPDATE subscriptions
    SET
      remaining = remaining - 1,
      status = CASE WHEN remaining - 1 <= 0 THEN 'exhausted' ELSE 'active' END
    WHERE id = p_subscription_id;
  END IF;

  RETURN v_attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. 회원가입 시 공방 자동 생성 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO shops (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'shop_name', '내 공방'),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
