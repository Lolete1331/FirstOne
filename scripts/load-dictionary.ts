/**
 * Carga supabase/data/dictionary.tsv en la tabla dictionary_words.
 *   DATABASE_URL=postgresql://... npm run dict:load
 * Es idempotente: se puede volver a ejecutar tras regenerar la lista.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const BATCH = 5000;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL (cadena de conexión de Postgres)");
  const rows = readFileSync(join(process.cwd(), "supabase/data/dictionary.tsv"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => l.split("\t") as [string, string]);

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("begin");
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      await client.query(
        `insert into public.dictionary_words (word, source)
         select * from unnest($1::text[], $2::text[])
         on conflict (word) do update set source = excluded.source`,
        [chunk.map((r) => r[0]), chunk.map((r) => r[1])],
      );
    }
    await client.query("commit");
    const { rows: r } = await client.query("select count(*)::int as n from public.dictionary_words");
    console.log(`✔ diccionario cargado: ${r[0].n} palabras`);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
