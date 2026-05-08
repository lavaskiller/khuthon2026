import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Genre, User, UserRole } from '@/types';
import styles from './AuthPages.module.css';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';
const API_PREFIX = (import.meta.env.VITE_API_PREFIX as string | undefined) ?? '/api/v1';

const GENRE_OPTIONS: { value: Genre; label: string }[] = [
  { value: 'action', label: '액션' }, { value: 'drama', label: '드라마' },
  { value: 'comedy', label: '코미디' }, { value: 'romance', label: '로맨스' },
  { value: 'thriller', label: '스릴러' }, { value: 'horror', label: '호러' },
  { value: 'sf', label: 'SF' }, { value: 'fantasy', label: '판타지' },
  { value: 'mystery', label: '미스터리' }, { value: 'documentary', label: '다큐' },
  { value: 'animation', label: '애니' }, { value: 'family', label: '가족' },
  { value: 'music', label: '음악' },
];

const YEAR_OPTIONS = Array.from({ length: 80 }, (_, i) => String(new Date().getFullYear() - 14 - i));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export default function RegisterPage() {
  const { loginDirect } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [gender, setGender] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function toggleGenre(g: Genre) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) { setError('닉네임을 입력해 주세요'); return; }
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다'); return; }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다'); return; }
    if (!birthYear || !birthMonth || !birthDay) { setError('생년월일을 선택해 주세요'); return; }
    if (!gender) { setError('성별을 선택해 주세요'); return; }
    if (genres.length === 0) { setError('장르를 최소 1개 선택해 주세요'); return; }
    if (!agreed) { setError('약관에 동의해야 가입할 수 있습니다'); return; }

    setIsLoading(true);
    try {
      const birth_date = `${birthYear}-${birthMonth}-${birthDay}`;

      // 실제 백엔드 회원가입 시도
      const regResp = await fetch(`${BASE_URL}${API_PREFIX}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: nickname.trim(), password, birth_date, gender, genres }),
      });
      if (!regResp.ok) {
        const msg = await regResp.text();
        throw new Error(msg || '가입 중 오류가 발생했습니다');
      }

      // register는 token을 반환하지 않으므로 별도 login
      const loginResp = await fetch(`${BASE_URL}${API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!loginResp.ok) throw new Error('로그인 중 오류가 발생했습니다');
      const { access_token } = await loginResp.json() as { access_token: string };

      const meResp = await fetch(`${BASE_URL}${API_PREFIX}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const rawUser = await meResp.json() as Record<string, unknown>;
      const user: User = {
        id: String(rawUser.id),
        email: rawUser.email as string,
        nickname: rawUser.name as string,
        role, // UI 선택 role 반영 (백엔드 미지원이므로 프론트에서 설정)
        onboardingCompleted: false,
      };
      loginDirect(user, access_token);
      navigate(role === 'consumer' ? '/consumer/onboarding' : '/creator/dashboard', { replace: true });
    } catch (err) {
      // 백엔드 미연결 시 mock 폴백
      if (err instanceof Error && err.message.includes('fetch')) {
        const { user, token } = await api.auth.register(email, password, role, nickname.trim());
        loginDirect(user, token);
        navigate(role === 'consumer' ? '/consumer/onboarding' : '/creator/dashboard', { replace: true });
      } else {
        setError(err instanceof Error ? err.message : '가입 중 오류가 발생했습니다');
      }
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

      <div className={styles.label}>
        생년월일
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <select className={styles.input} style={{ flex: 2 }} value={birthYear} onChange={e => setBirthYear(e.target.value)} required>
            <option value="">년도</option>
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className={styles.input} style={{ flex: 1 }} value={birthMonth} onChange={e => setBirthMonth(e.target.value)} required>
            <option value="">월</option>
            {MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className={styles.input} style={{ flex: 1 }} value={birthDay} onChange={e => setBirthDay(e.target.value)} required>
            <option value="">일</option>
            {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>성별</legend>
        {[{ value: 'male', label: '남성' }, { value: 'female', label: '여성' }, { value: 'prefer_not_to_say', label: '밝히지 않음' }].map(g => (
          <label key={g.value} className={styles.radio}>
            <input type="radio" value={g.value} checked={gender === g.value} onChange={() => setGender(g.value)} />
            {g.label}
          </label>
        ))}
      </fieldset>

      <div className={styles.label}>
        선호 장르 <span style={{ fontWeight: 400, fontSize: '0.85em' }}>(최소 1개)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {GENRE_OPTIONS.map(g => (
            <button
              key={g.value}
              type="button"
              onClick={() => toggleGenre(g.value)}
              style={{
                padding: '4px 10px', borderRadius: 16, fontSize: '0.85em',
                border: '1.5px solid var(--border)',
                background: genres.includes(g.value) ? 'var(--ink)' : 'transparent',
                color: genres.includes(g.value) ? 'var(--canvas)' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

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
