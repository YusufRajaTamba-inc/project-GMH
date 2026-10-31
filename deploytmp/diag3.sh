#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"
run() { echo ""; echo "===== $1 ====="; $PSQL -c "$2" 2>&1 | head -45; }

run "pledges vs members" "select p.id, p.donor_name, p.member_id, m.full_name as member, p.total_pledge, p.fulfilled_amount, p.building_project_id, bp.project_name, p.status from pledges p left join members m on m.id=p.member_id left join building_projects bp on bp.id=p.building_project_id order by p.created_at;"

run "financial_transactions vs members" "select t.transaction_code, t.transaction_date, t.transaction_type, t.amount, t.donor_member_id, m.full_name as member, t.pledge_id, t.account_id, t.scope, t.payment_method from financial_transactions t left join members m on m.id=t.donor_member_id order by t.transaction_date, t.transaction_code;"

run "projects" "select id, project_name, target_budget, current_funds, progress_percentage, status from building_projects;"

run "committee_records link" "select count(*) total, count(member_id) with_member from committee_records;"
run "committee sample" "select cr.id, cr.committee_name, cr.role_title, cr.member_id, m.full_name as member, cr.event_year, cr.status from committee_records cr left join members m on m.id=cr.member_id limit 8;"

run "org_position_tenures link" "select count(*) total, count(member_id) with_member from org_position_tenures;"
run "staff_members link" "select s.id, s.member_id, m.full_name as member, s.position_title, s.base_salary, s.department_id from staff_members s left join members m on m.id=s.member_id;"

run "alumni_profiles link" "select count(*) total, count(member_id) with_member from alumni_profiles;"

run "mission_activities cash" "select id, title, budget_estimate, cash_balance, status from mission_activities;"
run "foundation_programs cash" "select id, program_title, budget_estimate, cash_balance, status from foundation_programs;"

run "users vs members" "select u.username, u.full_name, u.role_id, m.member_number, m.full_name as member_name from users u left join members m on m.full_name = u.full_name;"

run "orphan counts" "select (select count(*) from pledges where member_id is null) pledges_no_member, (select count(*) from financial_transactions where donor_member_id is null) trx_no_donor, (select count(*) from committee_records where member_id is null) committee_no_member, (select count(*) from staff_members where member_id is null) staff_no_member, (select count(*) from org_position_tenures where member_id is null) tenure_no_member, (select count(*) from alumni_profiles where member_id is null) alumni_no_member;"

run "dashboard aggregates" "select (select coalesce(sum(current_funds),0) from building_projects) proj_funds, (select coalesce(sum(total_pledge),0) from pledges) pledge_total, (select coalesce(sum(fulfilled_amount),0) from pledges) pledge_fulfilled, (select coalesce(sum(amount),0) from financial_transactions) trx_total, (select coalesce(sum(base_salary),0) from staff_members) salary_base, (select count(*) from members) members, (select count(*) from members where full_name like 'Test%') test_members;"
