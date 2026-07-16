    function PuzzleMap({ puzzlesList, completedPuzzles, coins, activePuzzleId, isBgmPlaying, onToggleBgm, profileGender, onSelectPuzzle, onBack, onActivateAdmin }) {
      const nodes = [
        { id: 'puzzle-001', x: 20, y: 18, emoji: '💡', name: '스테이지 1: 빛과 어둠의 분리', picarats: 30 },
        { id: 'puzzle-002', x: 70, y: 32, emoji: '🦁', name: '스테이지 2: 에덴동산의 동물들', picarats: 35 },
        { id: 'puzzle-003', x: 20, y: 46, emoji: '🍎', name: '스테이지 3: 선악과와 인간의 타락', picarats: 40 },
        { id: 'puzzle-004', x: 82, y: 48, emoji: '🚢', name: '스테이지 4: 방주의 잃어버린 짝', picarats: 45 },
        { id: 'puzzle-005', x: 43, y: 62, emoji: '🧱', name: '스테이지 5: 바벨탑과 흩어진 인류', picarats: 50 },
        { id: 'puzzle-006', x: 21, y: 74, emoji: '⛺', name: '스테이지 6: 아브라함과 믿음의 제단', picarats: 55 },
        { id: 'puzzle-007', x: 79, y: 82, emoji: '🐏', name: '스테이지 7: 이삭과 야곱', picarats: 60 },
      ];

      // Find initial character position based on activePuzzleId or completed progress
      const getInitialNode = () => {
        if (activePuzzleId) {
          const match = nodes.find(n => n.id === activePuzzleId);
          if (match) return match;
        }
        // Fallback to last unsolved, or start
        const unsolved = puzzlesList.find(p => !completedPuzzles.includes(p.id));
        if (unsolved) {
          const match = nodes.find(n => n.id === unsolved.id);
          if (match) return match;
        }
        return startNode;
      };
      const initialNode = getInitialNode();
      const [charPos, setCharPos] = useState({ x: initialNode.x, y: initialNode.y });
      const [isWalking, setIsWalking] = useState(false);
      const [activeBubble, setActiveBubble] = useState(null);

      // Play footstep click interval during walking state
      useEffect(() => {
        if (!isWalking) return;
        
        synth.playStep();
        const intervalId = setInterval(() => {
          synth.playStep();
        }, 220);

        return () => clearInterval(intervalId);
      }, [isWalking]);

      const handleNodeClick = (node) => {
        if (isWalking) return;
        setActiveBubble(null);

        if (charPos.x === node.x && charPos.y === node.y) {
          // Already there, open bubble directly
          if (node.id !== 'start') {
            setActiveBubble(node);
          }
          return;
        }

        // Trigger smooth walk
        setIsWalking(true);
        setCharPos({ x: node.x, y: node.y });

        // Wait for walking transition (1.4s) to complete
        setTimeout(() => {
          setIsWalking(false);
          if (node.id !== 'start') {
            setActiveBubble(node);
          }
        }, 1400);
      };

      return (
        <div className="flex-1 flex flex-col bg-layton-parchment z-10 fade-in select-none relative overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#36200c] border-b-2 border-layton-gold p-3 flex justify-between items-center text-center z-10">
            <button 
              onClick={onBack}
              className="text-xs text-layton-amber font-layton-myeongjo font-bold hover:text-yellow-400 transition-colors"
            >
              ◀ 메인메뉴
            </button>
            <h2 className="text-layton-cream font-layton-myeongjo font-bold text-sm">성경 탐험 지도</h2>
            <div className="flex items-center gap-2 text-[9px] text-layton-amber font-sans">
              <button
                onClick={onToggleBgm}
                className="text-xs hover:scale-110 active:scale-90 transition-transform mr-1"
                title="배경음악 켜기/끄기"
              >
                {isBgmPlaying ? '🎵' : '🔇'}
              </button>
              <span className="text-stone-500">|</span>
              <span className="text-yellow-400 font-bold text-[10px]">🪙 {coins}</span>
              <span>|</span>
              <span>총 <span className="font-bold text-[11px] text-layton-gold">{completedPuzzles.length * 30}</span> P</span>
            </div>
          </div>

          {/* Subheader hint */}
          <div className="bg-[#fdf8eb] border-b border-layton-brown/15 py-1 px-3 text-center text-[10px] text-layton-brown font-layton-myeongjo font-bold z-10 shadow-sm leading-tight break-keep">
            📍 지도의 아이콘을 터치하여 꼬마 탐정을 이동시키고 수수께끼를 해결하세요!
          </div>

          {/* Map Content Canvas Area */}
          <div className="flex-1 relative bg-stone-900 overflow-hidden shadow-inner">
            
            {/* Map Background Illustration */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
              style={{ backgroundImage: "url('map_bg.jpg')", backgroundSize: '100% 100%' }}
            />

            {/* Puzzle Landmarks Nodes */}
            {nodes.map((node, index) => {
              const isCompleted = completedPuzzles.includes(node.id);
              // Progressive unlocking system: first stage is unlocked, or unlocked if previous stage is completed
              const isLocked = index > 0 && !completedPuzzles.includes(nodes[index - 1].id);

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className="absolute text-center flex flex-col items-center pointer-events-auto cursor-pointer group z-10"
                  style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {/* Bobbing effect for active landmarks */}
                  <div className={`w-12 h-12 rounded-full border-2 bg-gradient-to-b flex items-center justify-center text-2xl relative shadow-md transition-all duration-200 active:scale-90 ${
                    isLocked 
                      ? 'from-stone-300 to-stone-400 border-stone-500 opacity-60'
                      : isCompleted
                        ? 'from-[#fdf6e2] to-[#dfb973] border-yellow-600 hover:border-yellow-500 ring-2 ring-yellow-400/30'
                        : 'from-[#ffffff] to-[#eddcb9] border-layton-brown hover:border-layton-gold hover:scale-105'
                  } mini-float`}>
                    
                    {/* Landmark Emoji Icon */}
                    <span>{isLocked ? '🔒' : node.emoji}</span>

                    {/* Solved Stamp Badge */}
                    {isCompleted && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-[#ffeedd] text-[7px] font-black px-1 py-0.2 rounded border border-red-500 shadow-sm uppercase scale-105 rotate-[8deg] select-none tracking-wider animate-pulse">
                        ✓
                      </span>
                    )}
                  </div>
                  
                  {/* Mini title tag under node */}
                  <span className="bg-[#4a2e13]/85 text-[#fdf8eb] text-[8px] font-black px-1.5 py-0.5 rounded-full border border-layton-gold/30 mt-1 pointer-events-none font-layton-myeongjo shadow">
                    {`스테이지 ${index + 1}`}
                  </span>
                </div>
              );
            })}

            {/* Walking Detective Character Avatar */}
            <div 
              className={`absolute pointer-events-none z-20 ${isWalking ? 'walk-bob' : ''}`}
              style={{
                left: `${charPos.x}%`,
                top: `${charPos.y}%`,
                transform: 'translate(-50%, -90%)',
                transition: 'left 1.4s ease-in-out, top 1.4s ease-in-out'
              }}
            >
              <div className="relative flex flex-col items-center">
                {/* Cute Explorer standing image avatar */}
                <div className="w-10 h-16 overflow-hidden flex items-center justify-center">
                  <img 
                    src={profileGender === 'girl' ? 'girl.png' : 'boy.png'} 
                    className="h-full object-contain" 
                    alt="Explorer Token"
                  />
                </div>
                {/* Foot shadow under explorer */}
                <div className="w-6 h-1.5 bg-black/20 rounded-full blur-[1px] mt-0.5"></div>
              </div>
            </div>

            {/* Dialog Level Bubble Card Modal */}
            {activeBubble && (
              <div className="absolute bottom-4 left-4 right-4 bg-layton-parchment rounded-2xl border-4 border-layton-brown p-3.5 shadow-2xl flex flex-col items-center text-center solved-banner z-30">
<span className="text-2xl mb-1">{activeBubble.emoji}</span>
                <span className="text-[8px] bg-amber-500 text-[#2c1a0c] font-black px-2 py-0.2 rounded-full font-sans uppercase">
                  PUZZLE {activeBubble.id.replace('puzzle-', '')}
                </span>
                
                <h3 className="font-layton-myeongjo font-black text-xs text-layton-dark mt-1.5 mb-1 break-keep">
                  {activeBubble.name}
                </h3>
                <p className="text-[10px] text-layton-lightbrown font-sans font-medium mb-3">
                  배점: <span className="font-bold text-layton-brown">{activeBubble.picarats} Picarats</span>
                  {completedPuzzles.includes(activeBubble.id) && <span className="text-red-700 font-extrabold ml-2 font-serif">★ SOLVED ★</span>}
                </p>

                {(() => {
                  const bubbleIndex = nodes.findIndex(n => n.id === activeBubble.id);
                  const isDynamicallyLocked = bubbleIndex > 0 && !completedPuzzles.includes(nodes[bubbleIndex - 1].id);
                  return isDynamicallyLocked ? (
                    <div className="w-full text-center py-2 bg-stone-200 border border-stone-300 text-stone-500 font-black text-xs rounded-xl font-layton-myeongjo">
                      🔒 이전 스테이지를 먼저 클리어하세요!
                    </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setActiveBubble(null)}
                      className="flex-1 py-2 bg-stone-300 hover:bg-stone-400 text-stone-800 text-xs font-bold rounded-xl border border-stone-400 transition-colors font-layton-myeongjo active:scale-95"
                    >
                      지도 닫기
                    </button>
                    <button
                      onClick={() => onSelectPuzzle(activeBubble.id)}
                      className="flex-1 py-2 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] hover:from-[#fcf4dc] hover:to-[#dcd0ac] text-layton-dark text-xs font-black rounded-xl border-2 border-[#f2e7cb] shadow active:scale-95 transition-all font-layton-myeongjo"
                    >
                      도전하기! 🎯
                    </button>
                  </div>
                 );
                })()}
              </div>
            )}

          </div>

        </div>
      );
    }

    // MAIN CONTROLLER APP COMPONENT
