import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminStatus } from "@/lib/admin.functions";

export function useIsAdmin(userId: string | null | undefined) {
  const fetchStatus = useServerFn(getMyAdminStatus);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    fetchStatus()
      .then((r) => !cancelled && setIsAdmin(!!r.isAdmin))
      .catch(() => !cancelled && setIsAdmin(false));
    return () => {
      cancelled = true;
    };
  }, [userId, fetchStatus]);
  return isAdmin;
}
