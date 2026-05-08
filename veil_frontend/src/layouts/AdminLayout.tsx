import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import styles from './AdminLayout.module.css';

const NAV = [
  { to: '/admin/review', label: '심사' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>VEIL</div>
        <div className={styles.role}>관리자</div>
        <nav className={styles.nav}>
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.footer}>
          <span className={styles.email}>{user?.email}</span>
          <button className={styles.logout} onClick={logout}>로그아웃</button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
