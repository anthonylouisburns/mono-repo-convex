// import { useState } from "react";
import TimelineLevel1 from "./TimelineLevel1";
import { useSearchParams } from "react-router-dom";
export const getPageSize = (pageSize: Array<number>) => {
  return pageSize.reduce((acc, curr) => acc * curr, 1);
}

export default function TimelinePage() {
  const [searchParams] = useSearchParams();
  const selectedOffset = searchParams.get("index") ?? "-1";
  

  return (
    <div>
      <TimelineLevel1 pageSize={[5, 8, 8, 12]} selectedOffset={Number(selectedOffset)} />
    </div>
  );
}
