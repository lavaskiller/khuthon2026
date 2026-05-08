import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { AnonymizedConsumer } from '@/types';
import styles from './CreatorPages.module.css';

export default function ConsumersPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [consumers, setConsumers] = useState<AnonymizedConsumer[]>([]);
  // selected: Set<string> — userId(int)를 string으로 저장. NoticePage가 user_ids: int[]로 변환.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token || !contentId) return;
    api.creator.getConsumers(token, contentId).then(setConsumers).catch(() => {});
  }, [token, contentId]);

  // key = String(userId) — 백엔드 invite/send에 필요한 user_id 사용
  function toggleSelect(userId: number) {
    const key = String(userId);
    setSelected(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  }

  return (
    <div className={styles.uploadPageWrap}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← 돌아가기</button>
      <h1 className={styles.pageTitle}>관심 소비자</h1>
      <p className={styles.pageDesc}>소비자의 실명·연락처는 공개되지 않습니다. 외부 안내를 보내려면 선택 후 발송하세요.</p>

      {consumers.length === 0 ? (
        <div className={styles.emptyState}>아직 관심을 표시한 소비자가 없습니다.</div>
      ) : (
        <div className={styles.consumerList}>
          {consumers.map(c => (
            <div key={c.anonymousId} className={styles.consumerCard} onClick={() => toggleSelect(c.userId)}>
              <div>
                <div className={styles.consumerInfo}>{c.ageGroup} · {c.gender}{c.region ? ` · ${c.region}` : ''}</div>
                <div className={styles.consumerAnon}>관심 {new Date(c.interestAt).toLocaleDateString('ko')}</div>
              </div>
              <input type="checkbox" checked={selected.has(String(c.userId))} onChange={() => toggleSelect(c.userId)} onClick={e => e.stopPropagation()} />
            </div>
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <button
          className={styles.uploadBtn}
          onClick={() => navigate(`/creator/notice/${contentId}?ids=${[...selected].join(',')}`)}
        >
          {selected.size}명에게 외부 안내 발송
        </button>
      )}
    </div>
  );
}
