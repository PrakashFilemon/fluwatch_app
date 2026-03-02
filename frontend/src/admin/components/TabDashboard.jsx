import { useState, useEffect } from "react";
import React from "react";
import toast from "react-hot-toast";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  adminStats,
  adminLaporanTrend,
  adminAktivitas,
} from "../../services/api";
import { timeAgo } from "../shared/adminHelpers";
import { IconHome, IconUsers, IconClipboard } from "../shared/adminUI";

/* ── Stat Card ── */
function TotalCard({ ikon, label, nilai, pct, naik }) {
  const up = naik ?? pct >= 0;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col justify-between"
      style={{
        background: "#fff",
        boxShadow: "0 2px 16px rgba(0,80,70,0.08)",
        minHeight: 148,
      }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium" style={{ color: "#5A8A84" }}>
          {label}
        </p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "#E8F5F3" }}
        >
          {ikon === "users" ? (
            <IconUsers className="w-5 h-5" style={{ color: "#1B8C7D" }} />
          ) : (
            <IconClipboard className="w-5 h-5" style={{ color: "#1B8C7D" }} />
          )}
        </div>
      </div>

      <div>
        <p
          className="text-4xl font-bold tracking-tight"
          style={{ color: "#0D2825" }}
        >
          {typeof nilai === "number" ? nilai.toLocaleString("id-ID") : "—"}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="text-xs font-semibold"
            style={{ color: up ? "#1B8C7D" : "#E11D48" }}
          >
            {up ? "↗" : "↘"} {up ? "+" : ""}
            {pct}%
          </span>
          <span className="text-xs" style={{ color: "#8AADAA" }}>
            vs bulan lalu
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Tooltips ── */
function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{ background: "#fff", border: "1px solid #C8E6E3" }}
    >
      <p className="text-xs mb-0.5" style={{ color: "#8AADAA" }}>
        {label}
      </p>
      <p className="font-bold" style={{ color: "#1B8C7D" }}>
        {payload[0].value} laporan
      </p>
    </div>
  );
}

/* ── Activity type config ── */
const tipeConfig = {
  laporan: { icon: <IconClipboard />, bg: "#E8F5F3", color: "#1B8C7D" },
  pengguna: { icon: <IconUsers />, bg: "#EEF4FF", color: "#2A6FD4" },
  sistem: { icon: <IconHome />, bg: "#FEF3C7", color: "#D97706" },
};

/* ── Main ── */
export default function TabDashboard() {
  const [stats, setStats] = useState(null);
  const [chartMode, setChartMode] = useState("mingguan");
  const [chartData, setChartData] = useState([]);
  const [aktivitas, setAktivitas] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    setLoadingStats(true);
    adminStats()
      .then(setStats)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingStats(false));
    adminAktivitas()
      .then((d) => setAktivitas(d.aktivitas))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoadingChart(true);
    adminLaporanTrend(chartMode)
      .then((d) => setChartData(d.data))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingChart(false));
  }, [chartMode]);

  const totalChart = chartData.reduce((s, d) => s + (d.jumlah || 0), 0);

  return (
    <div className="space-y-5 pb-8">
      {/* ── 2 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loadingStats ? (
          <>
            <div
              className="rounded-2xl h-36 animate-pulse"
              style={{ background: "#C8E6E3" }}
            />
            <div
              className="rounded-2xl h-36 animate-pulse"
              style={{ background: "#C8E6E3" }}
            />
          </>
        ) : (
          <>
            <TotalCard
              ikon="users"
              label="Total Pengguna Terdaftar"
              nilai={stats?.total_users}
              pct={stats?.pct_users ?? 0}
              naik={(stats?.pct_users ?? 0) >= 0}
            />
            <TotalCard
              ikon="Laporan"
              label="Total Laporan Masuk"
              nilai={stats?.total_laporan}
              pct={stats?.pct_laporan ?? 0}
              naik={(stats?.pct_laporan ?? 0) >= 0}
            />
          </>
        )}
      </div>

      {/* ── Chart + Aktivitas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart — Tren Laporan */}
        <div
          className="lg:col-span-2 rounded-2xl p-5 sm:p-6"
          style={{
            background: "#fff",
            boxShadow: "0 2px 16px rgba(0,80,70,0.08)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-base" style={{ color: "#0D2825" }}>
                Tren Laporan
              </h3>
              {!loadingChart && (
                <p className="text-xs mt-0.5" style={{ color: "#8AADAA" }}>
                  Total{" "}
                  <span className="font-semibold" style={{ color: "#1B8C7D" }}>
                    {totalChart.toLocaleString("id-ID")}
                  </span>{" "}
                  laporan
                </p>
              )}
            </div>

            {/* Toggle pill */}
            <div
              className="flex rounded-full overflow-hidden p-0.5"
              style={{ background: "#D8E8E6" }}
            >
              {["mingguan", "bulanan"].map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-full border-none cursor-pointer transition-all duration-150"
                  style={{
                    background: chartMode === m ? "#1B8C7D" : "transparent",
                    color: chartMode === m ? "#fff" : "#5A8A84",
                  }}
                >
                  {m === "mingguan" ? "Mingguan" : "Bulanan"}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          {loadingChart ? (
            <div
              className="h-52 rounded-xl animate-pulse"
              style={{ background: "#D8E8E6" }}
            />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B8C7D" stopOpacity={0.18} />
                    <stop
                      offset="100%"
                      stopColor="#1B8C7D"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#8AADAA" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8AADAA" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<AreaTooltip />}
                  cursor={{
                    stroke: "#1B8C7D",
                    strokeWidth: 1,
                    strokeDasharray: "4 3",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="jumlah"
                  stroke="#1B8C7D"
                  strokeWidth={2.5}
                  fill="url(#trendGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#1B8C7D", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Aktivitas Terkini */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{
            background: "#fff",
            boxShadow: "0 2px 16px rgba(0,80,70,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base" style={{ color: "#0D2825" }}>
              Aktivitas Terkini
            </h3>
            {aktivitas.length > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#D8E8E6", color: "#1B8C7D" }}
              >
                {aktivitas.length}
              </span>
            )}
          </div>

          {aktivitas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
              <span className="text-3xl">📭</span>
              <p className="text-sm" style={{ color: "#8AADAA" }}>
                Belum ada aktivitas
              </p>
            </div>
          ) : (
            <div
              className="flex-1 overflow-y-auto space-y-1 max-h-[260px] pr-0.5"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#C8E6E3 transparent",
              }}
            >
              {aktivitas.map((item, i) => {
                const tc = tipeConfig[item.tipe] || tipeConfig.laporan;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-2 py-3 rounded-xl transition-colors cursor-default"
                    style={{ "--hover-bg": "#F5FFFE" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F5FFFE")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* Circle icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: tc.bg }}
                    >
                      {React.cloneElement(tc.icon, {
                        className: "w-4 h-4",
                        style: { color: tc.color },
                      })}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "#0D2825" }}
                      >
                        {item.judul}
                      </p>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: "#8AADAA" }}
                      >
                        {item.detail}
                      </p>
                    </div>

                    {/* Time */}
                    <span
                      className="text-xs flex-shrink-0 mt-0.5"
                      style={{ color: "#8AADAA" }}
                    >
                      {timeAgo(item.waktu)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
