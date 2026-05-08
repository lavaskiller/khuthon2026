import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Notification } from '@/types';
import styles from './CreatorPages.module.css';

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const TYPE_LABEL: Record<Notification['type'], string> = {
  info_reveal: '작품에 새로운 관심이 도착했습니다',
  external_notice: '외부 안내 발송 완료',
  review_result: '심사 결과',
};

export default function CreatorNotificationsPage() {
  const { token } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    api.creator.getNotifications(token).then(setNotifs).catch(() => {});
  }, [token]);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>알림</h1>
      {notifs.length === 0 && <p className={styles.pageDesc}>새로운 알림이 없습니다.</p>}
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
