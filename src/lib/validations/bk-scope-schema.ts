import { z } from "zod";
export const bkScopeSchema = z.object({ user_id: z.string().min(1, "Akun BK wajib dipilih"), school_unit_ids: z.array(z.string()).min(1, "Pilih minimal satu unit") });
export type BKScopeFormValues = z.infer<typeof bkScopeSchema>;
