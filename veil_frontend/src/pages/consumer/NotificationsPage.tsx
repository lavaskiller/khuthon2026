import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Notification } from '@/types';
import styles from './ConsumerPages.module.css';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const TYPE_LABEL: Record<Notification['type'], string> = {
  info_reveal: '정보가 열람되었습니다',
  external_notice: '관심 누른 작품의 새 안내가 도착했습니다',
  review_result: '심사 결과가 도착했습니다',
};

export default function ConsumerNotificationsPage() {
  const { token } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    api.consumer.getNotifications(token).then(setNotifs).catch(() => {});
  }, [token]);

  async function markAll() {
    if (!token) return;
    await api.consumer.markAllNotificationsRead(token).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  if (notifs.length === 0) {
    return (
      <div className={styles.notifPage}>
        <h2 className={styles.pageHeading}>알림</h2>
        <p className={styles.emptyState}>새로운 알림이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.notifPage}>
      <div className={styles.notifHeader}>
        <h2 className={styles.pageHeading}>알림</h2>
        <button className={styles.markAllBtn} onClick={markAll}>모두 읽음</button>
      </div>
      <div className={styles.notifList}>
        {notifs.map(n => (
          <div key={n.id} className={`${styles.notifItem} ${!n.isRead ? styles.unread : ''}`}>
            {!n.isRead && <div className={styles.notifDot} />}
            <span className={styles.notifMsg}>{TYPE_LABEL[n.type]}</span>
            <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
