import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content, ContentType, Notification } from '@/types';
import styles from './ConsumerPages.module.css';

const ALL_TYPES: { value: ContentType; label: string }[] = [
  { value: 'movie', label: '영화' },
  { value: 'drama', label: '드라마' },
  { value: 'book', label: '책' },
  { value: 'performance', label: '공연' },
];

export default function ConsumerHomePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<Content[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(ALL_TYPES.map(t => t.value));

  useEffect(() => {
    if (!token) return;
    api.consumer.getInterests(token).then(setInterests).catch(() => {});
    api.consumer.getNotifications(token).then(setNotifs).catch(() => {});
  }, [token]);

  const unreadCount = notifs.filter(n => !n.isRead).length;

  function toggleType(type: ContentType) {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.length > 1 ? prev.filter(t => t !== type) : prev
        : [...prev, type]
    );
  }

  return (
    <div className={styles.homePage}>
      <div className={styles.homeGreeting}>
        <span className={styles.homeGreetingLabel}>안녕하세요{user?.nickname ? `, ${user.nickname}` : ''}</span>
        <span className={styles.homeGreetingEmail}>{user?.email}</span>
      </div>

      {/* Stats row */}
      <div className={styles.homeStats}>
        <div className={styles.homeStat}>
          <span className={styles.homeStatValue}>{interests.length}</span>
          <span className={styles.homeStatLabel}>관심 작품</span>
        </div>
        <div className={styles.homeStatDivider} />
        <div className={styles.homeStat}>
          <span className={styles.homeStatValue}>{unreadCount}</span>
          <span className={styles.homeStatLabel}>새 알림</span>
        </div>
      </div>

      {/* Content type filter */}
      <div className={styles.homeFilterSection}>
        <div className={styles.homeFilterHeader}>
          <span className={styles.homeFilterTitle}>콘텐츠 유형</span>
          <span className={styles.homeFilterHint}>탐색할 유형을 선택하세요</span>
        </div>
        <div className={styles.homeFilterRow}>
          {ALL_TYPES.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.homeFilterChip} ${selectedTypes.includes(value) ? styles.active : ''}`}
              onClick={() => toggleType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        className={styles.homeCtaBtn}
        onClick={() => navigate('/consumer/feed', { state: { types: selectedTypes } })}
      >
        탐색 시작하기
      </button>

      {/* Recent interests */}
      {interests.length > 0 && (
        <div className={styles.homeSection}>
          <h3 className={styles.homeSectionTitle}>관심 목록</h3>
          <div className={styles.homeCardList}>
            {interests.slice(0, 3).map(c => (
              <div
                key={c.id}
                className={styles.homeCard}
                onClick={() => navigate(`/consumer/content/${c.id}`)}
              >
                <div className={styles.homeCardTitle}>{c.title}</div>
                <div className={styles.homeCardMeta}>{c.genres?.join(', ')}</div>
              </div>
            ))}
            {interests.length > 3 && (
              <button className={styles.homeMoreBtn} onClick={() => navigate('/consumer/interests')}>
                전체 보기 ({interests.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* New notifications */}
      {unreadCount > 0 && (
        <div className={styles.homeSection}>
          <h3 className={styles.homeSectionTitle}>새 알림 <span className={styles.homeBadge}>{unreadCount}</span></h3>
          <button className={styles.homeNotifBtn} onClick={() => navigate('/consumer/notifications')}>
            알림 확인하기 →
          </button>
        </div>
      )}
    </div>
  );
}
