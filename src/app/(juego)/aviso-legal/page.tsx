import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso legal y normas de uso",
  description: "Quién está detrás de FirstOne, normas de uso del juego, propiedad intelectual y responsabilidad.",
  alternates: { canonical: "/aviso-legal" },
};

export default function AvisoLegalPage() {
  return (
    <LegalPage kicker="Legal" title="Aviso legal y normas de uso">
      <h2>1. Quién está detrás de FirstOne</h2>
      <p>
        La web <b>firstone.es</b> es un proyecto personal, gratuito y sin ánimo de lucro de <b>{LEGAL.ownerName}</b>, con
        domicilio en {LEGAL.location}. Contacto: <ContactEmail />.
      </p>

      <h2>2. Qué es FirstOne</h2>
      <p>
        FirstOne es un juego en el que cada palabra del español solo puede tener un dueño al año: la primera persona que la
        escribe. Incluye también actividades gratuitas de lectura para niños con dislexia. Usar la web implica aceptar estas
        normas.
      </p>
      <p>
        «Ser dueño» de una palabra es <b>solo parte del juego</b>: no da ningún derecho real sobre la palabra, que sigue siendo
        de todos los hablantes.
      </p>

      <h2>3. Normas del juego</h2>
      <ul>
        <li>Hay que tener al menos 14 años para crear una cuenta.</li>
        <li>Una cuenta por persona. No se permite usar bots, programas automáticos ni trucos para enviar palabras.</li>
        <li>
          El nombre de usuario no puede ser ofensivo, suplantar a otra persona ni incluir datos personales de nadie.
        </li>
        <li>
          El juego es gratuito y <b>pagar nunca dará ventaja</b>: nadie puede comprar palabras ni prioridad.
        </li>
        <li>Cada 1 de enero a las 00:00 (hora UTC) empieza una carrera nueva; los resultados anteriores quedan en el historial.</li>
      </ul>
      <p>
        Si alguien incumple estas normas podemos anular sus palabras, ocultar contenido ofensivo o bloquear su cuenta, para
        que el juego sea justo para todos.
      </p>

      <h2>4. Propiedad intelectual</h2>
      <ul>
        <li>El nombre FirstOne, el logotipo, el diseño y el código de la web pertenecen a sus creadores.</li>
        <li>
          Las <b>definiciones</b> proceden de{" "}
          <a href="https://es.wiktionary.org" target="_blank" rel="noopener noreferrer">
            Wikcionario
          </a>{" "}
          y se publican con la licencia{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noopener noreferrer">
            CC BY-SA 4.0
          </a>
          , citando siempre la fuente.
        </li>
        <li>
          La lista de palabras se ha elaborado a partir de diccionarios abiertos del español.
        </li>
        <li>
          FirstOne <b>no tiene relación con la Real Academia Española</b> ni está avalado por ella. Los enlaces al Diccionario de
          la lengua española (dle.rae.es) se ofrecen solo como referencia.
        </li>
      </ul>

      <h2>5. Responsabilidad</h2>
      <p>
        Hacemos lo posible para que la web funcione bien, pero no podemos garantizar que esté siempre disponible ni libre de
        errores. Podemos cambiar o interrumpir el juego, por ejemplo por mantenimiento. No nos hacemos responsables del
        contenido de las webs externas a las que enlazamos.
      </p>
      <p>
        Las actividades de <Link href="/lectura">«Leer y escribir mejor»</Link> son un apoyo para practicar y{" "}
        <b>no sustituyen a un profesional</b> (logopeda, psicopedagogo): solo un profesional puede valorar si hay dislexia.
      </p>

      <h2>6. Datos personales y cookies</h2>
      <p>
        Lo explicamos en la <Link href="/privacidad">política de privacidad</Link> y en la{" "}
        <Link href="/cookies">política de cookies</Link>.
      </p>

      <h2>7. Ley aplicable</h2>
      <p>Estas normas se rigen por la legislación española.</p>
    </LegalPage>
  );
}
