// ── Modal Konfirmasi (dark-red theme — intentional) ───────────────────────────
export default function ModalKonfirmasi({ judul, pesan, labelOk = "Hapus", onOk, onBatal }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "#0d1627",
          border: "1px solid #450a0a",
          boxShadow: "0 24px 48px rgba(0,0,0,0.7)",
        }}
      >
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: "#450a0a" }}
          >
            🗑️
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#f1f5f9" }}>
              {judul}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Tindakan ini tidak dapat dibatalkan
            </p>
          </div>
        </div>
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            {pesan}
          </p>
        </div>
        <div
          className="flex gap-2 px-5 py-4"
          style={{ borderTop: "1px solid #1e293b" }}
        >
          <button
            onClick={onBatal}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-80"
            style={{ background: "#1e293b", color: "#94a3b8" }}
          >
            Batal
          </button>
          <button
            onClick={onOk}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
            style={{ background: "#dc2626", color: "#fff" }}
          >
            {labelOk}
          </button>
        </div>
      </div>
    </div>
  );
}
