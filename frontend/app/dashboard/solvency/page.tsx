"use client";

import dynamic from "next/dynamic";

const SolvencyContent = dynamic(() => import("./SolvencyContent"), { ssr: false });

export default function SolvencyPage() {
  return <SolvencyContent />;
}
