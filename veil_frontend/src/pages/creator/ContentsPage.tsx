import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content } from '@/types';
import styles from './CreatorPages.module.css';

const STATUS_LABEL = { pending: '심사 대기', approved: '승인됨', rejected: '반려됨' };
const TYPE_LABEL: Record<string, string> = { movie: '영화', drama: '드라마', shortform: '숏폼', book: '책', performance: '공연' };

export default function ContentsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    if (!token) return;
    api.creator.getContents(token).then(setContents).catch(() => {});
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeaderRow}>
        <h1 className={styles.pageTitle}>업로드 컨텐츠</h1>
        <button className={styles.uploadBtn} onClick={() => navigate('/creator/upload')}>+ 업로드</button>
      </div>

      {contents.length === 0 ? (
        <div className={styles.emptyState}>업로드한 컨텐츠가 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>제목</th><th>종류</th><th>상태</th><th>업로드일</th><th>반려 사유</th><th></th></tr>
            </thead>
            <tbody>
              {contents.map(c => (
                <tr key={c.id}>
                  <td>{c.title ?? '—'}</td>
                  <td>{TYPE_LABEL[c.contentType] ?? c.contentType}</td>
                  <td><span className={`${styles.status} ${styles[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                  <td className={styles.dateCell}>{new Date(c.uploadedAt).toLocaleDateString('ko')}</td>
                  <td className={styles.rejectionCell}>{c.rejectionReason ?? ''}</td>
                  <td>
                    {c.status === 'approved' && (
                      <button className={styles.actionBtn} onClick={() => navigate(`/creator/consumers/${c.id}`)}>통계 보기</button>
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
