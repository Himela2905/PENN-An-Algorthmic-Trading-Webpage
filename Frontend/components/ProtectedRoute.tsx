"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/liveApi";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn()) {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Render nothing until we've confirmed we're on the client AND checked auth.
  // This is identical on server and first client render, so no mismatch.
  if (!mounted || !authorized) return null;

  return <>{children}</>;
}