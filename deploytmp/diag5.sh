#!/bin/bash
PSQL="sudo docker exec gmh-postgres-1 psql -U gmh -d foundationos -P pager=off"
run() { echo ""; echo "===== $1 ====="; $PSQL -c "$2" 2>&1 | head -40; }
run "departments" "select id, name, parent_id, head_member_id, status, is_active from departments;"
run "staff join departments" "select sm.id, sm.department_id, sm.member_id, d.id as dept_found, d.name from staff_members sm left join departments d on sm.department_id = d.id;"
run "payroll staff endpoint sim" "select count(*) as staff_total, count(d.id) as with_dept from staff_members sm join members m on sm.member_id=m.id left join departments d on sm.department_id=d.id where sm.is_active = true;"
run "missions coordinator" "select id, title, coordinator from mission_activities;"
run "programs rosters" "select * from program_rosters limit 5;"
run "org positions" "select id, position_code, title, category from org_positions;"
run "tenures" "select t.member_id, m.full_name, t.position_id, p.title, t.period, t.is_current from org_position_tenures t left join members m on m.id=t.member_id left join org_positions p on p.id=t.position_id order by t.period;"
