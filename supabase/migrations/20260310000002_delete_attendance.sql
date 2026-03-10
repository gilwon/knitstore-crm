-- 출석 삭제 + 횟수제 수강권 잔여횟수 복원
CREATE OR REPLACE FUNCTION delete_attendance(
  p_attendance_id UUID
) RETURNS VOID AS $$
DECLARE
  v_att RECORD;
  v_sub RECORD;
BEGIN
  SELECT * INTO v_att
  FROM attendances
  WHERE id = p_attendance_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ATTENDANCE_NOT_FOUND';
  END IF;

  DELETE FROM attendances WHERE id = p_attendance_id;

  -- 횟수제 수강권이면 잔여횟수 복원
  SELECT * INTO v_sub FROM subscriptions WHERE id = v_att.subscription_id;
  IF FOUND AND v_sub.type = 'count' THEN
    UPDATE subscriptions
    SET
      remaining = remaining + 1,
      status = CASE WHEN status = 'exhausted' THEN 'active' ELSE status END
    WHERE id = v_att.subscription_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
