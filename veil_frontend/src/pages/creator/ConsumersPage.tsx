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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token || !contentId) return;
    api.creator.getConsumers(token, contentId).then(setConsumers).catch(() => {});
  }, [token, contentId]);

  function toggleSelect(userId: number) {
    const key = String(userId);
    setSelected(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  }

  const allKeys = consumers.map(c => String(c.userId));
  const allSelected = allKeys.length > 0 && allKeys.every(k => selected.has(k));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allKeys));
    }
  }

  return (
    <div className={styles.uploadPageWrap}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← 돌아가기</button>
      <div className={styles.pageHeaderRow}>
        <div>
          <h1 className={styles.pageTitle}>관심 소비자</h1>
          <p className={styles.pageDesc} style={{ marginTop: 6 }}>소비자의 실명·연락처는 공개되지 않습니다. 외부 안내를 보내려면 선택 후 발송하세요.</p>
        </div>
        {consumers.length > 0 && (
          <button className={styles.actionBtn} onClick={toggleAll}>
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
        )}
      </div>

      {consumers.length === 0 ? (
        <div className={styles.emptyState}>아직 관심을 표시한 소비자가 없습니다.</div>
      ) : (
        <div className={styles.consumerList}>
          {consumers.map(c => {
            const key = String(c.userId);
            const isSelected = selected.has(key);
            return (
              <div
                key={c.anonymousId}
                className={`${styles.consumerCard} ${isSelected ? styles.consumerCardSelected : ''}`}
                onClick={() => toggleSelect(c.userId)}
              >
                <div>
                  <div className={styles.consumerInfo}>
                    {c.ageGroup} · {c.gender}{c.region ? ` · ${c.region}` : ''}
                    {c.noticeSent && <span className={styles.noticeSentBadge}>발송 완료</span>}
                  </div>
                  <div className={styles.consumerAnon}>
                    관심 {new Date(c.interestAt).toLocaleDateString('ko')}
                    {c.noticeSent && c.noticeSentAt && ` · 안내 발송 ${new Date(c.noticeSentAt).toLocaleDateString('ko')}`}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(c.userId)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.bulkActionBar}>
        <span className={styles.selectedCount}>
          {selected.size > 0 ? `${selected.size}명 선택됨` : '소비자를 선택하세요'}
        </span>
        <button
          className={styles.uploadBtn}
          disabled={selected.size === 0}
          onClick={() => navigate(`/creator/notice/${contentId}?ids=${[...selected].join(',')}`)}
        >
          일괄 발송 →
        </button>
      </div>
    </div>
  );
}
