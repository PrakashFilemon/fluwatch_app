export default function LandingPage({ onEnterApp, onLoginClick }) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#D8E8E6] text-[#1F2937] flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500&display=swap');

        .lp-root * { font-family: 'DM Sans', sans-serif; }

        @keyframes floatOrb {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(30px,-20px) scale(1.05); }
          66%  { transform: translate(-20px,15px) scale(0.96); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes heroFadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulseDot {
          0%,100% { box-shadow:0 0 0 0 rgba(58,142,133,0.6); }
          50%      { box-shadow:0 0 0 6px rgba(58,142,133,0); }
        }
        @keyframes gridScroll {
          from { transform:translateY(0); }
          to   { transform:translateY(60px); }
        }
        @keyframes scanLine {
          0%   { top:0%;   opacity:0.5; }
          100% { top:100%; opacity:0; }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }

        .lp-fade-1 { animation:heroFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .lp-fade-2 { animation:heroFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .lp-fade-3 { animation:heroFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
        .lp-fade-4 { animation:heroFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.40s both; }
        .lp-fade-5 { animation:heroFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s both; }
        .lp-orb-1  { animation:floatOrb 16s ease-in-out infinite; }
        .lp-orb-2  { animation:floatOrb 20s ease-in-out 4s infinite reverse; }
        .lp-orb-3  { animation:floatOrb 24s ease-in-out 8s infinite; }
        .lp-pulse  { animation:pulseDot 2.2s ease-in-out infinite; }
        .grid-bg   { animation:gridScroll 10s linear infinite; }
        .scan-ln   { animation:scanLine 5s linear infinite; }

        .grad-text {
          background: linear-gradient(90deg,#3A8E85 0%,#7EB8B1 50%,#3A8E85 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .card-feat {
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(58,142,133,0.15);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .card-feat:hover {
          transform: translateY(-4px);
          border-color: rgba(58,142,133,0.4) !important;
          background: rgba(255,255,255,1) !important;
          box-shadow: 0 12px 40px rgba(58,142,133,0.15);
        }

        .btn-glow {
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
        }
        .btn-glow::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);
          transform: translateX(-100%);
          transition: transform 0.45s ease;
        }
        .btn-glow:hover::before { transform: translateX(100%); }
        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(58,142,133,0.45);
        }

        .btn-ghost {
          transition: all 0.2s ease;
        }
        .btn-ghost:hover {
          background: rgba(58,142,133,0.08);
          border-color: rgba(58,142,133,0.25) !important;
        }
      `}</style>

      {/* ── BACKGROUND ───────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="grid-bg absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(58,142,133,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(58,142,133,0.4) 1px,transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />
        <div
          className="scan-ln absolute left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg,transparent,rgba(58,142,133,0.25),transparent)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
            radial-gradient(ellipse 65% 55% at 80% 0%,  rgba(58,142,133,0.12) 0%,transparent 60%),
            radial-gradient(ellipse 55% 50% at 10% 95%, rgba(126,184,177,0.10) 0%,transparent 55%),
            radial-gradient(ellipse 50% 60% at 50% 55%, rgba(234,242,241,0.6) 0%,transparent 70%)
          `,
          }}
        />
      </div>

      {/* ── ORBS ─────────────────────────────────────────── */}
      <div
        className="lp-orb-1 absolute top-[4%] right-[6%] w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle,rgba(58,142,133,0.14),transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="lp-orb-2 absolute bottom-[8%] left-[3%] w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle,rgba(126,184,177,0.12),transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      <div
        className="lp-orb-3 absolute top-[40%] right-[30%] w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle,rgba(0,107,95,0.08),transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── NAVBAR ───────────────────────────────────────── */}
      <header className="lp-root relative z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[60px] sm:h-[68px]">
        {/* Logo */}
        <div className="lp-fade-1 flex items-center gap-2.5 flex-shrink-0">
          <div className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-xl flex items-center justify-center bg-gradient-to-br from-[#7EB8B1] to-[#3A8E85] shadow-[0_0_18px_rgba(58,142,133,0.45)] flex-shrink-0">
            <span className="text-[16px] sm:text-[18px]">🦠</span>
          </div>
          <div className="flex flex-col leading-none gap-[2px]">
            <span className="font-bold text-[14px] sm:text-[15px] tracking-tight text-[#1F2937]">
              FluWatch<span className="text-[#3A8E85]">.AI</span>
            </span>
            <span
              style={{ fontFamily: "'DM Mono',monospace" }}
              className="text-[8px] text-[#1F2937]/30 tracking-[0.18em] uppercase hidden sm:block"
            >
              Indonesia
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="lp-fade-1 flex items-center gap-1 sm:gap-2">
          <button
            onClick={onLoginClick}
            className="btn-glow px-5 py-2 rounded-full text-[13px] font-semibold text-white bg-[#3A8E85] border border-[#3A8E85] shadow-[0_2px_12px_rgba(58,142,133,0.3)] hover:bg-[#006B5F] hover:border-[#006B5F]"
          >
            <span className="hidden sm:inline">Daftar Gratis</span>
            <span className="sm:hidden">Daftar</span>
          </button>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="lp-root flex-1 relative flex flex-col items-center justify-center text-center px-4 sm:px-6 py-10 sm:py-8 overflow-hidden">
        <div className="relative z-10 w-full max-w-[680px] mx-auto">
          {/* Live badge */}
          <div className="lp-fade-1 mb-5 sm:mb-6">
            <span className="inline-flex items-center gap-2 bg-[#c90909]/[0.08] border border-[#c90909]/25 px-3 sm:px-4 py-[6px] sm:py-[7px] rounded-full text-[10px] sm:text-[11px] font-semibold text-[#c90909] tracking-wide uppercase">
              <span className="lp-pulse w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-full bg-[#c90909] inline-block flex-shrink-0" />
              Pemantauan Aktif · Real-Time
              <span className="w-px h-3 bg-[#c90909]/30 hidden sm:block" />
              <span
                style={{ fontFamily: "'DM Mono',monospace" }}
                className="text-[#c90909] normal-case tracking-normal hidden sm:inline"
              >
                {new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </span>
            </span>
          </div>

          {/* Headline */}
          <h1
            className="lp-fade-2 font-extrabold leading-[1.1] mb-4 sm:mb-5"
            style={{
              fontSize: "clamp(28px,5.5vw,64px)",
              letterSpacing: "-0.03em",
            }}
          >
            <span className="text-[#1F2937]">Pantau Sebaran</span>
            <br />
            <span className="text-[#1F2937]">Influenza </span>
            <span className="grad-text">Real-Time.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="lp-fade-3 text-[#1F2937]/55 leading-[1.72] max-w-[480px] mx-auto mb-7 sm:mb-8"
            style={{ fontSize: "clamp(13px,1.6vw,16px)" }}
          >
            Platform surveilans influenza berbasis komunitas dengan kecerdasan
            buatan. Laporkan gejala, lihat peta wabah, dan dapatkan analisis
            risiko lokal.
          </p>

          {/* CTAs */}
          <div className="lp-fade-4 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center mb-10 sm:mb-12">
            <button
              onClick={onEnterApp}
              className="btn-glow px-7 sm:px-8 py-[13px] rounded-[12px] text-[14px] font-bold text-white bg-gradient-to-br from-[#3A8E85] to-[#006B5F] shadow-[0_0_24px_rgba(58,142,133,0.35)] text-center"
            >
              Masuk ke Aplikasi →
            </button>
            <div className="px-7 sm:px-8 py-[13px] rounded-[12px] text-[14px] font-semibold text-[#c90909] border border-[#3A8E85]/30 hover:border-[#3A8E85]/60 hover:bg-[#3A8E85]/[0.07] hover:text-[#006B5F] transition-all duration-200 cursor-default text-center">
              ⚠ Laporkan Gejala
            </div>
          </div>

          {/* Feature cards */}
          <div className="lp-fade-5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
            {[
              {
                accent: "#3A8E85",
                icon: "▦",
                title: "Peta Heatmap",
                desc: "Leaflet · hotspot lokasi",
              },
              {
                accent: "#006B5F",
                icon: "⚠",
                title: "Laporan Gejala",
                desc: "10 gejala · skor WHO 0–100",
              },
              {
                accent: "#7EB8B1",
                icon: "◎",
                title: "Analisis AI",
                desc: "Grounding · kasus nyata",
              },
              {
                accent: "#22c55e",
                icon: "↗",
                title: "Dashboard",
                desc: "Kasus aktif · update 5 mnt",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card-feat rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4 cursor-default text-left"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <span
                    className="text-[13px] sm:text-[16px] flex-shrink-0"
                    style={{ color: f.accent }}
                  >
                    {f.icon}
                  </span>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-[#1F2937] leading-tight">
                    {f.title}
                  </span>
                </div>
                <p
                  style={{ fontFamily: "'DM Mono',monospace" }}
                  className="text-[9px] sm:text-[10px] text-[#c90909]/55 m-0 leading-[1.5]"
                >
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
