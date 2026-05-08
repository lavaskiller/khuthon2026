import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Genre, AgeRating } from '@/types';
import styles from './CreatorPages.module.css';

const GENRES: Genre[] = ['action','drama','comedy','romance','thriller','horror','sf','fantasy','mystery','documentary','animation','family','music'];
const GENRE_LABELS: Record<Genre, string> = { action:'액션',drama:'드라마',comedy:'코미디',romance:'로맨스',thriller:'스릴러',horror:'호러',sf:'SF',fantasy:'판타지',mystery:'미스터리',documentary:'다큐',animation:'애니',family:'가족',music:'음악' };
const AGE_RATINGS: { value: AgeRating; label: string }[] = [{ value:'all',label:'전체관람가' },{ value:'12',label:'12세 이상' },{ value:'15',label:'15세 이상' },{ value:'19',label:'청소년 관람불가' }];

export default function UploadInfoPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const contentId = params.get('contentId') ?? '';

  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [directors, setDirectors] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [ageRating, setAgeRating] = useState<AgeRating>('all');
  const [externalLink, setExternalLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleGenre(g: Genre) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !contentId) return;
    if (genres.length === 0) { setError('장르를 최소 1개 선택해 주세요'); return; }
    setIsLoading(true);
    try {
      await api.creator.saveContentInfo(token, contentId, {
        title, synopsis, genres,
        directors: directors ? directors.split(',').map(d => d.trim()) : undefined,
        releaseDate: releaseDate || undefined,
        ageRating,
        externalLink: externalLink || undefined,
      });
      navigate('/creator/dashboard', { replace: true });
    } catch {
      setError('저장 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.uploadPageWrap}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← 이전 단계</button>
      <h1 className={styles.pageTitle}>비공개 정보 입력</h1>
      <p className={styles.pageDesc}>베일 해제 시점까지 소비자에게 노출되지 않습니다.</p>

      <form className={styles.uploadForm} onSubmit={handleSubmit}>
        {error && <p className={styles.errorMsg}>{error}</p>}

        <div>
          <p className={styles.inputLabel}>제목 *</p>
          <input className={styles.input} maxLength={50} value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div>
          <p className={styles.inputLabel}>시놉시스 *</p>
          <textarea className={styles.textarea} maxLength={500} value={synopsis} onChange={e => setSynopsis(e.target.value)} required />
        </div>

        <div>
          <p className={styles.inputLabel}>장르 *</p>
          <div className={styles.chipGroup}>
            {GENRES.map(g => <button type="button" key={g} className={`${styles.chip} ${genres.includes(g) ? styles.selected : ''}`} onClick={() => toggleGenre(g)}>{GENRE_LABELS[g]}</button>)}
          </div>
        </div>

        <div>
          <p className={styles.inputLabel}>감독/크리에이터 (콤마 구분, 선택)</p>
          <input className={styles.input} placeholder="홍길동, 김영희" value={directors} onChange={e => setDirectors(e.target.value)} />
        </div>

        <div>
          <p className={styles.inputLabel}>개봉일 (선택)</p>
          <input className={styles.input} type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
        </div>

        <div>
          <p className={styles.inputLabel}>연령 등급 *</p>
          <div className={styles.chipGroup}>
            {AGE_RATINGS.map(({ value, label }) => <button type="button" key={value} className={`${styles.chip} ${ageRating === value ? styles.selected : ''}`} onClick={() => setAgeRating(value)}>{label}</button>)}
          </div>
        </div>

        <div>
          <p className={styles.inputLabel}>외부 링크 (선택)</p>
          <input className={styles.input} type="url" placeholder="https://" value={externalLink} onChange={e => setExternalLink(e.target.value)} />
        </div>

        <button className={styles.submitBtn} type="submit" disabled={isLoading}>
          {isLoading ? '제출 중...' : '제출 (심사 요청)'}
        </button>
      </form>
    </div>
  );
}
