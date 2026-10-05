"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppearanceSettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account/preferences");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
