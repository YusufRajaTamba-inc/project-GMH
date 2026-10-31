#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"
run() { echo ""; echo "===== $1 ====="; $PSQL -c "$2" 2>&1 | head -40; }
run "dup committees" "select committee_name, role_title, count(*) c from committee_records group by 1,2 order by c desc;"
run "dup tenures" "select member_id, position_id, count(*) c from org_position_tenures group by 1,2 order by c desc;"
run "dup projects" "select project_name, target_budget, current_funds, count(*) c from building_projects group by 1,2,3;"
run "dup foundation programs" "select program_title, count(*) c from foundation_programs group by 1;"
run "reconciliation" "select (select coalesce(sum(amount),0) from financial_transactions where transaction_type='INCOME') trx_income, (select coalesce(sum(fulfilled_amount),0) from pledges) pledge_fulfilled, (select coalesce(sum(current_funds),0) from building_projects) proj_funds;"
run "pledge without member" "select id, donor_name, total_pledge, status from pledges where member_id is null;"
run "trx no donor" "select t.transaction_code, t.amount, t.pledge_id, p.donor_name, t.scope from financial_transactions t left join pledges p on p.id=t.pledge_id where t.donor_member_id is null;"
run "audit logs" "select action, count(*) from audit_logs group by 1;"
