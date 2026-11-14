import { ImageResponse } from "next/og";

// Default share preview for every page that does not set its own image (events, photographers and galleries do).
export const alt = "Amoria Connekyt - Event Photography & Live Streaming";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "linear-gradient(135deg, #083A85 0%, #062B63 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", width: 120, height: 10, background: "#F20C8F", marginBottom: 40 }} />
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700 }}>Amoria Connekyt</div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 24, color: "#dbe7fb" }}>
          Event photography and live streaming
        </div>
      </div>
    ),
    size,
  );
}
