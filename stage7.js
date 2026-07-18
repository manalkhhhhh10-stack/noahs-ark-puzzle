function PuzzleIsaacJacob({ puzzleId, coins, onSpendCoins, onBack, onSolved, onSelectPuzzle }) {
  const { useState, useEffect, useRef, useCallback } = React;

  // subPhase: 'intro' | 'mission1' | 'mission2' | 'mission3' | 'mission4' | 'finalPuzzle' | 'quiz' | 'complete'
  const [subPhase, setSubPhase] = useState('intro');
  const [introDialogIdx, setIntroDialogIdx] = useState(0);

  // 미션별 틀린 횟수 & 별점
  const [wrongCounts, setWrongCounts] = useState({ m1: 0, m2: 0, m3: 0, m4: 0, final: 0, quiz: 0 });
  const [currentStars, setCurrentStars] = useState({ m1: 3, m2: 3, m3: 3, m4: 3, final: 3, quiz: 3 });

  // 공통 UI
  const [soundMuted, setSoundMuted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongMsg, setWrongMsg] = useState(null);
  const [inputLocked, setInputLocked] = useState(false);

  // 증거 수첩
  const [notebook, setNotebook] = useState([]);
  const [showNotebook, setShowNotebook] = useState(false);

  // ─────────────────────────────────────────────
  // 공통 유틸
  // ─────────────────────────────────────────────
  const calcStars = (wrong) => wrong === 0 ? 3 : wrong <= 2 ? 2 : 1;

  const synth = {
    playClick: () => { if (soundMuted) return; try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(0.15, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.12); o.start(); o.stop(a.currentTime + 0.12); } catch(e){} },
    playSuccess: () => { if (soundMuted) return; try { const a = new (window.AudioContext || window.webkitAudioContext)(); [523, 659, 784, 1047].forEach((f, i) => { const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = f; g.gain.setValueAtTime(0.12, a.currentTime + i * 0.08); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + i * 0.08 + 0.15); o.start(a.currentTime + i * 0.08); o.stop(a.currentTime + i * 0.08 + 0.15); }); } catch(e){} },
    playWrong: () => { if (soundMuted) return; try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain(); o.type = 'sawtooth'; o.frequency.value = 200; g.gain.setValueAtTime(0.1, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.3); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.3); } catch(e){} },
  };

  const addNotebook = (card) => {
    setNotebook(prev => prev.find(c => c.id === card.id) ? prev : [...prev, card]);
  };

  const lockInput = (ms = 1800) => {
    setInputLocked(true);
    setTimeout(() => setInputLocked(false), ms);
  };

  // ─────────────────────────────────────────────
  // 오프닝 대사
  // ─────────────────────────────────────────────
  const introDialogs = [
    { speaker: '내레이터', text: '나이가 많아 눈이 잘 보이지 않는 이삭의 장막에 에서라고 주장하는 사람이 들어왔어요.' },
    { speaker: '내레이터', text: '이삭은 그의 목소리를 듣고 이상하다고 생각했어요.' },
    { speaker: '이삭', emoji: '👴', text: '"음성은 야곱의 음성이나 손은 에서의 손이로다" (창세기 27:22)' },
    { speaker: '티키 🐦', text: '목소리는 야곱인데 손은 에서의 손이라고? 뭔가 이상해!' },
    { speaker: '타카 🦜', text: '장막 안에 남겨진 단서를 관찰하면 진실을 찾을 수 있을 거야!' },
  ];

  // ─────────────────────────────────────────────
  // 미션 1: 두 형제의 물건을 구분하라
  // ─────────────────────────────────────────────
  const m1Items = [
    { id: 'bow', label: '활과 화살', emoji: '🏹', owner: 'esau' },
    { id: 'bag', label: '사냥 가방', emoji: '👜', owner: 'esau' },
    { id: 'hide', label: '들짐승 가죽', emoji: '🦌', owner: 'esau' },
    { id: 'grass', label: '들판의 풀', emoji: '🌿', owner: 'esau' },
    { id: 'stew', label: '붉은 죽 그릇', emoji: '🍲', owner: 'jacob' },
    { id: 'tool', label: '천막 도구', emoji: '🔧', owner: 'jacob' },
    { id: 'pot', label: '요리 그릇', emoji: '🫕', owner: 'jacob' },
    { id: 'staff', label: '양 떼 지팡이', emoji: '🦯', owner: 'jacob' },
  ];

  const [m1Placed, setM1Placed] = useState({ esau: [], jacob: [] }); // placed item ids
  const [m1Selected, setM1Selected] = useState(null); // selected item id from pool
  const [m1WrongIds, setM1WrongIds] = useState([]);
  const [m1Completed, setM1Completed] = useState(false);
  const [m1ShowSuccess, setM1ShowSuccess] = useState(false);

  const m1Unplaced = m1Items.filter(it => !m1Placed.esau.includes(it.id) && !m1Placed.jacob.includes(it.id));

  const handleM1SelectItem = (id) => {
    if (inputLocked || m1Completed) return;
    synth.playClick();
    setM1Selected(prev => prev === id ? null : id);
  };

  const handleM1PlaceTo = (zone) => {
    if (!m1Selected || inputLocked || m1Completed) return;
    synth.playClick();
    setM1Placed(prev => ({ ...prev, [zone]: [...prev[zone], m1Selected] }));
    setM1Selected(null);
  };

  const handleM1RemoveFrom = (zone, id) => {
    if (inputLocked || m1Completed) return;
    synth.playClick();
    setM1Placed(prev => ({ ...prev, [zone]: prev[zone].filter(x => x !== id) }));
  };

  const handleM1Check = () => {
    if (inputLocked) return;
    const allPlaced = m1Items.every(it => m1Placed.esau.includes(it.id) || m1Placed.jacob.includes(it.id));
    if (!allPlaced) { setWrongMsg('모든 물건을 배치한 후 확인해주세요!'); setTimeout(() => setWrongMsg(null), 1500); return; }

    const wrongIds = [];
    m1Items.forEach(it => {
      const zone = it.owner;
      if (!m1Placed[zone].includes(it.id)) wrongIds.push(it.id);
    });

    if (wrongIds.length === 0) {
      synth.playSuccess();
      setM1WrongIds([]);
      setM1ShowSuccess(true);
      addNotebook({ id: 'nb_esau', label: '에서 인물 카드', text: '에서는 사냥을 잘하고 들에서 활동했어요. 몸에 털이 많았어요.', emoji: '🏹' });
      addNotebook({ id: 'nb_jacob', label: '야곱 인물 카드', text: '야곱은 장막에 머물며 생활했고 피부가 매끄러웠어요.', emoji: '🫕' });
      setWrongCounts(prev => prev);
      setTimeout(() => { setM1ShowSuccess(false); setM1Completed(true); }, 2000);
    } else {
      synth.playWrong();
      setM1WrongIds(wrongIds);
      setWrongCounts(prev => { const next = { ...prev, m1: prev.m1 + 1 }; setCurrentStars(s => ({ ...s, m1: calcStars(next.m1) })); return next; });
      setWrongMsg('이 물건을 주로 사용하는 사람이 누구인지 생각해보세요.');
      lockInput(1500);
      setTimeout(() => { setM1WrongIds([]); setWrongMsg(null); }, 1800);
    }
  };

  // ─────────────────────────────────────────────
  // 미션 2: 붉은 죽 사건 카드 순서 배열
  // ─────────────────────────────────────────────
  const m2CorrectOrder = [0, 1, 2, 3]; // indices into m2Cards
  const m2Cards = [
    { id: 'c0', text: '야곱이 붉은 죽을 끓이고 있었다.', emoji: '🍲' },
    { id: 'c1', text: '에서가 들에서 지쳐 돌아왔다.', emoji: '😓' },
    { id: 'c2', text: '에서가 야곱에게 붉은 죽을 달라고 했다.', emoji: '🗣️' },
    { id: 'c3', text: '에서가 장자의 명분을 야곱에게 넘겼다.', emoji: '📜' },
  ];
  // correct order: c1 → c0? No:
  // 1. 야곱이 붉은 죽을 끓이고 있었다 (c0)
  // 2. 에서가 들에서 지쳐 돌아왔다 (c1)
  // 3. 에서가 야곱에게 붉은 죽을 달라고 했다 (c2)
  // 4. 에서가 장자의 명분을 야곱에게 넘겼다 (c3)
  // But biblical order: Esau returns first, then asks, then Jacob demands birthright
  // Correct: c1, c0, c2, c3 - No. Actually:
  // Jacob was cooking -> Esau came -> Esau asked -> Jacob demanded birthright -> Esau sold it
  // So: c0(야곱 죽 끓임) → c1(에서 돌아옴) → c2(에서가 달라고) → c3(장자 명분 넘김)
  const m2CorrectIds = ['c0', 'c1', 'c2', 'c3'];

  const shuffleOnce = (arr) => {
    let a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    // if accidentally correct, re-shuffle
    if (a.map(x => x.id).join(',') === m2CorrectIds.join(',')) {
      [a[0], a[1]] = [a[1], a[0]];
    }
    return a;
  };

  const [m2Order, setM2Order] = useState(() => shuffleOnce(m2Cards));
  const [m2SelIdx, setM2SelIdx] = useState(null);
  const [m2Completed, setM2Completed] = useState(false);
  const [m2ShowSuccess, setM2ShowSuccess] = useState(false);

  const handleM2Select = (idx) => {
    if (inputLocked || m2Completed) return;
    synth.playClick();
    if (m2SelIdx === null) { setM2SelIdx(idx); return; }
    if (m2SelIdx === idx) { setM2SelIdx(null); return; }
    // swap
    setM2Order(prev => { const a = [...prev]; [a[m2SelIdx], a[idx]] = [a[idx], a[m2SelIdx]]; return a; });
    setM2SelIdx(null);
  };

  const handleM2Move = (idx, dir) => {
    if (inputLocked || m2Completed) return;
    const target = idx + dir;
    if (target < 0 || target >= m2Order.length) return;
    synth.playClick();
    setM2Order(prev => { const a = [...prev]; [a[idx], a[target]] = [a[target], a[idx]]; return a; });
  };

  const handleM2Check = () => {
    if (inputLocked) return;
    const isCorrect = m2Order.map(c => c.id).join(',') === m2CorrectIds.join(',');
    if (isCorrect) {
      synth.playSuccess();
      setM2ShowSuccess(true);
      addNotebook({ id: 'nb_stew', label: '붉은 죽 그릇', text: '에서는 배가 고픈 순간의 욕심 때문에 소중한 장자의 명분을 가볍게 여겼어요.', emoji: '🍲' });
      addNotebook({ id: 'nb_birth', label: '장자의 명분', text: '에서는 야곱에게 장자의 명분을 팔았어요. 빵과 붉은 죽을 받고 일어났어요.', emoji: '📜' });
      setTimeout(() => { setM2ShowSuccess(false); setM2Completed(true); }, 2200);
    } else {
      synth.playWrong();
      setWrongCounts(prev => { const next = { ...prev, m2: prev.m2 + 1 }; setCurrentStars(s => ({ ...s, m2: calcStars(next.m2) })); return next; });
      const hint = wrongCounts.m2 === 0
        ? '에서는 먼저 어디에서 돌아왔을까요?'
        : '붉은 죽을 달라고 한 다음 무슨 일이 있었을까요?';
      setWrongMsg(hint);
      lockInput(1800);
      setTimeout(() => setWrongMsg(null), 2000);
    }
  };

  // ─────────────────────────────────────────────
  // 미션 3: 수상한 손님의 단서 찾기
  // ─────────────────────────────────────────────
  const m3Clues = [
    { id: 'cl_voice', label: '야곱의 목소리', desc: '목소리는 야곱의 목소리처럼 들려요.', emoji: '🗣️', x: 18, y: 22 },
    { id: 'cl_skin', label: '염소 가죽 경계선', desc: '팔의 털에 끈과 가죽의 경계가 보여요.', emoji: '🦌', x: 62, y: 48 },
    { id: 'cl_clothes', label: '에서의 사냥꾼 옷', desc: '이 옷은 에서가 입던 사냥꾼의 옷이에요.', emoji: '🧥', x: 48, y: 38 },
    { id: 'cl_food', label: '장막 안의 음식', desc: '이 음식은 들에서가 아니라 장막 안에서 만든 것 같아요.', emoji: '🫕', x: 78, y: 68 },
    { id: 'cl_cloth', label: '야곱의 요리 천', desc: '야곱이 요리할 때 사용하던 물건이 떨어져 있어요.', emoji: '🧺', x: 30, y: 72 },
  ];

  const [m3Found, setM3Found] = useState([]);
  const [m3WrongCount, setM3WrongCount] = useState(0);
  const [m3ShowClue, setM3ShowClue] = useState(null);
  const [m3Phase, setM3Phase] = useState('find'); // 'find' | 'question' | 'done'
  const [m3QuizSel, setM3QuizSel] = useState(null);
  const [m3QuizResult, setM3QuizResult] = useState(null);
  const [m3Completed, setM3Completed] = useState(false);

  const handleM3ClueClick = (clue) => {
    if (inputLocked || m3Phase !== 'find') return;
    if (m3Found.find(c => c.id === clue.id)) return;
    synth.playClick();
    setM3ShowClue(clue);
    const newFound = [...m3Found, clue];
    setM3Found(newFound);
    addNotebook({ id: clue.id, label: clue.label, text: clue.desc, emoji: clue.emoji });
    if (newFound.length === m3Clues.length) {
      setTimeout(() => { setM3ShowClue(null); setM3Phase('question'); }, 1500);
    } else {
      setTimeout(() => setM3ShowClue(null), 1400);
    }
  };

  const handleM3WrongArea = () => {
    if (inputLocked || m3Phase !== 'find') return;
    setM3WrongCount(prev => prev + 1);
    setWrongMsg('이곳에는 특별한 단서가 없어요.');
    setTimeout(() => setWrongMsg(null), 1200);
  };

  const handleM3Quiz = (idx) => {
    if (inputLocked) return;
    synth.playClick();
    setM3QuizSel(idx);
    lockInput(300);
  };

  const handleM3QuizSubmit = () => {
    if (m3QuizSel === null || inputLocked) return;
    if (m3QuizSel === 2) {
      synth.playSuccess();
      setM3QuizResult('correct');
      lockInput(1200);
      // 즉시 완료 처리 (딜레이 없음)
      setTimeout(() => {
        setM3QuizResult(null);
        setM3Phase('done');
        setM3Completed(true);
      }, 1200);
    } else {
      synth.playWrong();
      setM3QuizResult('wrong');
      setWrongCounts(prev => { const next = { ...prev, m3: prev.m3 + 1 }; setCurrentStars(s => ({ ...s, m3: calcStars(next.m3) })); return next; });
      lockInput(1600);
      setTimeout(() => { setM3QuizResult(null); setM3QuizSel(null); }, 1800);
    }
  };

  // ─────────────────────────────────────────────
  // 미션 4: 모순된 증언을 반박하라
  // ─────────────────────────────────────────────
  const m4Rounds = [
    {
      claim: '저는 이삭의 맏아들 에서입니다.',
      evidence: [
        { id: 'e1', label: '붉은 죽 그릇', emoji: '🍲', correct: false },
        { id: 'e0', label: '야곱의 목소리', emoji: '🗣️', correct: true },   // ← 2번이 정답
        { id: 'e2', label: '별이 빛나는 하늘', emoji: '✨', correct: false },
      ],
      explanation: '이삭도 그의 목소리가 야곱의 목소리라고 생각했어요.',
    },
    {
      claim: '이 털은 원래 제 팔에 난 털입니다.',
      evidence: [
        { id: 'e1', label: '사냥 가방', emoji: '👜', correct: false },
        { id: 'e2', label: '양 떼 지팡이', emoji: '🦯', correct: false },
        { id: 'e0', label: '팔에 묶인 염소 가죽', emoji: '🦌', correct: true },  // ← 3번이 정답
      ],
      explanation: '팔의 털은 진짜 털이 아니라 야곱이 붙인 염소 가죽이었어요.',
    },
    {
      claim: '제가 들에서 사냥한 고기로 음식을 만들었습니다.',
      evidence: [
        { id: 'e0', label: '장막의 요리 도구', emoji: '🫕', correct: true },  // ← 1번이 정답
        { id: 'e2', label: '들판의 풀', emoji: '🌿', correct: false },
        { id: 'e1', label: '에서의 옷', emoji: '🧥', correct: false },
      ],
      explanation: '음식은 야곱과 리브가가 장막에서 준비한 음식이었어요.',
    },
  ];

  const [m4Round, setM4Round] = useState(0);
  const [m4Selected, setM4Selected] = useState(null);
  const [m4Result, setM4Result] = useState(null); // 'correct' | 'wrong' | null
  const [m4Completed, setM4Completed] = useState(false);

  const handleM4Select = (ev) => {
    if (inputLocked || m4Result) return;
    synth.playClick();
    setM4Selected(ev.id);
  };

  const handleM4Submit = () => {
    if (!m4Selected || inputLocked) return;
    const round = m4Rounds[m4Round];
    const chosen = round.evidence.find(e => e.id === m4Selected);
    if (chosen && chosen.correct) {
      synth.playSuccess();
      setM4Result('correct');
      lockInput(1400);
      setTimeout(() => {
        setM4Result(null);
        setM4Selected(null);
        if (m4Round + 1 >= m4Rounds.length) {
          setM4Completed(true);  // 완료 → 즉시 버튼 표시
        } else {
          setM4Round(prev => prev + 1);
        }
      }, 1400);
    } else {
      synth.playWrong();
      setM4Result('wrong');
      setWrongCounts(prev => { const next = { ...prev, m4: prev.m4 + 1 }; setCurrentStars(s => ({ ...s, m4: calcStars(next.m4) })); return next; });
      setWrongMsg('말과 맞지 않는 증거를 찾아보세요.');
      lockInput(1600);
      setTimeout(() => { setM4Result(null); setM4Selected(null); setWrongMsg(null); }, 1800);
    }
  };

  // ─────────────────────────────────────────────
  // 마지막 사건 순서 퍼즐
  // ─────────────────────────────────────────────
  const finalCards = [
    { id: 'f0', text: '이삭이 에서에게 사냥한 음식 준비를 부탁했다.', emoji: '👴' },
    { id: 'f1', text: '리브가가 이삭의 말을 들었다.', emoji: '👩' },
    { id: 'f2', text: '리브가와 야곱이 음식을 준비했다.', emoji: '🫕' },
    { id: 'f3', text: '야곱이 에서의 옷과 염소 가죽으로 변장했다.', emoji: '🧥' },
    { id: 'f4', text: '야곱이 이삭에게 자신을 에서라고 말했다.', emoji: '🗣️' },
    { id: 'f5', text: '이삭이 야곱에게 축복했다.', emoji: '🙏' },
    { id: 'f6', text: '에서가 돌아와 사실을 알고 슬퍼하며 분노했다.', emoji: '😢' },
  ];
  const finalCorrectIds = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6'];

  const shuffleFinal = (arr) => {
    let a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    if (a.map(x => x.id).join(',') === finalCorrectIds.join(',')) { [a[0], a[3]] = [a[3], a[0]]; }
    return a;
  };

  const [finalOrder, setFinalOrder] = useState(() => shuffleFinal(finalCards));
  const [finalSelIdx, setFinalSelIdx] = useState(null);
  const [finalCompleted, setFinalCompleted] = useState(false);
  const [finalWrongInfo, setFinalWrongInfo] = useState(null);
  const [finalShowSuccess, setFinalShowSuccess] = useState(false);

  const handleFinalSelect = (idx) => {
    if (inputLocked || finalCompleted) return;
    synth.playClick();
    if (finalSelIdx === null) { setFinalSelIdx(idx); return; }
    if (finalSelIdx === idx) { setFinalSelIdx(null); return; }
    setFinalOrder(prev => { const a = [...prev]; [a[finalSelIdx], a[idx]] = [a[idx], a[finalSelIdx]]; return a; });
    setFinalSelIdx(null);
  };

  const handleFinalMove = (idx, dir) => {
    if (inputLocked || finalCompleted) return;
    const target = idx + dir;
    if (target < 0 || target >= finalOrder.length) return;
    synth.playClick();
    setFinalOrder(prev => { const a = [...prev]; [a[idx], a[target]] = [a[target], a[idx]]; return a; });
  };

  const handleFinalCheck = () => {
    if (inputLocked) return;
    const current = finalOrder.map(c => c.id).join(',');
    const correct = finalCorrectIds.join(',');
    if (current === correct) {
      synth.playSuccess();
      setFinalShowSuccess(true);
      setTimeout(() => { setFinalShowSuccess(false); setFinalCompleted(true); }, 2500);
    } else {
      synth.playWrong();
      const wrongCount = finalOrder.filter((c, i) => c.id !== finalCorrectIds[i]).length;
      setWrongCounts(prev => { const next = { ...prev, final: prev.final + 1 }; setCurrentStars(s => ({ ...s, final: calcStars(next.final) })); return next; });
      setFinalWrongInfo(`${wrongCount}장의 카드 위치가 잘못됐어요. 다시 확인해보세요.`);
      lockInput(2000);
      setTimeout(() => setFinalWrongInfo(null), 2200);
    }
  };

  // ─────────────────────────────────────────────
  // 성경 퀴즈
  // ─────────────────────────────────────────────
  const quizItems = [
    {
      q: '이삭은 왜 자신 앞에 선 사람을 수상하게 생각했을까요?',
      choices: [
        '음식을 가져오지 않아서',
        '장막 밖에 서 있어서',
        '목소리는 야곱인데 손은 에서처럼 느껴져서',
        '옷이 너무 화려해서',
      ],
      answer: 2, // 3번이 정답
    },
    {
      q: '야곱의 거짓말로 가족에게 어떤 일이 생겼을까요?',
      choices: [
        '모두가 큰 잔치를 열었다.',
        '아무 일도 생기지 않았다.',
        '형제 사이가 더욱 좋아졌다.',
        '형제 사이에 미움과 갈등이 생겼다.',
      ],
      answer: 3, // 4번이 정답
    },
  ];
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSel, setQuizSel] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleQuizSubmit = () => {
    if (quizSel === null || inputLocked) return;
    const correct = quizItems[quizIdx].answer;
    if (quizSel === correct) {
      synth.playSuccess();
      setQuizResult('correct');
      lockInput(1800);
      setTimeout(() => {
        setQuizResult(null);
        setQuizSel(null);
        if (quizIdx + 1 >= quizItems.length) {
          setQuizCompleted(true);
          handleStageComplete();
        } else {
          setQuizIdx(prev => prev + 1);
        }
      }, 1800);
    } else {
      synth.playWrong();
      setQuizResult('wrong');
      setWrongCounts(prev => { const next = { ...prev, quiz: prev.quiz + 1 }; setCurrentStars(s => ({ ...s, quiz: calcStars(next.quiz) })); return next; });
      lockInput(1600);
      setTimeout(() => { setQuizResult(null); setQuizSel(null); }, 1800);
    }
  };

  // ─────────────────────────────────────────────
  // 완료 처리 & localStorage 저장
  // ─────────────────────────────────────────────
  const handleStageComplete = () => {
    const totalStars = Object.values(currentStars).reduce((a, b) => a + b, 0);
    const maxStars = 15;
    const earned = Math.min(totalStars, maxStars);

    const prev = JSON.parse(localStorage.getItem('stage7_progress') || '{}');
    const best = Math.max(prev.bestStars || 0, earned);

    localStorage.setItem('stage7_progress', JSON.stringify({
      completed: true,
      bestStars: best,
      badge: '진실을 밝힌 탐정',
      badgeEarned: true,
    }));

    const completedPuzzles = JSON.parse(localStorage.getItem('bible_quiz_completed_puzzles') || '[]');
    if (!completedPuzzles.includes('puzzle-007')) {
      completedPuzzles.push('puzzle-007');
      localStorage.setItem('bible_quiz_completed_puzzles', JSON.stringify(completedPuzzles));
    }

    if (onSolved) onSolved('puzzle-007', earned * 4);

    setTimeout(() => setSubPhase('complete'), 800);
  };

  // ─────────────────────────────────────────────
  // 힌트 텍스트
  // ─────────────────────────────────────────────
  const hintTexts = {
    mission1: '활과 화살은 사냥하는 사람이 사용해요. 요리 그릇은 장막에 머물던 사람과 관련이 있어요.',
    mission2: '야곱이 죽을 끓이는 것을 에서가 보았을 때 무슨 일이 일어났나요?',
    mission3: '야곱은 에서 행세를 하기 위해 무엇을 준비했을까요?',
    mission4: '말과 맞지 않는 증거를 찾아보세요.',
    finalPuzzle: '이삭의 부탁에서 에서의 분노까지 차례로 생각해보세요.',
    quiz: '성경 말씀 창세기 27장 22절을 떠올려보세요.',
  };

  const currentHint = hintTexts[subPhase] || '';

  // ─────────────────────────────────────────────
  // 상단 헤더
  // ─────────────────────────────────────────────
  const missionLabels = { intro: '', mission1: '1/4', mission2: '2/4', mission3: '3/4', mission4: '4/4', finalPuzzle: '마지막', quiz: '퀴즈', complete: '완료' };

  const Header = () => (
    <div style={{ background: 'linear-gradient(135deg, #78350f, #92400e)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #fbbf24' }}>
      <div>
        <div style={{ color: '#fcd34d', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>STAGE 7</div>
        <div style={{ color: '#fef3c7', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>축복의 장막, 수상한 손님</div>
        {missionLabels[subPhase] && <div style={{ color: '#fbbf24', fontSize: 9 }}>미션 {missionLabels[subPhase]}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={() => setShowNotebook(true)} style={{ background: '#fef3c7', border: '1px solid #b45309', borderRadius: 6, padding: '3px 7px', fontSize: 11, cursor: 'pointer' }}>📓 {notebook.length}</button>
        <button onClick={() => setShowHint(true)} style={{ background: '#fef3c7', border: '1px solid #b45309', borderRadius: 6, padding: '3px 7px', fontSize: 11, cursor: 'pointer' }}>💡</button>
        <button onClick={() => setSoundMuted(p => !p)} style={{ background: soundMuted ? '#e5e7eb' : '#fef3c7', border: '1px solid #b45309', borderRadius: 6, padding: '3px 7px', fontSize: 11, cursor: 'pointer' }}>{soundMuted ? '🔇' : '🔊'}</button>
        <button onClick={onBack} style={{ background: '#fee2e2', border: '1px solid #b91c1c', borderRadius: 6, padding: '3px 7px', fontSize: 11, cursor: 'pointer', color: '#7f1d1d', fontWeight: 700 }}>← 뒤로</button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // 공통 피드백 모달
  // ─────────────────────────────────────────────
  const FeedbackMsg = () => wrongMsg ? (
    <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#7f1d1d', color: '#fef3c7', padding: '10px 18px', borderRadius: 12, fontSize: 12, fontWeight: 700, zIndex: 1000, textAlign: 'center', maxWidth: 280, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
      {wrongMsg}
    </div>
  ) : null;

  // ─────────────────────────────────────────────
  // 공통 스타일 토큰
  // ─────────────────────────────────────────────
  const btnPrimary = { background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fef3c7', border: '2px solid #fbbf24', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', marginTop: 8, boxShadow: '0 3px 8px rgba(0,0,0,0.3)' };
  const btnSecondary = { background: '#fef3c7', color: '#78350f', border: '2px solid #d97706', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
  const cardBase = { background: '#fef9e7', border: '2px solid #d97706', borderRadius: 10, padding: '10px 12px', fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' };

  // ─────────────────────────────────────────────
  // RENDER: INTRO
  // ─────────────────────────────────────────────
  if (subPhase === 'intro') {
    const dialog = introDialogs[introDialogIdx];
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #1c0a00 0%, #3b1a00 50%, #78350f 100%)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', gap: 12 }}>
          {/* 장막 이미지 */}
          <div style={{ width: '100%', maxWidth: 340, background: 'rgba(255,200,100,0.08)', borderRadius: 16, padding: 16, border: '2px solid #b45309', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🏕️</div>
            <div style={{ color: '#fcd34d', fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Stage 7. 축복의 장막, 수상한 손님</div>
            <div style={{ color: '#fef3c7', fontSize: 10, opacity: 0.8 }}>창세기 25장 · 27장</div>
          </div>

          {/* 말풍선 */}
          <div style={{ width: '100%', maxWidth: 340, background: '#fef9e7', border: '2px solid #d97706', borderRadius: 14, padding: '14px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <div style={{ color: '#b45309', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{dialog.emoji || ''} {dialog.speaker}</div>
            <div style={{ color: '#1c0a00', fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>{dialog.text}</div>
          </div>

          {/* 진행 인디케이터 */}
          <div style={{ display: 'flex', gap: 6 }}>
            {introDialogs.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === introDialogIdx ? '#fbbf24' : 'rgba(255,255,255,0.3)' }} />
            ))}
          </div>

          {introDialogIdx < introDialogs.length - 1 ? (
            <button onClick={() => { synth.playClick(); setIntroDialogIdx(p => p + 1); }} style={btnPrimary}>다음 ▶</button>
          ) : (
            <button onClick={() => { synth.playClick(); setSubPhase('mission1'); }} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #15803d, #166534)', border: '2px solid #4ade80', fontSize: 14 }}>🔍 사건 조사 시작!</button>
          )}
        </div>
        {showHint && <HintModal hint="장막 안의 단서를 하나씩 살펴보세요!" onClose={() => setShowHint(false)} />}
        <FeedbackMsg />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: MISSION 1
  // ─────────────────────────────────────────────
  if (subPhase === 'mission1') {
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #1c0a00 0%, #3b1a00 100%)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
          <div style={{ color: '#fcd34d', fontSize: 14, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>미션 1. 누구의 물건일까?</div>
          <div style={{ color: '#fef3c7', fontSize: 11, textAlign: 'center', marginBottom: 10, opacity: 0.9 }}>물건을 눌러서 에서 또는 야곱 영역에 배치하세요</div>

          {/* 물건 pool */}
          {m1Unplaced.length > 0 && (
            <div style={{ background: 'rgba(255,200,100,0.08)', border: '1px solid #b45309', borderRadius: 10, padding: '8px', marginBottom: 10 }}>
              <div style={{ color: '#fcd34d', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>📦 물건 목록 (눌러서 선택)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {m1Unplaced.map(it => (
                  <button key={it.id} onClick={() => handleM1SelectItem(it.id)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: m1Selected === it.id ? '2px solid #fbbf24' : '2px solid #d97706', background: m1Selected === it.id ? '#fbbf24' : '#fef9e7', color: '#1c0a00', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: m1WrongIds.includes(it.id) ? '0 0 8px #ef4444' : 'none' }}>
                    {it.emoji} {it.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {m1Selected && (
            <div style={{ color: '#fbbf24', fontSize: 11, textAlign: 'center', marginBottom: 6 }}>
              <b>"{m1Items.find(x => x.id === m1Selected)?.label}"</b> 선택됨 → 아래 영역을 눌러 배치하세요
            </div>
          )}

          {/* 두 영역 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {['esau', 'jacob'].map(zone => (
              <div key={zone} style={{ flex: 1, minHeight: 130, background: zone === 'esau' ? 'rgba(180,80,0,0.15)' : 'rgba(0,100,100,0.15)', border: `2px solid ${zone === 'esau' ? '#ea580c' : '#0d9488'}`, borderRadius: 10, padding: 8 }}>
                <button onClick={() => handleM1PlaceTo(zone)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: m1Selected ? 'pointer' : 'default', padding: 0, textAlign: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: zone === 'esau' ? 28 : 24, marginBottom: 2 }}>{zone === 'esau' ? '🏹' : '🏠'}</div>
                  <div style={{ color: zone === 'esau' ? '#fb923c' : '#2dd4bf', fontSize: 12, fontWeight: 700 }}>{zone === 'esau' ? '에서' : '야곱'}</div>
                  {m1Selected && <div style={{ color: '#fcd34d', fontSize: 9, marginTop: 2 }}>여기에 배치</div>}
                </button>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {m1Placed[zone].map(id => {
                    const it = m1Items.find(x => x.id === id);
                    return (
                      <button key={id} onClick={() => handleM1RemoveFrom(zone, id)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fbbf24', background: '#fef9e7', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                        {it?.emoji} {it?.label} ✕
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {m1ShowSuccess && (
            <div style={{ background: '#14532d', border: '2px solid #4ade80', borderRadius: 10, padding: 10, textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 24 }}>⭐</div>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>두 형제의 특징을 확인했어요!</div>
            </div>
          )}

          {!m1Completed ? (
            <button onClick={handleM1Check} style={btnPrimary}>✅ 확인하기</button>
          ) : (
            <button onClick={() => { synth.playClick(); setSubPhase('mission2'); }} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}>
              🍲 붉은 죽 사건 조사하기
            </button>
          )}

          <div style={{ marginTop: 10, background: 'rgba(255,200,100,0.06)', border: '1px solid #b45309', borderRadius: 8, padding: 8 }}>
            <div style={{ color: '#fcd34d', fontSize: 10 }}>⭐ 현재 별점: {currentStars.m1}개 (오답 {wrongCounts.m1}회)</div>
          </div>
        </div>
        {showHint && <HintModal hint={hintTexts.mission1} onClose={() => setShowHint(false)} />}
        <FeedbackMsg />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: MISSION 2
  // ─────────────────────────────────────────────
  if (subPhase === 'mission2') {
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #1c0a00 0%, #3b1a00 100%)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
          <div style={{ color: '#fcd34d', fontSize: 14, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>미션 2. 붉은 죽 사건의 순서를 찾아라!</div>
          <div style={{ color: '#fef3c7', fontSize: 11, textAlign: 'center', marginBottom: 12, opacity: 0.9 }}>카드를 눌러 선택한 뒤 다른 카드를 눌러 위치를 바꾸세요</div>

          {m2ShowSuccess && (
            <div style={{ background: '#14532d', border: '2px solid #4ade80', borderRadius: 10, padding: 10, textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 24 }}>🎉</div>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>사건 순서를 완성했어요!</div>
              <div style={{ color: '#fef9e7', fontSize: 11, marginTop: 4 }}>에서는 배가 고픈 순간의 욕심 때문에 소중한 장자의 명분을 가볍게 여겼어요.</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {m2Order.map((card, idx) => (
              <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{idx + 1}</div>
                <button onClick={() => handleM2Select(idx)} style={{ flex: 1, ...cardBase, border: m2SelIdx === idx ? '2px solid #fbbf24' : '2px solid #d97706', background: m2SelIdx === idx ? '#fef3c7' : '#fef9e7', fontWeight: m2SelIdx === idx ? 700 : 500 }}>
                  <span style={{ fontSize: 20 }}>{card.emoji}</span>
                  <span style={{ fontSize: 12, color: '#1c0a00', flex: 1, textAlign: 'left' }}>{card.text}</span>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button onClick={() => handleM2Move(idx, -1)} disabled={idx === 0} style={{ background: '#d97706', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, width: 24, height: 20, cursor: 'pointer' }}>▲</button>
                  <button onClick={() => handleM2Move(idx, 1)} disabled={idx === m2Order.length - 1} style={{ background: '#d97706', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, width: 24, height: 20, cursor: 'pointer' }}>▼</button>
                </div>
              </div>
            ))}
          </div>

          {!m2Completed ? (
            <button onClick={handleM2Check} style={btnPrimary}>🔍 사건 확인하기</button>
          ) : (
            <button onClick={() => { synth.playClick(); setSubPhase('mission3'); }} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              🔎 수상한 손님 조사하기
            </button>
          )}

          <div style={{ marginTop: 8, background: 'rgba(255,200,100,0.06)', border: '1px solid #b45309', borderRadius: 8, padding: 8 }}>
            <div style={{ color: '#fcd34d', fontSize: 10 }}>⭐ 현재 별점: {currentStars.m2}개 (오답 {wrongCounts.m2}회)</div>
          </div>
        </div>
        {showHint && <HintModal hint={hintTexts.mission2} onClose={() => setShowHint(false)} />}
        {finalWrongInfo && <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#7f1d1d', color: '#fef3c7', padding: '10px 18px', borderRadius: 12, fontSize: 12, fontWeight: 700, zIndex: 1000, textAlign: 'center', maxWidth: 280 }}>{finalWrongInfo}</div>}
        <FeedbackMsg />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: MISSION 3
  // ─────────────────────────────────────────────
  if (subPhase === 'mission3') {
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #1c0a00 0%, #3b1a00 100%)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
          <div style={{ color: '#fcd34d', fontSize: 14, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>미션 3. 수상한 손님을 조사하라!</div>

          {m3Phase === 'find' && (
            <>
              <div style={{ color: '#fef3c7', fontSize: 11, textAlign: 'center', marginBottom: 8, opacity: 0.9 }}>장막 안을 자세히 관찰하고 수상한 단서 5개를 찾으세요!</div>

              {/* 장막 씬 - 클릭가능 단서 영역 */}
              <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', background: 'linear-gradient(180deg, #3b1a00, #1c0a00)', borderRadius: 14, border: '2px solid #b45309', marginBottom: 10, overflow: 'hidden' }}>
                {/* 배경 장막 SVG */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
                  {/* 장막 천장 */}
                  <path d="M0,0 L200,60 L400,0 L400,300 L0,300 Z" fill="#3b1a00" />
                  <path d="M0,0 L200,70 L400,0" stroke="#b45309" strokeWidth="3" fill="none"/>
                  {/* 등불 */}
                  <ellipse cx="200" cy="55" rx="18" ry="10" fill="#fbbf24" opacity="0.6"/>
                  <ellipse cx="200" cy="50" rx="10" ry="14" fill="#fcd34d" opacity="0.8"/>
                  {/* 이삭 (노인) */}
                  <circle cx="100" cy="140" r="22" fill="#d4a373"/>
                  <rect x="75" y="162" width="50" height="70" rx="8" fill="#78350f"/>
                  <ellipse cx="100" cy="135" rx="18" ry="12" fill="#fef3c7"/>
                  <text x="85" y="150" fontSize="11" fill="#78350f">👴</text>
                  {/* 수상한 방문자 (야곱이 에서 행세) */}
                  <circle cx="290" cy="140" r="20" fill="#d4a373"/>
                  <rect x="267" y="160" width="46" height="65" rx="7" fill="#92400e"/>
                  {/* 팔의 염소가죽 - 단서 cl_skin 위치 */}
                  <rect x="248" y="178" width="22" height="30" rx="4" fill="#a3704a" stroke="#fbbf24" strokeWidth="0" strokeDasharray="3,2"/>
                  {/* 요리 그릇 - 단서 cl_food */}
                  <ellipse cx="310" cy="260" rx="24" ry="12" fill="#d97706"/>
                  <ellipse cx="310" cy="255" rx="20" ry="10" fill="#ef4444" opacity="0.7"/>
                  {/* 바닥 요리 천 - 단서 cl_cloth */}
                  <path d="M 50,270 Q 100,260 130,275 Q 150,280 120,285 Q 90,290 50,280 Z" fill="#92400e" opacity="0.7"/>
                </svg>

                {/* 클릭 핫스팟 */}
                {m3Clues.map(clue => {
                  const found = m3Found.find(c => c.id === clue.id);
                  return (
                    <button key={clue.id} onClick={() => found ? null : handleM3ClueClick(clue)}
                      style={{
                        position: 'absolute',
                        left: `${clue.x}%`, top: `${clue.y}%`,
                        width: 44, height: 44,
                        transform: 'translate(-50%, -50%)',
                        background: found ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.05)',
                        border: found ? '2px solid #fbbf24' : '2px solid rgba(255,200,100,0.2)',
                        borderRadius: '50%',
                        cursor: found ? 'default' : 'pointer',
                        fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 10,
                      }}>
                      {found ? clue.emoji : (m3WrongCount >= 3 && !found ? '✨' : '')}
                    </button>
                  );
                })}

                {/* 빈 영역 클릭 - 전체 영역에 z-index 낮게 */}
                <div onClick={handleM3WrongArea} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
              </div>

              <div style={{ color: '#fcd34d', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                찾은 단서: {m3Found.length}/5
              </div>

              {/* 발견된 단서 목록 */}
              {m3Found.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {m3Found.map(c => (
                    <div key={c.id} style={{ background: '#fef9e7', border: '2px solid #fbbf24', borderRadius: 8, padding: '4px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.emoji} {c.label}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 단서를 눌렀을 때 팝업 */}
          {m3ShowClue && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#fef9e7', border: '3px solid #fbbf24', borderRadius: 14, padding: 20, maxWidth: 300, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{m3ShowClue.emoji}</div>
                <div style={{ color: '#b45309', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{m3ShowClue.label}</div>
                <div style={{ color: '#1c0a00', fontSize: 12, lineHeight: 1.6 }}>{m3ShowClue.desc}</div>
              </div>
            </div>
          )}

          {/* 추리 질문 */}
          {m3Phase === 'question' && (
            <div style={{ background: 'rgba(255,200,100,0.08)', border: '2px solid #fbbf24', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ color: '#fcd34d', fontWeight: 700, fontSize: 13, marginBottom: 10, textAlign: 'center' }}>
                🔎 이삭 앞에서 에서인 것처럼 행동한 사람은 누구일까요?
              </div>
              {['아브라함', '에서', '야곱', '이스마엘'].map((choice, idx) => (
                <button key={idx} onClick={() => { synth.playClick(); setM3QuizSel(idx); }}
                  style={{ ...cardBase, border: m3QuizSel === idx ? '2px solid #fbbf24' : '2px solid #d97706', background: m3QuizSel === idx ? '#fef3c7' : '#fef9e7', width: '100%', justifyContent: 'flex-start' }}>
                  <span style={{ color: '#b45309', fontWeight: 700, minWidth: 24 }}>{idx + 1}.</span>
                  <span>{choice}</span>
                </button>
              ))}
              <button onClick={handleM3QuizSubmit} style={btnPrimary}>✅ 정답 확인</button>

              {m3QuizResult === 'correct' && (
                <div style={{ background: '#14532d', border: '2px solid #4ade80', borderRadius: 10, padding: 10, textAlign: 'center', marginTop: 8 }}>
                  <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 12 }}>정확해요! 야곱은 에서의 옷을 입고 팔에 염소 가죽을 붙여 자신이 에서인 것처럼 꾸몄어요.</div>
                </div>
              )}
              {m3QuizResult === 'wrong' && (
                <div style={{ background: '#7f1d1d', border: '2px solid #f87171', borderRadius: 10, padding: 10, textAlign: 'center', marginTop: 8 }}>
                  <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: 12 }}>다시 생각해보세요. 단서를 다시 살펴볼까요?</div>
                </div>
              )}
            </div>
          )}

          {m3Completed && (
            <button onClick={() => { synth.playClick(); setSubPhase('mission4'); }} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #be185d, #9d174d)' }}>
              ⚖️ 증언의 모순 밝히기
            </button>
          )}

          <div style={{ marginTop: 8, background: 'rgba(255,200,100,0.06)', border: '1px solid #b45309', borderRadius: 8, padding: 8 }}>
            <div style={{ color: '#fcd34d', fontSize: 10 }}>⭐ 현재 별점: {currentStars.m3}개</div>
          </div>
        </div>
        {showHint && <HintModal hint={hintTexts.mission3} onClose={() => setShowHint(false)} />}
        <FeedbackMsg />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: MISSION 4
  // ─────────────────────────────────────────────
  if (subPhase === 'mission4') {
    const round = m4Rounds[m4Round];
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #1c0a00 0%, #3b1a00 100%)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
          <div style={{ color: '#fcd34d', fontSize: 14, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>미션 4. 모순된 말을 찾아라!</div>
          <div style={{ color: '#fef3c7', fontSize: 10, textAlign: 'center', marginBottom: 2, opacity: 0.8 }}>라운드 {m4Round + 1} / {m4Rounds.length}</div>

          {/* 진행바 */}
          <div style={{ height: 4, background: '#3b1a00', borderRadius: 4, marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${((m4Round) / m4Rounds.length) * 100}%`, background: '#fbbf24', borderRadius: 4, transition: 'width 0.4s' }} />
          </div>

          {/* 주장 카드 */}
          <div style={{ background: '#7f1d1d', border: '2px solid #f87171', borderRadius: 12, padding: '12px 14px', marginBottom: 14, textAlign: 'center' }}>
            <div style={{ color: '#fca5a5', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>💬 수상한 손님의 주장</div>
            <div style={{ color: '#fef9e7', fontSize: 13, fontWeight: 700, lineHeight: 1.5, position: 'relative' }}>
              "{round.claim}"
              {m4Result === 'correct' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                  <div style={{ color: '#4ade80', fontWeight: 800, fontSize: 20 }}>💥 반박!</div>
                </div>
              )}
            </div>
          </div>

          {/* 증거 카드 3개 */}
          <div style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>🗂️ 어떤 증거로 반박할까요?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {round.evidence.map(ev => (
              <button key={ev.id} onClick={() => handleM4Select(ev)}
                style={{ ...cardBase, border: m4Selected === ev.id ? '2px solid #fbbf24' : '2px solid #d97706', background: m4Selected === ev.id ? '#fef3c7' : '#fef9e7', fontSize: 13, padding: '12px 14px' }}>
                <span style={{ fontSize: 24 }}>{ev.emoji}</span>
                <span style={{ color: '#1c0a00', fontWeight: 600 }}>{ev.label}</span>
              </button>
            ))}
          </div>

          {m4Result === 'correct' && (
            <div style={{ background: '#14532d', border: '2px solid #4ade80', borderRadius: 10, padding: 10, textAlign: 'center', marginBottom: 8 }}>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 12 }}>✅ 정확한 증거예요!</div>
              <div style={{ color: '#fef9e7', fontSize: 11, marginTop: 4 }}>{round.explanation}</div>
            </div>
          )}

          {!m4Completed ? (
            <button onClick={handleM4Submit} disabled={!m4Selected} style={{ ...btnPrimary, opacity: m4Selected ? 1 : 0.5 }}>⚖️ 이 증거로 반박!</button>
          ) : (
            <div>
              <div style={{ background: '#14532d', border: '2px solid #4ade80', borderRadius: 10, padding: 10, textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 24 }}>🎉</div>
                <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>모든 모순을 밝혔어요!</div>
                <div style={{ color: '#fef9e7', fontSize: 11, marginTop: 4 }}>목소리와 손과 음식이 모두 맞지 않았어. 이 사람은 야곱이었어!</div>
              </div>
              <button onClick={() => { synth.playClick(); setSubPhase('finalPuzzle'); }} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #4c1d95, #5b21b6)' }}>
                🗂️ 사건의 진실을 완성하라!
              </button>
            </div>
          )}

          <div style={{ marginTop: 8, background: 'rgba(255,200,100,0.06)', border: '1px solid #b45309', borderRadius: 8, padding: 8 }}>
            <div style={{ color: '#fcd34d', fontSize: 10 }}>⭐ 현재 별점: {currentStars.m4}개 (오답 {wrongCounts.m4}회)</div>
          </div>
        </div>
        {showHint && <HintModal hint={hintTexts.mission4} onClose={() => setShowHint(false)} />}
        <FeedbackMsg />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: FINAL PUZZLE
  // ─────────────────────────────────────────────
  if (subPhase === 'finalPuzzle') {
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #1c0a00 0%, #3b1a00 100%)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
          <div style={{ color: '#fcd34d', fontSize: 14, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>사건의 진실을 완성하라!</div>
          <div style={{ color: '#fef3c7', fontSize: 11, textAlign: 'center', marginBottom: 10, opacity: 0.9 }}>카드를 눌러 선택 후 다른 카드를 눌러 순서를 바꾸세요</div>

          {finalShowSuccess && (
            <div style={{ background: '#14532d', border: '2px solid #4ade80', borderRadius: 10, padding: 12, textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>🌟🌟🌟</div>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>사건의 진실이 완성됐어요!</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {finalOrder.map((card, idx) => (
              <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{idx + 1}</div>
                <button onClick={() => handleFinalSelect(idx)} style={{ flex: 1, ...cardBase, border: finalSelIdx === idx ? '2px solid #fbbf24' : '2px solid #d97706', background: finalSelIdx === idx ? '#fef3c7' : '#fef9e7', padding: '8px 10px' }}>
                  <span style={{ fontSize: 18 }}>{card.emoji}</span>
                  <span style={{ fontSize: 11, color: '#1c0a00', flex: 1, textAlign: 'left', lineHeight: 1.4 }}>{card.text}</span>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button onClick={() => handleFinalMove(idx, -1)} disabled={idx === 0} style={{ background: '#d97706', border: 'none', borderRadius: 4, color: '#fff', fontSize: 9, width: 22, height: 18, cursor: 'pointer' }}>▲</button>
                  <button onClick={() => handleFinalMove(idx, 1)} disabled={idx === finalOrder.length - 1} style={{ background: '#d97706', border: 'none', borderRadius: 4, color: '#fff', fontSize: 9, width: 22, height: 18, cursor: 'pointer' }}>▼</button>
                </div>
              </div>
            ))}
          </div>

          {finalWrongInfo && (
            <div style={{ background: '#7f1d1d', border: '1px solid #f87171', borderRadius: 8, padding: 8, textAlign: 'center', marginBottom: 8, color: '#fca5a5', fontSize: 12 }}>{finalWrongInfo}</div>
          )}

          {!finalCompleted ? (
            <button onClick={handleFinalCheck} style={btnPrimary}>📜 사건 완성하기</button>
          ) : (
            <button onClick={() => { synth.playClick(); setSubPhase('quiz'); }} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #0369a1, #075985)' }}>
              📖 성경 퀴즈 풀기
            </button>
          )}

          <div style={{ marginTop: 8, background: 'rgba(255,200,100,0.06)', border: '1px solid #b45309', borderRadius: 8, padding: 8 }}>
            <div style={{ color: '#fcd34d', fontSize: 10 }}>오답 {wrongCounts.final}회</div>
          </div>
        </div>
        {showHint && <HintModal hint={hintTexts.finalPuzzle} onClose={() => setShowHint(false)} />}
        <FeedbackMsg />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: QUIZ
  // ─────────────────────────────────────────────
  if (subPhase === 'quiz') {
    const q = quizItems[quizIdx];
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #1c0a00 0%, #3b1a00 100%)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
          <div style={{ color: '#fcd34d', fontSize: 14, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>📖 성경 퀴즈</div>
          <div style={{ color: '#fef3c7', fontSize: 10, textAlign: 'center', marginBottom: 10 }}>{quizIdx + 1} / {quizItems.length}</div>

          <div style={{ background: '#fef9e7', border: '2px solid #d97706', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ color: '#1c0a00', fontSize: 13, fontWeight: 700, lineHeight: 1.6 }}>Q{quizIdx + 1}. {q.q}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {q.choices.map((ch, idx) => (
              <button key={idx} onClick={() => { synth.playClick(); setQuizSel(idx); }}
                style={{ ...cardBase, border: quizSel === idx ? '2px solid #fbbf24' : '2px solid #d97706', background: quizSel === idx ? '#fef3c7' : '#fef9e7', padding: '10px 12px', justifyContent: 'flex-start' }}>
                <span style={{ color: '#b45309', fontWeight: 700, minWidth: 24 }}>{idx + 1}.</span>
                <span style={{ color: '#1c0a00', fontSize: 12 }}>{ch}</span>
              </button>
            ))}
          </div>

          {quizResult === 'correct' && (
            <div style={{ background: '#14532d', border: '2px solid #4ade80', borderRadius: 10, padding: 10, textAlign: 'center', marginBottom: 8 }}>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>✅ 정답이에요! 잘했어요!</div>
            </div>
          )}
          {quizResult === 'wrong' && (
            <div style={{ background: '#7f1d1d', border: '2px solid #f87171', borderRadius: 10, padding: 10, textAlign: 'center', marginBottom: 8 }}>
              <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: 12 }}>아쉬워요! 다시 생각해보세요.</div>
            </div>
          )}

          <button onClick={handleQuizSubmit} disabled={quizSel === null} style={{ ...btnPrimary, opacity: quizSel !== null ? 1 : 0.5 }}>✅ 정답 확인</button>
        </div>
        {showHint && <HintModal hint={hintTexts.quiz} onClose={() => setShowHint(false)} />}
        <FeedbackMsg />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: COMPLETE
  // ─────────────────────────────────────────────
  if (subPhase === 'complete') {
    const totalStars = Object.values(currentStars).reduce((a, b) => a + b, 0);
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #1c0a00 0%, #3b1a00 50%, #78350f 100%)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 52, marginBottom: 4 }}>🕵️</div>
          <div style={{ color: '#fcd34d', fontSize: 16, fontWeight: 800, textAlign: 'center' }}>축복의 장막 사건을 해결했어요!</div>

          {/* 배지 */}
          <div style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', border: '3px solid #fef3c7', borderRadius: 16, padding: '14px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(251,191,36,0.5)' }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>🏅</div>
            <div style={{ color: '#1c0a00', fontWeight: 800, fontSize: 14 }}>진실을 밝힌 탐정</div>
            <div style={{ color: '#78350f', fontSize: 10, marginTop: 2 }}>배지 획득!</div>
          </div>

          {/* 별 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#fef3c7', fontSize: 11, marginBottom: 4 }}>획득한 별: {totalStars}개</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: Math.min(totalStars, 15) }).map((_, i) => (
                <span key={i} style={{ fontSize: 18 }}>⭐</span>
              ))}
            </div>
          </div>

          {/* 성경적 결론 */}
          <div style={{ background: '#fef9e7', border: '2px solid #d97706', borderRadius: 12, padding: '14px 16px', width: '100%', maxWidth: 340 }}>
            <div style={{ color: '#b45309', fontWeight: 700, fontSize: 11, marginBottom: 6 }}>📖 말씀의 교훈</div>
            <p style={{ color: '#1c0a00', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              하나님께서는 야곱을 통해 약속을 이어가실 계획을 가지고 계셨어요. 그러나 야곱과 리브가는 하나님을 기다리지 않고 속이는 방법을 사용했어요. 그 결과 가족 안에 큰 상처와 갈등이 생겼어요. <b>하나님의 뜻은 거짓말이 아니라 정직한 믿음과 순종으로 따라야 해요.</b>
            </p>
          </div>

          {/* 캐릭터 대사 */}
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ background: 'rgba(255,200,100,0.08)', border: '1px solid #b45309', borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ color: '#fcd34d', fontSize: 10, fontWeight: 700 }}>티키 🐦</div>
              <div style={{ color: '#fef3c7', fontSize: 11 }}>하나님의 뜻을 이루기 위해서라도 거짓말을 사용하면 안 되는구나!</div>
            </div>
            <div style={{ background: 'rgba(255,200,100,0.08)', border: '1px solid #b45309', borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ color: '#fcd34d', fontSize: 10, fontWeight: 700 }}>타카 🦜</div>
              <div style={{ color: '#fef3c7', fontSize: 11 }}>우리는 하나님을 믿고 정직하게 행동하는 어린이가 되자!</div>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => { synth.playClick(); setSubPhase('intro'); setIntroDialogIdx(0); setWrongCounts({ m1: 0, m2: 0, m3: 0, m4: 0, final: 0, quiz: 0 }); setCurrentStars({ m1: 3, m2: 3, m3: 3, m4: 3, final: 3, quiz: 3 }); setM1Placed({ esau: [], jacob: [] }); setM1Selected(null); setM1Completed(false); setM2Order(shuffleOnce(m2Cards)); setM2Completed(false); setM3Found([]); setM3Phase('find'); setM3Completed(false); setM4Round(0); setM4Completed(false); setFinalOrder(shuffleFinal(finalCards)); setFinalCompleted(false); setQuizIdx(0); setQuizCompleted(false); setNotebook([]); }} style={btnPrimary}>🔄 다시 도전하기</button>
            <button onClick={onBack} style={btnSecondary}>🗺️ 스테이지 선택으로 돌아가기</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// 힌트 모달 컴포넌트
// ─────────────────────────────────────────────
function HintModal({ hint, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fef9e7', border: '3px solid #fbbf24', borderRadius: 14, padding: 20, maxWidth: 300, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💡</div>
        <div style={{ color: '#b45309', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>힌트</div>
        <div style={{ color: '#1c0a00', fontSize: 12, lineHeight: 1.7 }}>{hint}</div>
        <button onClick={onClose} style={{ marginTop: 14, background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>확인</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 증거 수첩 컴포넌트
// ─────────────────────────────────────────────
function NotebookModal({ notebook, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fef9e7', border: '3px solid #b45309', borderRadius: 14, padding: 16, maxWidth: 340, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 28 }}>📓</div>
          <div style={{ color: '#b45309', fontWeight: 800, fontSize: 14 }}>증거 수첩</div>
          <div style={{ color: '#78350f', fontSize: 10 }}>발견한 증거: {notebook.length}개</div>
        </div>
        {notebook.length === 0 && <div style={{ color: '#b45309', textAlign: 'center', fontSize: 12, opacity: 0.7 }}>아직 발견한 증거가 없어요.</div>}
        {notebook.map(card => (
          <div key={card.id} style={{ background: '#fff8e7', border: '1px solid #d97706', borderRadius: 8, padding: '8px 10px', marginBottom: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>{card.emoji}</span>
            <div>
              <div style={{ color: '#b45309', fontWeight: 700, fontSize: 11 }}>{card.label}</div>
              <div style={{ color: '#1c0a00', fontSize: 10, lineHeight: 1.5 }}>{card.text}</div>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ width: '100%', marginTop: 10, background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>닫기</button>
      </div>
    </div>
  );
}
