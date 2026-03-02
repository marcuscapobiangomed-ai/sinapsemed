"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, BookOpen, Stethoscope } from "lucide-react";

interface QuickActionsProps {
  dueCount: number;
  onClinicalTrigger: () => void;
}

export function QuickActions({ dueCount, onClinicalTrigger }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold">Ações rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-5">
        <Button asChild variant="outline" className="w-full justify-start gap-2">
          <Link href="/review?mode=quick">
            <Zap className="h-4 w-4" />
            Revisão Rápida (~5 min)
          </Link>
        </Button>
        {dueCount > 0 && (
          <Button asChild className="w-full justify-start gap-2">
            <Link href="/review">
              <BookOpen className="h-4 w-4" />
              Revisar {dueCount} cards
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onClinicalTrigger}
        >
          <Stethoscope className="h-4 w-4" />
          Vi no Plantão
        </Button>
      </CardContent>
    </Card>
  );
}
