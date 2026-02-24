"use client";

import Link from "next/link";
import { Bell, BookOpen, Flame, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AppNotification } from "@/lib/notifications";

interface NotificationBellProps {
  notifications: AppNotification[];
}

const typeIcons = {
  review: BookOpen,
  streak: Flame,
  limit: AlertCircle,
  insight: Sparkles,
};

const priorityColors = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-muted-foreground",
};

export function NotificationBell({ notifications }: NotificationBellProps) {
  const highPriority = notifications.filter((n) => n.priority === "high").length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                highPriority > 0 ? "bg-red-500" : "bg-amber-500"
              }`}
            >
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notificações</h4>
        </div>
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificação no momento
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type];
              const content = (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${priorityColors[n.priority]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  </div>
                </div>
              );

              return n.href ? (
                <Link key={n.id} href={n.href} className="block">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
