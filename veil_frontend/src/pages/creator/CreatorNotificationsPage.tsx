import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  external_notice: '외부 안내 발송이 완료됐습니다',
  review_result: '심사 결과가 도착했습니다',
};

const TYPE_ARROW: Record<Notification['type'], boolean> = {
  info_reveal: true,
  external_notice: true,
  review_result: true,
};

export default function CreatorNotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    api.creator.getNotifications(token).then(setNotifs).catch(() => {});
  }, [token]);

  async function handleClick(n: Notification) {
    if (!token) return;
    if (!n.isRead) {
      await api.creator.markNotificationRead(token, n.id).catch(() => {});
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }

    if ((n.type === 'info_reveal' || n.type === 'external_notice') && n.relatedContentId) {
      navigate(`/creator/consumers/${n.relatedContentId}`);
    } else if (n.type === 'review_result') {
      navigate('/creator/contents');
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>알림</h1>
      {notifs.length === 0 && <p className={styles.pageDesc}>새로운 알림이 없습니다.</p>}
      <div className={styles.notifList}>
        {notifs.map(n => (
          <div
            key={n.id}
            className={`${styles.notifItem} ${!n.isRead ? styles.unread : ''} ${styles.notifClickable}`}
            onClick={() => handleClick(n)}
          >
            {!n.isRead && <div className={styles.notifDot} />}
            <div className={styles.notifContent}>
              <span className={styles.notifMsg}>{TYPE_LABEL[n.type]}</span>
              <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
            </div>
            {TYPE_ARROW[n.type] && <span className={styles.notifArrow}>›</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
