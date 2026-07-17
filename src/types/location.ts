export type AttendanceLocationStatus =
  | "inside_radius"
  | "outside_radius"
  | "low_accuracy"
  | "stale"
  | "captured_unverified"
  | "permission_denied"
  | "unavailable";

export type AttendanceLocationEvidence = {
  location_latitude?: number;
  location_longitude?: number;
  location_accuracy_meters?: number;
  location_distance_meters?: number;
  location_status?: AttendanceLocationStatus;
  location_captured_at?: string;
};

export type AttendanceLocationPolicy = {
  configured: boolean;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  max_accuracy_meters?: number;
};

export type AttendanceLocationCapture = {
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number;
  captured_at?: string;
  client_status: "captured" | "permission_denied" | "unavailable";
};

export type AttendanceLocationCaptureResult = {
  capture: AttendanceLocationCapture;
  message: string;
  outcome: "captured" | "permission_denied" | "unavailable";
};
