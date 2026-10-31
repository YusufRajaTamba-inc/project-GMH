import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  FileText,
  Package,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../state/AuthContext';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan kata sandi wajib diisi.');
      return;
    }

    const res = await login(username.trim(), password.trim());
    if (!res.success) {
      setErrorMsg(res.message || 'Username atau password tidak cocok.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
        color: '#f8fafc',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          padding: '36px 32px',
          color: '#1e293b',
        }}
      >
        {/* Header Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 10px rgba(4,120,87,0.3)',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              GMH PA KMK
            </h2>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>
              Yayasan Global Mission House
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: '0 0 6px 0', fontSize: 22, fontWeight: 750, color: '#0f172a' }}>
            Masuk ke Sistem
          </h1>
          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
            Silakan masukkan username atau email beserta kata sandi akun resmi yayasan Anda.
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 18,
              lineHeight: 1.45,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 650, color: '#334155', marginBottom: 6 }}>
              Username atau Email
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau email"
                className="form-input"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 650, color: '#334155', margin: 0 }}>
                Kata Sandi (Password)
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#047857',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="form-input"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
              boxShadow: '0 4px 12px rgba(4,120,87,0.3)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={15} className="spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer: Portal Layanan Publik */}
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>
            Layanan Publik (Tanpa Login):
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{
                fontSize: 12,
                color: '#047857',
                textDecoration: 'none',
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <FileText size={13} />
              <span>Pendaftaran Alumni</span>
            </Link>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <Link
              to="/pinjam-aset"
              style={{
                fontSize: 12,
                color: '#047857',
                textDecoration: 'none',
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Package size={13} />
              <span>Pinjam / Sewa Fasilitas</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
