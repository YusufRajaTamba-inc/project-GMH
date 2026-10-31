#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"
run() { echo ""; echo "===== $1 ====="; $PSQL -c "$2" 2>&1 | head -40; }
run "projects full" "select id, project_name, target_budget, current_funds, progress_percentage, status, start_date, created_at, pic_name from building_projects order by start_date;"
run "unique constraints" "select conrelid::regclass as tbl, conname, pg_get_constraintdef(oid) from pg_constraint where contype in ('u','p') and conrelid::regclass::text in ('committee_records','org_position_tenures','foundation_programs','pledges','financial_transactions','building_projects','mission_activities');"
run "pledges all" "select id, donor_name, member_id, total_pledge, fulfilled_amount, category, status, building_project_id, created_at from pledges order by created_at;"
run "trx orphan income" "select * from financial_transactions where transaction_code='TX-GMH-202610-0007';"
run "seed run count evidence" "select table_name, count(*) from information_schema.tables where table_schema='public' group by 1 order by 2 desc limit 5;"
run "audit full" "select id, action, entity_type, entity_id, created_at from audit_logs order by created_at desc limit 15;"
run "members created" "select member_number, full_name, created_at from members order by created_at;"
