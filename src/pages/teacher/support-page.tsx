import { StaffShell } from "@/features/staff/components/shell";
import { walasSidebarItems } from "@/features/staff/components/sidebar";
import { UserSupportCenter } from "@/features/support/components/user-support-center";

export function TeacherSupportPage() {
  return (
    <StaffShell expectedRole="walas" sidebarItems={walasSidebarItems} userLabel="Guru" eyebrow="Portal Guru" resolveTitle={() => "Pusat Bantuan"}>
      {() => <UserSupportCenter />}
    </StaffShell>
  );
}
