import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  info_reveal: '관심 누른 작품의 정보가 공개됐습니다',
  external_notice: '관심 누른 작품의 새 안내가 도착했습니다',
  review_result: '심사 결과가 도착했습니다',
};

const TYPE_ARROW: Record<Notification['type'], boolean> = {
  info_reveal: true,
  external_notice: true,
  review_result: false,
};

export default function ConsumerNotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    api.consumer.getNotifications(token).then(setNotifs).catch(() => {});
  }, [token]);

  async function markRead(n: Notification) {
    if (!token) return;
    if (!n.isRead) {
      await api.consumer.markNotificationRead(token, n.id).catch(() => {});
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }

    if (n.type === 'info_reveal' && n.relatedContentId) {
      navigate(`/consumer/content/${n.relatedContentId}`);
    } else if (n.type === 'external_notice') {
      const url = n.extraData?.url as string | undefined;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        navigate('/consumer/interests');
      }
    }
  }

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
          <div
            key={n.id}
            className={`${styles.notifItem} ${!n.isRead ? styles.unread : ''} ${TYPE_ARROW[n.type] ? styles.notifClickable : ''}`}
            onClick={() => markRead(n)}
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
