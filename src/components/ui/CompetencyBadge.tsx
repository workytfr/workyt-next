"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Award, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export interface CompetencyInfo {
  skillId: string;
  description?: string;
  difficulty?: number;
  status?: "not_started" | "in_progress" | "failed" | "mastered";
  nextReview?: string | Date;
}

interface CompetencyBadgeProps {
  competency: CompetencyInfo;
  showStatus?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: (skillId: string) => void;
  className?: string;
}

const statusConfig = {
  not_started: { color: "bg-gray-100 text-gray-600", icon: null },
  in_progress: { color: "bg-amber-100 text-amber-700", icon: Clock },
  failed: { color: "bg-red-100 text-red-700", icon: AlertCircle },
  mastered: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

const difficultyLabels = ["", "Débutant", "Facile", "Moyen", "Difficile", "Expert"];

export function CompetencyBadge({
  competency,
  showStatus = false,
  size = "md",
  onClick,
  className,
}: CompetencyBadgeProps) {
  const status = competency.status || "not_started";
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-0.5 gap-1.5",
    lg: "text-base px-3 py-1 gap-2",
  };

  const isRevisionDue = competency.nextReview && new Date(competency.nextReview) <= new Date();

  return (
    <Badge
      variant="outline"
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-2",
        showStatus ? config.color : "bg-white hover:bg-slate-50",
        isRevisionDue && "ring-2 ring-amber-400",
        sizeClasses[size],
        className
      )}
      onClick={() => onClick?.(competency.skillId)}
      title={competency.description || competency.skillId}
    >
      <Award className={cn(size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      <span className="font-medium truncate max-w-[200px]">
        {competency.skillId}
      </span>
      {showStatus && Icon && <Icon className={cn(size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4")} />}
      {isRevisionDue && (
        <span className="ml-1 text-xs font-semibold text-amber-600">À réviser</span>
      )}
    </Badge>
  );
}

interface CompetencyListProps {
  competencies: CompetencyInfo[];
  title?: string;
  showStatus?: boolean;
  size?: "sm" | "md" | "lg";
  emptyMessage?: string;
  onCompetencyClick?: (skillId: string) => void;
  className?: string;
}

export function CompetencyList({
  competencies,
  title = "Compétences validées",
  showStatus = false,
  size = "md",
  emptyMessage = "Aucune compétence associée",
  onCompetencyClick,
  className,
}: CompetencyListProps) {
  if (!competencies || competencies.length === 0) {
    return (
      <div className={cn("text-sm text-gray-500 italic", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Award className="w-4 h-4 text-orange-500" />
          {title}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {competencies.map((comp) => (
          <CompetencyBadge
            key={comp.skillId}
            competency={comp}
            showStatus={showStatus}
            size={size}
            onClick={onCompetencyClick}
          />
        ))}
      </div>
    </div>
  );
}

export default CompetencyBadge;
