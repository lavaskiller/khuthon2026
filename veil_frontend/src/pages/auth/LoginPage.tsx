import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import styles from './AuthPages.module.css';

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // RequireGuest handles redirect based on role + onboardingCompleted
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다');
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>VEIL</h1>
      <p className={styles.subtitle}>사전 정보 없이, 작품으로만</p>

      {error && <p className={styles.error}>{error}</p>}

      <label className={styles.label}>
        이메일
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@email.com"
          required
          autoComplete="email"
        />
      </label>

      <label className={styles.label}>
        비밀번호
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </label>

      <button className={styles.button} type="submit" disabled={isLoading}>
        {isLoading ? '로그인 중...' : '로그인'}
      </button>

      <div className={styles.links}>
        <Link to="/register">회원가입</Link>
      </div>
    </form>
  );
}
