// --- 핵심 로직 부분 ---

function decomposeChar(char) {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return [char];

    const choIndex = Math.floor(code / 588);
    const jungIndex = Math.floor((code % 588) / 28);
    const jongIndex = code % 28;

    const choBase = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    const jungMap = [
        ['ㅏ'],['ㅐ'],['ㅑ'],['ㅒ'],['ㅓ'],['ㅔ'],['ㅕ'],['ㅖ'],
        ['ㅗ'],['ㅗ','ㅏ'],['ㅗ','ㅐ'],['ㅗ','ㅣ'],['ㅛ'],
        ['ㅜ'],['ㅜ','ㅓ'],['ㅜ','ㅔ'],['ㅜ','ㅣ'],['ㅠ'],
        ['ㅡ'],['ㅡ','ㅣ'],['ㅣ']
    ];
    const jongMap = [
        [],['ㄱ'],['ㄲ'],['ㄱ','ㅅ'],['ㄴ'],['ㄴ','ㅈ'],['ㄴ','ㅎ'],
        ['ㄷ'],['ㄹ'],['ㄹ','ㄱ'],['ㄹ','ㅁ'],['ㄹ','ㅂ'],['ㄹ','ㅅ'],
        ['ㄹ','ㅌ'],['ㄹ','ㅍ'],['ㄹ','ㅎ'],['ㅁ'],['ㅂ'],['ㅂ','ㅅ'],
        ['ㅅ'],['ㅆ'],['ㅇ'],['ㅈ'],['ㅊ'],['ㅋ'],['ㅌ'],['ㅍ'],['ㅎ']
    ];

    return [choBase[choIndex], ...jungMap[jungIndex], ...jongMap[jongIndex]];
}

function evaluateCharacter(guessChar, targetChar, oppositeTargetChar) {
    if (guessChar === targetChar) return '🥕'; 

    const gJamo = decomposeChar(guessChar);
    const tJamo = decomposeChar(targetChar);
    const oppJamo = decomposeChar(oppositeTargetChar);

    let matchCount = 0;
    let tCopy = [...tJamo];
    for (const j of gJamo) {
        const idx = tCopy.indexOf(j);
        if (idx !== -1) {
            matchCount++;
            tCopy.splice(idx, 1);
        }
    }

    const firstMatch = gJamo[0] === tJamo[0];

    if (matchCount >= 2) {
        return firstMatch ? '🍄' : '🧄';
    } else if (matchCount === 1) {
        return '🍆';
    } else {
        let oppMatchCount = 0;
        let oppCopy = [...oppJamo];
        for (const j of gJamo) {
            const idx = oppCopy.indexOf(j);
            if (idx !== -1) {
                oppMatchCount++;
                oppCopy.splice(idx, 1);
            }
        }
        return oppMatchCount >= 1 ? '🍌' : '🍎';
    }
}

function getWordHints(targetWord, guessWord) {
    const hint1 = evaluateCharacter(guessWord[0], targetWord[0], targetWord[1]);
    const hint2 = evaluateCharacter(guessWord[1], targetWord[1], targetWord[0]);
    return hint1 + hint2;
}

function filterCandidates(dictionary, guessHistory) {
    return dictionary.filter(candidateWord => {
        return guessHistory.every(historyItem => {
            const expectedHint = getWordHints(candidateWord, historyItem.word);
            return expectedHint === historyItem.hint;
        });
    });
}

// --- 화면 제어 (UI) 및 상태 관리 부분 ---

let fullDictionary = [];
let currentCandidates = [];
let myHistory = [];

// DOM 요소 가져오기
const guessWordInput = document.getElementById('guessWord');
const hint1Select = document.getElementById('hint1');
const hint2Select = document.getElementById('hint2');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const historyList = document.getElementById('historyList');
const candidatesDiv = document.getElementById('candidates');
const countSpan = document.getElementById('count');

// UI 업데이트 함수
function updateUI() {
    // 기록 업데이트
    historyList.innerHTML = '';
    myHistory.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.word} : ${item.hint}`;
        historyList.appendChild(li);
    });

    // 남은 단어 업데이트
    countSpan.textContent = currentCandidates.length;
    candidatesDiv.innerHTML = '';
    if (currentCandidates.length === 0) {
        candidatesDiv.textContent = '조건에 맞는 단어가 없습니다. 사전에 없거나 입력이 잘못되었을 수 있습니다.';
    } else {
        currentCandidates.forEach(word => {
            const span = document.createElement('span');
            span.className = 'candidate-word';
            span.textContent = word;
            candidatesDiv.appendChild(span);
        });
    }
}

// 제출 버튼 클릭 이벤트
submitBtn.addEventListener('click', () => {
    const word = guessWordInput.value.trim();
    if (word.length !== 2) {
        alert('정확히 2글자 단어를 입력해주세요.');
        return;
    }

    const hint = hint1Select.value + hint2Select.value;
    
    // 기록 추가 및 필터링 실행
    myHistory.push({ word, hint });
    currentCandidates = filterCandidates(currentCandidates, myHistory);
    
    updateUI();
    
    // 입력창 초기화
    guessWordInput.value = '';
    guessWordInput.focus();
});

// 엔터키 입력 지원 추가
guessWordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitBtn.click();
    }
});

// 초기화 버튼 클릭 이벤트
resetBtn.addEventListener('click', () => {
    myHistory = [];
    currentCandidates = [...fullDictionary];
    guessWordInput.value = '';
    hint1Select.value = '🍎';
    hint2Select.value = '🍎';
    updateUI();
});

// 외부 단어장(words.json) 파일 불러오기
async function loadDictionary() {
    try {
        const response = await fetch('data/words.json');
        const parsedWords = await response.json(); // JSON 데이터를 배열로 바로 변환
        
        // Set을 사용하여 중복된 단어를 자동으로 제거하고, 혹시 모를 오타를 위해 2글자인 단어만 필터링
        fullDictionary = [...new Set(parsedWords)].filter(w => w.length === 2);
        currentCandidates = [...fullDictionary];
        updateUI();
    } catch (error) {
        console.error('단어장 파일을 불러오는데 실패했습니다.', error);
        candidatesDiv.textContent = '단어장 파일을 불러오는데 실패했습니다. (로컬 파일 실행 보안 정책 문제일 수 있습니다.)';
    }
}

loadDictionary();
