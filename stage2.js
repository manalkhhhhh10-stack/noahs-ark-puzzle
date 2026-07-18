    function PuzzleEdenAnimals({ coins, onSpendCoins, onBack, onSolved }) {
      const [currentLevel, setCurrentLevel] = useState(1);
      const [cards, setCards] = useState([]);
      const [selectedCards, setSelectedCards] = useState([]);
      const [matchedText, setMatchedText] = useState('');
      const [showLevelClearedPopup, setShowLevelClearedPopup] = useState(false);
      const [showFinalScriptureCard, setShowFinalScriptureCard] = useState(false);
      const [clicksLeft, setClicksLeft] = useState(100);
      const [isGameOver, setIsGameOver] = useState(false);
      const [isPreviewing, setIsPreviewing] = useState(true);
      const [finalBonusScore, setFinalBonusScore] = useState(0);

      const previewTimeoutRef = useRef(null);

      const levelConfigs = [
        { level: 1, rows: 2, cols: 2, numPairs: 2 },
        { level: 2, rows: 2, cols: 3, numPairs: 3 },
        { level: 3, rows: 2, cols: 4, numPairs: 4 },
        { level: 4, rows: 3, cols: 4, numPairs: 6 },
        { level: 5, rows: 4, cols: 4, numPairs: 8 },
      ];

      const animalPool = [
        { emoji: '🦁', name: '사자', bgColor: 'bg-[#fef3c7]' },
        { emoji: '🐘', name: '코끼리', bgColor: 'bg-[#e0f2fe]' },
        { emoji: '🦒', name: '기린', bgColor: 'bg-[#fef9c3]' },
        { emoji: '🐑', name: '양', bgColor: 'bg-[#f3f4f6]' },
        { emoji: '🦌', name: '사슴', bgColor: 'bg-[#ffedd5]' },
        { emoji: '🐇', name: '토끼', bgColor: 'bg-[#fce7f3]' },
        { emoji: '🐻', name: '곰', bgColor: 'bg-[#efebeb]' },
        { emoji: '🦊', name: '여우', bgColor: 'bg-[#fee2e2]' },
      ];

      const initLevel = (levelNum) => {
        const config = levelConfigs[levelNum - 1];
        const levelAnimals = animalPool.slice(0, config.numPairs);
        let deck = [];
        levelAnimals.forEach(animal => {
          // Initialize with isFlipped: true so cards are shown face up during preview!
          deck.push({ ...animal, id: `${animal.name}-1`, isFlipped: true, isMatched: false });
          deck.push({ ...animal, id: `${animal.name}-2`, isFlipped: true, isMatched: false });
        });
        // Shuffle
        deck.sort(() => Math.random() - 0.5);
        setCards(deck);
        setSelectedCards([]);
        setMatchedText('');
        setShowLevelClearedPopup(false);

        // Preview mode active
        setIsPreviewing(true);
        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = setTimeout(() => {
          setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
          setIsPreviewing(false);
        }, 1800);
      };

      useEffect(() => {
        initLevel(currentLevel);
        return () => {
          if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        };
      }, [currentLevel]);

      const handleCardClick = (idx) => {
        if (selectedCards.length >= 2 || isPreviewing || clicksLeft <= 0 || isGameOver) return;
        const clickedCard = cards[idx];
        if (clickedCard.isFlipped || clickedCard.isMatched) return;

        synth.playClick();

        // Decrement clicks
        const nextClicksLeft = clicksLeft - 1;
        setClicksLeft(nextClicksLeft);

        const newCards = [...cards];
        newCards[idx].isFlipped = true;
        setCards(newCards);

        const newSelected = [...selectedCards, idx];
        setSelectedCards(newSelected);

        if (newSelected.length === 2) {
          const firstIdx = newSelected[0];
          const secondIdx = newSelected[1];
          const firstCard = cards[firstIdx];
          const secondCard = cards[secondIdx];

          if (firstCard.emoji === secondCard.emoji) {
            // Match!
            setTimeout(() => {
              synth.playSuccess();
              setMatchedText(`${firstCard.name}을(를) 찾았어요!`);

              const matchedCards = newCards.map((c, i) => {
                if (i === firstIdx || i === secondIdx) {
                  return { ...c, isMatched: true };
                }
                return c;
              });
              setCards(matchedCards);
              setSelectedCards([]);

              setTimeout(() => {
                setMatchedText('');
              }, 1200);

              const allMatched = matchedCards.every(c => c.isMatched);
              if (allMatched) {
                setTimeout(() => {
                  if (currentLevel === 5) {
                    // Calculate touch-saving bonus: max 65 bonus points
                    const clicksUsed = 100 - nextClicksLeft;
                    const bonus = Math.max(0, Math.round((100 - clicksUsed) * 0.65));
                    setFinalBonusScore(bonus);
                    setShowFinalScriptureCard(true);
                    synth.playVic();
                  } else {
                    setShowLevelClearedPopup(true);
                    synth.playSuccess();
                    confetti({
                      particleCount: 50,
                      spread: 60,
                      origin: { y: 0.7 }
                    });
                  }
                }, 600);
              } else {
                // Not all matched, check if clicks are exhausted
                if (nextClicksLeft <= 0) {
                  setTimeout(() => {
                    setIsGameOver(true);
                    synth.playBuzz();
                  }, 800);
                }
              }
            }, 400);
          } else {
            // Fail!
            setTimeout(() => {
              synth.playBuzz();
              const revertedCards = [...newCards];
              revertedCards[firstIdx].isFlipped = false;
              revertedCards[secondIdx].isFlipped = false;
              setCards(revertedCards);
              setSelectedCards([]);

              // Check if clicks are exhausted after failing to match
              if (nextClicksLeft <= 0) {
                setIsGameOver(true);
                synth.playBuzz();
              }
            }, 1000);
          }
        }
      };

      const handleHintClick = () => {
        if (coins < 5 || isPreviewing || isGameOver) return;
        synth.playConsume();
        onSpendCoins(5);

        const faceUpState = cards.map(c => ({ ...c, isFlipped: true }));
        setCards(faceUpState);

        setTimeout(() => {
          setCards(prev => prev.map(c => {
            if (c.isMatched) return c;
            return { ...c, isFlipped: false };
          }));
        }, 1200);
      };

      const handleNextLevel = () => {
        synth.playClick();
        setCurrentLevel(prev => prev + 1);
      };

      const levelConfig = levelConfigs[currentLevel - 1];
      const gridColsClass = levelConfig.cols === 2 ? 'grid-cols-2' : levelConfig.cols === 3 ? 'grid-cols-3' : 'grid-cols-4';

      return (
        <div 
          className="flex-1 flex flex-col bg-[#160f0a] relative select-none overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('2stagebg.png')" }}
        >
          {/* Card Game Canvas Area */}
          <div className="flex-1 p-4 flex flex-col justify-between items-center relative z-10">
            {/* Top Level indicator bar */}
            <div className="w-full flex justify-between items-center bg-[#2d1e11]/60 px-3 py-1.5 rounded-xl border border-layton-gold/20 mb-3 text-layton-amber text-xs font-layton-myeongjo">
              <span className="flex items-center gap-1">🦁 Level {currentLevel}/5</span>
              <span className={`font-extrabold px-2.5 py-0.5 rounded-full ${clicksLeft <= 15 ? 'bg-red-600/30 text-red-300 animate-pulse' : 'bg-amber-500/20 text-yellow-300'}`}>
                🎯 남은 터치: {clicksLeft}회
              </span>
            </div>

            {/* Grid Container */}
            <div className="flex-1 w-full flex items-center justify-center">
              <div className={`grid ${gridColsClass} gap-3 max-w-[280px] w-full aspect-square`}>
                {cards.map((card, idx) => {
                  if (card.isMatched) {
                    return <div key={card.id} className="opacity-0 pointer-events-none w-full h-full" />;
                  }

                  return (
                    <div
                      key={card.id}
                      onClick={() => handleCardClick(idx)}
                      className="w-full h-full cursor-pointer relative"
                    >
                      {card.isFlipped ? (
                        <div className={`w-full h-full ${card.bgColor} border-4 border-[#8b5a2b] rounded-2xl flex flex-col items-center justify-center relative shadow-md p-1 scale-in`}>
                          <span className="text-3xl filter drop-shadow-sm">{card.emoji}</span>
                          <span className="text-[10px] font-black text-[#5c4033] font-layton-myeongjo mt-1">{card.name}</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-[#f4ebd0] border-4 border-[#8b5a2b] rounded-2xl flex items-center justify-center relative overflow-hidden shadow-md active:scale-95 transition-transform">
                          <div className="absolute inset-1.5 border border-[#8b5a2b]/30 rounded-xl flex items-center justify-center">
                            <span className="text-2xl opacity-40 select-none">🌿</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating Pair Match Notification Banner */}
            {matchedText && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#36200c]/95 border-2 border-layton-gold text-[#fff5db] font-layton-myeongjo font-bold px-4 py-2.5 rounded-xl z-20 shadow-2xl scale-in-out whitespace-nowrap">
                ✨ {matchedText}
              </div>
            )}

            {/* Memory Preview Banner Overlay */}
            {isPreviewing && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#36200c]/90 border-2 border-layton-gold text-[#fff5db] font-layton-myeongjo font-bold px-4 py-2.5 rounded-xl z-20 shadow-2xl scale-in-out animate-pulse select-none pointer-events-none">
                👀 카드를 기억하세요!
              </div>
            )}

            {/* Bottom Help/Hint HUD Bar */}
            <div className="w-full mt-3 flex justify-between items-center">
              <button
                onClick={handleHintClick}
                disabled={coins < 5 || isPreviewing}
                className={`bg-black/60 border border-stone-800 text-[#e7b85e] hover:text-yellow-300 text-[10px] font-layton-myeongjo font-bold px-3 py-1.5 rounded-full flex items-center gap-0.5 ${
                  (coins < 5 || isPreviewing) ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
                }`}
              >
                💡 힌트 (5🪙)
              </button>
              <span className="text-[9px] text-stone-400 font-layton-myeongjo">
                * 뒤집어서 같은 동물 한 쌍을 찾으세요
              </span>
            </div>
          </div>

          {/* Level Cleared Popup Modal */}
          {showLevelClearedPopup && (
            <div className="absolute inset-0 bg-black/75 z-40 flex items-center justify-center p-4">
              <div className="bg-[#fdfaf2] border-4 border-[#8b5a2b] p-5 rounded-2xl shadow-2xl max-w-[260px] w-full text-center scale-in font-layton-myeongjo">
                <span className="text-4xl block mb-2 filter drop-shadow">🎉</span>
                <h3 className="font-black text-sm text-layton-amber mb-1.5">Level {currentLevel} 성공!</h3>
                <p className="text-[10px] text-layton-dark leading-relaxed mb-4">
                  에덴동산의 동물 짝을 멋지게 찾아냈습니다!<br />다음 단계는 더 많은 동물들이 기다립니다.
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

          {/* Game Over Modal */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/85 z-40 flex items-center justify-center p-4">
              <div className="bg-[#fdfaf2] border-4 border-red-800 p-5 rounded-2xl shadow-2xl max-w-[260px] w-full text-center scale-in font-layton-myeongjo">
                <span className="text-4xl block mb-2 filter drop-shadow">🥀</span>
                <h3 className="font-black text-sm text-red-800 mb-1.5">게임 오버!</h3>
                <p className="text-[10px] text-layton-dark leading-relaxed mb-4">
                  터치 기회를 모두 소진했습니다!<br />처음부터 다시 도전하여 동물의 짝을 찾아주세요.
                </p>
                <button
                  onClick={() => {
                    synth.playClick();
                    setIsGameOver(false);
                    setClicksLeft(100);
                    setCurrentLevel(1);
                    initLevel(1);
                  }}
                  className="w-full py-2 bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black text-xs rounded-xl border-2 border-red-400 shadow active:scale-95 transition-transform"
                >
                  다시 시작하기 🔄
                </button>
              </div>
            </div>
          )}

          {/* Final Level 5 Clear - peaceful Eden & scripture card */}
          {showFinalScriptureCard && (
            <div className="absolute inset-0 bg-[#e0f2fe] flex flex-col justify-between overflow-hidden p-6 z-30 fade-in select-none">
              {/* Soft pastel sun and clouds */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-[#fef08a]/20 to-[#fef08a]/40 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-8 left-10 w-24 h-8 bg-white/40 rounded-full blur-[2px] animate-[pulse_4s_infinite]" />
              <div className="absolute top-16 right-12 w-32 h-10 bg-white/30 rounded-full blur-[1px] animate-[pulse_6s_infinite]" />

              {/* Rolling hills of Eden landscape background */}
              <div className="absolute bottom-0 inset-x-0 h-48 bg-[#bbf7d0]/85 rounded-t-[100px] pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-36 bg-[#86efac]/90 rounded-t-[120px] pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-24 bg-[#4ade80] rounded-t-[150px] pointer-events-none" />

              {/* Eden creatures representation */}
              <div className="absolute bottom-16 left-8 text-3xl animate-bounce">🦁</div>
              <div className="absolute bottom-8 right-10 text-4xl">🐘</div>
              <div className="absolute bottom-20 right-28 text-3xl animate-pulse">🦒</div>
              <div className="absolute bottom-6 left-28 text-2xl">🐑</div>
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-4xl animate-pulse">🌳</div>

              {/* Framing borders */}
              <div className="absolute inset-4 border-2 border-layton-gold/25 rounded-xl pointer-events-none"></div>

              {/* Centered holy Scripture card */}
              <div className="my-auto mx-auto max-w-[280px] w-full bg-[#fdfaf2] border-4 border-[#8b5a2b] p-5 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.35)] z-10 flex flex-col items-center text-center scale-in font-layton-myeongjo">
                <span className="text-3xl block mb-2 filter drop-shadow">📖</span>
                <h3 className="font-black text-xs text-layton-amber tracking-wider border-b border-layton-brown/20 pb-1.5 w-full uppercase">
                  에덴동산의 평화
                </h3>
                
                <p className="text-[11px] text-[#4a2e13] font-bold leading-relaxed my-4 break-keep">
                  "아담이 모든 가축과 공중의 새와 들의 모든 짐승에게 이름을 주니라 (창세기 2:20)"
                </p>

                {/* Bonus Score Banner */}
                <div className="w-full bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 border border-emerald-500/40 rounded-xl p-2.5 mb-3 flex flex-col items-center">
                  <div className="text-[10px] text-emerald-300 font-bold font-layton-myeongjo">
                    🏆 획득 점수
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-yellow-200 font-black text-sm font-layton-myeongjo">+35P</span>
                    {finalBonusScore > 0 && (
                      <span className="text-emerald-300 font-black text-sm font-layton-myeongjo">+{finalBonusScore}P 보너스!</span>
                    )}
                  </div>
                  <div className="text-[9px] text-layton-cream/50 font-layton-myeongjo mt-0.5">
                    남은 터치 {clicksLeft}회 × 0.65 = 절약 보너스
                  </div>
                </div>

                <div className="w-full bg-[#f4edd4] border border-[#d2b48c] p-2.5 rounded-xl text-left text-[9px] text-[#5c4033] leading-relaxed break-keep mb-4">
                  💡 <strong>메시지:</strong> 아담이 동물의 이름을 지어주며 하나님이 만드신 세상을 사랑과 배려로 돌보았듯, 짝을 맞추며 생명을 존중하는 예쁜 마음을 키웠어요!
                </div>

                <button
                  onClick={() => {
                    onSolved('puzzle-002', finalBonusScore);
                  }}
                  className="w-full py-2 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] hover:from-[#f7cb75] hover:to-[#be8420] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200"
                >
                  다음 스테이지로 ➡️
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }


