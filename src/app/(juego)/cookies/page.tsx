import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "FirstOne solo usa cookies técnicas imprescindibles: sin publicidad ni rastreo.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage kicker="Legal" title="Política de cookies">
      <p>
        Las cookies son pequeños archivos que una web guarda en tu navegador. En FirstOne <b>solo usamos las imprescindibles
        para que la web funcione</b>: no usamos cookies de publicidad ni de rastreo, y no compartimos nada con redes sociales.
        Por eso no te mostramos el típico aviso para aceptarlas: la ley no lo exige para las cookies técnicas.
      </p>

      <h2>Cookies que usamos</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Para qué sirve</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>sb-…-auth-token</b>
              </td>
              <td>Mantener tu sesión iniciada para que no tengas que entrar cada vez.</td>
              <td>Hasta que cierres sesión o caduque.</td>
            </tr>
            <tr>
              <td>
                <b>fo_human</b>
              </td>
              <td>Recordar que ya has comprobado que no eres un robot, para no preguntártelo en cada palabra.</td>
              <td>30 minutos.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Datos guardados en tu dispositivo</h2>
      <p>
        La sección <Link href="/lectura">«Leer y escribir mejor»</Link> guarda en tu navegador (almacenamiento local) los
        ajustes elegidos (fondo, letra, tamaño, espaciado) y las estrellas conseguidas. Estos datos <b>no salen de tu
        dispositivo</b> y nunca nos llegan.
      </p>

      <h2>Estadísticas de visitas</h2>
      <p>
        Para saber cuánta gente visita la web usamos <b>Vercel Web Analytics</b>, que cuenta visitas de forma anónima y{" "}
        <b>sin usar cookies</b>: no te identifica ni te sigue por otras webs.
      </p>

      <h2>Iniciar sesión con Google</h2>
      <p>
        Si eliges «Continuar con Google», durante el inicio de sesión estarás en las páginas de Google, que usan sus propias
        cookies según su política de privacidad.
      </p>

      <h2>Cómo borrarlas</h2>
      <p>
        Puedes borrar las cookies cuando quieras desde la configuración de tu navegador. Si lo haces, se cerrará tu sesión y
        tendrás que volver a entrar.
      </p>
      <p>
        Más información en la <Link href="/privacidad">política de privacidad</Link>. Dudas: <ContactEmail />.
      </p>
    </LegalPage>
  );
}
