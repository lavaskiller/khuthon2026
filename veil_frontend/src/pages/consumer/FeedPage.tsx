import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Content, ContentType } from '@/types';
import styles from './ConsumerPages.module.css';

export default function FeedPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTypes: ContentType[] = (location.state as { types?: ContentType[] } | null)?.types ?? ['movie', 'drama', 'book', 'performance'];
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef<number>(0);

  const [queue, setQueue] = useState<Content[]>([]);
  const [index, setIndex] = useState(0);
  const [interested, setInterested] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const seenIds = useRef<string[]>([]);
  const loadingMore = useRef(false);

  const current = queue[index] ?? null;

  useEffect(() => {
    if (!token) return;
    api.consumer.getFeed(token, selectedTypes).then(items => {
      setQueue(items);
      seenIds.current = items.map(c => c.id);
    }).catch(() => {});
  }, [token]);

  // 큐 소진 2개 전에 추가 로드
  useEffect(() => {
    if (!token || loadingMore.current) return;
    if (queue.length === 0 || index < queue.length - 2) return;
    loadingMore.current = true;
    api.consumer.getFeed(token, selectedTypes).then(items => {
      const newItems = items.filter(c => !seenIds.current.includes(c.id));
      if (newItems.length > 0) {
        seenIds.current = [...seenIds.current, ...newItems.map(c => c.id)];
        setQueue(prev => [...prev, ...newItems]);
      }
    }).catch(() => {}).finally(() => { loadingMore.current = false; });
  }, [index, queue.length, token]);

  // Reset state when video changes
  useEffect(() => {
    setInterested(false);
    setCurrentTime(0);
    setDuration(0);
    setVideoError(false);
    videoRef.current?.load();
  }, [index]);

  function handleInterest() {
    if (!token || !current) return;
    api.consumer.addInterest(token, current.id).catch(() => {});
    setInterested(true);
    navigate(`/consumer/content/${current.id}`);
  }

  function goNext() {
    if (!token || !current) return;
    api.consumer.recordPass(token, current.id).catch(() => {});
    setIndex(i => Math.min(i + 1, queue.length - 1));
  }

  function goPrev() {
    setIndex(i => Math.max(i - 1, 0));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (dy > 60) goNext();      // swipe up → next
    if (dy < -60) goPrev();     // swipe down → prev
  }

  function handleVideoClick() {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }

  if (queue.length === 0) {
    return (
      <div className={styles.feedEmpty}>
        지금 볼 수 있는 작품을 준비 중입니다.<br />잠시 후 다시 확인해주세요.
      </div>
    );
  }

  return (
    <div
      className={styles.feedWrap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Noise placeholder — shown when video fails */}
      {videoError && (
        <div className={styles.noisePlaceholder}>
          <div className={styles.noiseOverlay}>
            <span className={styles.noiseLabel}>VEIL</span>
            <span className={styles.noiseSubLabel}>teaser loading</span>
          </div>
        </div>
      )}

      {/* Video — tap to pause/play */}
      <video
        ref={videoRef}
        className={styles.feedVideo}
        src={current?.teaserUrl}
        autoPlay
        playsInline
        loop={false}
        style={videoError ? { opacity: 0 } : undefined}
        onClick={handleVideoClick}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => { setDuration(videoRef.current?.duration ?? 0); setVideoError(false); }}
        onError={() => setVideoError(true)}
      />

      {/* Overlay — pointer-events:none except children */}
      <div className={styles.feedOverlay}>
        {/* Top: index indicator (left) + pass button (right) */}
        <div className={styles.feedTop}>
          <div className={styles.feedCounter}>{index + 1} / {queue.length} · {current?.contentType}</div>
          <button className={styles.closeBtn} onClick={() => navigate('/consumer/home')}>✕</button>
        </div>

        {/* Bottom: interest + seek */}
        <div className={styles.feedBottom}>
          <button
            className={`${styles.interestBtn} ${interested ? styles.active : ''}`}
            onClick={handleInterest}
            aria-label="관심"
          >
            ♥
          </button>
          <input
            className={styles.seekBar}
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={e => {
              const t = Number(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = t;
              setCurrentTime(t);
            }}
          />
        </div>
      </div>
    </div>
  );
}
