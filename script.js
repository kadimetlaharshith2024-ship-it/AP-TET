// Consolidate question pools
const MASTER_QUESTION_POOL = [
  ...(typeof ENGLISH_SUBJECT_POOL !== 'undefined' ? ENGLISH_SUBJECT_POOL : []),
  ...(typeof CDP_POOL !== 'undefined' ? CDP_POOL : []),
  ...(typeof TELUGU_POOL !== 'undefined' ? TELUGU_POOL : []),
  ...(typeof ENGLISH_L2_POOL !== 'undefined' ? ENGLISH_L2_POOL : [])
];

console.log("Total Questions Loaded into Master Pool:", MASTER_QUESTION_POOL.length);

// Subject configurations: question count and duration in minutes
const SUBJECT_CONFIG = {
  all: { title: "Full Mock Test (All Subjects)", count: 150, timeMinutes: 150 },
  englishSubject: { title: "English Content", count: 60, timeMinutes: 60 },
  cdp: { title: "Child Development & Pedagogy (CDP)", count: 30, timeMinutes: 30 },
  teluguLanguage1: { title: "Telugu Language-I", count: 30, timeMinutes: 30 },
  englishLanguage2: { title: "English Language-II", count: 30, timeMinutes: 30 }
};

const TARGET_SUBTOPIC_QUOTAS = {
  englishSubject: { "Vocabulary": 12, "Grammar": 18, "Reading": 6, "Literature": 12, "ELT": 12 },
  englishLanguage2: { "Vocabulary": 8, "Grammar": 12, "Language Functions": 5, "Reading": 5 },
  teluguLanguage1: { "Literature": 7, "Comprehension": 6, "Grammar": 8, "Vocabulary": 5, "Language Usage": 4 },
  cdp: { "Growth & Development": 4, "Developmental Theories": 5, "Childhood & Adolescence": 3, "Intelligence & Aptitude": 4, "Learning Theories": 5, "Personality & Assessment": 3, "Guidance & Mental Health": 3, "Education Policies": 3 }
};

let activeExam = {
  mode: "all",           // "all" or specific subject key
  mockNumber: 1,
  questions: [],
  userAnswers: {},
  timeLeft: 150 * 60,
  timerInterval: null,
  currentIndex: 0
};

function generateMockQuestions(mode, mockNumber) {
  const chosen = [];
  const sectionsToInclude = mode === "all" 
    ? ["englishSubject", "cdp", "teluguLanguage1", "englishLanguage2"] 
    : [mode];

  sectionsToInclude.forEach(sec => {
    const quotaMap = TARGET_SUBTOPIC_QUOTAS[sec] || {};
    const totalRequired = SUBJECT_CONFIG[sec].count;
    let pool = MASTER_QUESTION_POOL.filter(q => q.section === sec);

    // Rule: Mocks 1 to 3 guarantee zero repetition for English Subject
    if (sec === "englishSubject" && mockNumber <= 3) {
      const start = (mockNumber - 1) * 60;
      const subSelection = pool.slice(start, start + 60);
      subSelection.forEach(q => {
        q.usedCount = (q.usedCount || 0) + 1;
        chosen.push(q);
      });
      return;
    }

    // Partition pool into topic buckets
    const buckets = {};
    pool.forEach(q => {
      const top = q.topic || "General";
      if (!buckets[top]) buckets[top] = [];
      buckets[top].push(q);
    });

    let secPicked = [];
    for (const [topicName, needed] of Object.entries(quotaMap)) {
      let bucket = buckets[topicName] || [];
      bucket.sort((a, b) => (a.usedCount || 0) - (b.usedCount || 0) || Math.random() - 0.5);
      const items = bucket.slice(0, needed);
      items.forEach(q => {
        q.usedCount = (q.usedCount || 0) + 1;
        secPicked.push(q);
      });
    }

    // Fill remaining items if topic quotas do not meet section target
    if (secPicked.length < totalRequired) {
      const remainingNeeded = totalRequired - secPicked.length;
      const unselected = pool.filter(q => !secPicked.includes(q));
      unselected.sort((a, b) => (a.usedCount || 0) - (b.usedCount || 0) || Math.random() - 0.5);
      unselected.slice(0, remainingNeeded).forEach(q => {
        q.usedCount = (q.usedCount || 0) + 1;
        secPicked.push(q);
      });
    }

    chosen.push(...secPicked);
  });

  // Fisher-Yates shuffle across the selected items
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen;
}

function showPortal() {
  clearInterval(activeExam.timerInterval);
  document.getElementById("examMeta").style.display = "none";
  document.getElementById("progressBar").style.display = "none";
  document.getElementById("headerTitle").innerText = "APTET PRACTICE EXAMINATION PORTAL";

  document.getElementById("appContainer").innerHTML = `
    <div class="card portal-welcome">
      <h2>APTET Examination Portal</h2>
      <p style="color: var(--text-muted); margin-bottom: 24px;">
        Choose full comprehensive mock tests or subject-wise practice tests.
      </p>

      <h3 style="text-align: left; color: var(--primary); margin-bottom: 12px; font-size: 1rem; border-bottom: 2px solid var(--border); padding-bottom: 6px;">
        1. Full 150-Mark Mock Exams (150 Mins)
      </h3>
      <div class="mock-buttons-grid" style="margin-bottom: 28px;">
        <button class="btn-next" onclick="startMock('all', 1)">Full Mock 1</button>
        <button class="btn-next" onclick="startMock('all', 2)">Full Mock 2</button>
        <button class="btn-next" onclick="startMock('all', 3)">Full Mock 3</button>
        <button class="btn-prev" onclick="startMock('all', Math.floor(4 + Math.random() * 50))">Random Full Mock</button>
      </div>

      <h3 style="text-align: left; color: var(--secondary); margin-bottom: 12px; font-size: 1rem; border-bottom: 2px solid var(--border); padding-bottom: 6px;">
        2. Subject-Wise Practice Tests
      </h3>
      <div class="mock-buttons-grid">
        <button class="btn-subject" onclick="startMock('englishSubject', 1)">
          <strong>English Content</strong><br><small>60 Qs &bull; 60 Mins</small>
        </button>
        <button class="btn-subject" onclick="startMock('cdp', 1)">
          <strong>CDP (Psychology)</strong><br><small>30 Qs &bull; 30 Mins</small>
        </button>
        <button class="btn-subject" onclick="startMock('teluguLanguage1', 1)">
          <strong>Telugu Language-I</strong><br><small>30 Qs &bull; 30 Mins</small>
        </button>
        <button class="btn-subject" onclick="startMock('englishLanguage2', 1)">
          <strong>English Language-II</strong><br><small>30 Qs &bull; 30 Mins</small>
        </button>
      </div>
    </div>
  `;
}

function startMock(mode, num) {
  const cfg = SUBJECT_CONFIG[mode];
  activeExam.mode = mode;
  activeExam.mockNumber = num;
  activeExam.questions = generateMockQuestions(mode, num);
  activeExam.userAnswers = {};
  activeExam.timeLeft = cfg.timeMinutes * 60;
  activeExam.currentIndex = 0;

  document.getElementById("headerTitle").innerText = cfg.title.toUpperCase();
  document.getElementById("activeMockName").innerText = mode === "all" ? `Mock ${num}` : cfg.title;
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
      alert("Exam time has expired! Auto-submitting.");
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

function renderQuestion() {
  const q = activeExam.questions[activeExam.currentIndex];
  const answered = activeExam.userAnswers[activeExam.currentIndex];
  const total = activeExam.questions.length;

  document.getElementById("progressFill").style.width = `${((activeExam.currentIndex + 1) / total) * 100}%`;

  document.getElementById("appContainer").innerHTML = `
    <div class="card">
      <div class="q-meta">
        <span class="badge">${getSectionTitle(q.section)} &bull; ${q.topic}</span>
        <span class="q-title">Question ${activeExam.currentIndex + 1} of ${total}</span>
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
  activeExam.questions.forEach((q, idx) => {
    const ans = activeExam.userAnswers[idx];
    if (ans === undefined) unanswered++;
    else if (ans === q.correctOptionIndex) correct++;
    else wrong++;
  });

  const total = activeExam.questions.length;
  const pct = ((correct / total) * 100).toFixed(2);

  document.getElementById("appContainer").innerHTML = `
    <div class="card" style="text-align: center; margin-bottom: 24px;">
      <h2>Exam Results: ${SUBJECT_CONFIG[activeExam.mode].title}</h2>
      <div style="font-size: 2.2rem; font-weight: 800; color: var(--success); margin: 12px 0;">
        ${correct} / ${total}
      </div>
      <p style="font-weight: 600; color: #166534;">Percentage: ${pct}%</p>
      <div style="display: flex; justify-content: center; gap: 24px; margin-top: 14px; font-weight: 600;">
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
        let statusTag = isAns ? (isCorrect ? '<span class="status-tag tag-correct">&check; Correct</span>' : '<span class="status-tag tag-wrong">&cross; Incorrect</span>') : '<span class="status-tag tag-unanswered">&minus; Unanswered</span>';

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
    case "englishSubject": return "English Content";
    case "cdp": return "CDP";
    case "teluguLanguage1": return "Telugu Language-I";
    case "englishLanguage2": return "English Language-II";
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