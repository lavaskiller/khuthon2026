import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export default function AuthLayout() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>VEIL</span>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
