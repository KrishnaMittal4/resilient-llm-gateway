import { useCallback, useEffect, useState } from "react";
import { getHealth } from "../services/api";

export function useHealth(intervalMs = 30000) {
  const [health, setHealth] = useState({ loading: true, ok: false, data: null });
  const refresh = useCallback(async () => {
    try {
      const data = await getHealth();
      setHealth({ loading: false, ok: data?.status === "ok", data });
    } catch {
      setHealth({ loading: false, ok: false, data: null });
    }
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, intervalMs);
    return () => clearInterval(t);
  }, [refresh, intervalMs]);
  return { ...health, refresh };
}
