import { roleDashboardConfig } from "@/lib/constants/dashboard";
import type { DashboardRole } from "@/types/auth";

export function getDashboardNavigation(role: DashboardRole) {
  return roleDashboardConfig[role].navigation;
}
