    // STAGE 3: 아담의 바구니 (Catching Game)
    // ─────────────────────────────────────────────
    function PuzzleAdamBasket({ coins, onSpendCoins, onBack, onSolved }) {
      // 대폭 완화된 속도 및 조정된 스폰 간격
      const STAGE_CONFIGS = [
        { level: 1, timeLimit: 30, targetScore: 8,  spawnInterval: 1300, fallSpeed: 0.60 },
        { level: 2, timeLimit: 35, targetScore: 12, spawnInterval: 1100, fallSpeed: 0.80 },
        { level: 3, timeLimit: 40, targetScore: 18, spawnInterval: 900,  fallSpeed: 1.00 },
        { level: 4, timeLimit: 45, targetScore: 24, spawnInterval: 700,  fallSpeed: 1.25 },
        { level: 5, timeLimit: 50, targetScore: 30, spawnInterval: 550,  fallSpeed: 1.55 },
      ];

      // 3game.png 스프라이트 좌표 매핑 (x1, y1, x2, y2)
      const GRACE_ITEMS  = [
        { emoji: '❤️',  label: '사랑', type: 'grace', bbox: [110, 466, 282, 625] },    // Item 0 (하트)
        { emoji: '📖',  label: '성경', type: 'grace', bbox: [443, 461, 631, 633] },   // Item 1 (성경책)
        { emoji: '🙏',  label: '기도', type: 'grace', bbox: [754, 447, 942, 653] },   // Item 2 (기도 손)
      ];
      const TEMPT_ITEMS  = [
        { emoji: '🍎',  label: '선악과', type: 'tempt', bbox: [95, 866, 273, 1045] },  // Item 3 (선악과)
        { emoji: '🐍',  label: '뱀',    type: 'tempt', bbox: [778, 861, 962, 1045] },   // Item 5 (뱀)
        { emoji: '🎮',  label: '게임기', type: 'tempt', bbox: [737, 1293, 968, 1433] }, // Item 7 (게임기)
      ];

      const [currentLevel, setCurrentLevel] = useState(1);
      const [score, setScore]               = useState(0);
      const [hearts, setHearts]             = useState(3); // 목숨 최대 3개
      const [timeLeft, setTimeLeft]         = useState(STAGE_CONFIGS[0].timeLimit);
      const [items, setItems]               = useState([]);
      const [adamX, setAdamX]               = useState(50); // percent
      const [phase, setPhase]               = useState('playing'); // playing | levelClear | gameOver | allClear
      const [redFlash, setRedFlash]         = useState(false);
      const [catchText, setCatchText]       = useState('');
      const [finalBonusScore, setFinalBonusScore] = useState(0);

      const gameAreaRef  = useRef(null);
      const animFrameRef = useRef(null);
      const lastSpawnRef = useRef(0);
      const itemsRef     = useRef([]);
      const scoreRef     = useRef(0);
      const heartsRef    = useRef(3); // 목숨 최대 3개
      const phaseRef     = useRef('playing');
      const configRef    = useRef(STAGE_CONFIGS[0]);
      const nextIdRef    = useRef(0);
      const adamXRef     = useRef(50); // adamX 동적 참조용 Ref

      // Sync refs
      useEffect(() => { itemsRef.current = items; }, [items]);
      useEffect(() => { scoreRef.current = score; }, [score]);
      useEffect(() => { heartsRef.current = hearts; }, [hearts]);
      useEffect(() => { phaseRef.current = phase; }, [phase]);

      // Touch/mouse Adam movement
      const handlePointerMove = useCallback((clientX) => {
        if (!gameAreaRef.current) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const pct  = Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
        setAdamX(pct);
        adamXRef.current = pct;
      }, []);

      useEffect(() => {
        const el = gameAreaRef.current;
        if (!el) return;
        const onTouchMove  = (e) => { e.preventDefault(); handlePointerMove(e.touches[0].clientX); };
        const onTouchStart = (e) => { e.preventDefault(); handlePointerMove(e.touches[0].clientX); };
        const onMouseMove  = (e) => { if (e.buttons > 0) handlePointerMove(e.clientX); };
        const onClick      = (e) => handlePointerMove(e.clientX);
        el.addEventListener('touchmove',  onTouchMove,  { passive: false });
        el.addEventListener('touchstart', onTouchStart, { passive: false });
        el.addEventListener('mousemove',  onMouseMove);
        el.addEventListener('click',      onClick);
        return () => {
          el.removeEventListener('touchmove',  onTouchMove);
          el.removeEventListener('touchstart', onTouchStart);
          el.removeEventListener('mousemove',  onMouseMove);
          el.removeEventListener('click',      onClick);
        };
      }, [handlePointerMove]);


      // Game loop
      useEffect(() => {
        if (phase !== 'playing') {
          cancelAnimationFrame(animFrameRef.current);
          return;
        }

        const cfg = configRef.current;

        const loop = (timestamp) => {
          if (phaseRef.current !== 'playing') return;

          // Spawn new item
          if (timestamp - lastSpawnRef.current > cfg.spawnInterval) {
            lastSpawnRef.current = timestamp;
            const pool = Math.random() < 0.55 ? GRACE_ITEMS : TEMPT_ITEMS;
            const template = pool[Math.floor(Math.random() * pool.length)];
            const newItem = {
              id: nextIdRef.current++,
              emoji: template.emoji,
              label: template.label,
              type:  template.type,
              bbox:  template.bbox,
              x: 5 + Math.random() * 90,
              y: -8,
            };
            setItems(prev => [...prev, newItem]);
          }

          // Move items down & check collision
          setItems(prev => {
            const adamXVal = adamXRef.current;
            const updated = [];
            for (const item of prev) {
              const newY = item.y + cfg.fallSpeed;

              // Collision zone: y 63-78, x within ±17% of adam (바구니 높이에 맞춰서 Y축 상향 및 가로 확대)
              if (newY >= 63 && newY <= 78) {
                const diff = Math.abs(item.x - adamXVal);
                if (diff < 17) {
                  // Caught!
                  if (item.type === 'grace') {
                    scoreRef.current += 1;
                    setScore(s => s + 1);
                    setCatchText(`+1 ${item.emoji}`);
                    setTimeout(() => setCatchText(''), 700);
                    synth.playN();
                    // Check level clear
                    const cfg2 = STAGE_CONFIGS[currentLevel - 1];
                    if (scoreRef.current >= cfg2.targetScore) {
                      setTimeout(() => {
                        if (phaseRef.current !== 'playing') return;
                        if (currentLevel === 5) {
                          const bonus = Math.max(0, Math.round(scoreRef.current - cfg2.targetScore) * 2);
                          setFinalBonusScore(bonus);
                          setPhase('allClear');
                          phaseRef.current = 'allClear';
                          synth.playVic();
                          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
                        } else {
                          setPhase('levelClear');
                          phaseRef.current = 'levelClear';
                          synth.playSuccess();
                          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
                        }
                      }, 200);
                    }
                  } else {
                    // Temptation caught
                    heartsRef.current = Math.max(0, heartsRef.current - 1);
                    setHearts(heartsRef.current);
                    setRedFlash(true);
                    setTimeout(() => setRedFlash(false), 500);
                    setCatchText(`💔 ${item.label}`);
                    setTimeout(() => setCatchText(''), 800);
                    synth.playO();
                    if (heartsRef.current <= 0) {
                      setTimeout(() => {
                        setPhase('gameOver');
                        phaseRef.current = 'gameOver';
                        synth.playOver();
                      }, 300);
                    }
                  }
                  continue; // remove from array
                }
              }

              if (newY > 105) continue; // off screen
              updated.push({ ...item, y: newY });
            }
            return updated;
          });

          animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animFrameRef.current);
      }, [phase, currentLevel]);

      const startNextLevel = () => {
        const nextLvl = currentLevel + 1;
        configRef.current = STAGE_CONFIGS[nextLvl - 1];
        setCurrentLevel(nextLvl);
        setScore(0); scoreRef.current = 0;
        setHearts(3); heartsRef.current = 3; // 목숨 3개
        setItems([]); itemsRef.current = [];
        lastSpawnRef.current = 0;
        setPhase('playing'); phaseRef.current = 'playing';
        setCatchText('');
        setRedFlash(false);
        setAdamX(50);
        adamXRef.current = 50;
      };

      const restartGame = () => {
        configRef.current = STAGE_CONFIGS[currentLevel - 1];
        // 현재 레벨(currentLevel)을 그대로 유지하고 해당 레벨에서 다시 시작합니다.
        setScore(0); scoreRef.current = 0;
        setHearts(3); heartsRef.current = 3; // 목숨 3개
        setItems([]); itemsRef.current = [];
        lastSpawnRef.current = 0;
        setPhase('playing'); phaseRef.current = 'playing';
        setCatchText('');
        setRedFlash(false);
        setAdamX(50);
        adamXRef.current = 50;
      };

      // Helper function to extract sprite style from 3game.png
      const getItemStyle = (bbox, targetSize = 44) => {
        const [x1, y1, x2, y2] = bbox;
        const w = x2 - x1;
        const h = y2 - y1;
        const scale = targetSize / Math.max(w, h);
        return {
          width: `${w * scale}px`,
          height: `${h * scale}px`,
          backgroundImage: "url('3game.png')",
          backgroundSize: `${1024 * scale}px ${1536 * scale}px`,
          backgroundPosition: `-${x1 * scale}px -${y1 * scale}px`,
          backgroundRepeat: 'no-repeat',
        };
      };

      const cfg = STAGE_CONFIGS[currentLevel - 1];

      return (
        <div
          ref={gameAreaRef}
          className="flex-1 relative overflow-hidden select-none"
          style={{
            backgroundImage: "url('3gamebg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'none',
          }}
        >
          {/* Red flash overlay */}
          {redFlash && (
            <div className="absolute inset-0 bg-red-500/30 pointer-events-none z-20 animate-pulse" />
          )}

          {/* HUD (제한시간 표시 제거) */}
          <div className="absolute top-0 inset-x-0 z-10 flex justify-between items-center px-3 py-2 bg-black/40 backdrop-blur-sm">
            <div className="text-white font-black text-xs font-layton-myeongjo">
              Lv.{currentLevel}/5
            </div>
            <div className="text-white font-black text-xs font-layton-myeongjo">
              🎯 {score}/{cfg.targetScore}
            </div>
            <div className="flex gap-0.5 text-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < hearts ? 'opacity-100' : 'opacity-20'}>❤️</span>
              ))}
            </div>
          </div>

          {/* Falling items (renders as sprite images from 3game.png) */}
          {items.map(item => {
            const itemStyle = getItemStyle(item.bbox, 44);
            return (
              <div
                key={item.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${item.x}%`,
                  top:  `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                  filter: item.type === 'tempt' ? 'drop-shadow(0 0 6px rgba(220,38,38,0.7))' : 'drop-shadow(0 0 6px rgba(250,204,21,0.8))',
                  ...itemStyle
                }}
              />
            );
          })}

          {/* Catch feedback text */}
          {catchText && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-lg z-20 pointer-events-none scale-in-out">
              {catchText}
            </div>
          )}

          {/* Adam character (adam.png) at bottom - 크기 추가 확대 */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: `${adamX}%`,
              bottom: '1%',
              transform: 'translateX(-50%)',
              width: '135px',
              height: '202px',
              backgroundImage: "url('adam.png')",
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))'
            }}
          />

          {/* Level Clear Modal */}
          {phase === 'levelClear' && (
            <div className="absolute inset-0 bg-black/70 z-30 flex items-center justify-center p-4">
              <div className="bg-[#fdfaf2] border-4 border-[#8b5a2b] p-5 rounded-2xl shadow-2xl max-w-[260px] w-full text-center scale-in font-layton-myeongjo">
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="font-black text-sm text-layton-amber mb-1">Lv.{currentLevel} 클리어!</h3>
                <p className="text-[10px] text-layton-dark leading-relaxed mb-4 break-keep">
                  하나님의 은혜 아이템을 멋지게 받아냈어요!<br />다음 단계는 조금 더 빨라집니다.
                </p>
                <button
                  onClick={startNextLevel}
                  className="w-full py-2 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow active:scale-95"
                >
                  다음 단계 도전 ➡️
                </button>
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {phase === 'gameOver' && (
            <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center p-4">
              <div className="bg-[#fdfaf2] border-4 border-red-800 p-5 rounded-2xl shadow-2xl max-w-[260px] w-full text-center scale-in font-layton-myeongjo">
                <span className="text-4xl block mb-2">🥀</span>
                <h3 className="font-black text-sm text-red-800 mb-1">게임 오버!</h3>
                <p className="text-[10px] text-layton-dark leading-relaxed mb-4 break-keep">
                  하트를 모두 잃었어요!<br />유혹의 아이템을 피하며 다시 도전해 보세요.
                </p>
                <button
                  onClick={restartGame}
                  className="w-full py-2 bg-gradient-to-b from-red-600 to-red-800 text-white font-black text-xs rounded-xl border-2 border-red-400 shadow active:scale-95"
                >
                  다시 도전 🔄
                </button>
              </div>
            </div>
          )}

          {/* All Clear - Scripture Card */}
          {phase === 'allClear' && (
            <div className="absolute inset-0 bg-[#e0f7e9] z-30 flex flex-col items-center justify-center p-5 overflow-auto">
              <div className="absolute bottom-0 inset-x-0 h-32 bg-[#86efac]/80 rounded-t-[120px] pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-20 bg-[#4ade80] rounded-t-[150px] pointer-events-none" />
              <div className="absolute bottom-16 left-4 text-4xl animate-bounce">🌺</div>
              <div className="absolute bottom-16 right-4 text-4xl animate-pulse">🌸</div>
              <div className="absolute top-8 left-6 text-3xl animate-pulse opacity-70">🕊️</div>
              <div className="absolute top-8 right-6 text-3xl animate-bounce opacity-70">🕊️</div>

              {/* Scripture card */}
              <div className="relative z-10 bg-[#fdfaf2] border-4 border-[#8b5a2b] p-5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] max-w-[290px] w-full text-center font-layton-myeongjo">
                <span className="text-3xl block mb-2">🌿</span>
                <h3 className="font-black text-xs text-layton-amber tracking-wider border-b border-layton-brown/20 pb-2 uppercase">
                  성령의 열매
                </h3>

                <p className="text-[11px] text-[#4a2e13] font-bold leading-relaxed my-4 break-keep">
                  "오직 성령의 열매는 사랑과 희락과 화평과 오래 참음과 자비와 양선과 충성과 온유와 절제니"
                </p>
                <p className="text-[10px] text-[#8b5a2b] font-bold mb-3">(갈라디아서 5:22-23)</p>

                {/* Score banner */}
                <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 border border-emerald-400/40 rounded-xl p-2.5 mb-4">
                  <div className="text-[10px] text-emerald-300 font-bold">🏆 획득 점수</div>
                  <div className="flex items-baseline justify-center gap-2 mt-0.5">
                    <span className="text-yellow-200 font-black text-sm">+40P</span>
                    {finalBonusScore > 0 && (
                      <span className="text-emerald-300 font-black text-sm">+{finalBonusScore}P 보너스!</span>
                    )}
                  </div>
                  <div className="text-[9px] text-white/40 mt-0.5">초과 점수 × 2 = 보너스</div>
                </div>

                <div className="w-full bg-[#f4edd4] border border-[#d2b48c] p-2.5 rounded-xl text-left text-[9px] text-[#5c4033] leading-relaxed break-keep mb-4">
                  💡 <strong>메시지:</strong> 아담이 에덴에서 하나님과 함께했던 것처럼, 우리도 성령의 열매를 마음에 담아 유혹을 이기고 사랑으로 가득한 삶을 살 수 있어요!
                </div>

                <button
                  onClick={() => onSolved('puzzle-003', finalBonusScore)}
                  className="w-full py-2 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                >
                  다음 스테이지로 ➡️
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // ─────────────────────────────────────────────
