import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content } from '@/types';
import styles from './AdminPages.module.css';

const CHECKLIST = [
  { id: 'length', label: '티저 길이가 콘텐츠 종류별 규정을 충족하는가?', auto: true },
  { id: 'watermark', label: '티저 영상에 워터마크/로고/창작자 식별 요소가 없는가?' },
  { id: 'content', label: '부적절한 컨텐츠(폭력·선정성·혐오 등)가 심의에 맞는가?' },
  { id: 'info', label: '비공개 정보(제목·시놉시스·장르)가 작품과 일치하는가?' },
];

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState<Content | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set(['length']));
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    api.admin.getContent(token, id).then(setContent).catch(() => {});
  }, [token, id]);

  function toggleCheck(checkId: string) {
    setChecked(prev => { const s = new Set(prev); s.has(checkId) ? s.delete(checkId) : s.add(checkId); return s; });
  }

  async function handleApprove() {
    if (!token || !id) return;
    setIsLoading(true);
    try {
      await api.admin.approve(token, id);
      navigate('/admin/review', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject() {
    if (!token || !id) return;
    const unchecked = CHECKLIST.filter(c => !c.auto && !checked.has(c.id)).map(c => c.label);
    const fullReason = [reason, ...unchecked].filter(Boolean).join('\n');
    if (!fullReason.trim()) { alert('반려 사유를 입력하거나 체크리스트 항목을 해제해 주세요'); return; }
    setIsLoading(true);
    try {
      await api.admin.reject(token, id, fullReason);
      navigate('/admin/review', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }

  if (!content) return <div className={styles.page}><p className={styles.pageDesc}>불러오는 중...</p></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← 미심사 리스트</button>
        <span className={styles.reviewId}>심사 #{content.id.slice(0, 6)}</span>
      </div>

      <div className={styles.reviewLayout}>
        {/* Video */}
        <div className={styles.videoWrap}>
          <video className={styles.video} src={content.teaserUrl} controls />
        </div>

        {/* Right panel */}
        <div className={styles.infoPanel}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>비공개 정보</div>
            {[
              ['제목', content.title],
              ['장르', content.genres?.join(', ')],
              ['감독', content.directors?.join(', ')],
              ['개봉일', content.releaseDate],
              ['연령 등급', content.ageRating],
              ['외부 링크', content.externalLink ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className={styles.field}>
                <span className={styles.fieldLabel}>{label}</span>
                <span className={styles.fieldValue}>{value ?? '—'}</span>
              </div>
            ))}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>시놉시스</span>
              <span className={styles.fieldValue}>{content.synopsis}</span>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>심사 체크리스트</div>
            <div className={styles.checklist}>
              {CHECKLIST.map(item => (
                <label key={item.id} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={checked.has(item.id)}
                    onChange={() => !item.auto && toggleCheck(item.id)}
                    disabled={item.auto}
                  />
                  {item.label}
                  {item.auto && <span className={styles.auto}>자동 통과</span>}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>반려 사유 (반려 시)</div>
            <textarea
              className={styles.reasonInput}
              placeholder="추가 사유 입력..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.rejectBtn} disabled={isLoading} onClick={handleReject}>반려</button>
            <button className={styles.approveBtn} disabled={isLoading} onClick={handleApprove}>승인</button>
          </div>
        </div>
      </div>
    </div>
  );
}
