// Consolidate question pools
const MASTER_QUESTION_POOL = [
  ...(typeof TELUGU_POOL !== 'undefined' ? TELUGU_POOL : []),
  ...(typeof CDP_POOL !== 'undefined' ? CDP_POOL : []),
  ...(typeof ENGLISH_L2_POOL !== 'undefined' ? ENGLISH_L2_POOL : []),
  ...(typeof ENGLISH_SUBJECT_POOL !== 'undefined' ? ENGLISH_SUBJECT_POOL : [])
];

console.log("Total Questions Loaded into Master Pool:", MASTER_QUESTION_POOL.length);

// Official Paper Pattern (Sequential Order: Telugu -> CDP -> English-II -> English Content)
const SECTION_ORDER = [
  { key: "teluguLanguage1", title: "Telugu Language-I", count: 30, startIndex: 0, endIndex: 29 },
  { key: "cdp", title: "CDP (Psychology)", count: 30, startIndex: 30, endIndex: 59 },
  { key: "englishLanguage2", title: "English Language-II", count: 30, startIndex: 60, endIndex: 89 },
  { key: "englishSubject", title: "English Content", count: 60, startIndex: 90, endIndex: 149 }
];

const TARGET_SUBTOPIC_QUOTAS = {
  teluguLanguage1: { "Literature": 7, "Comprehension": 6, "Grammar": 8, "Vocabulary": 5, "Language Usage": 4 },
  cdp: { "Growth & Development": 4, "Developmental Theories": 5, "Childhood & Adolescence": 3, "Intelligence & Aptitude": 4, "Learning Theories": 5, "Personality & Assessment": 3, "Guidance & Mental Health": 3, "Education Policies": 3 },
  englishLanguage2: { "Vocabulary": 8, "Grammar": 12, "Language Functions": 5, "Reading": 5 },
  englishSubject: { "Vocabulary": 12, "Grammar": 18, "Reading": 6, "Literature": 12, "ELT": 12 }
};

let activeExam = {
  mockNumber: 1,
  questions: [],
  userAnswers: {},
  timeLeft: 150 * 60,
  timerInterval: null,
  currentIndex: 0
};

// Helper: In-place array shuffle
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateMockQuestions(mockNumber) {
  const finalOrderedExam = [];

  SECTION_ORDER.forEach(secConfig => {
    const secKey = secConfig.key;
    const quotaMap = TARGET_SUBTOPIC_QUOTAS[secKey] || {};
    const totalRequired = secConfig.count;
    let pool = MASTER_QUESTION_POOL.filter(q => q.section === secKey);

    let secPicked = [];

    // Special rule: Mocks 1, 2, and 3 use non-overlapping 60 questions for English Content
    if (secKey === "englishSubject" && mockNumber <= 3) {
      const start = (mockNumber - 1) * 60;
      secPicked = pool.slice(start, start + 60);
      secPicked.forEach(q => { q.usedCount = (q.usedCount || 0) + 1; });
    } else {
      const buckets = {};
      pool.forEach(q => {
        const top = q.topic || "General";
        if (!buckets[top]) buckets[top] = [];
        buckets[top].push(q);
      });

      for (const [topicName, needed] of Object.entries(quotaMap)) {
        let bucket = buckets[topicName] || [];
        bucket.sort((a, b) => (a.usedCount || 0) - (b.usedCount || 0) || Math.random() - 0.5);
        const items = bucket.slice(0, needed);
        items.forEach(q => {
          q.usedCount = (q.usedCount || 0) + 1;
          secPicked.push(q);
        });
      }

      if (secPicked.length < totalRequired) {
        const remainingNeeded = totalRequired - secPicked.length;
        const unselected = pool.filter(q => !secPicked.includes(q));
        unselected.sort((a, b) => (a.usedCount || 0) - (b.usedCount || 0) || Math.random() - 0.5);
        unselected.slice(0, remainingNeeded).forEach(q => {
          q.usedCount = (q.usedCount || 0) + 1;
          secPicked.push(q);
        });
      }
    }

    // Shuffle only inside this specific section block
    shuffleArray(secPicked);
    finalOrderedExam.push(...secPicked);
  });

  return finalOrderedExam;
}

function showPortal() {
  clearInterval(activeExam.timerInterval);
  document.getElementById("examMeta").style.display = "none";
  document.getElementById("progressBar").style.display = "none";
  document.getElementById("headerTitle").innerText = "APTET PRACTICE EXAMINATION PORTAL";

  document.getElementById("appContainer").innerHTML = `
    <div class="card portal-welcome">
      <h2>APTET Examination Portal</h2>
      <p style="color: var(--text-muted); margin-bottom: 20px;">
        150 Questions &bull; 150 Marks &bull; 150 Minutes<br>
        Full Section-Switching enabled during the test.
      </p>

      <div class="mock-buttons-grid">
        <button class="btn-next" onclick="startMock(1)">Start Mock 1</button>
        <button class="btn-next" onclick="startMock(2)">Start Mock 2</button>
        <button class="btn-next" onclick="startMock(3)">Start Mock 3</button>
        <button class="btn-prev" onclick="startMock(Math.floor(4 + Math.random() * 50))">Random Mock</button>
      </div>

      <div style="font-size: 0.9rem; color: #334155; background: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid var(--border); text-align: left; margin-top: 16px;">
        <strong>Section Switching Highlights:</strong>
        <ul style="margin-left: 20px; margin-top: 8px; line-height: 1.8;">
          <li>Switch between <strong>Telugu</strong>, <strong>CDP</strong>, <strong>English-II</strong>, and <strong>English Content</strong> anytime.</li>
          <li>Click any question number in the palette to navigate directly.</li>
          <li>Answered questions will turn green automatically.</li>
        </ul>
      </div>
    </div>
  `;
}

function startMock(num) {
  activeExam.mockNumber = num;
  activeExam.questions = generateMockQuestions(num);
  activeExam.userAnswers = {};
  activeExam.timeLeft = 150 * 60;
  activeExam.currentIndex = 0;

  document.getElementById("headerTitle").innerText = "APTET MOCK TEST - 150 MARKS";
  document.getElementById("activeMockName").innerText = `Mock ${num}`;
  document.getElementById("examMeta").style.display = "flex";
  document.getElementById("progressBar").style.display = "block";

  startTimer();
  renderQuestion();
}

function startTimer() {
  clearInterval(activeExam.timerInterval);
  updateTimerUI();
  activeExam.timerInterval = setInterval(() => {
    activeExam.timeLeft--;
    updateTimerUI();
    if (activeExam.timeLeft <= 0) {
      clearInterval(activeExam.timerInterval);
      alert("Exam time has expired! Submitting responses.");
      finalizeSubmission();
    }
  }, 1000);
}

function updateTimerUI() {
  const h = String(Math.floor(activeExam.timeLeft / 3600)).padStart(2, '0');
  const m = String(Math.floor((activeExam.timeLeft % 3600) / 60)).padStart(2, '0');
  const s = String(activeExam.timeLeft % 60).padStart(2, '0');
  document.getElementById("timerDisplay").innerText = `${h}:${m}:${s}`;
}

// Identify active section object by question index
function getCurrentSectionConfig(idx) {
  return SECTION_ORDER.find(sec => idx >= sec.startIndex && idx <= sec.endIndex) || SECTION_ORDER[0];
}

// Jump directly to a question
function jumpToQuestion(idx) {
  if (idx >= 0 && idx < activeExam.questions.length) {
    activeExam.currentIndex = idx;
    renderQuestion();
  }
}

// Switch directly to the first question of a subject
function switchToSection(secKey) {
  const sec = SECTION_ORDER.find(s => s.key === secKey);
  if (sec) {
    jumpToQuestion(sec.startIndex);
  }
}

function renderQuestion() {
  const q = activeExam.questions[activeExam.currentIndex];
  const answered = activeExam.userAnswers[activeExam.currentIndex];
  const total = activeExam.questions.length;
  const qNum = activeExam.currentIndex + 1;
  const currentSec = getCurrentSectionConfig(activeExam.currentIndex);

  document.getElementById("progressFill").style.width = `${(qNum / total) * 100}%`;

  // Render: 1) Section Navigation Tabs, 2) Section Question Palette, 3) Question Card
  document.getElementById("appContainer").innerHTML = `
    <!-- Top Section Switching Bar -->
    <div class="section-tabs-bar">
      ${SECTION_ORDER.map(sec => `
        <button 
          class="sec-tab-btn ${currentSec.key === sec.key ? 'active-sec' : ''}" 
          onclick="switchToSection('${sec.key}')">
          ${sec.title} (${sec.startIndex + 1}–${sec.endIndex + 1})
        </button>
      `).join('')}
    </div>

    <!-- Active Section Question Palette -->
    <div class="palette-container">
      <div class="palette-header">
        <span>${currentSec.title} Questions:</span>
        <span>Green = Answered | Grey = Not Answered</span>
      </div>
      <div class="palette-grid">
        ${Array.from({ length: currentSec.count }, (_, i) => {
          const globalIdx = currentSec.startIndex + i;
          const isAns = activeExam.userAnswers[globalIdx] !== undefined;
          const isCurr = globalIdx === activeExam.currentIndex;
          return `
            <button 
              class="palette-num-btn ${isAns ? 'p-answered' : ''} ${isCurr ? 'p-current' : ''}" 
              onclick="jumpToQuestion(${globalIdx})">
              ${globalIdx + 1}
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Question Card -->
    <div class="card">
      <div class="q-meta">
        <span class="badge">${getSectionTitle(q.section)} &bull; ${q.topic}</span>
        <span class="q-title">Question ${qNum} of ${total}</span>
      </div>

      <div class="q-text">${escapeHtml(q.question)}</div>

      <div class="options-grid">
        ${q.options.map((opt, idx) => `
          <div class="option-label ${answered === idx ? 'selected' : ''}" onclick="selectAnswer(${idx})">
            <span class="opt-key">${['A','B','C','D'][idx]}.</span>
            <span class="opt-desc">${escapeHtml(opt)}</span>
          </div>
        `).join('')}
      </div>

      <div class="actions">
        <div>
          <button class="btn-prev" onclick="prevQ()" ${activeExam.currentIndex === 0 ? 'disabled' : ''}>Previous</button>
          <button class="btn-clear" onclick="clearAns()" ${answered === undefined ? 'disabled' : ''}>Clear</button>
        </div>
        <div>
          ${activeExam.currentIndex === total - 1
            ? `<button class="btn-submit" onclick="openModal()">Submit Exam</button>`
            : `<button class="btn-next" onclick="nextQ()">Next</button>`}
        </div>
      </div>
    </div>
  `;
}

function selectAnswer(idx) {
  activeExam.userAnswers[activeExam.currentIndex] = idx;
  renderQuestion();
}

function clearAns() {
  delete activeExam.userAnswers[activeExam.currentIndex];
  renderQuestion();
}

function prevQ() {
  if (activeExam.currentIndex > 0) {
    activeExam.currentIndex--;
    renderQuestion();
  }
}

function nextQ() {
  if (activeExam.currentIndex < activeExam.questions.length - 1) {
    activeExam.currentIndex++;
    renderQuestion();
  }
}

function openModal() {
  const count = Object.keys(activeExam.userAnswers).length;
  const total = activeExam.questions.length;
  document.getElementById("modalPrompt").innerText = `You have answered ${count} out of ${total} questions. Are you ready to submit?`;
  document.getElementById("confirmModal").style.display = "grid";
}

function closeModal() {
  document.getElementById("confirmModal").style.display = "none";
}

function finalizeSubmission() {
  closeModal();
  clearInterval(activeExam.timerInterval);
  document.getElementById("examMeta").style.display = "none";
  document.getElementById("progressBar").style.display = "none";

  let correct = 0, wrong = 0, unanswered = 0;
  const sectionScores = {
    teluguLanguage1: { correct: 0, total: 30, title: "Telugu Language-I" },
    cdp: { correct: 0, total: 30, title: "CDP" },
    englishLanguage2: { correct: 0, total: 30, title: "English Language-II" },
    englishSubject: { correct: 0, total: 60, title: "English Content" }
  };

  activeExam.questions.forEach((q, idx) => {
    const ans = activeExam.userAnswers[idx];
    if (ans === undefined) {
      unanswered++;
    } else if (ans === q.correctOptionIndex) {
      correct++;
      sectionScores[q.section].correct++;
    } else {
      wrong++;
    }
  });

  const total = activeExam.questions.length;
  const pct = ((correct / total) * 100).toFixed(2);

  document.getElementById("appContainer").innerHTML = `
    <div class="card" style="text-align: center; margin-bottom: 24px;">
      <h2>Mock Test Evaluation</h2>
      <div style="font-size: 2.2rem; font-weight: 800; color: var(--success); margin: 12px 0;">
        ${correct} / ${total}
      </div>
      <p style="font-weight: 600; color: #166534; margin-bottom: 16px;">Percentage: ${pct}%</p>
      
      <!-- Section-wise Score Breakdown -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; text-align: left;">
        <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
          <strong>Telugu Language-I (Q1-30):</strong> ${sectionScores.teluguLanguage1.correct} / 30
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
          <strong>CDP (Q31-60):</strong> ${sectionScores.cdp.correct} / 30
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
          <strong>English Language-II (Q61-90):</strong> ${sectionScores.englishLanguage2.correct} / 30
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
          <strong>English Content (Q91-150):</strong> ${sectionScores.englishSubject.correct} / 60
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 24px; font-weight: 600;">
        <span style="color: var(--success);">&check; Correct: ${correct}</span>
        <span style="color: var(--danger);">&cross; Wrong: ${wrong}</span>
        <span style="color: var(--text-muted);">&minus; Unanswered: ${unanswered}</span>
      </div>
      <div style="margin-top: 20px;">
        <button class="btn-next" onclick="showPortal()">Return to Main Portal</button>
      </div>
    </div>

    <h3 style="margin-bottom: 16px; color: var(--primary);">Review Questions & Official Answer Key</h3>
    <div>
      ${activeExam.questions.map((q, idx) => {
        const userChoice = activeExam.userAnswers[idx];
        const isCorrect = userChoice === q.correctOptionIndex;
        const isAns = userChoice !== undefined;

        let statusClass = isAns ? (isCorrect ? 'correct' : 'wrong') : 'unanswered';
        let statusTag = isAns 
          ? (isCorrect ? '<span class="status-tag tag-correct">&check; Correct</span>' : '<span class="status-tag tag-wrong">&cross; Incorrect</span>') 
          : '<span class="status-tag tag-unanswered">&minus; Unanswered</span>';

        return `
          <div class="card review-box ${statusClass}">
            <div style="display: flex; justify-content: space-between;">
              ${statusTag}
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">Q${idx + 1} &bull; ${getSectionTitle(q.section)}</span>
            </div>
            <div style="font-weight: 600; margin: 8px 0 12px 0; color: #1e293b;">${escapeHtml(q.question)}</div>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
              ${q.options.map((opt, oIdx) => {
                let border = "border: 1px solid var(--border);";
                if (oIdx === q.correctOptionIndex) border = "border: 1px solid var(--success); background: #f0fdf4; font-weight: 600;";
                if (isAns && oIdx === userChoice && !isCorrect) border = "border: 1px solid var(--danger); background: #fef2f2;";
                return `<div style="padding: 10px 14px; border-radius: 4px; font-size: 0.95rem; ${border}">
                  ${['A','B','C','D'][oIdx]}. ${escapeHtml(opt)}
                  ${oIdx === q.correctOptionIndex ? ' (Correct Answer)' : ''}
                  ${isAns && oIdx === userChoice && !isCorrect ? ' (Your Answer)' : ''}
                </div>`;
              }).join('')}
            </div>
            <div class="footnote">
              Source Authority: <strong>${q.sourcePDF}</strong> | Page: ${q.sourcePage} \vert{} Question ID:${q.id} (PDF Q#${q.sourceQuestionNumber})
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getSectionTitle(sec) {
  switch (sec) {
    case "teluguLanguage1": return "Telugu Language-I";
    case "cdp": return "CDP";
    case "englishLanguage2": return "English Language-II";
    case "englishSubject": return "English Content";
    default: return sec;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

window.addEventListener("DOMContentLoaded", () => {
  showPortal();
});