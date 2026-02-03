import Link from "next/link";
import { FileText, Calendar, ChevronRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import prisma from "@/app/lib/prisma";
import { format } from "date-fns";

export default async function ReportsPage() {
  // Fetch voice notes with their risk assessments
  const voiceNotes = await prisma.voiceNote.findMany({
    where: {
      status: "completed",
      riskAssessment: { isNot: null },
    },
    include: {
      riskAssessment: true,
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

      {voiceNotes.length === 0 ? (
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
          {voiceNotes.map((note) => {
            const riskFlags = note.riskAssessment
              ? JSON.parse(note.riskAssessment.riskFlags as string)
              : [];

            return (
              <Link key={note.id} href={`/reports/${note.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Health Snapshot</h3>
                            {note.riskAssessment && (
                              <Badge
                                variant={
                                  note.riskAssessment.overallRisk as
                                    | "low"
                                    | "moderate"
                                    | "high"
                                    | "critical"
                                }
                              >
                                {note.riskAssessment.overallRisk.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
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
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
