import { Badge } from "@/components/ui/badge";
import { attendanceStatusMap } from "@/lib/constants/site";
import { formatDisplayLabel } from "@/lib/utils";
import { AttendanceStatus } from "@/types/attendance";

type AttendanceStatusBadgeProps = {
  status: AttendanceStatus;
};

export function AttendanceStatusBadge({
  status,
}: AttendanceStatusBadgeProps) {
  const config = attendanceStatusMap[status];

  return (
    <Badge className={config.className}>
      {formatDisplayLabel(config.label)}
    </Badge>
  );
}
