import { StudentShell } from "@/features/student/components/shell";
import { UserSupportCenter } from "@/features/support/components/user-support-center";

export function StudentSupportPage() {
  return <StudentShell>{() => <UserSupportCenter />}</StudentShell>;
}
