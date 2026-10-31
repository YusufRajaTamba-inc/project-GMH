#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"

echo "===== ALL TABLES ====="
$PSQL -c "select table_name from information_schema.tables where table_schema='public' order by table_name;" 2>&1

echo ""
echo "===== COLUMNS PER TABLE ====="
$PSQL -c "select table_name, string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_schema='public' group by table_name order by table_name;" 2>&1

echo ""
echo "===== ROW COUNTS ====="
for t in $(sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -t -A -c "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name;"); do
  c=$(sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -t -A -c "select count(*) from \"$t\";" 2>/dev/null | tr -d ' \r')
  echo "$t = $c"
done
