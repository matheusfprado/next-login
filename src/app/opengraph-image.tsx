import { ImageResponse } from "next/og";

export const alt = "InvestHub - Controle de investimentos e criptomoedas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "#07110d", color: "white" }}>
      <div style={{ display: "flex", color: "#34d399", fontSize: 42, fontWeight: 700 }}>InvestHub</div>
      <div style={{ display: "flex", marginTop: 38, maxWidth: 960, fontSize: 68, lineHeight: 1.08, fontWeight: 700 }}>Controle seus investimentos e criptomoedas</div>
      <div style={{ display: "flex", marginTop: 30, fontSize: 30, color: "#d1d5db" }}>Carteira, cotações, alertas, Binance e MetaMask.</div>
    </div>,
    size,
  );
}
