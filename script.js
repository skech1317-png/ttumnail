// Gemini API + Pollinations 이미지 생성
const API_STORAGE_KEY = 'gemini_api_key';
let apiKey = localStorage.getItem(API_STORAGE_KEY) || '';

// ============================================
// 저작권 무료 폰트 데이터베이스 (영상 사용 허용)
// 모든 폰트는 OFL(Open Font License) 기반으로
// 유튜브 썸네일, 영상 자막, UCC 등에 무료 사용 가능
// ============================================
const LICENSED_FONTS = {
    // 손글씨/펜글씨 스타일
    handwriting: [
        { name: 'Nanum Pen Script', style: '손글씨', weight: 'normal', mood: '친근한' },
        { name: 'Gaegu', style: '손글씨', weight: 'normal', mood: '귀여운' },
        { name: 'Poor Story', style: '손글씨', weight: 'normal', mood: '소박한' },
        { name: 'Gamja Flower', style: '손글씨', weight: 'normal', mood: '발랄한' },
        { name: 'Hi Melody', style: '손글씨', weight: 'normal', mood: '밝은' }
    ],
    // 붓글씨/캘리그라피 스타일
    brush: [
        { name: 'Nanum Brush Script', style: '붓글씨', weight: 'normal', mood: '전통적' },
        { name: 'Stylish', style: '붓글씨', weight: 'normal', mood: '세련된' }
    ],
    // 굵은 고딕/임팩트 스타일
    bold: [
        { name: 'Black Han Sans', style: '굵은고딕', weight: 'bold', mood: '강렬한' },
        { name: 'Jua', style: '둥근고딕', weight: 'bold', mood: '친근한' },
        { name: 'Do Hyeon', style: '레트로', weight: 'bold', mood: '복고풍' },
        { name: 'Yeon Sung', style: '굵은고딕', weight: 'bold', mood: '강렬한' }
    ],
    // 가는 고딕/깔끔한 스타일
    thin: [
        { name: 'Sunflower', style: '가는고딕', weight: 'light', mood: '깔끔한' },
        { name: 'Nanum Gothic', style: '고딕', weight: 'normal', mood: '기본' },
        { name: 'Dongle', style: '둥근고딕', weight: 'light', mood: '부드러운' }
    ],
    // 제목용/디스플레이 스타일
    display: [
        { name: 'East Sea Dokdo', style: '붓글씨', weight: 'normal', mood: '역동적' },
        { name: 'Dokdo', style: '붓글씨', weight: 'normal', mood: '강렬한' },
        { name: 'Cute Font', style: '귀여운', weight: 'normal', mood: '발랄한' },
        { name: 'Single Day', style: '픽셀', weight: 'normal', mood: '레트로' }
    ]
};

// 폰트 스타일 키워드 매핑 (Gemini 응답 → 폰트 카테고리)
const FONT_STYLE_MAP = {
    '손글씨': 'handwriting',
    '펜글씨': 'handwriting',
    '필기체': 'handwriting',
    '붓글씨': 'brush',
    '캘리그라피': 'brush',
    '서예': 'brush',
    '굵은': 'bold',
    '두꺼운': 'bold',
    '강렬한': 'bold',
    '임팩트': 'bold',
    '가는': 'thin',
    '깔끔한': 'thin',
    '고딕': 'thin',
    '레트로': 'display',
    '복고': 'display',
    '귀여운': 'display',
    '역동적': 'display'
};

// 추천 폰트 선택 함수
function getRecommendedFont(fontStyle) {
    if (!fontStyle) return 'Black Han Sans';

    // 스타일 키워드로 카테고리 찾기
    let category = 'bold'; // 기본값
    for (const [keyword, cat] of Object.entries(FONT_STYLE_MAP)) {
        if (fontStyle.includes(keyword)) {
            category = cat;
            break;
        }
    }

    // 해당 카테고리에서 랜덤 폰트 선택
    const fonts = LICENSED_FONTS[category];
    const randomIndex = Math.floor(Math.random() * fonts.length);
    return fonts[randomIndex].name;
}

// 모든 라이선스 폰트 이름 목록
function getAllLicensedFontNames() {
    const allFonts = [];
    for (const category of Object.values(LICENSED_FONTS)) {
        for (const font of category) {
            allFonts.push(font.name);
        }
    }
    return allFonts;
}

// 썸네일 스타일 (큰 손글씨 폰트 + 오른쪽 배치)
const STYLES = [
    { name: '🖌️ 붓글씨', badge: 'style-1', overlay: 'joseon-warm', textColor: '#fff', strokeColor: '#8b0000', subtextColor: '#ffd700', fontSize: 105, position: 'center', textAlign: 'right', fontFamily: 'Nanum Pen Script' },
    { name: '📜 고전', badge: 'style-2', overlay: 'joseon-dark', textColor: '#ffefd5', strokeColor: '#3d2817', subtextColor: '#ff6b35', fontSize: 100, position: 'center', textAlign: 'right', fontFamily: 'Gaegu' },
    { name: '🎭 드라마', badge: 'style-3', overlay: 'joseon-night', textColor: '#fff', strokeColor: '#1a0f0a', subtextColor: '#ffcc00', fontSize: 108, position: 'center', textAlign: 'right', fontFamily: 'Nanum Pen Script' }
];

// 사용자 선택 옵션
let userTextAlign = 'right';
let userFontFamily = 'Nanum Pen Script';

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    const apiInput = document.getElementById('api-key');
    const saveBtn = document.getElementById('save-api-btn');
    const generateBtn = document.getElementById('generate-btn');
    const urlInput = document.getElementById('youtube-url');
    const inputSection = document.querySelector('.input-section');
    const regenerateBtn = document.getElementById('regenerate-btn');

    // 저장된 API 키 확인
    if (apiKey) {
        apiInput.value = '••••••••••••••••••••';
        showApiStatus('✅ API 키가 저장되어 있습니다.', 'success');
        inputSection.classList.add('active');
        generateBtn.disabled = false;
    }

    // API 키 저장
    saveBtn.onclick = () => {
        const key = apiInput.value.trim();
        if (!key || key.includes('•')) {
            showError('API 키를 입력해주세요.');
            return;
        }
        apiKey = key;
        localStorage.setItem(API_STORAGE_KEY, key);
        apiInput.value = '••••••••••••••••••••';
        showApiStatus('✅ API 키가 저장되었습니다!', 'success');
        inputSection.classList.add('active');
        generateBtn.disabled = false;
        hideError();
    };

    // 생성 버튼
    generateBtn.onclick = generate;
    urlInput.onkeypress = e => { if (e.key === 'Enter') generate(); };
    urlInput.oninput = hideError;

    // 다시 만들기
    regenerateBtn.onclick = generate;

    // 옵션 버튼 핸들러 - 글자 위치
    document.querySelectorAll('#text-position .option-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#text-position .option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            userTextAlign = btn.dataset.value;
        };
    });

    // 옵션 버튼 핸들러 - 서체
    document.querySelectorAll('#font-select .option-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#font-select .option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            userFontFamily = btn.dataset.value;
            // 커스텀 폰트 선택 해제
            document.getElementById('font-file-name').textContent = '선택된 파일 없음';
            document.getElementById('font-file-name').classList.remove('loaded');
            document.getElementById('custom-font-name').value = '';
        };
    });

    // 커스텀 폰트 파일 업로드
    document.getElementById('font-upload').onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fontName = 'CustomUploadedFont';
        const fileNameEl = document.getElementById('font-file-name');

        try {
            const fontBuffer = await file.arrayBuffer();
            const fontFace = new FontFace(fontName, fontBuffer);
            await fontFace.load();
            document.fonts.add(fontFace);

            userFontFamily = fontName;
            fileNameEl.textContent = `✅ ${file.name}`;
            fileNameEl.classList.add('loaded');

            // 기본 서체 선택 해제
            document.querySelectorAll('#font-select .option-btn').forEach(b => b.classList.remove('active'));
        } catch (err) {
            fileNameEl.textContent = '❌ 로드 실패';
            console.error('Font load error:', err);
        }
    };

    // 커스텀 폰트 이름 직접 입력
    document.getElementById('apply-custom-font').onclick = () => {
        const fontName = document.getElementById('custom-font-name').value.trim();
        if (!fontName) {
            showError('폰트 이름을 입력해주세요.');
            return;
        }
        userFontFamily = fontName;
        // 기본 서체 선택 해제
        document.querySelectorAll('#font-select .option-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('font-file-name').textContent = '선택된 파일 없음';
        document.getElementById('font-file-name').classList.remove('loaded');
        hideError();
        alert(`✅ "${fontName}" 폰트가 적용되었습니다.`);
    };
});

function showApiStatus(msg, type) {
    const status = document.getElementById('api-status');
    status.textContent = msg;
    status.className = 'api-status ' + type;
}

function showError(msg) {
    const e = document.getElementById('error-message');
    e.querySelector('span').textContent = msg;
    e.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

function updateStep(n) {
    document.querySelectorAll('.loading-step').forEach((el, i) => {
        el.classList.remove('active', 'done');
        if (i < n) el.classList.add('done');
        if (i === n) el.classList.add('active');
    });
}

// 유튜브 ID 추출
function extractVideoId(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

// 영상 정보
async function getVideoInfo(id) {
    try {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
        return r.ok ? await r.json() : null;
    } catch { return null; }
}

// Gemini API로 컨셉 생성
async function generateConceptWithGemini(title, channel) {
    // 사용 가능한 저작권 무료 폰트 목록
    const licensedFontList = getAllLicensedFontNames().join(', ');

    const prompt = `당신은 유튜브 썸네일 전문가이자 스토리 분석가입니다. 

영상 제목: ${title}
채널: ${channel}

위 영상의 핵심 스토리를 분석하고, 시청자가 클릭하고 싶어지는 썸네일 컨셉 3개를 만들어주세요.

## 중요 규칙:
1. **이미지 스타일**: 한국 조선시대 배경의 웹툰/일러스트 스타일 (중국풍 X, 한국 고유 스타일 O)
2. **핵심 장면**: 영상 스토리에서 가장 극적이고 감정적인 순간을 이미지로 표현
3. **텍스트**: 시청자가 궁금해서 클릭하고 싶어지는 문구 (질문형, 반전 암시, 감정 자극)
4. **줄별 색상**: 인기 유튜브 썸네일처럼 각 줄마다 다른 색상을 사용 (빨강, 노랑, 흰색, 초록 등을 조합)
5. **폰트 선택**: 영상 분위기에 맞는 폰트를 아래 저작권 무료 폰트 목록에서 선택

## 사용 가능한 저작권 무료 폰트 (반드시 이 목록에서만 선택):
${licensedFontList}

각 컨셉에 대해:
1. imagePrompt: 영어로 된 이미지 프롬프트. 반드시 다음 키워드를 모두 포함:
   - "Korean historical webtoon illustration style, manhwa art style, digital painting"
   - "Korean Joseon dynasty era, NOT Chinese style, purely Korean aesthetic"
   - "character wearing Korean traditional hanbok with jeogori and chima"
   - "Korean traditional house hanok with giwa roof tiles, Korean village scenery"
   - "Korean paper hanji texture, traditional Korean color palette (dancheong colors)"
   - 핵심 장면의 구체적 묘사 (인물의 감정 표정, 상황, 소품)
   - "warm earthy tones, soft lighting, Korean historical drama atmosphere"
   - "character positioned on LEFT side, RIGHT side empty for text overlay"
   - "16:9 wide aspect ratio, high quality digital illustration"
   
2. text: 한글 썸네일 메인 문구 (18-28자)
   - 쉼표(,)로 구분해서 2-3줄로 나눌 수 있게 작성
   - 궁금증을 유발하는 질문형 또는 반전 암시

3. lineColors: 각 줄의 메인 색상 배열 (HEX 코드)
   - text의 각 줄에 대응하는 색상을 지정
   - 눈에 띄는 대비 색상을 사용 (빨강 #FF4444, 노랑 #FFD700, 흰색 #FFFFFF, 초록 #00FF00, 주황 #FF8800 등)
   
4. fontStyle: 추천 폰트 스타일 설명 (한글)
   - 예: "손글씨", "붓글씨", "굵은고딕", "레트로", "귀여운" 등
   - 영상 분위기와 어울리는 스타일 선택
   
5. recommendedFont: 위 저작권 무료 폰트 목록에서 선택한 폰트 이름 (정확히 입력)
   - 반드시 위 목록에 있는 폰트만 사용
   - 예: "Black Han Sans", "Nanum Pen Script", "Gaegu" 등

6. subtext: 한글 서브 문구 (8-12자)
   - 메인 문구를 보완하는 짧은 설명

7. subtextColor: 서브 텍스트 색상 (HEX 코드)
   
8. concept: 컨셉 설명 (한글, 8자 이내)

반드시 아래 JSON 형식으로만 응답:
[
  {"imagePrompt": "...", "text": "...", "lineColors": ["#FF4444", "#FFD700"], "fontStyle": "손글씨", "recommendedFont": "Nanum Pen Script", "subtext": "...", "subtextColor": "#FFA500", "concept": "..."},
  {"imagePrompt": "...", "text": "...", "lineColors": ["#FFFFFF", "#00FF00"], "fontStyle": "붓글씨", "recommendedFont": "Nanum Brush Script", "subtext": "...", "subtextColor": "#FFD700", "concept": "..."},
  {"imagePrompt": "...", "text": "...", "lineColors": ["#FF8800", "#FFFFFF", "#FFD700"], "fontStyle": "굵은고딕", "recommendedFont": "Black Han Sans", "subtext": "...", "subtextColor": "#FF4444", "concept": "..."}
]`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9 }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'API 오류');
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // JSON 추출
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('JSON 파싱 실패');
    } catch (err) {
        console.error('Gemini API error:', err);
        throw err;
    }
}

// Pollinations로 이미지 생성
function generateImageUrl(prompt) {
    const enhancedPrompt = `${prompt}, YouTube thumbnail style, high contrast, professional, 16:9 aspect ratio`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1280&height=720&nologo=true`;
}

// 이미지 로드
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = url;
    });
}

// 오버레이
function applyOverlay(ctx, type, w, h) {
    ctx.save();
    if (type === 'joseon-warm') {
        // 따뜻한 조선시대 느낌 (황토색 + 붉은색)
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, 'rgba(139,69,19,0.3)');
        g.addColorStop(0.5, 'rgba(160,82,45,0.25)');
        g.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // 오른쪽에 텍스트 영역을 위한 그라데이션
        const side = ctx.createLinearGradient(w * 0.5, 0, w, 0);
        side.addColorStop(0, 'transparent');
        side.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = side;
        ctx.fillRect(0, 0, w, h);
    } else if (type === 'joseon-dark') {
        // 어두운 고전 느낌
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(44,24,16,0.4)');
        g.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // 왼쪽에 텍스트 영역
        const side = ctx.createLinearGradient(0, 0, w * 0.5, 0);
        side.addColorStop(0, 'rgba(0,0,0,0.7)');
        side.addColorStop(1, 'transparent');
        ctx.fillStyle = side;
        ctx.fillRect(0, 0, w, h);
    } else if (type === 'joseon-night') {
        // 밤 분위기 드라마틱
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, w, h);
        // 오른쪽 텍스트 영역
        const side = ctx.createLinearGradient(w * 0.4, 0, w, 0);
        side.addColorStop(0, 'transparent');
        side.addColorStop(1, 'rgba(20,10,5,0.75)');
        ctx.fillStyle = side;
        ctx.fillRect(0, 0, w, h);
    } else if (type === 'dark-red') {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, 'rgba(139,0,0,0.4)');
        g.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    } else if (type === 'neon') {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, 'rgba(138,43,226,0.3)');
        g.addColorStop(1, 'rgba(0,255,255,0.2)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        const bg = ctx.createLinearGradient(0, h * 0.6, 0, h);
        bg.addColorStop(0, 'transparent');
        bg.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
    } else if (type === 'cinematic') {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, 60);
        ctx.fillRect(0, h - 60, w, 60);
    }
    ctx.restore();
}

// 색상을 밝게 변환하는 함수
function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// 색상을 어둡게 변환하는 함수
function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// 텍스트 그라데이션 생성 함수 (기본 색상 기반)
function createTextGradient(ctx, x, y, fontSize, textAlign, baseColor) {
    // 텍스트 위치에 따라 그라데이션 방향 조정
    const gradientWidth = fontSize * 8;
    let startX, endX;

    if (textAlign === 'right') {
        startX = x - gradientWidth;
        endX = x;
    } else if (textAlign === 'left') {
        startX = x;
        endX = x + gradientWidth;
    } else {
        startX = x - gradientWidth / 2;
        endX = x + gradientWidth / 2;
    }

    // 기본 색상을 기반으로 그라데이션 생성
    const gradient = ctx.createLinearGradient(startX, y - fontSize / 2, endX, y + fontSize / 2);
    const lightColor = lightenColor(baseColor, 40);
    const brightColor = lightenColor(baseColor, 60);

    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.25, lightColor);
    gradient.addColorStop(0.5, brightColor);
    gradient.addColorStop(0.75, lightColor);
    gradient.addColorStop(1, baseColor);

    return gradient;
}

// 텍스트 그리기 (메인 + 서브) - 줄별 색상 지원
function drawText(ctx, text, subtext, style, w, h, lineColors = null, subtextColor = null) {
    if (!text) return;
    ctx.save();

    // 기본 줄별 색상 (lineColors가 없을 경우)
    const defaultLineColors = ['#FF4444', '#FFD700', '#FFFFFF'];
    const colors = lineColors && lineColors.length > 0 ? lineColors : defaultLineColors;
    const subColor = subtextColor || '#FFA500';

    // 메인 텍스트 (여러 줄 지원)
    const lines = text.split(/[,\n]/).map(s => s.trim()).filter(s => s);
    const mainFontSize = style.fontSize || 65;
    const subFontSize = Math.floor(mainFontSize * 0.55);

    // 사용자 선택 폰트 적용
    const fontFamily = userFontFamily || style.fontFamily || 'Nanum Pen Script';
    ctx.font = `700 ${mainFontSize}px "${fontFamily}", "Noto Sans KR", sans-serif`;

    // 사용자 선택 위치 적용
    const textAlign = userTextAlign || style.textAlign || 'right';
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    // 텍스트 위치 계산 (하단 배치)
    const totalHeight = lines.length * (mainFontSize * 1.1) + (subtext ? subFontSize * 1.3 : 0);
    // Y 위치: 화면 하단에 배치 (약 72% 위치에서 시작)
    let startY = h * 0.72 - (totalHeight / 2);
    // 사용자 선택 위치에 따라 x 좌표 결정 (좌우)
    let x = textAlign === 'left' ? 60 : textAlign === 'right' ? w - 60 : w / 2;

    // 그림자 설정 (더 강하게)
    ctx.shadowColor = 'rgba(0,0,0,1)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;

    // 메인 텍스트 각 줄 그리기 (줄별 색상 적용)
    lines.forEach((line, i) => {
        const y = startY + i * (mainFontSize * 1.1);

        // 해당 줄의 색상 선택 (색상 배열을 순환)
        const lineColor = colors[i % colors.length];
        const strokeColor = darkenColor(lineColor, 50);

        // 더 강한 외곽선 효과 (다중 레이어)
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = mainFontSize / 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, x, y);

        // 컬러 외곽선 (해당 줄 색상에 맞춤)
        ctx.shadowBlur = 0;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = mainFontSize / 5;
        ctx.strokeText(line, x, y);

        // 그라데이션 텍스트 (해당 줄 색상 기반)
        ctx.shadowColor = lightenColor(lineColor, 30) + '80'; // 50% 투명도로 발광
        ctx.shadowBlur = 20;
        const mainGradient = createTextGradient(ctx, x, y, mainFontSize, textAlign, lineColor);
        ctx.fillStyle = mainGradient;
        ctx.fillText(line, x, y);
    });

    // 서브 텍스트
    if (subtext) {
        const subY = startY + lines.length * (mainFontSize * 1.2) + subFontSize * 0.5;
        ctx.font = `700 ${subFontSize}px "Black Han Sans", "Noto Sans KR", sans-serif`;

        const subStrokeColor = darkenColor(subColor, 50);

        // 서브 텍스트 외곽선 (다중 레이어)
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = subFontSize / 4;
        ctx.strokeText(subtext, x, subY);

        // 서브 텍스트 그라데이션 채우기 (지정된 색상 기반)
        ctx.shadowColor = lightenColor(subColor, 30) + '60';
        ctx.shadowBlur = 15;
        const subGradient = createTextGradient(ctx, x, subY, subFontSize, textAlign, subColor);
        ctx.fillStyle = subGradient;
        ctx.fillText(subtext, x, subY);
    }

    ctx.restore();
}

// 캔버스에 썸네일 생성
async function createThumbnail(canvasId, style, imageUrl, text, subtext, lineColors = null, subtextColor = null, recommendedFont = null) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const w = 1280, h = 720;
    canvas.width = w;
    canvas.height = h;

    try {
        const img = await loadImage(imageUrl);
        // 이미지 비율 맞춰 그리기
        const scale = Math.max(w / img.width, h / img.height);
        const nw = img.width * scale, nh = img.height * scale;
        const ox = (w - nw) / 2, oy = (h - nh) / 2;
        ctx.drawImage(img, ox, oy, nw, nh);
    } catch {
        // 기본 배경
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#1a1a2e');
        g.addColorStop(1, '#16213e');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    }

    // 추천 폰트가 있으면 스타일에 적용
    const modifiedStyle = { ...style };
    if (recommendedFont) {
        modifiedStyle.fontFamily = recommendedFont;
    }

    applyOverlay(ctx, modifiedStyle.overlay, w, h);
    drawText(ctx, text, subtext, modifiedStyle, w, h, lineColors, subtextColor);

    return canvas.toDataURL('image/png');
}

// 카드 생성
function createCard(dataUrl, style, text, concept, idx, recommendedFont = null) {
    const card = document.createElement('div');
    card.className = 'generated-card';
    const fontInfo = recommendedFont ? `<span class="font-info">📝 ${recommendedFont}</span>` : '';
    card.innerHTML = `
        <div class="generated-image-wrapper">
            <img class="generated-image" src="${dataUrl}" alt="생성된 썸네일">
            <span class="style-badge ${style.badge}">스타일 ${idx + 1}</span>
        </div>
        <div class="generated-info">
            <h3 class="generated-style-name">${style.name} - ${concept}</h3>
            <p class="generated-text">"${text}"</p>
            ${fontInfo}
            <button class="download-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                다운로드
            </button>
        </div>
    `;
    card.querySelector('.download-btn').onclick = () => {
        const a = document.createElement('a');
        a.download = `thumbnail-${idx + 1}.png`;
        a.href = dataUrl;
        a.click();
    };
    return card;
}

// 메인 생성 함수
async function generate() {
    const url = document.getElementById('youtube-url').value.trim();
    const btn = document.getElementById('generate-btn');

    if (!url) { showError('URL을 입력해주세요.'); return; }
    const videoId = extractVideoId(url);
    if (!videoId) { showError('올바른 유튜브 URL을 입력해주세요.'); return; }
    if (!apiKey) { showError('API 키를 먼저 설정해주세요.'); return; }

    hideError();
    btn.disabled = true;

    document.getElementById('loading-section').classList.remove('hidden');
    document.getElementById('analysis-section').classList.add('hidden');
    document.getElementById('generated-section').classList.add('hidden');

    try {
        // Step 1: 영상 분석
        updateStep(0);
        const info = await getVideoInfo(videoId);
        const title = info?.title || '알 수 없는 영상';
        const channel = info?.author_name || '알 수 없음';

        await new Promise(r => setTimeout(r, 500));

        // Step 2: Gemini로 컨셉 생성
        updateStep(1);
        const concepts = await generateConceptWithGemini(title, channel);

        // Step 3: 이미지 생성
        updateStep(2);
        const imageUrls = concepts.map(c => generateImageUrl(c.imagePrompt));

        // 이미지 프리로드 (병렬)
        await Promise.all(imageUrls.map(url => {
            return new Promise(resolve => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = resolve;
                img.onerror = resolve;
                img.src = url;
            });
        }));

        await new Promise(r => setTimeout(r, 1000));

        // Step 4: 썸네일 완성
        updateStep(3);

        const thumbnails = [];
        for (let i = 0; i < 3; i++) {
            // AI 추천 폰트 또는 기본 폰트 사용
            const recommendedFont = concepts[i].recommendedFont || getRecommendedFont(concepts[i].fontStyle);

            const dataUrl = await createThumbnail(
                `canvas-${i + 1}`,
                STYLES[i],
                imageUrls[i],
                concepts[i].text,
                concepts[i].subtext || '',
                concepts[i].lineColors || null,
                concepts[i].subtextColor || null,
                recommendedFont
            );
            thumbnails.push({
                dataUrl,
                text: concepts[i].text,
                subtext: concepts[i].subtext,
                concept: concepts[i].concept,
                lineColors: concepts[i].lineColors,
                subtextColor: concepts[i].subtextColor,
                fontStyle: concepts[i].fontStyle,
                recommendedFont: recommendedFont
            });
        }

        // 결과 표시
        document.getElementById('loading-section').classList.add('hidden');

        document.getElementById('original-thumbnail').src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        document.getElementById('analysis-title').textContent = title;
        document.getElementById('analysis-interpretation').textContent =
            `AI가 "${title}" 영상을 분석하여 3가지 새로운 컨셉의 썸네일을 생성했습니다.`;
        document.getElementById('analysis-section').classList.remove('hidden');

        const grid = document.getElementById('generated-grid');
        grid.innerHTML = '';
        thumbnails.forEach((t, i) => {
            grid.appendChild(createCard(t.dataUrl, STYLES[i], t.text, t.concept, i, t.recommendedFont));
        });
        document.getElementById('generated-section').classList.remove('hidden');

        document.getElementById('analysis-section').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        document.getElementById('loading-section').classList.add('hidden');
        showError(`오류: ${err.message}`);
    }

    btn.disabled = false;
}
