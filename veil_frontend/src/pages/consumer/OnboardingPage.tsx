import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { Genre, ContentType } from '@/types';
import styles from './ConsumerPages.module.css';

const GENRES: Genre[] = ['action','drama','comedy','romance','thriller','horror','sf','fantasy','mystery','documentary','animation','family','music'];
const GENRE_LABELS: Record<Genre, string> = { action:'액션', drama:'드라마', comedy:'코미디', romance:'로맨스', thriller:'스릴러', horror:'호러', sf:'SF', fantasy:'판타지', mystery:'미스터리', documentary:'다큐', animation:'애니', family:'가족', music:'음악' };
const CONTENT_TYPES: { value: ContentType; label: string }[] = [{ value:'movie', label:'영화' },{ value:'drama', label:'드라마' },{ value:'book', label:'책' },{ value:'performance', label:'공연' }];
const GENDER_OPTIONS = [{ value:'male', label:'남성' },{ value:'female', label:'여성' },{ value:'prefer_not_to_say', label:'밝히지 않음' }];

const REGIONS: Record<string, string[]> = {
  '서울특별시': ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
  '부산광역시': ['강서구','금정구','기장군','남구','동구','동래구','부산진구','북구','사상구','사하구','서구','수영구','연제구','영도구','중구','해운대구'],
  '대구광역시': ['군위군','남구','달서구','달성군','동구','북구','서구','수성구','중구'],
  '인천광역시': ['강화군','계양구','남동구','동구','미추홀구','부평구','서구','연수구','옹진군','중구'],
  '광주광역시': ['광산구','남구','동구','북구','서구'],
  '대전광역시': ['대덕구','동구','서구','유성구','중구'],
  '울산광역시': ['남구','동구','북구','울주군','중구'],
  '세종특별자치시': ['세종시'],
  '경기도': ['가평군','고양시','과천시','광명시','광주시','구리시','군포시','김포시','남양주시','동두천시','부천시','성남시','수원시','시흥시','안산시','안성시','안양시','양주시','양평군','여주시','연천군','오산시','용인시','의왕시','의정부시','이천시','파주시','평택시','포천시','하남시','화성시'],
  '강원특별자치도': ['강릉시','고성군','동해시','삼척시','속초시','양구군','양양군','영월군','원주시','인제군','정선군','철원군','춘천시','태백시','평창군','홍천군','화천군','횡성군'],
  '충청북도': ['괴산군','단양군','보은군','옥천군','음성군','제천시','증평군','진천군','청주시','충주시'],
  '충청남도': ['계룡시','공주시','금산군','논산시','당진시','보령시','부여군','서산시','서천군','아산시','예산군','천안시','청양군','태안군','홍성군'],
  '전북특별자치도': ['고창군','군산시','김제시','남원시','무주군','부안군','순창군','완주군','익산시','임실군','장수군','전주시','정읍시','진안군'],
  '전라남도': ['강진군','고흥군','곡성군','광양시','구례군','나주시','담양군','목포시','무안군','보성군','순천시','신안군','여수시','영광군','영암군','완도군','장성군','장흥군','진도군','함평군','해남군','화순군'],
  '경상북도': ['경산시','경주시','고령군','구미시','군위군','김천시','문경시','봉화군','상주시','성주군','안동시','영덕군','영양군','영주시','영천시','예천군','울릉군','울진군','의성군','청도군','청송군','칠곡군','포항시'],
  '경상남도': ['거제시','거창군','고성군','김해시','남해군','밀양시','사천시','산청군','양산시','의령군','진주시','창녕군','창원시','통영시','하동군','함안군','함양군','합천군'],
  '제주특별자치도': ['서귀포시','제주시'],
};

function CustomSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className={styles.customSelect} ref={ref}>
      <button
        type="button"
        className={`${styles.customSelectTrigger} ${open ? styles.open : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={selected ? styles.customSelectValue : styles.customSelectPlaceholder}>
          {selected?.label ?? placeholder}
        </span>
        <span className={styles.customSelectArrow}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={styles.customSelectList}>
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              className={`${styles.customSelectItem} ${value === o.value ? styles.selectedItem : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function OnboardingPage() {
  const { user, token, setUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const birthDate = birthYear && birthMonth && birthDay
    ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
    : '';
  const [gender, setGender] = useState<'male'|'female'|'prefer_not_to_say'>('male');
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const region = sido ? (sigungu && sigungu !== sido ? `${sido} ${sigungu}` : sido) : '';
  const [genres, setGenres] = useState<Genre[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  function toggleGenre(g: Genre) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  function toggleContentType(ct: ContentType) {
    setContentTypes(prev => prev.includes(ct) ? prev.filter(x => x !== ct) : [...prev, ct]);
  }

  async function handleComplete() {
    if (!token) return;
    setIsLoading(true);
    try {
      const updated = await api.consumer.saveProfile(token, { birthDate, gender, region: region || undefined, preferredGenres: genres, preferredContentTypes: contentTypes });
      setUser({ ...user!, ...updated, onboardingCompleted: true });
      navigate('/consumer/home', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }

  const total = 6;

  return (
    <div className={styles.onboarding}>
      {/* Progress dots */}
      <div className={styles.progressBar}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`${styles.progressDot} ${i < step ? styles.active : ''}`} />
        ))}
      </div>

      {step === 1 && (
        <div className={styles.step}>
          <div className={styles.stepBody}>
            <h2>VEIL에 오신 것을 환영합니다</h2>
            <p className={styles.desc}>작품을 추천받기 위해 몇 가지 정보를 입력해 주세요. 입력하신 정보는 추천과 창작자 통계에만 활용됩니다.</p>
          </div>
          <button className={styles.next} onClick={() => setStep(2)}>시작하기</button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.step}>
          <div className={styles.stepBody}>
            <h2>생년월일</h2>
            <div className={styles.birthDateRow}>
              <CustomSelect
                value={birthYear}
                onChange={setBirthYear}
                options={Array.from({ length: 81 }, (_, i) => { const y = String(2005 - i); return { value: y, label: `${y}년` }; })}
                placeholder="연도"
              />
              <CustomSelect
                value={birthMonth}
                onChange={setBirthMonth}
                options={Array.from({ length: 12 }, (_, i) => { const m = String(i + 1); return { value: m, label: `${m}월` }; })}
                placeholder="월"
              />
              <CustomSelect
                value={birthDay}
                onChange={setBirthDay}
                options={Array.from({ length: 31 }, (_, i) => { const d = String(i + 1); return { value: d, label: `${d}일` }; })}
                placeholder="일"
              />
            </div>
          </div>
          <button className={styles.next} disabled={!birthDate} onClick={() => setStep(3)}>다음</button>
        </div>
      )}

      {step === 3 && (
        <div className={styles.step}>
          <div className={styles.stepBody}>
            <h2>성별</h2>
            <div className={styles.options}>
              {GENDER_OPTIONS.map(({ value, label }) => (
                <button key={value} className={`${styles.option} ${gender === value ? styles.selected : ''}`} onClick={() => setGender(value as typeof gender)}>{label}</button>
              ))}
            </div>
          </div>
          <button className={styles.next} onClick={() => setStep(4)}>다음</button>
        </div>
      )}

      {step === 4 && (
        <div className={styles.step}>
          <div className={styles.stepBody}>
            <h2>지역 <span className={styles.optional}>(선택)</span></h2>
            <div className={styles.regionSelects}>
              <CustomSelect
                value={sido}
                onChange={v => { setSido(v); setSigungu(''); }}
                options={Object.keys(REGIONS).map(s => ({ value: s, label: s }))}
                placeholder="시/도 선택"
              />
              {sido && REGIONS[sido].length > 1 && (
                <CustomSelect
                  value={sigungu}
                  onChange={setSigungu}
                  options={REGIONS[sido].map(g => ({ value: g, label: g }))}
                  placeholder="구/시/군 선택"
                />
              )}
            </div>
          </div>
          <button className={styles.next} onClick={() => setStep(5)}>다음</button>
        </div>
      )}

      {step === 5 && (
        <div className={styles.step}>
          <div className={styles.stepBody}>
            <h2>선호 장르 <span className={styles.required}>*최소 1개</span></h2>
            <div className={styles.grid}>
              {GENRES.map(g => (
                <button key={g} className={`${styles.chip} ${genres.includes(g) ? styles.selected : ''}`} onClick={() => toggleGenre(g)}>{GENRE_LABELS[g]}</button>
              ))}
            </div>
          </div>
          <button className={styles.next} disabled={genres.length === 0} onClick={() => setStep(6)}>다음</button>
        </div>
      )}

      {step === 6 && (
        <div className={styles.step}>
          <div className={styles.stepBody}>
            <h2>선호 콘텐츠 종류 <span className={styles.optional}>(선택)</span></h2>
            <div className={styles.options}>
              {CONTENT_TYPES.map(({ value, label }) => (
                <button key={value} className={`${styles.option} ${contentTypes.includes(value) ? styles.selected : ''}`} onClick={() => toggleContentType(value)}>{label}</button>
              ))}
            </div>
          </div>
          <button className={styles.next} disabled={isLoading} onClick={handleComplete}>
            {isLoading ? '저장 중...' : '완료'}
          </button>
        </div>
      )}
    </div>
  );
}
