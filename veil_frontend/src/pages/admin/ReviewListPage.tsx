import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content } from '@/types';
import styles from './AdminPages.module.css';

export default function ReviewListPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Content[]>([]);
  const [history, setHistory] = useState<Content[]>([]);
  const [tab, setTab] = useState<'pending' | 'done'>('pending');

  useEffect(() => {
    if (!token) return;
    api.admin.getPendingContents(token).then(setPending).catch(() => {});
    api.admin.getReviewHistory(token).then(setHistory).catch(() => {});
  }, [token]);

  const contents = tab === 'pending' ? pending : history;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>심사 관리</h1>
        {pending.length > 0 && <span className={styles.badge}>{pending.length}건 대기 중</span>}
      </div>

      <div className={styles.tabRow}>
        <button className={`${styles.tab} ${tab === 'pending' ? styles.tabActive : ''}`} onClick={() => setTab('pending')}>
          미심사 {pending.length > 0 && `(${pending.length})`}
        </button>
        <button className={`${styles.tab} ${tab === 'done' ? styles.tabActive : ''}`} onClick={() => setTab('done')}>
          심사 완료 {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      <p className={styles.pageDesc}>
        {tab === 'pending'
          ? contents.length === 0 ? '심사 대기 중인 컨텐츠가 없습니다.' : '오래된 업로드부터 순서대로 심사하세요.'
          : contents.length === 0 ? '심사 완료된 컨텐츠가 없습니다.' : '승인 또는 반려 처리된 컨텐츠입니다.'}
      </p>

      {contents.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                {tab === 'pending' ? <th>창작자</th> : <th>제목</th>}
                <th>종류</th>
                {tab === 'pending' ? <th>티저 길이</th> : <th>상태</th>}
                <th>{tab === 'pending' ? '업로드 일시' : '심사 일시'}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contents.map((c, i) => (
                <tr key={c.id} onClick={() => navigate(`/admin/review/${c.id}`)}>
                  <td className={styles.seqNum}>{String(i + 1).padStart(3, '0')}</td>
                  {tab === 'pending'
                    ? <td>{c.creatorId.slice(0, 8)}***</td>
                    : <td>{c.title ?? '—'}</td>}
                  <td>{c.contentType}</td>
                  {tab === 'pending'
                    ? <td>{c.teaserDuration}초</td>
                    : <td><span className={`${styles.statusBadge} ${styles[c.status]}`}>{c.status === 'approved' ? '승인' : '반려'}</span></td>}
                  <td className={styles.dateCell}>
                    {new Date(tab === 'pending' ? c.uploadedAt : (c.approvedAt ?? c.uploadedAt)).toLocaleString('ko')}
                  </td>
                  <td>
                    <button className={styles.enterBtn} onClick={e => { e.stopPropagation(); navigate(`/admin/review/${c.id}`); }}>
                      {tab === 'pending' ? '심사 진입' : '상세 보기'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
