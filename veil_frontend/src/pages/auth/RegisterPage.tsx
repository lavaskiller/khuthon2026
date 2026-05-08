import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { User, UserRole } from '@/types';
import styles from './AuthPages.module.css';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://192.168.2.20:8000';
const API_PREFIX = (import.meta.env.VITE_API_PREFIX as string | undefined) ?? '/api/v1';

export default function RegisterPage() {
  const { loginDirect } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) { setError('닉네임을 입력해 주세요'); return; }
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다'); return; }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다'); return; }
    if (!agreed) { setError('약관에 동의해야 가입할 수 있습니다'); return; }

    setIsLoading(true);
    try {
      // 백엔드 register: birth_date/gender/genres는 온보딩에서 PATCH로 업데이트
      const regResp = await fetch(`${BASE_URL}${API_PREFIX}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: nickname.trim(),
          password,
          birth_date: '2000-01-01',
          gender: 'OTHER',
          genres: ['ACTION'],
        }),
      });
      if (!regResp.ok) {
        const msg = await regResp.text();
        throw new Error(msg || '가입 중 오류가 발생했습니다');
      }

      const { access_token } = await api.auth.login(email, password);
      const rawUser = await api.auth.getMe(access_token);
      const user: User = { ...rawUser, role };
      loginDirect(user, access_token);
      navigate(role === 'consumer' ? '/consumer/onboarding' : '/creator/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '가입 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>회원가입</h1>

      {error && <p className={styles.error}>{error}</p>}

      <label className={styles.label}>
        이메일
        <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
      </label>

      <label className={styles.label}>
        닉네임
        <input className={styles.input} type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="베일에서 사용할 이름" maxLength={20} required autoComplete="nickname" />
      </label>

      <label className={styles.label}>
        비밀번호
        <input className={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>

      <label className={styles.label}>
        비밀번호 확인
        <input className={styles.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </label>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>권한 선택</legend>
        <label className={styles.radio}>
          <input type="radio" value="consumer" checked={role === 'consumer'} onChange={() => setRole('consumer')} />
          소비자
        </label>
        <label className={styles.radio}>
          <input type="radio" value="creator" checked={role === 'creator'} onChange={() => setRole('creator')} />
          창작자
        </label>
      </fieldset>

      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        서비스 이용약관 및 개인정보 처리방침에 동의합니다
      </label>

      <button className={styles.button} type="submit" disabled={isLoading}>
        {isLoading ? '가입 중...' : '가입하기'}
      </button>

      <div className={styles.links}>
        <Link to="/login">이미 계정이 있으신가요?</Link>
      </div>
    </form>
  );
}
