function PuzzleAbrahamFaith({ puzzleId, coins, onSpendCoins, onBack, onSolved, onSelectPuzzle }) {
  const { useState, useEffect, useRef } = React;

  // subPhase: 'intro' | 'mission1' | 'mission2' | 'mission3' | 'mission4' | 'quiz' | 'complete'
  const [subPhase, setSubPhase] = useState('intro');

  // 오프닝 대사 인덱스
  const [introDialogIdx, setIntroDialogIdx] = useState(0);

  // 미션별 틀린 횟수 및 별점 관리
  const [wrongCounts, setWrongCounts] = useState({ mission1: 0, mission2: 0, mission3: 0, mission4: 0, quiz: 0 });
  const [currentStars, setCurrentStars] = useState({ mission1: 3, mission2: 3, mission3: 3, mission4: 3, quiz: 3 });

  // 공통 모달 및 음소거 설정
  const [showHint, setShowHint] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // 틀렸을 때 경고 메시지 모달
  const [wrongModalMsg, setWrongModalMsg] = useState(null);

  // ----------------------------------------------------
  // [미션 1] 여행 짐을 준비하라 State
  // ----------------------------------------------------
  const [m1Selected, setM1Selected] = useState([]); // 가방에 담긴 아이템 ID 리스트 (최대 4개)
  const [m1ShowFeedback, setM1ShowFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [m1Completed, setM1Completed] = useState(false);

  const m1Items = [
    { id: 'water', label: '물주머니', correct: true, emoji: '🏺' },
    { id: 'food', label: '양식 주머니', correct: true, emoji: '🌾' },
    { id: 'tent', label: '천막', correct: true, emoji: '⛺' },
    { id: 'staff', label: '지팡이', correct: true, emoji: '🦯' },
    { id: 'crown', label: '무거운 왕관', correct: false, emoji: '👑' },
    { id: 'treasure', label: '커다란 보물상자', correct: false, emoji: '🪙' },
    { id: 'throne', label: '화려한 의자', correct: false, emoji: '🪑' },
    { id: 'toy', label: '장난감 상자', correct: false, emoji: '🎲' }
  ];

  // ----------------------------------------------------
  // [미션 2] 약속의 길을 연결하라 State
  // ----------------------------------------------------
  const [m2Tiles, setM2Tiles] = useState([]);
  const [m2ShowFeedback, setM2ShowFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [m2Completed, setM2Completed] = useState(false);
  const [m2AnimatePath, setM2AnimatePath] = useState(false); // 성공 시 애니메이션

  // ----------------------------------------------------
  // [미션 3] 약속의 별을 밝혀라 State
  // ----------------------------------------------------
  const [m3Connections, setM3Connections] = useState([]); // [{ fromId, toId, color }]
  const [m3SelectedStar, setM3SelectedStar] = useState(null); // 시작 선택 별
  const [m3ShowFeedback, setM3ShowFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [m3Completed, setM3Completed] = useState(false);

  // 6개 별의 좌표 및 색상 정의 (가로 평행 3선 구조로 교차하지 않고 완벽히 연결 가능한 배치)
  const m3Stars = [
    { id: 'yellow_1', color: 'yellow', emoji: '⭐', name: '노란 별 1', x: 20, y: 20 },
    { id: 'yellow_2', color: 'yellow', emoji: '⭐', name: '노란 별 2', x: 80, y: 20 },
    { id: 'blue_1', color: 'blue', emoji: '🔷', name: '파란 별 1', x: 20, y: 50 },
    { id: 'blue_2', color: 'blue', emoji: '🔷', name: '파란 별 2', x: 80, y: 50 },
    { id: 'white_1', color: 'white', emoji: '✨', name: '하얀 별 1', x: 20, y: 80 },
    { id: 'white_2', color: 'white', emoji: '✨', name: '하얀 별 2', x: 80, y: 80 }
  ];

  // ----------------------------------------------------
  // [미션 4] 믿음의 길을 선택하라 State
  // ----------------------------------------------------
  const [m4SelectedIdx, setM4SelectedIdx] = useState(null);
  const [m4ShowFeedback, setM4ShowFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [m4Completed, setM4Completed] = useState(false);

  // ----------------------------------------------------
  // [마지막 성경 퀴즈] State
  // ----------------------------------------------------
  const [quizSelectedIdx, setQuizSelectedIdx] = useState(null);
  const [quizShowFeedback, setQuizShowFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [quizCompleted, setQuizCompleted] = useState(false);

  // ----------------------------------------------------
  // [공통 별점 계산 로직]
  // ----------------------------------------------------
  const calculateStars = (wrongCount) => {
    if (wrongCount === 0) return 3;
    if (wrongCount <= 2) return 2;
    return 1;
  };

  // ----------------------------------------------------
  // [미션 2] 타일 퍼즐 초기화 및 타일 연결 탐색 알고리즘
  // ----------------------------------------------------
  const initMission2 = () => {
    // 4x4 타일 맵
    // 타입: 'I' (직선), 'L' (꺾임), 'T' (삼거리), 'X' (바위/장애물)
    // 회전: 0: 0도, 1: 90도, 2: 180도, 3: 270도
    
    const initialTiles = [
      { id: 0, r: 0, c: 0, type: 'L', rot: 2, label: '하란(출발)' }, // 정답 rot: 2 (우, 하)
      { id: 1, r: 0, c: 1, type: 'I', rot: 1 },
      { id: 2, r: 0, c: 2, type: 'X', rot: 0 },
      { id: 3, r: 0, c: 3, type: 'X', rot: 3 },
      
      { id: 4, r: 1, c: 0, type: 'I', rot: 0 }, // 정답 rot: 0 (상, 하)
      { id: 5, r: 1, c: 1, type: 'L', rot: 3 },
      { id: 6, r: 1, c: 2, type: 'T', rot: 2 },
      { id: 7, r: 1, c: 3, type: 'X', rot: 1 },
      
      { id: 8, r: 2, c: 0, type: 'L', rot: 3 }, // 정답 rot: 1 (우, 하)
      { id: 9, r: 2, c: 1, type: 'I', rot: 3 }, // 정답 rot: 1 (좌, 우)
      { id: 10, r: 2, c: 2, type: 'L', rot: 0 }, // 정답 rot: 3 (좌, 하)
      { id: 11, r: 2, c: 3, type: 'X', rot: 2 },
      
      { id: 12, r: 3, c: 0, type: 'X', rot: 0 },
      { id: 13, r: 3, c: 1, type: 'X', rot: 1 },
      { id: 14, r: 3, c: 2, type: 'L', rot: 2 }, // 정답 rot: 0 (상, 우)
      { id: 15, r: 3, c: 3, type: 'L', rot: 1, label: '가나안(도착)' } // 정답 rot: 3 (좌, 상)
    ];

    // 무작위 초기 회전값 주입 (정답과 겹치지 않게 조절)
    const shuffled = initialTiles.map(tile => {
      if (tile.type === 'X') return tile;
      let randomRot = Math.floor(Math.random() * 4);
      return { ...tile, rot: randomRot };
    });
    
    setM2Tiles(shuffled);
  };

  useEffect(() => {
    if (subPhase === 'mission2') {
      initMission2();
    }
  }, [subPhase]);

  // 각 타일이 회전했을 때 열린 방향 계산 함수
  const getTileConnections = (type, rot) => {
    let base = { up: false, right: false, down: false, left: false };
    if (type === 'I') {
      base = { up: true, right: false, down: true, left: false };
    } else if (type === 'L') {
      base = { up: true, right: true, down: false, left: false };
    } else if (type === 'T') {
      base = { up: true, right: true, down: true, left: false };
    } else if (type === 'X') {
      return base;
    }

    // rot에 따른 시계방향 회전
    let current = { ...base };
    for (let i = 0; i < rot; i++) {
      const temp = current.up;
      current.up = current.left;
      current.left = current.down;
      current.down = current.right;
      current.right = temp;
    }
    return current;
  };

  // ----------------------------------------------------
  // [미션 1] 가방 담기 조작 핸들러
  // ----------------------------------------------------
  const handleM1ItemClick = (itemId) => {
    if (m1ShowFeedback) return;
    if (!soundMuted) synth.playClick();

    if (m1Selected.includes(itemId)) {
      setM1Selected(prev => prev.filter(id => id !== itemId));
    } else {
      if (m1Selected.length < 4) {
        setM1Selected(prev => [...prev, itemId]);
      } else {
        if (!soundMuted) synth.playBarrier();
      }
    }
  };

  const handleM1Submit = () => {
    if (m1Selected.length !== 4) {
      if (!soundMuted) synth.playBarrier();
      setWrongModalMsg("가방에 물건을 4개 가득 채워주세요!");
      return;
    }

    const correctIds = ['water', 'food', 'tent', 'staff'];
    const isAllCorrect = m1Selected.every(id => correctIds.includes(id));

    if (isAllCorrect) {
      if (!soundMuted) synth.playSuccess();
      setM1ShowFeedback('correct');
      setTimeout(() => {
        setM1Completed(true);
        setM1ShowFeedback(null);
      }, 1500);
    } else {
      if (!soundMuted) synth.playBarrier();
      setM1ShowFeedback('wrong');
      
      setWrongCounts(prev => {
        const next = { ...prev, mission1: prev.mission1 + 1 };
        setCurrentStars(s => ({ ...s, mission1: calculateStars(next.mission1) }));
        return next;
      });

      let feedback = "먼 길을 여행할 때 꼭 필요한 물건을 다시 생각해보세요.";
      if (m1Selected.includes('crown') || m1Selected.includes('treasure')) {
        feedback = "아브라함은 왕이 되거나 보물을 찾기 위해 떠난 것이 아니에요.";
      } else if (m1Selected.includes('throne') || m1Selected.includes('toy')) {
        feedback = "먼 길을 여행할 때 꼭 필요한 물건을 다시 생각해보세요.";
      }
      
      setWrongModalMsg(feedback);
      setTimeout(() => setM1ShowFeedback(null), 1500);
    }
  };

  // ----------------------------------------------------
  // [미션 2] 타일 회전 및 연결 검사 핸들러
  // ----------------------------------------------------
  const handleM2TileClick = (tileId) => {
    if (m2ShowFeedback || m2AnimatePath) return;
    if (!soundMuted) synth.playStep();

    setM2Tiles(prev => prev.map(t => {
      if (t.id === tileId) {
        return { ...t, rot: (t.rot + 1) % 4 };
      }
      return t;
    }));
  };

  const handleM2Submit = () => {
    const grid = Array.from({ length: 4 }).map(() => Array.from({ length: 4 }).fill(null));
    m2Tiles.forEach(tile => {
      grid[tile.r][tile.c] = tile;
    });

    const visited = Array.from({ length: 4 }).map(() => Array.from({ length: 4 }).fill(false));
    let pathFound = false;

    const dfs = (r, c, fromDir) => {
      if (r < 0 || r >= 4 || c < 0 || c >= 4) return;
      if (visited[r][c]) return;
      
      const currentTile = grid[r][c];
      if (!currentTile || currentTile.type === 'X') return;

      const currentConns = getTileConnections(currentTile.type, currentTile.rot);

      if (r === 0 && c === 0) {
        currentConns.left = true;
      }
      if (r === 3 && c === 3) {
        currentConns.right = true;
      }

      if (fromDir) {
        if (fromDir === 'up' && !currentConns.up) return;
        if (fromDir === 'down' && !currentConns.down) return;
        if (fromDir === 'left' && !currentConns.left) return;
        if (fromDir === 'right' && !currentConns.right) return;
      }

      visited[r][c] = true;

      if (r === 3 && c === 3) {
        pathFound = true;
        return;
      }

      if (currentConns.up && r > 0) {
        const nextConns = getTileConnections(grid[r - 1][c].type, grid[r - 1][c].rot);
        if (nextConns.down) dfs(r - 1, c, 'down');
      }
      if (currentConns.down && r < 3) {
        const nextConns = getTileConnections(grid[r + 1][c].type, grid[r + 1][c].rot);
        if (nextConns.up) dfs(r + 1, c, 'up');
      }
      if (currentConns.left && c > 0) {
        const nextConns = getTileConnections(grid[r][c - 1].type, grid[r][c - 1].rot);
        if (nextConns.right) dfs(r, c - 1, 'right');
      }
      if (currentConns.right && c < 3) {
        const nextConns = getTileConnections(grid[r][c + 1].type, grid[r][c + 1].rot);
        if (nextConns.left) dfs(r, c + 1, 'left');
      }
    };

    dfs(0, 0, null);

    if (pathFound) {
      if (!soundMuted) synth.playSuccess();
      setM2AnimatePath(true);
      setM2ShowFeedback('correct');
      setTimeout(() => {
        setM2Completed(true);
        setM2ShowFeedback(null);
        setM2AnimatePath(false);
      }, 2500);
    } else {
      if (!soundMuted) synth.playBarrier();
      setM2ShowFeedback('wrong');
      
      setWrongCounts(prev => {
        const next = { ...prev, mission2: prev.mission2 + 1 };
        setCurrentStars(s => ({ ...s, mission2: calculateStars(next.mission2) }));
        return next;
      });

      setWrongModalMsg("길이 중간에 끊어졌어요. 길의 방향을 다시 확인해보세요.");
      setTimeout(() => setM2ShowFeedback(null), 1800);
    }
  };

  // ----------------------------------------------------
  // [미션 3] 약속의 별을 밝혀라 연결 조작 핸들러
  // ----------------------------------------------------
  const ccw = (p1, p2, p3) => {
    // 올바른 CCW(외적) 공식: p1을 기준점으로 사용해야 함
    const val = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    if (val === 0) return 0;
    return (val > 0) ? 1 : 2;
  };

  const isIntersect = (l1_start, l1_end, l2_start, l2_end) => {
    if (l1_start.id === l2_start.id || l1_start.id === l2_end.id || 
        l1_end.id === l2_start.id || l1_end.id === l2_end.id) {
      return false;
    }

    const o1 = ccw(l1_start, l1_end, l2_start);
    const o2 = ccw(l1_start, l1_end, l2_end);
    const o3 = ccw(l2_start, l2_end, l1_start);
    const o4 = ccw(l2_start, l2_end, l1_end);

    if (o1 !== o2 && o3 !== o4) return true;
    return false;
  };

  const handleM3StarClick = (star) => {
    if (m3ShowFeedback) return;

    if (!m3SelectedStar) {
      if (!soundMuted) synth.playClick();
      setM3SelectedStar(star);
    } else {
      if (m3SelectedStar.id === star.id) {
        setM3SelectedStar(null);
        return;
      }

      if (m3SelectedStar.color !== star.color) {
        if (!soundMuted) synth.playBarrier();
        setM3ShowFeedback('wrong');
        setWrongCounts(prev => {
          const next = { ...prev, mission3: prev.mission3 + 1 };
          setCurrentStars(s => ({ ...s, mission3: calculateStars(next.mission3) }));
          return next;
        });
        setWrongModalMsg("같은 색깔의 별끼리 연결해보세요.");
        setM3SelectedStar(null);
        setTimeout(() => setM3ShowFeedback(null), 1200);
        return;
      }

      const activeColor = star.color;
      const filteredConns = m3Connections.filter(c => c.color !== activeColor);

      const newConn = { 
        fromId: m3SelectedStar.id, 
        toId: star.id, 
        color: activeColor,
        fromX: m3SelectedStar.x,
        fromY: m3SelectedStar.y,
        toX: star.x,
        toY: star.y
      };

      let intersectFound = false;
      for (let existing of filteredConns) {
        const p1 = { id: newConn.fromId, x: newConn.fromX, y: newConn.fromY };
        const p2 = { id: newConn.toId, x: newConn.toX, y: newConn.toY };
        const p3 = { id: existing.fromId, x: existing.fromX, y: existing.fromY };
        const p4 = { id: existing.toId, x: existing.toX, y: existing.toY };

        if (isIntersect(p1, p2, p3, p4)) {
          intersectFound = true;
          break;
        }
      }

      if (intersectFound) {
        if (!soundMuted) synth.playBarrier();
        setM3ShowFeedback('wrong');
        setWrongCounts(prev => {
          const next = { ...prev, mission3: prev.mission3 + 1 };
          setCurrentStars(s => ({ ...s, mission3: calculateStars(next.mission3) }));
          return next;
        });
        setWrongModalMsg("선이 서로 겹쳤습니다! 겹치지 않게 순서를 바꿔서 연결해 보세요.");
        setM3SelectedStar(null);
        setTimeout(() => setM3ShowFeedback(null), 1500);
        return;
      }

      if (!soundMuted) synth.playConsume();
      const updatedConns = [...filteredConns, newConn];
      setM3Connections(updatedConns);
      setM3SelectedStar(null);

      if (updatedConns.length === 3) {
        if (!soundMuted) synth.playVic();
        setM3ShowFeedback('correct');
        setTimeout(() => {
          setM3Completed(true);
          setM3ShowFeedback(null);
        }, 1800);
      }
    }
  };

  const handleM3Reset = () => {
    setM3Connections([]);
    setM3SelectedStar(null);
  };

  // ----------------------------------------------------
  // [미션 4] 믿음의 길 선택 조작 핸들러
  // ----------------------------------------------------
  const handleM4Select = (idx) => {
    if (m4ShowFeedback) return;
    setM4SelectedIdx(idx);

    if (idx === 2) {
      if (!soundMuted) synth.playSuccess();
      setM4ShowFeedback('correct');
      setTimeout(() => {
        setM4Completed(true);
        setM4ShowFeedback(null);
      }, 1500);
    } else {
      if (!soundMuted) synth.playBarrier();
      setM4ShowFeedback('wrong');
      setWrongCounts(prev => {
        const next = { ...prev, mission4: prev.mission4 + 1 };
        setCurrentStars(s => ({ ...s, mission4: calculateStars(next.mission4) }));
        return next;
      });

      const feedback = idx === 0 
        ? "아브라함이 따른 것은 보물이 아니라 하나님의 말씀이었어요." 
        : "아브라함은 익숙한 곳으로 돌아가지 않고 하나님의 약속을 따라갔어요.";
      setWrongModalMsg(feedback);
      
      setTimeout(() => {
        setM4SelectedIdx(null);
        setM4ShowFeedback(null);
      }, 1800);
    }
  };

  // ----------------------------------------------------
  // [마지막 성경 퀴즈] 조작 핸들러
  // ----------------------------------------------------
  const handleQuizSelect = (idx) => {
    if (quizShowFeedback) return;
    setQuizSelectedIdx(idx);

    if (idx === 2) {
      if (!soundMuted) synth.playVic();
      setQuizShowFeedback('correct');
      setTimeout(() => {
        setQuizCompleted(true);
        setQuizShowFeedback(null);
      }, 2500);
    } else {
      if (!soundMuted) synth.playBarrier();
      setQuizShowFeedback('wrong');
      setWrongCounts(prev => {
        const next = { ...prev, quiz: prev.quiz + 1 };
        setCurrentStars(s => ({ ...s, quiz: calculateStars(next.quiz) }));
        return next;
      });
      setWrongModalMsg("틀렸습니다! 아브라함이 보물이나 왕이 되기를 원했는지, 아니면 하나님의 부르심에 순종했는지 다시 생각해 보세요.");
      setTimeout(() => {
        setQuizSelectedIdx(null);
        setQuizShowFeedback(null);
      }, 1800);
    }
  };

  // ----------------------------------------------------
  // [종료 및 저장 핸들러]
  // ----------------------------------------------------
  const handleAllComplete = () => {
    const totalStarCount = currentStars.mission1 + currentStars.mission2 + currentStars.mission3 + currentStars.mission4 + currentStars.quiz;
    const scoreEarned = 55 + totalStarCount * 5;

    try {
      localStorage.setItem('bible_quiz_stage6_stars', totalStarCount.toString());
      localStorage.setItem('bible_quiz_stage6_badge', 'true');
      localStorage.setItem('bible_quiz_stage6_completed', 'true');

      const savedScore = parseInt(localStorage.getItem('bible_quiz_score') || '0', 10);
      localStorage.setItem('bible_quiz_score', (savedScore + scoreEarned).toString());

      const currentCompleted = JSON.parse(localStorage.getItem('bible_quiz_completed_puzzles') || '[]');
      if (!currentCompleted.includes(puzzleId || 'puzzle-006')) {
        currentCompleted.push(puzzleId || 'puzzle-006');
        localStorage.setItem('bible_quiz_completed_puzzles', JSON.stringify(currentCompleted));
      }
    } catch (e) {
      console.warn("Storage save fail:", e);
    }

    onSolved(puzzleId || 'puzzle-006', scoreEarned);
  };

  const handleRestartAll = () => {
    setSubPhase('intro');
    setIntroDialogIdx(0);
    setWrongCounts({ mission1: 0, mission2: 0, mission3: 0, mission4: 0, quiz: 0 });
    setCurrentStars({ mission1: 3, mission2: 3, mission3: 3, mission4: 3, quiz: 3 });

    setM1Selected([]);
    setM1Completed(false);
    setM2Completed(false);
    setM3Connections([]);
    setM3SelectedStar(null);
    setM3Completed(false);
    setM4SelectedIdx(null);
    setM4Completed(false);
    setQuizSelectedIdx(null);
    setQuizCompleted(false);
  };

  const getActiveHintText = () => {
    if (subPhase === 'mission1') {
      return "물을 마시고(물주머니 🏺), 음식을 먹고(양식 주머니 🌾), 잠을 자며(천막 ⛺), 걸을 때(지팡이 🦯) 필요한 4가지 여행 필수 짐을 챙기세요.";
    }
    if (subPhase === 'mission2') {
      return "하란에서 출발한 길이 막힌 돌산(X)으로 막히지 않고, 타일의 출구 방향이 정확히 연결되어 가나안까지 하나의 연속된 길을 이루어야 합니다.";
    }
    if (subPhase === 'mission3') {
      return "같은 색깔 별을 연결해야 합니다. 다만 선들이 서로 엇갈리게 X자로 겹쳐선 안 되므로 빈 공간을 찾아 차례로 조율해 연결하세요.";
    }
    if (subPhase === 'mission4') {
      return "오프닝에서 하나님이 말씀하신 인도하심과 이전 길 찾기, 별자리 미션에서 우리를 비추어 이끌었던 동일한 별빛을 찾아보세요.";
    }
    if (subPhase === 'quiz') {
      return "히브리서 11장 8절은 아브라함이 갈 바를 알지 못하고 나아갔으나 하나님의 부르심에 믿음으로 순종했다고 말씀합니다.";
    }
    return "믿음의 조상 아브라함과 함께 하시는 하나님의 약속을 찾아보세요!";
  };

  return (
    <div className="flex-1 flex flex-col justify-between relative bg-[#131c2c] text-[#fdf8eb] overflow-hidden select-none font-layton-myeongjo">
      
      {subPhase !== 'intro' && subPhase !== 'complete' && (
        <div className="bg-[#1a2536] border-b border-layton-gold/30 px-3 py-2 flex justify-between items-center text-xs z-20">
          <span className="font-bold text-[#e6a817]">⛺ Stage 6: 약속을 따라 출발!</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!soundMuted) synth.playClick();
                setShowHint(true);
              }}
              className="bg-amber-500/20 border border-amber-500 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5"
            >
              💡 힌트
            </button>
            <button
              onClick={() => setSoundMuted(p => !p)}
              className="text-stone-400 hover:text-stone-200"
            >
              {soundMuted ? '🔇' : '🎵'}
            </button>
            <span className="text-yellow-400 font-bold">⭐ {
              subPhase === 'mission1' ? currentStars.mission1 :
              subPhase === 'mission2' ? currentStars.mission2 :
              subPhase === 'mission3' ? currentStars.mission3 :
              subPhase === 'mission4' ? currentStars.mission4 : currentStars.quiz
            }개</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* ----------------- SUBPHASE: INTRO ----------------- */}
        {subPhase === 'intro' && (
          <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-[#0b101d] via-[#151f33] to-[#0a0d16]">
            <div className="text-center mt-2">
              <span className="text-[9px] bg-amber-500 text-[#2c1a0c] font-black px-2 py-0.5 rounded-full font-sans">
                STAGE 6. COVENANT
              </span>
              <h1 className="font-black text-lg text-layton-gold mt-1.5 drop-shadow-md">
                약속을 따라 출발!
              </h1>
              <p className="text-[10px] text-stone-400 font-sans mt-0.5">아브라함의 믿음과 순종</p>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center my-3 px-2">
              <div className="w-full max-w-[280px] bg-[#1a2536]/80 rounded-2xl border-2 border-layton-gold/40 p-3 shadow-inner relative flex flex-col gap-2">
                <p className="text-[10px] text-left leading-relaxed text-layton-cream break-keep">
                  하나님께서 아브라함에게 고향을 떠나 새로운 땅으로 가라고 말씀하셨어요. 하지만 지도에는 목적지가 표시되어 있지 않아요. 하나님의 말씀을 믿고 약속의 길을 찾아보세요!
                </p>
                <div className="bg-[#121b28] border border-blue-900 rounded-lg p-2 mt-1">
                  <p className="text-[9px] text-[#afd4ff] font-medium leading-relaxed italic text-center font-serif">
                    "너는 너의 고향과 친척과 아버지의 집을 떠나 내가 네게 보여 줄 땅으로 가라"<br/>
                    <span className="text-[8px] text-stone-500 font-sans not-italic block mt-1">- 창세기 12장 1절 -</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#2d1a0c] border-2 border-layton-gold rounded-2xl p-3 shadow-lg relative mx-2 mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] bg-[#dca853] text-[#2c1a0c] px-2 py-0.2 rounded font-black font-sans">
                  {introDialogIdx === 0 ? "TIKI" : "TAKA"}
                </span>
                <span className="text-[8px] text-stone-500 font-sans">{introDialogIdx + 1} / 2</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#ffeedd] text-left min-h-[36px] font-layton-myeongjo">
                {introDialogIdx === 0 
                  ? "“어디로 가야 하는지도 모르는데 정말 출발할 수 있을까?”"
                  : "“아브라함은 모든 것을 알았기 때문에 떠난 것이 아니야. 하나님을 믿었기 때문에 떠난 거야!”"
                }
              </p>
              
              <div className="flex justify-end gap-1.5 mt-2">
                {introDialogIdx > 0 && (
                  <button 
                    onClick={() => {
                      if (!soundMuted) synth.playClick();
                      setIntroDialogIdx(0);
                    }}
                    className="text-[9px] text-stone-400 hover:text-stone-200"
                  >
                    ◀ 이전
                  </button>
                )}
                {introDialogIdx === 0 ? (
                  <button 
                    onClick={() => {
                      if (!soundMuted) synth.playClick();
                      setIntroDialogIdx(1);
                    }}
                    className="text-[9px] text-yellow-400 hover:text-yellow-300 font-bold"
                  >
                    다음 대화 ▶
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (!soundMuted) synth.playSuccess();
                      setSubPhase('mission1');
                    }}
                    className="py-1.5 px-4 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-[#2c1a0c] font-black text-[10px] rounded-xl border border-[#f2e7cb] shadow active:scale-95 transition-all"
                  >
                    믿음의 여행 시작! ➡️
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={onBack}
              className="text-stone-500 hover:text-stone-400 font-bold text-[10px] mb-1 font-sans text-center transition-colors"
            >
              ◀ 성경 지도로 돌아가기
            </button>
          </div>
        )}

        {/* ----------------- SUBPHASE: MISSION 1 ----------------- */}
        {subPhase === 'mission1' && (
          <div className="absolute inset-0 flex flex-col justify-between p-3.5 bg-[#0e1726]">
            <div className="text-center">
              <span className="text-[8px] bg-[#ffd700]/20 border border-[#ffd700] text-yellow-300 px-2 py-0.2 rounded-full uppercase">
                MISSION 1 / 4
              </span>
              <h2 className="font-black text-sm text-layton-cream mt-1 font-layton-myeongjo">
                여행 짐을 준비하라!
              </h2>
              <p className="text-[10px] text-stone-400 leading-tight mt-0.5 break-keep">
                아브라함이 먼 길을 떠날 수 있도록 필요한 물건을 가방에 넣어주세요. (4개 선택)
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center my-3 relative">
              <div className="w-full max-w-[290px] bg-[#1c2a3f]/75 border-2 border-layton-gold rounded-2xl p-3 flex flex-col items-center shadow-inner relative">
                <span className="text-3xl mb-1">🎒</span>
                <span className="text-[9px] text-layton-gold/80 font-bold mb-2">아브라함의 짐 가방 ({m1Selected.length} / 4)</span>
                
                <div className="grid grid-cols-4 gap-2 w-full justify-center">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const selectedItemId = m1Selected[idx];
                    const item = m1Items.find(i => i.id === selectedItemId);
                    return (
                      <div 
                        key={idx}
                        onClick={() => item && handleM1ItemClick(item.id)}
                        className={`aspect-square rounded-xl border-2 flex items-center justify-center text-xl relative shadow-md transition-all duration-150 ${
                          item 
                            ? 'border-yellow-500 bg-[#354c6d] cursor-pointer hover:scale-105 active:scale-95' 
                            : 'border-dashed border-stone-600 bg-stone-900/40'
                        }`}
                      >
                        {item ? (
                          <>
                            <span>{item.emoji}</span>
                            <span className="absolute bottom-0.5 text-[6px] text-stone-300 leading-none truncate w-full px-0.5 text-center font-sans">
                              {item.label}
                            </span>
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7px] font-black border border-red-500">
                              ✕
                            </span>
                          </>
                        ) : (
                          <span className="text-stone-700 text-xs">?</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-[#121c2c]/90 border border-layton-gold/25 rounded-2xl p-3 relative shadow-lg">
              <span className="text-[8px] text-stone-500 block mb-1.5 text-left font-sans">🎁 선택할 수 있는 물건들 (터치하여 가방에 담기)</span>
              
              <div className="grid grid-cols-4 gap-2">
                {m1Items.map(item => {
                  const isSelected = m1Selected.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleM1ItemClick(item.id)}
                      className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-150 ${
                        isSelected 
                          ? 'border-yellow-500 bg-amber-500/10 opacity-40 cursor-not-allowed'
                          : 'border-layton-gold/25 bg-[#17253a] hover:border-yellow-400 active:scale-90 hover:scale-102'
                      }`}
                    >
                      <span className="text-xl mb-1">{item.emoji}</span>
                      <span className="text-[8px] font-black text-layton-cream leading-tight font-sans">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleM1Submit}
                className="w-full mt-3 py-2 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow-lg active:scale-95 transition-all duration-150"
              >
                짐 챙기기 완료! 💼
              </button>
            </div>

            {m1Completed && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-5">
                <div className="bg-[#1c2a3f] rounded-2xl border-4 border-layton-gold p-5 shadow-2xl w-full max-w-[290px] flex flex-col items-center solved-banner text-center">
                  <span className="text-4xl mb-2">⛺</span>
                  <h3 className="font-layton-myeongjo font-black text-sm text-yellow-400 mb-2">
                    여행 준비 완료!
                  </h3>
                  <p className="text-[#ffeedd] text-[10px] leading-relaxed mb-4 break-keep">
                    물주머니, 양식 주머니, 천막, 지팡이 가방 포장 완료!<br/>
                    아브라함은 편안한 생활에 머물지 않고 하나님의 말씀에 순종하기 위해 순종의 첫걸음을 떼었어요.
                  </p>
                  
                  <div className="bg-[#121c2c] border border-blue-900 rounded-lg p-2 mb-4 w-full">
                    <p className="text-[10px] text-[#afd4ff] font-medium leading-relaxed italic text-center font-serif">
                      “아브라함은 편안한 생활에 머물지 않고 하나님의 말씀에 순종했어!”
                    </p>
                  </div>

                  <button
                    onClick={() => setSubPhase('mission2')}
                    className="w-full py-2 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-layton-dark text-xs font-black rounded-xl border-2 border-[#f2e7cb] shadow active:scale-95 transition-all"
                  >
                    약속의 길 찾기 ➡️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUBPHASE: MISSION 2 ----------------- */}
        {subPhase === 'mission2' && (
          <div className="absolute inset-0 flex flex-col justify-between p-3 bg-[#0d1624]">
            <div className="text-center">
              <span className="text-[8px] bg-[#ffd700]/20 border border-[#ffd700] text-yellow-300 px-2 py-0.2 rounded-full uppercase">
                MISSION 2 / 4
              </span>
              <h2 className="font-black text-sm text-layton-cream mt-1 font-layton-myeongjo">
                약속의 길을 연결하라!
              </h2>
              <p className="text-[9px] text-stone-400 leading-tight mt-0.5 break-keep">
                뒤섞인 길 조각 타일을 터치(회전)하여 하란에서 가나안까지 끊어지지 않게 이어주세요.
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center my-2.5">
              <div className="grid grid-cols-4 gap-1 p-2 bg-[#1b2738] border-2 border-layton-gold rounded-2xl relative shadow-inner w-full max-w-[280px] aspect-square">
                {m2Tiles.map(tile => {
                  return (
                    <button
                      key={tile.id}
                      onClick={() => handleM2TileClick(tile.id)}
                      className={`relative rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all duration-150 ${
                        tile.type === 'X' 
                          ? 'border-[#2d1b0f] bg-[#1a140f] opacity-80 cursor-default'
                          : 'border-layton-gold/30 bg-[#24354c] hover:border-yellow-400 hover:bg-[#2c405a] active:scale-95'
                      }`}
                      style={{
                        transform: `rotate(${tile.rot * 90}deg)`,
                        transition: 'transform 0.15s ease-out'
                      }}
                    >
                      {tile.type === 'I' && (
                        <div className="absolute bg-[#cca762] w-4 h-full"></div>
                      )}
                      
                      {tile.type === 'L' && (
                        <div className="absolute w-full h-full">
                          <div className="absolute bg-[#cca762] w-4 h-1/2 top-0 left-1/2 -translate-x-1/2"></div>
                          <div className="absolute bg-[#cca762] h-4 w-1/2 top-1/2 left-1/2 -translate-y-1/2"></div>
                          <div className="absolute bg-[#cca762] w-4 h-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
                        </div>
                      )}

                      {tile.type === 'T' && (
                        <div className="absolute w-full h-full">
                          <div className="absolute bg-[#cca762] w-4 h-full left-1/2 -translate-x-1/2"></div>
                          <div className="absolute bg-[#cca762] h-4 w-1/2 top-1/2 left-1/2 -translate-y-1/2"></div>
                        </div>
                      )}

                      {tile.type === 'X' && (
                        <span className="text-lg opacity-70">🪨</span>
                      )}

                      {tile.label && (
                        <div 
                          className="absolute text-[8px] bg-red-800 text-white font-extrabold px-1 rounded absolute top-1 left-1"
                          style={{ transform: `rotate(-${tile.rot * 90}deg)` }}
                        >
                          {tile.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121c2c]/90 border border-layton-gold/25 rounded-2xl p-3 relative shadow-lg">
              <button
                onClick={handleM2Submit}
                className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow-lg active:scale-95 transition-all duration-150"
              >
                🛣️ 연결된 길 확인하기
              </button>
            </div>

            {m2Completed && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-5">
                <div className="bg-[#1c2a3f] rounded-2xl border-4 border-layton-gold p-5 shadow-2xl w-full max-w-[290px] flex flex-col items-center solved-banner text-center">
                  <span className="text-4xl mb-2">🛣️</span>
                  <h3 className="font-layton-myeongjo font-black text-sm text-yellow-400 mb-2">
                    약속의 길이 열렸어요!
                  </h3>
                  <p className="text-[#ffeedd] text-[10px] leading-relaxed mb-4 break-keep">
                    하란을 출발해 광야를 지나 드디어 약속의 땅 가나안까지 이어지는 아름다운 여정이 완성되었습니다.<br/>
                    아브라함은 어디로 갈지 모두 알지 못했지만 인도하실 하나님만 신뢰했어요.
                  </p>
                  
                  <div className="bg-[#121c2c] border border-blue-900 rounded-lg p-2 mb-4 w-full">
                    <p className="text-[10px] text-[#afd4ff] font-medium leading-relaxed italic text-center font-serif">
                      “아브라함은 목적지를 다 알지 못했지만 하나님께서 인도하실 것을 믿었어!”
                    </p>
                  </div>

                  <button
                    onClick={() => setSubPhase('mission3')}
                    className="w-full py-2 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-layton-dark text-xs font-black rounded-xl border-2 border-[#f2e7cb] shadow active:scale-95 transition-all"
                  >
                    약속의 별 밝히기 ➡️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUBPHASE: MISSION 3 ----------------- */}
        {subPhase === 'mission3' && (
          <div className="absolute inset-0 flex flex-col justify-between p-3.5 bg-[#0b101c]">
            <div className="text-center">
              <span className="text-[8px] bg-[#ffd700]/20 border border-[#ffd700] text-yellow-300 px-2 py-0.2 rounded-full uppercase">
                MISSION 3 / 4
              </span>
              <h2 className="font-black text-sm text-layton-cream mt-1 font-layton-myeongjo">
                약속의 별을 밝혀라!
              </h2>
              <div className="bg-[#0f1826] border border-blue-950 rounded-lg p-1.5 mt-1 max-w-[280px] mx-auto">
                <p className="text-[9px] text-[#afd4ff]/80 italic text-center font-serif leading-tight">
                  "하늘을 우러러 뭇별을 셀 수 있나 보라... 네 자손이 이와 같으리라"<br/>
                  <span className="text-[8px] text-stone-500 font-sans not-italic font-bold block mt-0.5">- 창세기 15장 5절 -</span>
                </p>
              </div>
              <p className="text-[9px] text-stone-400 leading-tight mt-1.5 break-keep">
                같은 모양/색깔의 별 두 개를 찾아 클릭(선택)해 이어주세요. 선이 서로 겹치지 않아야 해요!
              </p>
            </div>

            <div className="flex-1 relative my-3 bg-[#070b14] border-2 border-layton-gold rounded-2xl overflow-hidden shadow-inner w-full max-w-[300px] mx-auto">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {m3Connections.map((conn, idx) => {
                  let strokeColor = '#eab308';
                  if (conn.color === 'blue') strokeColor = '#3b82f6';
                  if (conn.color === 'white') strokeColor = '#ffffff';
                  return (
                    <line 
                      key={idx}
                      x1={`${conn.fromX}%`} 
                      y1={`${conn.fromY}%`} 
                      x2={`${conn.toX}%`} 
                      y2={`${conn.toY}%`}
                      stroke={strokeColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="2 2"
                    />
                  );
                })}
                
                {m3SelectedStar && (
                  <circle 
                    cx={`${m3SelectedStar.x}%`} 
                    cy={`${m3SelectedStar.y}%`} 
                    r="8" 
                    fill="none" 
                    stroke="#ffd700" 
                    strokeWidth="1" 
                    className="animate-ping"
                  />
                )}
              </svg>

              {m3Stars.map(star => {
                const isSelected = m3SelectedStar?.id === star.id;
                const isConnected = m3Connections.some(c => c.fromId === star.id || c.toId === star.id);
                
                let glowColor = 'shadow-[0_0_10px_#eab308]';
                if (star.color === 'blue') glowColor = 'shadow-[0_0_10px_#3b82f6]';
                if (star.color === 'white') glowColor = 'shadow-[0_0_10px_#ffffff]';

                return (
                  <button
                    key={star.id}
                    onClick={() => handleM3StarClick(star)}
                    className={`absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center text-xl transition-all duration-150 z-10 ${glowColor} ${
                      isSelected 
                        ? 'border-yellow-400 scale-125 bg-amber-500/30' 
                        : isConnected 
                          ? 'border-emerald-500 bg-emerald-500/10 opacity-70' 
                          : 'border-layton-gold/45 bg-[#17253a]/60 hover:scale-110 active:scale-90'
                    }`}
                    style={{ left: `${star.x}%`, top: `${star.y}%` }}
                  >
                    <span>{star.emoji}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#121c2c]/90 border border-layton-gold/25 rounded-2xl p-2.5 relative shadow-lg flex justify-between items-center gap-4">
              <span className="text-[8px] text-stone-400 text-left leading-snug">연결된 별자리: <span className="font-bold text-yellow-300">{m3Connections.length} / 3</span> 개</span>
              <button
                onClick={handleM3Reset}
                className="px-4 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 text-[10px] font-bold rounded-xl border border-stone-500"
              >
                🔄 다시 긋기
              </button>
            </div>

            {m3Completed && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-5">
                <div className="bg-[#1c2a3f] rounded-2xl border-4 border-layton-gold p-5 shadow-2xl w-full max-w-[290px] flex flex-col items-center solved-banner text-center">
                  <span className="text-4xl mb-2">✨</span>
                  <h3 className="font-layton-myeongjo font-black text-sm text-yellow-400 mb-2">
                    약속의 별이 빛나요!
                  </h3>
                  <p className="text-[#ffeedd] text-[10px] leading-relaxed mb-4 break-keep">
                    어두운 광야의 밤하늘을 촘촘히 잇는 세 개의 약속의 별자리가 모두 완성되었습니다!<br/>
                    아브라함에게는 당장 자식 하나 없었지만, 하늘을 뒤덮은 무수한 별을 보며 하나님의 영원한 언약을 의심치 않았습니다.
                  </p>
                  
                  <div className="bg-[#121c2c] border border-blue-900 rounded-lg p-2 mb-4 w-full">
                    <p className="text-[10px] text-[#afd4ff] font-medium leading-relaxed italic text-center font-serif">
                      “아브라함에게는 아직 많은 자손이 보이지 않았지만 하나님의 약속을 믿었어!”
                    </p>
                  </div>

                  <button
                    onClick={() => setSubPhase('mission4')}
                    className="w-full py-2 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-layton-dark text-xs font-black rounded-xl border-2 border-[#f2e7cb] shadow active:scale-95 transition-all"
                  >
                    믿음의 선택하기 ➡️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUBPHASE: MISSION 4 ----------------- */}
        {subPhase === 'mission4' && (
          <div className="absolute inset-0 flex flex-col justify-between p-3.5 bg-[#0b101c]">
            <div className="text-center">
              <span className="text-[8px] bg-[#ffd700]/20 border border-[#ffd700] text-yellow-300 px-2 py-0.2 rounded-full uppercase">
                MISSION 4 / 4
              </span>
              <h2 className="font-black text-sm text-layton-cream mt-1 font-layton-myeongjo">
                믿음의 길을 선택하라!
              </h2>
              <p className="text-[10px] text-stone-400 leading-tight mt-0.5 break-keep">
                세 개의 갈림길을 신중하게 관찰해 보세요. 아브라함이 걸어갔던 믿음의 진짜 약속의 길은 무엇인가요?
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-3.5 my-4 px-2">
              {[
                { label: "💰 황금과 보물상자가 가득한 길", detail: "번쩍이는 보물과 부가 놓인 넓고 편한 길" },
                { label: "🏙️ 화려한 도시로 다시 돌아가는 길", detail: "이전의 하란과 갈대아 우르로 되돌아가는 익숙한 길" },
                { label: "✨ 작은 별빛이 이어지는 조용한 길", detail: "하나님의 언약의 별들이 은은하게 길잡이를 해주는 길" }
              ].map((road, idx) => {
                const isSelected = m4SelectedIdx === idx;
                const isWrong = m4SelectedIdx !== null && m4SelectedIdx !== 2 && isSelected;
                return (
                  <button
                    key={idx}
                    onClick={() => handleM4Select(idx)}
                    className={`w-full p-3 rounded-2xl border-2 text-left relative transition-all duration-200 hover:scale-[1.01] active:scale-95 ${
                      isSelected 
                        ? isWrong
                          ? 'border-red-600 bg-red-950/20'
                          : 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'border-layton-gold/25 bg-[#17253a] hover:border-yellow-400'
                    }`}
                  >
                    <span className="font-layton-myeongjo font-bold text-xs text-layton-cream block">
                      {road.label}
                    </span>
                    <span className="text-[8px] text-stone-400 block mt-1 font-sans">
                      {road.detail}
                    </span>

                    {isSelected && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                        {isWrong ? '❌' : '✅'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-[#121c2c]/90 border border-layton-gold/25 rounded-2xl p-3 text-center shadow-lg">
              <p className="text-[9px] text-[#afd4ff]/90 leading-tight">
                💡 힌트: 이전 미션과 오프닝에서 아브라함을 계속 비추던 신성한 인도자를 따라가 보세요!
              </p>
            </div>

            {m4Completed && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-5">
                <div className="bg-[#1c2a3f] rounded-2xl border-4 border-layton-gold p-5 shadow-2xl w-full max-w-[290px] flex flex-col items-center solved-banner text-center">
                  <span className="text-4xl mb-2">⛺</span>
                  <h3 className="font-layton-myeongjo font-black text-sm text-yellow-400 mb-2">
                    믿음의 결단!
                  </h3>
                  <p className="text-[#ffeedd] text-[10px] leading-relaxed mb-4 break-keep">
                    성공입니다! 아브라함은 세상의 헛된 황금이나 고향으로의 편안한 회귀를 택하지 않고, 
                    말씀을 인도하는 소박하고 고요한 별빛 길을 꿋꿋하게 골라 걸어갔습니다.
                  </p>
                  
                  <div className="bg-[#121c2c] border border-blue-900 rounded-lg p-2 mb-4 w-full">
                    <p className="text-[10px] text-[#afd4ff] font-medium leading-relaxed italic text-center font-serif">
                      “눈에 다 보이지 않아도 하나님의 말씀을 믿고 순종하는 것이 믿음이구나!”
                    </p>
                  </div>

                  <button
                    onClick={() => setSubPhase('quiz')}
                    className="w-full py-2 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-layton-dark text-xs font-black rounded-xl border-2 border-[#f2e7cb] shadow active:scale-95 transition-all"
                  >
                    마지막 성경 퀴즈 ➡️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUBPHASE: QUIZ ----------------- */}
        {subPhase === 'quiz' && (
          <div className="absolute inset-0 flex flex-col justify-between p-3.5 bg-[#0f1019]">
            <div className="text-center">
              <span className="text-[8px] bg-red-700/25 border border-red-500 text-red-300 px-2.5 py-0.5 rounded-full font-sans font-black">
                LAST QUIZ
              </span>
              <h2 className="font-black text-sm text-layton-cream mt-1.5 font-layton-myeongjo">
                최종 성경 퀴즈
              </h2>
            </div>

            <div className="flex-1 flex flex-col justify-between bg-[#151c2d] border-4 border-layton-gold rounded-2xl p-4 shadow-inner relative my-3">
              <div className="absolute inset-1 border border-blue-900 rounded-xl pointer-events-none opacity-40"></div>

              <div className="flex-1 flex items-center justify-center px-1">
                <p className="text-center font-layton-myeongjo font-bold text-xs text-[#fdf8eb] leading-relaxed break-keep">
                  "아브라함은 어디로 가는지 정확히 알지 못하면서도 왜 고향을 떠나 출발했을까요?"
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  "1. 보물을 찾기 위해서",
                  "2. 유명한 왕이 되기 위해서",
                  "3. 하나님의 말씀과 약속을 믿었기 때문에",
                  "4. 길을 잃어버렸기 때문에"
                ].map((optText, idx) => {
                  const isSelected = quizSelectedIdx === idx;
                  const isWrong = quizSelectedIdx !== null && quizSelectedIdx !== 2 && isSelected;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizSelect(idx)}
                      className={`w-full py-2 text-xs font-black rounded-xl border-2 shadow-[0_3px_5px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-150 text-center ${
                        isSelected 
                          ? isWrong
                            ? 'bg-red-800 text-white border-red-500'
                            : 'bg-emerald-700 text-white border-emerald-400'
                          : 'bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-layton-dark border-[#f2e7cb]'
                      }`}
                    >
                      {optText}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#1a2336] p-2 rounded-xl text-center border border-layton-gold/20 shadow">
              <span className="text-[8px] text-stone-500">정답을 맞추면 성경 퀴즈 나라의 보물 Picarats 점수를 획득합니다!</span>
            </div>

            {quizCompleted && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-5">
                <div className="bg-[#1c2a3f] rounded-2xl border-4 border-layton-gold p-5 shadow-2xl w-full max-w-[290px] flex flex-col items-center solved-banner text-center">
                  <span className="text-4xl mb-2">🏆</span>
                  <h3 className="font-layton-myeongjo font-black text-sm text-yellow-400 mb-2">
                    성경 퀴즈 성공!
                  </h3>
                  <p className="text-[#ffeedd] text-[10px] leading-relaxed mb-4 break-keep">
                    정답입니다! 아브라함은 모든 것을 다 미리 알고서 출발한 것이 아닙니다.<br/>
                    오직 하나님께서 축복을 부르시고 약속하셨기 때문에 믿고 순종한 것이었어요.
                  </p>

                  <div className="bg-[#121c2c] border border-blue-900 rounded-lg p-2 mb-4 w-full">
                    <p className="text-[10px] text-[#afd4ff] font-medium leading-relaxed italic text-center font-serif">
                      “아브라함은 모든 일을 미리 알고 떠난 것이 아니에요. 하나님께서 말씀하셨기 때문에 믿고 순종했어요.”
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSubPhase('complete');
                      handleAllComplete();
                    }}
                    className="w-full py-2 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-layton-dark text-xs font-black rounded-xl border-2 border-[#f2e7cb] shadow active:scale-95 transition-all"
                  >
                    믿음의 결단하기 ➡️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUBPHASE: COMPLETE ----------------- */}
        {subPhase === 'complete' && (
          <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-[#0b101d] via-[#1c2536] to-[#0a0d16]">
            <div className="text-center mt-2">
              <span className="text-[9px] bg-emerald-500 text-stone-900 font-extrabold px-3 py-0.5 rounded-full uppercase">
                SOLVED!
              </span>
              <h1 className="font-black text-lg text-layton-gold mt-1.5">
                믿음의 여행을 완성했어요!
              </h1>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center my-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 p-1 shadow-2xl relative flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#1c2a3f] border-2 border-layton-gold/60 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl">⛺</span>
                  <span className="text-[7px] font-black text-yellow-300 tracking-tighter uppercase mt-1">
                    약속을 믿는 사람
                  </span>
                </div>
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[7px] font-black px-1.5 py-0.2 rounded border border-red-500 rotate-[10deg] shadow uppercase">
                  ACTIVE
                </span>
              </div>

              <div className="w-full max-w-[280px] bg-[#1a2536]/80 rounded-2xl border-2 border-layton-gold/45 p-3.5 shadow-inner mt-4">
                <h4 className="font-bold text-[10px] text-layton-gold mb-2 border-b border-layton-gold/15 pb-1">📈 모험 스탯 리포트</h4>
                
                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-[#ffeedd]">
                  <div className="flex justify-between"><span>🎒 미션 1 별점:</span> <span className="font-bold text-yellow-300">⭐ {currentStars.mission1}개</span></div>
                  <div className="flex justify-between"><span>🛣️ 미션 2 별점:</span> <span className="font-bold text-yellow-300">⭐ {currentStars.mission2}개</span></div>
                  <div className="flex justify-between col-span-2 border-t border-layton-gold/10 pt-1"><span>✨ 미션 3 별점:</span> <span className="font-bold text-yellow-300">⭐ {currentStars.mission3}개</span></div>
                  <div className="flex justify-between col-span-2"><span>🗺️ 미션 4 별점:</span> <span className="font-bold text-yellow-300">⭐ {currentStars.mission4}개</span></div>
                  <div className="flex justify-between col-span-2"><span>❓ 성경 퀴즈 별점:</span> <span className="font-bold text-yellow-300">⭐ {currentStars.quiz}개</span></div>
                  
                  <div className="flex justify-between col-span-2 border-t border-layton-gold/25 pt-1.5 mt-1 font-bold text-xs text-yellow-400">
                    <span>총 획득 별:</span>
                    <span>⭐ {currentStars.mission1 + currentStars.mission2 + currentStars.mission3 + currentStars.mission4 + currentStars.quiz} / 15개</span>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[280px] bg-[#121c2c] border border-blue-900 rounded-xl p-2.5 mt-3 shadow">
                <p className="text-[9px] text-[#afd4ff] leading-relaxed italic text-center font-serif">
                  "아브람이 여호와를 믿으니 여호와께서 이를 그의 의로 여기시고"<br/>
                  <span className="text-[8px] text-stone-500 font-sans not-italic font-bold block mt-0.5">- 창세기 15장 6절 -</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto mb-2">
              <button
                onClick={() => {
                  if (!soundMuted) synth.playSuccess();
                  if (onSelectPuzzle) {
                    onSelectPuzzle('puzzle-007');
                  } else {
                    onBack();
                  }
                }}
                className="w-full py-2 bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white text-xs font-black rounded-xl border border-emerald-400 shadow active:scale-95 transition-all"
              >
                ⏭️ 다음 스테이지 (이삭과 야곱)
              </button>
              <button
                onClick={handleRestartAll}
                className="w-full py-2 bg-[#2d3a4f] hover:bg-[#3d4d68] text-white text-xs font-bold rounded-xl border border-blue-800 shadow active:scale-95 transition-all"
              >
                🔄 이 스테이지 다시 도전하기
              </button>
              <button
                onClick={onBack}
                className="w-full py-2 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-[#2c1a0c] font-black text-xs rounded-xl border border-[#f2e7cb] shadow active:scale-95 transition-all"
              >
                🗺️ 스테이지 선택으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>

      {showHint && (
        <div className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-[2px] z-50 flex items-center justify-center p-5 font-layton-myeongjo">
          <div className="bg-[#1c2a3f] rounded-2xl border-4 border-layton-gold p-4.5 shadow-2xl w-full max-w-[300px] flex flex-col items-center solved-banner text-center">
            <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-2xl mb-2 text-[#2c1a0c] shadow-lg animate-pulse">💡</div>
            <h3 className="font-black text-xs text-yellow-400 mb-2 font-layton-myeongjo">수수께끼 힌트</h3>
            <p className="text-layton-cream text-[11px] leading-relaxed mb-4 break-keep font-sans">
              {getActiveHintText()}
            </p>
            <button
              onClick={() => {
                if (!soundMuted) synth.playClick();
                setShowHint(false);
              }}
              className="w-full py-2 bg-[#2a3c54] hover:bg-[#344b68] text-[#ffeedd] text-xs font-bold rounded-xl border border-blue-800 transition-colors"
            >
              알겠습니다! 돌아가기
            </button>
          </div>
        </div>
      )}

      {wrongModalMsg && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[1.5px] z-50 flex items-center justify-center p-5 font-layton-myeongjo">
          <div className="bg-[#1e130c] rounded-2xl border-4 border-red-700 p-5 shadow-2xl w-full max-w-[290px] flex flex-col items-center solved-banner text-center">
            <span className="text-3xl mb-1.5">📖</span>
            <h3 className="font-black text-sm text-red-500 mb-2">
              틀렸습니다!
            </h3>
            <p className="text-layton-cream text-[11px] leading-relaxed mb-4 break-keep font-sans">
              {wrongModalMsg}
            </p>
            <button
              onClick={() => {
                if (!soundMuted) synth.playClick();
                setWrongModalMsg(null);
              }}
              className="w-full py-2 bg-gradient-to-b from-red-700 to-red-950 hover:from-red-600 hover:to-red-800 text-[#fff5db] text-xs font-bold rounded-xl border border-red-500 shadow active:scale-95 transition-all"
            >
              다시 확인해볼게요 🔄
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
