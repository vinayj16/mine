import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { FiMenu, FiLogOut, FiBell, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, logout, getRoleDisplayName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'fixed',
      top: 0,
      right: 0,
      left: 'var(--sidebar-width)',
      zIndex: 50,
    }}>
      {/* Left: menu toggle (mobile) + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onMenuToggle}
          className="mobile-only"
          style={{
            background: 'none',
            fontSize: '1.25rem',
            color: 'var(--text)',
            display: 'none',
          }}
        >
          <FiMenu />
        </button>
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          {getRoleDisplayName()} Dashboard
        </span>
      </div>

      {/* Right: notifications + user + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button style={{ background: 'none', fontSize: '1.1rem', color: 'var(--text-muted)', position: 'relative' }}>
          <FiBell />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--primary-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
          }}>
            {user?.name?.[0]?.toUpperCase() || <FiUser />}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
            {user?.name || user?.email || 'User'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'none',
            fontSize: '1.1rem',
            color: 'var(--danger)',
          }}
        >
          <FiLogOut />
        </button>
      </div>

      {/* Mobile menu button visibility */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-only { display: block !important; }
          header { left: 0 !important; }
        }
      `}</style>
    </header>
  );
}
