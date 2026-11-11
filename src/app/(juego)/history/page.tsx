import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryView } from "./history-view";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Historial" };

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="pt-24"><Skeleton /></div>}>
      <HistoryView />
    </Suspense>
  );
}
