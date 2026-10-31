import { Bell } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import type { UserRole } from '../state/auth';
import { ROLE_LABELS } from '../state/auth';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

const Topbar: React.FC<TopbarProps> = ({ title, subtitle }) => {
  const { user, setRole } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        {/* Demo role switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginRight: 4 }}>Demo Role:</span>
          <select
            className="form-select"
            style={{ fontSize: 12, padding: '5px 10px', width: 'auto', minWidth: 180 }}
            value={user.role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            id="demo-role-switcher"
          >
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-ghost btn-icon" id="notification-btn" title="Notifikasi" aria-label="Notifikasi">
          <Bell size={17} />
        </button>

        <div className="sidebar-user-avatar" style={{ cursor: 'default' }}>{user.initials}</div>
      </div>
    </header>
  );
};

export default Topbar;
