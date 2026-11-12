import type { Metadata } from "next";
import { Suspense } from "react";
import { DiplomaView } from "./diploma-view";

export async function generateMetadata({ params }: PageProps<"/diploma/[word]/[year]">): Promise<Metadata> {
  const { word, year } = await params;
  return { title: `Diploma de «${decodeURIComponent(word)}» (${year})`, robots: { index: false } };
}

export default function DiplomaPage({ params }: PageProps<"/diploma/[word]/[year]">) {
  return (
    <Suspense fallback={<p className="p-10 text-center text-[#f3ead8]">Preparando el diploma…</p>}>
      <Diploma params={params} />
    </Suspense>
  );
}

async function Diploma({ params }: { params: PageProps<"/diploma/[word]/[year]">["params"] }) {
  const { word, year } = await params;
  return <DiplomaView word={decodeURIComponent(word)} year={Number(year)} />;
}
