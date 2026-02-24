import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  const isActive = streak > 0;

  return (
    <Card className={isActive ? "border-orange-400/40 bg-orange-500/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Sequência
        </CardTitle>
        <Flame
          className={`h-4 w-4 ${isActive ? "text-orange-500" : "text-muted-foreground"}`}
        />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${isActive ? "text-orange-500" : ""}`}>
          {streak} {streak === 1 ? "dia" : "dias"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isActive ? "Não quebre sua sequência!" : "Estude hoje para começar"}
        </p>
      </CardContent>
    </Card>
  );
}
