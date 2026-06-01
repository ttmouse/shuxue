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

// ============================================================
// 设置页
// ============================================================

// 渲染知识点选择界面
let selectedGrade = '3~4年级';

function switchGrade(grade) {
    selectedGrade = grade;
    renderTopicSelect();
}

function renderTopicSelect() {
    const container = document.getElementById('topic-select');
    if (!container) return;
    const grades = Knowledge.getGrades();

    // 当前年级的知识点（单选）
    const current = grades.find(g => g.grade === selectedGrade);
    let html = '';
    if (current) {
        html = '<div class="grade-topics radio">';
        current.topics.forEach((t, i) => {
            const checked = i === 0 ? ' checked' : '';
            html += '<label class="topic-item"><input type="radio" name="topic" value="' + t.id + '"' + checked + '> ' + t.label + ' <span class="topic-desc">' + t.desc + '</span></label>';
        });
        // 综合练习
        html += '<label class="topic-item topic-mixed"><input type="radio" name="topic" value="__mixed__"> 综合练习 <span class="topic-desc">混合前面所有题型</span></label>';
        html += '</div>';
    }

    container.innerHTML = html;

    // 同步年级下拉
    const sel = document.getElementById('grade-select');
    if (sel) sel.value = selectedGrade;
}

/** 获取当前选中的知识点列表（供 startPractice 使用） */
function getSelectedTopics() {
    const sel = document.querySelector('input[name="topic"]:checked');
    if (!sel) return [];
    if (sel.value === '__mixed__') {
        const grade = Knowledge.getGrades().find(g => g.grade === selectedGrade);
        return grade ? grade.topics.map(t => t.id) : [];
    }
    return [sel.value];
}

renderTopicSelect();

// 题目数量选择
document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.count = parseInt(btn.dataset.count);
    });
});

// 难度选择
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.difficulty = btn.dataset.diff;
    });
});

// ============================================================
// 开始练习
// ============================================================

function startPractice() {
    const checkedTopics = getSelectedTopics();
    if (checkedTopics.length === 0) {
        alert('请至少选择一种题型！');
        return;
    }
    // 知识点 ID → 生成器 ID 映射（部分知识点共用同一生成器）
    const TOPIC_ALIAS = {
        'add-easy': 'add-sub',
        'multi-hard': 'multiplication',
        'double-paren': 'mixed',
        'decimal-addsub': 'decimal',
        'fraction-addsub': 'fraction',
    };
    state.topics = [...new Set(checkedTopics.map(t => TOPIC_ALIAS[t] || t))];
    state.difficulty = document.querySelector('.diff-btn.active')?.dataset?.diff || 'medium';
    state.count = parseInt(document.querySelector('.count-btn.active')?.dataset?.count || '20');

    // 生成题目
    const { questions } = QuestionGenerator.generateSet(state.topics, state.count, state.difficulty);
    state.questions = questions;
    state.currentIndex = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.startTime = Date.now();

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

    $('question-num').textContent = idx + 1;
    $('question-total').textContent = total;
    $('correct-count').textContent = state.correctCount;
    $('wrong-count').textContent = state.wrongCount;
    $('progress-fill').style.width = `${(idx / total) * 100}%`;

    $('question-type-label').textContent = `第 ${idx + 1} 题 · ${q.typeLabel}`;
    $('question-text').textContent = q.question;

    // 重置输入
    const input = $('answer-input');
    input.value = '';
    input.className = 'answer-input';
    input.disabled = false;
    input.focus();

    // 隐藏反馈
    $('feedback-area').style.display = 'none';
    $('submit-btn').disabled = false;
    $('submit-btn').textContent = '确定';
}

function submitAnswer() {
    const input = $('answer-input');
    const userAnswer = input.value.trim();

    if (userAnswer === '') {
        input.focus();
        input.placeholder = '请先输入答案！';
        setTimeout(() => { input.placeholder = '输入你的答案…'; }, 1500);
        return;
    }

    const idx = state.currentIndex;
    const q = state.questions[idx];
    const correctAnswer = q.answer.trim();

    // 判断答案
    const isCorrect = compareAnswers(userAnswer, correctAnswer);

    // 禁用输入
    input.disabled = true;
    $('submit-btn').disabled = true;

    // 防冲撞：当前回车已经用于提交，屏蔽键盘翻题 200ms
    justSubmitted = true;
    setTimeout(() => { justSubmitted = false; }, 200);

    if (isCorrect) {
        state.correctCount++;
        input.className = 'answer-input correct';
        Sound.playCorrect();
        showFeedback('correct', q);
    } else {
        state.wrongCount++;
        input.className = 'answer-input wrong';
        Sound.playWrong();
        showFeedback('wrong', q, userAnswer);

        // 记录错题
        WrongBook.add({
            question: q.question,
            correctAnswer: q.answer,
            userAnswer: userAnswer,
            type: q.type,
            typeLabel: q.typeLabel,
        });
    }

    $('correct-count').textContent = state.correctCount;
    $('wrong-count').textContent = state.wrongCount;
}

function compareAnswers(user, correct) {
    // 去除两端空格
    user = user.trim();
    correct = correct.trim();

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
    const area = $('feedback-area');
    const icon = $('feedback-icon');
    const text = $('feedback-text');
    const detail = $('feedback-detail');

    area.style.display = 'block';

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
    $('next-btn').textContent = isLast ? '查看结果' : '下一题';
}

function nextQuestion() {
    Sound.playNext();
    state.currentIndex++;

    if (state.currentIndex >= state.questions.length) {
        // 练习结束，显示结果
        showResult();
        return;
    }

    renderQuestion();
    // 聚焦输入框
    $('answer-input').focus();
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

function showResult() {
    const total = state.questions.length;
    const correct = state.correctCount;
    const wrong = state.wrongCount;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const timeStr = elapsed < 60 ? `${elapsed} 秒` : `${Math.floor(elapsed / 60)} 分 ${elapsed % 60} 秒`;

    // 根据正确率给出不同反馈
    let icon, title;
    if (rate === 100) {
        icon = '🏆'; title = '满分！太厉害了！🎉';
        setTimeout(launchCelebration, 300);
    } else if (rate >= 90) {
        icon = '🌟'; title = '非常优秀！继续保持！';
    } else if (rate >= 80) {
        icon = '👍'; title = '表现不错！还可以更好！';
    } else if (rate >= 60) {
        icon = '💪'; title = '还需加油！多练练就好了！';
    } else {
        icon = '📚'; title = '要多练习哦！加油！';
    }

    $('result-icon').textContent = icon;
    $('result-title').textContent = title;
    $('result-correct').textContent = `${correct}/${total}`;
    $('result-total').textContent = total;
    $('result-rate').textContent = `${rate}%`;
    $('result-time').textContent = timeStr;

    const wrongItem = $('result-wrong-item');
    if (wrong > 0) {
        wrongItem.style.display = 'flex';
        $('result-wrong-count').textContent = wrong;
    } else {
        wrongItem.style.display = 'none';
    }

    // 记录每日统计
    const practicedTopics = state.questions.map(q => q.type);
    Stats.recordPractice(total, correct, practicedTopics, state.difficulty);

    showPage('page-result');
    Sound.playComplete();

    // 如果是满分，放一次庆祝
    if (rate === 100) {
        launchCelebration();
    }
}

// ============================================================
// 错题本
// ============================================================

function showWrongBook() {
    renderWrongBook();
    showPage('page-wrongbook');
}

function renderWrongBook() {
    const list = $('wrongbook-list');
    const stats = $('wrongbook-stats');
    const filter = document.querySelector('.filter-btn.active')?.dataset?.filter || 'all';
    const items = WrongBook.getByType(filter);

    if (items.length === 0) {
        list.innerHTML = '<p class="empty-msg">暂无错题，继续加油！🎉</p>';
        stats.textContent = filter === 'all' ? '' : '该题型暂无错题';
        return;
    }

    const totalErrors = items.reduce((s, i) => s + (i.count || 1), 0);
    stats.textContent = `共 ${items.length} 道错题，累计错 ${totalErrors} 次`;

    // 按日期分组显示
    const groups = WrongBook.getGroupedByDate(items);
    let html = '';

    Object.keys(groups).sort().reverse().forEach(date => {
        html += `<div style="margin-bottom:8px;">`;
        html += `<div style="font-size:13px;color:var(--text-light);padding:4px 0;">📅 ${date}</div>`;
        groups[date].forEach(item => {
            const times = item.count || 1;
            const countBadge = times > 1 ? `<span class="wi-count">错${times}次</span>` : '';
            html += `
                <div class="wrong-item">
                    ${countBadge}
                    <div class="wi-question">${escapeHtml(item.question)}</div>
                    <div class="wi-answers">
                        <div class="wi-correct">${escapeHtml(item.correctAnswer)}</div>
                        <div class="wi-user">你的答案：${escapeHtml(item.userAnswers?.join('、') || item.userAnswer || '')}</div>
                    </div>
                    <button class="wi-delete" onclick="deleteWrongItem('${item.id}')" title="删除">✕</button>
                </div>
            `;
        });
        html += `</div>`;
    });

    list.innerHTML = html;
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
}

// ============================================================
// 错题重练
// ============================================================

function renderRetryQuestion() {
    const idx = state.retryIndex;
    const total = state.retryQuestions.length;
    const q = state.retryQuestions[idx];

    $('retry-num').textContent = idx + 1;
    $('retry-total').textContent = total;
    $('retry-progress-fill').style.width = `${(idx / total) * 100}%`;
    $('retry-type-label').textContent = `错题重练 (${idx + 1}/${total})`;
    $('retry-question-text').textContent = q.question;

    const input = $('retry-answer-input');
    input.value = '';
    input.className = 'answer-input';
    input.disabled = false;
    input.focus();

    $('retry-feedback-area').style.display = 'none';
}

function submitRetryAnswer() {
    const input = $('retry-answer-input');
    const userAnswer = input.value.trim();

    if (userAnswer === '') {
        input.focus();
        input.placeholder = '请先输入答案！';
        setTimeout(() => { input.placeholder = '输入你的答案…'; }, 1500);
        return;
    }

    const idx = state.retryIndex;
    const q = state.retryQuestions[idx];
    const isCorrect = compareAnswers(userAnswer, q.correctAnswer);

    input.disabled = true;

    // 防冲撞：当前回车已经用于提交，屏蔽键盘翻题 200ms
    justSubmitted = true;
    setTimeout(() => { justSubmitted = false; }, 200);

    if (isCorrect) {
        state.retryCorrectCount++;
        input.className = 'answer-input correct';
        WrongBook.remove(q.id);
        Sound.playCorrect();
        showRetryFeedback('correct', q);
    } else {
        state.retryWrongCount++;
        input.className = 'answer-input wrong';
        Sound.playWrong();
        showRetryFeedback('wrong', q, userAnswer);
    }
}

function showRetryFeedback(result, q, userAnswer) {
    const area = $('retry-feedback-area');
    const icon = $('retry-feedback-icon');
    const text = $('retry-feedback-text');
    const detail = $('retry-feedback-detail');

    area.style.display = 'block';

    if (result === 'correct') {
        icon.textContent = '✅';
        text.textContent = '这次答对了！错题已从错题本移除 🎉';
        detail.textContent = `${q.question.replace('?', q.correctAnswer)}`;
    } else {
        icon.textContent = '😅';
        text.textContent = pickRandom(encourageMessages);
        detail.innerHTML = `
            你的答案：<span class="wrong-answer">${escapeHtml(userAnswer)}</span><br>
            正确答案：<span class="correct-answer">${escapeHtml(q.correctAnswer)}</span>
        `;
    }

    const isLast = state.retryIndex >= state.retryQuestions.length - 1;
    $('retry-next-btn').textContent = isLast ? '📊 查看结果' : '下一题 →';
}

function nextRetryQuestion() {
    state.retryIndex++;

    if (state.retryIndex >= state.retryQuestions.length) {
        // 重练结束
        alert(`错题重练完成！\n正确：${state.retryCorrectCount} 题\n仍需努力：${state.retryWrongCount} 题`);
        renderWrongBook();
        showPage('page-wrongbook');
        updateHomeStats();
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
    const count = WrongBook.getCount();
    const statsEl = $('home-stats');
    if (count > 0) {
        statsEl.innerHTML = `错题本中有 <span>${count}</span> 道错题需要复习`;
    } else {
        statsEl.innerHTML = '错题本为空，继续加油！';
    }

    // 今日统计
    const dayStatsEl = $('home-day-stats');
    const today = Stats.getToday();
    const totalAll = Stats.getTotal();
    if (today) {
        const rate = today.total > 0 ? Math.round(today.correct / today.total * 100) : 0;
        dayStatsEl.innerHTML = `
            <div class="day-item"><div class="day-num">${today.total}</div><div class="day-label">今日答题</div></div>
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
    const fb = $('feedback-area');
    const retryFb = $('retry-feedback-area');
    const feedbackVisible = fb && fb.style.display === 'block';
    const retryVisible = retryFb && retryFb.style.display === 'block';

    // justSubmitted 防冲撞：避免提交用的回车同时触发翻题
    if (justSubmitted) return;

    if ((feedbackVisible || retryVisible) && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (feedbackVisible && $('next-btn')) {
            nextQuestion();
        } else if (retryVisible && $('retry-next-btn')) {
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
// 初始化
// ============================================================

updateHomeStats();
