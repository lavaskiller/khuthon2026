import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content } from '@/types';
import styles from './CreatorPages.module.css';

const STATUS_LABEL = { pending: '심사 대기', approved: '승인됨', rejected: '반려됨' };
const TYPE_LABEL: Record<string, string> = { movie: '영화', drama: '드라마', shortform: '숏폼', book: '책', performance: '공연' };

export default function DashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    if (!token) return;
    api.creator.getContents(token).then(setContents).catch(() => {});
  }, [token]);

  const total = contents.length;
  const approved = contents.filter(c => c.status === 'approved').length;
  const pending = contents.filter(c => c.status === 'pending').length;
  const rejected = contents.filter(c => c.status === 'rejected').length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeaderRow}>
        <h1 className={styles.pageTitle}>대시보드</h1>
        <button className={styles.uploadBtn} onClick={() => navigate('/creator/upload')}>+ 새 컨텐츠 업로드</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}><span className={styles.statLabel}>총 업로드</span><span className={styles.statValue}>{total}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>승인</span><span className={styles.statValue}>{approved}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>대기</span><span className={styles.statValue}>{pending}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>반려</span><span className={styles.statValue}>{rejected}</span></div>
      </div>

      {contents.length === 0 ? (
        <div className={styles.emptyState}>업로드한 컨텐츠가 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>제목</th>
                <th>종류</th>
                <th>상태</th>
                <th>노출</th>
                <th>관심</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contents.map(c => (
                <tr key={c.id}>
                  <td>{c.title ?? '—'}</td>
                  <td>{TYPE_LABEL[c.contentType] ?? c.contentType}</td>
                  <td><span className={`${styles.status} ${styles[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                  <td>{c.exposureCount}</td>
                  <td>{c.interestCount}</td>
                  <td>
                    {c.status === 'approved' && (
                      <button className={styles.actionBtn} onClick={() => navigate(`/creator/consumers/${c.id}`)}>
                        관심 소비자 보기
                      </button>
                    )}
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
