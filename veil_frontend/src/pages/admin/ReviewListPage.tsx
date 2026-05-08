import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content } from '@/types';
import styles from './AdminPages.module.css';

export default function ReviewListPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    if (!token) return;
    api.admin.getPendingContents(token).then(setContents).catch(() => {});
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>미심사 컨텐츠</h1>
        {contents.length > 0 && <span className={styles.badge}>{contents.length}건 대기 중</span>}
      </div>
      <p className={styles.pageDesc}>
        {contents.length === 0 ? '심사 대기 중인 컨텐츠가 없습니다.' : '오래된 업로드부터 순서대로 심사하세요.'}
      </p>

      {contents.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>창작자</th><th>종류</th><th>티저 길이</th><th>업로드 일시</th><th></th></tr>
            </thead>
            <tbody>
              {contents.map((c, i) => (
                <tr key={c.id} onClick={() => navigate(`/admin/review/${c.id}`)}>
                  <td className={styles.seqNum}>{String(i + 1).padStart(3, '0')}</td>
                  <td>{c.creatorId.slice(0, 8)}***</td>
                  <td>{c.contentType}</td>
                  <td>{c.teaserDuration}초</td>
                  <td className={styles.dateCell}>{new Date(c.uploadedAt).toLocaleString('ko')}</td>
                  <td><button className={styles.enterBtn} onClick={e => { e.stopPropagation(); navigate(`/admin/review/${c.id}`); }}>심사 진입</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
