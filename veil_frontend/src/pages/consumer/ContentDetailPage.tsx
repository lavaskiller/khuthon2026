import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content, ExternalNotice } from '@/types';
import styles from './ConsumerPages.module.css';

const CONTENT_TYPE_LABEL: Record<string, string> = {
  movie: '영화', drama: '드라마', shortform: '숏폼', book: '책', performance: '공연',
};

const GENRE_LABEL: Record<string, string> = {
  action:'액션', drama:'드라마', comedy:'코미디', romance:'로맨스', thriller:'스릴러',
  horror:'호러', sf:'SF', fantasy:'판타지', mystery:'미스터리', documentary:'다큐',
  animation:'애니', family:'가족', music:'음악',
};

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState<Content | null>(null);
  const [notice, _setNotice] = useState<ExternalNotice | null>(null);
  const [interested, setInterested] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    api.consumer.getContent(token, id).then(setContent).catch(() => {});
  }, [token, id]);

  if (!content) {
    return <div style={{ padding: 48, color: 'var(--text-muted)', background: 'var(--canvas)', minHeight: '100dvh' }}>불러오는 중...</div>;
  }

  return (
    <div className={styles.detail}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← 뒤로</button>

      <p className={styles.detailEyebrow}>· {CONTENT_TYPE_LABEL[content.contentType] ?? content.contentType}</p>
      <h1 className={styles.detailTitle}>{content.title}</h1>

      <p className={styles.detailMeta}>
        {[content.directors?.join(', '), content.releaseDate?.slice(0, 4), content.ageRating && content.ageRating !== 'all' ? `${content.ageRating}세 이상` : content.ageRating === 'all' ? '전체관람가' : null]
          .filter(Boolean).join(' · ')}
      </p>

      {content.genres && (
        <div className={styles.genreRow}>
          {content.genres.map(g => <span key={g} className={styles.genreChip}>{GENRE_LABEL[g] ?? g}</span>)}
        </div>
      )}

      <div className={styles.detailDivider} />

      <p className={styles.detailSynopsis}>{content.synopsis}</p>

      {notice && (
        <div className={styles.noticeBanner}>
          <p className={styles.noticeMsg}>"{notice.message}"</p>
          <a href={notice.url} target="_blank" rel="noreferrer" className={styles.noticeLink}>
            {notice.linkLabel ?? '자세히 보기'}
          </a>
        </div>
      )}

      <div className={styles.detailActions}>
        {content.externalLink && (
          <a href={content.externalLink} target="_blank" rel="noreferrer" className={styles.noticeLink}
             style={{ background: 'var(--lifted)', color: 'var(--ink)', border: '1.5px solid var(--border)', textAlign: 'center' }}>
            외부 링크 →
          </a>
        )}
        <button className={styles.feedReturnBtn} onClick={() => navigate('/consumer/feed')}>
          탐색 계속하기 →
        </button>
        {interested ? (
          <button
            className={styles.removeInterestBtn}
            onClick={() => {
              if (!token || !id) return;
              api.consumer.removeInterest(token, id).catch(() => {});
              setInterested(false);
            }}
          >
            관심 취소
          </button>
        ) : (
          <p className={styles.removedNote}>관심 목록에서 제거되었습니다</p>
        )}
      </div>

      {interested && (
        <p className={styles.addedNote}>
          관심 목록에 추가되었습니다<br />창작자가 외부 상영·구매 정보를 안내할 수 있습니다
        </p>
      )}
    </div>
  );
}
