import { useState, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import styles from './CreatorPages.module.css';

export default function NoticePage() {
  const { contentId } = useParams<{ contentId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const targetIds = params.get('ids')?.split(',') ?? [];

  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !contentId) return;
    setIsLoading(true);
    try {
      await api.creator.sendNotice(token, contentId, { targetUserIds: targetIds, url, message, linkLabel: linkLabel || undefined });
      setDone(true);
    } catch {
      setError('발송 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <div className={styles.uploadPageWrap}>
        <h1 className={styles.pageTitle}>발송 완료</h1>
        <p className={styles.pageDesc}>{targetIds.length}명에게 외부 안내를 발송했습니다.</p>
        <button className={styles.uploadBtn} onClick={() => navigate('/creator/dashboard')}>대시보드로 이동</button>
      </div>
    );
  }

  return (
    <div className={styles.uploadPageWrap}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← 돌아가기</button>
      <h1 className={styles.pageTitle}>외부 안내 발송</h1>
      <p className={styles.pageDesc}>선택한 소비자 {targetIds.length}명에게 동일한 링크와 메시지를 발송합니다.</p>

      <form className={styles.uploadForm} onSubmit={handleSubmit}>
        {error && <p className={styles.errorMsg}>{error}</p>}

        <div>
          <p className={styles.inputLabel}>외부 링크 *</p>
          <input className={styles.input} type="url" placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} required />
        </div>

        <div>
          <p className={styles.inputLabel}>링크 라벨 (선택, 최대 30자)</p>
          <input className={styles.input} maxLength={30} placeholder="예매하기" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} />
        </div>

        <div>
          <p className={styles.inputLabel}>안내 메시지 * (최대 300자)</p>
          <textarea className={styles.textarea} maxLength={300} value={message} onChange={e => setMessage(e.target.value)} required />
        </div>

        <button className={styles.submitBtn} type="submit" disabled={isLoading}>
          {isLoading ? '발송 중...' : `${targetIds.length}명에게 발송`}
        </button>
      </form>
    </div>
  );
}
