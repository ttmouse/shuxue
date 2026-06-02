/**
 * 数学口算大闯关 — 主应用逻辑
 */

// ============================================================
// 全局状态
// ============================================================
const state = {
    // 练习设置
    topics: ['add-sub', 'multiplication', 'division', 'mixed', 'decimal', 'fraction'],
    count: 20,
    difficulty: 'medium',

    // 当前练习
    questions: [],
    currentIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    startTime: null,
    topicStats: {},     // { type: { label, correct, total } }

    // 错题重练
    retryQuestions: [],
    retryIndex: 0,
    retryCorrectCount: 0,
    retryWrongCount: 0,
};

// ============================================================
// 鼓励 / 反馈语料
// ============================================================
const praiseMessages = [
    '太棒了！🎉', '完全正确！✨', '真厉害！💪',
    '继续加油！🌟', '答对啦！👏', '好聪明呀！🧠',
    '你真棒！🏆', '完美！💯', '太强了！🚀',
];

const encourageMessages = [
    '加油，再想想！💪', '别灰心，继续努力！🌟',
    '差一点点，仔细算算！🤔', '没关系，下次一定行！🌈',
    '仔细检查一下计算过程！📝',
];

const celebrationEmojis = ['🎉', '🎊', '✨', '💫', '🌟', '⭐', '🏆', '👏', '💯', '🚀'];

// 防冲撞：提交答案后短暂屏蔽键盘快捷翻题
let justSubmitted = false;

// ============================================================
// UI 辅助函数
// ============================================================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    // 更新 URL hash
    const hashMap = {
        'page-home': '#/practice',
        'page-settings': '#/practice/settings',
        'page-practice': '#/practice/play',
        // 'page-result' — 已内联到答题页，不单独使用
        'page-wrongbook': '#/wrongbook',
        'page-retry': '#/practice/retry',
    };
    if (hashMap[pageId] && location.hash !== hashMap[pageId]) {
        location.hash = hashMap[pageId];
    }

    // 如果显示首页，更新统计
    if (pageId === 'page-home') {
        updateHomeStats();
    }
    // 如果显示错题本，刷新列表
    if (pageId === 'page-wrongbook') {
        renderWrongBook();
    }
}

function $(id) { return document.getElementById(id); }

/** 高亮题面中的加减乘除运算符 */
function highlightOperators(text) {
  return text.replace(/([+\−×÷])/g, '<span class="q-op">$1</span>');
}

// ============================================================
// 设置页
// ============================================================

// 渲染知识点选择界面
let selectedGrade = localStorage.getItem('practice_grade') || '3年级';

function switchGrade(grade) {
    selectedGrade = grade;
    localStorage.setItem('practice_grade', grade);
    renderTopicSelect();
}

/** 知识点对应的题目数量/难度配置（每个知识点独立） */
const topicPrefs = {};

let expandedTopic = null;

function renderTopicSelect() {
    const container = document.getElementById('topic-select');
    if (!container) return;
    const grades = Knowledge.getGrades();

    const current = grades.find(g => g.grade === selectedGrade);
    let html = '';
    if (current) {
        const allTopics = [...current.topics, { id: '__mixed__', label: current.grade + '总复习', desc: '混合当前年级所有题型', subtopics: [{ id: '__mixed__', label: '开始答题', desc: '随机所有题型' }] }];

        allTopics.forEach(t => {
            const hasSubs = t.subtopics && t.subtopics.length > 0;
            const prefs = topicPrefs[expandedTopic] || { count: 20 };



            html += '<div class="topic-card">';
            html += '<div class="topic-item"><div class="topic-item-content"><div class="topic-label">' + t.label + '</div></div></div>';
            if (hasSubs) {
                    html += '<div class="topic-subs">';
                    t.subtopics.forEach(sub => {
                        const isSel = expandedTopic === sub.id;
                        html += '<div class="topic-sub' + (isSel ? ' expanded' : '') + '" data-sub="' + sub.id + '"><div class="topic-sub-content"><div class="topic-sub-label">' + sub.label + '</div><div class="topic-sub-desc">' + sub.desc + '</div></div><span class="topic-sub-arrow">' + (isSel ? '−' : '+') + '</span></div>';
                        if (isSel) {
                            html += '<div class="topic-config">';
                            html += '<div class="expand-label">题目数量</div>';
                            html += '<div class="tc-row">';
                            [10, 20, 30, 60, 100].forEach(n => {
                                html += '<button class="tc-count' + (prefs.count === n ? ' active' : '') + '" data-count="' + n + '">' + n + '</button>';
                            });
                            html += '</div>';
                            html += '<div class="action-row">';
                            html += '<button class="tc-start">开始练习</button>';
                            html += '</div>';
                            html += '</div>';
                        }
                    });
                    if (t.id !== '__mixed__') {
                    const isMix = expandedTopic === '__mix-' + t.id + '__';
                    html += '<div class="topic-sub' + (isMix ? ' expanded' : '') + '" data-sub="__mix-' + t.id + '__"><div class="topic-sub-content"><div class="topic-sub-label">单元练习</div><div class="topic-sub-desc">混合全部</div></div><span class="topic-sub-arrow">' + (isMix ? '−' : '+') + '</span></div>';
                    if (isMix) {
                        html += '<div class="topic-config">';
                        html += '<div class="expand-label">题目数量</div>';
                        html += '<div class="tc-row">';
                        [10, 20, 30, 60, 100].forEach(n => {
                            html += '<button class="tc-count' + (prefs.count === n ? ' active' : '') + '" data-count="' + n + '">' + n + '</button>';
                        });
                        html += '</div>';
                        html += '<div class="action-row">';
                        html += '<button class="tc-start">开始练习</button>';
                        html += '</div>';
                        html += '</div>';
                    }
                    }
                    html += '</div>'; // topic-subs
                } else {
                    const isSubOpen = expandedTopic === t.id;
                    html += '<div class="topic-subs">';
                    html += '<div class="topic-sub' + (isSubOpen ? ' expanded' : '') + '" data-sub="' + t.id + '"><div class="topic-sub-content"><div class="topic-sub-label">' + t.label + '</div><div class="topic-sub-desc">' + t.desc + '</div></div><span class="topic-sub-arrow">' + (isSubOpen ? '−' : '+') + '</span></div>';
                    if (isSubOpen) {
                        html += '<div class="topic-config">';
                        html += '<div class="expand-label">题目数量</div>';
                        html += '<div class="tc-row">';
                        [10, 20, 30, 60, 100].forEach(n => {
                            html += '<button class="tc-count' + (prefs.count === n ? ' active' : '') + '" data-count="' + n + '">' + n + '</button>';
                        });
                        html += '</div>';
                        html += '<div class="action-row">';
                        html += '<button class="tc-start">开始练习</button>';
                        html += '</div>';
                        html += '</div>';
                    }
                    html += '</div>';
                }
            html += '</div>';
        });
    }

    container.innerHTML = html;

    // 点击子维度展开/折叠
    container.querySelectorAll('.topic-sub').forEach(sub => {
        sub.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = sub.dataset.sub;
            expandedTopic = expandedTopic === id ? null : id;
            renderTopicSelect();
        });
    });

    // 题数选择
    container.querySelectorAll('.tc-count').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!topicPrefs[expandedTopic]) topicPrefs[expandedTopic] = { count: 20 };
            topicPrefs[expandedTopic].count = parseInt(btn.dataset.count);
            renderTopicSelect();
        });
    });

    // 开始答题
    container.querySelectorAll('.tc-start').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prefs = topicPrefs[expandedTopic] || { count: 20 };
            state.count = prefs.count;
            if (expandedTopic && expandedTopic.startsWith('__mix-') && expandedTopic.endsWith('__')) {
                const parentId = expandedTopic.replace('__mix-', '').replace('__', '');
                state.topics = parentId ? Knowledge.getSubTopicIds(parentId) : [expandedTopic];
            } else if (expandedTopic === '__mixed__') {
                state.topics = Knowledge.getGradeTopicIds(selectedGrade)
                    .map(t => Knowledge.getSubTopicIds(t).length ? Knowledge.getSubTopicIds(t) : [t]).flat();
            } else {
                state.topics = [expandedTopic];
            }
            startPractice();
        });
    });

    const sel = document.getElementById('grade-select');
    if (sel) sel.value = selectedGrade;
}

renderTopicSelect();

// ============================================================
// 开始练习
// ============================================================

const TOPIC_ALIAS = {
    'add-easy': 'add-sub', 'multi-hard': 'multiplication',
    'double-paren': 'mixed', 'decimal-addsub': 'decimal', 'fraction-addsub': 'fraction',
};

function startPractice() {
    if (state.topics && state.topics.length > 0 && state.count) {
        // 已从 topic-card 设好，映射到生成器 ID
        state.topics = [...new Set(state.topics.map(t => TOPIC_ALIAS[t] || t))];
    } else {
        state.topics = ['add-sub'];
        state.count = 20;
    }
    state.difficulty = state.difficulty || 'medium';

    // 生成题目
    const { questions } = QuestionGenerator.generateSet(state.topics, state.count, state.difficulty);
    state.questions = questions;
    state.currentIndex = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.startTime = Date.now();
    state.topicStats = {};

    // 显示答题页
    showPage('page-practice');
    renderQuestion();
}

// ============================================================
// 答题流程
// ============================================================

function renderQuestion() {
    const idx = state.currentIndex;
    const total = state.questions.length;
    const q = state.questions[idx];

    $('c-correct').textContent = state.correctCount;
    $('c-wrong').textContent = state.wrongCount;
    $('c-progress').style.width = `${(idx / total) * 100}%`;
    $('c-step').textContent = `${idx + 1}/${total}`;

    $('c-law').textContent = `第 ${idx + 1} 题 · ${q.typeLabel}`;
    $('c-question').innerHTML = highlightOperators(q.question);

    // 恢复确定键
    const sb = $('prac-submit');
    if (sb) sb.textContent = '确定';

    // 重置输入
    pracResetInput();

    // 绑定提示按钮
    const hintBtn = $('prac-hint');
    if (hintBtn) {
        hintBtn.onclick = () => showHint(q);
    }

    // 比大小题型显示比较符号键盘行
    const cmpRow = document.querySelector('.c-pr-cmp');
    if (cmpRow) {
        cmpRow.style.display = q.type === 'dec-compare' ? '' : 'none';
    }

    // 隐藏反馈和结果
    $('c-fb').style.display = 'none';
    $('c-result').style.display = 'none';
    $('c-input-text').className = 'c-play-input-text';
}

function submitAnswer() {
    const userAnswer = pracInput.trim();
    const display = $('c-input-text');

    if (userAnswer === '') {
        if (display) { display.textContent = '请输入答案！'; display.className = 'c-play-input-text err'; }
        setTimeout(() => { if (display) { display.textContent = pracInput; display.className = 'c-play-input-text'; } }, 1200);
        return;
    }

    const idx = state.currentIndex;
    const q = state.questions?.[idx];
    if (!q) return;
    const correctAnswer = q.answer.trim();

    // 判断答案
    const isCorrect = compareAnswers(userAnswer, correctAnswer);

    // 禁用键盘
    const kp = $('prac-keypad');
    if (kp) kp.style.pointerEvents = 'none';

    // 防冲撞：当前回车已经用于提交，屏蔽键盘翻题 200ms
    justSubmitted = true;
    setTimeout(() => { justSubmitted = false; }, 200);

    // 记录题型统计
    const typeKey = q.type || 'unknown';
    if (!state.topicStats[typeKey]) {
        state.topicStats[typeKey] = { label: q.typeLabel || typeKey, correct: 0, total: 0 };
    }
    state.topicStats[typeKey].total++;

    if (isCorrect) {
        state.correctCount++;
        state.topicStats[typeKey].correct++;
        console.log('submitAnswer CORRECT', {correctCount: state.correctCount, wrongCount: state.wrongCount, idx});
        const qt = $('c-question');
        if (qt) { qt.innerHTML = highlightOperators(q.question).replace('?', `<span class="c-play-ok">${userAnswer}</span> <span style="color:var(--primary);font-size:18px;"> ✓</span>`); }
        if (Framework.sound) Framework.sound.playCorrect();
        setTimeout(() => nextQuestion(), 500);
        $('c-correct').textContent = state.correctCount;
        $('c-wrong').textContent = state.wrongCount;
        return;
    }

    // 答错：标红 + 自动跳转
    state.wrongCount++;
    console.log('submitAnswer WRONG', {correctCount: state.correctCount, wrongCount: state.wrongCount, idx});
    const qt = $('c-question');
    if (qt) { qt.innerHTML = highlightOperators(q.question).replace('?', `<span class="c-play-no">${userAnswer}</span>`); }
    if (Framework.sound) Framework.sound.playWrong();
    WrongBook.add({
        question: q.question,
        correctAnswer: q.answer,
        userAnswer: userAnswer,
        type: q.type,
        typeLabel: q.typeLabel,
    });
    setTimeout(() => nextQuestion(), 600);

    $('c-correct').textContent = state.correctCount;
    $('c-wrong').textContent = state.wrongCount;
}

function compareAnswers(user, correct) {
    // 统一符号（自定义键盘用的是 Unicode 减号）
    user = user.trim().replace(/−/g, '-');
    correct = correct.trim().replace(/−/g, '-');

    // 直接字符串比较
    if (user === correct) return true;

    // 数字比较（处理小数差）
    const uNum = parseFloat(user);
    const cNum = parseFloat(correct);
    if (!isNaN(uNum) && !isNaN(cNum)) {
        // 整数答案比较
        if (Number.isInteger(cNum) && Number.isInteger(uNum)) {
            return uNum === cNum;
        }
        // 浮点数比较：允许微小误差
        if (Math.abs(uNum - cNum) < 0.001) {
            return true;
        }
    }

    // 分数比较：尝试计算数值
    const fracToNum = (s) => {
        const parts = s.split('/');
        if (parts.length === 2) {
            const n = parseFloat(parts[0]), d = parseFloat(parts[1]);
            if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
        }
        return NaN;
    };
    const uFrac = fracToNum(user);
    const cFrac = fracToNum(correct);
    if (!isNaN(uFrac) && !isNaN(cFrac) && Math.abs(uFrac - cFrac) < 0.001) {
        return true;
    }

    return false;
}

function showFeedback(result, q, userAnswer) {
    const area = $('c-fb');
    const icon = $('c-fb-icon');
    const text = $('c-fb-title');
    const detail = $('c-fb-bd');

    // 隐藏键盘，用反馈替换其位置
    const kp = $('prac-keypad');
    if (kp) kp.style.display = 'none';

    area.className = 'c-fb show ' + result;

    if (result === 'correct') {
        icon.textContent = '✅';
        text.textContent = pickRandom(praiseMessages);
        detail.textContent = `${q.question.replace('?', q.answer)}，你答对了！`;

        // 小庆祝动画（答对较多时触发）
        if (state.correctCount > 0 && state.correctCount % 5 === 0) {
            launchCelebration();
        }
        // 答对时也显示巧算方法
        if (q.tip) {
            detail.innerHTML += `<br><span style="font-size:13px;color:#8B5CF6;">✨ 巧算方法：${q.tip.replace('💡 ', '')}</span>`;
        }
        // 混合运算解题步骤（答对也展示，巩固理解）
        if (q.steps && Array.isArray(q.steps)) {
            detail.innerHTML += '<br><div style="margin-top:10px;text-align:left;background:#ECFDF5;border-radius:8px;padding:10px 14px;border:1px solid #D1FAE5;">';
            q.steps.forEach((step, i) => {
                detail.innerHTML += `<div style="font-size:14px;color:var(--text);padding:3px 0;font-family:var(--font-display);font-weight:600;">步骤${i + 1}：${step}</div>`;
            });
            detail.innerHTML += '</div>';
        }
    } else {
        icon.textContent = '😅';
        text.textContent = pickRandom(encourageMessages);
        detail.innerHTML = `
            你的答案：<span class="wrong-answer">${escapeHtml(userAnswer)}</span><br>
            正确答案：<span class="correct-answer">${escapeHtml(q.answer)}</span>
        `;

        // 题型专属提示
        if (q.type === 'fraction' && q.answer.includes('/')) {
            detail.innerHTML += '<br><span style="font-size:13px;color:#95A5A6;">💡 分数答案要写成最简形式哦！</span>';
        }
        if (q.type === 'decimal') {
            detail.innerHTML += '<br><span style="font-size:13px;color:#95A5A6;">💡 注意小数点的位置，末尾的 0 可以省略！</span>';
        }
        // 困难乘法巧算提示
        if (q.tip) {
            detail.innerHTML += `<br><span style="font-size:13px;color:#8B5CF6;">${q.tip}</span>`;
        }
        // 混合运算解题步骤
        if (q.steps && Array.isArray(q.steps)) {
            detail.innerHTML += '<br><div style="margin-top:10px;text-align:left;background:#fff;border-radius:8px;padding:10px 14px;border:1px solid var(--border-light);">';
            q.steps.forEach((step, i) => {
                detail.innerHTML += `<div style="font-size:14px;color:var(--text);padding:3px 0;font-family:var(--font-display);font-weight:600;">步骤${i + 1}：${step}</div>`;
            });
            detail.innerHTML += '</div>';
        }
    }

    // 下一题按钮文案
    const isLast = state.currentIndex >= state.questions.length - 1;
    $('c-fb-next').textContent = isLast ? '查看结果' : '下一题';
}

function showHint(q) {
    const area = $('c-fb');
    const icon = $('c-fb-icon');
    const text = $('c-fb-title');
    const detail = $('c-fb-bd');
    const nextBtn = $('c-fb-next');

    // 隐藏键盘，用反馈显示提示
    const kp = $('prac-keypad');
    if (kp) kp.style.display = 'none';
    const hintRow = document.querySelector('.prac-hint-row');
    if (hintRow) hintRow.style.display = 'none';

    area.style.display = 'block';
    area.className = 'c-fb show';
    area.style.background = 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)';
    area.style.border = '1px solid rgba(59, 130, 246, 0.2)';

    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>';
    text.textContent = '解题提示';

    if (q.tip) {
        detail.innerHTML = `<div style="font-size:14px;color:var(--text-secondary);line-height:1.6;">${q.tip}</div>`;
    } else if (q.steps && Array.isArray(q.steps)) {
        let stepHtml = '<div style="display:flex;flex-direction:column;gap:4px;">';
        q.steps.forEach((step, i) => {
            const color = i === q.steps.length - 1 ? 'var(--primary)' : 'var(--text-secondary)';
            stepHtml += `<div style="font-size:14px;color:${color};padding:3px 0;font-weight:600;">步骤${i + 1}：${step}</div>`;
        });
        stepHtml += '</div>';
        detail.innerHTML = stepHtml;
    } else {
        const ans = q.answer || '?';
        detail.innerHTML = `<div style="font-size:14px;color:var(--text-secondary);line-height:1.6;">正确答案：<span style="color:var(--primary);font-weight:700;font-size:18px;">${escapeHtml(ans)}</span></div>`;
    }

    nextBtn.textContent = '关闭';
    nextBtn.onclick = () => {
        area.style.display = 'none';
        area.style.background = '';
        area.style.border = '';
        if (kp) kp.style.display = '';
        if (hintRow) hintRow.style.display = '';
        nextBtn.textContent = '下一题';
        nextBtn.onclick = nextQuestion;
    };
}

function createNextBar() {
  const bar = document.createElement('div');
  bar.id = 'prac-next-bar';
  bar.className = 'prac-next-bar';
  bar.style.display = 'none';
  const isLast = state.currentIndex >= state.questions.length - 1;
  bar.innerHTML = `<button class="c-key c-key-go" onclick="nextQuestion()" style="flex:1;">${isLast ? '查看结果' : '下一题'}</button>`;
  const kp = $('c-keys');
  if (kp && kp.parentNode) kp.parentNode.insertBefore(bar, kp.nextSibling);
  return bar;
}

function nextQuestion() {
    if (Framework.sound) Framework.sound.playNext();
    state.currentIndex++;

    // 恢复键盘
    const kp = $('prac-keypad');
    if (kp) { kp.style.display = ''; kp.style.pointerEvents = ''; }
    const fb = $('c-fb');
    if (fb) fb.style.display = 'none';

    if (state.currentIndex >= state.questions.length) {
        showPracticeResult();
        return;
    }

    renderQuestion();
}

function quitPractice() {
    if (confirm('确定要退出吗？本次练习进度将不会保存。')) {
        if (typeof Framework !== 'undefined' && Framework.goHome) {
            Framework.goHome();
        } else {
            showPage('page-home');
        }
    }
}

// ============================================================
// 结果页
// ============================================================

function showPracticeResult() {
    const total = state.questions.length || state.currentIndex;
    const correct = state.correctCount;
    const wrong = state.wrongCount;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const timeStr = elapsed < 60 ? `${elapsed} 秒` : `${Math.floor(elapsed / 60)} 分 ${elapsed % 60} 秒`;
    console.log('showPracticeResult', {total, correct, wrong, rate, elapsed, questionsLen: state.questions.length, currentIndex: state.currentIndex});

    // 隐藏 play 区
    const keys = $('prac-keypad');
    if (keys) keys.style.display = 'none';
    const fb = $('c-fb');
    if (fb) fb.style.display = 'none';
    const core = document.querySelector('.c-play-core');
    if (core) core.style.display = 'none';
    const progressBar = document.querySelector('.c-play-progress');
    if (progressBar) progressBar.style.display = 'none';

    // 根据正确率给出不同反馈
    let iconEmoji, title;
    if (rate === 100) {
        iconEmoji = '🏆'; title = '满分！太厉害了！🎉';
        setTimeout(launchCelebration, 300);
    } else if (rate >= 90) {
        iconEmoji = '🌟'; title = '非常优秀！继续保持！';
    } else if (rate >= 80) {
        iconEmoji = '👍'; title = '表现不错！还可以更好！';
    } else if (rate >= 60) {
        iconEmoji = '💪'; title = '还需加油！多练练就好了！';
    } else {
        iconEmoji = '📚'; title = '要多练习哦！加油！';
    }

    $('c-result-icon').textContent = iconEmoji;
    $('c-result-title').textContent = title;
    $('c-result').style.display = 'flex';

    // 环形进度
    const ringFill = $('c-ring-fill');
    const ringPct = $('c-ring-pct');
    const circumference = 2 * Math.PI * 15.9;
    if (ringFill) {
        ringFill.style.strokeDasharray = circumference;
        ringFill.style.strokeDashoffset = circumference - (rate / 100) * circumference;
    }
    if (ringPct) ringPct.textContent = rate + '%';

    // 统计数据
    $('c-result-stats').innerHTML = `
        <div class="c-rs-row correct-row"><span>正确数</span><span>${correct}/${total}</span></div>
        <div class="c-rs-row"><span>错误数</span><span>${wrong}</span></div>
        <div class="c-rs-row streak-row"><span>用时</span><span>${timeStr}</span></div>
    `;

    // 各知识点正确率
    const catEntries = Object.entries(state.topicStats).filter(([_, s]) => s.total > 0);
    if (catEntries.length > 1) {
        const catHtml = '<div class="c-rc-title">知识点分析</div>' +
            catEntries.map(([id, s]) => {
                const pct = Math.round(s.correct / s.total * 100);
                const barColor = pct >= 80 ? 'var(--primary)' : pct >= 60 ? 'var(--orange)' : 'var(--red)';
                return `<div class="c-rc-row">
                    <span>${s.label}</span>
                    <div class="c-rc-bar"><div class="c-rc-fill" style="width:${pct}%;background:${barColor}"></div></div>
                    <span>${s.correct}/${s.total}</span>
                </div>`;
            }).join('');
        $('c-result-cats').innerHTML = catHtml;
        $('c-result-cats').style.display = '';
    }

    // 记录每日统计（包含各知识点数据）
    const practicedTopics = state.questions.map(q => q.type);
    Stats.recordPractice(total, correct, practicedTopics, state.difficulty, state.topicStats);

    // 移除#/practice/result hash切换，避免覆盖内联结果页

    if (typeof Sound !== 'undefined') Sound.playComplete();
    if (rate === 100) {
        setTimeout(launchCelebration, 400);
    }
}

// ============================================================
// 错题本
// ============================================================

function showWrongBook() {
    renderWrongBook();
    showPage('page-wrongbook');
}

// 从新模式首页/结果页跳转到错题本
function showGlobalWrongBook() {
    if (typeof Framework !== 'undefined' && Framework.hideAllViews) {
        Framework.hideAllViews();
    }
    showWrongBook();
    // 更新 URL 为错题本地址（不重复触发）
    if (typeof Framework !== 'undefined' && location.hash !== '#/wrongbook') {
        location.hash = '#/wrongbook';
    }
}

// 更新首页错题本计数 badge
function updateWbBadge() {
    const badge = $('home-wb-count');
    if (badge && typeof WrongBook !== 'undefined') {
        const count = WrongBook.getCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? '' : 'none';
    }
}

function renderWrongBook() {
    const list = $('wrongbook-list');
    const stats = $('wrongbook-stats');
    const filter = document.querySelector('.filter-btn.active')?.dataset?.filter || 'all';
    const items = WrongBook.getByType(filter);

    if (items.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:var(--s12) 0;color:var(--n300);font-size:15px;">暂无错题，继续加油！</td></tr>';
        stats.textContent = filter === 'all' ? '' : '该题型暂无错题';
        return;
    }

    const totalErrors = items.reduce((s, i) => s + (i.count || 1), 0);
    stats.textContent = `共 ${items.length} 道错题，累计错 ${totalErrors} 次`;

    // 按日期分组显示
    const groups = WrongBook.getGroupedByDate(items);
    let html = '';

    Object.keys(groups).sort().reverse().forEach(date => {
        html += `<tr class="wb-date-row"><td colspan="4">${date}</td></tr>`;
        groups[date].forEach(item => {
            const times = item.count || 1;
            const userAns = item.userAnswers?.join('、') || item.userAnswer || '';
            const countHtml = times > 1 ? times : '';
            html += `<tr>
                <td class="wi-q">${escapeHtml(item.question)}</td>
                <td class="wi-n">${countHtml}</td>
                <td class="wi-c">${item.correctAnswer}</td>
                <td class="wi-u">${userAns || ''}</td>
            </tr>`;
        });
    });

    document.getElementById('wrongbook-list').innerHTML = html;
}

function deleteWrongItem(id) {
    WrongBook.remove(id);
    renderWrongBook();
    // 更新首页统计
    updateHomeStats();
}

function clearWrongBook() {
    if (confirm('确定要清空所有错题吗？此操作不可恢复！')) {
        WrongBook.clear();
        renderWrongBook();
        updateHomeStats();
        updateWbBadge();
    }
}

function retryWrongQuestions() {
    const filter = document.querySelector('.filter-btn.active')?.dataset?.filter || 'all';
    let items = WrongBook.getRetryQuestions(20, filter);
    // 如果当前筛选下没有错题，但总错题数不为空，自动切回"全部"
    if (items.length === 0 && filter !== 'all' && WrongBook.getCount() > 0) {
        // 把筛选按钮重置为"全部"
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
        items = WrongBook.getRetryQuestions(20, 'all');
        renderWrongBook(); // 刷新错题本显示
    }
    if (items.length === 0) {
        alert('没有错题可以重练！先去完成一些练习吧 😊');
        return;
    }

    state.retryQuestions = items;
    state.retryIndex = 0;
    state.retryCorrectCount = 0;
    state.retryWrongCount = 0;

    showPage('page-retry');
    renderRetryQuestion();

    // 绑定反馈面板的下一题按钮
    const fbNext = $('retry-fb-next');
    if (fbNext) fbNext.onclick = nextRetryQuestion;

    // 绑定提交按钮（retry页的c-submit是第二个，不能用$直接取）
    const submitBtn = document.querySelector('#retry-keys #c-submit');
    if (submitBtn) submitBtn.onclick = submitRetryAnswer;
}

// ============================================================
// 错题重练
// ============================================================

function renderRetryQuestion() {
    const idx = state.retryIndex;
    const total = state.retryQuestions.length;
    const q = state.retryQuestions[idx];

    $('retry-progress-fill').style.width = `${(idx / total) * 100}%`;
    $('retry-step').textContent = `${idx + 1}/${total}`;
    $('retry-law').textContent = `错题重练 (${idx + 1}/${total})`;
    $('retry-correct').textContent = state.retryCorrectCount;
    $('retry-wrong').textContent = state.retryWrongCount;
    $('retry-question-text').innerHTML = typeof highlightOperators === 'function' ? highlightOperators(q.question) : q.question;

    // 重置键盘输入
    pracInput = '';
    const display = $('retry-input-text');
    if (display) display.textContent = '';
    const wrap = $('retry-input-wrap');
    if (wrap) wrap.classList.remove('has-val');

    $('retry-fb').style.display = 'none';
}

function submitRetryAnswer() {
    const userAnswer = pracInput.trim();
    const qt = $('retry-question-text');

    if (userAnswer === '') {
        const display = $('retry-input-text');
        if (display) { display.textContent = '请输入答案！'; display.className = 'c-play-input-text err'; }
        setTimeout(() => { if (display) { display.textContent = pracInput; display.className = 'c-play-input-text'; } }, 1200);
        return;
    }

    const idx = state.retryIndex;
    const q = state.retryQuestions[idx];
    const isCorrect = compareAnswers(userAnswer, q.correctAnswer);

    // 禁用键盘
    const kp = $('retry-keys');
    if (kp) kp.style.pointerEvents = 'none';

    justSubmitted = true;
    setTimeout(() => { justSubmitted = false; }, 200);

    if (isCorrect) {
        state.retryCorrectCount++;
        $('retry-correct').textContent = state.retryCorrectCount;
        if (qt) { qt.innerHTML = (typeof highlightOperators === 'function' ? highlightOperators(q.question) : q.question).replace('?', `<span class="c-play-ok">${userAnswer}</span> ✓`); }
        if (Framework.sound) Framework.sound.playCorrect();
        setTimeout(() => nextRetryQuestion(), 500);
    } else {
        state.retryWrongCount++;
        $('retry-wrong').textContent = state.retryWrongCount;
        if (qt) { qt.innerHTML = (typeof highlightOperators === 'function' ? highlightOperators(q.question) : q.question).replace('?', `<span class="c-play-no">${userAnswer}</span>`); }
        if (Framework.sound) Framework.sound.playWrong();
        setTimeout(() => nextRetryQuestion(), 600);
    }
}

function nextRetryQuestion() {
    state.retryIndex++;

    // 恢复键盘
    const kp = $('retry-keys');
    if (kp) { kp.style.display = ''; kp.style.pointerEvents = ''; }

    if (state.retryIndex >= state.retryQuestions.length) {
        // 显示重练结果
        const total = state.retryQuestions.length;
        const correct = state.retryCorrectCount;
        const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

        // 隐藏 play 区
        const keys = $('retry-keys');
        if (keys) keys.style.display = 'none';
        const core = document.querySelector('#retry-play .c-play-core');
        if (core) core.style.display = 'none';
        const progress = document.querySelector('#retry-play .c-play-progress');
        if (progress) progress.style.display = 'none';

        // 显示结果
        $('retry-result-icon').textContent = rate === 100 ? '🏆' : rate >= 80 ? '🌟' : '💪';
        $('retry-result-title').textContent = rate === 100 ? '全部答对！' : `正确率 ${rate}%`;
        $('retry-result').style.display = 'flex';

        // 环形进度
        const ringFill = $('retry-ring-fill');
        const ringPct = $('retry-ring-pct');
        const circumference = 2 * Math.PI * 15.9;
        if (ringFill) {
            ringFill.style.strokeDasharray = circumference;
            ringFill.style.strokeDashoffset = circumference - (rate / 100) * circumference;
        }
        if (ringPct) ringPct.textContent = rate + '%';

        $('retry-result-stats').innerHTML = `
            <div class="c-rs-row correct-row"><span>正确</span><span>${correct}/${total}</span></div>
            <div class="c-rs-row"><span>还需练习</span><span>${total - correct}</span></div>
        `;
        return;
    }

    renderRetryQuestion();
}

function quitRetry() {
    showPage('page-wrongbook');
}

// ============================================================
// 首页统计
// ============================================================

function updateHomeStats() {
    updateWbBadge();
    const count = WrongBook.getCount();
    const statsEl = $('home-stats');
    if (statsEl) {
        if (count > 0) {
            statsEl.innerHTML = `错题本中有 <span>${count}</span> 道错题需要复习`;
        } else {
            statsEl.innerHTML = '错题本为空，继续加油！';
        }
    }

    // 更新新首页统计栏
    if (typeof Stats !== 'undefined') {
        const total = Stats.getTotal();
        const today = Stats.getToday();
        const totalEl = $('hs-total');
        const todayEl = $('hs-today');
        const streakEl = $('hs-streak');
        if (totalEl) totalEl.textContent = total.total;
        if (todayEl) todayEl.textContent = today ? today.total : 0;
        if (streakEl) streakEl.textContent = total.days;
    }

    // 累计知识点分析
    const topicSection = $('home-topic-section');
    if (topicSection && typeof Stats.getTopicStats === 'function') {
        const merged = Stats.getTopicStats();
        const entries = Object.entries(merged).filter(([_, s]) => s.total > 0);
        if (entries.length > 0) {
            let tHtml = '<div class="ht-header">累计知识点掌握度</div>';
            entries.forEach(([type, s]) => {
                const pct = Math.round(s.correct / s.total * 100);
                const color = pct >= 80 ? 'var(--primary)' : pct >= 60 ? 'var(--orange)' : 'var(--red)';
                tHtml += `<div class="ht-row"><span class="ht-label">${s.label}</span><div class="ht-bar"><div class="ht-fill" style="width:${pct}%;background:${color}"></div></div><span class="ht-num">${pct}%</span></div>`;
            });
            topicSection.innerHTML = tHtml;
        } else {
            topicSection.innerHTML = '<div class="ht-empty">完成一次练习后，这里会显示各知识点的掌握度</div>';
        }
    }

    // 今日统计（旧首页）
    const dayStatsEl = $('home-day-stats');
    const todayStats = Stats.getToday();
    const totalAll = Stats.getTotal();
    if (todayStats) {
        const rate = todayStats.total > 0 ? Math.round(todayStats.correct / todayStats.total * 100) : 0;
        dayStatsEl.innerHTML = `
            <div class="day-item"><div class="day-num">${todayStats.total}</div><div class="day-label">今日答题</div></div>
            <div class="day-item"><div class="day-num" style="color:var(--success)">${rate}%</div><div class="day-label">今日正确率</div></div>
            <div class="day-item"><div class="day-num">${totalAll.total}</div><div class="day-label">累计答题</div></div>
        `;
    } else {
        dayStatsEl.innerHTML = `
            <div class="day-item"><div class="day-num">0</div><div class="day-label">今日答题</div></div>
            <div class="day-item"><div class="day-num" style="color:var(--text-light)">--</div><div class="day-label">正确率</div></div>
            <div class="day-item"><div class="day-num">${totalAll.total}</div><div class="day-label">累计答题</div></div>
        `;
    }
}

// ============================================================
// 🎊 庆祝动画
// ============================================================

function launchCelebration() {
    const container = document.createElement('div');
    container.className = 'celebration';
    document.body.appendChild(container);

    const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1',
                    '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF7EB3'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = `${Math.random() * -20}%`;
        confetti.style.background = pickRandom(colors);
        confetti.style.width = `${rand(6, 12)}px`;
        confetti.style.height = `${rand(6, 12)}px`;
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        confetti.style.animationDuration = `${rand(15, 30) / 10}s`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(confetti);
    }

    setTimeout(() => {
        container.remove();
    }, 4000);
}

// ============================================================
// 通用工具
// ============================================================

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// 键盘快捷键：反馈可见时按 Enter / Space 进入下一题
// ============================================================

document.addEventListener('keydown', (e) => {
    // 只处理反馈区可见时的情况
    const fb = $('c-fb');
    const retryFb = $('retry-fb');
    const feedbackVisible = fb && (fb.style.display === 'flex' || fb.style.display === 'block');
    const retryVisible = retryFb && (retryFb.style.display === 'flex' || retryFb.style.display === 'block');

    // justSubmitted 防冲撞：避免提交用的回车同时触发翻题
    if (justSubmitted) return;

    if ((feedbackVisible || retryVisible) && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (feedbackVisible && $('c-fb-next')) {
            nextQuestion();
        } else if (retryVisible && $('retry-fb-next')) {
            nextRetryQuestion();
        }
    }
});

// ============================================================
// 错题本筛选按钮
// ============================================================

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderWrongBook();
    });
});

// ============================================================
// 自定义数字键盘（传统口算答题）
// ============================================================
let pracInput = '';

function pracKeypadInit() {
  const keypad = $('c-keys');
  const retryKeypad = $('retry-keys');

  function getDisplay() {
    return document.querySelector('#page-retry.active') ? $('retry-input-text') : $('c-input-text');
  }

  function onKeypadClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'c-submit') {
      // 重练模式通过 onclick 处理
      if (!document.querySelector('#page-retry.active')) {
        submitAnswer();
      }
      return;
    }
    const val = btn.dataset.v;

    if (val === 'bk') {
      pracInput = pracInput.slice(0, -1);
    } else if (val === 'cl') {
      pracInput = '';
    } else {
      pracInput += val;
    }

    var d = getDisplay();
    if (d) d.textContent = pracInput;
    var inputWrap = document.querySelector('#page-retry.active') ? $('retry-input-wrap') : $('c-input-wrap');
    if (inputWrap) inputWrap.classList.toggle('has-val', pracInput !== '');
    if (Framework.sound) Framework.sound.playTap();
  }

  if (keypad) keypad.addEventListener('click', onKeypadClick);
  if (retryKeypad) retryKeypad.addEventListener('click', onKeypadClick);

  document.addEventListener('keydown', (e) => {
    if (!document.querySelector('#page-practice.active, #page-retry.active')) return;
    // 重练模式使用自己的提交函数
    if (document.querySelector('#page-retry.active') && e.key === 'Enter') {
      submitRetryAnswer(); e.preventDefault(); return;
    }
    if (/^[0-9.\-<>=]$/.test(e.key)) {
      pracInput += e.key;
      var d = getDisplay();
      if (d) d.textContent = pracInput;
      var iw = document.querySelector('#page-retry.active') ? $('retry-input-wrap') : $('c-input-wrap');
      if (iw) iw.classList.toggle('has-val', pracInput !== '');
      if (Framework.sound) Framework.sound.playTap();
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      pracInput = pracInput.slice(0, -1);
      var d = getDisplay();
      if (d) d.textContent = pracInput;
      var iw = document.querySelector('#page-retry.active') ? $('retry-input-wrap') : $('c-input-wrap');
      if (iw) iw.classList.toggle('has-val', pracInput !== '');
      if (Framework.sound) Framework.sound.playErase();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      submitAnswer();
      e.preventDefault();
    }
  });
}

function pracResetInput() {
  pracInput = '';
  const isRetry = document.querySelector('#page-retry.active');
  const d = isRetry ? $('retry-input-text') : $('c-input-text');
  if (d) d.textContent = '';
  const pd = isRetry ? $('retry-input-wrap') : $('c-input-wrap');
  if (pd) pd.classList.remove('has-val');
}

pracKeypadInit();

// ============================================================
// 初始化
// ============================================================

updateHomeStats();
