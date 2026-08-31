"use client";

import dynamic from "next/dynamic";

const ServiceAreaMap = dynamic(() => import("./ServiceAreaMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-line/40" />,
});

export default ServiceAreaMap;
