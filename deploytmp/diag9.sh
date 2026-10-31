#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"
run() { echo ""; echo "===== $1 ====="; $PSQL -c "$2" 2>&1 | head -60; }
run "triggers" "select t.tgname, c.relname, pg_get_triggerdef(t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid where not t.tgisinternal and c.relname in ('building_projects','pledges','financial_transactions','members');"
run "tenures cols" "select column_name, data_type from information_schema.columns where table_name='org_position_tenures' order by ordinal_position;"
run "tenures rows" "select t.member_id, m.full_name, t.position_id, p.position_code, t.start_date, t.end_date from org_position_tenures t left join members m on m.id=t.member_id left join org_positions p on p.id=t.position_id order by p.position_code, m.full_name;"
run "committee cols" "select column_name from information_schema.columns where table_name='committee_records' order by ordinal_position;"
run "tx by pledge" "select pledge_id, count(*), sum(amount) from financial_transactions where transaction_type='INCOME' and pledge_id is not null group by 1;"
run "pledge fulfilled vs tx" "select p.id, p.donor_name, p.total_pledge, p.fulfilled_amount, coalesce(sum(t.amount) filter (where t.transaction_type='INCOME'),0) tx_income from pledges p left join financial_transactions t on t.pledge_id=p.id group by 1,2,3,4 order by 1;"
run "project current_funds vs tx" "select bp.id, bp.current_funds, coalesce(sum(case when t.transaction_type='INCOME' then t.amount else -t.amount end) filter (where t.scope='YAYASAN_PUSAT'),0) computed from building_projects bp left join financial_transactions t on t.account_id='4-2010' group by 1,2;"
run "coa" "select id, account_name, account_type from chart_of_accounts where id in ('4-2010','4-1010','5-2010');"
