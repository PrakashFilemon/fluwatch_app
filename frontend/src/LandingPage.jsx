export default function LandingPage({ onEnterApp, onLoginClick }) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#08090f] text-slate-100 flex flex-col font-sans">
      <style>{`
        @keyframes floatOrb {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(28px, -18px) scale(1.04); }
          66%  { transform: translate(-18px, 14px) scale(0.97); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%       { opacity: 0.7; box-shadow: 0 0 0 5px rgba(239,68,68,0); }
        }
        .lp-fade-1 { animation: heroFadeUp 0.5s ease-out 0.05s both; }
        .lp-fade-2 { animation: heroFadeUp 0.5s ease-out 0.18s both; }
        .lp-fade-3 { animation: heroFadeUp 0.5s ease-out 0.30s both; }
        .lp-fade-4 { animation: heroFadeUp 0.5s ease-out 0.42s both; }
        .lp-fade-5 { animation: heroFadeUp 0.5s ease-out 0.54s both; }
        .lp-orb-1  { animation: floatOrb 14s ease-in-out infinite; }
        .lp-orb-2  { animation: floatOrb 18s ease-in-out 3s infinite reverse; }
        .lp-orb-3  { animation: floatOrb 22s ease-in-out 6s infinite; }
        .lp-pulse  { animation: pulseDot 2s ease-in-out infinite; }
        .grad-text {
          background: linear-gradient(90deg, #ef4444, #f97316);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-[58px] flex items-center justify-between px-7 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-[30px] h-[30px] rounded-lg text-[15px] flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
            🦠
          </div>
          <span className="font-bold text-[15px] tracking-tight">
            FluWatch<span className="text-orange-400">.AI</span>
          </span>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex gap-7">
          {[
            "Surveilans Influenza",
            "AI Berbasis Data",
            "Heatmap Real-Time",
          ].map((item) => (
            <span
              key={item}
              className="text-white text-[13px] cursor-default hover:text-slate-100 transition-colors duration-200"
            >
              {item}
            </span>
          ))}
        </nav>

        {/* Right action */}
        <button
          onClick={onLoginClick}
          className="px-6 py-[7px] rounded-lg text-[15px] font-bold text-white bg-gradient-to-br from-red-600 to-orange-500 shadow-[0_0_20px_rgba(239,68,68,0.30)] hover:brightness-110 hover:-translate-y-px transition-all duration-200"
        >
          Masuk
        </button>
      </header>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="flex-1 relative flex flex-col items-center justify-center text-center px-6 pb-6 overflow-hidden">
        {/* Background radial gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 75% 55% at 72% 8%, rgba(220,38,38,0.11) 0%, transparent 55%), radial-gradient(ellipse 65% 50% at 18% 95%, rgba(59,130,246,0.09) 0%, transparent 55%)",
          }}
        />

        {/* Orbs */}
        <div
          className="lp-orb-1 absolute top-[8%] right-[10%] w-80 h-80 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(220,38,38,0.11), transparent 70%)",
            filter: "blur(45px)",
          }}
        />
        <div
          className="lp-orb-2 absolute bottom-[12%] left-[6%] w-64 h-64 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.10), transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="lp-orb-3 absolute top-1/2 right-[38%] w-44 h-44 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(249,115,22,0.09), transparent 70%)",
            filter: "blur(35px)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-[680px] w-full">
          {/* Live badge */}
          <div className="lp-fade-1 mb-5">
            <span className="inline-flex items-center gap-[7px] bg-red-500/10 border border-red-500/30 px-[14px] py-[6px] rounded-full text-[11px] font-semibold text-red-300">
              <span className="lp-pulse w-[6px] h-[6px] rounded-full bg-red-500 inline-block" />
              Sistem Aktif — Pemantauan Real-Time
            </span>
          </div>

          {/* Headline */}
          <h1 className="lp-fade-2 text-[clamp(30px,4.8vw,58px)] font-extrabold leading-[1.12] tracking-[-1.5px] mb-[18px] text-slate-100">
            Pantau Sebaran Influenza
            <br />
            di Sekitar Anda,{" "}
            <span className="grad-text">Secara Real-Time.</span>
          </h1>

          {/* Subtitle */}
          <p className="lp-fade-3 text-[clamp(14px,1.6vw,17px)] text-slate-500 leading-[1.65] max-w-[520px] mx-auto mb-[30px]">
            Platform surveilans influenza berbasis komunitas dengan kecerdasan
            buatan. Laporkan gejala, lihat peta wabah, dan dapatkan analisis
            risiko lokal.
          </p>

          {/* CTAs */}
          <div className="lp-fade-4 flex gap-3 justify-center flex-wrap mb-11">
            <button
              onClick={onEnterApp}
              className="px-[30px] py-[13px] rounded-[11px] text-sm font-bold text-white bg-gradient-to-br from-red-600 to-orange-500 shadow-[0_0_20px_rgba(239,68,68,0.30)] hover:brightness-110 hover:-translate-y-px transition-all duration-200"
            >
              Masuk ke Aplikasi →
            </button>
            <button
              onClick={onLoginClick}
              className="px-[30px] py-[13px] rounded-[11px] text-sm font-semibold text-slate-100 bg-transparent border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all duration-200"
            >
              Laporkan Gejala Sekarang
            </button>
          </div>

          {/* Feature strip */}
          <div className="lp-fade-5 hidden lg:flex gap-3">
            {[
              {
                accent: "text-red-500",
                icon: "▦",
                title: "Peta Heatmap Real-Time",
                desc: "Leaflet · hotspot lokasi",
              },
              {
                accent: "text-orange-400",
                icon: "⚠",
                title: "Pelaporan Gejala",
                desc: "10 gejala · skor WHO 0–100",
              },
              {
                accent: "text-blue-500",
                icon: "◎",
                title: "Analisis AI Berbasis Data",
                desc: "Grounding · kasus nyata",
              },
              {
                accent: "text-green-500",
                icon: "↗",
                title: "Dashboard Statistik",
                desc: "Kasus aktif · update 5 mnt",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex-1 bg-[#0d1627]/70 border border-[#1a2744] rounded-xl px-4 py-[14px] min-w-0 hover:border-[#2d5a8e] transition-colors duration-200"
              >
                <div className="flex items-center gap-2 mb-[6px]">
                  <span className={`${f.accent} text-base`}>{f.icon}</span>
                  <span className="text-[12px] font-bold text-slate-200">
                    {f.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 m-0 leading-[1.5]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
