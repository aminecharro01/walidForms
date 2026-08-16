"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  type Chart as ChartInstance,
  type Plugin,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar, Doughnut } from "react-chartjs-2";
import { ArrowRight, Download, FileDown, Loader2, StickyNote } from "lucide-react";
import { StatusMap } from "@/components/maps/status-map";
import { OCCUPANCY_LABELS_AR, OCCUPANCY_COLORS, type OccupancyStatus } from "@/lib/analytics/merge-helpers";
import styles from "./dashboard.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);
ChartJS.defaults.set("plugins.datalabels", { display: false });

const CLAY = "#A94A28";
const ZELLIGE = "#1E6E71";
const SAFFRON = "#C98A2C";
const BRICK = "#8B3A3A";
const LINE = "#d8c8a4";
const INK = "#2a2016";
const INK_SOFT = "#6b5f4d";
const PALETTE_SEQ = [CLAY, ZELLIGE, SAFFRON, BRICK, "#5b7a4f", "#7a5c8a", "#3a5f8a", "#b08a3e", "#4f6b6d"];

function pctOf(value: number, arr: { count: number }[]): number {
  const sum = arr.reduce((s, x) => s + x.count, 0);
  return sum > 0 ? Math.round((value / sum) * 100) : 0;
}

function centerTextPlugin(text: string): Plugin<"doughnut"> {
  return {
    id: "centerText",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 20px var(--font-reem-kufi), sans-serif";
      ctx.fillStyle = INK;
      ctx.fillText(text, cx, cy - 8);
      ctx.font = "500 10.5px var(--font-tajawal), sans-serif";
      ctx.fillStyle = INK_SOFT;
      ctx.fillText("المجموع", cx, cy + 12);
      ctx.restore();
    },
  };
}

export interface MergedDashboardData {
  formTitles: string[];
  total: number;
  streetsCount: number;
  blocksCount: number;
  geolocated: number;
  byStreet: { label: string; count: number }[];
  byBlock: { label: string; count: number }[];
  byFloors: { label: string; count: number }[];
  byType: { label: string; count: number }[];
  statusCounts: Record<OccupancyStatus, number>;
  statusByStreet: { street: string; total: number; counts: Record<OccupancyStatus, number> }[];
  mapPoints: {
    id: string;
    lat: number;
    lng: number;
    street: string | null;
    block: string | null;
    buildingNumber: string | null;
    buildingTypes: string[];
    floors: string | null;
    statusCat: OccupancyStatus;
  }[];
  notes: { id: string; street: string | null; block: string | null; buildingNumber: string | null; text: string }[];
  dateMin: string | null;
  dateMax: string | null;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function ChartPanel({
  title,
  hint,
  onDownload,
  children,
}: {
  title: string;
  hint: string;
  onDownload?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <h3>{title}</h3>
          <div className={styles.hint}>{hint}</div>
        </div>
        {onDownload && (
          <button
            type="button"
            className={`${styles.panelDownload} pdf-ignore`}
            onClick={onDownload}
            title="تحميل كصورة"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className={styles.chartWrap}>{children}</div>
    </div>
  );
}

export function MergedDashboardClient({ data, backHref }: { data: MergedDashboardData; backHref: string }) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const darbChartRef = useRef<ChartInstance<"bar"> | null>(null);
  const jaziraChartRef = useRef<ChartInstance<"bar"> | null>(null);
  const sinfChartRef = useRef<ChartInstance<"doughnut"> | null>(null);
  const tawabiqChartRef = useRef<ChartInstance<"bar"> | null>(null);
  const halaChartRef = useRef<ChartInstance<"doughnut"> | null>(null);
  const crossChartRef = useRef<ChartInstance<"bar"> | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const tajawal = getComputedStyle(document.documentElement).getPropertyValue("--font-tajawal").trim();
    if (tajawal) ChartJS.defaults.font.family = tajawal;
    ChartJS.defaults.color = INK_SOFT;
    ChartJS.defaults.font.size = 12;
  }, []);

  function downloadChart(ref: React.RefObject<ChartInstance | null>, filename: string) {
    if (!ref.current) return;
    downloadDataUrl(ref.current.toBase64Image(), filename);
  }

  async function downloadPdf() {
    if (!dashboardRef.current) return;
    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#EDE3CE",
        ignoreElements: (el) => el.classList.contains("pdf-ignore"),
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new JsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("جرد-ميداني.pdf");
    } finally {
      setExportingPdf(false);
    }
  }

  const {
    total,
    streetsCount,
    blocksCount,
    geolocated,
    byStreet,
    byBlock,
    byFloors,
    byType,
    statusCounts,
    statusByStreet,
    mapPoints,
    notes,
    dateMin,
    dateMax,
  } = data;

  const totalOccupied = statusCounts.occupied;
  const totalAbandoned = statusCounts.abandoned;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const traditionalType = byType.find((t) => t.label.includes("تقليدية"));
  const modernType = byType.find((t) => t.label.includes("عصرية"));

  const halaColors: Record<string, string> = {};
  for (const k of Object.keys(OCCUPANCY_LABELS_AR) as OccupancyStatus[]) {
    halaColors[OCCUPANCY_LABELS_AR[k]] = OCCUPANCY_COLORS[k];
  }
  const halaOrder: OccupancyStatus[] = ["occupied", "abandoned", "seasonal"];
  const halaChartData = halaOrder
    .filter((k) => statusCounts[k] > 0)
    .map((k) => ({ label: OCCUPANCY_LABELS_AR[k], value: statusCounts[k], color: OCCUPANCY_COLORS[k] }));

  const crossStreets = statusByStreet.map((s) => s.street);
  const crossDatasets = halaOrder
    .filter((k) => statusCounts[k] > 0)
    .map((k) => ({
      label: OCCUPANCY_LABELS_AR[k],
      data: statusByStreet.map((s) => s.counts[k] || 0),
      backgroundColor: OCCUPANCY_COLORS[k],
      borderRadius: 4,
    }));

  const heroItems: [number, string][] = [
    [total, "إجمالي البنايات المجرودة"],
    [streetsCount, "درب داخل المدينة العتيقة"],
    [blocksCount, "جزيرة عقارية"],
    [geolocated, "بناية مُحدَّدة الموقع"],
  ];

  const kpiItems: { n: string | number; l: string; cls?: string; p?: number }[] = [
    { n: total, l: "إجمالي البنايات" },
    { n: totalOccupied, l: "مسكونة بشكل دائم", cls: styles.kpiZel, p: pct(totalOccupied) },
    { n: totalAbandoned, l: "مهجورة بشكل دائم", cls: styles.kpiBri, p: pct(totalAbandoned) },
    { n: traditionalType?.count ?? 0, l: traditionalType?.label ?? "دار مغربية تقليدية", cls: styles.kpiSaf },
    { n: modernType?.count ?? 0, l: modernType?.label ?? "دار مغربية عصرية" },
    { n: `${streetsCount} دروب`, l: `موزعة على ${blocksCount} جزر`, cls: styles.kpiZel },
  ];

  const tooltipRtl = { rtl: true, textDirection: "rtl" as const };
  const sinfTotal = byType.reduce((sum, x) => sum + x.count, 0);
  const halaTotal = halaChartData.reduce((sum, x) => sum + x.value, 0);

  return (
    <div className={styles.root} dir="rtl" ref={dashboardRef}>
      <header className={styles.header}>
        <div className={styles.zelligePattern} />
        <div className={`${styles.eyebrow} ${styles.kufi}`}>جرد ميداني — {new Date().getFullYear()}</div>
        <h1 className={styles.kufi}>
          جرد البنايات العمرانية
          <br />
          في المدينة العتيقة
        </h1>
        <p className={styles.headerSub}>
          لوحة تحليلية تلخّص نتائج المسح الميداني المُجمّع من {data.formTitles.length} نماذج (
          {data.formTitles.join("، ")}): أصناف البنايات، حالتها الوظيفية، عدد الطوابق، والموقع الجغرافي لكل بناية.
        </p>
        <div className={styles.archRow}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className={styles.arch} />
          ))}
        </div>
        <div className={styles.heroStat}>
          {heroItems.map(([n, l]) => (
            <div key={l}>
              <b>{n.toLocaleString()}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.exportBtn} pdf-ignore`}
            onClick={downloadPdf}
            disabled={exportingPdf}
          >
            {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            تحميل التقرير كملف PDF
          </button>
          <Link href={backHref} className={`${styles.exportBtn} pdf-ignore`}>
            <ArrowRight className="h-4 w-4" />
            تغيير الاختيار
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.kpiGrid}>
          {kpiItems.map((k, i) => (
            <div key={i} className={`${styles.kpi} ${k.cls ?? ""}`}>
              <div className={styles.kpiN}>
                {k.n}
                {k.p !== undefined && <span className={styles.kpiPct}>{k.p}%</span>}
              </div>
              <div className={styles.kpiL}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* 01 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={`${styles.sectionNum} ${styles.kufi}`}>01</span>
            <h2>التوزيع الجغرافي والإداري</h2>
            <span className={styles.rule} />
          </div>
          <div className={styles.sectionNote}>
            توزّع البنايات المجرودة على {streetsCount} دروب و{blocksCount} جزر داخل النسيج العتيق للمدينة.
          </div>
          <div className={styles.grid2}>
            <ChartPanel
              title="عدد البنايات حسب الدرب"
              hint="مرتّبة تنازليًا حسب عدد البنايات المرصودة في كل درب"
              onDownload={() => downloadChart(darbChartRef, "عدد-البنايات-حسب-الدرب.png")}
            >
              <div style={{ height: Math.max(340, byStreet.length * 30) }}>
                <Bar
                  ref={darbChartRef}
                  data={{
                    labels: byStreet.map((x) => x.label),
                    datasets: [
                      {
                        data: byStreet.map((x) => x.count),
                        backgroundColor: CLAY,
                        borderRadius: 5,
                        maxBarThickness: 22,
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        ...tooltipRtl,
                        callbacks: {
                          label: (ctx) => `${ctx.formattedValue} بناية (${pctOf(Number(ctx.raw), byStreet)}%)`,
                        },
                      },
                      datalabels: {
                        display: true,
                        color: INK,
                        anchor: "end",
                        align: "end",
                        font: { weight: 700, size: 11 },
                        formatter: (v: number) => v.toLocaleString(),
                      },
                    },
                    scales: {
                      x: { grid: { color: LINE }, ticks: { precision: 0 } },
                      y: { grid: { display: false }, ticks: { font: { size: 11.5 } } },
                    },
                  }}
                />
              </div>
            </ChartPanel>
            <ChartPanel
              title="عدد البنايات حسب الجزيرة"
              hint="الجزر العقارية المشمولة بالجرد"
              onDownload={() => downloadChart(jaziraChartRef, "عدد-البنايات-حسب-الجزيرة.png")}
            >
              <div style={{ height: 340 }}>
                <Bar
                  ref={jaziraChartRef}
                  data={{
                    labels: byBlock.map((x) => x.label),
                    datasets: [
                      { data: byBlock.map((x) => x.count), backgroundColor: ZELLIGE, borderRadius: 5, maxBarThickness: 34 },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        ...tooltipRtl,
                        callbacks: {
                          label: (ctx) => `${ctx.formattedValue} بناية (${pctOf(Number(ctx.raw), byBlock)}%)`,
                        },
                      },
                      datalabels: {
                        display: true,
                        color: INK,
                        anchor: "end",
                        align: "top",
                        font: { weight: 700, size: 11 },
                        formatter: (v: number) => v.toLocaleString(),
                      },
                    },
                    scales: {
                      y: { grid: { color: LINE }, beginAtZero: true, ticks: { precision: 0 } },
                      x: { grid: { display: false }, ticks: { font: { size: 11.5 } } },
                    },
                  }}
                />
              </div>
            </ChartPanel>
          </div>
        </section>

        {/* 02 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={`${styles.sectionNum} ${styles.kufi}`}>02</span>
            <h2>خصائص البنايات</h2>
            <span className={styles.rule} />
          </div>
          <div className={styles.sectionNote}>
            صنف البناية، عدد الطوابق، والحالة الوظيفية للمسكن (مسكون، مهجور، أو موسمي).
          </div>
          <div className={styles.grid3}>
            <ChartPanel
              title="صنف البناية"
              hint="تقليدية مقابل عصرية ومرافق أخرى"
              onDownload={() => downloadChart(sinfChartRef, "صنف-البناية.png")}
            >
              <div style={{ height: 280 }}>
                <Doughnut
                  ref={sinfChartRef}
                  plugins={[centerTextPlugin(String(sinfTotal))]}
                  data={{
                    labels: byType.map((x) => x.label),
                    datasets: [{ data: byType.map((x) => x.count), backgroundColor: PALETTE_SEQ, borderColor: "#FBF7EC", borderWidth: 2 }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "62%",
                    plugins: {
                      legend: { position: "bottom", rtl: true, labels: { boxWidth: 10, font: { size: 11 } } },
                      tooltip: {
                        ...tooltipRtl,
                        callbacks: {
                          label: (ctx) => `${ctx.label}: ${ctx.formattedValue} (${pctOf(Number(ctx.raw), byType)}%)`,
                        },
                      },
                      datalabels: {
                        display: true,
                        color: "#fff",
                        font: { weight: 700, size: 11 },
                        formatter: (v: number) => `${pctOf(v, byType)}%`,
                      },
                    },
                  }}
                />
              </div>
            </ChartPanel>
            <ChartPanel
              title="عدد الطوابق"
              hint="توزيع الارتفاع العمراني للبنايات"
              onDownload={() => downloadChart(tawabiqChartRef, "عدد-الطوابق.png")}
            >
              <div style={{ height: 280 }}>
                <Bar
                  ref={tawabiqChartRef}
                  data={{
                    labels: byFloors.map((x) => x.label),
                    datasets: [
                      { data: byFloors.map((x) => x.count), backgroundColor: SAFFRON, borderRadius: 5, maxBarThickness: 30 },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        ...tooltipRtl,
                        callbacks: {
                          label: (ctx) => `${ctx.formattedValue} بناية (${pctOf(Number(ctx.raw), byFloors)}%)`,
                        },
                      },
                      datalabels: {
                        display: true,
                        color: INK,
                        anchor: "end",
                        align: "top",
                        font: { weight: 700, size: 11 },
                        formatter: (v: number) => v.toLocaleString(),
                      },
                    },
                    scales: {
                      y: { grid: { color: LINE }, beginAtZero: true, ticks: { precision: 0 } },
                      x: { grid: { display: false }, ticks: { font: { size: 10.5 } } },
                    },
                  }}
                />
              </div>
            </ChartPanel>
            <ChartPanel
              title="الحالة الوظيفية للمسكن"
              hint="نسبة السكن الدائم مقابل الهجرة والسكن الموسمي"
              onDownload={() => downloadChart(halaChartRef, "الحالة-الوظيفية.png")}
            >
              <div style={{ height: 280 }}>
                <Doughnut
                  ref={halaChartRef}
                  plugins={[centerTextPlugin(String(halaTotal))]}
                  data={{
                    labels: halaChartData.map((x) => x.label),
                    datasets: [
                      {
                        data: halaChartData.map((x) => x.value),
                        backgroundColor: halaChartData.map((x) => x.color),
                        borderColor: "#FBF7EC",
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "62%",
                    plugins: {
                      legend: { position: "bottom", rtl: true, labels: { boxWidth: 10, font: { size: 11 } } },
                      tooltip: {
                        ...tooltipRtl,
                        callbacks: {
                          label: (ctx) =>
                            `${ctx.label}: ${ctx.formattedValue} (${halaTotal > 0 ? Math.round((Number(ctx.raw) / halaTotal) * 100) : 0}%)`,
                        },
                      },
                      datalabels: {
                        display: true,
                        color: "#fff",
                        font: { weight: 700, size: 11 },
                        formatter: (v: number) => `${halaTotal > 0 ? Math.round((v / halaTotal) * 100) : 0}%`,
                      },
                    },
                  }}
                />
              </div>
            </ChartPanel>
          </div>
        </section>

        {/* 03 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={`${styles.sectionNum} ${styles.kufi}`}>03</span>
            <h2>الحالة الوظيفية حسب الدرب</h2>
            <span className={styles.rule} />
          </div>
          <div className={styles.sectionNote}>
            مقارنة نسب السكن الدائم والهجران والسكن الموسمي داخل كل درب — تكشف الدروب الأكثر تضررًا من الهجرة العمرانية.
          </div>
          <ChartPanel
            title="الحالة الوظيفية حسب الدرب"
            hint="عدد البنايات حسب الحالة، لكل درب"
            onDownload={() => downloadChart(crossChartRef, "الحالة-حسب-الدرب.png")}
          >
            <div style={{ height: Math.max(380, crossStreets.length * 26) }}>
              <Bar
                ref={crossChartRef}
                data={{ labels: crossStreets, datasets: crossDatasets }}
                options={{
                  indexAxis: "y",
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom", rtl: true, labels: { boxWidth: 10, font: { size: 11 } } },
                    tooltip: {
                      ...tooltipRtl,
                      callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue} بناية`,
                      },
                    },
                    datalabels: {
                      display: (ctx) => Number(ctx.dataset.data[ctx.dataIndex]) > 0,
                      color: "#fff",
                      font: { weight: 700, size: 10 },
                      formatter: (v: number) => v,
                    },
                  },
                  scales: {
                    x: { stacked: true, grid: { color: LINE }, ticks: { precision: 0 } },
                    y: { stacked: true, grid: { display: false }, ticks: { font: { size: 11.5 } } },
                  },
                }}
              />
            </div>
          </ChartPanel>
        </section>

        {/* 04 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={`${styles.sectionNum} ${styles.kufi}`}>04</span>
            <h2>الخريطة التفاعلية للبنايات</h2>
            <span className={styles.rule} />
          </div>
          <div className={styles.sectionNote}>
            تم تحديد الموقع الجغرافي لـ {geolocated} بناية من أصل {total} ({total - geolocated} بنايات بدون
            إحداثيات).
          </div>
          <div className={`${styles.panel} ${styles.mapCard}`}>
            {mapPoints.length === 0 ? (
              <p style={{ textAlign: "center", padding: "32px 0", color: INK_SOFT }}>لا توجد إحداثيات مسجَّلة</p>
            ) : (
              <StatusMap
                points={mapPoints.map((p) => ({
                  id: p.id,
                  lat: p.lat,
                  lng: p.lng,
                  label: [p.street, p.block].filter(Boolean).join(" — ") || "بناية",
                  color: OCCUPANCY_COLORS[p.statusCat],
                  details: [
                    { label: "الدرب", value: p.street ?? "" },
                    { label: "الجزيرة", value: p.block ?? "" },
                    { label: "رقم البناية", value: p.buildingNumber ?? "" },
                    { label: "الصنف", value: p.buildingTypes.join("، ") },
                    { label: "الطوابق", value: p.floors ?? "" },
                    { label: "الحالة", value: OCCUPANCY_LABELS_AR[p.statusCat] },
                  ],
                }))}
              />
            )}
            <div className={styles.legend}>
              {halaOrder.map((k) => (
                <span key={k}>
                  <i className={styles.dot} style={{ background: OCCUPANCY_COLORS[k] }} />
                  {OCCUPANCY_LABELS_AR[k]}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 05 */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={`${styles.sectionNum} ${styles.kufi}`}>05</span>
            <h2>ملاحظات ميدانية</h2>
            <span className={styles.rule} />
          </div>
          <div className={styles.sectionNote}>
            ملاحظات مسجَّلة من طرف فرق الجرد الميداني حول بنايات محدَّدة (محلات تجارية، بنايات آيلة للسقوط...).
          </div>
          <div className={styles.panel}>
            {notes.length === 0 ? (
              <p style={{ textAlign: "center", padding: "32px 0", color: INK_SOFT }}>لا توجد ملاحظات مسجَّلة</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>الدرب</th>
                    <th>الجزيرة</th>
                    <th>رقم البناية</th>
                    <th>الملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <span className={`${styles.tag} ${styles.tagDrb}`}>{n.street ?? "—"}</span>
                      </td>
                      <td>
                        <span className={`${styles.tag} ${styles.tagJz}`}>{n.block ?? "—"}</span>
                      </td>
                      <td>{n.buildingNumber ?? "—"}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <StickyNote className="h-3.5 w-3.5 shrink-0" style={{ color: SAFFRON }} />
                          {n.text}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>المصدر: نتائج استمارة الجرد الميداني للبنايات العمرانية — دمج {data.formTitles.length} نماذج</span>
        {dateMin && dateMax && <span>فترة الجرد: من {dateMin} إلى {dateMax}</span>}
      </footer>
    </div>
  );
}
