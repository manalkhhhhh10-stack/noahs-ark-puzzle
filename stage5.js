    function PuzzleBabelTower({ puzzleId, coins, onSpendCoins, onBack, onSolved }) {
      const { useState, useEffect, useRef } = React;

      // subPhase: 'intro' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5' | 'complete'
      const [subPhase, setSubPhase] = useState('intro');
      
      // 오프닝 대사 인덱스
      const [introDialogIdx, setIntroDialogIdx] = useState(0);
      const [isBabelConfused, setIsBabelConfused] = useState(false);

      // 스테이지별 틀린 횟수
      const [wrongCounts, setWrongCounts] = useState({ stage1: 0, stage2: 0, stage3: 0, stage4: 0, stage5: 0 });
      const [currentStars, setCurrentStars] = useState({ stage1: 3, stage2: 3, stage3: 3, stage4: 3, stage5: 3 });

      // 힌트 모달 상태
      const [showHint, setShowHint] = useState(false);

      // 소리 설정
      const [soundMuted, setSoundMuted] = useState(false);

      // --- Stage 1 State ---
      const [s1QuestionIdx, setS1QuestionIdx] = useState(0);
      const [s1Selected, setS1Selected] = useState(null);
      const [s1ShowFeedback, setS1ShowFeedback] = useState(null); // 'correct' | 'wrong' | null
      const [s1Completed, setS1Completed] = useState(false);
      const [s1ShuffledOptions, setS1ShuffledOptions] = useState([]);

      // --- Stage 2 State ---
      const [s2QuestionIdx, setS2QuestionIdx] = useState(0);
      const [s2SelectedTool, setS2SelectedTool] = useState(null); 
      const [s2ShowFeedback, setS2ShowFeedback] = useState(null); 
      const [s2Placements, setS2Placements] = useState({ 1: null, 2: null, 3: null }); 
      const [s2Completed, setS2Completed] = useState(false);
      const [s2ShuffledItems, setS2ShuffledItems] = useState([]);

      // --- Stage 3 State ---
      const [s3QuestionIdx, setS3QuestionIdx] = useState(0);
      const [s3SelectedWorker, setS3SelectedWorker] = useState(null); 
      const [s3ShowFeedback, setS3ShowFeedback] = useState(null); 
      const [s3Completed, setS3Completed] = useState(false);
      const [s3ShuffledWorkers, setS3ShuffledWorkers] = useState([]);

      // --- Stage 4 State (신규: 흩어진 언어 짝짓기) ---
      const [s4QuestionIdx, setS4QuestionIdx] = useState(0);
      const [s4SelectedCard, setS4SelectedCard] = useState(null); // 처음 선택한 카드 오브젝트
      const [s4MatchedIds, setS4MatchedIds] = useState([]); // 맞춘 카드 ID 리스트
      const [s4ShowFeedback, setS4ShowFeedback] = useState(null); // 'correct' | 'wrong' | null
      const [s4Completed, setS4Completed] = useState(false);
      const [s4ShuffledCards, setS4ShuffledCards] = useState([]);

      // --- Stage 5 State (기존 Stage 4) ---
      const [s5Cards, setS5Cards] = useState([]);
      const [s5Feedback, setS5Feedback] = useState(null); 
      const [s5SequenceCleared, setS5SequenceCleared] = useState(false);
      const [s5QuizAnswered, setS5QuizAnswered] = useState(false);
      const [s5QuizFeedback, setS5QuizFeedback] = useState(null);
      const [s5ShuffledOptions, setS5ShuffledOptions] = useState([]);

      // Stage 1 선택지 목록 셔플
      useEffect(() => {
        if (subPhase === 'stage1' && s1Questions[s1QuestionIdx]) {
          const shuffled = [...s1Questions[s1QuestionIdx].options].sort(() => Math.random() - 0.5);
          setS1ShuffledOptions(shuffled);
        }
      }, [s1QuestionIdx, subPhase]);

      // Stage 2 배치 아이템 셔플
      useEffect(() => {
        if (subPhase === 'stage2' && s2Questions[s2QuestionIdx]) {
          const shuffled = [...s2Questions[s2QuestionIdx].elements.items].sort(() => Math.random() - 0.5);
          setS2ShuffledItems(shuffled);
        }
      }, [s2QuestionIdx, subPhase]);

      // Stage 3 일꾼 목록 셔플
      useEffect(() => {
        if (subPhase === 'stage3' && s3Questions[s3QuestionIdx]) {
          const shuffled = [...s3Questions[s3QuestionIdx].workers].sort(() => Math.random() - 0.5);
          setS3ShuffledWorkers(shuffled);
        }
      }, [s3QuestionIdx, subPhase]);

      // Stage 4 짝맞추기 카드 셔플
      useEffect(() => {
        if (subPhase === 'stage4' && s4Questions[s4QuestionIdx]) {
          const shuffled = [...s4Questions[s4QuestionIdx].cards].sort(() => Math.random() - 0.5);
          setS4ShuffledCards(shuffled);
        }
      }, [s4QuestionIdx, subPhase]);

      // Stage 5 최종 퀴즈 객관식 보기 셔플
      useEffect(() => {
        if (subPhase === 'stage5' && s5SequenceCleared) {
          const rawOptions = [
            '비와 홍수를 피하기 위해서',
            '자기들의 이름을 세상에 널리 높이기 위해서',
            '가축과 동물을 더 넓게 기르기 위해서',
            '하나님께 더 높이 예배를 드리기 위해서'
          ];
          const shuffled = [...rawOptions].sort(() => Math.random() - 0.5);
          setS5ShuffledOptions(shuffled);
        }
      }, [s5SequenceCleared, subPhase]);

      // --- Stage 1 문제 데이터 ---
      const s1Questions = [
        {
          id: 1,
          sequence: ['🧱', '🔺', '🧱', '?'],
          options: [
            { id: 'opt1', val: '🧱', label: '빨간 네모' },
            { id: 'opt2', val: '🔺', label: '노란 세모', correct: true },
            { id: 'opt3', val: '🔵', label: '파란 동그라미' }
          ],
          hint: "벽돌(네모)과 세모가 번갈아 가며 나옵니다. 어떤 벽돌이 들어갈까요?"
        },
        {
          id: 2,
          sequence: ['▫️', '🧱', '🧱', '▫️', '?'],
          options: [
            { id: 'opt1', val: '▫️', label: '작은 벽돌' },
            { id: 'opt2', val: '🧱', valLabel: '큰 벽돌', label: '큰 벽돌', correct: true },
            { id: 'opt3', val: '🔺', label: '노란 세모' }
          ],
          hint: "작은 크기 → 큰 크기 → 큰 크기 → 작은 크기 순서입니다. 다음은 어떤 크기일까요?"
        },
        {
          id: 3,
          sequence: ['🧱', '🔷', '🟡', '🔺', '?'],
          options: [
            { id: 'opt1', val: '🧱', label: '빨간 네모' },
            { id: 'opt2', val: '🔷', label: '파란 네모', correct: true },
            { id: 'opt3', val: '🔺', label: '노란 세모' }
          ],
          hint: "색상은 [빨강->파랑->노랑->빨강], 모양은 [네모->세모->네모->세모]로 번갈아 바뀝니다."
        }
      ];

      // --- Stage 2 문제 데이터 ---
      const s2Questions = [
        {
          id: 1,
          instruction: '🔴 + 🧱 + ➡️ + 🔨', 
          hint: "빨간 벽돌(🔴🧱)을 선택한 후, 망치(🔨)의 오른쪽 자리를 터치해 보세요.",
          tool: 'red_brick',
          targetPlace: 'hammer_right',
          elements: {
            items: [
              { id: 'red_brick', val: '🧱', color: 'border-red-500 text-red-500 bg-red-100', label: '빨간 벽돌' },
              { id: 'pot', val: '🏺', color: 'border-yellow-600 text-yellow-600 bg-yellow-50', label: '항아리' },
              { id: 'hammer', val: '🔨', color: 'border-stone-500 text-stone-500 bg-stone-100', label: '망치' }
            ],
            places: [
              { id: 'hammer_left', label: '망치 왼쪽' },
              { id: 'hammer_right', label: '망치 오른쪽', correct: true }
            ]
          }
        },
        {
          id: 2,
          instruction: '🏺 + ⬅️ + 📦', 
          hint: "항아리(🏺)를 선택한 후, 나무상자(📦)의 왼쪽 자리를 터치해 보세요.",
          tool: 'pot',
          targetPlace: 'box_left',
          elements: {
            items: [
              { id: 'yellow_brick', val: '🧱', color: 'border-yellow-500 text-yellow-500 bg-yellow-100', label: '노란 벽돌' },
              { id: 'pot', val: '🏺', color: 'border-amber-600 text-amber-600 bg-amber-50', label: '항아리' },
              { id: 'box', val: '📦', color: 'border-orange-500 text-orange-500 bg-orange-100', label: '나무상자' }
            ],
            places: [
              { id: 'box_left', label: '나무상자 왼쪽', correct: true },
              { id: 'box_right', label: '나무상자 오른쪽' }
            ]
          }
        },
        {
          id: 3,
          instruction: '💛 + 🧱 + 📥 + 🛒', 
          hint: "노란 벽돌(💛🧱)을 선택한 후, 수레(🛒)의 안쪽 자리를 터치해 보세요.",
          tool: 'yellow_brick',
          targetPlace: 'cart_inside',
          elements: {
            items: [
              { id: 'yellow_brick', val: '🧱', color: 'border-yellow-500 text-yellow-500 bg-yellow-100', label: '노란 벽돌' },
              { id: 'pot', val: '🏺', color: 'border-yellow-600 text-yellow-600 bg-yellow-50', label: '항아리' },
              { id: 'cart', val: '🛒', color: 'border-emerald-600 text-emerald-600 bg-emerald-50', label: '수레' }
            ],
            places: [
              { id: 'cart_left', label: '수레 왼쪽' },
              { id: 'cart_inside', label: '수레 안쪽', correct: true }
            ]
          }
        }
      ];

      // --- Stage 3 문제 데이터 ---
      const s3Questions = [
        {
          id: 1,
          instruction: '“벽돌을 수레에 실어라”',
          workers: [
            { id: 1, text: '🧱 ➡️ 🛒', label: '1번 일꾼 (벽돌을 수레에 싣는 중)' },
            { id: 2, text: '🧱 🚶 🛒', label: '2번 일꾼 (벽돌을 들고 수레로 가는 중)' },
            { id: 3, text: '🏺 ➡️ 🛒', label: '3번 일꾼 (항아리를 수레에 싣는 중)', correct: true }
          ],
          hint: "수레에 실어야 하는 물건은 '벽돌'입니다. 다른 물건을 싣고 있는 사람을 찾아보세요.",
          explanation: "3번 일꾼은 벽돌이 아닌 항아리를 싣고 있어요. 언어가 통하지 않아 지시를 잘못 알아들었습니다."
        },
        {
          id: 2,
          instruction: '“망치로 나무판자를 두드려라”',
          workers: [
            { id: 1, text: '🔨 ➡️ 🪵', label: '1번 일꾼 (망치로 나무판자를 두드리는 중)' },
            { id: 2, text: '🔨 ➡️ 🧱', label: '2번 일꾼 (망치로 벽돌을 두드리는 중)', correct: true },
            { id: 3, text: '🔨 ✊ 🪵', label: '3번 일꾼 (나무판자 앞에 망치를 든 채 서 있음)' }
          ],
          hint: "나무판자를 두드려야 하는데 벽돌을 두드리고 있는 사람이 있습니다.",
          explanation: "2번 일꾼은 나무판자가 아닌 벽돌을 망치로 내려치고 있어 엉뚱한 공사를 하고 있습니다."
        },
        {
          id: 3,
          instruction: '“빨간 벽돌을 탑 아래에 놓아라”',
          workers: [
            { id: 1, text: '🧱(빨강) ➡️ 🏢(아래)', label: '1번 일꾼 (빨간 벽돌을 탑 아래에 놓는 중)' },
            { id: 2, text: '🧱(빨강) ➡️ 🏢(옆)', label: '2번 일꾼 (빨간 벽돌을 탑 옆에 놓는 중)' },
            { id: 3, text: '🧱(노랑) ➡️ 🏢(위)', label: '3번 일꾼 (노란 벽돌을 탑 위에 놓는 중)', correct: true }
          ],
          hint: "벽돌의 '색상'과 탑의 '위치' 지시 사항을 두 가지 다 어긴 일꾼이 누구인지 찾아보세요.",
          explanation: "3번 일꾼은 지시와 다른 노란 벽돌을 가져와 심지어 탑의 맨 위쪽에 올리고 있습니다."
        }
      ];

      // --- Stage 4 (신규: 흩어진 언어 짝짓기) 문제 데이터 ---
      const s4Questions = [
        {
          id: 1,
          cards: [
            { id: 1, text: '안녕 👋', type: 'greeting' },
            { id: 2, text: 'Hello 👋', type: 'greeting' },
            { id: 3, text: '물 💧', type: 'water' },
            { id: 4, text: 'Water 💧', type: 'water' }
          ],
          hint: "말풍선의 이모지가 서로 같은 카드를 터치해 짝을 맞춰보세요."
        },
        {
          id: 2,
          cards: [
            { id: 1, text: '빵 🍞', type: 'bread' },
            { id: 2, text: 'Bread 🍞', type: 'bread' },
            { id: 3, text: '집 🏠', type: 'house' },
            { id: 4, text: 'House 🏠', type: 'house' }
          ],
          hint: "빵과 빵, 집과 집을 각각 짝지어 연결해 보세요."
        },
        {
          id: 3,
          cards: [
            { id: 1, text: '태양 ☀️', type: 'sun' },
            { id: 2, text: 'Sun ☀️', type: 'sun' },
            { id: 3, text: '나무 🌳', type: 'tree' },
            { id: 4, text: 'Tree 🌳', type: 'tree' }
          ],
          hint: "태양과 태양, 나무와 나무를 각각 짝지어 연결해 보세요."
        }
      ];

      // --- Stage 5 문제 데이터 ---
      const s5InitialCards = [
        { id: 1, val: 1, text: '사람들이 한곳에 모여 살았다.' },
        { id: 2, val: 2, text: '사람들이 벽돌로 높은 탑을 쌓기 시작했다.' },
        { id: 3, val: 3, text: '사람들이 자기들의 이름을 높이려고 했다.' },
        { id: 4, val: 4, text: '하나님께서 사람들의 언어를 혼잡하게 하셨다.' },
        { id: 5, val: 5, text: '사람들은 서로의 말을 알아듣지 못했다.' },
        { id: 6, val: 6, text: '사람들은 온 땅으로 흩어졌다.' }
      ];

      // Stage 5 셔플 가동
      useEffect(() => {
        if (subPhase === 'stage5') {
          const shuffled = [...s5InitialCards].sort(() => Math.random() - 0.5);
          setS5Cards(shuffled);
          setS5Feedback(null);
          setS5SequenceCleared(false);
          setS5QuizAnswered(false);
          setS5QuizFeedback(null);
        }
      }, [subPhase]);

      // --- 공통 헬퍼: 별점 계산기 ---
      const calculateStars = (wrongCount) => {
        if (wrongCount === 0) return 3;
        if (wrongCount <= 2) return 2;
        return 1;
      };

      // --- Stage 1 핸들러 ---
      const handleS1OptionClick = (opt) => {
        if (s1ShowFeedback) return;
        
        if (opt.correct) {
          if (!soundMuted) synth.playConsume();
          setS1ShowFeedback('correct');
          setTimeout(() => {
            if (s1QuestionIdx < 2) {
              setS1QuestionIdx(prev => prev + 1);
              setS1ShowFeedback(null);
            } else {
              setS1Completed(true);
              setS1ShowFeedback(null);
            }
          }, 1500);
        } else {
          if (!soundMuted) synth.playBarrier();
          setS1ShowFeedback('wrong');
          setWrongCounts(prev => {
            const next = { ...prev, stage1: prev.stage1 + 1 };
            setCurrentStars(s => ({ ...s, stage1: calculateStars(next.stage1) }));
            return next;
          });
          setTimeout(() => setS1ShowFeedback(null), 1500);
        }
      };

      // --- Stage 2 핸들러 ---
      const handleS2ToolSelect = (toolId) => {
        if (s2ShowFeedback) return;
        if (!soundMuted) synth.playClick();
        setS2SelectedTool(toolId);
      };

      const handleS2PlaceSelect = (placeId) => {
        if (!s2SelectedTool || s2ShowFeedback) return;

        const currentQ = s2Questions[s2QuestionIdx];
        if (s2SelectedTool === currentQ.tool && placeId === currentQ.targetPlace) {
          if (!soundMuted) synth.playConsume();
          setS2ShowFeedback('correct');
          setS2Placements(prev => ({ ...prev, [s2QuestionIdx + 1]: s2SelectedTool }));
          setTimeout(() => {
            setS2SelectedTool(null);
            setS2ShowFeedback(null);
            if (s2QuestionIdx < 2) {
              setS2QuestionIdx(prev => prev + 1);
            } else {
              setS2Completed(true);
            }
          }, 1500);
        } else {
          if (!soundMuted) synth.playBarrier();
          setS2ShowFeedback('wrong');
          setWrongCounts(prev => {
            const next = { ...prev, stage2: prev.stage2 + 1 };
            setCurrentStars(s => ({ ...s, stage2: calculateStars(next.stage2) }));
            return next;
          });
          setTimeout(() => {
            setS2SelectedTool(null);
            setS2ShowFeedback(null);
          }, 1500);
        }
      };

      // --- Stage 3 핸들러 ---
      const handleS3WorkerSelect = (worker) => {
        if (s3ShowFeedback) return;
        setS3SelectedWorker(worker);

        if (worker.correct) {
          if (!soundMuted) synth.playSuccess();
          setS3ShowFeedback('correct');
          setTimeout(() => {
            setS3SelectedWorker(null);
            setS3ShowFeedback(null);
            if (s3QuestionIdx < 2) {
              setS3QuestionIdx(prev => prev + 1);
            } else {
              setS3Completed(true);
            }
          }, 2000);
        } else {
          if (!soundMuted) synth.playBarrier();
          setS3ShowFeedback('wrong');
          setWrongCounts(prev => {
            const next = { ...prev, stage3: prev.stage3 + 1 };
            setCurrentStars(s => ({ ...s, stage3: calculateStars(next.stage3) }));
            return next;
          });
          setTimeout(() => {
            setS3SelectedWorker(null);
            setS3ShowFeedback(null);
          }, 1800);
        }
      };

      // --- Stage 4 (신규: 흩어진 언어 짝짓기) 핸들러 ---
      const handleS4CardClick = (card) => {
        if (s4ShowFeedback || s4MatchedIds.includes(card.id)) return;
        
        if (!s4SelectedCard) {
          if (!soundMuted) synth.playClick();
          setS4SelectedCard(card);
        } else {
          if (s4SelectedCard.id === card.id) {
            setS4SelectedCard(null);
            return;
          }

          if (s4SelectedCard.type === card.type) {
            if (!soundMuted) synth.playConsume();
            setS4ShowFeedback('correct');
            const newMatched = [...s4MatchedIds, s4SelectedCard.id, card.id];
            setS4MatchedIds(newMatched);
            setS4SelectedCard(null);

            setTimeout(() => {
              setS4ShowFeedback(null);
              if (newMatched.length === 4) {
                if (s4QuestionIdx < 2) {
                  setS4QuestionIdx(prev => prev + 1);
                  setS4MatchedIds([]);
                } else {
                  setS4Completed(true);
                }
              }
            }, 1200);
          } else {
            if (!soundMuted) synth.playBarrier();
            setS4ShowFeedback('wrong');
            setWrongCounts(prev => {
              const next = { ...prev, stage4: prev.stage4 + 1 };
              setCurrentStars(s => ({ ...s, stage4: calculateStars(next.stage4) }));
              return next;
            });
            setTimeout(() => {
              setS4SelectedCard(null);
              setS4ShowFeedback(null);
            }, 1200);
          }
        }
      };

      // --- Stage 5 핸들러 ---
      const handleMoveCard = (index, direction) => {
        if (s5SequenceCleared) return;
        if (!soundMuted) synth.playClick();
        
        const newCards = [...s5Cards];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex >= 0 && targetIndex < s5Cards.length) {
          const temp = newCards[index];
          newCards[index] = newCards[targetIndex];
          newCards[targetIndex] = temp;
          setS5Cards(newCards);
        }
      };

      const handleCheckSequence = () => {
        const isSorted = s5Cards.every((card, idx) => card.val === idx + 1);
        if (isSorted) {
          if (!soundMuted) synth.playSuccess();
          setS5Feedback('correct');
          setTimeout(() => {
            setS5SequenceCleared(true);
            setS5Feedback(null);
          }, 1200);
        } else {
          if (!soundMuted) synth.playBarrier();
          setS5Feedback('wrong');
          setWrongCounts(prev => {
            const next = { ...prev, stage5: prev.stage5 + 1 };
            setCurrentStars(s => ({ ...s, stage5: calculateStars(next.stage5) }));
            return next;
          });
          setTimeout(() => setS5Feedback(null), 2000);
        }
      };

      const handleQuizAnswer = (optText) => {
        if (optText.includes('자기들의 이름을')) { 
          if (!soundMuted) synth.playVic();
          setS5QuizFeedback('correct');
          setTimeout(() => {
            setS5QuizAnswered(true);
            setS5QuizFeedback(null);
          }, 2500);
        } else {
          if (!soundMuted) synth.playBarrier();
          setS5QuizFeedback('wrong');
          setWrongCounts(prev => {
            const next = { ...prev, stage5: prev.stage5 + 1 };
            setCurrentStars(s => ({ ...s, stage5: calculateStars(next.stage5) }));
            return next;
          });
          setTimeout(() => setS5QuizFeedback(null), 1800);
        }
      };

      // --- 최종 스테이지 해결 처리 ---
      const handleAllCleared = () => {
        const totalStarCount = currentStars.stage1 + currentStars.stage2 + currentStars.stage3 + currentStars.stage4 + currentStars.stage5;
        
        try {
          localStorage.setItem('bible_quiz_stage5_stars', totalStarCount.toString());
          localStorage.setItem('bible_quiz_stage5_badge', 'true');
          
          const currentSavedScore = parseInt(localStorage.getItem('bible_quiz_score') || '0', 10);
          const earned = 50 + totalStarCount * 5; 
          localStorage.setItem('bible_quiz_score', (currentSavedScore + earned).toString());
        } catch (e) {
          console.warn("Storage save error:", e);
        }

        onSolved(puzzleId || 'puzzle-005', totalStarCount * 5);
      };

      const handleRestartAll = () => {
        setSubPhase('intro');
        setIntroDialogIdx(0);
        setIsBabelConfused(false);
        setWrongCounts({ stage1: 0, stage2: 0, stage3: 0, stage4: 0, stage5: 0 });
        setCurrentStars({ stage1: 3, stage2: 3, stage3: 3, stage4: 3, stage5: 3 });
        
        setS1QuestionIdx(0);
        setS1Selected(null);
        setS1Completed(false);

        setS2QuestionIdx(0);
        setS2SelectedTool(null);
        setS2Placements({ 1: null, 2: null, 3: null });
        setS2Completed(false);

        setS3QuestionIdx(0);
        setS3SelectedWorker(null);
        setS3Completed(false);

        setS4QuestionIdx(0);
        setS4SelectedCard(null);
        setS4MatchedIds([]);
        setS4Completed(false);

        setS5SequenceCleared(false);
        setS5QuizAnswered(false);
      };

      // 힌트 텍스트 가져오기
      const getActiveHintText = () => {
        if (subPhase === 'stage1') {
          return s1Questions[s1QuestionIdx].hint;
        }
        if (subPhase === 'stage2') {
          return s2Questions[s2QuestionIdx].hint;
        }
        if (subPhase === 'stage3') {
          return s3Questions[s3QuestionIdx].hint;
        }
        if (subPhase === 'stage4') {
          return s4Questions[s4QuestionIdx].hint;
        }
        if (subPhase === 'stage5') {
          if (!s5SequenceCleared) {
            return "사람들이 교만하게 벽돌을 쌓아 하늘에 닿으려 하자, 하나님께서 언어를 흩으신 순서를 생각해보세요.";
          }
          return "창세기 11장 4절 말씀에서 '우리 이름을 내고'라고 말한 이유를 다시 고민해 보세요.";
        }
        return "바벨탑의 단서를 발견해 보세요!";
      };

      return (
        <div 
          className="flex-1 flex flex-col justify-between relative bg-[#1e130c] text-[#f4ebd0] overflow-hidden select-none font-layton-myeongjo bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('5stagebg.png')" }}
        >
          
          {/* Top Info HUD Header */}
          {subPhase !== 'intro' && subPhase !== 'complete' && (
            <div className="bg-[#2d1b0f] border-b border-[#ffd700]/30 px-3 py-2 flex justify-between items-center text-xs z-20">
              <span className="font-bold text-[#e6a817]">🏢 뒤죽박죽 바벨탑</span>
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
                <span className="text-[#ffd700] font-bold">⭐ {
                  subPhase === 'stage1' ? currentStars.stage1 :
                  subPhase === 'stage2' ? currentStars.stage2 :
                  subPhase === 'stage3' ? currentStars.stage3 :
                  subPhase === 'stage4' ? currentStars.stage4 : currentStars.stage5
                }개</span>
              </div>
            </div>
          )}

          {/* ================= 1. INTRO / OPENING PHASE ================= */}
          {subPhase === 'intro' && (
            <div className={`flex-1 flex flex-col justify-between p-6 z-10 transition-all duration-500 ${isBabelConfused ? 'animate-[shake_0.6s_ease-in-out_infinite]' : ''}`}>
              <div className="absolute inset-4 border border-[#ffd700]/15 rounded-2xl pointer-events-none" />
              
              {/* Title Header */}
              <div className="text-center mt-3">
                <span className="text-4xl block animate-bounce">🏢🏗️</span>
                <h1 className="text-xl font-black text-[#e6a817] mt-1.5 drop-shadow-md">뒤죽박죽 바벨탑</h1>
                <p className="text-[10px] text-[#eddcb9] mt-0.5 font-sans font-semibold">티키와 타카의 바벨탑 모험</p>
              </div>

              {/* Central Illustration Area */}
              <div className="flex-1 flex flex-col items-center justify-center relative my-4">
                <div className="absolute w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
                
                <video 
                  src="babel.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full max-w-[280px] h-[190px] object-cover rounded-2xl border-4 border-[#8b5a2b] shadow-2xl relative z-10"
                />

                {isBabelConfused && (
                  <div className="absolute inset-x-0 top-1/4 flex justify-between px-6 z-20">
                    <div className="bg-white border-2 border-red-500 text-stone-900 text-[10px] px-2 py-1 rounded-xl rounded-bl-none shadow-md font-sans font-extrabold animate-bounce">
                      ☠☣☢!?
                    </div>
                    <div className="bg-white border-2 border-red-500 text-stone-900 text-[10px] px-2 py-1 rounded-xl rounded-br-none shadow-md font-sans font-extrabold animate-bounce delay-200">
                      ◇▲○▲!!
                    </div>
                  </div>
                )}
              </div>

              {/* Dialog Panel */}
              <div className="bg-[#2c1a0c]/90 border-2 border-[#8b5a2b] p-3 rounded-2xl text-center relative z-20 shadow-xl min-h-[95px] flex flex-col justify-between">
                <div className="text-[11px] text-[#f4ebd0] leading-relaxed break-keep font-medium">
                  {introDialogIdx === 0 ? (
                    <p className="font-semibold text-amber-200">
                      “사람들이 성벽과 높은 탑을 쌓아 자기들의 이름을 하늘 높이 내려고 벽돌 공사를 활발히 하고 있어요...”
                    </p>
                  ) : introDialogIdx === 1 ? (
                    <p>
                      <strong className="text-amber-400 block text-[10px]">👦 티키</strong>
                      “타카야! 사람들이 서로 다른 말을 하고 있어!”
                    </p>
                  ) : (
                    <p>
                      <strong className="text-amber-400 block text-[10px]">👧 타카</strong>
                      “무슨 일이 일어난 걸까? 우리 함께 단서를 찾아보자!”
                    </p>
                  )}
                </div>

                <div className="mt-2.5">
                  {introDialogIdx === 0 ? (
                    <button
                      onClick={() => {
                        setIsBabelConfused(true);
                        if (!soundMuted) synth.playThud();
                        setIntroDialogIdx(1);
                      }}
                      className="w-full py-2 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow"
                    >
                      탐험 시작! ➡️
                    </button>
                  ) : introDialogIdx === 1 ? (
                    <button
                      onClick={() => {
                        if (!soundMuted) synth.playClick();
                        setIntroDialogIdx(2);
                      }}
                      className="px-4 py-1.5 bg-[#4a2e13] hover:bg-[#5e3c1b] border border-[#ffd700]/30 rounded-xl text-[10px] font-bold"
                    >
                      다음 대화 ➡️
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!soundMuted) synth.playSuccess();
                        setSubPhase('stage1');
                      }}
                      className="w-full py-2 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow"
                    >
                      첫 번째 단서 찾기 🔎
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. STAGE 1: BRICK RULE ================= */}
          {subPhase === 'stage1' && (
            <div className="flex-1 flex flex-col justify-between p-4 z-10">
              <div className="text-center mb-2">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Stage 1. 벽돌의 규칙을 찾아라!</span>
                <p className="text-[10.5px] text-[#eddcb9] mt-0.5 break-keep">
                  쌓여 있는 벽돌의 순서를 살펴보고 빈칸(?)에 들어갈 벽돌을 골라보세요.
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex justify-center gap-1.5 my-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`text-xs ${i <= s1QuestionIdx ? 'opacity-100 scale-110' : 'opacity-35'}`}>
                    {i < s1QuestionIdx || s1Completed ? '🟢' : '🧱'}
                  </span>
                ))}
              </div>

              {/* Game Board */}
              <div className="flex-1 bg-[#2c1b0f]/80 rounded-2xl border-2 border-[#8b5a2b] p-4 flex flex-col justify-around items-center my-2 shadow-inner min-h-[180px]">
                <div className="flex items-center gap-3">
                  {s1Questions[s1QuestionIdx].sequence.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 ${
                        item === '?' 
                          ? 'border-dashed border-amber-500 bg-amber-950/40 text-amber-400 animate-pulse font-extrabold'
                          : 'border-[#ffd700]/30 bg-[#4a2f13]/30'
                      } ${s1ShowFeedback === 'correct' && item === '?' ? 'bg-emerald-950 border-emerald-500 text-emerald-400 scale-110 rotate-[360deg] transition-all duration-700' : ''}`}
                    >
                      {s1ShowFeedback === 'correct' && item === '?' ? s1Questions[s1QuestionIdx].options.find(o => o.correct).val : item}
                    </div>
                  ))}
                </div>

                <div className="min-h-[30px] flex items-center text-center px-4">
                  {s1ShowFeedback === 'correct' && (
                    <p className="text-emerald-400 font-black text-xs animate-bounce">
                      🎉 딩동! 규칙을 찾았어요!
                    </p>
                  )}
                  {s1ShowFeedback === 'wrong' && (
                    <p className="text-red-400 font-black text-xs animate-shake">
                      ⚠️ 앗! 벽돌의 색깔과 모양을 다시 살펴보세요.
                    </p>
                  )}
                  {!s1ShowFeedback && (
                    <p className="text-[10px] text-[#f4ebd0]/80">
                      정답이라고 생각되는 아래 벽돌을 터치하세요.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                  {s1ShuffledOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleS1OptionClick(opt)}
                      disabled={s1ShowFeedback !== null}
                      className="py-3 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-[#2c1a0c] font-bold rounded-xl border border-[#ffe8b5] hover:from-[#fcf4dc] active:scale-95 transition-all text-center flex flex-col items-center gap-1 shadow-md"
                    >
                      <span className="text-2xl">{opt.val}</span>
                      <span className="text-[8px] tracking-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stage Navigation / Clear Button */}
              <div className="mt-3">
                {s1Completed ? (
                  <button
                    onClick={() => setSubPhase('stage2')}
                    className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow"
                  >
                    두 번째 단서 찾기 ➡️
                  </button>
                ) : (
                  <button
                    onClick={onBack}
                    className="w-full py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-bold rounded-xl border border-stone-500"
                  >
                    지도 닫기
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================= 3. STAGE 2: DECODE SIGN ================= */}
          {subPhase === 'stage2' && (
            <div className="flex-1 flex flex-col justify-between p-4 z-10">
              <div className="text-center mb-1">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Stage 2. 뒤죽박죽 말을 해독하라!</span>
                <p className="text-[10px] text-[#eddcb9] mt-0.5 break-keep">
                  건축가의 그림 지시를 해독해서 물건을 알맞은 장소에 놓아주세요.
                </p>
              </div>

              <div className="bg-[#2c1b0f]/90 border border-[#8b5a2b] p-2.5 rounded-xl text-center my-1.5">
                <span className="text-[8px] bg-amber-500 text-stone-900 font-black px-1.5 py-0.2 rounded-full uppercase">지시문 해독 {s2QuestionIdx + 1}/3</span>
                <div className="flex items-center justify-center gap-2 mt-2 bg-black/40 py-2.5 px-4 rounded-lg text-lg tracking-widest font-mono">
                  {s2Questions[s2QuestionIdx].instruction.split(' ').map((char, index) => (
                    <span key={index} className="text-yellow-300 font-black filter drop-shadow">{char}</span>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-[#23150d] rounded-2xl border-2 border-[#8b5a2b] p-3 flex flex-col justify-between my-1.5 relative min-h-[200px]">
                <div className="text-center">
                  <span className="text-[8px] text-stone-400 block mb-1">1. 옮길 물건 선택</span>
                  <div className="flex justify-around gap-2">
                    {s2ShuffledItems.map(item => {
                      const isSelected = s2SelectedTool === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleS2ToolSelect(item.id)}
                          className={`w-14 h-14 border-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all ${item.color} ${
                            isSelected ? 'ring-4 ring-amber-400 scale-105 border-amber-400 animate-pulse' : 'hover:scale-[1.02]'
                          }`}
                        >
                          <span className="text-2xl">{item.val}</span>
                          <span className="text-[7.5px] font-bold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="min-h-[22px] flex items-center justify-center text-center my-1">
                  {s2ShowFeedback === 'correct' && <span className="text-emerald-400 font-black text-xs">✨ 그림 언어를 해독했어요!</span>}
                  {s2ShowFeedback === 'wrong' && <span className="text-red-400 font-black text-xs animate-shake">❌ 그림의 순서와 화살표 방향을 다시 확인해 보세요.</span>}
                  {!s2ShowFeedback && s2SelectedTool && <span className="text-amber-300 text-[9px] animate-pulse">알맞은 위치 슬롯을 터치해서 배치하세요!</span>}
                  {!s2ShowFeedback && !s2SelectedTool && <span className="text-stone-400 text-[8px]">* 먼저 옮길 물건을 위에서 하나 골라 터치하세요.</span>}
                </div>

                <div>
                  <span className="text-[8px] text-stone-400 block text-center mb-1">2. 놓을 장소 선택</span>
                  <div className="flex justify-center gap-4">
                    {s2Questions[s2QuestionIdx].elements.places.map(place => {
                      const isPlaced = s2Placements[s2QuestionIdx + 1] !== null;
                      const placedItemId = s2Placements[s2QuestionIdx + 1];
                      return (
                        <button
                          key={place.id}
                          onClick={() => handleS2PlaceSelect(place.id)}
                          disabled={!s2SelectedTool || s2ShowFeedback !== null}
                          className={`flex-1 max-w-[120px] py-2 bg-stone-900/60 hover:bg-stone-900 border-2 ${
                            isPlaced ? 'border-emerald-600 bg-emerald-950/20' : 'border-dashed border-amber-600/40 text-amber-500/80'
                          } rounded-xl text-center text-[10px] font-bold flex flex-col items-center justify-center min-h-[50px]`}
                        >
                          {isPlaced ? (
                            <span className="text-2xl">
                              {placedItemId === 'pot' ? '🏺' : '🧱'}
                            </span>
                          ) : (
                            <span>📥 {place.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-2.5">
                {s2Completed ? (
                  <button
                    onClick={() => setSubPhase('stage3')}
                    className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow"
                  >
                    세 번째 단서 찾기 ➡️
                  </button>
                ) : (
                  <button
                    onClick={() => setSubPhase('stage1')}
                    className="w-full py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-bold rounded-xl border border-stone-500"
                  >
                    이전 단계로
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================= 4. STAGE 3: WHO MISUNDERSTOOD ================= */}
          {subPhase === 'stage3' && (
            <div className="flex-1 flex flex-col justify-between p-4 z-10">
              <div className="text-center mb-1.5">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Stage 3. 누가 잘못 알아들었을까?</span>
                <p className="text-[10px] text-[#eddcb9] mt-0.5 break-keep">
                  건축가의 지시와 사람들의 행동을 비교하고, 지시를 잘못 알아들은 사람을 찾아보세요.
                </p>
              </div>

              <div className="bg-[#2c1b0f] border-2 border-[#8b5a2b] p-3 rounded-2xl text-center my-2 flex items-center justify-center gap-3">
                <span className="text-2xl filter drop-shadow">👴💬</span>
                <div className="text-left">
                  <span className="text-[8px] text-amber-400 block font-bold">건축가의 그림 지시 내용</span>
                  <p className="text-xs font-bold text-white font-serif italic">
                    "{s3Questions[s3QuestionIdx].instruction}"
                  </p>
                </div>
              </div>

              <div className="min-h-[35px] flex items-center justify-center text-center my-1 bg-[#1a100a] rounded-lg px-2 py-1">
                {s3ShowFeedback === 'correct' && (
                  <div className="animate-bounce">
                    <span className="text-emerald-400 font-black text-xs block">🎯 찾았다! 이 사람이 말을 잘못 알아들었어요!</span>
                    <span className="text-[8.5px] text-[#eddcb9] font-sans block mt-0.5">{s3Questions[s3QuestionIdx].explanation}</span>
                  </div>
                )}
                {s3ShowFeedback === 'wrong' && <span className="text-red-400 font-black text-xs animate-shake">이 사람의 행동은 지시와 맞아요. 다른 사람을 살펴보세요.</span>}
                {!s3ShowFeedback && <span className="text-stone-400 text-[8px]">* 아래 일꾼 3명의 실제 행동을 보고 잘못 수행 중인 일꾼을 고르세요.</span>}
              </div>

              <div className="flex-1 flex flex-col gap-2.5 justify-center my-2">
                {s3ShuffledWorkers.map((w, idx) => {
                  const isWrongSelected = s3SelectedWorker?.id === w.id && !w.correct;
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleS3WorkerSelect(w)}
                      disabled={s3ShowFeedback !== null}
                      className={`w-full flex items-center gap-3 p-3 bg-[#3d2716]/95 border-2 rounded-2xl transition-all shadow active:scale-[0.98] ${
                        w.correct && s3ShowFeedback === 'correct' 
                          ? 'border-emerald-500 bg-emerald-950/20' 
                          : isWrongSelected 
                            ? 'border-red-500 opacity-60 bg-red-950/20' 
                            : 'border-[#8b5a2b]/30 hover:border-[#e6a817]'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#ebdcb9] text-[#2c1a0c] flex items-center justify-center text-lg font-bold border border-amber-600/40">
                        {idx + 1}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <span className="text-[9.5px] font-bold text-white block">{w.label}</span>
                        <div className="text-[11px] text-amber-200 font-sans tracking-wide mt-0.5 bg-black/30 px-2 py-0.5 rounded inline-block font-mono">
                          {w.text}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                {s3Completed ? (
                  <button
                    onClick={() => {
                      if (!soundMuted && synth && synth.playClick) {
                        try { synth.playClick(); } catch(e) {}
                      }
                      setSubPhase('stage4');
                    }}
                    className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow"
                  >
                    네 번째 단서 찾기 ➡️
                  </button>
                ) : (
                  <button
                    onClick={() => setSubPhase('stage2')}
                    className="w-full py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-bold rounded-xl border border-stone-500"
                  >
                    이전 단계로
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================= 5. STAGE 4: MATCH LANGUAGE (신규) ================= */}
          {subPhase === 'stage4' && (
            <div className="flex-1 flex flex-col justify-between p-4 z-10">
              <div className="text-center mb-1.5">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Stage 4. 흩어진 언어를 짝지어라!</span>
                <p className="text-[10px] text-[#eddcb9] mt-0.5 break-keep">
                  언어가 나뉜 후 다른 표현을 쓰고 있습니다. 같은 뜻(이모지)의 말을 하는 두 카드를 짝지어 보세요.
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex justify-center gap-1.5 my-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`text-xs ${i <= s4QuestionIdx ? 'opacity-100 scale-110' : 'opacity-35'}`}>
                    {i < s4QuestionIdx || s4Completed ? '🟢' : '💬'}
                  </span>
                ))}
              </div>

              {/* Quiz feedback message */}
              <div className="min-h-[26px] flex items-center justify-center text-center my-1">
                {s4ShowFeedback === 'correct' && <span className="text-emerald-400 font-black text-xs animate-bounce">🎉 딩동! 올바른 의미의 짝을 맞췄어요!</span>}
                {s4ShowFeedback === 'wrong' && <span className="text-red-400 font-black text-xs animate-shake">⚠️ 의미가 다른 짝입니다. 말풍선 이모지를 확인하세요!</span>}
                {!s4ShowFeedback && s4SelectedCard && <span className="text-amber-300 text-[9.5px] animate-pulse">같은 의미(이모지)를 지닌 짝 카드를 터치하세요!</span>}
                {!s4ShowFeedback && !s4SelectedCard && <span className="text-stone-400 text-[8px]">* 카드를 터치해 첫 번째 짝을 선택하세요.</span>}
              </div>

              {/* Match Cards Grid */}
              <div className="flex-1 bg-[#23150d] border-2 border-[#8b5a2b] rounded-2xl p-4 flex flex-col justify-center items-center gap-3.5 my-2 shadow-inner min-h-[220px]">
                <div className="grid grid-cols-2 gap-3.5 w-full max-w-[280px]">
                  {s4ShuffledCards.map(card => {
                    const isSelected = s4SelectedCard?.id === card.id;
                    const isMatched = s4MatchedIds.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleS4CardClick(card)}
                        disabled={isMatched || s4ShowFeedback !== null}
                        className={`py-4 rounded-xl text-center font-sans font-bold text-xs border-2 shadow transition-all ${
                          isMatched 
                            ? 'bg-emerald-950/20 border-emerald-600 text-emerald-400 opacity-50 scale-95' 
                            : isSelected 
                              ? 'bg-amber-100 border-amber-500 text-stone-900 scale-105 animate-pulse'
                              : 'bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] border-[#ffe8b5] text-[#2c1a0c] hover:from-[#fcf4dc]'
                        }`}
                      >
                        {card.text}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3">
                {s4Completed ? (
                  <button
                    onClick={() => {
                      synth.playSuccess();
                      setSubPhase('stage5');
                    }}
                    className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow animate-pulse"
                  >
                    다섯 번째 단서 찾기 ➡️
                  </button>
                ) : (
                  <button
                    onClick={() => setSubPhase('stage3')}
                    className="w-full py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-bold rounded-xl border border-stone-500"
                  >
                    이전 단계로
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================= 6. STAGE 5: SEQUENCE & QUIZ ================= */}
          {subPhase === 'stage5' && (
            <div className="flex-1 flex flex-col justify-between p-4 z-10 overflow-y-auto parchment-scroll">
              
              {!s5SequenceCleared && (
                <div className="flex-1 flex flex-col justify-between min-h-[380px]">
                  <div className="text-center mb-1">
                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Stage 5. 바벨탑의 비밀을 밝혀라!</span>
                    <p className="text-[10px] text-[#eddcb9] mt-0.5 break-keep">
                      지금까지 찾은 단서 카드를 사건이 일어난 순서대로 배열해 보세요.
                    </p>
                  </div>

                  <div className="min-h-[22px] flex items-center justify-center text-center my-1 bg-[#1a100a] rounded px-2">
                    {s5Feedback === 'correct' && <span className="text-emerald-400 font-black text-xs">✨ 완벽한 순서입니다! 카드가 정렬되었습니다.</span>}
                    {s5Feedback === 'wrong' && <span className="text-red-400 font-black text-xs animate-shake">❌ 순서가 맞지 않습니다. 힌트: '언어가 혼잡해진 뒤' 어떤 일이 일어났을까요?</span>}
                    {!s5Feedback && <span className="text-stone-400 text-[8px]">* 오른쪽의 ▲ / ▼ 버튼을 눌러 위치를 위아래로 정렬하세요.</span>}
                  </div>

                  <div className="flex flex-col gap-1.5 my-2">
                    {s5Cards.map((card, idx) => (
                      <div 
                        key={card.id}
                        className="flex items-center gap-2 bg-[#362315] border border-[#ffd700]/15 rounded-xl px-2.5 py-1.5 shadow-sm"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                        <p className="flex-1 text-[10px] text-[#fdf8eb] font-sans font-semibold leading-tight">{card.text}</p>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMoveCard(idx, 'up')}
                            disabled={idx === 0}
                            className="w-6 h-6 bg-stone-700 disabled:opacity-30 rounded text-white text-[9px] font-bold"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveCard(idx, 'down')}
                            disabled={idx === s5Cards.length - 1}
                            className="w-6 h-6 bg-stone-700 disabled:opacity-30 rounded text-white text-[9px] font-bold"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCheckSequence}
                    disabled={s5Feedback !== null}
                    className="w-full mt-2 py-2.5 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow"
                  >
                    순서 확인 🔍
                  </button>
                </div>
              )}

              {s5SequenceCleared && (
                <div className="flex-1 flex flex-col justify-between min-h-[380px] fade-in">
                  <div className="text-center mb-3">
                    <span className="text-[9px] text-[#e6a817] font-black tracking-widest block uppercase">THEOLOGICAL FINAL QUIZ</span>
                    <h3 className="text-sm font-black text-white mt-1">마지막 신학적 퀴즈</h3>
                    <p className="text-[9.5px] text-[#eddcb9] mt-0.5 break-keep">바벨탑 사건의 본질을 관찰하고 알맞은 이유를 골라보세요.</p>
                  </div>

                  <div className="bg-[#2c1b0f] border-2 border-[#e6a817]/40 p-4 rounded-2xl text-center my-3 relative shadow-inner">
                    <span className="absolute top-2 left-3 text-lg">❓</span>
                    <p className="text-xs font-black text-[#fff5db] leading-relaxed break-keep px-4">
                      "사람들이 바벨탑을 쌓은 가장 큰 이유는 무엇이었을까요?"
                    </p>
                  </div>

                  <div className="min-h-[22px] flex items-center justify-center text-center my-1">
                    {s5QuizFeedback === 'correct' && <span className="text-emerald-400 font-black text-xs animate-bounce">🎉 정답입니다! 자기 이름을 높이기 위한 교만이었어요.</span>}
                    {s5QuizFeedback === 'wrong' && <span className="text-red-400 font-black text-xs animate-shake">오답입니다. 창세기 11장 4절 '우리 이름을 내고' 구절을 묵상해보세요.</span>}
                  </div>

                  <div className="flex flex-col gap-2.5 my-2">
                    {s5ShuffledOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(opt)}
                        disabled={s5QuizFeedback !== null || s5QuizAnswered}
                        className={`w-full py-2.5 bg-gradient-to-b from-[#ebdcb9] to-[#c2af84] text-[#2c1a0c] font-black text-xs rounded-xl border border-[#ffe8b5] shadow active:scale-[0.98] transition-all ${
                          s5QuizAnswered && opt.includes('자기들의 이름을') ? 'from-emerald-500 to-emerald-600 text-white' : ''
                        }`}
                      >
                        {idx + 1}. {opt}
                      </button>
                    ))}
                  </div>

                  {s5QuizAnswered ? (
                    <button
                      onClick={handleAllCleared}
                      className="w-full py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow animate-pulse"
                    >
                      최종 비밀 밝히기 완료 ➡️
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 text-[9.5px] text-stone-400">
                      * 정답을 고르면 해설 설명 카드가 진행됩니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= 7. COMPLETE / END SCREEN ================= */}
          {subPhase === 'complete' && (
            <div className="flex-1 flex flex-col justify-between p-6 z-10 text-center relative bg-[#0d0703]/95">
              <div className="absolute inset-4 border-2 border-layton-gold/25 rounded-xl pointer-events-none" />
              
              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="text-4xl animate-bounce">🌈🏢</span>
                <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">STAGE 5 COMPLETE</span>
                <h3 className="font-black text-sm text-[#ffd700]">바벨탑의 비밀과 하나님의 이름</h3>
              </div>

              <div className="bg-[#2d1f14] border border-[#ffd700]/15 rounded-xl p-3 my-3">
                <span className="text-[9px] text-[#e6a817] font-bold block mb-1">⭐ 최종 획득 등급 및 배지</span>
                <div className="flex items-center justify-center gap-2 mt-1 bg-black/40 py-2 px-3 rounded-lg border border-layton-gold/10">
                  <span className="text-2xl">🏆</span>
                  <div className="text-left">
                    <span className="font-black text-white text-xs block">바벨탑 탐정 배지</span>
                    <span className="text-[8.5px] text-stone-400">자기 이름을 높이지 않고 하나님을 높이는 어린 모험가</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#fcf8eb] text-stone-900 border-4 border-[#8b5a2b] p-3.5 rounded-2xl shadow-xl font-layton-myeongjo">
                <p className="text-[10.5px] font-bold leading-relaxed break-keep">
                  "우리가 성읍과 탑을 건설하여 그 탑 꼭대기를 하늘에 닿게 하여 우리 이름을 내고"
                </p>
                <span className="text-[8px] text-[#8b5a2b] font-bold mt-1.5 block text-right">— 창세기 11장 4절 —</span>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={handleRestartAll}
                  className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 text-stone-100 text-xs font-bold rounded-xl border border-stone-500"
                >
                  다시 도전하기 🔄
                </button>
                <button
                  onClick={handleAllCleared}
                  className="flex-1 py-2.5 bg-gradient-to-b from-[#e7b85e] to-[#ab7418] text-[#2c1a0c] font-black text-xs rounded-xl border-2 border-[#ffe8b5] shadow"
                >
                  퀴즈로 돌아가기 ➡️
                </button>
              </div>
            </div>
          )}

          {/* ================= MODALS & OVERLAYS ================= */}

          {/* Hint modal popup */}
          {showHint && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-6 z-50 fade-in">
              <div className="w-[280px] bg-layton-parchment rounded-2xl border-4 border-layton-brown p-4 text-center shadow-2xl relative solved-banner text-stone-900">
                <span className="text-2xl block mb-1">💡</span>
                <h3 className="font-layton-myeongjo font-black text-xs text-layton-dark mb-2">수수께끼 힌트</h3>
                <p className="text-[10px] text-layton-lightbrown font-layton-myeongjo font-semibold leading-relaxed mb-4 break-keep">
                  {getActiveHintText()}
                </p>
                <button
                  onClick={() => {
                    if (!soundMuted) synth.playClick();
                    setShowHint(false);
                  }}
                  className="w-full py-1.5 bg-[#4a2f13] hover:bg-[#5e3c1b] text-layton-cream text-xs font-bold rounded-xl border border-layton-gold/20 active:scale-95"
                >
                  확인
                </button>
              </div>
            </div>
          )}

        </div>
      );
    }
