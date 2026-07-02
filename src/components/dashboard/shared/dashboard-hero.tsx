"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock3, School2 } from "lucide-react";

type DashboardHeroProps = {
  badge: string;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction: string;
};

export function DashboardHero({
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
}: DashboardHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
    >
        <Card className="overflow-hidden border-white/70 bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(255,255,255,0.72),rgba(37,99,235,0.14))] shadow-sm backdrop-blur">
        <CardContent className="space-y-6 p-8">
          <Badge className="rounded-full bg-white/80 px-4 py-1 text-sky-800 hover:bg-white/80">
            {badge}
          </Badge>
          <div className="space-y-3">
            <h1 className="font-heading text-4xl leading-tight font-semibold text-slate-950">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="rounded-full px-6">
              {primaryAction}
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" className="rounded-full bg-white/70 px-6">
              {secondaryAction}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="border-white/70 bg-white/80 shadow-sm backdrop-blur">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <School2 className="size-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sistem sekolah aktif</p>
              <p className="text-lg font-semibold text-slate-900">
                4 role utama siap dipisahkan
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/70 bg-white/80 shadow-sm backdrop-blur">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Clock3 className="size-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Target flow MVP</p>
              <p className="text-lg font-semibold text-slate-900">
                Absen masuk, pulang, izin, sakit, dan rekap
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
}
