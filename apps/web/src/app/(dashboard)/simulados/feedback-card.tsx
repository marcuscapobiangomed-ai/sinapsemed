"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowRight,
  CalendarPlus,
  Loader2,
  Lightbulb,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMondayOfWeek } from "@/lib/planner-utils";
import { getSpecialtyColor } from "@/lib/planner-utils";

interface GapFeedback {
  specialty_name: string;
  specialty_slug: string;
  combined_accuracy: number;
  advice: string;
}

interface FeedbackCardProps {
  gaps: GapFeedback[];
  overallAccuracy: number;
  onDismiss: () => void;
}

export function FeedbackCard({
  gaps,
  overallAccuracy,
  onDismiss,
}: FeedbackCardProps) {
  const [addingToPlanner, setAddingToPlanner] = useState(false);

  async function handleAddToPlanner() {
    setAddingToPlanner(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = getMondayOfWeek();

      // Get today's day_of_week (0=Mon .. 6=Sun)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const tomorrowIndex = (todayIndex + 1) % 7;

      // Resolve specialty IDs from slugs
      const slugs = gaps.map((g) => g.specialty_slug);
      const { data: specs } = await supabase
        .from("specialties")
        .select("id, slug")
        .in("slug", slugs);

      if (!specs || specs.length === 0) {
        toast.error("Especialidades não encontradas");
        setAddingToPlanner(false);
        return;
      }

      // Create 2 blocks per gap specialty (today + tomorrow, 60min each)
      const entries = specs.flatMap((spec) => [
        {
          user_id: user.id,
          week_start: weekStart,
          day_of_week: todayIndex,
          specialty_id: spec.id,
          planned_minutes: 60,
        },
        {
          user_id: user.id,
          week_start: weekStart,
          day_of_week: tomorrowIndex,
          specialty_id: spec.id,
          planned_minutes: 60,
        },
      ]);

      const { error } = await supabase
        .from("study_plan_entries")
        .insert(entries);

      if (error) {
        toast.error("Erro ao adicionar ao planner");
      } else {
        toast.success("Blocos adicionados ao Planner!", {
          description: `${specs.length} especialidades × 2 blocos`,
        });
      }
    } finally {
      setAddingToPlanner(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Feedback do Simulado</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 -mt-1 -mr-1"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Acerto geral: <span className="font-semibold text-foreground">{overallAccuracy}%</span>
          {" · "}Suas maiores lacunas:
        </p>

        <div className="space-y-2">
          {gaps.map((gap) => (
            <Link
              key={gap.specialty_slug}
              href={`/review?specialty=${gap.specialty_slug}`}
              className="block"
            >
              <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                <div
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{
                    backgroundColor: getSpecialtyColor(gap.specialty_slug),
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {gap.specialty_name}
                    </span>
                    {gap.combined_accuracy < 50 && (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {gap.combined_accuracy}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {gap.advice}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleAddToPlanner}
          disabled={addingToPlanner}
        >
          {addingToPlanner ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CalendarPlus className="h-4 w-4" />
          )}
          Adicionar ao Planner
        </Button>
      </CardContent>
    </Card>
  );
}
