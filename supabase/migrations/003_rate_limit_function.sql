-- Atomic rate-limit increment — SECURITY DEFINER bypasses RLS
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_user_id      UUID,
  p_service      TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO api_rate_limits (user_id, service, window_start, request_count)
  VALUES (p_user_id, p_service, p_window_start, 1)
  ON CONFLICT (user_id, service, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count;
$$;

-- Only service_role may call this
REVOKE ALL ON FUNCTION public.increment_rate_limit FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit TO service_role;