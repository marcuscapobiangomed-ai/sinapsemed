import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { getGapAnalysis } from "@/lib/gap-queries";
import { getSimulationStats } from "@/lib/simulation-queries";
import {
  getStreak,
  getAccuracyOverTime,
  getCardStateDistribution,
} from "@/lib/dashboard-queries";

export const runtime = "nodejs";
export const maxDuration = 30;

// ── Styles ──

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #0047AB",
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0047AB",
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#1a1a1a",
    borderBottom: "1 solid #e5e5e5",
    paddingBottom: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: "0.5 solid #f0f0f0",
  },
  statLabel: {
    color: "#666",
  },
  statValue: {
    fontFamily: "Helvetica-Bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "48%",
    border: "1 solid #e5e5e5",
    borderRadius: 6,
    padding: 10,
  },
  statCardLabel: {
    fontSize: 8,
    color: "#666",
    textTransform: "uppercase" as const,
  },
  statCardValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 6,
    borderBottom: "1 solid #e5e5e5",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "0.5 solid #f0f0f0",
  },
  tableCell: {
    flex: 1,
  },
  tableCellSmall: {
    width: 60,
    textAlign: "right" as const,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e5e5e5",
    marginTop: 2,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center" as const,
    fontSize: 8,
    color: "#999",
  },
});

// ── Report Component ──

interface ReportData {
  userName: string;
  bancaName: string | null;
  month: string;
  streak: number;
  accuracy: { date: string; accuracy: number }[];
  cardStates: { label: string; count: number }[];
  simStats: { total_count: number; avg_accuracy: number; trend: number };
  gapSpecialties: {
    name: string;
    combined: number;
    weight: number;
    priority: number;
  }[];
  totalReviews: number;
  totalSimQuestions: number;
  overallAccuracy: number;
}

function MonthlyReport({ data }: { data: ReportData }) {
  const accuracyColor = (acc: number) =>
    acc >= 70 ? "#228B22" : acc >= 50 ? "#E5C287" : "#E57373";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SinapseMED — Relatório Mensal</Text>
          <Text style={styles.subtitle}>
            {data.userName} | {data.month}
            {data.bancaName ? ` | ${data.bancaName}` : ""}
          </Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão Geral</Text>
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Acerto Geral</Text>
              <Text style={[styles.statCardValue, { color: accuracyColor(data.overallAccuracy) }]}>
                {data.overallAccuracy}%
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Streak Atual</Text>
              <Text style={styles.statCardValue}>{data.streak} dias</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Reviews Realizadas</Text>
              <Text style={styles.statCardValue}>{data.totalReviews}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Simulados</Text>
              <Text style={styles.statCardValue}>{data.simStats.total_count}</Text>
            </View>
          </View>
        </View>

        {/* Card Distribution */}
        {data.cardStates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribuição de Cards</Text>
            {data.cardStates.map((s) => (
              <View key={s.label} style={styles.statRow}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Simulation Stats */}
        {data.simStats.total_count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Simulados</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Média de acerto</Text>
              <Text style={styles.statValue}>{data.simStats.avg_accuracy}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tendência</Text>
              <Text style={[styles.statValue, {
                color: data.simStats.trend > 0 ? "#228B22" : data.simStats.trend < 0 ? "#E57373" : "#666",
              }]}>
                {data.simStats.trend > 0 ? "+" : ""}{data.simStats.trend}pp
              </Text>
            </View>
          </View>
        )}

        {/* Gap Analysis */}
        {data.gapSpecialties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Análise por Especialidade (Top 10)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
                  Especialidade
                </Text>
                <Text style={[styles.tableCellSmall, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
                  Acerto
                </Text>
                <Text style={[styles.tableCellSmall, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
                  Peso
                </Text>
              </View>
              {data.gapSpecialties.slice(0, 10).map((s) => (
                <View key={s.name}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>{s.name}</Text>
                    <Text style={[styles.tableCellSmall, { color: accuracyColor(s.combined) }]}>
                      {s.combined}%
                    </Text>
                    <Text style={styles.tableCellSmall}>
                      {Math.round(s.weight * 100)}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${s.combined}%`,
                          backgroundColor: accuracyColor(s.combined),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Gerado por SinapseMED em{" "}
          {new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </Page>
    </Document>
  );
}

// ── API Handler ──

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Não autorizado", { status: 401 });
  }

  const monthParam = req.nextUrl.searchParams.get("month");
  const now = new Date();
  const month = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all data
  const [profileResult, streak, accuracyData, cardStates, simStats, gapData] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      getStreak(supabase, user.id),
      getAccuracyOverTime(supabase, user.id),
      getCardStateDistribution(supabase, user.id),
      getSimulationStats(supabase, user.id),
      getGapAnalysis(supabase, user.id),
    ]);

  const reportData: ReportData = {
    userName: profileResult.data?.full_name ?? "Estudante",
    bancaName: gapData.banca_name,
    month: new Date(month + "-01").toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }),
    streak,
    accuracy: accuracyData,
    cardStates: cardStates.map((s) => ({ label: s.label, count: s.count })),
    simStats,
    gapSpecialties: gapData.specialties
      .filter((s) => s.banca_weight > 0)
      .sort((a, b) => b.priority_score - a.priority_score)
      .map((s) => ({
        name: s.specialty_name,
        combined: s.combined_accuracy,
        weight: s.banca_weight,
        priority: s.priority_score,
      })),
    totalReviews: gapData.total_flashcard_reviews,
    totalSimQuestions: gapData.total_simulation_questions,
    overallAccuracy: gapData.overall_accuracy,
  };

  const pdfElement = (<MonthlyReport data={reportData} />);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(pdfElement as any);

  const safeMonth = month.replace(/[^0-9-]/g, "");

  return new Response(new Uint8Array(buffer) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sinapsemed-relatorio-${safeMonth}.pdf"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
