import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { followUser, unfollowUser, getFollowState } from "@/lib/follows.functions";
import { supabase } from "@/integrations/supabase/client";

export function FollowButton({
  username,
  className,
}: {
  username: string;
  className?: string;
}) {
  const follow = useServerFn(followUser);
  const unfollow = useServerFn(unfollowUser);
  const state = useServerFn(getFollowState);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [following, setFollowing] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  useEffect(() => {
    if (signedIn !== true) {
      setLoaded(true);
      return;
    }
    state({ data: { username } })
      .then((r) => {
        setFollowing(r.followedByMe);
        setCount(r.followerCount);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [signedIn, username, state]);

  const onClick = async () => {
    if (signedIn !== true) {
      window.location.href = `/login?next=${encodeURIComponent(`/chef/${username}`)}`;
      return;
    }
    setBusy(true);
    const nextFollowing = !following;
    setFollowing(nextFollowing);
    setCount((c) => c + (nextFollowing ? 1 : -1));
    try {
      if (nextFollowing) await follow({ data: { username } });
      else await unfollow({ data: { username } });
    } catch (e) {
      setFollowing(!nextFollowing);
      setCount((c) => c - (nextFollowing ? 1 : -1));
      toast.error(e instanceof Error ? e.message : "Couldn't update follow.");
    } finally {
      setBusy(false);
    }
  };

  const base =
    "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide border-2 border-border shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5 disabled:opacity-60";
  const style = following ? "bg-card text-foreground" : "bg-paprika text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || !loaded}
      className={`${base} ${style} ${className ?? ""}`}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : following ? (
        <UserCheck className="size-4" />
      ) : (
        <UserPlus className="size-4" />
      )}
      {following ? "Following" : "Follow"}
      {loaded && signedIn && (
        <span className="ml-1 opacity-70">· {count}</span>
      )}
    </button>
  );
}