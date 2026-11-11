/**
 * 스마트 학급 관리 PWA (Smart Classroom OS)
 * 전자칠판 최적화 실시간 출석·좌석·청소 통합 시스템
 * - 교사 시점 (칠판/교탁 하단 배치)
 * - 학생 번호 전용 (No-Name)
 * - 학생 전체 인원수 동적 설정 (15~36명 무스크롤 핏)
 * - 좌석 가로 x 세로 커스텀 & [사용 안 하는 자리] 비활성화 기능
 * - 월/수/금 6교시제 & 화/목 7교시제 요일별 동적 스케줄
 * - 결과류(인정결과/병결과/미인정결과) 추가
 * - 결석류 / 조퇴류 설정 시 이후 교시 자동 연쇄 적용
 * - 나이스 RPA 엑셀 추출: 현황 제외 순수 교시별 데이터 정규화 DB
 * - 100% 무스크롤 (Zero-Scroll 뷰포트 완벽 피팅)
 */

// ============================================================================
// 1. 상수 및 초기 기본 데이터 정의
// ============================================================================
const STORAGE_KEY = 'SMART_CLASSROOM_PWA_STATE_V6';

// 출결 옵션: 출석 + 결석류 + 지각류 + 조퇴류 + 결과류 (담임확인서 표준 띄어쓰기 준수)
const ATTENDANCE_OPTIONS = [
  '출석',
  '질병결석', '미인정결석', '기타결석', '인정 결석', // 결석류
  '질병지각', '미인정지각', '기타지각', '인정 지각', // 지각류
  '질병조퇴', '미인정조퇴', '기타조퇴', '인정 조퇴', // 조퇴류
  '질병결과', '미인정결과', '기타결과', '인정 결과'  // 결과류
];

const DEFAULT_CLEANING_ROLES = [
  { id: 'role-1', name: '칠판 및 분리수거', icon: '🧹', targetCount: 4, members: [] },
  { id: 'role-2', name: '바닥 쓸기 & 대걸레', icon: '🧽', targetCount: 5, members: [] },
  { id: 'role-3', name: '교탁 및 앞쪽 정리', icon: '📐', targetCount: 4, members: [] },
  { id: 'role-4', name: '복도 및 계단 청소', icon: '🚪', targetCount: 5, members: [] },
  { id: 'role-5', name: '창문 환기 & 문단속', icon: '🪟', targetCount: 4, members: [] },
  { id: 'role-6', name: '사물함 및 게시판', icon: '📚', targetCount: 4, members: [] },
  { id: 'role-7', name: '쓰레기통 비우기', icon: '🗑️', targetCount: 4, members: [] }
];

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 학교 요일별 기본 교시 수 & 프리셋 시간표 설정
 */
// 기본 요일별 교시 수 (1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토, 0: 일)
const DEFAULT_WEEKDAY_PERIODS = {
  1: 6, // 월 6교시
  2: 7, // 화 7교시
  3: 6, // 수 6교시
  4: 7, // 목 7교시
  5: 6, // 금 6교시
  6: 6, // 토 6교시
  0: 6  // 일 6교시
};

// 중학교 기본 (45분제)
const PRESET_MIDDLE_TIMES = [
  { period: '조례', startTime: '08:30', endTime: '09:00' },
  { period: '1교시', startTime: '09:00', endTime: '09:45' },
  { period: '2교시', startTime: '09:55', endTime: '10:40' },
  { period: '3교시', startTime: '10:50', endTime: '11:35' },
  { period: '4교시', startTime: '11:45', endTime: '12:30' },
  { period: '5교시', startTime: '13:40', endTime: '14:25' },
  { period: '6교시', startTime: '14:35', endTime: '15:20' },
  { period: '7교시', startTime: '15:30', endTime: '16:15' },
  { period: '8교시', startTime: '16:25', endTime: '17:10' }
];

// 고등학교 기본 (50분제)
const PRESET_HIGH_TIMES = [
  { period: '조례', startTime: '08:30', endTime: '09:00' },
  { period: '1교시', startTime: '09:00', endTime: '09:50' },
  { period: '2교시', startTime: '10:00', endTime: '10:50' },
  { period: '3교시', startTime: '11:00', endTime: '11:50' },
  { period: '4교시', startTime: '12:00', endTime: '12:50' },
  { period: '5교시', startTime: '13:50', endTime: '14:40' },
  { period: '6교시', startTime: '14:50', endTime: '15:40' },
  { period: '7교시', startTime: '15:50', endTime: '16:40' },
  { period: '8교시', startTime: '16:50', endTime: '17:40' }
];

// 초등학교 기본 (40분제)
const PRESET_ELEM_TIMES = [
  { period: '조례', startTime: '08:40', endTime: '09:00' },
  { period: '1교시', startTime: '09:00', endTime: '09:40' },
  { period: '2교시', startTime: '09:50', endTime: '10:30' },
  { period: '3교시', startTime: '10:40', endTime: '11:20' },
  { period: '4교시', startTime: '11:30', endTime: '12:10' },
  { period: '5교시', startTime: '13:10', endTime: '13:50' },
  { period: '6교시', startTime: '14:00', endTime: '14:40' },
  { period: '7교시', startTime: '14:50', endTime: '15:30' },
  { period: '8교시', startTime: '15:40', endTime: '16:20' }
];

const DEFAULT_PERIOD_TIMES = PRESET_MIDDLE_TIMES;

/**
 * 시간 문자열("HH:MM")을 분(0~1440)으로 변환
 */
function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

/**
 * 요일별 교시 목록 반환 (사용자가 설정한 요일별 교시 수 동적 반영)
 */
function getPeriodsForDate(dateStr = appState.selectedDate) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토
  const weekdayConfig = (appState && appState.weekdayPeriods) ? appState.weekdayPeriods : DEFAULT_WEEKDAY_PERIODS;
  const maxPeriod = weekdayConfig[day] !== undefined ? weekdayConfig[day] : (DEFAULT_WEEKDAY_PERIODS[day] || 6);

  const list = ['조례'];
  for (let i = 1; i <= maxPeriod; i++) {
    list.push(`${i}교시`);
  }
  return list;
}

/**
 * 현재 시각에 따라 현재 교시 및 실시간 수업 상태 반환 (사용자 지정 시간표 동적 연동)
 */
function getCurrentLivePeriodInfo(dateStr = appState.selectedDate) {
  const isToday = (dateStr === getTodayString());
  const periods = getPeriodsForDate(dateStr);
  const periodTimes = (appState && appState.periodTimes) ? appState.periodTimes : DEFAULT_PERIOD_TIMES;

  if (!isToday) {
    return {
      isToday: false,
      period: 'auto',
      isAfterSchool: true,
      label: `선택 날짜: ${dateStr}`
    };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 현재 날짜의 교시별 시간대 설정 매핑
  const activeConfigs = periods.map(p => {
    const found = periodTimes.find(item => item.period === p);
    return found || { period: p, startTime: '09:00', endTime: '09:45' };
  });

  if (activeConfigs.length === 0) {
    return {
      isToday: true,
      period: 'auto',
      isAfterSchool: true,
      label: '시간표 정보 없음'
    };
  }

  // 1) 첫 교시(조례) 시작 전
  const firstPeriod = activeConfigs[0];
  const firstStartMin = timeStringToMinutes(firstPeriod.startTime);
  if (currentMinutes < firstStartMin) {
    return {
      isToday: true,
      period: firstPeriod.period,
      isAfterSchool: false,
      label: `등교 및 수업 준비 (${firstPeriod.startTime} 이전)`
    };
  }

  // 2) 교시 및 쉬는 시간 / 점심 시간 순회 판별
  for (let i = 0; i < activeConfigs.length; i++) {
    const curr = activeConfigs[i];
    const next = activeConfigs[i + 1];
    const currStart = timeStringToMinutes(curr.startTime);
    const currEnd = timeStringToMinutes(curr.endTime);

    // 해당 교시 수업 진행 중
    if (currentMinutes >= currStart && currentMinutes < currEnd) {
      return {
        isToday: true,
        period: curr.period,
        isAfterSchool: false,
        label: `${curr.period} 진행 중 (${curr.startTime}~${curr.endTime})`
      };
    }

    // 해당 교시 종료 후 다음 교시 시작 전 사이 (쉬는 시간 or 점심 시간)
    if (next) {
      const nextStart = timeStringToMinutes(next.startTime);
      if (currentMinutes >= currEnd && currentMinutes < nextStart) {
        const gapMinutes = nextStart - currEnd;
        const isLunch = gapMinutes >= 35; // 35분 이상이면 점심 시간으로 표기
        const label = isLunch 
          ? `점심 시간 (${curr.period} 종료 / ${curr.endTime}~${next.startTime})` 
          : `쉬는 시간 (${curr.period} 종료 / 다음: ${next.period})`;
        return {
          isToday: true,
          period: curr.period,
          isAfterSchool: false,
          label: label
        };
      }
    }
  }

  // 3) 모든 수업 종료 이후 (방과 후 / 종례)
  const lastPeriod = activeConfigs[activeConfigs.length - 1];
  return {
    isToday: true,
    period: lastPeriod.period,
    isAfterSchool: true,
    label: '방과 후 (당일 종합 출결)'
  };
}

function createStudents(total) {
  return Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    number: i + 1
  }));
}

// ============================================================================
// 2. 전역 애플리케이션 상태 (State)
// ============================================================================
let appState = {
  selectedDate: getTodayString(),
  totalStudents: 30, // 전체 학생 수
  seatMode: 'grid',  // 'grid' (일반) | 'group' (모둠)
  seatCols: 6,       // 좌석 가로 열 수
  seatRows: 5,       // 좌석 세로 행 수
  groupCount: 6,     // 모둠 수 (3~8모둠 지원)
  groupSeats: [],    // 모둠별 학생 번호 2차원 배열 [[sid, ...], [sid, ...], ...]
  seatPeriodFilter: 'auto', // 'auto' | '조례' | '1교시' ...
  weekdayPeriods: { ...DEFAULT_WEEKDAY_PERIODS }, // 요일별 전체 교시 수
  periodTimes: JSON.parse(JSON.stringify(DEFAULT_PERIOD_TIMES)), // 교시별 시작/종료 시각
  students: createStudents(30),
  attendanceRecords: {}, // { [date]: { [studentId]: { [period]: '출석' } } }
  attendanceReasons: {}, // { [date]: { [studentId]: '사유 내용' } }
  seats: Array.from({ length: 30 }, (_, i) => i + 1), // 좌석 배열 (null: 빈자리)
  disabledSeats: [], // 사용 안 하는 자리 인덱스 배열 [index, ...]
  cleaningRoles: JSON.parse(JSON.stringify(DEFAULT_CLEANING_ROLES)),
  unassignedCleaning: []
};

// ============================================================================
// 3. 로컬 스토리지 즉시 자동 저장 (Auto-save) & 복원
// ============================================================================
let saveIndicatorTimer = null;

function saveStateImmediately() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    triggerSaveIndicator();
  } catch (error) {
    console.error('로컬스토리지 자동 저장 실패:', error);
  }
}

function triggerSaveIndicator() {
  const indicator = document.getElementById('saveIndicator');
  if (!indicator) return;
  const statusText = indicator.querySelector('.status-text');
  const pulseDot = indicator.querySelector('.pulse-dot');

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  indicator.classList.add('saved');
  if (statusText) statusText.textContent = `저장됨 (${timeStr})`;
  if (pulseDot) {
    pulseDot.style.backgroundColor = '#10b981';
    pulseDot.style.boxShadow = '0 0 8px #10b981';
  }

  clearTimeout(saveIndicatorTimer);
  saveIndicatorTimer = setTimeout(() => {
    if (statusText) statusText.textContent = '실시간 저장됨';
  }, 2000);
}

function loadStateFromStorage() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 이전 버전(V5) 데이터 호환
      raw = localStorage.getItem('SMART_CLASSROOM_PWA_STATE_V5');
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = { ...appState, ...parsed };

      if (!appState.totalStudents) appState.totalStudents = 30;
      appState.students = createStudents(appState.totalStudents);

      if (!appState.seatCols) appState.seatCols = 6;
      if (!appState.seatRows) appState.seatRows = 5;

      const totalSeats = appState.seatCols * appState.seatRows;
      if (!appState.seats || appState.seats.length !== totalSeats) {
        resizeSeatsArray(appState.seatCols, appState.seatRows);
      }

      if (!Array.isArray(appState.disabledSeats)) {
        appState.disabledSeats = [];
      }

      if (!Array.isArray(appState.cleaningRoles) || appState.cleaningRoles.length === 0) {
        appState.cleaningRoles = JSON.parse(JSON.stringify(DEFAULT_CLEANING_ROLES));
        distributeCleaningRolesRandomly();
      }

      if (!Array.isArray(appState.unassignedCleaning)) {
        appState.unassignedCleaning = [];
      }

      if (!appState.groupCount || appState.groupCount < 3 || appState.groupCount > 8) {
        appState.groupCount = 6;
      }

      if (!Array.isArray(appState.groupSeats) || appState.groupSeats.length !== appState.groupCount) {
        distributeGroupsEqually();
      }

      // 요일별 전체 교시 설정 복원 및 유효성 검증
      if (!appState.weekdayPeriods || typeof appState.weekdayPeriods !== 'object') {
        appState.weekdayPeriods = { ...DEFAULT_WEEKDAY_PERIODS };
      } else {
        for (let d = 0; d <= 6; d++) {
          if (appState.weekdayPeriods[d] === undefined) {
            appState.weekdayPeriods[d] = DEFAULT_WEEKDAY_PERIODS[d] || 6;
          }
        }
      }

      // 교시별 시간대 설정 복원 및 유효성 검증
      if (!Array.isArray(appState.periodTimes) || appState.periodTimes.length === 0) {
        appState.periodTimes = JSON.parse(JSON.stringify(DEFAULT_PERIOD_TIMES));
      } else {
        DEFAULT_PERIOD_TIMES.forEach(def => {
          if (!appState.periodTimes.some(pt => pt.period === def.period)) {
            appState.periodTimes.push({ ...def });
          }
        });
      }

      // 사유 데이터 복원 및 유효성 검증
      if (!appState.attendanceReasons || typeof appState.attendanceReasons !== 'object') {
        appState.attendanceReasons = {};
      }
      return true;
    }
  } catch (e) {
    console.warn('저장 데이터 읽기 오류, 기본값으로 초기화합니다.', e);
  }

  distributeCleaningRolesRandomly();
  distributeGroupsEqually();
  saveStateImmediately();
  return false;
}

// ============================================================================
// 4. 학생 전체 인원수 동적 변경 함수
// ============================================================================
function setTotalStudents(newCount) {
  const count = parseInt(newCount, 10);
  if (isNaN(count) || count < 10 || count > 45) return;

  appState.totalStudents = count;
  appState.students = createStudents(count);

  // 1~count 범위 밖 번호 정리
  appState.seats = appState.seats.map(sid => {
    if (sid !== null && sid > count) return null;
    return sid;
  });

  // 누락된 신규 번호가 있다면 빈자리에 순차 배치
  for (let i = 1; i <= count; i++) {
    if (!appState.seats.includes(i)) {
      const emptyIdx = appState.seats.findIndex((sid, idx) => sid === null && !appState.disabledSeats.includes(idx));
      if (emptyIdx !== -1) {
        appState.seats[emptyIdx] = i;
      }
    }
  }

  appState.cleaningRoles.forEach(r => {
    r.members = r.members.filter(id => id <= count);
  });
  appState.unassignedCleaning = appState.unassignedCleaning.filter(id => id <= count);

  distributeGroupsEqually();

  saveStateImmediately();
  renderAttendanceTable();
  renderSeats();
  renderCleaningRoles();
  showToast(`전체 학생 수가 [${count}명]으로 설정되었습니다.`, 'info');
}

// ============================================================================
// 5. 좌석 가로 x 세로 크기 조정 & [사용 안 하는 자리] 토글
// ============================================================================
function resizeSeatsArray(newCols, newRows) {
  const newTotal = newCols * newRows;
  const currentStudents = [];

  appState.seats.forEach(sid => {
    if (sid !== null && sid !== undefined && sid <= appState.totalStudents && !currentStudents.includes(sid)) {
      currentStudents.push(sid);
    }
  });

  for (let i = 1; i <= appState.totalStudents; i++) {
    if (!currentStudents.includes(i)) {
      currentStudents.push(i);
    }
  }

  const newSeats = [];
  let studentIdx = 0;

  for (let i = 0; i < newTotal; i++) {
    if (appState.disabledSeats.includes(i)) {
      newSeats.push(null);
    } else if (studentIdx < currentStudents.length) {
      newSeats.push(currentStudents[studentIdx++]);
    } else {
      newSeats.push(null);
    }
  }

  appState.seatCols = newCols;
  appState.seatRows = newRows;
  appState.seats = newSeats;
  appState.disabledSeats = appState.disabledSeats.filter(idx => idx < newTotal);
}

function toggleDisableSeat(seatIndex) {
  const isAlreadyDisabled = appState.disabledSeats.includes(seatIndex);

  if (isAlreadyDisabled) {
    appState.disabledSeats = appState.disabledSeats.filter(idx => idx !== seatIndex);
    showToast(`좌석 ${seatIndex + 1}번이 [일반 좌석]으로 복원되었습니다.`, 'info');
  } else {
    const currentStudentId = appState.seats[seatIndex];
    appState.disabledSeats.push(seatIndex);
    appState.seats[seatIndex] = null;

    if (currentStudentId) {
      const emptyIdx = appState.seats.findIndex((sid, idx) => sid === null && !appState.disabledSeats.includes(idx));
      if (emptyIdx !== -1) {
        appState.seats[emptyIdx] = currentStudentId;
        showToast(`좌석 ${seatIndex + 1}번이 [사용 안 함]으로 설정되었습니다. (${currentStudentId}번 학생이 ${emptyIdx + 1}번 자리로 이동)`, 'warning');
      } else {
        showToast(`좌석 ${seatIndex + 1}번이 [사용 안 함]으로 설정되었습니다.`, 'warning');
      }
    } else {
      showToast(`좌석 ${seatIndex + 1}번이 [사용 안 함]으로 설정되었습니다.`, 'warning');
    }
  }

  saveStateImmediately();
  renderSeats();
}

// ============================================================================
// 5-1. 모둠 모드 균등 무작위(랜덤) 분배
// ============================================================================
/**
 * 학생들을 설정된 모둠 수(groupCount, 3~8개)에 맞춰
 * 100% 무작위(랜덤)이면서도 각 모둠별 인원수 편차가 최대 1명 이하가 되도록
 * 칼같이 균등 분배합니다.
 */
function distributeGroupsEqually() {
  const count = appState.groupCount || 6;
  const groups = Array.from({ length: count }, () => []);

  // 1~totalStudents 학생 번호를 무작위 셔플
  const shuffled = shuffleArray(appState.students.map(s => s.id));

  // 라운드로빈 방식으로 각 모둠에 1명씩 균등 배분 (인원 차이 최대 1명)
  shuffled.forEach((studentId, idx) => {
    groups[idx % count].push(studentId);
  });

  // 각 모둠 내에서는 번호순으로 정렬
  groups.forEach(g => g.sort((a, b) => a - b));

  appState.groupSeats = groups;
}

// ============================================================================
// 6. 청소 역할 관리 (목표 정원 100% 반영 & 완전 무작위 랜덤 분배)
// ============================================================================
/**
 * 청소 구역 무작위(랜덤) 분배:
 * - 각 구역에 설정된 targetCount(목표 정원)를 100% 반영
 * - 학생 번호(1~totalStudents)를 100% 무작위 셔플
 * - 각 구역별 정원만큼 무작위 학생 순차 배분
 * - 잔여 학생이 있을 경우 구역들에 1명씩 균등 추가 배분
 */
function distributeCleaningRolesRandomly() {
  if (!appState.cleaningRoles || appState.cleaningRoles.length === 0) return;

  // 1) 모든 구역 멤버 및 미배정 보관함 초기화
  appState.cleaningRoles.forEach(r => { r.members = []; });
  appState.unassignedCleaning = [];

  // 2) 전체 학생 번호를 무작위로 섞음
  const shuffledStudents = shuffleArray(appState.students.map(s => s.id));
  let studentIdx = 0;

  // 3) 1차: 각 구역의 targetCount(지정 정원)만큼 무작위 학생 배정
  appState.cleaningRoles.forEach(role => {
    const target = Math.max(1, role.targetCount || 1);
    for (let i = 0; i < target; i++) {
      if (studentIdx < shuffledStudents.length) {
        role.members.push(shuffledStudents[studentIdx++]);
      }
    }
  });

  // 4) 2차: 전체 학생 수가 정원 합계보다 많아서 남는 학생이 있을 경우,
  // 청소 역할에서 누락되는 학생이 없도록 각 구역에 1명씩 순차적으로 균등 추가 배분
  while (studentIdx < shuffledStudents.length) {
    for (const role of appState.cleaningRoles) {
      if (studentIdx >= shuffledStudents.length) break;
      role.members.push(shuffledStudents[studentIdx++]);
    }
  }

  // 5) 각 구역 내 학생 번호를 오름차순으로 정렬하여 보기 쉽게 정리
  appState.cleaningRoles.forEach(role => {
    role.members.sort((a, b) => a - b);
  });
}

// 하위 호환을 위해 동일하게 유지
function distributeCleaningRolesEqually() {
  distributeCleaningRolesRandomly();
}

function addCleaningRole(roleName, targetCount = 4) {
  const newId = `role-${Date.now()}`;
  const iconList = ['🧹', '🧽', '📐', '🚪', '🪟', '📚', '🗑️', '✨', '🪴', '🪑'];
  const randomIcon = iconList[Math.floor(Math.random() * iconList.length)];

  const newRole = {
    id: newId,
    name: roleName.trim(),
    icon: randomIcon,
    targetCount: parseInt(targetCount, 10) || 4,
    members: []
  };

  appState.cleaningRoles.push(newRole);
  saveStateImmediately();
  renderCleaningRoles();
  showToast(`새 구역 '[${newRole.name}]'이(가) 추가되었습니다.`, 'success');
}

function deleteCleaningRole(roleId) {
  const roleIdx = appState.cleaningRoles.findIndex(r => r.id === roleId);
  if (roleIdx === -1) return;

  const deletedRole = appState.cleaningRoles[roleIdx];
  if (deletedRole.members && deletedRole.members.length > 0) {
    appState.unassignedCleaning.push(...deletedRole.members);
  }

  appState.cleaningRoles.splice(roleIdx, 1);
  saveStateImmediately();
  renderCleaningRoles();
  showToast(`'[${deletedRole.name}]' 구역이 삭제되었습니다. (${deletedRole.members.length}명 미배정 이동)`, 'warning');
}

function updateRoleTargetCount(roleId, delta) {
  const role = appState.cleaningRoles.find(r => r.id === roleId);
  if (!role) return;

  const newCount = (role.targetCount || 4) + delta;
  if (newCount < 1 || newCount > 15) return;

  role.targetCount = newCount;
  saveStateImmediately();
  renderCleaningRoles();
}

// ============================================================================
// 7. 출결 헬퍼 함수 & 분류 (결과류 포함)
// ============================================================================
/**
 * 구버전 명칭 및 비표준 띄어쓰기를 담임확인서 표준(질병결석, 미인정결석, 기타결석, 인정 결석 등)으로 정규화
 */
function normalizeAttendanceStatus(statusStr) {
  if (!statusStr || statusStr === '출석') return '출석';

  // 1) 결석류 매핑
  if (statusStr === '병결' || statusStr === '병결석' || statusStr === '질병결석') return '질병결석';
  if (statusStr === '미인정결' || statusStr === '미인정결석') return '미인정결석';
  if (statusStr === '기타결석') return '기타결석';
  if (statusStr === '인정결' || statusStr === '인정결석' || statusStr === '인정 결석') return '인정 결석';

  // 2) 지각류 매핑
  if (statusStr === '병지각' || statusStr === '질병지각') return '질병지각';
  if (statusStr === '미인정지각') return '미인정지각';
  if (statusStr === '기타지각') return '기타지각';
  if (statusStr === '인정지각' || statusStr === '인정 지각') return '인정 지각';

  // 3) 조퇴류 매핑
  if (statusStr === '병조퇴' || statusStr === '질병조퇴') return '질병조퇴';
  if (statusStr === '미인정조퇴') return '미인정조퇴';
  if (statusStr === '기타조퇴') return '기타조퇴';
  if (statusStr === '인정조퇴' || statusStr === '인정 조퇴') return '인정 조퇴';

  // 4) 결과류 매핑
  if (statusStr === '병결과' || statusStr === '질병결과') return '질병결과';
  if (statusStr === '미인정결과') return '미인정결과';
  if (statusStr === '기타결과') return '기타결과';
  if (statusStr === '인정결과' || statusStr === '인정 결과') return '인정 결과';

  return statusStr;
}

function getStudentAttendance(studentId, date = appState.selectedDate) {
  if (!appState.attendanceRecords[date]) {
    appState.attendanceRecords[date] = {};
  }
  if (!appState.attendanceRecords[date][studentId]) {
    const defaultPeriodObj = {};
    const periods = getPeriodsForDate(date);
    periods.forEach(p => { defaultPeriodObj[p] = '출석'; });
    appState.attendanceRecords[date][studentId] = defaultPeriodObj;
  }
  
  // 구버전 출결 명칭 자동 마이그레이션
  const rec = appState.attendanceRecords[date][studentId];
  for (const p in rec) {
    rec[p] = normalizeAttendanceStatus(rec[p]);
  }
  return rec;
}

function setStudentAttendance(studentId, period, status, date = appState.selectedDate) {
  const record = getStudentAttendance(studentId, date);
  record[period] = normalizeAttendanceStatus(status);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStudentReason(studentId, date = appState.selectedDate) {
  if (!appState.attendanceReasons) appState.attendanceReasons = {};
  if (!appState.attendanceReasons[date]) return '';
  return appState.attendanceReasons[date][studentId] || '';
}

function setStudentReason(studentId, reason, date = appState.selectedDate) {
  if (!appState.attendanceReasons) appState.attendanceReasons = {};
  if (!appState.attendanceReasons[date]) appState.attendanceReasons[date] = {};

  const cleanReason = (typeof reason === 'string') ? reason.trim() : '';
  if (cleanReason) {
    appState.attendanceReasons[date][studentId] = cleanReason;
  } else {
    delete appState.attendanceReasons[date][studentId];
  }
}

/**
 * 출결 상태 문자열을 5대 카테고리로 분류:
 * - 'class-skip': 결과류 (인정결과, 병결과, 미인정결과)
 * - 'absent': 결석류 (인정결, 병결, 미인정결)
 * - 'early': 조퇴류 (인정조퇴, 병조퇴, 미인정조퇴)
 * - 'tardy': 지각류 (인정지각, 병지각, 미인정지각)
 * - 'present': 출석
 */
function getStatusCategory(statusStr) {
  if (!statusStr || statusStr === '출석') return 'present';
  if (statusStr.includes('결과')) return 'class-skip'; // 결과류 우선 체크
  if (statusStr.includes('결')) return 'absent';
  if (statusStr.includes('조퇴')) return 'early';
  if (statusStr.includes('지각')) return 'tardy';
  return 'present';
}

function getStudentSummaryStatus(studentId, date = appState.selectedDate) {
  if (!studentId) return { status: '빈자리', category: 'empty', label: '빈자리' };

  const filter = appState.seatPeriodFilter;
  const records = getStudentAttendance(studentId, date);
  const periods = getPeriodsForDate(date);

  // 1) 선생님이 특정 교시('조례', '1교시', ...)를 직접 선택한 경우
  if (filter !== 'auto' && periods.includes(filter)) {
    const st = records[filter] || '출석';
    return {
      status: st,
      category: getStatusCategory(st),
      label: st
    };
  }

  // 2) 종합(auto) 모드:
  // 오늘 날짜이고 수업 시간 내(조례~마지막 교시)라면 현재 시간표의 현재 교시 상태를 실시간 반영!
  // 예: 3교시 결과였어도 4교시에는 4교시 상태(정상 출석)로 자동 전환됨!
  const liveInfo = getCurrentLivePeriodInfo(date);
  if (liveInfo.isToday && !liveInfo.isAfterSchool && periods.includes(liveInfo.period)) {
    const liveStatus = records[liveInfo.period] || '출석';
    return {
      status: liveStatus,
      category: getStatusCategory(liveStatus),
      label: liveStatus
    };
  }

  // 3) 모든 수업 종료(방과 후/종례) 후이거나, 과거/미래 날짜인 경우:
  // 하루 전체 중 대표 이상 출결(우선순위: 결석 > 조퇴 > 결과 > 지각 > 출석)을 종합 반영
  let worstCategory = 'present';
  let representativeStatus = '출석';

  for (const period of periods) {
    const st = records[period] || '출석';
    const cat = getStatusCategory(st);

    if (cat === 'absent') {
      return { status: st, category: 'absent', label: st };
    }
    if (cat === 'early' && worstCategory !== 'absent') {
      worstCategory = 'early';
      representativeStatus = st;
    } else if (cat === 'class-skip' && worstCategory !== 'absent' && worstCategory !== 'early') {
      worstCategory = 'class-skip';
      representativeStatus = st;
    } else if (cat === 'tardy' && worstCategory === 'present') {
      worstCategory = 'tardy';
      representativeStatus = st;
    }
  }

  return {
    status: representativeStatus,
    category: worstCategory,
    label: representativeStatus
  };
}

// ============================================================================
// 8. 렌더링 엔진: 출석 체크 테이블 & 결석/조퇴 이후 교시 자동 연쇄 적용
// ============================================================================
function renderAttendanceTable() {
  const thead = document.getElementById('attendanceTableHead');
  const tbody = document.getElementById('attendanceTableBody');
  const scheduleBadge = document.getElementById('periodScheduleBadge');
  const weekdayHint = document.getElementById('weekdayHintText');
  if (!thead || !tbody) return;

  const date = appState.selectedDate;
  const periods = getPeriodsForDate(date);
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[day];
  const lastPeriod = periods[periods.length - 1];
  const lessonCount = periods.filter(p => p !== '조례').length;

  if (scheduleBadge) {
    scheduleBadge.textContent = `${dayName}요일 ${lessonCount}교시제 (조례~${lastPeriod})`;
    scheduleBadge.title = `클릭하여 요일별 교시 및 시간표 설정 (${dayName}요일: 조례~${lastPeriod})`;
  }
  if (weekdayHint) {
    weekdayHint.textContent = `${dayName}요일: 조례 ~ ${lastPeriod} 운영`;
  }

  // 1) thead 동적 생성
  let theadHtml = `
    <tr>
      <th class="col-num">번호</th>
  `;
  periods.forEach(p => {
    theadHtml += `<th class="col-period" data-period="${p}">${p}</th>`;
  });
  theadHtml += `
      <th class="col-status">현황</th>
      <th class="col-reason">사유</th>
    </tr>
  `;
  thead.innerHTML = theadHtml;

  // 2) tbody 행 동적 생성
  const rowsHtml = [];
  let countPresent = 0;
  let countAbsent = 0;
  let countTardy = 0;
  let countEarly = 0;
  let countSkip = 0;

  appState.students.forEach((student) => {
    const records = getStudentAttendance(student.id, date);
    const summary = getStudentSummaryStatus(student.id, date);

    if (summary.category === 'present') countPresent++;
    else if (summary.category === 'absent') countAbsent++;
    else if (summary.category === 'tardy') countTardy++;
    else if (summary.category === 'early') countEarly++;
    else if (summary.category === 'class-skip') countSkip++;

    let cellsHtml = '';
    periods.forEach((period) => {
      const currentStatus = records[period] || '출석';
      const category = getStatusCategory(currentStatus);

      let optionsHtml = '';
      ATTENDANCE_OPTIONS.forEach((opt) => {
        const selected = opt === currentStatus ? 'selected' : '';
        optionsHtml += `<option value="${opt}" ${selected}>${opt}</option>`;
      });

      cellsHtml += `
        <td>
          <select 
            class="select-attendance" 
            data-student-id="${student.id}" 
            data-period="${period}"
            data-status="${currentStatus}"
            data-type="${category}"
            title="${student.number}번 - ${period}">
            ${optionsHtml}
          </select>
        </td>
      `;
    });

    let summaryBadgeClass = 'ok';
    if (summary.category === 'absent') summaryBadgeClass = 'absent';
    else if (summary.category === 'tardy') summaryBadgeClass = 'tardy';
    else if (summary.category === 'early') summaryBadgeClass = 'early';
    else if (summary.category === 'class-skip') summaryBadgeClass = 'class-skip';

    const rowHeightPct = (100 / appState.totalStudents).toFixed(3);

    const currentReason = getStudentReason(student.id, date);
    const standardReasons = ['생리통', '두통', '복통', '병원진료'];
    const isCustomReason = currentReason && !standardReasons.includes(currentReason);

    let reasonOptionsHtml = `<option value="" ${!currentReason ? 'selected' : ''}>(빈칸)</option>`;
    standardReasons.forEach(r => {
      const selected = currentReason === r ? 'selected' : '';
      reasonOptionsHtml += `<option value="${r}" ${selected}>${r}</option>`;
    });
    if (isCustomReason) {
      reasonOptionsHtml += `<option value="${escapeHtml(currentReason)}" selected>${escapeHtml(currentReason)} (직접)</option>`;
    }
    reasonOptionsHtml += `<option value="__custom__">직접입력</option>`;

    rowsHtml.push(`
      <tr data-student-id="${student.id}" style="height: ${rowHeightPct}%;">
        <td class="col-num">${student.number}번</td>
        ${cellsHtml}
        <td class="col-status">
          <span class="daily-status-tag ${summaryBadgeClass}">
            ${summary.label}
          </span>
        </td>
        <td class="col-reason">
          <select 
            class="select-reason" 
            data-student-id="${student.id}" 
            data-has-reason="${!!currentReason}"
            title="${student.number}번 사유 선택 (엑셀 연동)">
            ${reasonOptionsHtml}
          </select>
        </td>
      </tr>
    `);
  });

  tbody.innerHTML = rowsHtml.join('');

  // 카운트 집계 갱신
  document.getElementById('sumPresentCount').textContent = countPresent;
  document.getElementById('sumAbsentCount').textContent = countAbsent;
  document.getElementById('sumTardyCount').textContent = countTardy;
  document.getElementById('sumEarlyCount').textContent = countEarly;
  document.getElementById('sumSkipCount').textContent = countSkip;

  updatePeriodFilterOptions();
  bindTableEvents();
}

function updatePeriodFilterOptions() {
  const filterSelect = document.getElementById('seatPeriodFilter');
  if (!filterSelect) return;

  const periods = getPeriodsForDate();
  const currentVal = appState.seatPeriodFilter;

  let optsHtml = `<option value="auto">종합 (실시간 시간표 자동)</option>`;
  periods.forEach(p => {
    const selected = currentVal === p ? 'selected' : '';
    optsHtml += `<option value="${p}" ${selected}>${p}</option>`;
  });
  filterSelect.innerHTML = optsHtml;

  if (currentVal !== 'auto' && !periods.includes(currentVal)) {
    appState.seatPeriodFilter = 'auto';
    filterSelect.value = 'auto';
  }

  updateLivePeriodBadge();
}

/**
 * 좌석 배치도 헤더의 실시간 교시 안내 뱃지 갱신
 */
function updateLivePeriodBadge() {
  const badge = document.getElementById('livePeriodBadge');
  const textEl = document.getElementById('livePeriodText');
  if (!badge || !textEl) return;

  const info = getCurrentLivePeriodInfo(appState.selectedDate);
  const filter = appState.seatPeriodFilter;

  if (filter !== 'auto') {
    textEl.textContent = `${filter} 기준 표시`;
    badge.title = `출결 필터: ${filter} 상태를 고정 표시하고 있습니다`;
    return;
  }

  if (!info.isToday) {
    textEl.textContent = `당일 종합 (${appState.selectedDate})`;
    badge.title = `선택된 날짜(${appState.selectedDate})의 출결 종합 현황입니다`;
    return;
  }

  textEl.textContent = info.label;
  badge.title = `실시간 시간표 동기화 중: 현재 시간(${info.label})에 따라 좌석 출결이 자동 반영됩니다`;
}

/**
 * 테이블 이벤트 바인딩:
 * 결석류나 조퇴류로 설정하면 그 이후 교시들은 자동으로 연쇄 변경!
 */
function bindTableEvents() {
  const tbody = document.getElementById('attendanceTableBody');
  if (!tbody) return;

  const updatePeriodSelectUI = (sid, p, status) => {
    const el = tbody.querySelector(
      `select.select-attendance[data-student-id="${sid}"][data-period="${p}"]`
    );
    if (el) {
      const cat = getStatusCategory(status);
      el.value = status;
      el.dataset.status = status;
      el.dataset.type = cat;
    }
  };

  tbody.querySelectorAll('.select-attendance').forEach((select) => {
    select.addEventListener('change', (e) => {
      const studentId = parseInt(e.target.dataset.studentId, 10);
      const changedPeriod = e.target.dataset.period;
      const newStatus = e.target.value;
      const category = getStatusCategory(newStatus);
      const periods = getPeriodsForDate(appState.selectedDate);
      const currentRecords = getStudentAttendance(studentId, appState.selectedDate);

      // 변경 전 상태 확인 (결석 해제 등 판별용)
      const hadAbsent = periods.some(p => getStatusCategory(currentRecords[p]) === 'absent');

      // 1) 현재 셀 변경
      e.target.dataset.status = newStatus;
      e.target.dataset.type = category;
      setStudentAttendance(studentId, changedPeriod, newStatus);

      // 2) [핵심 자동 연쇄 기능] 출결 유형별 맞춤형 자동 일괄 동기화
      // 2-1) [결석류: 전 교시 일괄 적용] 어떤 교시든 결석을 누르면 당일 전체(조례~마지막교시)가 해당 결석으로 자동 변경!
      if (category === 'absent') {
        periods.forEach((p) => {
          setStudentAttendance(studentId, p, newStatus);
          updatePeriodSelectUI(studentId, p, newStatus);
        });
        showToast(`${studentId}번: [${newStatus}] 지정으로 당일 모든 교시가 일괄 결석 처리되었습니다.`, 'info');
      }
      // 2-2) [조퇴류: 이후 교시 자동 적용] 체크한 교시부터 끝까지 이후 교시들을 조퇴로 자동 변경
      else if (category === 'early') {
        const currIdx = periods.indexOf(changedPeriod);

        if (currIdx !== -1 && currIdx < periods.length - 1) {
          for (let i = currIdx + 1; i < periods.length; i++) {
            const nextPeriod = periods[i];
            setStudentAttendance(studentId, nextPeriod, newStatus);
            updatePeriodSelectUI(studentId, nextPeriod, newStatus);
          }
          showToast(`${studentId}번: ${changedPeriod}부터 이후 교시가 [${newStatus}] 자동 적용되었습니다.`, 'info');
        }
      }
      // 2-3) [지각류: 앞선 교시 지각 + 이후 교시 출석 자동 전환!]
      // 결석 상태이거나 다른 상태여도 지각을 누르면 조례~해당교시까지 지각, 해당교시 다음부터 끝까지 '출석'으로 일괄 정리!
      else if (category === 'tardy') {
        const currIdx = periods.indexOf(changedPeriod);

        // 1. 조례(0번)부터 해당 교시까지 모두 동일한 지각 적용
        for (let i = 0; i <= currIdx; i++) {
          const prevPeriod = periods[i];
          setStudentAttendance(studentId, prevPeriod, newStatus);
          updatePeriodSelectUI(studentId, prevPeriod, newStatus);
        }

        // 2. 해당 교시 이후(다음 교시부터 마지막 교시까지)는 모두 '출석'으로 자동 전환!
        for (let i = currIdx + 1; i < periods.length; i++) {
          const nextPeriod = periods[i];
          setStudentAttendance(studentId, nextPeriod, '출석');
          updatePeriodSelectUI(studentId, nextPeriod, '출석');
        }

        if (currIdx < periods.length - 1) {
          const nextP = periods[currIdx + 1];
          showToast(`${studentId}번: 조례~${changedPeriod} [${newStatus}], ${nextP}부터 [출석]으로 자동 적용되었습니다.`, 'info');
        } else {
          showToast(`${studentId}번: 조례~${changedPeriod} [${newStatus}] 자동 적용되었습니다.`, 'info');
        }
      }
      // 2-4) [출석으로 변경 시]: 결석/조퇴 상태에서 출석으로 변경할 때 전 교시 자동 연쇄 해제
      else if (newStatus === '출석') {
        // A. 기존에 당일 결석류 상태였던 경우 -> 결석을 해제하고 전 교시를 '출석'으로 일괄 전환!
        if (hadAbsent) {
          periods.forEach((p) => {
            setStudentAttendance(studentId, p, '출석');
            updatePeriodSelectUI(studentId, p, '출석');
          });
          showToast(`${studentId}번: 결석 해제 - 당일 모든 교시가 [출석]으로 일괄 전환되었습니다.`, 'info');
        }
        // B. 기존에 조퇴 상태에서 조퇴 시작 교시를 출석으로 바꾼 경우 -> 이후 조퇴 교시들도 '출석'으로 자동 복원
        else {
          const currIdx = periods.indexOf(changedPeriod);
          if (currIdx !== -1 && currIdx < periods.length - 1) {
            let clearedEarly = false;
            for (let i = currIdx + 1; i < periods.length; i++) {
              const nextPeriod = periods[i];
              if (getStatusCategory(currentRecords[nextPeriod]) === 'early') {
                setStudentAttendance(studentId, nextPeriod, '출석');
                updatePeriodSelectUI(studentId, nextPeriod, '출석');
                clearedEarly = true;
              }
            }
            if (clearedEarly) {
              showToast(`${studentId}번: 조퇴 해제 - 이후 교시들이 [출석]으로 복원되었습니다.`, 'info');
            }
          }
        }
      }

      // 3) 즉시 저장 및 요약 갱신
      saveStateImmediately();
      updateTableRowSummary(studentId);
      updateTotalSummaryCounts();
      renderSeats();

      // 전자칠판 터치/선택 직후 포커스 해제 -> 상태별 고유 색상 뱃지로 깔끔 복귀
      e.target.blur();
    });
  });

  // 4) 사유 드롭다운 변경 이벤트
  tbody.querySelectorAll('.select-reason').forEach((select) => {
    select.addEventListener('change', (e) => {
      const studentId = parseInt(e.target.dataset.studentId, 10);
      const val = e.target.value;

      if (val === '__custom__') {
        openCustomReasonModal(studentId, select);
      } else {
        setStudentReason(studentId, val);
        saveStateImmediately();
        select.dataset.hasReason = !!val;
        if (val) {
          showToast(`${studentId}번: 사유가 [${val}](으)로 설정되었습니다.`, 'info');
        } else {
          showToast(`${studentId}번: 사유가 초기화(빈칸)되었습니다.`, 'info');
        }
      }
      select.blur();
    });
  });
}

function updateTableRowSummary(studentId) {
  const row = document.querySelector(`tr[data-student-id="${studentId}"]`);
  if (!row) return;

  const summary = getStudentSummaryStatus(studentId);
  const statusCell = row.querySelector('.col-status');
  if (statusCell) {
    let summaryBadgeClass = 'ok';
    if (summary.category === 'absent') summaryBadgeClass = 'absent';
    else if (summary.category === 'tardy') summaryBadgeClass = 'tardy';
    else if (summary.category === 'early') summaryBadgeClass = 'early';
    else if (summary.category === 'class-skip') summaryBadgeClass = 'class-skip';

    statusCell.innerHTML = `
      <span class="daily-status-tag ${summaryBadgeClass}">
        ${summary.label}
      </span>
    `;
  }
}

function updateTotalSummaryCounts() {
  let countPresent = 0;
  let countAbsent = 0;
  let countTardy = 0;
  let countEarly = 0;
  let countSkip = 0;

  appState.students.forEach((student) => {
    const summary = getStudentSummaryStatus(student.id);
    if (summary.category === 'present') countPresent++;
    else if (summary.category === 'absent') countAbsent++;
    else if (summary.category === 'tardy') countTardy++;
    else if (summary.category === 'early') countEarly++;
    else if (summary.category === 'class-skip') countSkip++;
  });

  document.getElementById('sumPresentCount').textContent = countPresent;
  document.getElementById('sumAbsentCount').textContent = countAbsent;
  document.getElementById('sumTardyCount').textContent = countTardy;
  document.getElementById('sumEarlyCount').textContent = countEarly;
  document.getElementById('sumSkipCount').textContent = countSkip;
}

// ============================================================================
// 9. 렌더링 엔진: 좌석 배치도 (교사 시점, [사용 안 하는 자리] 비활성화 지원)
// ============================================================================
function renderSeats() {
  const container = document.getElementById('seatContainer');
  if (!container) return;

  const mode = appState.seatMode;
  const toggleBtnText = document.getElementById('seatModeText');
  const dimControl = document.getElementById('seatDimensionControl');
  const groupControl = document.getElementById('groupCountControl');

  if (mode === 'grid') {
    if (toggleBtnText) toggleBtnText.textContent = '모둠 모드 (랜덤)';
    if (dimControl) dimControl.style.display = 'flex';
    if (groupControl) groupControl.style.display = 'none';
    container.innerHTML = `<div class="seat-grid-normal" id="seatGridElement"></div>`;
    renderNormalSeatGrid(document.getElementById('seatGridElement'));
    bindSeatDragAndDrop();
  } else {
    if (toggleBtnText) toggleBtnText.textContent = '일반 대형 전환';
    if (dimControl) dimControl.style.display = 'none';
    if (groupControl) groupControl.style.display = 'flex';
    container.innerHTML = `<div class="seat-grid-group" id="seatGroupElement"></div>`;
    renderGroupSeatGrid(document.getElementById('seatGroupElement'));
    bindGroupDragAndDrop();
  }
}

/**
 * 일반 모드: 동적 가로(cols) x 세로(rows) 그리드
 * - 교사 시점: 화면 하단에 교탁 및 전자칠판 배치
 * - 번호 체계: 오른쪽 제일 아래쪽(교탁 앞 오른쪽)이 1번으로 시작하여 왼쪽으로 숫자가 증가 (1, 2, 3, 4, 5, 6...)
 * - 윗줄로 올라가면서 오른쪽부터 다시 순차 증가 (7, 8, 9, 10, 11, 12...)
 */
function renderNormalSeatGrid(gridEl) {
  const cols = appState.seatCols || 6;
  const rows = appState.seatRows || 5;

  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  let html = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 아래에서부터 센 행 인덱스 (0: 맨 아랫줄=교탁 앞줄, rows-1: 맨 윗줄)
      const rowFromBottom = (rows - 1) - r;
      // 오른쪽에서부터 센 열 인덱스 (0: 맨 오른쪽 열, cols-1: 맨 왼쪽 열)
      const colFromRight = (cols - 1) - c;

      // 1-based 좌석 번호: 오른쪽 최하단이 1번, 왼쪽으로 갈수록 증가
      const seatNumber = rowFromBottom * cols + colFromRight + 1;
      // 0-based 좌석 배열 인덱스 (appState.seats[seatIndex])
      const seatIndex = seatNumber - 1;

      const studentId = appState.seats[seatIndex];
      const isDisabled = appState.disabledSeats.includes(seatIndex);

      if (isDisabled) {
        // 1) 사용 안 하는 자리
        html += `
          <div 
            class="seat-tile disabled-seat" 
            draggable="false" 
            data-seat-index="${seatIndex}" 
            data-student-id="disabled"
            title="좌석 ${seatNumber}번 (사용 안 함 - 클릭/더블클릭 시 해제)">
            <div class="seat-header">
              <span class="seat-idx-label">${seatNumber}</span>
              <button type="button" class="btn-toggle-disable" data-seat-index="${seatIndex}" title="일반 좌석으로 복원">✅</button>
            </div>
            <div class="seat-student-num">[ 사용 안 함 ]</div>
          </div>
        `;
      } else if (studentId === null || studentId === undefined) {
        // 2) 일반 빈자리 (공석)
        html += `
          <div 
            class="seat-tile empty-seat" 
            draggable="true" 
            data-seat-index="${seatIndex}" 
            data-student-id="empty"
            title="좌석 ${seatNumber}번 (빈자리 - 🚫버튼으로 비활성화 가능)">
            <div class="seat-header">
              <span class="seat-idx-label">${seatNumber}</span>
              <button type="button" class="btn-toggle-disable" data-seat-index="${seatIndex}" title="사용 안 하는 자리로 설정">🚫</button>
            </div>
            <div class="seat-student-num">빈자리</div>
          </div>
        `;
      } else {
        // 3) 학생 배치 좌석
        const summary = getStudentSummaryStatus(studentId);

        html += `
          <div 
            class="seat-tile" 
            draggable="true" 
            data-seat-index="${seatIndex}" 
            data-student-id="${studentId}"
            data-status-type="${summary.category}"
            title="좌석 ${seatNumber}번 | ${studentId}번 (${summary.label})">
            <div class="seat-header">
              <div class="seat-idx-wrap">
                <span class="seat-idx-label">${seatNumber}</span>
                <button type="button" class="btn-toggle-disable" data-seat-index="${seatIndex}" title="사용 안 하는 자리로 설정">🚫</button>
              </div>
              <span class="seat-status-badge">${summary.label}</span>
            </div>
            <div class="seat-student-num">${studentId}번</div>
          </div>
        `;
      }
    }
  }

  gridEl.innerHTML = html;
}

/**
 * 모둠 모드 그리드 (3~8모둠 가변 설정 & 인원수 균등 분배)
 */
function renderGroupSeatGrid(groupGridEl) {
  const groupCount = appState.groupCount || 6;

  // 모둠 데이터가 비어있거나 모둠 수가 바뀌었으면 균등 재분배
  if (!appState.groupSeats || appState.groupSeats.length !== groupCount) {
    distributeGroupsEqually();
  }

  // 모둠 수에 따른 최적 그리드 열/행 계산 (100% 무스크롤 피팅)
  let cols, rows;
  if (groupCount <= 4) {
    cols = groupCount;
    rows = 1;
  } else if (groupCount <= 6) {
    cols = 3;
    rows = 2;
  } else {
    cols = 4;
    rows = 2;
  }

  groupGridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  groupGridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  let html = '';

  for (let g = 0; g < groupCount; g++) {
    const members = appState.groupSeats[g] || [];
    const memberCount = members.length;
    let groupSeatsHtml = '';

    members.forEach((studentId, sIdx) => {
      const summary = getStudentSummaryStatus(studentId);
      groupSeatsHtml += `
        <div 
          class="seat-tile group-seat-tile" 
          draggable="true" 
          data-group-index="${g}" 
          data-slot-index="${sIdx}"
          data-student-id="${studentId}"
          data-status-type="${summary.category}"
          title="제 ${g + 1} 모둠 | ${studentId}번 (${summary.label})">
          <div class="seat-header">
            <span class="seat-idx-label">${sIdx + 1}</span>
            <span class="seat-status-badge">${summary.label}</span>
          </div>
          <div class="seat-student-num">${studentId}번</div>
        </div>
      `;
    });

    if (members.length === 0) {
      groupSeatsHtml = `<div class="empty-group-placeholder" style="grid-column: 1/-1; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:0.68rem; height:100%;">빈 모둠 (드래그하여 배정)</div>`;
    }

    const wrapCols = memberCount <= 4 ? 2 : 3;

    html += `
      <div class="group-card" data-group-index="${g}">
        <div class="group-header">
          <div class="group-title-box">
            <span>👥</span>
            <span>제 ${g + 1} 모둠</span>
          </div>
          <span class="group-badge">${memberCount}명</span>
        </div>
        <div class="group-seats-wrap" data-group-index="${g}" style="grid-template-columns: repeat(${wrapCols}, 1fr);">
          ${groupSeatsHtml}
        </div>
      </div>
    `;
  }

  groupGridEl.innerHTML = html;
}

// ============================================================================
// 9-1. 모둠 모드 전용 드래그 앤 드롭 제어
// ============================================================================
let draggedGroupData = null; // { studentId, fromGroup, fromSlot }

function bindGroupDragAndDrop() {
  const groupTiles = document.querySelectorAll('.group-seat-tile');
  const groupCards = document.querySelectorAll('.group-card');

  groupTiles.forEach((tile) => {
    tile.addEventListener('dragstart', (e) => {
      const sid = parseInt(tile.dataset.studentId, 10);
      const gIdx = parseInt(tile.dataset.groupIndex, 10);
      const sIdx = parseInt(tile.dataset.slotIndex, 10);
      draggedGroupData = { studentId: sid, fromGroup: gIdx, fromSlot: sIdx };
      tile.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({
        source: 'group-seat',
        studentId: sid,
        fromGroup: gIdx,
        fromSlot: sIdx
      }));
    });

    tile.addEventListener('dragend', () => {
      tile.classList.remove('dragging');
      document.querySelectorAll('.group-seat-tile').forEach(t => t.classList.remove('drag-over'));
      document.querySelectorAll('.group-card').forEach(c => c.classList.remove('drag-over'));
    });

    tile.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      tile.classList.add('drag-over');
    });

    tile.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      tile.classList.remove('drag-over');
    });

    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      tile.classList.remove('drag-over');

      if (!draggedGroupData) return;

      const targetSid = parseInt(tile.dataset.studentId, 10);
      const targetGroup = parseInt(tile.dataset.groupIndex, 10);

      if (draggedGroupData.studentId !== targetSid) {
        swapGroupStudents(draggedGroupData.studentId, draggedGroupData.fromGroup, targetSid, targetGroup);
      }
    });

    setupTouchDragForGroupSeat(tile);
  });

  groupCards.forEach((card) => {
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');

      if (!draggedGroupData) return;
      const targetGroup = parseInt(card.dataset.groupIndex, 10);

      // 같은 모둠 빈 공간 드롭은 무시, 다른 모둠으로 드롭 시 해당 모둠으로 이동
      if (draggedGroupData.fromGroup !== targetGroup) {
        moveStudentToGroup(draggedGroupData.studentId, draggedGroupData.fromGroup, targetGroup);
      }
    });
  });
}

function swapGroupStudents(sidA, groupA, sidB, groupB) {
  const gListA = appState.groupSeats[groupA];
  const gListB = appState.groupSeats[groupB];
  if (!gListA || !gListB) return;

  const idxA = gListA.indexOf(sidA);
  const idxB = gListB.indexOf(sidB);

  if (idxA !== -1 && idxB !== -1) {
    if (groupA === groupB) {
      gListA[idxA] = sidB;
      gListA[idxB] = sidA;
    } else {
      gListA[idxA] = sidB;
      gListB[idxB] = sidA;
    }

    saveStateImmediately();
    renderSeats();
    showToast(`모둠 자리 교환: [${sidA}번(제 ${groupA + 1}모둠)] ⇄ [${sidB}번(제 ${groupB + 1}모둠)]`, 'info');
  }
}

function moveStudentToGroup(studentId, fromGroup, toGroup) {
  if (fromGroup === toGroup) return;

  const gListFrom = appState.groupSeats[fromGroup];
  const gListTo = appState.groupSeats[toGroup];

  if (gListFrom) {
    appState.groupSeats[fromGroup] = gListFrom.filter(id => id !== studentId);
  }
  if (gListTo && !gListTo.includes(studentId)) {
    gListTo.push(studentId);
    gListTo.sort((a, b) => a - b);
  }

  saveStateImmediately();
  renderSeats();
  showToast(`[${studentId}번] 학생이 제 ${toGroup + 1} 모둠으로 이동되었습니다.`, 'info');
}

function setupTouchDragForGroupSeat(tile) {
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouching = false;
  let touchClone = null;

  tile.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isTouching = true;

    const sid = parseInt(tile.dataset.studentId, 10);
    const gIdx = parseInt(tile.dataset.groupIndex, 10);
    const sIdx = parseInt(tile.dataset.slotIndex, 10);
    draggedGroupData = { studentId: sid, fromGroup: gIdx, fromSlot: sIdx };
  }, { passive: true });

  tile.addEventListener('touchmove', (e) => {
    if (!isTouching || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartX);
    const diffY = Math.abs(touch.clientY - touchStartY);

    if (diffX > 8 || diffY > 8) {
      if (!touchClone) {
        touchClone = tile.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex = '1000';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity = '0.85';
        touchClone.style.transform = 'scale(0.95)';
        touchClone.style.width = `${tile.offsetWidth}px`;
        document.body.appendChild(touchClone);
        tile.classList.add('dragging');
      }

      touchClone.style.left = `${touch.clientX - tile.offsetWidth / 2}px`;
      touchClone.style.top = `${touch.clientY - tile.offsetHeight / 2}px`;

      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetTile = targetElement ? targetElement.closest('.group-seat-tile') : null;
      const targetCard = targetElement ? targetElement.closest('.group-card') : null;

      document.querySelectorAll('.group-seat-tile').forEach(t => t.classList.remove('drag-over'));
      document.querySelectorAll('.group-card').forEach(c => c.classList.remove('drag-over'));

      if (targetTile && targetTile !== tile) {
        targetTile.classList.add('drag-over');
      } else if (targetCard) {
        targetCard.classList.add('drag-over');
      }
    }
  }, { passive: true });

  tile.addEventListener('touchend', (e) => {
    if (!isTouching) return;
    isTouching = false;
    tile.classList.remove('dragging');

    if (touchClone) {
      touchClone.remove();
      touchClone = null;

      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetTile = targetElement ? targetElement.closest('.group-seat-tile') : null;
      const targetCard = targetElement ? targetElement.closest('.group-card') : null;

      document.querySelectorAll('.group-seat-tile').forEach(t => t.classList.remove('drag-over'));
      document.querySelectorAll('.group-card').forEach(c => c.classList.remove('drag-over'));

      if (targetTile && targetTile !== tile && draggedGroupData) {
        const targetSid = parseInt(targetTile.dataset.studentId, 10);
        const targetGroup = parseInt(targetTile.dataset.groupIndex, 10);
        swapGroupStudents(draggedGroupData.studentId, draggedGroupData.fromGroup, targetSid, targetGroup);
      } else if (targetCard && draggedGroupData) {
        const targetGroup = parseInt(targetCard.dataset.groupIndex, 10);
        if (draggedGroupData.fromGroup !== targetGroup) {
          moveStudentToGroup(draggedGroupData.studentId, draggedGroupData.fromGroup, targetGroup);
        }
      }
    }
  });
}

// ============================================================================
// 10. 좌석 드래그 앤 드롭 & 비활성화 제어
// ============================================================================
let draggedSeatIndex = null;
let draggedStudentId = null;

function bindSeatDragAndDrop() {
  const seatTiles = document.querySelectorAll('.seat-tile');

  seatTiles.forEach((tile) => {
    const seatIndex = parseInt(tile.dataset.seatIndex, 10);

    const toggleBtn = tile.querySelector('.btn-toggle-disable');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDisableSeat(seatIndex);
      });
    }

    tile.addEventListener('dblclick', () => {
      toggleDisableSeat(seatIndex);
    });

    if (!tile.classList.contains('disabled-seat')) {
      tile.addEventListener('dragstart', (e) => {
        draggedSeatIndex = seatIndex;
        const rawSid = tile.dataset.studentId;
        draggedStudentId = rawSid === 'empty' ? null : parseInt(rawSid, 10);
        tile.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
          source: 'seat',
          seatIndex: draggedSeatIndex,
          studentId: draggedStudentId
        }));
      });

      tile.addEventListener('dragend', () => {
        tile.classList.remove('dragging');
        document.querySelectorAll('.seat-tile').forEach(t => t.classList.remove('drag-over'));
        document.querySelectorAll('.role-card').forEach(c => c.classList.remove('drag-over'));
      });

      tile.addEventListener('dragover', (e) => {
        if (tile.classList.contains('disabled-seat')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        tile.classList.add('drag-over');
      });

      tile.addEventListener('dragleave', () => {
        tile.classList.remove('drag-over');
      });

      tile.addEventListener('drop', (e) => {
        e.preventDefault();
        tile.classList.remove('drag-over');
        if (tile.classList.contains('disabled-seat')) return;

        const targetSeatIndex = parseInt(tile.dataset.seatIndex, 10);
        if (draggedSeatIndex !== null && targetSeatIndex !== null && draggedSeatIndex !== targetSeatIndex) {
          swapSeats(draggedSeatIndex, targetSeatIndex);
        }
      });

      setupTouchDragForSeat(tile);
    }
  });
}

function swapSeats(indexA, indexB) {
  if (appState.disabledSeats.includes(indexA) || appState.disabledSeats.includes(indexB)) {
    showToast('사용 안 하는 자리로는 이동할 수 없습니다.', 'warning');
    return;
  }

  const temp = appState.seats[indexA];
  appState.seats[indexA] = appState.seats[indexB];
  appState.seats[indexB] = temp;

  saveStateImmediately();
  renderSeats();

  const valA = appState.seats[indexA] ? `${appState.seats[indexA]}번` : '빈자리';
  const valB = appState.seats[indexB] ? `${appState.seats[indexB]}번` : '빈자리';
  showToast(`자리 이동: [${valA}] ⇄ [${valB}]`, 'info');
}

function setupTouchDragForSeat(tile) {
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouching = false;
  let touchClone = null;

  tile.addEventListener('touchstart', (e) => {
    if (tile.classList.contains('disabled-seat')) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isTouching = true;
    draggedSeatIndex = parseInt(tile.dataset.seatIndex, 10);
    const rawSid = tile.dataset.studentId;
    draggedStudentId = rawSid === 'empty' ? null : parseInt(rawSid, 10);
  }, { passive: true });

  tile.addEventListener('touchmove', (e) => {
    if (!isTouching || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartX);
    const diffY = Math.abs(touch.clientY - touchStartY);

    if (diffX > 8 || diffY > 8) {
      if (!touchClone) {
        touchClone = tile.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex = '1000';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity = '0.85';
        touchClone.style.transform = 'scale(0.95)';
        touchClone.style.width = `${tile.offsetWidth}px`;
        document.body.appendChild(touchClone);
        tile.classList.add('dragging');
      }

      touchClone.style.left = `${touch.clientX - tile.offsetWidth / 2}px`;
      touchClone.style.top = `${touch.clientY - tile.offsetHeight / 2}px`;

      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetSeat = targetElement ? targetElement.closest('.seat-tile') : null;
      document.querySelectorAll('.seat-tile').forEach(t => t.classList.remove('drag-over'));
      if (targetSeat && targetSeat !== tile && !targetSeat.classList.contains('disabled-seat')) {
        targetSeat.classList.add('drag-over');
      }
    }
  }, { passive: true });

  tile.addEventListener('touchend', (e) => {
    if (!isTouching) return;
    isTouching = false;
    tile.classList.remove('dragging');

    if (touchClone) {
      touchClone.remove();
      touchClone = null;

      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetSeat = targetElement ? targetElement.closest('.seat-tile') : null;
      const targetRoleCard = targetElement ? targetElement.closest('.role-card') : null;

      document.querySelectorAll('.seat-tile').forEach(t => t.classList.remove('drag-over'));

      if (targetSeat && targetSeat !== tile && !targetSeat.classList.contains('disabled-seat')) {
        const targetSeatIndex = parseInt(targetSeat.dataset.seatIndex, 10);
        if (draggedSeatIndex !== null && targetSeatIndex !== null) {
          swapSeats(draggedSeatIndex, targetSeatIndex);
        }
      } else if (targetRoleCard && draggedStudentId) {
        const roleId = targetRoleCard.dataset.roleId;
        assignStudentToRole(draggedStudentId, roleId);
      }
    }
  });
}

// ============================================================================
// 11. 렌더링 엔진: 청소 역할 배정표
// ============================================================================
function renderCleaningRoles() {
  const grid = document.getElementById('cleaningRolesGrid');
  const countBadge = document.getElementById('cleaningTotalCountBadge');
  if (!grid) return;

  const roles = appState.cleaningRoles || [];
  const totalCount = roles.length;
  if (countBadge) countBadge.textContent = `총 ${totalCount}개 구역`;

  const cols = totalCount <= 4 ? totalCount : 4;
  const rows = Math.ceil((totalCount + (appState.unassignedCleaning.length > 0 ? 1 : 0)) / cols);
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${Math.max(rows, 2)}, 1fr)`;

  let html = '';

  roles.forEach((roleDef) => {
    const members = roleDef.members || [];
    const curCount = members.length;
    const targetCount = roleDef.targetCount || 4;

    let indicatorClass = 'matched';
    if (curCount < targetCount) indicatorClass = 'under';
    else if (curCount > targetCount) indicatorClass = 'over';

    let memberChipsHtml = '';
    const sortedMembers = [...members].sort((a, b) => a - b);
    sortedMembers.forEach((sid) => {
      memberChipsHtml += `
        <div 
          class="student-chip" 
          draggable="true" 
          data-student-id="${sid}" 
          data-current-role="${roleDef.id}">
          <span class="chip-num">${sid}번</span>
        </div>
      `;
    });

    html += `
      <div class="role-card" data-role-id="${roleDef.id}">
        <div class="role-header">
          <div class="role-title-box">
            <span class="role-icon">${roleDef.icon || '🧹'}</span>
            <span class="role-title" title="${roleDef.name}">${roleDef.name}</span>
          </div>

          <div class="role-ctrls-box">
            <div class="role-target-stepper" title="목표 정원 조절 (현재: ${curCount}명 / 목표: ${targetCount}명)">
              <button type="button" class="btn-role-step btn-step-down" data-role-id="${roleDef.id}">-</button>
              <span class="role-count-indicator ${indicatorClass}">${curCount}/${targetCount}명</span>
              <button type="button" class="btn-role-step btn-step-up" data-role-id="${roleDef.id}">+</button>
            </div>
            <button type="button" class="btn-delete-role" data-role-id="${roleDef.id}" title="이 구역 삭제">✕</button>
          </div>
        </div>

        <div class="role-members-list" data-role-id="${roleDef.id}">
          ${memberChipsHtml}
        </div>
      </div>
    `;
  });

  if (appState.unassignedCleaning && appState.unassignedCleaning.length > 0) {
    let unassignedChipsHtml = '';
    const sortedUnassigned = [...appState.unassignedCleaning].sort((a, b) => a - b);
    sortedUnassigned.forEach(sid => {
      unassignedChipsHtml += `
        <div 
          class="student-chip" 
          draggable="true" 
          data-student-id="${sid}" 
          data-current-role="unassigned">
          <span class="chip-num">${sid}번</span>
        </div>
      `;
    });

    html += `
      <div class="role-card unassigned" data-role-id="unassigned">
        <div class="role-header">
          <div class="role-title-box">
            <span class="role-icon">⚠️</span>
            <span class="role-title">미배정 보관함</span>
          </div>
          <span class="role-count-indicator over">${appState.unassignedCleaning.length}명</span>
        </div>
        <div class="role-members-list" data-role-id="unassigned">
          ${unassignedChipsHtml}
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;
  bindCleaningEvents();
}

function bindCleaningEvents() {
  const grid = document.getElementById('cleaningRolesGrid');
  if (!grid) return;

  grid.querySelectorAll('.btn-step-down').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateRoleTargetCount(btn.dataset.roleId, -1);
    });
  });

  grid.querySelectorAll('.btn-step-up').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateRoleTargetCount(btn.dataset.roleId, 1);
    });
  });

  grid.querySelectorAll('.btn-delete-role').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const roleId = btn.dataset.roleId;
      const role = appState.cleaningRoles.find(r => r.id === roleId);
      if (role && confirm(`'${role.name}' 구역을 삭제하시겠습니까?`)) {
        deleteCleaningRole(roleId);
      }
    });
  });

  bindCleaningDragAndDrop();
}

function bindCleaningDragAndDrop() {
  const chips = document.querySelectorAll('.student-chip');
  const roleCards = document.querySelectorAll('.role-card');

  chips.forEach((chip) => {
    chip.addEventListener('dragstart', (e) => {
      const sid = parseInt(chip.dataset.studentId, 10);
      const curRole = chip.dataset.currentRole;
      chip.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({
        source: 'cleaning-chip',
        studentId: sid,
        fromRoleId: curRole
      }));
    });

    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
      roleCards.forEach(c => c.classList.remove('drag-over'));
    });

    setupTouchDragForChip(chip);
  });

  roleCards.forEach((card) => {
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');

      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const targetRoleId = card.dataset.roleId;

        if (data.studentId && targetRoleId) {
          assignStudentToRole(data.studentId, targetRoleId);
        }
      } catch (err) {
        console.error('청소 역할 드롭 에러:', err);
      }
    });
  });
}

function assignStudentToRole(studentId, targetRoleId) {
  appState.cleaningRoles.forEach(r => {
    r.members = r.members.filter(id => id !== studentId);
  });
  appState.unassignedCleaning = appState.unassignedCleaning.filter(id => id !== studentId);

  if (targetRoleId === 'unassigned') {
    appState.unassignedCleaning.push(studentId);
  } else {
    const targetRole = appState.cleaningRoles.find(r => r.id === targetRoleId);
    if (targetRole && !targetRole.members.includes(studentId)) {
      targetRole.members.push(studentId);
    }
  }

  saveStateImmediately();
  renderCleaningRoles();

  if (targetRoleId === 'unassigned') {
    showToast(`[${studentId}번] 학생이 미배정으로 이동되었습니다.`, 'info');
  } else {
    const targetRole = appState.cleaningRoles.find(r => r.id === targetRoleId);
    if (targetRole) {
      showToast(`청소 역할 변경: [${studentId}번] ➔ [${targetRole.name}]`, 'info');
    }
  }
}

function setupTouchDragForChip(chip) {
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouching = false;
  let touchClone = null;

  chip.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isTouching = true;
  }, { passive: true });

  chip.addEventListener('touchmove', (e) => {
    if (!isTouching || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartX);
    const diffY = Math.abs(touch.clientY - touchStartY);

    if (diffX > 6 || diffY > 6) {
      if (!touchClone) {
        touchClone = chip.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex = '1000';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity = '0.9';
        document.body.appendChild(touchClone);
        chip.classList.add('dragging');
      }

      touchClone.style.left = `${touch.clientX - chip.offsetWidth / 2}px`;
      touchClone.style.top = `${touch.clientY - chip.offsetHeight / 2}px`;

      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetCard = targetElement ? targetElement.closest('.role-card') : null;
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('drag-over'));
      if (targetCard) {
        targetCard.classList.add('drag-over');
      }
    }
  }, { passive: true });

  chip.addEventListener('touchend', (e) => {
    if (!isTouching) return;
    isTouching = false;
    chip.classList.remove('dragging');

    if (touchClone) {
      touchClone.remove();
      touchClone = null;

      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetCard = targetElement ? targetElement.closest('.role-card') : null;
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('drag-over'));

      if (targetCard) {
        const studentId = parseInt(chip.dataset.studentId, 10);
        const targetRoleId = targetCard.dataset.roleId;
        assignStudentToRole(studentId, targetRoleId);
      }
    }
  });
}

// ============================================================================
// 12. 엑셀 다운로드 (기간 설정 & 정상 출석 제외 이상 출결 전용 필터 지원)
// ============================================================================
function openExcelExportModal() {
  const modal = document.getElementById('excelExportModal');
  const startDateInput = document.getElementById('excelStartDate');
  const endDateInput = document.getElementById('excelEndDate');
  const onlyAnomaliesCheck = document.getElementById('excelOnlyAnomalies');

  if (!modal) {
    executeExcelExport(appState.selectedDate, appState.selectedDate, true);
    return;
  }

  // 기본값 설정: 이번 달 1일 ~ 현재 선택된 일자(또는 오늘)
  const baseDateStr = appState.selectedDate || getTodayString();
  const d = new Date(baseDateStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const firstDayOfMonth = `${y}-${m}-01`;

  if (startDateInput) startDateInput.value = firstDayOfMonth;
  if (endDateInput) endDateInput.value = baseDateStr;
  if (onlyAnomaliesCheck) onlyAnomaliesCheck.checked = true;

  modal.classList.remove('hidden');
}

function formatDateToYmd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 특정 학생의 특정 일자(recordDate) 출결을 '담임확인서' 형식의 1줄 단위 이벤트들로 집계
 * - 5교시 병조퇴 -> 5,6,7교시 각각이 아닌 "5교시부터" 단 1줄 생성!
 * - 3교시 인정지각 -> 조례,1,2,3교시 각각이 아닌 "3교시까지" 단 1줄 생성!
 * - 결석류 -> 하루 전체 결석이므로 교시 공란으로 단 1줄 생성!
 * - 결과류 -> "3교시" 등 해당 교시 단 1줄 생성!
 */
function aggregateStudentDayConfirmationEvents(student, recordDate) {
  const dayPeriods = getPeriodsForDate(recordDate);
  const records = getStudentAttendance(student.id, recordDate);
  const studentReason = getStudentReason(student.id, recordDate);

  const anomalies = [];
  dayPeriods.forEach(p => {
    const rawStatus = records[p] || '출석';
    const status = normalizeAttendanceStatus(rawStatus);
    if (status !== '출석') {
      anomalies.push({ period: p, status, category: getStatusCategory(status) });
    }
  });

  if (anomalies.length === 0) {
    return [];
  }

  const events = [];

  // 1. 결석류 확인 (질병결석, 미인정결석, 기타결석, 인정 결석)
  const absentItems = anomalies.filter(a => a.category === 'absent');
  if (absentItems.length > 0) {
    const repStatus = absentItems[0].status;
    events.push({
      date: recordDate,
      number: student.number,
      name: '',
      attendance: repStatus,
      reason: studentReason || '',
      period: '', // 결석은 교시 공란
      remarks: ''
    });
    // 결석인 날은 하루 전체 결석이므로 바로 리턴
    return events;
  }

  // 2. 지각류 확인 (질병지각, 미인정지각, 기타지각, 인정 지각)
  const tardyItems = anomalies.filter(a => a.category === 'tardy');
  if (tardyItems.length > 0) {
    // 마지막 체크된 지각 교시 찾기 (예: 3교시 -> '3교시까지')
    const lastTardy = tardyItems[tardyItems.length - 1];
    events.push({
      date: recordDate,
      number: student.number,
      name: '',
      attendance: lastTardy.status,
      reason: studentReason || '',
      period: `${lastTardy.period}까지`, // '3교시까지' 한 줄 요약!
      remarks: ''
    });
  }

  // 3. 조퇴류 확인 (질병조퇴, 미인정조퇴, 기타조퇴, 인정 조퇴)
  const earlyItems = anomalies.filter(a => a.category === 'early');
  if (earlyItems.length > 0) {
    // 조퇴가 시작된 첫 교시 찾기 (예: '5교시')
    const firstEarly = earlyItems[0];
    events.push({
      date: recordDate,
      number: student.number,
      name: '',
      attendance: firstEarly.status,
      reason: studentReason || '',
      period: `${firstEarly.period}부터`, // '5교시부터' 한 줄 요약!
      remarks: ''
    });
  }

  // 4. 결과류 확인 (질병결과, 미인정결과, 기타결과, 인정 결과)
  const skipItems = anomalies.filter(a => a.category === 'class-skip');
  skipItems.forEach(item => {
    events.push({
      date: recordDate,
      number: student.number,
      name: '',
      attendance: item.status,
      reason: studentReason || '',
      period: `${item.period}`, // '2교시', '3교시' 등
      remarks: ''
    });
  });

  return events;
}

/**
 * 담임확인서 양식 엑셀 생성 및 다운로드 실행
 * @param {string} startDate - 시작일 (YYYY-MM-DD)
 * @param {string} endDate - 종료일 (YYYY-MM-DD)
 * @param {boolean} onlyAnomalies - true이면 결석/지각/조퇴/결과 이상 출결 건만 추출, false이면 정상 출석 포함
 */
function executeExcelExport(startDate, endDate, onlyAnomalies = true) {
  const nowIso = new Date().toISOString();

  // 1. 기간 내 모든 유효 날짜 수집 (시작일 ~ 종료일)
  const targetDates = [];
  const startObj = new Date(startDate + 'T00:00:00');
  const endObj = new Date(endDate + 'T00:00:00');

  for (let dt = new Date(startObj); dt <= endObj; dt.setDate(dt.getDate() + 1)) {
    const dayOfWeek = dt.getDay();
    const dStr = formatDateToYmd(dt);
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      targetDates.push(dStr);
    } else if (appState.attendanceRecords[dStr]) {
      targetDates.push(dStr);
    }
  }

  if (targetDates.length === 0) {
    targetDates.push(startDate);
  }

  // 2. Sheet 1: [출결 확인서] (담임확인서.xlsm 양식: 날짜 | 번호 | 이름 | 출결 | 사유 | 교시 | 비고)
  const confirmationRows = [];
  confirmationRows.push(['날짜', '번호', '이름', '출결', '사유', '교시', '비고']);

  // 학생별 이상 출결 누적 통계 (Sheet 2용: 각 차시별 카운트가 아닌 '발생 날짜(일수)' 단위로 집계!)
  const studentAnomalyStats = {};
  appState.students.forEach(s => {
    studentAnomalyStats[s.id] = {
      id: s.id,
      number: s.number,
      absentDates: new Set(),
      tardyDates: new Set(),
      earlyDates: new Set(),
      skipDates: new Set(),
      anomalyDates: new Set(),
      daySummaries: []
    };
  });

  let totalConfirmationCount = 0;

  targetDates.forEach((recordDate) => {
    appState.students.forEach((student) => {
      const dayEvents = aggregateStudentDayConfirmationEvents(student, recordDate);

      if (dayEvents.length > 0) {
        dayEvents.forEach(ev => {
          totalConfirmationCount++;
          confirmationRows.push([
            ev.date,
            ev.number,
            ev.name,
            ev.attendance,
            ev.reason,
            ev.period,
            ev.remarks
          ]);
        });

        // 학생별 요약(Sheet 2) 통계 갱신
        const stat = studentAnomalyStats[student.id];
        if (stat) {
          stat.anomalyDates.add(recordDate);
          dayEvents.forEach(ev => {
            const cat = getStatusCategory(ev.attendance);
            if (cat === 'absent') stat.absentDates.add(recordDate);
            else if (cat === 'tardy') stat.tardyDates.add(recordDate);
            else if (cat === 'early') stat.earlyDates.add(recordDate);
            else if (cat === 'class-skip') stat.skipDates.add(recordDate);
          });
          const summaryStr = dayEvents.map(e => e.period ? `${e.attendance}(${e.period})` : `${e.attendance}`).join(' / ');
          stat.daySummaries.push(`${recordDate}: ${summaryStr}`);
        }
      } else if (!onlyAnomalies) {
        // [정상 출석 제외] 체크 해제 시
        confirmationRows.push([
          recordDate,
          student.number,
          '',
          '출석',
          getStudentReason(student.id, recordDate),
          '',
          ''
        ]);
      }
    });
  });

  // 만약 [정상 출석 제외] 옵션인데 이상 출결 건이 하나도 없다면 안내 행 삽입
  if (onlyAnomalies && totalConfirmationCount === 0) {
    confirmationRows.push([
      `${startDate} ~ ${endDate}`,
      '-',
      '',
      '정상출석',
      '지정 기간 내 이상 출결 없음 (전원 정상 출석)',
      '',
      ''
    ]);
  }

  // 3. Sheet 2: 이상 출결 학생별 일수(날짜) 누적 요약
  const sheet2Rows = [];
  sheet2Rows.push([
    '학번',
    '결석 (일)',
    '지각 (일)',
    '조퇴 (일)',
    '결과 (일)',
    '총 이상출결 (일)',
    '이상 출결 일자별 요약'
  ]);
  const anomalyStudents = Object.values(studentAnomalyStats).filter(s => s.anomalyDates.size > 0);
  if (anomalyStudents.length > 0) {
    anomalyStudents.forEach(st => {
      sheet2Rows.push([
        st.number,
        st.absentDates.size,
        st.tardyDates.size,
        st.earlyDates.size,
        st.skipDates.size,
        st.anomalyDates.size,
        st.daySummaries.join(' | ')
      ]);
    });
  } else {
    sheet2Rows.push(['전원 정상', 0, 0, 0, 0, 0, '지정 기간 동안 모든 학생이 전 교시 정상 출석하였습니다.']);
  }

  // 4. Sheet 3: 참조목록 (담임확인서.xlsm Sheet3 기준)
  const refRows = [
    ['비고', '', '출결'],
    ['생리통', '', '질병결석'],
    ['현장체험학습', '', '미인정결석'],
    ['대회출전', '', '기타결석'],
    ['', '', '인정 결석'],
    ['', '', '질병지각'],
    ['', '', '미인정지각'],
    ['', '', '기타지각'],
    ['', '', '인정 지각'],
    ['', '', '질병조퇴'],
    ['', '', '미인정조퇴'],
    ['', '', '기타조퇴'],
    ['', '', '인정 조퇴'],
    ['', '', '질병결과'],
    ['', '', '미인정결과'],
    ['', '', '기타결과'],
    ['', '', '인정 결과']
  ];

  // 5. Sheet 4: 현재 좌석 및 청소 역할 배정 현황 (소속 모둠 포함)
  const seatCleaningRows = [];
  seatCleaningRows.push(['좌석 번호', '학번', '소속 모둠', '청소 담당 구역', '좌석 상태']);
  appState.seats.forEach((studentId, seatIdx) => {
    const isDisabled = appState.disabledSeats.includes(seatIdx);
    let assignedRoleName = '미배정';
    let assignedGroupName = '미배정';

    if (studentId) {
      for (const r of appState.cleaningRoles) {
        if (r.members && r.members.includes(studentId)) {
          assignedRoleName = r.name;
          break;
        }
      }
      if (Array.isArray(appState.groupSeats)) {
        appState.groupSeats.forEach((grp, gIdx) => {
          if (grp.includes(studentId)) {
            assignedGroupName = `제 ${gIdx + 1} 모둠`;
          }
        });
      }
    }
    const seatStatusText = isDisabled ? '사용 안 함' : (studentId ? '배정됨' : '빈자리');
    seatCleaningRows.push([seatIdx + 1, studentId || '-', assignedGroupName, assignedRoleName, seatStatusText]);
  });

  const fileName = `담임확인서_출결기록_${startDate}_${endDate}.xlsx`;

  if (typeof XLSX !== 'undefined') {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: 출결 확인서 (담임확인서 양식)
      const wsConfirm = XLSX.utils.aoa_to_sheet(confirmationRows);
      wsConfirm['!cols'] = [
        { wch: 13 }, // A: 날짜
        { wch: 7 },  // B: 번호
        { wch: 9 },  // C: 이름
        { wch: 12 }, // D: 출결
        { wch: 14 }, // E: 사유
        { wch: 12 }, // F: 교시
        { wch: 14 }  // G: 비고
      ];
      XLSX.utils.book_append_sheet(wb, wsConfirm, '출결 확인서');

      // Sheet 2: 이상출결_학생별요약
      const wsSummary = XLSX.utils.aoa_to_sheet(sheet2Rows);
      wsSummary['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, '이상출결_학생별요약');

      // Sheet 3: Sheet3 (출결 및 비고 참조목록)
      const wsRef = XLSX.utils.aoa_to_sheet(refRows);
      wsRef['!cols'] = [{ wch: 14 }, { wch: 4 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsRef, 'Sheet3');

      // Sheet 4: 좌석및청소배정
      const wsSeats = XLSX.utils.aoa_to_sheet(seatCleaningRows);
      wsSeats['!cols'] = [{ wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 24 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsSeats, '좌석및청소배정');

      XLSX.writeFile(wb, fileName);
      const msg = onlyAnomalies
        ? `담임확인서 양식 엑셀 다운로드 완료! (${startDate} ~ ${endDate}, 총 ${totalConfirmationCount}건)`
        : `출결 엑셀 다운로드 완료! (${startDate} ~ ${endDate}, 전체 기록)`;
      showToast(msg, 'success');
      return;
    } catch (e) {
      console.error('SheetJS 에러:', e);
    }
  }

  downloadCsvFallback(confirmationRows, `담임확인서_출결기록_${startDate}_${endDate}.csv`);
  showToast('오프라인 모드: CSV 파일로 다운로드되었습니다.', 'success');
}

function exportAttendanceToExcel() {
  openExcelExportModal();
}

function downloadCsvFallback(rows, filename) {
  const csvContent = '\uFEFF' + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// 13. 셔플 및 기타 기능
// ============================================================================
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function handleToggleSeatMode() {
  if (appState.seatMode === 'grid') {
    // 일반 대형 -> 모둠 모드 전환 시:
    // 설정된 모둠 수에 맞춰 전원 균등 무작위(랜덤) 배분
    distributeGroupsEqually();
    appState.seatMode = 'group';
    saveStateImmediately();
    renderSeats();
    showToast(`모둠 모드 전환: [${appState.groupCount}개 모둠]으로 균등하게 무작위(랜덤) 배분되었습니다. 드래그로 자리 이동 및 교환이 가능합니다.`, 'info');
  } else {
    // 모둠 모드 -> 일반 대형 복귀 시:
    // 모둠 모드 진입 전 원래 일반 좌석 배치를 그대로 유지
    appState.seatMode = 'grid';
    saveStateImmediately();
    renderSeats();
    showToast('일반 대형으로 전환되었습니다. (기존 자리 배치가 유지됩니다)', 'info');
  }
}

/**
 * 일반 좌석 무작위(랜덤) 재배치:
 * - 사용 안 하는 자리(appState.disabledSeats, 🚫)는 그대로 비워두고 유효 좌석에만 배정
 * - 전체 학생 번호를 무작위로 섞어 순차 배정
 */
function shuffleNormalSeatsRandomly() {
  if (!confirm('현재 좌석을 무작위(랜덤)로 재배치하시겠습니까?\n(※ 사용 안 하는 자리(🚫)는 그대로 비워두고 배정됩니다)')) {
    return;
  }
  const studentIds = shuffleArray(appState.students.map(s => s.id));
  let sIdx = 0;
  appState.seats = appState.seats.map((sid, idx) => {
    if (appState.disabledSeats.includes(idx)) return null;
    if (sIdx < studentIds.length) return studentIds[sIdx++];
    return null;
  });
  saveStateImmediately();
  renderSeats();
  showToast('자리 배치가 무작위(랜덤)로 완료되었습니다!', 'success');
}

function executeMonthlyReset() {
  const studentIds = shuffleArray(appState.students.map(s => s.id));
  let sIdx = 0;

  const newSeats = appState.seats.map((sid, idx) => {
    if (appState.disabledSeats.includes(idx)) return null;
    if (sIdx < studentIds.length) return studentIds[sIdx++];
    return null;
  });
  appState.seats = newSeats;

  // 모둠 모드도 균등 무작위 재배분
  distributeGroupsEqually();
  // 청소 구역도 목표 정원 맞춰 무작위 재배분
  distributeCleaningRolesRandomly();

  saveStateImmediately();
  renderSeats();
  renderCleaningRoles();

  showToast('매월 1일 리셋 완료! (사용 안 하는 자리는 비워둔 채 좌석, 모둠, 청소가 모두 균등 랜덤 재배치되었습니다)', 'success');
}

/**
 * 1년 주기 담임 교체용 새 학년도 전체 초기화 (공장 초기화)
 * - 지금까지 누적된 모든 날짜의 출결 기록 완전 삭제
 * - 좌석 배치 및 비활성화 좌석(사용 안 하는 자리) 초기화
 * - 청소 구역 및 모둠 배정 초기화
 */
function executeYearlyFullReset() {
  // 1. 모든 누적 출결 데이터 완전 삭제
  appState.attendanceRecords = {};
  appState.attendanceReasons = {};

  // 2. 좌석 배치 완전 초기화 (비활성화 해제 및 1번부터 기본 순차 배치)
  const totalSeats = (appState.seatCols || 6) * (appState.seatRows || 5);
  appState.seats = Array.from({ length: totalSeats }, (_, i) => (i < appState.totalStudents ? i + 1 : null));
  appState.disabledSeats = [];

  // 3. 모둠 좌석 균등 재배치
  distributeGroupsEqually();

  // 4. 청소 구역 기본값으로 복원 및 무작위 배분
  appState.cleaningRoles = JSON.parse(JSON.stringify(DEFAULT_CLEANING_ROLES));
  distributeCleaningRolesRandomly();
  appState.unassignedCleaning = [];

  // 5. 오늘 날짜로 재설정
  appState.selectedDate = getTodayString();
  const dateInput = document.getElementById('dateSelect');
  if (dateInput) dateInput.value = appState.selectedDate;

  // 6. 즉시 저장 및 렌더링
  saveStateImmediately();
  renderAttendanceTable();
  renderSeats();
  renderCleaningRoles();

  showToast('새 학년도 전체 데이터 초기화 완료! 모든 출결과 배치가 백지상태로 리셋되었습니다.', 'success');
}

function setAllPresentToday() {
  const date = appState.selectedDate;
  const periods = getPeriodsForDate(date);
  appState.students.forEach((student) => {
    const record = getStudentAttendance(student.id, date);
    periods.forEach(p => { record[p] = '출석'; });
  });

  saveStateImmediately();
  renderAttendanceTable();
  renderSeats();
  showToast(`오늘(${date}) 전체 1~${appState.totalStudents}번 학생의 모든 교시가 '출석'으로 일괄 처리되었습니다.`, 'success');
}

// ============================================================================
// 요일별 교시 및 교시별 시간대 설정 모달 엔진
// ============================================================================
const ALL_PERIOD_KEYS = ['조례', '1교시', '2교시', '3교시', '4교시', '5교시', '6교시', '7교시', '8교시'];

function calculateDurationMinutes(startStr, endStr) {
  const start = timeStringToMinutes(startStr);
  const end = timeStringToMinutes(endStr);
  return end - start;
}

function renderPeriodTimesTable(periodTimes = appState.periodTimes) {
  const tbody = document.getElementById('periodTimesTableBody');
  if (!tbody) return;

  const currentTimes = Array.isArray(periodTimes) ? periodTimes : DEFAULT_PERIOD_TIMES;

  let html = '';
  ALL_PERIOD_KEYS.forEach(p => {
    const config = currentTimes.find(item => item.period === p) || { period: p, startTime: '09:00', endTime: '09:45' };
    const diff = calculateDurationMinutes(config.startTime, config.endTime);
    const durationText = diff > 0 ? `${diff}분` : '오류';
    const invalidClass = diff <= 0 ? 'invalid' : '';

    html += `
      <tr data-period="${p}">
        <td><strong>${p}</strong></td>
        <td>
          <input type="time" class="period-time-input time-start" data-period="${p}" value="${config.startTime}">
        </td>
        <td>
          <input type="time" class="period-time-input time-end" data-period="${p}" value="${config.endTime}">
        </td>
        <td>
          <span class="period-duration-badge ${invalidClass}" data-period="${p}">${durationText}</span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  // 실시간 분 계산 리스너 바인딩
  tbody.querySelectorAll('.period-time-input').forEach(input => {
    input.addEventListener('input', () => {
      const period = input.dataset.period;
      const row = tbody.querySelector(`tr[data-period="${period}"]`);
      if (!row) return;

      const startInput = row.querySelector('.time-start');
      const endInput = row.querySelector('.time-end');
      const badge = row.querySelector('.period-duration-badge');

      if (startInput && endInput && badge) {
        const diff = calculateDurationMinutes(startInput.value, endInput.value);
        if (diff > 0) {
          badge.textContent = `${diff}분`;
          badge.classList.remove('invalid');
        } else {
          badge.textContent = '오류';
          badge.classList.add('invalid');
        }
      }
    });
  });
}

function openScheduleSettingsModal() {
  const modal = document.getElementById('scheduleSettingsModal');
  if (!modal) return;

  // 1. 요일별 교시 수 셀렉트 설정 (월~금: 1~5)
  const weekdayConfig = appState.weekdayPeriods || DEFAULT_WEEKDAY_PERIODS;
  for (let day = 1; day <= 5; day++) {
    const select = document.getElementById(`weekdaySelect_${day}`);
    if (select) {
      select.value = String(weekdayConfig[day] !== undefined ? weekdayConfig[day] : (DEFAULT_WEEKDAY_PERIODS[day] || 6));
    }
  }

  // 2. 교시별 시간대 테이블 렌더링
  renderPeriodTimesTable(appState.periodTimes);

  modal.classList.remove('hidden');
}

function closeScheduleSettingsModal() {
  const modal = document.getElementById('scheduleSettingsModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function setupScheduleSettingsModal() {
  const modal = document.getElementById('scheduleSettingsModal');
  const btnOpenHeader = document.getElementById('btnHeaderScheduleModal');
  const btnOpenLeft = document.getElementById('btnOpenScheduleModal');
  const scheduleBadge = document.getElementById('periodScheduleBadge');
  const btnCancel = document.getElementById('btnCancelScheduleModal');
  const btnSave = document.getElementById('btnSaveScheduleSettings');
  const btnReset = document.getElementById('btnResetScheduleDefault');

  if (btnOpenHeader) btnOpenHeader.addEventListener('click', openScheduleSettingsModal);
  if (btnOpenLeft) btnOpenLeft.addEventListener('click', openScheduleSettingsModal);
  if (scheduleBadge) scheduleBadge.addEventListener('click', openScheduleSettingsModal);

  if (btnCancel && modal) {
    btnCancel.addEventListener('click', closeScheduleSettingsModal);
  }

  // 모달 바깥 배경 클릭 시 닫기
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeScheduleSettingsModal();
      }
    });

    // 프리셋 버튼 이벤트 바인딩
    modal.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        let chosenTimes = null;
        let presetName = '';

        if (preset === 'middle') {
          chosenTimes = PRESET_MIDDLE_TIMES;
          presetName = '중학교(45분)';
        } else if (preset === 'high') {
          chosenTimes = PRESET_HIGH_TIMES;
          presetName = '고등학교(50분)';
        } else if (preset === 'elem') {
          chosenTimes = PRESET_ELEM_TIMES;
          presetName = '초등학교(40분)';
        }

        if (chosenTimes) {
          renderPeriodTimesTable(chosenTimes);
          showToast(`${presetName} 시간표 프리셋이 입력되었습니다. [설정 저장]을 누르면 반영됩니다.`, 'info');
        }
      });
    });
  }

  // 기본값 초기화 버튼
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('요일별 교시와 시간대를 기본값(월/수/금 6교시, 화/목 7교시, 중학교 45분제)으로 초기화하시겠습니까?')) {
        for (let day = 1; day <= 5; day++) {
          const select = document.getElementById(`weekdaySelect_${day}`);
          if (select) {
            select.value = String(DEFAULT_WEEKDAY_PERIODS[day] || 6);
          }
        }
        renderPeriodTimesTable(PRESET_MIDDLE_TIMES);
        showToast('기본 시간표 양식으로 초기화되었습니다. [설정 저장]을 누르면 반영됩니다.', 'info');
      }
    });
  }

  // 설정 저장 버튼
  if (btnSave && modal) {
    btnSave.addEventListener('click', () => {
      // 1. 요일별 교시 수 수집
      const newWeekdayPeriods = {};
      for (let day = 1; day <= 5; day++) {
        const select = document.getElementById(`weekdaySelect_${day}`);
        newWeekdayPeriods[day] = select ? parseInt(select.value, 10) : 6;
      }
      // 주말(토/일)은 금요일 설정과 동일하게 기본 보장
      newWeekdayPeriods[6] = newWeekdayPeriods[5];
      newWeekdayPeriods[0] = newWeekdayPeriods[5];

      // 2. 교시별 시간대 수집 및 유효성 검사
      const tbody = document.getElementById('periodTimesTableBody');
      const newPeriodTimes = [];
      let hasError = false;
      let errorPeriod = '';

      if (tbody) {
        tbody.querySelectorAll('tr[data-period]').forEach(row => {
          const period = row.dataset.period;
          const startVal = row.querySelector('.time-start')?.value || '09:00';
          const endVal = row.querySelector('.time-end')?.value || '09:45';

          const diff = calculateDurationMinutes(startVal, endVal);
          if (diff <= 0 && !hasError) {
            hasError = true;
            errorPeriod = period;
          }

          newPeriodTimes.push({
            period,
            startTime: startVal,
            endTime: endVal
          });
        });
      }

      if (hasError) {
        alert(`[${errorPeriod}]의 종료 시각이 시작 시각보다 빠르거나 같습니다. 시각을 올바르게 입력해주세요.`);
        return;
      }

      // 상태 업데이트 & 즉시 영구 저장
      appState.weekdayPeriods = newWeekdayPeriods;
      appState.periodTimes = newPeriodTimes;
      saveStateImmediately();

      // UI 즉시 동기화 리렌더링
      renderAttendanceTable();
      renderSeatPeriodOptions();
      updateLivePeriodBadge();
      renderSeats();

      closeScheduleSettingsModal();
      showToast('요일별 교시 및 시간대 설정이 성공적으로 저장되었습니다!', 'success');
    });
  }
}

// ============================================================================
// 사유(직접입력) 모달 엔진
// ============================================================================
let activeStudentIdForReason = null;
let activeSelectElForReason = null;

function renderSingleStudentReasonSelect(selectEl, studentId, currentReason) {
  if (!selectEl) return;
  const standardReasons = ['생리통', '두통', '복통', '병원진료'];
  const isCustomReason = currentReason && !standardReasons.includes(currentReason);

  let opts = `<option value="" ${!currentReason ? 'selected' : ''}>(빈칸)</option>`;
  standardReasons.forEach(r => {
    const sel = currentReason === r ? 'selected' : '';
    opts += `<option value="${r}" ${sel}>${r}</option>`;
  });
  if (isCustomReason) {
    opts += `<option value="${escapeHtml(currentReason)}" selected>${escapeHtml(currentReason)} (직접)</option>`;
  }
  opts += `<option value="__custom__">직접입력</option>`;

  selectEl.innerHTML = opts;
  selectEl.dataset.hasReason = !!currentReason;
}

function openCustomReasonModal(studentId, selectEl) {
  activeStudentIdForReason = studentId;
  activeSelectElForReason = selectEl;

  const modal = document.getElementById('customReasonModal');
  const title = document.getElementById('customReasonModalTitle');
  const input = document.getElementById('customReasonInput');
  if (!modal || !input) return;

  const currentReason = getStudentReason(studentId);
  if (title) title.textContent = `${studentId}번 학생 사유 직접 입력`;
  input.value = currentReason || '';

  modal.classList.remove('hidden');
  setTimeout(() => input.focus(), 50);
}

function closeCustomReasonModal(revert = false) {
  const modal = document.getElementById('customReasonModal');
  if (modal) modal.classList.add('hidden');

  if (revert && activeSelectElForReason && activeStudentIdForReason) {
    const cur = getStudentReason(activeStudentIdForReason);
    renderSingleStudentReasonSelect(activeSelectElForReason, activeStudentIdForReason, cur);
  }
  activeStudentIdForReason = null;
  activeSelectElForReason = null;
}

function setupCustomReasonModal() {
  const modal = document.getElementById('customReasonModal');
  const input = document.getElementById('customReasonInput');
  const btnCancel = document.getElementById('btnCancelCustomReason');
  const btnConfirm = document.getElementById('btnConfirmCustomReason');
  if (!modal) return;

  if (btnCancel) {
    btnCancel.addEventListener('click', () => closeCustomReasonModal(true));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCustomReasonModal(true);
    }
  });

  // 추천 태그 클릭 시 인풋에 반영
  modal.querySelectorAll('.btn-reason-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (input) {
        input.value = e.target.dataset.text;
        input.focus();
      }
    });
  });

  const handleConfirm = () => {
    if (!activeStudentIdForReason) return;
    const text = input ? input.value.trim() : '';
    setStudentReason(activeStudentIdForReason, text);
    saveStateImmediately();

    if (activeSelectElForReason) {
      renderSingleStudentReasonSelect(activeSelectElForReason, activeStudentIdForReason, text);
    }
    showToast(text ? `${activeStudentIdForReason}번: 사유가 [${text}](으)로 저장되었습니다.` : `${activeStudentIdForReason}번: 사유가 초기화(빈칸)되었습니다.`, 'info');
    closeCustomReasonModal(false);
  };

  if (btnConfirm) {
    btnConfirm.addEventListener('click', handleConfirm);
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        closeCustomReasonModal(true);
      }
    });
  }
}

// ============================================================================
// 14. UI 이벤트 리스너 등록
// ============================================================================
function setupEventListeners() {
  setupScheduleSettingsModal();
  setupCustomReasonModal();
  const dateInput = document.getElementById('dateSelect');
  if (dateInput) {
    dateInput.value = appState.selectedDate;
    dateInput.addEventListener('change', (e) => {
      appState.selectedDate = e.target.value;
      saveStateImmediately();
      renderAttendanceTable();
      renderSeats();
    });
  }

  const totalStudentsSelect = document.getElementById('totalStudentsSelect');
  if (totalStudentsSelect) {
    totalStudentsSelect.value = String(appState.totalStudents || 30);
    totalStudentsSelect.addEventListener('change', (e) => {
      setTotalStudents(e.target.value);
    });
  }

  const btnAllPresent = document.getElementById('btnQuickAllPresent');
  if (btnAllPresent) {
    btnAllPresent.addEventListener('click', setAllPresentToday);
  }

  const btnDeleteDateRecords = document.getElementById('btnDeleteDateRecords');
  if (btnDeleteDateRecords) {
    btnDeleteDateRecords.addEventListener('click', () => {
      const date = appState.selectedDate;
      const records = appState.attendanceRecords[date];

      if (!records) {
        showToast(`[${date}] 날짜에는 저장된 출결 기록이 없습니다.`, 'info');
        return;
      }

      // 비정상 출결 기록이 있는지 체크
      const periods = getPeriodsForDate(date);
      let hasAnomaly = false;
      for (const sid in records) {
        for (const p of periods) {
          if (records[sid] && records[sid][p] && records[sid][p] !== '출석') {
            hasAnomaly = true;
            break;
          }
        }
        if (hasAnomaly) break;
      }

      const confirmMsg = hasAnomaly
        ? `[${date}] 날짜의 모든 출결 기록을 데이터베이스에서 완전히 삭제하시겠습니까?\n\n※ 삭제 시 나이스(NEIS) RPA 엑셀 추출에서도 이 날짜가 완전히 제외됩니다.`
        : `[${date}] 날짜의 출결 기록을 데이터베이스에서 완전히 삭제하시겠습니까? (엑셀 추출 제외)`;

      if (confirm(confirmMsg)) {
        delete appState.attendanceRecords[date];
        if (appState.attendanceReasons) {
          delete appState.attendanceReasons[date];
        }
        saveStateImmediately();
        renderAttendanceTable();
        renderSeats();
        showToast(`[${date}] 날짜의 출결 데이터가 완전히 삭제되었습니다. (엑셀 추출 제외)`, 'warning');
      }
    });
  }

  const btnToggleSeatMode = document.getElementById('btnToggleSeatMode');
  if (btnToggleSeatMode) {
    btnToggleSeatMode.addEventListener('click', handleToggleSeatMode);
  }

  const seatColsSelect = document.getElementById('seatColsSelect');
  const seatRowsSelect = document.getElementById('seatRowsSelect');

  if (seatColsSelect && seatRowsSelect) {
    seatColsSelect.value = String(appState.seatCols || 6);
    seatRowsSelect.value = String(appState.seatRows || 5);

    seatColsSelect.addEventListener('change', (e) => {
      const newCols = parseInt(e.target.value, 10);
      resizeSeatsArray(newCols, appState.seatRows);
      saveStateImmediately();
      renderSeats();
      showToast(`좌석 배치가 [${newCols}열 × ${appState.seatRows}행]으로 변경되었습니다.`, 'info');
    });

    seatRowsSelect.addEventListener('change', (e) => {
      const newRows = parseInt(e.target.value, 10);
      resizeSeatsArray(appState.seatCols, newRows);
      saveStateImmediately();
      renderSeats();
      showToast(`좌석 배치가 [${appState.seatCols}열 × ${newRows}행]으로 변경되었습니다.`, 'info');
    });
  }

  const btnReshuffleSeats = document.getElementById('btnReshuffleSeats');
  if (btnReshuffleSeats) {
    btnReshuffleSeats.addEventListener('click', () => {
      shuffleNormalSeatsRandomly();
    });
  }

  const groupCountSelect = document.getElementById('groupCountSelect');
  if (groupCountSelect) {
    groupCountSelect.value = String(appState.groupCount || 6);
    groupCountSelect.addEventListener('change', (e) => {
      appState.groupCount = parseInt(e.target.value, 10);
      distributeGroupsEqually();
      saveStateImmediately();
      renderSeats();
      showToast(`모둠 수가 [${appState.groupCount}모둠]으로 변경되어 학생이 균등하게 무작위 배분되었습니다.`, 'info');
    });
  }

  const btnReshuffleGroups = document.getElementById('btnReshuffleGroups');
  if (btnReshuffleGroups) {
    btnReshuffleGroups.addEventListener('click', () => {
      distributeGroupsEqually();
      saveStateImmediately();
      renderSeats();
      showToast(`[${appState.groupCount}개 모둠]으로 학생이 무작위(랜덤) 균등 재배치되었습니다.`, 'success');
    });
  }

  const seatPeriodFilter = document.getElementById('seatPeriodFilter');
  if (seatPeriodFilter) {
    seatPeriodFilter.addEventListener('change', (e) => {
      appState.seatPeriodFilter = e.target.value;
      saveStateImmediately();
      updateLivePeriodBadge();
      renderSeats();
    });
  }

  const btnRandomCleaning = document.getElementById('btnRandomCleaning');
  if (btnRandomCleaning) {
    btnRandomCleaning.addEventListener('click', () => {
      distributeCleaningRolesRandomly();
      saveStateImmediately();
      renderCleaningRoles();
      showToast('설정된 구역 정원에 맞춰 1~' + appState.totalStudents + '번이 무작위(랜덤) 분배되었습니다.', 'success');
    });
  }

  const btnBalanceCleaning = document.getElementById('btnBalanceCleaning');
  if (btnBalanceCleaning) {
    btnBalanceCleaning.addEventListener('click', () => {
      distributeCleaningRolesRandomly();
      saveStateImmediately();
      renderCleaningRoles();
      showToast('설정된 구역 정원에 맞춰 1~' + appState.totalStudents + '번이 무작위(랜덤) 분배되었습니다.', 'success');
    });
  }

  const btnAddCleaningRole = document.getElementById('btnAddCleaningRole');
  const addRoleModal = document.getElementById('addRoleModal');
  const btnCancelAddRole = document.getElementById('btnCancelAddRole');
  const btnConfirmAddRole = document.getElementById('btnConfirmAddRole');
  const newRoleName = document.getElementById('newRoleName');
  const newRoleTargetCount = document.getElementById('newRoleTargetCount');
  const btnStepperMinus = document.getElementById('btnStepperMinus');
  const btnStepperPlus = document.getElementById('btnStepperPlus');

  if (btnAddCleaningRole && addRoleModal) {
    btnAddCleaningRole.addEventListener('click', () => {
      if (newRoleName) newRoleName.value = '';
      if (newRoleTargetCount) newRoleTargetCount.value = '4';
      addRoleModal.classList.remove('hidden');
      if (newRoleName) newRoleName.focus();
    });
  }

  if (btnStepperMinus && newRoleTargetCount) {
    btnStepperMinus.addEventListener('click', () => {
      let val = parseInt(newRoleTargetCount.value, 10) || 4;
      if (val > 1) newRoleTargetCount.value = val - 1;
    });
  }

  if (btnStepperPlus && newRoleTargetCount) {
    btnStepperPlus.addEventListener('click', () => {
      let val = parseInt(newRoleTargetCount.value, 10) || 4;
      if (val < 15) newRoleTargetCount.value = val + 1;
    });
  }

  if (btnCancelAddRole && addRoleModal) {
    btnCancelAddRole.addEventListener('click', () => {
      addRoleModal.classList.add('hidden');
    });
  }

  if (btnConfirmAddRole && addRoleModal) {
    btnConfirmAddRole.addEventListener('click', () => {
      const name = newRoleName ? newRoleName.value.trim() : '';
      const count = newRoleTargetCount ? parseInt(newRoleTargetCount.value, 10) || 4 : 4;
      if (!name) {
        alert('구역 이름을 입력해 주세요.');
        return;
      }
      addCleaningRole(name, count);
      addRoleModal.classList.add('hidden');
    });
  }

  const btnMonthlyReset = document.getElementById('btnMonthlyReset');
  const resetModal = document.getElementById('resetModal');
  const btnCancelReset = document.getElementById('btnCancelReset');
  const btnConfirmReset = document.getElementById('btnConfirmReset');

  if (btnMonthlyReset && resetModal) {
    btnMonthlyReset.addEventListener('click', () => {
      resetModal.classList.remove('hidden');
    });
  }

  if (btnCancelReset && resetModal) {
    btnCancelReset.addEventListener('click', () => {
      resetModal.classList.add('hidden');
    });
  }

  if (btnConfirmReset && resetModal) {
    btnConfirmReset.addEventListener('click', () => {
      resetModal.classList.add('hidden');
      executeMonthlyReset();
    });
  }

  const btnExportExcel = document.getElementById('btnExportExcel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', openExcelExportModal);
  }

  // 엑셀 내보내기 기간 & 필터 설정 모달 이벤트 바인딩
  const excelModal = document.getElementById('excelExportModal');
  const btnCancelExcelModal = document.getElementById('btnCancelExcelModal');
  const btnConfirmExportExcel = document.getElementById('btnConfirmExportExcel');
  const excelStartDateInput = document.getElementById('excelStartDate');
  const excelEndDateInput = document.getElementById('excelEndDate');
  const excelOnlyAnomaliesCheck = document.getElementById('excelOnlyAnomalies');

  if (btnCancelExcelModal && excelModal) {
    btnCancelExcelModal.addEventListener('click', () => {
      excelModal.classList.add('hidden');
    });
  }

  if (excelModal) {
    excelModal.querySelectorAll('.btn-quick-range').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rangeType = e.target.dataset.range;
        const today = getTodayString();
        const now = new Date(today + 'T00:00:00');

        if (rangeType === 'today') {
          excelStartDateInput.value = today;
          excelEndDateInput.value = today;
        } else if (rangeType === 'thisWeek') {
          const day = now.getDay();
          const diffToMonday = day === 0 ? -6 : 1 - day;
          const monday = new Date(now);
          monday.setDate(now.getDate() + diffToMonday);
          excelStartDateInput.value = formatDateToYmd(monday);
          excelEndDateInput.value = today;
        } else if (rangeType === 'thisMonth') {
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, '0');
          excelStartDateInput.value = `${y}-${m}-01`;
          excelEndDateInput.value = today;
        } else if (rangeType === 'all') {
          const allDates = Object.keys(appState.attendanceRecords).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
          if (allDates.length > 0) {
            excelStartDateInput.value = allDates[0];
            excelEndDateInput.value = allDates[allDates.length - 1] > today ? allDates[allDates.length - 1] : today;
          } else {
            excelStartDateInput.value = today;
            excelEndDateInput.value = today;
          }
        }
      });
    });
  }

  if (btnConfirmExportExcel && excelModal) {
    btnConfirmExportExcel.addEventListener('click', () => {
      const startDate = excelStartDateInput ? excelStartDateInput.value : getTodayString();
      const endDate = excelEndDateInput ? excelEndDateInput.value : getTodayString();
      const onlyAnomalies = excelOnlyAnomaliesCheck ? excelOnlyAnomaliesCheck.checked : true;

      if (!startDate || !endDate) {
        alert('시작일과 종료일을 모두 선택해 주세요.');
        return;
      }
      if (startDate > endDate) {
        alert('시작일은 종료일보다 앞서거나 같아야 합니다.');
        return;
      }

      excelModal.classList.add('hidden');
      executeExcelExport(startDate, endDate, onlyAnomalies);
    });
  }

  // 새 학년도 전체 초기화 (1년 주기 담임 교체용)
  const btnYearlyFullReset = document.getElementById('btnYearlyFullReset');
  const yearlyResetModal = document.getElementById('yearlyResetModal');
  const btnCancelYearlyReset = document.getElementById('btnCancelYearlyReset');
  const btnConfirmYearlyReset = document.getElementById('btnConfirmYearlyReset');
  const yearlyResetConfirmInput = document.getElementById('yearlyResetConfirmInput');

  if (btnYearlyFullReset && yearlyResetModal) {
    btnYearlyFullReset.addEventListener('click', () => {
      if (yearlyResetConfirmInput) yearlyResetConfirmInput.value = '';
      if (btnConfirmYearlyReset) btnConfirmYearlyReset.disabled = true;
      yearlyResetModal.classList.remove('hidden');
      if (yearlyResetConfirmInput) yearlyResetConfirmInput.focus();
    });
  }

  if (yearlyResetConfirmInput && btnConfirmYearlyReset) {
    yearlyResetConfirmInput.addEventListener('input', (e) => {
      const isMatched = e.target.value.trim() === '초기화';
      btnConfirmYearlyReset.disabled = !isMatched;
    });
  }

  if (btnCancelYearlyReset && yearlyResetModal) {
    btnCancelYearlyReset.addEventListener('click', () => {
      yearlyResetModal.classList.add('hidden');
    });
  }

  if (btnConfirmYearlyReset && yearlyResetModal) {
    btnConfirmYearlyReset.addEventListener('click', () => {
      yearlyResetModal.classList.add('hidden');
      executeYearlyFullReset();
    });
  }

  const btnFullscreen = document.getElementById('btnFullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.warn(err));
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });
  }

  updateLiveClock();
  setInterval(updateLiveClock, 1000);
}

let lastLivePeriodSignature = '';

function updateLiveClock() {
  const clockEl = document.getElementById('liveClock');
  if (!clockEl) return;
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayStr = days[now.getDay()];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  clockEl.textContent = `(${dayStr}) ${timeStr}`;

  // 실시간 교시 뱃지 갱신
  updateLivePeriodBadge();

  // 매 분 정각(0초) 또는 교시 변경 시 실시간 좌석 출결 자동 동기화
  if (appState.seatPeriodFilter === 'auto' && appState.selectedDate === getTodayString()) {
    const liveInfo = getCurrentLivePeriodInfo(appState.selectedDate);
    const signature = `${liveInfo.period}_${liveInfo.isAfterSchool}`;
    if (signature !== lastLivePeriodSignature || now.getSeconds() === 0) {
      lastLivePeriodSignature = signature;
      renderSeats();
    }
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutRight 0.25s forwards ease-in';
    setTimeout(() => { toast.remove(); }, 250);
  }, 3000);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW 등록 성공:', reg.scope))
        .catch(err => console.warn('SW 등록 실패:', err));
    });
  }
}

// ============================================================================
// 15. 초기 부트스트랩
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  renderAttendanceTable();
  renderSeats();
  renderCleaningRoles();
  setupEventListeners();
  registerServiceWorker();
  console.log('스마트 학급 관리 시스템 v5 준비 완료 (결석/조퇴 연계 자동 채움 & 결과류 추가).');
});
