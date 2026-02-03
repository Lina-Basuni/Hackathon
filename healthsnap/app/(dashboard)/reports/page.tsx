import Link from "next/link";
import { FileText, Calendar, ChevronRight, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import prisma from "@/app/lib/prisma";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";

export default async function ReportsPage() {
  // Fetch reports with related data
  const reports = await prisma.report.findMany({
    include: {
      patient: true,
      riskAssessment: true,
      clinicalSummary: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Health Reports</h1>
        <p className="text-muted-foreground mt-2">
          View your symptom analysis reports and health insights.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground mb-4">
              Record your first voice note to get a health analysis.
            </p>
            <Link
              href="/record"
              className="inline-flex items-center justify-center bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Recording
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const riskFlags = report.riskAssessment
              ? safeJsonParse(report.riskAssessment.riskFlags, [])
              : [];

            const acuity = report.riskAssessment?.overallAcuity || "routine";
            const acuityConfig = getAcuityDisplay(acuity);

            return (
              <Link key={report.id} href={`/report/${report.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            acuityConfig.bgColor
                          )}
                        >
                          <Activity className={cn("w-6 h-6", acuityConfig.iconColor)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold">
                              {report.clinicalSummary?.chiefComplaint || "Health Assessment"}
                            </h3>
                            <Badge className={cn(acuityConfig.badgeColor)}>
                              {acuityConfig.label}
                            </Badge>
                            {report.status === "draft" && (
                              <Badge variant="outline" className="text-xs">
                                Draft
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                            {riskFlags.length > 0 && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                {riskFlags.length} risk flag{riskFlags.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getAcuityDisplay(acuity: string) {
  switch (acuity.toLowerCase()) {
    case "emergent":
      return {
        label: "Emergent",
        bgColor: "bg-red-100",
        iconColor: "text-red-600",
        badgeColor: "bg-red-100 text-red-700 border-red-200",
      };
    case "urgent":
      return {
        label: "Urgent",
        bgColor: "bg-amber-100",
        iconColor: "text-amber-600",
        badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "routine":
    default:
      return {
        label: "Routine",
        bgColor: "bg-green-100",
        iconColor: "text-green-600",
        badgeColor: "bg-green-100 text-green-700 border-green-200",
      };
  }
}

function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
