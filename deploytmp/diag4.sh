#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"
run() { echo ""; echo "===== $1 ====="; $PSQL -c "$2" 2>&1 | head -40; }
run "pledges" "select p.donor_name, p.member_id, m.full_name as member, p.total_pledge, p.fulfilled_amount, p.building_project_id, bp.project_name, p.status from pledges p left join members m on m.id=p.member_id left join building_projects bp on bp.id=p.building_project_id order by p.created_at;"
run "transactions" "select t.transaction_code, t.transaction_date, t.transaction_type, t.amount, t.donor_member_id, m.full_name as member, t.pledge_id, t.scope, t.payment_method from financial_transactions t left join members m on m.id=t.donor_member_id order by t.transaction_date, t.transaction_code;"
run "coa" "select id, account_name, account_type, scope from chart_of_accounts;"
run "trx scope breakdown" "select scope, count(*), sum(amount) from financial_transactions group by scope;"
run "trx type breakdown" "select transaction_type, count(*), sum(amount) from financial_transactions group by transaction_type;"
run "members all" "select id, member_number, full_name, member_type, status, is_active, membership_type, email, phone_number from members order by member_number;"
