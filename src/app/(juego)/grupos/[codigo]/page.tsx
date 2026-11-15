import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { GroupView } from "./group-view";

export const metadata: Metadata = {
  title: "Grupo de FirstOne",
  description: "Únete al grupo y compite en vuestra propia clasificación de palabras, rachas y juegos.",
  robots: { index: false },
};

type Params = Promise<{ codigo: string }>;

export default function GroupPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="pt-24"><Skeleton /></div>}>
      <Group params={params} />
    </Suspense>
  );
}

async function Group({ params }: { params: Params }) {
  const { codigo } = await params;
  return <GroupView code={decodeURIComponent(codigo).toUpperCase()} />;
}
