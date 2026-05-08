import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content } from '@/types';
import styles from './ConsumerPages.module.css';

const GENRE_LABEL: Record<string, string> = {
  action:'액션', drama:'드라마', comedy:'코미디', romance:'로맨스', thriller:'스릴러',
  horror:'호러', sf:'SF', fantasy:'판타지', mystery:'미스터리', documentary:'다큐',
  animation:'애니', family:'가족', music:'음악',
};
const TYPE_LABEL: Record<string, string> = {
  movie:'영화', drama:'드라마', shortform:'숏폼', book:'책', performance:'공연',
};

export default function InterestsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    if (!token) return;
    api.consumer.getInterests(token).then(setContents).catch(() => {});
  }, [token]);

  async function handleRemove(e: React.MouseEvent, contentId: string) {
    e.stopPropagation();
    if (!token) return;
    await api.consumer.removeInterest(token, contentId).catch(() => {});
    setContents(prev => prev.filter(c => c.id !== contentId));
  }

  if (contents.length === 0) {
    return (
      <div className={styles.listPage}>
        <h2 className={styles.pageHeading}>내 관심</h2>
        <p className={styles.emptyState}>
          아직 관심 누른 작품이 없습니다.<br />탐색 화면에서 작품을 발견해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.listPage}>
      <h2 className={styles.pageHeading}>내 관심</h2>
      <div className={styles.cardList}>
        {contents.map(c => (
          <div key={c.id} className={styles.card} onClick={() => navigate(`/consumer/content/${c.id}`)}>
            <div>
              <div className={styles.cardTitle}>{c.title}</div>
              <div className={styles.cardMeta}>
                {TYPE_LABEL[c.contentType] ?? c.contentType}
                {c.genres && c.genres.length > 0 && ` · ${c.genres.map(g => GENRE_LABEL[g] ?? g).join(', ')}`}
              </div>
            </div>
            <button
              className={styles.removeBtn}
              onClick={(e) => handleRemove(e, c.id)}
              aria-label="관심 취소"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
