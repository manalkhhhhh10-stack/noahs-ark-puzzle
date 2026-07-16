    function PuzzleFiveLoaves({ coins, onSpendCoins, onBack, onSolved }) {
      const [questionIndex, setQuestionIndex] = useState(0);
      const [gauge, setGauge] = useState(0);
      const [showWarningModal, setShowWarningModal] = useState(false);
      const [shakeScreen, setShakeScreen] = useState(false);
      const [showHint, setShowHint] = useState(false);
      const [hintUnlocked, setHintUnlocked] = useState(false);
      const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
      const [fallingItems, setFallingItems] = useState([]);

      const onSolvedRef = useRef(onSolved);
      useEffect(() => {
        onSolvedRef.current = onSolved;
      }, [onSolved]);

      const quizQuestions = [
        {
          q: "예수님이 5천 명을 먹이실 때 사용한 보리떡은 몇 개인가요?",
          options: ["5개", "50개", "5천 개"],
          correctIdx: 0,
          hint: "보리떡 5개와 물고기 2마리를 가져온 소년의 성경 기록을 생각해보세요."
        },
        {
          q: "다 먹고 남은 조각은 12광주리에 가득 찼다. (O / X)",
          options: ["O (그렇다)", "X (아니다)"],
          correctIdx: 0,
          hint: "기적의 떡을 다 먹은 후 남은 부스러기가 12바구니에 가득 찼는지 성경 기록을 찾아보세요."
        },
        {
          q: "예수님이 오병이어 기적으로 먹인 사람의 수는 여자와 어린아이 외에 총 몇 명인가요?",
          options: ["5,000명", "5명", "500,000명"],
          correctIdx: 0,
          hint: "오병이어로 먹은 남자 어른의 수를 생각해보세요. 오병이어의 이름 뜻도 힌트입니다."
        },
        {
          q: "오병이어 기적에 쓰인 물고기는 총 몇 마리인가요?",
          options: ["2마리", "22마리", "2만 마리"],
          correctIdx: 0,
          hint: "오병이어(五餠二魚)에서 '이魚'는 물고기가 몇 마리인지 알려줍니다."
        },
        {
          q: "이 오병이어의 도시락을 처음 예수님께 드린 사람은 누구인가요?",
          options: ["한 어린아이", "베드로 사도", "빌라도 총독"],
          correctIdx: 0,
          hint: "예수님의 손에 보리떡 5개와 물고기 2마리가 든 작은 도시락을 바쳤던 어린 헌신자를 생각해보세요."
        }
      ];

      const handleRestart = () => {
        setQuestionIndex(0);
        setGauge(0);
        setShowWarningModal(false);
        setShakeScreen(false);
        setShowHint(false);
        setShowUnlockConfirm(false);
        setFallingItems([]);
      };

      const handleHintClick = () => {
        if (hintUnlocked) {
          setShowHint(true);
        } else {
          synth.playClick();
          setShowUnlockConfirm(true);
        }
      };

      const handleConfirmUnlock = () => {
        if (coins >= 10) {
          onSpendCoins(10);
          setHintUnlocked(true);
          setShowUnlockConfirm(false);
          setShowHint(true);
        } else {
          synth.playBarrier();
          alert(`코인이 부족합니다!\n(필요 코인: 10개, 보유 코인: ${coins}개)`);
          setShowUnlockConfirm(false);
        }
      };

      const handleOptionClick = (idx) => {
        const currentQ = quizQuestions[questionIndex];
        
        if (idx === currentQ.correctIdx) {
          // Player selected the correct biblical answer (Winning choice!)
          synth.playConsume();
          const nextGauge = Math.min(100, gauge + 20);
          setGauge(nextGauge);

          // Trigger falling food icons shower animation
          const items = Array.from({ length: 15 }).map((_, i) => ({
            id: Date.now() + i + Math.random(),
            x: Math.random() * 90 + 5,
            type: Math.random() > 0.5 ? 'bread' : 'fish',
            delay: Math.random() * 0.4
          }));
          setFallingItems(prev => [...prev, ...items]);

          // Clear completed falling items after animation duration (1.6s)
          setTimeout(() => {
            setFallingItems(prev => prev.filter(item => !items.includes(item)));
          }, 1800);

          // Proceed to next question
          if (nextGauge >= 100) {
            // Success!
            setTimeout(() => {
              onSolvedRef.current('puzzle-002');
            }, 800);
          } else {
            // Go to next question
            setQuestionIndex(prev => (prev + 1) % quizQuestions.length);
          }
        } else {
          // Player selected an incorrect biblical answer (Losing choice!)
          synth.playBarrier();
          setShakeScreen(true);
          setTimeout(() => setShakeScreen(false), 500);
          setGauge(prev => Math.max(0, prev - 20));
          setShowWarningModal(true);
        }
      };

      const currentQuestion = quizQuestions[questionIndex];

      return (
        <div className={`flex-1 flex flex-col fade-in transition-transform duration-300 ${
          shakeScreen ? 'shake-animation' : ''
        }`}>
          {/* Story Parchment Textbox */}
          <div className="relative p-2.5 bg-layton-parchment border-b-2 border-layton-brown/30 flex-none z-10 shadow-inner">
            <div className="bg-[#f5ebd3]/80 p-2 rounded-lg border border-[#e5d4ab] shadow-sm text-layton-dark text-center">
              <p className="font-layton-myeongjo text-[11px] leading-relaxed font-bold break-keep">
                제자들의 배가 너무 고픕니다! 올바른 성경 정답을 맞춰 보리떡과 물고기가 불어나도록 기적을 부려주세요. 
                <span className="text-red-700 font-extrabold mx-1">틀린 오답</span>을 고르면 떡이 사라지고 점수가 깎이니 주의하세요!
              </p>
            </div>
          </div>

          {/* Interactive Game Layout Frame */}
          <div className="flex-1 bg-[#25170d]/90 p-3 flex flex-col justify-between items-center relative overflow-hidden">
            
            {/* Falling food animated items renderer */}
            {fallingItems.map(item => (
              <div 
                key={item.id}
                className="falling-food-item z-30 text-2xl drop-shadow-md"
                style={{
                  left: `${item.x}%`,
                  animationDelay: `${item.delay}s`
                }}
              >
                {item.type === 'bread' ? '🍞' : '🐟'}
              </div>
            ))}

            {/* Top Stats Box (12 baskets progress bar) */}
            <div className="w-full bg-[#f4ebd0] border-2 border-layton-gold rounded-xl p-2 mb-2 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🧺</span>
                <span className="font-layton-myeongjo text-xs font-black text-layton-brown">12광주리 게이지</span>
              </div>
              <div className="flex-1 mx-3 bg-[#4a2f13]/20 h-3 rounded-full overflow-hidden border border-[#4a2f13]/30">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${gauge}%` }}
                ></div>
              </div>
              <div className="text-[11px] font-black text-layton-brown font-serif">{gauge}%</div>
            </div>

            {/* Blackboard Board Frame containing Quiz */}
            <div className="w-full flex-1 flex flex-col justify-between bg-[#0b3c2a] border-4 border-layton-brown rounded-2xl p-4 shadow-inner relative z-10">
              
              {/* Gold outline border inside blackboard */}
              <div className="absolute inset-1 border border-emerald-600 rounded-xl pointer-events-none opacity-40"></div>

              {/* Disciple Avatar Box */}
              <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-800 rounded-xl p-2.5">
                {/* Cute SVG Face representing hungry disciple */}
                <div className="w-11 h-11 rounded-full bg-[#dfb973] border-2 border-layton-gold flex items-center justify-center text-2xl relative shadow-md">
                  👨‍🌾
                  {/* Hunger drool or drop effect */}
                  <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">💧</span>
                </div>
                <div className="flex-1 text-left">
                  <span className="text-[8px] bg-amber-500 text-[#2c1a0c] font-black px-1.5 py-0.2 rounded-full font-sans uppercase">Question {questionIndex + 1} / 5</span>
                  <p className="text-[10px] text-emerald-200/90 font-bold font-layton-myeongjo mt-0.5">배고픈 예수님의 제자</p>
                </div>
              </div>

              {/* Question Text */}
              <div className="flex-1 flex items-center justify-center my-4 px-2">
                <p className="text-center font-layton-myeongjo font-bold text-sm text-[#fdf8eb] leading-relaxed break-keep">
                  "{currentQuestion.q}"
                </p>
              </div>

              {/* Choices Options List */}
              <div className="flex flex-col gap-2">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    className="w-full py-2.5 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] hover:from-[#fcf4dc] hover:to-[#dcd0ac] text-layton-dark font-black font-layton-myeongjo text-xs rounded-xl border-2 border-[#f2e7cb] shadow-[0_3px_5px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-150 text-center"
                  >
                    {opt}
                  </button>
                ))}
              </div>

            </div>

            {/* Bottom button controls */}
            <div className="w-full flex justify-between items-center mt-3.5 px-1 z-10">
              <button
                onClick={handleHintClick}
                className="bg-gradient-to-b from-[#b17d3b] to-[#7f511c] text-[#fcf5e3] border border-layton-gold/60 font-semibold px-4 py-1.5 rounded-full text-xs font-layton-myeongjo shadow-md active:scale-95 transition-all"
              >
                💡 힌트 보기 {hintUnlocked ? '(해제됨)' : '(🪙 10)'}
              </button>

              <button
                onClick={handleRestart}
                className="bg-gradient-to-b from-[#8f8070] to-[#5a4e42] text-[#fcf5e3] border border-stone-400/40 font-semibold px-4 py-1.5 rounded-full text-xs font-layton-myeongjo shadow-md active:scale-95 transition-all"
              >
                🔄 다시 풀기
              </button>
            </div>

          </div>

          {/* Warning Modal Overlay ("땡! 틀렸습니다.") */}
          {showWarningModal && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-5">
              <div className="bg-layton-parchment rounded-2xl border-4 border-red-700 p-5 shadow-2xl w-full max-w-[300px] flex flex-col items-center solved-banner text-center">
                <span className="text-3xl mb-1.5">📖</span>
                <h3 className="font-layton-myeongjo font-black text-sm text-red-800 mb-2">
                  땡! 틀렸습니다.
                </h3>
                <p className="text-layton-dark text-[11px] leading-relaxed font-medium font-layton-myeongjo mb-4 break-keep">
                  성경 기록과 다른 잘못된 대답입니다! 
                  제자들에게 풍성한 오병이어의 기적을 베풀기 위해 다시 잘 생각하셔서 **성경 속 진짜 정답**을 골라주세요!
                </p>
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="w-full py-2 bg-gradient-to-b from-red-700 to-red-950 hover:from-red-600 hover:to-red-800 text-[#fff5db] text-xs font-bold rounded-xl border border-red-500 shadow-md active:scale-95 transition-colors font-layton-myeongjo"
                >
                  다시 도전하기 🔄
                </button>
              </div>
            </div>
          )}

          {/* Hint Overlay */}
          {showHint && (
            <div className="absolute inset-0 bg-layton-dark/80 backdrop-blur-[2px] z-40 flex items-center justify-center p-5">
              <div className="bg-layton-parchment rounded-xl border-4 border-layton-amber p-4 shadow-2xl w-full max-w-[300px] flex flex-col items-center solved-banner">
                <div className="w-10 h-10 rounded-full bg-layton-amber flex items-center justify-center text-xl mb-2 text-layton-dark">💡</div>
                <h3 className="font-layton-myeongjo font-black text-sm text-layton-brown mb-2 font-layton-myeongjo">수수께끼 힌트</h3>
                <p className="text-layton-dark text-xs text-center leading-relaxed font-medium font-layton-myeongjo mb-4 break-keep font-layton-myeongjo">
                  "{currentQuestion.hint}"
                </p>
                <button
                  onClick={() => setShowHint(false)}
                  className="w-full py-1.5 bg-layton-brown hover:bg-layton-lightbrown text-layton-cream text-xs font-bold rounded-lg border border-layton-gold transition-colors font-layton-myeongjo"
                >
                  돌아가기
                </button>
              </div>
            </div>
          )}

          {/* Hint Unlock Confirmation Modal */}
          {showUnlockConfirm && (
            <div className="absolute inset-0 bg-layton-dark/80 backdrop-blur-[2px] z-50 flex items-center justify-center p-5">
              <div className="bg-layton-parchment rounded-xl border-4 border-layton-amber p-4 shadow-2xl w-full max-w-[280px] flex flex-col items-center solved-banner text-center">
                <span className="text-3xl mb-1">🪙</span>
                <h3 className="font-layton-myeongjo font-black text-sm text-layton-brown mb-2 font-layton-myeongjo">힌트 해제</h3>
                <p className="text-layton-dark text-xs font-medium font-layton-myeongjo mb-4 break-keep font-layton-myeongjo">
                  힌트를 해제하시겠습니까?<br />
                  <span className="font-bold text-red-700">10 코인</span>이 소모됩니다.<br />
                  <span className="text-[10px] text-stone-500 font-sans">(보유 코인: {coins}개)</span>
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setShowUnlockConfirm(false)}
                    className="flex-1 py-1.5 bg-stone-300 hover:bg-stone-400 text-stone-800 text-xs font-bold rounded-lg border border-stone-400 transition-colors font-layton-myeongjo"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmUnlock}
                    className="flex-1 py-1.5 bg-layton-brown hover:bg-layton-lightbrown text-layton-cream text-xs font-bold rounded-lg border border-layton-gold transition-colors font-layton-myeongjo shadow-md"
                  >
                    해제 (10🪙)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // EXPLORE MAP COMPONENT (Mario-style)
