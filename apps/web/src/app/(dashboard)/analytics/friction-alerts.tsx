"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, CheckCircle2, Bell } from "lucide-react";
import type { FrictionAlert } from "@/lib/analytics-queries";

interface FrictionAlertsProps {
  alerts: FrictionAlert[];
}

const severityStyles = {
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: AlertTriangle,
    iconColor: "text-red-500",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  info: {
    border: "border-l-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: TrendingUp,
    iconColor: "text-green-500",
  },
};

export function FrictionAlerts({ alerts }: FrictionAlertsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Alertas de Fricção
        </CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="text-sm text-muted-foreground text-center">
              Nenhum alerta de fricção. Continue assim!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const style = severityStyles[alert.severity];
              const Icon = style.icon;
              return (
                <div
                  key={alert.specialty_slug}
                  className={`flex items-start gap-3 rounded-lg border-l-4 ${style.border} ${style.bg} p-3`}
                >
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.iconColor}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      De {alert.previous_accuracy}% para {alert.current_accuracy}%{" "}
                      ({alert.delta > 0 ? "+" : ""}{alert.delta}pp)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
