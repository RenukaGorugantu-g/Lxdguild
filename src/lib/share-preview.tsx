import { ImageResponse } from "next/og";

export const shareImageSize = {
  width: 1200,
  height: 630,
};

export const shareImageContentType = "image/png";

type SharePreviewOptions = {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "green" | "blue" | "gold";
};

function getAccentStyles(accent: SharePreviewOptions["accent"]) {
  switch (accent) {
    case "blue":
      return {
        pill: "#dbeafe",
        pillText: "#1d4ed8",
        glow: "rgba(59, 130, 246, 0.22)",
        stripe: "#2563eb",
      };
    case "gold":
      return {
        pill: "#fef3c7",
        pillText: "#b45309",
        glow: "rgba(245, 158, 11, 0.2)",
        stripe: "#d97706",
      };
    case "green":
    default:
      return {
        pill: "#dcfce7",
        pillText: "#15803d",
        glow: "rgba(34, 197, 94, 0.22)",
        stripe: "#16a34a",
      };
  }
}

export function buildSharePreview({
  eyebrow,
  title,
  description,
  accent = "green",
}: SharePreviewOptions) {
  const styles = getAccentStyles(accent);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "radial-gradient(circle at top left, rgba(190, 242, 100, 0.22), transparent 30%), linear-gradient(135deg, #f7fbf2 0%, #fefdf8 52%, #eef7e7 100%)",
          color: "#0f172a",
          padding: "44px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            borderRadius: "36px",
            border: "1px solid rgba(205, 219, 194, 0.95)",
            background: "rgba(255,255,255,0.92)",
            boxShadow: `0 30px 80px ${styles.glow}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "14px",
              width: "100%",
              background: `linear-gradient(90deg, ${styles.stripe} 0%, #0f172a 100%)`,
            }}
          />
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "42px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "64px",
                      height: "64px",
                      borderRadius: "18px",
                      background: "#101828",
                      color: "#34cd2f",
                      fontSize: "24px",
                      fontWeight: 700,
                    }}
                  >
                    LXD
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div
                      style={{
                        display: "flex",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "#6b7280",
                      }}
                    >
                      LXD Guild
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      Skill-first marketplace for modern L&amp;D careers
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    background: styles.pill,
                    color: styles.pillText,
                    padding: "10px 18px",
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  {eyebrow}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: "68px",
                  lineHeight: 1.02,
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  maxWidth: "850px",
                  color: "#0f172a",
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: "flex",
                  maxWidth: "880px",
                  fontSize: "30px",
                  lineHeight: 1.35,
                  color: "#475569",
                }}
              >
                {description}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                {["Verified profiles", "ATS insights", "Jobs and growth"].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "999px",
                      border: "1px solid rgba(205, 219, 194, 0.95)",
                      padding: "12px 18px",
                      fontSize: "18px",
                      color: "#334155",
                      background: "#ffffff",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "999px",
                  background: "#22c55e",
                  color: "#ffffff",
                  padding: "14px 22px",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                lxdmarketplace.lxdguild.com
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    shareImageSize
  );
}
