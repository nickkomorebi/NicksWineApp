"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  showBack = false,
  backHref,
  action,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border",
        className
      )}
    >
      <div className="max-w-lg mx-auto flex items-center h-14 px-4 gap-3">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="-ml-2 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
