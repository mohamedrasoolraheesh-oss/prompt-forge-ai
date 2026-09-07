import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { amIAdmin } from "@/lib/admin.functions";

/** True when the signed-in account holds the admin role. */
export function useIsAdmin() {
  const check = useServerFn(amIAdmin);
  const { data, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => check(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return { isAdmin: Boolean(data?.isAdmin), loading: isLoading };
}
