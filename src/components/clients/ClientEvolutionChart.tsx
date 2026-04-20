"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingDown, Activity } from "lucide-react";

interface AssessmentData {
  id: string;
  created_at: string;
  scoring_data: Record<string, any>;
  assessment_type: string;
}

export function ClientEvolutionChart({ assessments }: { assessments: AssessmentData[] }) {
  // Try to find consistent scoring keys to plot, e.g., 'score' or 'anxiety_score'
  const chartData = useMemo(() => {
    return assessments
      .filter((a) => Object.keys(a.scoring_data).length > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((a) => {
        // Extract the first numeric score to plot for demo purposes
        const numericKey = Object.keys(a.scoring_data).find(
          (k) => typeof a.scoring_data[k] === "number"
        );
        return {
          date: format(new Date(a.created_at), "MMM yyyy", { locale: ro }),
          score: numericKey ? a.scoring_data[numericKey] : 0,
          label: numericKey ? numericKey.replace("_", " ") : "Scor",
          type: a.assessment_type,
        };
      });
  }, [assessments]);

  if (chartData.length < 2) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Evoluție Scor Psihologic
          </CardTitle>
          <CardDescription>Sunt necesare cel puțin două evaluări pentru trasarea graficului.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              Evoluție Scoruri (${chartData[0].label})
            </CardTitle>
            <CardDescription>Grafic liniar al reducerii simptomatologiei în timp</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }}
                activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
