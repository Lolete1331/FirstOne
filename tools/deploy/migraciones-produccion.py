import json, sys, urllib.request, glob, os
REF = "dbeqvvsyjidzxponycmh"
def q(sql):
    req = urllib.request.Request(f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode(), headers={"content-type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as r: return json.loads(r.read() or "null")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ERROR {e.code}: {e.read().decode()[:800]}")
if __name__ == "__main__":
    mig = sorted(glob.glob("/home/user/firstone/supabase/migrations/*.sql"))
    q("create schema if not exists supabase_migrations; create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);")
    done = {r["version"] for r in q("select version from supabase_migrations.schema_migrations")}
    for f in mig:
        base = os.path.basename(f); version, name = base.split("_", 1)
        if version in done: print("ya aplicada", base); continue
        q(open(f, encoding="utf8").read())
        q(f"insert into supabase_migrations.schema_migrations(version, name) values ('{version}', '{name[:-4]}')")
        print("✔", base)
