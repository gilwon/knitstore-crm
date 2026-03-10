-- process_attendance에 p_attended_at 파라미터 추가
CREATE OR REPLACE FUNCTION process_attendance(
  p_student_id UUID,
  p_subscription_id UUID,
  p_memo TEXT DEFAULT NULL,
  p_attended_at TIMESTAMPTZ DEFAULT NULL
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

  INSERT INTO attendances (student_id, subscription_id, memo, attended_at)
  VALUES (
    p_student_id,
    p_subscription_id,
    p_memo,
    COALESCE(p_attended_at, NOW())
  )
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
