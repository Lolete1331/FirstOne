import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda FirstOne, para qué, durante cuánto tiempo y cómo ejercer tus derechos.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalPage kicker="Legal" title="Política de privacidad">
      <p>
        En FirstOne guardamos <b>los menos datos posibles</b> y solo los que hacen falta para que el juego funcione. Aquí te
        lo contamos con claridad. Si tienes cualquier duda, escríbenos a <ContactEmail />.
      </p>

      <h2>1. Quién es el responsable</h2>
      <p>
        El responsable de tus datos es <b>{LEGAL.ownerName}</b>, con domicilio en {LEGAL.location}. FirstOne es un proyecto
        personal, gratuito y sin ánimo de lucro. Contacto: <ContactEmail />.
      </p>

      <h2>2. Qué datos guardamos y para qué</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Dato</th>
              <th>Para qué</th>
              <th>Cuánto tiempo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>Tu email</b> (y, si entras con Google, el nombre y la foto que Google nos facilita)
              </td>
              <td>Crear tu cuenta, dejarte entrar y enviarte el código de acceso. Nunca lo mostramos ni lo usamos para publicidad.</td>
              <td>Mientras tengas cuenta.</td>
            </tr>
            <tr>
              <td>
                <b>Tu nombre de usuario</b> y, si lo eliges, <b>tu país</b>
              </td>
              <td>Identificarte en el juego. Son <b>públicos</b>: aparecen en el ranking, el historial y tu perfil.</td>
              <td>Mientras tengas cuenta.</td>
            </tr>
            <tr>
              <td>
                <b>Tus palabras</b>: cuáles escribiste, cuándo y en qué posición
              </td>
              <td>
                Es el juego en sí. Son <b>públicas</b> y forman el historial de cada año.
              </td>
              <td>
                Se conservan como historial. Si borras tu cuenta, quedan como «cuenta eliminada», sin tu nombre.
              </td>
            </tr>
            <tr>
              <td>
                <b>Tu dirección IP</b>
              </td>
              <td>Evitar abusos (limitar cuántas palabras se envían por minuto desde una misma conexión).</td>
              <td>Alrededor de una hora; después se borra.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        No pedimos tu nombre real, tu edad, tu teléfono ni tu dirección. <b>No vendemos ni cedemos tus datos</b> a nadie y no
        hay publicidad.
      </p>

      <h2>3. Por qué podemos usarlos (base legal)</h2>
      <ul>
        <li>
          <b>Para que el juego funcione</b> (cuenta, nombre de usuario, palabras): porque tú te registras y aceptas jugar con
          estas reglas. Es necesario para prestarte el servicio (art. 6.1.b del Reglamento General de Protección de Datos).
        </li>
        <li>
          <b>Para la seguridad</b> (dirección IP, limitar abusos, frenar bots): nuestro interés legítimo en que el juego sea
          justo para todos (art. 6.1.f).
        </li>
      </ul>

      <h2>4. Quién nos ayuda a tratar los datos</h2>
      <p>Usamos servicios de terceros que solo tratan los datos siguiendo nuestras instrucciones:</p>
      <ul>
        <li>
          <b>Supabase</b>: base de datos y sistema de inicio de sesión. Los datos se guardan en servidores de la Unión Europea
          (París).
        </li>
        <li>
          <b>Vercel</b>: aloja la web. Puede tratar datos técnicos de tu visita (como la IP) para servirte las páginas.
        </li>
        <li>
          <b>Google</b>: solo si eliges «Continuar con Google». Google te identifica y nos facilita tu email; su uso se rige
          por la política de privacidad de Google.
        </li>
        <li>
          <b>Proveedor de correo</b>: para enviarte el código de acceso cuando entras con tu email.
        </li>
        <li>
          <b>Cloudflare Turnstile</b>: si en algún momento te pedimos comprobar que no eres un robot.
        </li>
      </ul>
      <p>
        Algunos de estos proveedores son empresas de Estados Unidos. En ese caso, las transferencias se amparan en el Marco de
        Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo aprobadas por la Comisión Europea.
      </p>
      <p>
        Las definiciones de las palabras se consultan en Wikcionario desde nuestro servidor: Wikcionario no recibe ningún dato
        tuyo.
      </p>

      <h2>5. Menores de edad</h2>
      <p>
        Para crear una cuenta en el juego hay que tener <b>al menos 14 años</b>. Si eres menor de 14, pide a tu madre, padre o
        tutor que lo haga por ti o que te acompañe.
      </p>
      <p>
        La sección <Link href="/lectura">«Leer y escribir mejor»</Link> (actividades para niños con dislexia) <b>no pide cuenta
        ni recoge ningún dato</b>: los ajustes y las estrellas se guardan solo en el propio dispositivo.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes pedirnos en cualquier momento <b>ver</b> qué datos tenemos tuyos, <b>corregirlos</b>, <b>borrarlos</b> (darte de
        baja), <b>oponerte</b> a que los usemos, <b>limitar</b> su uso o <b>llevártelos</b> en un formato habitual. Solo tienes
        que escribirnos a <ContactEmail /> desde el email de tu cuenta, indicando tu nombre de usuario. Te responderemos en un
        plazo máximo de un mes.
      </p>
      <p>
        Si crees que no hemos atendido bien tu petición, puedes reclamar ante la{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          Agencia Española de Protección de Datos
        </a>
        .
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Las conexiones van cifradas (https), no guardamos contraseñas (se entra con un código de un solo uso o con Google) y
        el acceso a la base de datos está restringido.
      </p>

      <h2>8. Cambios</h2>
      <p>
        Si cambiamos algo importante de esta política, lo indicaremos aquí con la fecha de actualización. Sobre las cookies,
        consulta la <Link href="/cookies">política de cookies</Link>.
      </p>
    </LegalPage>
  );
}
