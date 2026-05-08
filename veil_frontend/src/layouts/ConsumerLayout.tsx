import { NavLink, Outlet } from 'react-router-dom';
import styles from './ConsumerLayout.module.css';

const NAV = [
  { to: '/consumer/home', label: '홈' },
  { to: '/consumer/feed', label: '탐색' },
  { to: '/consumer/interests', label: '관심' },
  { to: '/consumer/notifications', label: '알림' },
  { to: '/consumer/settings', label: '설정' },
];

/** Mobile-first shell (max-width 430px, bottom nav) */
export default function ConsumerLayout() {
  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <Outlet />
      </main>
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
    </div>
  );
}
