#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"

run() {
  echo ""
  echo "===== $1 ====="
  $PSQL -c "$2" 2>&1 | head -40
}

run "member counts" "select count(*) as members from members;"
run "members sample" "select id, member_number, full_name, status from members order by created_at limit 20;"
run "users" "select username, full_name, role_id from users order by created_at limit 20;"
run "transactions" "select count(*) from transactions;"
run "transaction members join" "select t.transaction_code, t.transaction_date, t.amount, t.description, t.member_id, m.full_name from transactions t left join members m on m.id=t.member_id order by t.transaction_date desc limit 20;"
run "pledges" "select count(*) from pledges;"
run "pledge donor link" "select p.id, p.donor_name, p.member_id, m.full_name as member_name, p.total_amount, p.paid_amount from pledges p left join members m on m.id=p.member_id order by p.created_at desc limit 20;"
run "donation payments" "select count(*) from donation_payments;"
run "donation_payment pledge link" "select dp.id, dp.receipt_number, dp.pledge_id, p.donor_name, dp.amount, dp.status from donation_payments dp left join pledges p on p.id=dp.pledge_id order by dp.created_at desc limit 20;"
run "payroll employees" "select count(*) from payroll_employees;"
run "payroll sample" "select * from payroll_employees limit 10;"
run "projects" "select id, project_name, target_amount, collected_amount, member_id from building_projects limit 10;"
run "committees" "select count(*) from committee_records;"
run "mission activities" "select count(*) from mission_activities;"
run "program / offerings" "select count(*) from offerings;" 2>/dev/null || true
