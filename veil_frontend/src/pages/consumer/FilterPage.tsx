import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ContentType } from '@/types';
import styles from './ConsumerPages.module.css';

const TYPES: { value: ContentType; label: string }[] = [
  { value: 'movie', label: '영화' },
  { value: 'drama', label: '드라마' },
  { value: 'book', label: '책' },
  { value: 'performance', label: '공연' },
];

export default function FilterPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ContentType[]>(['movie', 'drama', 'book', 'performance']);

  function toggle(ct: ContentType) {
    setSelected(prev => {
      if (prev.includes(ct) && prev.length === 1) return prev; // min 1
      return prev.includes(ct) ? prev.filter(x => x !== ct) : [...prev, ct];
    });
  }

  return (
    <div className={styles.filterWrap}>
      <h2 className={styles.filterTitle}>어떤 작품을 볼까요?</h2>
      <p className={styles.filterDesc}>최소 1개 이상 선택</p>
      <div className={styles.filterGrid}>
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.filterBtn} ${selected.includes(value) ? styles.selected : ''}`}
            onClick={() => toggle(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        className={styles.startBtn}
        disabled={selected.length === 0}
        onClick={() => navigate('/consumer/home', { replace: true })}
      >
        탐색 시작
      </button>
    </div>
  );
}
