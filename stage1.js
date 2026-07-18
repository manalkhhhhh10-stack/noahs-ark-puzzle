    // Rain Particle Component
    function RainEffect() {
      const drops = [];
      for (let i = 0; i < 25; i++) {
        const style = {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * -20}px`,
          animation: `rain ${1 + Math.random() * 0.8}s linear infinite`,
          animationDelay: `${Math.random() * 1.5}s`,
        };
        drops.push(<div key={i} className="rain-drop" style={style} />);
      }
      return <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">{drops}</div>;
    }

    // PUZZLE 1 COMPONENT: NOAH'S ARK
    function PuzzleNoah({ coins, onSpendCoins, onBack, onSolved }) {
      const [currentLevel, setCurrentLevel] = useState(1);
      const [showLevelClear, setShowLevelClear] = useState(false);
      const [gameStarted, setGameStarted] = useState(false);
      const [lights, setLights] = useState([]);
      const [isCompleted, setIsCompleted] = useState(false);
      const [showHint, setShowHint] = useState(false);
      const [hintUnlocked, setHintUnlocked] = useState(false);
      const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
      const [timeLeft, setTimeLeft] = useState(20);
      const [isFailed, setIsFailed] = useState(false);
      const [isSlowed, setIsSlowed] = useState(false);

      const LEVEL_CONFIGS = [
        { level: 1, lightCount: 12, fastCount: 0, timeLimit: 20 },
        { level: 2, lightCount: 18, fastCount: 2, timeLimit: 15 },
        { level: 3, lightCount: 25, fastCount: 4, timeLimit: 12 },
      ];

      // Spend 10 coins to slow down temptations for 3s
      const handleSlowItemClick = () => {
        if (isSlowed || coins < 10) return;
        synth.playConsume();
        onSpendCoins(10);
        setIsSlowed(true);
        setTimeout(() => {
          setIsSlowed(false);
        }, 3000);
      };

      // Start the game and initialize lights based on level
      const handleStartGame = () => {
        synth.playClick();
        
        const cfg = LEVEL_CONFIGS[currentLevel - 1];
        const sizeClasses = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
        const emojis = ['🧸', '🎮', '💵', '💎', '📱', '📺', '🍭', '🍩', '🍕', '🪙'];
        const glowColors = [
          'rgba(251, 191, 36, 0.4)', // Amber
          'rgba(244, 63, 94, 0.4)',  // Rose
          'rgba(14, 165, 233, 0.4)', // Sky
          'rgba(168, 85, 247, 0.4)', // Purple
          'rgba(34, 197, 94, 0.4)'   // Green
        ];

        const initialLights = Array.from({ length: cfg.lightCount }, (_, i) => {
          const sizeClass = sizeClasses[Math.floor(Math.random() * sizeClasses.length)];
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          const x = Math.random() * 80 + 10; // 10% to 90%
          const y = Math.random() * 70 + 15; // 15% to 85%
          
          let dx = (Math.random() - 0.5) * 1.8;
          let dy = (Math.random() - 0.5) * 1.8;
          const isSuperFast = i < cfg.fastCount;
          if (isSuperFast) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4.2; // Over double the speed (4.2px per frame)
            dx = Math.cos(angle) * speed;
            dy = Math.sin(angle) * speed;
          }

          const glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];
          const spriteIdx = Math.floor(Math.random() * 8); // 8 custom temptations from 1game1.png

          return {
            id: i,
            x,
            y,
            dx,
            dy,
            sizeClass,
            emoji,
            spriteIdx,
            glowColor,
            isFading: false,
            isSuperFast
          };
        });

        setLights(initialLights);
        setGameStarted(true);
        setIsCompleted(false);
        setShowLevelClear(false);
        setTimeLeft(cfg.timeLimit);
        setIsFailed(false);
        setIsSlowed(false);
      };

      // Countdown Timer effect
      useEffect(() => {
        if (!gameStarted || isCompleted || isFailed) return;

        const timerInterval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerInterval);
              setIsFailed(true);
              synth.playOver();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timerInterval);
      }, [gameStarted, isCompleted, isFailed]);

      // Animation frame for moving lights
      useEffect(() => {
        if (!gameStarted || lights.length === 0 || isCompleted || isFailed) return;

        const interval = setInterval(() => {
          setLights(prev => prev.map(light => {
            if (light.isFading) return light;

            const speedMultiplier = isSlowed ? 0.3 : 1.0;
            let nextX = light.x + light.dx * speedMultiplier;
            let nextY = light.y + light.dy * speedMultiplier;
            let nextDx = light.dx;
            let nextDy = light.dy;

            // Bounce off horizontal bounds (10% to 90%)
            if (nextX < 8 || nextX > 92) {
              nextDx = -light.dx;
              nextX = Math.max(8, Math.min(92, nextX));
            }
            // Bounce off vertical bounds (15% to 85%)
            if (nextY < 12 || nextY > 88) {
              nextDy = -light.dy;
              nextY = Math.max(12, Math.min(88, nextY));
            }

            return {
              ...light,
              x: nextX,
              y: nextY,
              dx: nextDx,
              dy: nextDy
            };
          }));
        }, 40);

        return () => clearInterval(interval);
      }, [gameStarted, lights.length, isCompleted, isFailed, isSlowed]);

      // Handle clicking a light icon
      const handleLightClick = (id) => {
        synth.playPong();
        
        // Trigger fade animation
        setLights(prev => prev.map(l => l.id === id ? { ...l, isFading: true } : l));

        // Remove from list after 250ms
        setTimeout(() => {
          setLights(prev => {
            const next = prev.filter(l => l.id !== id);
            // Check if this was the last light
            if (next.length === 0) {
              if (currentLevel < 3) {
                setShowLevelClear(true);
                synth.playSuccess();
              } else {
                setIsCompleted(true);
                synth.playVic();
              }
            }
            return next;
          });
        }, 250);
      };

      const handleNextLevel = () => {
        synth.playClick();
        setCurrentLevel(prev => {
          const nextLvl = prev + 1;
          const cfg = LEVEL_CONFIGS[nextLvl - 1];
          
          const sizeClasses = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
          const emojis = ['🧸', '🎮', '💵', '💎', '📱', '📺', '🍭', '🍩', '🍕', '🪙'];
          const glowColors = [
            'rgba(251, 191, 36, 0.4)',
            'rgba(244, 63, 94, 0.4)',
            'rgba(14, 165, 233, 0.4)',
            'rgba(168, 85, 247, 0.4)',
            'rgba(34, 197, 94, 0.4)'
          ];
          const initialLights = Array.from({ length: cfg.lightCount }, (_, i) => {
            const sizeClass = sizeClasses[Math.floor(Math.random() * sizeClasses.length)];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const x = Math.random() * 80 + 10;
            const y = Math.random() * 70 + 15;
            
            let dx = (Math.random() - 0.5) * 1.8;
            let dy = (Math.random() - 0.5) * 1.8;
            const isSuperFast = i < cfg.fastCount;
            if (isSuperFast) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 4.2;
              dx = Math.cos(angle) * speed;
              dy = Math.sin(angle) * speed;
            }
            const glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];
            const spriteIdx = Math.floor(Math.random() * 8);

            return {
              id: i, x, y, dx, dy, sizeClass, emoji, spriteIdx, glowColor, isFading: false, isSuperFast
            };
          });

          setLights(initialLights);
          setTimeLeft(cfg.timeLimit);
          setIsFailed(false);
          setIsSlowed(false);
          setShowLevelClear(false);
          
          return nextLvl;
        });
      };

      // Unlock hint by spending 10 coins
      const handleUnlockHint = () => {
        if (coins >= 10) {
          onSpendCoins(10);
          setHintUnlocked(true);
          setShowUnlockConfirm(false);
          setShowHint(true);
          synth.playSuccess();
        } else {
          alert('코인이 부족합니다! (10코인 필요)');
          setShowUnlockConfirm(false);
        }
      };

      return (
        <div className="flex-1 flex flex-col justify-between relative bg-[#0a0705] text-[#fdf8eb] overflow-hidden select-none">
          {/* Custom style injection for floating drift and radiant light */}
          <style>{`
            @keyframes float-drift-anim {
              0% { transform: translateY(0px) rotate(0deg) scale(1); }
              100% { transform: translateY(-6px) rotate(6deg) scale(1.05); }
            }
            .animate-float-drift {
              animation: float-drift-anim 2.5s ease-in-out infinite alternate;
            }
            @keyframes expand-light-effect {
              0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
              }
              40% {
                opacity: 0.85;
              }
              100% {
                transform: translate(-50%, -50%) scale(7);
                opacity: 1;
              }
            }
            .animate-expand-light {
              animation: expand-light-effect 3s cubic-bezier(0.1, 0.7, 0.2, 1) forwards;
            }
            .light-card-shadow {
              box-shadow: 0 0 25px rgba(255, 215, 0, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.4);
            }
          `}</style>


          {/* MAIN GAME CONTAINER AREA */}
          <div className="flex-1 relative overflow-hidden bg-black w-full h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('1gamebg.png')" }}>

            {/* PHASE 1: GAME START INTRO CARD */}
            {!gameStarted && (
              <div className="absolute inset-0 bg-[#160f0a]/95 flex flex-col justify-between p-6 z-30 fade-in">
                <div className="absolute inset-4 border border-layton-gold/20 rounded-xl pointer-events-none"></div>
                
                <div className="mt-4 text-center z-10">
                  <span className="text-3xl block filter drop-shadow">💡</span>
                  <h2 className="font-layton-myeongjo font-black text-base text-layton-amber mt-2">
                    1스테이지: 빛과 어둠의 분리 (Lv. {currentLevel}/3)
                  </h2>
                  <p className="font-layton-myeongjo text-[9px] text-[#eddcb9] mt-1">
                    거꾸로 탐정단 제1막: 창세기
                  </p>
                </div>

                <div className="my-2 p-3 bg-[#26180c]/60 rounded-xl border border-layton-gold/10 text-left font-layton-myeongjo z-10">
                  <p className="text-[10px] text-layton-cream leading-relaxed break-keep">
                    태초의 지구는 온통 어둡고 혼돈 상태였습니다. 
                    하지만 지금 스크린에는 우리를 유혹하는 수많은 <strong>'가짜 유혹의 빛'</strong>들이 둥둥 떠다닙니다.
                  </p>
                  <div className="mt-2.5 p-2 bg-black/40 rounded-lg border border-red-500/20 text-[9px] text-red-300 leading-tight">
                    <strong>⚠️ 안티크리에이티브(역발상) 규칙:</strong><br />
                    보통 게임은 빛을 모으지만, 이 게임은 <strong>'모든 가짜 빛을 터치해 끄는 것'</strong>이 목표입니다!
                  </div>
                </div>

                <div className="mb-4 z-10">
                  <button
                    onClick={handleStartGame}
                    className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] hover:from-[#f7cb75] hover:to-[#be8420] text-[#2c1a0c] font-black font-layton-myeongjo text-xs rounded-xl border-2 border-[#ffe8b5] shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    수수께끼 시작하기
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 2: FLOATING LIGHT ICONS GAMEPLAY */}
            {gameStarted && !isCompleted && !isFailed && (
              <div className="absolute inset-0 w-full h-full relative">
                {/* Top Left HUD - Hint & Slow buttons */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  {/* Hint Floating Button */}
                  <button
                    onClick={() => {
                      synth.playClick();
                      if (hintUnlocked) {
                        setShowHint(true);
                      } else {
                        setShowUnlockConfirm(true);
                      }
                    }}
                    className="bg-black/60 border border-stone-800 text-[#e7b85e] hover:text-yellow-300 text-[11px] font-layton-myeongjo font-bold px-3.5 py-1.5 rounded-full flex items-center gap-0.5"
                  >
                    💡 힌트
                  </button>

                  {/* Slow Motion Item Button */}
                  <button
                    onClick={handleSlowItemClick}
                    disabled={isSlowed || coins < 10}
                    className={`bg-black/60 border ${
                      isSlowed ? 'border-sky-500 text-sky-400 animate-pulse' : 'border-stone-800 text-sky-300 hover:text-sky-200'
                    } text-[11px] font-layton-myeongjo font-bold px-3 py-1.5 rounded-full flex items-center gap-0.5 transition-all ${
                      (isSlowed || coins < 10) ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
                    }`}
                  >
                    🌀 {isSlowed ? '슬로우 중 (3초)' : '슬로우 (10🪙)'}
                  </button>
                </div>

                {/* Dark Chaos Background Hint overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
                  <span className="bg-black/60 border border-stone-800 text-stone-300 text-[12px] font-layton-myeongjo font-bold px-4 py-2 rounded-full whitespace-nowrap">
                    남은 가짜 빛: <span className="text-yellow-400 font-extrabold text-sm ml-0.5 mr-0.5">{lights.length}</span>개
                  </span>
                </div>

                {/* Timer Display overlay in top right */}
                <div className={`absolute top-4 right-4 z-20 ${timeLeft <= 3 ? 'text-red-500 font-extrabold scale-110' : 'text-stone-300'} text-[12px] font-layton-myeongjo flex items-center gap-1.5 transition-all duration-200`}>
                  <span className={`text-sm ${timeLeft <= 3 ? 'animate-bounce' : ''}`}>⏱️</span>
                  <span className="bg-black/60 border border-stone-800 px-3 py-1 rounded-full flex items-center">
                    <span className="text-base font-black mr-0.5 text-yellow-400">{timeLeft}</span>초
                  </span>
                </div>

                {/* Screen blink warning overlay when <= 3 seconds left */}
                {timeLeft <= 3 && !isCompleted && !isFailed && (
                  <div className="absolute inset-0 bg-red-600/10 border-4 border-red-600/40 pointer-events-none z-10 animate-[pulse_0.4s_infinite]" />
                )}

                {/* Render floating lights */}
                {lights.map((light) => (
                  <div
                    key={light.id}
                    onClick={() => handleLightClick(light.id)}
                    className={`absolute select-none cursor-pointer flex items-center justify-center rounded-full ${light.sizeClass} animate-float-drift hover:scale-110 active:scale-90 transition-transform`}
                    style={{
                      left: `${light.x}%`,
                      top: `${light.y}%`,
                      transform: 'translate(-50%, -50%)',
                      transition: 'opacity 0.25s ease, transform 0.25s ease',
                      opacity: light.isFading ? 0 : 1,
                      width: '68px',
                      height: '68px',
                      background: `radial-gradient(circle, ${light.glowColor} 0%, transparent 70%)`,
                      filter: light.isSuperFast ? 'drop-shadow(0 0 16px rgba(255,215,0,0.95))' : 'drop-shadow(0 0 10px rgba(255,255,255,0.75))',
                    }}
                  >
                    <div 
                      className="bg-cover bg-center"
                      style={{
                        width: '45px',
                        height: '60px',
                        backgroundImage: "url('1game1.png')",
                        backgroundSize: '400% 200%',
                        backgroundPosition: `${(light.spriteIdx % 4) * 33.333}% ${Math.floor(light.spriteIdx / 4) * 100}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* PHASE 2.5: TIME OUT FAILURE CARD */}
            {isFailed && (
              <div className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-6 fade-in">
                <div className="absolute inset-4 border border-red-500/20 rounded-xl pointer-events-none"></div>
                
                <div className="w-full max-w-[280px] bg-layton-parchment rounded-2xl border-4 border-red-950 p-5 text-center shadow-2xl relative solved-banner flex flex-col justify-between my-auto">
                  <div>
                    <span className="text-3xl block filter drop-shadow animate-bounce mb-3">⏳</span>
                    <span className="text-[7px] bg-red-700 text-white font-black px-2 py-0.5 rounded-full tracking-wider uppercase font-sans">
                      TIME OUT
                    </span>
                    
                    <h3 className="font-layton-myeongjo font-black text-xs text-red-950 mt-2 mb-3 tracking-wide">
                      시간 초과!
                    </h3>
                    
                    <p className="font-layton-myeongjo text-[10px] text-layton-lightbrown leading-relaxed mb-4 break-keep font-semibold">
                      태초의 혼돈 속에서 가짜 유혹의 빛들이 너무나 빠르게 퍼졌습니다. 어둠을 다시 조화롭게 만들어 볼까요?
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={handleStartGame}
                      className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] hover:from-[#f7cb75] hover:to-[#be8420] text-[#2c1a0c] font-black font-layton-myeongjo text-xs rounded-xl border-2 border-[#ffe8b5] shadow-lg active:scale-95 transition-all duration-200"
                    >
                      다시 도전하기 🔄
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PHASE 3: COMPLETED TRUE LIGHT & BIBLE VERSE CARD */}
            {isCompleted && (
              <div className="absolute inset-0 bg-[#000000] z-30 flex flex-col items-center justify-center p-6 overflow-hidden">
                
                {/* Expanding Creation Light effect from center */}
                <div 
                  className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-white via-[#ffeaa7] to-transparent animate-expand-light z-0"
                  style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                ></div>

                {/* Bible Verse Card overlay */}
                <div className="w-full max-w-[280px] bg-[#fcf8eb] rounded-2xl border-4 border-layton-brown p-4 shadow-2xl text-center solved-banner z-10 fade-in light-card-shadow flex flex-col justify-between my-auto">
                  
                  <div>
                    <span className="text-3xl block filter drop-shadow animate-[mini-float_3s_infinite_alternate] mb-2">🌅</span>
                    <span className="text-[7px] bg-yellow-600 text-white font-black px-2 py-0.2 rounded-full tracking-wider uppercase font-sans">
                      STAGE COMPLETE
                    </span>
                    
                    <h3 className="font-layton-myeongjo font-black text-xs text-[#2c1a0c] mt-2 mb-3 tracking-wide">
                      빛과 어둠의 분리
                    </h3>

                    {/* Bible Verse in beautiful Myeongjo Font */}
                    <div className="p-3 bg-[#ebdcb9]/40 border border-[#8b5a2b]/20 rounded-xl my-2">
                      <p className="font-layton-myeongjo text-[11px] font-extrabold text-[#3a200c] leading-relaxed break-keep">
                        "하나님이 이르시되 빛이 있으라 하시니 빛이 있었고"
                      </p>
                      <span className="font-layton-myeongjo text-[8px] text-[#8b5a2b] font-bold mt-1 block">
                        (창세기 1:3)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 mb-3 bg-gradient-to-r from-sky-900/50 to-sky-800/30 border border-sky-500/40 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-sky-300 font-bold font-layton-myeongjo">🏆 획득 점수</div>
                    <div className="flex items-baseline justify-center gap-2 mt-0.5">
                      <span className="text-yellow-200 font-black text-sm font-layton-myeongjo">+30P</span>
                      <span className="text-sky-300 font-black text-sm font-layton-myeongjo">+{Math.min(20, Math.round(timeLeft * 1.3))}P 속도보너스!</span>
                    </div>
                    <div className="text-[9px] text-white/40 font-layton-myeongjo mt-0.5">남은 시간 {timeLeft}초 × 1.3 = 속도 보너스</div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => {
                        synth.playSuccess();
                        const speedBonus = Math.min(20, Math.round(timeLeft * 1.3));
                        onSolved('puzzle-001', speedBonus);
                      }}
                      className="w-full py-2 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] hover:from-[#f7cb75] hover:to-[#be8420] text-[#2c1a0c] font-black font-layton-myeongjo text-xs rounded-xl border-2 border-[#ffe8b5] shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95"
                    >
                      다음 단계로 🧭
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ================= MODALS & OVERLAYS ================= */}

          {/* Hint modal popup */}
          {showHint && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-50 fade-in">
              <div className="w-[280px] bg-layton-parchment rounded-2xl border-4 border-layton-brown p-4 text-center shadow-2xl relative solved-banner">
                <span className="text-2xl block mb-1">💡</span>
                <h3 className="font-layton-myeongjo font-black text-xs text-layton-dark mb-2">수수께끼 힌트</h3>
                <p className="text-[10px] text-layton-lightbrown font-layton-myeongjo font-semibold leading-relaxed mb-4 break-keep">
                  이 수수께끼는 '안티크리에이티브(역발상)' 규칙이 적용됩니다. 스크린 위를 둥둥 떠다니는 가짜 빛 아이콘(🧸, 💵, 📱 등) 20개를 모두 터치해 꺼서 완벽한 어둠을 만드세요!
                </p>
                <button
                  onClick={() => {
                    synth.playClick();
                    setShowHint(false);
                  }}
                  className="w-full py-1.5 bg-[#4a2f13] hover:bg-[#5e3c1b] text-layton-cream text-xs font-bold rounded-xl border border-layton-gold/20 active:scale-95"
                >
                  확인
                </button>
              </div>
            </div>
          )}

          {/* Hint Unlock Confirmation Modal */}
          {showUnlockConfirm && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-50 fade-in">
              <div className="w-[280px] bg-layton-parchment rounded-2xl border-4 border-layton-brown p-4 text-center shadow-2xl relative solved-banner">
                <span className="text-2xl block mb-1">🪙</span>
                <h3 className="font-layton-myeongjo font-black text-xs text-layton-dark mb-1">힌트 잠금 해제</h3>
                <p className="text-[9px] text-[#8b5a2b] font-bold mb-3">10 코인이 필요합니다</p>
                <p className="text-[10px] text-layton-lightbrown font-layton-myeongjo leading-normal mb-4">
                  보유 코인: <span className="font-bold text-yellow-600">{coins}개</span><br />
                  10코인을 소모하여 힌트를 보시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      synth.playClick();
                      setShowUnlockConfirm(false);
                    }}
                    className="flex-1 py-1.5 bg-stone-300 hover:bg-stone-400 text-stone-800 text-[10px] font-bold rounded-xl border border-stone-400 active:scale-95"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUnlockHint}
                    className="flex-1 py-1.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] hover:from-[#f7cb75] hover:to-[#be8420] text-[#2c1a0c] text-[10px] font-bold rounded-xl border border-[#ffe8b5] active:scale-95"
                  >
                    잠금 해제
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Level Clear Modal */}
          {showLevelClear && (
            <div className="absolute inset-0 bg-black/75 z-40 flex items-center justify-center p-4">
              <div className="bg-[#fdfaf2] border-4 border-[#8b5a2b] p-5 rounded-2xl shadow-2xl max-w-[260px] w-full text-center scale-in font-layton-myeongjo">
                <span className="text-4xl block mb-2 filter drop-shadow">🎉</span>
                <h3 className="font-black text-sm text-layton-amber mb-1.5">Lv.{currentLevel} 성공!</h3>
                <p className="text-[10px] text-layton-dark leading-relaxed mb-4">
                  가짜 빛을 모두 소거하셨습니다!<br />다음 단계는 더 많은 빛들이 기다립니다.
                </p>
                <button
                  onClick={handleNextLevel}
                  className="w-full py-2 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] hover:from-[#f7cb75] hover:to-[#be8420] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow"
                >
                  다음 단계 도전 ➡️
                </button>
              </div>
            </div>
          )}

        </div>
      );
    }


    // ─────────────────────────────────────────────
