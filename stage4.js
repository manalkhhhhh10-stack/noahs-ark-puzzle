    // STAGE 4: 방주의 거짓말쟁이 (PuzzleNoahDeduction)
    // ─────────────────────────────────────────────
    function PuzzleNoahDeduction({ coins, onSpendCoins, onBack, onSolved }) {
      const { useState, useEffect } = React;

      // 스프라이트 자르기 정보 (4stagei.png 원본 크기: 1024x1536)
      const SPRITE_INFO = {
        footprint: { x1: 49, y1: 168, w: 339, h: 209 },
        wood: { x1: 656, y1: 163, w: 278, h: 234 },
        hammer: { x1: 77, y1: 507, w: 272, h: 268 },
        nail: { x1: 671, y1: 565, w: 221, h: 167 },
        sawdust: { x1: 78, y1: 906, w: 291, h: 180 },
        memo: { x1: 658, y1: 840, w: 239, h: 282 },
        blueprint: { x1: 66, y1: 1225, w: 337, h: 246 }
      };

      // 단서 리스트 정의
      const CLUES = [
        { id: 'footprint', name: '동물 발자국', desc: '방주 주변에 찍힌 거대하고 선명한 동물 발자국이다. 동물들이 사방에서 모여들고 있음을 증명한다.' },
        { id: 'wood', name: '나무 조각', desc: '방주를 지을 때 사용한 단단한 고페르 나무 조각이다. 물이 스며들지 않도록 역청이 칠해져 있다.' },
        { id: 'hammer', name: '낡은 망치', desc: '방주 골조를 고정할 때 사용한 노아의 낡은 망치다. 오랜 시간 동안 쉬지 않고 일한 흔적이 묻어 있다.' },
        { id: 'nail', name: '놋못', desc: '나무 널빤지들을 튼튼하게 결합하기 위해 사용된 청동 놋못이다.' },
        { id: 'sawdust', name: '나무 톱밥', desc: '수많은 나무를 베고 다듬으며 쌓인 톱밥 더미다. 방주 건설이 오랜 시간 지속되었음을 말해준다.' },
        { id: 'memo', name: '노아의 메모', desc: '노아가 가죽에 적어둔 메모다. \'하나님의 명령대로 길이 300규빗, 너비 50규빗, 높이 30규빗으로 지으라...\'라고 기록되어 있다.' },
        { id: 'blueprint', name: '설계도 조각', desc: '양가죽에 그려진 거대한 3층 방주의 설계도 일부다. 하늘의 크기와 규격에 완벽히 맞추어져 있다.' }
      ];

      // 7개 단서 배치 좌표 (배경 그림 구조에 매칭)
      const CLUE_POSITIONS = [
        { clueId: 'footprint', x: 15, y: 55 },
        { clueId: 'wood', x: 72, y: 65 },
        { clueId: 'hammer', x: 40, y: 72 },
        { clueId: 'nail', x: 58, y: 48 },
        { clueId: 'sawdust', x: 22, y: 78 },
        { clueId: 'memo', x: 82, y: 42 },
        { clueId: 'blueprint', x: 48, y: 28 }
      ];

      // NPC 진술 리스트
      const NPCS = [
        { id: 'A', name: '마을 사람 A', emoji: '👨', text: '“노아는 아무 이유 없이 저 거대한 배를 산 위에다 만들고 있어. 시간 낭비야!”' },
        { id: 'B', name: '마을 사람 B', emoji: '👩', text: '“동물들이 암수 둘씩 신기하게 짝을 지어서 방주 안으로 모이고 있는걸 봤어.”' },
        { id: 'C', name: '마을 사람 C', emoji: '👴', text: '“하나님은 저 노아라는 노인에게 아무런 말씀도 하지 않으셨고 약속도 한 적 없어!”', isLiar: true },
        { id: 'D', name: '마을 사람 D', emoji: '👦', text: '“노아 할아버지는 정말 오랫동안 정성을 다해 방주를 단단히 만들고 있어.”' }
      ];

      const [searchedClues, setSearchedClues] = useState({});
      const [activeClue, setActiveClue] = useState(null);
      const [showNotes, setShowNotes] = useState(false);
      const [phase, setPhase] = useState('explore'); // 'explore' | 'deduce' | 'cutscene' | 'clear'
      const [selectedNPC, setSelectedNPC] = useState(null);
      const [showLiarAlert, setShowLiarAlert] = useState(false);
      const [cutsceneFrame, setCutsceneFrame] = useState(0);

      const searchedCount = Object.keys(searchedClues).filter(k => searchedClues[k]).length;
      const canDeduce = searchedCount >= 5;

      // NPC 스프라이트 위치 정보 (4stagenpc.png 기준)
      const NPC_SPRITE = {
        A: { x1: 45, y1: 512, w: 230, h: 243 },
        B: { x1: 417, y1: 512, w: 226, h: 239 },
        C: { x1: 42, y1: 101, w: 239, h: 259 }, // Y2 조정 (511 -> 360)
        D: { x1: 410, y1: 105, w: 231, h: 260 }  // Y2 조정 (511 -> 365)
      };

      const getNPCSpriteStyle = (npcId, targetHeight = 65) => {
        const sprite = NPC_SPRITE[npcId];
        if (!sprite) return {};
        const { x1, y1, w, h } = sprite;
        const scale = targetHeight / h;
        const finalWidth = w * scale;
        const bgWidth = 682 * scale;
        const bgHeight = 1024 * scale;
        const posX = -x1 * scale;
        const posY = -y1 * scale;

        return {
          backgroundImage: "url('4stagenpc.png')",
          backgroundPosition: `${posX}px ${posY}px`,
          backgroundSize: `${bgWidth}px ${bgHeight}px`,
          width: `${finalWidth}px`,
          height: `${targetHeight}px`,
          backgroundRepeat: 'no-repeat'
        };
      };

      // 스프라이트 렌더링용 스타일 생성 함수
      const getSpriteStyle = (clueId, targetWidth = 60) => {
        const sprite = SPRITE_INFO[clueId];
        if (!sprite) return {};
        const { x1, y1, w, h } = sprite;
        const scale = targetWidth / w;
        const finalHeight = h * scale;
        const bgWidth = 1024 * scale;
        const bgHeight = 1536 * scale;
        const posX = -x1 * scale;
        const posY = -y1 * scale;

        return {
          backgroundImage: "url('4stagei.png')",
          backgroundPosition: `${posX}px ${posY}px`,
          backgroundSize: `${bgWidth}px ${bgHeight}px`,
          width: `${targetWidth}px`,
          height: `${finalHeight}px`,
          backgroundRepeat: 'no-repeat'
        };
      };

      const handleClueClick = (clue) => {
        setSearchedClues(prev => ({ ...prev, [clue.id]: true }));
        setActiveClue(clue);
        synth.playClick();
      };

      const handleNPCClick = (npc) => {
        setSelectedNPC(npc);
        if (npc.isLiar) {
          synth.playSuccess();
          setPhase('cutscene');
        } else {
          synth.playO();
          setShowLiarAlert(true);
        }
      };

      // 컷신 애니메이션 이펙트
      useEffect(() => {
        if (phase !== 'cutscene') return;
        const interval = setInterval(() => {
          setCutsceneFrame(f => (f + 1) % 4);
        }, 800);
        return () => clearInterval(interval);
      }, [phase]);

      return (
        <div className="relative w-full max-w-md mx-auto h-[600px] bg-gradient-to-b from-[#6b4724] to-[#3a220f] overflow-hidden rounded-3xl shadow-2xl flex flex-col font-layton-myeongjo text-[#5c4033] border-4 border-[#503319] select-none">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#523317] border-b-2 border-[#3d230d] text-white z-10">
            <button onClick={onBack} className="p-1 text-sm bg-[#784d28] hover:bg-[#8e5c32] active:scale-95 rounded-lg border border-[#9a6a3b] transition-all">
              ⬅️ 지도
            </button>
            <div className="text-center">
              <span className="text-[9px] text-[#cca274] font-black uppercase tracking-wider">STAGE 4</span>
              <h2 className="text-xs font-black text-[#ffd19a]">방주의 거짓말쟁이</h2>
            </div>
            <div className="px-2 py-0.5 bg-[#ab7a4e] text-[9px] rounded-full font-bold border border-[#ffd5af]">
              {phase === 'explore' ? '조사 모드 🔎' : phase === 'deduce' ? '추리 모드 💬' : '스토리 🎬'}
            </div>
          </div>

          {/* 1. EXPLORE PHASE */}
          {phase === 'explore' && (
            <div 
              className="relative flex-1 w-full overflow-hidden flex flex-col justify-between" 
              style={{ 
                backgroundImage: "url('4stageb.png')", 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              
              {/* Construction area overlay visual shadow for depth */}
              <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

              {/* Clue Hotspots (Rendered via sprite clipping) */}
              {CLUE_POSITIONS.map(pos => {
                const clue = CLUES.find(c => c.id === pos.clueId);
                const isSearched = searchedClues[clue.id];
                return (
                  <button
                    key={clue.id}
                    onClick={() => handleClueClick(clue)}
                    className="absolute group flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-300 hover:scale-115 active:scale-95 hover:brightness-110 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="relative">
                      {/* Sprited item crop */}
                      <div style={getSpriteStyle(clue.id, 45)} className="rounded-lg" />
                      
                      {isSearched ? (
                        <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-black border-2 border-white shadow-md">
                          ✔
                        </div>
                      ) : (
                        <div className="absolute -top-2.5 -right-2.5 bg-yellow-400 text-[#4e2d0c] rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold border border-[#ffe8b5] animate-ping">
                          ❓
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Lower HUD buttons */}
              <div className="absolute inset-x-0 bottom-4 px-4 flex justify-between items-center z-10">
                <button
                  onClick={() => setShowNotes(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#4a2e16] hover:bg-[#5a391d] active:scale-95 text-[#e4c09d] text-[10px] font-bold rounded-xl border border-[#714624] shadow-lg transition-all"
                >
                  📓 단서 노트
                </button>
                <div className="bg-[#412811]/85 border border-[#6b4728] px-3 py-1 rounded-full text-[9px] text-[#ffd19a] font-bold shadow-md">
                  조사 완료: {searchedCount} / 7
                </div>
                <button
                  onClick={() => setPhase('deduce')}
                  disabled={!canDeduce}
                  className={`px-4 py-2 text-xs font-black rounded-xl border-2 shadow-lg transition-all ${canDeduce ? 'bg-gradient-to-b from-[#f59e0b] to-[#b45309] text-white border-[#fef3c7] hover:scale-105 active:scale-95' : 'bg-gray-400 text-gray-200 border-gray-300 opacity-50 cursor-not-allowed'}`}
                >
                  🔍 추리 시작
                </button>
              </div>

              {/* Active Clue Detail Modal (Layton Style Pop) */}
              {activeClue && (
                <div className="absolute inset-0 bg-black/55 z-30 flex items-center justify-center p-4">
                  <div className="bg-[#fffdf9] border-4 border-[#855422] p-5 rounded-2xl shadow-2xl text-center max-w-[270px] w-full pop-in font-layton-myeongjo">
                    <div className="flex justify-center mb-2 filter drop-shadow-md">
                      {/* Scaled sprite for popup */}
                      <div style={getSpriteStyle(activeClue.id, 90)} className="mx-auto rounded-lg" />
                    </div>
                    <h3 className="font-black text-sm text-[#5a3615] mt-2 border-b border-[#cca379] pb-1 inline-block px-4">
                      {activeClue.name}
                    </h3>
                    <p className="text-[10px] text-gray-600 mt-3 leading-relaxed text-justify break-keep">
                      {activeClue.desc}
                    </p>
                    <button
                      onClick={() => setActiveClue(null)}
                      className="w-full mt-4 py-2 bg-[#855422] text-white font-black text-[10px] rounded-lg hover:bg-[#6c4219] transition-all active:scale-95 shadow"
                    >
                      닫기 ✖
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. DEDUCE PHASE (NPC 진술 판독) */}
          {phase === 'deduce' && (
            <div className="flex-1 w-full bg-[#fdfaf2] p-4 flex flex-col justify-between overflow-y-auto">
              
              <div className="text-center border-b border-[#825324]/30 pb-2 mb-3">
                <span className="text-[9px] text-[#8c653f] font-bold tracking-widest uppercase">TESTIMONIAL ANALYSIS</span>
                <h3 className="font-black text-sm text-[#4a2e16] mt-0.5">거짓말을 하는 사람을 찾으세요!</h3>
                <p className="text-[9px] text-gray-500">지금까지 수집한 성경 단서들을 토대로 잘못 말하는 1인을 터치하세요.</p>
              </div>

              {/* NPC speech bubbles list */}
              <div className="flex-1 flex flex-col gap-3 justify-center">
                {NPCS.map(npc => (
                  <button
                    key={npc.id}
                    onClick={() => handleNPCClick(npc)}
                    className="flex items-start gap-3 bg-white border-2 border-[#cca379] hover:border-[#825324] hover:bg-[#fefcf8] rounded-2xl p-3 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <div className="flex flex-col items-center shrink-0 w-[55px]">
                      {/* Sprited NPC Face */}
                      <div style={getNPCSpriteStyle(npc.id, 55)} className="rounded-xl border border-[#cca379] bg-[#fffdfa] shadow-sm overflow-hidden" />
                      <span className="text-[8px] bg-[#825324] text-white px-1.5 py-0.5 rounded-full font-bold mt-1.5 whitespace-nowrap">
                        {npc.name}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[10px] text-[#3a2007] leading-relaxed break-keep font-medium">
                        {npc.text}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Lower notes & return button */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowNotes(true)}
                  className="flex-1 py-2 bg-[#4a2e16] hover:bg-[#5a391d] text-[#e4c09d] text-[10px] font-bold rounded-xl border border-[#714624] transition-all shadow"
                >
                  📓 단서 노트 확인
                </button>
                <button
                  onClick={() => setPhase('explore')}
                  className="flex-1 py-2 bg-[#f3f4f6] hover:bg-gray-100 text-gray-700 text-[10px] font-bold rounded-xl border border-gray-300 transition-all shadow"
                >
                  🔎 단서 더 찾으러 가기
                </button>
              </div>

              {/* Incorrect guess alert modal */}
              {showLiarAlert && (
                <div className="absolute inset-0 z-30 bg-black/55 flex items-center justify-center p-4">
                  <div className="bg-[#fff5f5] border-4 border-[#dc2626] p-5 rounded-2xl shadow-2xl text-center max-w-[250px] w-full pop-in">
                    <span className="text-4.5xl">💡🧐</span>
                    <h4 className="font-black text-sm text-[#dc2626] mt-2">단서를 다시 조사해보자.</h4>
                    <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                      지목한 사람의 진술은 수집된 단서들과 배치되지 않는 사실인 것 같아요.
                    </p>
                    <button
                      onClick={() => {
                        setShowLiarAlert(false);
                        setPhase('explore'); // 오답 시 맵으로 복귀
                      }}
                      className="w-full mt-4 py-2 bg-gradient-to-b from-[#ef4444] to-[#b91c1c] text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      단서 찾기로 돌아가기 ➡️
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 3. CUTSCENE PHASE (노아가 말씀을 들음) */}
          {phase === 'cutscene' && (
            <div className="flex-1 w-full bg-[#1e293b] overflow-hidden flex flex-col justify-between p-4 relative">
              
              {/* Starry Night Sky and Mountain background (CSS-driven animation) */}
              <div className="absolute inset-0 bg-[#0f172a]" style={{ backgroundImage: "radial-gradient(circle at 50% 30%, #1e293b 0%, #090d16 100%)" }}></div>

              {/* Stars twinkling */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-8 left-12 w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute top-20 right-16 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse"></div>
                <div className="absolute top-36 left-28 w-1 h-1 bg-white rounded-full animate-pulse delay-500"></div>
              </div>

              {/* Detective Success Banner */}
              <div className="relative z-10 text-center mt-2 animate-bounce">
                <span className="bg-yellow-400 text-yellow-950 font-black text-sm px-6 py-1.5 rounded-full border-4 border-white shadow-lg tracking-widest inline-block">
                  🕵️‍♂️ 탐정 성공!
                </span>
              </div>

              {/* Animated Scene Area */}
              <div className="relative flex-1 w-full flex items-center justify-center z-10">
                {/* Noah Figure */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  {/* Kneeling Noah Emoji */}
                  <span className="text-7xl filter drop-shadow-[0_4px_10px_rgba(253,224,71,0.5)] transform scale-x-[-1] animate-pulse">
                    🧎‍♂️
                  </span>
                  <span className="text-[9px] bg-slate-900/80 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/20 mt-1">
                    경청하는 노아
                  </span>
                </div>

                {/* Scaffolding ark under construction draft in darkness */}
                <div className="absolute bottom-0 left-6 right-6 h-12 bg-amber-950/40 rounded-t-xl border-t border-amber-900/40 pointer-events-none flex items-center justify-center">
                  <span className="text-xl opacity-40">🚢🚧</span>
                </div>

                {/* God's voice ray beam effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[320px] bg-gradient-to-b from-yellow-300/45 via-yellow-200/20 to-transparent clip-path-beam animate-pulse"></div>
              </div>

              {/* Captions sub */}
              <div className="relative z-10 bg-slate-950/80 border border-yellow-500/30 p-3 rounded-2xl text-center">
                <p className="text-yellow-300 text-[10.5px] leading-relaxed break-keep font-medium">
                  {cutsceneFrame === 0 && "“노아야, 너는 고페르 나무로 너를 위하여 방주를 만들고...”"}
                  {cutsceneFrame === 1 && "“내가 홍수를 땅에 일으켜 무릇 생명의 기운이 있는 모든 육체를 천하에서 멸절하리니...”"}
                  {cutsceneFrame === 2 && "“그러나 너와는 내가 내 언약을 세우리니 너는 네 아들들과 네 아내와 네 며느리들과 함께 그 방주로 들어가라.”"}
                  {cutsceneFrame === 3 && "노아는 여호와께서 자기에게 명하신 대로 다 준행하였습니다."}
                </p>
                <div className="flex gap-1 justify-center mt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${cutsceneFrame === 0 ? 'bg-yellow-400' : 'bg-gray-600'}`}></span>
                  <span className={`w-1.5 h-1.5 rounded-full ${cutsceneFrame === 1 ? 'bg-yellow-400' : 'bg-gray-600'}`}></span>
                  <span className={`w-1.5 h-1.5 rounded-full ${cutsceneFrame === 2 ? 'bg-yellow-400' : 'bg-gray-600'}`}></span>
                  <span className={`w-1.5 h-1.5 rounded-full ${cutsceneFrame === 3 ? 'bg-yellow-400' : 'bg-gray-600'}`}></span>
                </div>
              </div>

              <div className="relative z-10 mt-3">
                <button
                  onClick={() => setPhase('clear')}
                  className="w-full py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-102 active:scale-95 text-yellow-950 font-black text-xs rounded-xl shadow-lg border-2 border-white transition-all"
                >
                  🌈 말씀 약속 카드 받기 ➡️
                </button>
              </div>

            </div>
          )}

          {/* 4. FINAL SCRIPTURE CARD OVERLAY (CLEAR PHASE) */}
          {phase === 'clear' && (
            <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
              <div className="bg-[#fffbf0] border-4 border-[#855422] p-5 rounded-2xl shadow-2xl text-center max-w-[320px] w-full pop-in relative overflow-hidden flex flex-col items-center">
                
                {/* Rainbow background pattern */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-600"></div>

                <div className="mt-3 flex flex-col items-center gap-1">
                  <span className="text-4xl animate-bounce">🌈🚢</span>
                  <span className="text-[10px] text-emerald-700 font-bold tracking-widest uppercase">STAGE 4 CLEAR</span>
                  <h3 className="font-black text-sm text-[#4e2d0c]">방주의 짝과 하나님의 언약</h3>
                </div>

                <div className="my-4 bg-[#f6efe2] border border-[#dfd4be] p-3 rounded-xl max-h-[160px] overflow-y-auto">
                  <p className="font-layton-myeongjo text-[11px] font-medium text-[#52371b] leading-relaxed text-justify break-keep">
                    "정결한 짐승과 부정한 짐승과 새와 땅에 기는 모든 것은 하나님이 노아에게 명하신 대로 암수 둘씩 노아에게 나아와 방주로 들어갔으니"
                  </p>
                  <p className="text-right text-[9px] text-emerald-800 font-bold mt-1.5">
                    — 창세기 7:8-9
                  </p>
                </div>

                <div className="w-full bg-[#e8f6ed] border border-[#a7d7b9] p-2 rounded-lg text-left text-[8.5px] text-[#1e5831] leading-relaxed mb-4 break-keep">
                  💡 <strong>하나님의 은혜:</strong> 마을 사람 C는 하나님이 아무 말씀도 하지 않으셨다고 비난했지만, 노아는 하나님의 신실한 약속과 말씀을 듣고 방주를 지었습니다. 그 결과로 모든 생명이 안전하게 보존되었습니다.
                </div>

                <button
                  onClick={() => onSolved('puzzle-004', 0)}
                  className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                >
                  다음 스테이지로 ➡️
                </button>
              </div>
            </div>
          )}

          {/* 5. NOTES OVERLAY (단서 노트 📓) */}
          {showNotes && (
            <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-end">
              <div className="bg-[#f5ebd7] border-l-4 border-[#855422] w-[260px] h-full shadow-2xl p-4 flex flex-col justify-between slide-in font-layton-myeongjo">
                
                <div>
                  <div className="flex items-center justify-between border-b border-[#855422]/30 pb-2 mb-3">
                    <span className="text-xs font-black text-[#5a3615]">📓 단서 노트 (수집품)</span>
                    <button onClick={() => setShowNotes(false)} className="text-[#855422] hover:text-[#5a3615] font-black text-sm">
                      ✖
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto pr-1">
                    {CLUES.map(clue => {
                      const isSearched = searchedClues[clue.id];
                      return (
                        <div
                          key={clue.id}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${isSearched ? 'bg-white border-[#cca379]' : 'bg-[#e9dec6] border-[#dfd2b5] opacity-50'}`}
                        >
                          <div className="shrink-0">
                            {isSearched ? (
                              <div style={getSpriteStyle(clue.id, 40)} className="rounded-md border border-[#cca379]" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-300/40 rounded-md border border-dashed border-gray-400 flex items-center justify-center text-lg">
                                ❓
                              </div>
                            )}
                          </div>
                          <div className="text-left flex-1">
                            <h4 className="text-[9.5px] font-black text-[#5a3615]">
                              {clue.name} {isSearched && '✔'}
                            </h4>
                            <p className="text-[8.5px] text-gray-500 leading-relaxed mt-0.5 break-keep">
                              {isSearched ? clue.desc : '아직 조사하지 않은 단서입니다.'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setShowNotes(false)}
                  className="w-full py-2 bg-[#855422] text-white font-black text-xs rounded-xl shadow transition-all active:scale-95 mt-4"
                >
                  수첩 닫기 📓
                </button>

              </div>
            </div>
          )}

        </div>
      );
    }


    // ─────────────────────────────────────────────


