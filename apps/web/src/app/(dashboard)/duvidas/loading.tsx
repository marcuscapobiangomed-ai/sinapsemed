import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="space-y-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Messages area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
          <div className="space-y-2 mt-6">
            <Skeleton className="h-10 w-72 mx-auto rounded-lg" />
            <Skeleton className="h-10 w-64 mx-auto rounded-lg" />
            <Skeleton className="h-10 w-68 mx-auto rounded-lg" />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
