#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"
run() { echo ""; echo "===== $1 ====="; $PSQL -c "$2" 2>&1 | head -60; }
run "row counts" "select 'members' t, count(*) c from members union all select 'users', count(*) from users union all select 'pledges', count(*) from pledges union all select 'financial_transactions', count(*) from financial_transactions union all select 'building_projects', count(*) from building_projects union all select 'committee_records', count(*) from committee_records union all select 'org_position_tenures', count(*) from org_position_tenures union all select 'mission_activities', count(*) from mission_activities union all select 'foundation_programs', count(*) from foundation_programs union all select 'member_registrations', count(*) from member_registrations union all select 'assets', count(*) from assets union all select 'prayer_requests', count(*) from prayer_requests union all select 'staff_members', count(*) from staff_members union all select 'audit_logs', count(*) from audit_logs;"
run "triggers" "select tgname, relname, pg_get_triggerdef(oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid where not tgisinternal and c.relname in ('building_projects','pledges','financial_transactions');"
run "users member link" "select column_name from information_schema.columns where table_name='users' order by 1;"
run "org tables ddl" "select conrelid::regclass tbl, conname, pg_get_constraintdef(oid) from pg_constraint where conrelid::regclass::text in ('committee_records','org_position_tenures','staff_members','org_positions');"
run "audit recent" "select id, action, entity_name, entity_id, created_at from audit_logs order by id desc limit 20;"
run "seed trx present" "select transaction_code, transaction_date, transaction_type, amount, scope, notes from financial_transactions order by created_at;"
run "all projects" "select id, project_name, category, target_budget, current_funds, progress_percentage, status, start_date, milestones from building_projects;"
run "committees" "select id, committee_name, role_title, member_id from committee_records order by committee_name;"
run "tenures" "select id, member_id, position_id, start_date, is_active from org_position_tenures;"
