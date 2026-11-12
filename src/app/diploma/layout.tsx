import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/cormorant-garamond/latin-600-italic.css";
import "@fontsource/cormorant-garamond/latin-700-italic.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";

export default function DiplomaLayout({ children }: { children: React.ReactNode }) {
  return <div className="diploma-page flex-1 min-h-dvh bg-[#2a2622]">{children}</div>;
}
