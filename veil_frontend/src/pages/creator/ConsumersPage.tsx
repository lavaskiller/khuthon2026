import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { AnonymizedConsumer } from '@/types';
import styles from './CreatorPages.module.css';

const GENDER_LABEL: Record<string, string> = { male: '남성', female: '여성', prefer_not_to_say: '비공개' };

function countBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

const BAR_COLORS = ['#1a1a1a', '#4a6fa5', '#6b8f71', '#c9623f', '#7b5ea7', '#b08850'];

function BarChart({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className={styles.barChart}>
      {entries.map(([label, count], i) => {
        const pct = Math.round((count / total) * 100);
        const color = BAR_COLORS[i % BAR_COLORS.length];
        return (
          <div key={label} className={styles.barRow}>
            <div className={styles.barMeta}>
              <span className={styles.barLabel}>{label}</span>
              <span className={styles.barValue}>{count}명 · {pct}%</span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ConsumersPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [consumers, setConsumers] = useState<AnonymizedConsumer[]>([]);

  useEffect(() => {
    if (!token || !contentId) return;
    api.creator.getConsumers(token, contentId).then(setConsumers).catch(() => {});
  }, [token, contentId]);

  const total = consumers.length;
  const noticeSentCount = consumers.filter(c => c.noticeSent).length;
  const ageData = countBy(consumers, c => c.ageGroup);
  const genderData = countBy(consumers, c => GENDER_LABEL[c.gender] ?? c.gender);
  const regionData = countBy(consumers.filter(c => c.region), c => c.region!);

  return (
    <div className={styles.uploadPageWrap}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← 돌아가기</button>
      <h1 className={styles.pageTitle}>소비자 통계</h1>

      {total === 0 ? (
        <div className={styles.emptyState}>아직 관심을 표시한 소비자가 없습니다.</div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>총 관심자</span>
              <span className={styles.statValue}>{total}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>안내 발송 완료</span>
              <span className={styles.statValue}>{noticeSentCount}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>미발송</span>
              <span className={styles.statValue}>{total - noticeSentCount}</span>
            </div>
          </div>

          {/* 분포 차트 */}
          <div className={styles.dashboardGrid}>
            <div className={styles.dashboardCard}>
              <p className={styles.dashboardCardTitle}>연령대 분포</p>
              <BarChart data={ageData} total={total} />
            </div>
            <div className={styles.dashboardCard}>
              <p className={styles.dashboardCardTitle}>성별 분포</p>
              <BarChart data={genderData} total={total} />
            </div>
            {Object.keys(regionData).length > 0 && (
              <div className={styles.dashboardCard}>
                <p className={styles.dashboardCardTitle}>지역 분포</p>
                <BarChart data={regionData} total={consumers.filter(c => c.region).length} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
