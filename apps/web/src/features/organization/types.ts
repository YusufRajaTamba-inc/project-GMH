export interface LookupMember {
  id: string;
  member_number: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  membership_type?: string;
  faculty?: string;
  graduation_year?: number;
}

export interface CommitteeRecord {
  id: string;
  member_id: string;
  committee_name: string;
  role_title: string;
  event_year?: number;
  period?: string;
  start_date?: string;
  end_date?: string;
  status: 'AKTIF' | 'SELESAI' | 'DEMISIONER';
  description?: string;
  created_at: string;
  member_name: string;
  member_number: string;
  phone_number?: string;
  email?: string;
  faculty?: string;
  graduation_year?: number;
}

export interface OrgPosition {
  id: string;
  position_code: string;
  title: string;
  category: string;
  function_description?: string;
  hierarchy_order: number;
  is_active: boolean;
  current_tenure_id?: string;
  current_period?: string;
  current_start_date?: string;
  current_notes?: string;
  current_member_id?: string;
  current_member_name?: string;
  current_member_number?: string;
  current_member_phone?: string;
  current_member_email?: string;
  current_member_faculty?: string;
  current_member_graduation_year?: number;
  total_tenures_count: number;
}

export interface OrgTenure {
  id: string;
  position_id: string;
  member_id: string;
  period: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  decree_number?: string;
  notes?: string;
  created_at: string;
  member_name: string;
  member_number: string;
  phone_number?: string;
  email?: string;
  faculty?: string;
  graduation_year?: number;
  position_title: string;
  position_category: string;
}

export interface StaffMember {
  id: string;
  member_id: string;
  department_id?: string;
  position_title: string;
  employment_type: string;
  joined_date?: string;
  end_date?: string;
  is_active: boolean;
  status: string;
  job_description?: string;
  created_at: string;
  member_name: string;
  member_number: string;
  phone_number?: string;
  email?: string;
  faculty?: string;
  graduation_year?: number;
  department_name?: string;
}

export interface Division {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  head_member_id?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  head_name?: string;
  head_member_number?: string;
  head_phone?: string;
  head_email?: string;
  active_members_count: number;
  total_history_count: number;
}

export interface DivisionMember {
  id: string;
  department_id: string;
  member_id: string;
  role_title: string;
  period: string;
  start_date?: string;
  end_date?: string;
  status: 'AKTIF' | 'DEMISIONER' | 'ALUMNI_DIVISI';
  notes?: string;
  created_at: string;
  member_name: string;
  member_number: string;
  phone_number?: string;
  email?: string;
  faculty?: string;
  graduation_year?: number;
}

export interface CommitteeFormState {
  member_id: string;
  committee_name: string;
  role_title: string;
  event_year: number;
  period: string;
  start_date: string;
  end_date: string;
  status: 'AKTIF' | 'SELESAI';
  description: string;
}

export interface PositionFormState {
  position_code: string;
  title: string;
  category: string;
  function_description: string;
  hierarchy_order: number;
}

export interface TenureFormState {
  member_id: string;
  period: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  decree_number: string;
  notes: string;
}

export interface StaffFormState {
  member_id: string;
  department_id: string;
  position_title: string;
  employment_type: string;
  joined_date: string;
  end_date: string;
  status: string;
  job_description: string;
  is_active: boolean;
}

export interface DivisionFormState {
  id: string;
  name: string;
  description: string;
  head_member_id: string;
  order_index: number;
}

export interface DivisionMemberFormState {
  member_id: string;
  role_title: string;
  period: string;
  start_date: string;
  end_date: string;
  status: 'AKTIF' | 'DEMISIONER';
  notes: string;
}
