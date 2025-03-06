
import TimelineLevel1 from "./TimelineLevel1";

export const getPageSize = (pageSize: Array<number>) => {
  return pageSize.reduce((acc, curr) => acc * curr, 1);
}

export default function TimelinePage() {
  return (
    <div>
      <TimelineLevel1 pageSize={[5, 8, 8, 12]} />
    </div>
  );
}
