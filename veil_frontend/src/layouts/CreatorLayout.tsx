import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import styles from './CreatorLayout.module.css';

const NAV = [
  { to: '/creator/dashboard', label: '대시보드' },
  { to: '/creator/contents', label: '업로드 컨텐츠' },
  { to: '/creator/notifications', label: '알림' },
  { to: '/creator/settings', label: '설정' },
];

export default function CreatorLayout() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>VEIL</div>
        <div className={styles.role}>창작자</div>
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
