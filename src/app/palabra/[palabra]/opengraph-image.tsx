import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getWordInfo } from "@/lib/words/word-page";
import { currentGameYear } from "@/lib/time/year";

export const alt = "¿De quién es esta palabra en FirstOne?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (f: string) => readFile(join(process.cwd(), "assets/fonts", f));
const fonts = Promise.all([
  font("cormorant-garamond-latin-700-normal.woff"),
  font("eb-garamond-latin-400-normal.woff"),
  font("eb-garamond-latin-400-italic.woff"),
  font("atkinson-hyperlegible-latin-700-normal.woff"),
]);

/** Tarjeta para compartir: «palabra» es de @usuario, con el estilo del diploma. */
export default async function Image({ params }: { params: Promise<{ palabra: string }> }) {
  const { palabra } = await params;
  const [info, [cormorant, garamond, garamondItalic, atkinson]] = await Promise.all([getWordInfo(decodeURIComponent(palabra)), fonts]);
  const year = currentGameYear();
  const now = info.history.find((h) => h.year === year);
  const word = info.exists ? info.word : decodeURIComponent(palabra);
  const wordSize = word.length > 14 ? 96 : word.length > 10 ? 120 : 150;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#2a2622", padding: 36 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f0e1",
            border: "3px solid #b08a2e",
            borderRadius: 28,
            color: "#2b2622",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", inset: 14, border: "1px solid #d9c9a3", borderRadius: 20, display: "flex" }} />
          <div style={{ fontFamily: "EB Garamond", fontSize: 26, letterSpacing: 8, color: "#8a7a5c", textTransform: "uppercase" }}>{`FirstOne · ${year}`}</div>
          <div style={{ fontFamily: "Cormorant", fontSize: wordSize, lineHeight: 1.05, marginTop: 10 }}>{`«${word}»`}</div>
          {now ? (
            <div style={{ display: "flex", alignItems: "center", marginTop: 18, fontFamily: "EB Garamond", fontSize: 50 }}>
              <span>{"es de\u00a0"}</span>
              <span style={{ fontFamily: "Atkinson", fontSize: 44, color: "#8a6d22" }}>{`@${now.owner ?? "cuenta eliminada"}`}</span>
              <div
                style={{
                  marginLeft: 22,
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  background: "#d4a73a",
                  border: "4px solid #b08a2e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Atkinson",
                  fontSize: 34,
                  color: "#fff",
                }}
              >
                1
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 18, fontFamily: "EB Garamond", fontStyle: "italic", fontSize: 46, color: "#6b6256" }}>todavía no tiene dueño… ¿será tuya?</div>
          )}
          {now && now.total > 1 && (
            <div style={{ marginTop: 10, fontFamily: "EB Garamond", fontStyle: "italic", fontSize: 30, color: "#6b6256" }}>
              {`y ${(now.total - 1).toLocaleString("es")} ${now.total === 2 ? "persona llegó" : "personas llegaron"} después`}
            </div>
          )}
          <div style={{ position: "absolute", bottom: 40, fontFamily: "EB Garamond", fontSize: 28, color: "#8a7a5c" }}>
            firstone.es · cada palabra del español, un solo dueño al año
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant", data: cormorant, weight: 700, style: "normal" },
        { name: "EB Garamond", data: garamond, weight: 400, style: "normal" },
        { name: "EB Garamond", data: garamondItalic, weight: 400, style: "italic" },
        { name: "Atkinson", data: atkinson, weight: 700, style: "normal" },
      ],
    },
  );
}
