/**
 * 抽卡凑数模式
 * 用随机数字组合达成随机目标值，锻炼组合思维
 */
Framework.register({
  id: 'card-draw',
  name: '抽卡凑数',
  render(container) {
    const state = {
      numbers: [],
      solutions: [],
      target: 0,
      tokens: [],
      usedPositions: new Set(),
      foundSolutions: [],
      correctCount: 0,
      wrongCount: 0,
      totalCount: 0,
      difficulty: 'easy',
      answered: false,
    };

    // ============================================================
    // 布局
    // ============================================================
    container.innerHTML = `
      <div class="game24-wrap">
        <div class="game24-header">
          <div class="game24-difficulty" id="cd-diff">
            <button class="g24-diff-btn active" data-diff="easy">初级</button>
            <button class="g24-diff-btn" data-diff="medium">中级</button>
            <button class="g24-diff-btn" data-diff="hard">高级</button>
          </div>
          <div class="game24-score" id="cd-score">
            <span><i data-lucide="check-circle" style="width:16px;height:16px;color:var(--primary)"></i> <span class="correct-count" id="cd-correct">0</span></span>
            <span><i data-lucide="x-circle" style="width:16px;height:16px;color:var(--red)"></i> <span class="wrong-count" id="cd-wrong">0</span></span>
          </div>
        </div>

        <div style="text-align:center;padding:var(--s2) 0;">
          <span style="font-size:13px;font-weight:700;color:var(--text-secondary);">目标值</span>
          <div style="font-size:42px;font-weight:900;color:var(--primary);line-height:1.1;" id="cd-target">24</div>
        </div>

        <div class="game24-cards" id="cd-cards">
          <div class="game24-number">?</div>
          <div class="game24-number">?</div>
          <div class="game24-number">?</div>
          <div class="game24-number">?</div>
        </div>

        <div class="game24-display-wrap">
          <div class="game24-display" id="cd-display">
            <span class="game24-display-text" id="cd-display-text"></span>
            <span class="g24-result" id="cd-result"></span>
          </div>
          <div class="game24-history" id="cd-history"></div>
        </div>

        <div class="game24-keypad" id="cd-keypad">
          <div class="kp-row">
            <button class="kp-btn kp-op" data-val="+">+</button>
            <button class="kp-btn kp-op" data-val="−">−</button>
            <button class="kp-btn kp-op" data-val="×">×</button>
            <button class="kp-btn kp-op" data-val="÷">÷</button>
            <button class="kp-btn kp-bksp" data-val="bksp">⌫</button>
          </div>
          <div class="kp-row">
            <button class="kp-btn kp-op" data-val="(">(</button>
            <button class="kp-btn kp-op" data-val=")">)</button>
            <button class="kp-btn kp-clear" data-val="clear">清空</button>
            <button class="kp-btn kp-submit" id="cd-submit">确定</button>
          </div>
        </div>

        <div class="g24-overlay" id="cd-overlay" style="display:none;">
          <div class="g24-overlay-sheet">
            <div class="g24-overlay-header">
              <span class="g24-overlay-title">所有解法</span>
              <button class="g24-overlay-close" id="cd-overlay-close">✕</button>
            </div>
            <div class="g24-tabs" id="cd-tabs"></div>
            <div class="g24-overlay-list" id="cd-overlay-list"></div>
          </div>
        </div>

        <div class="game24-feedback" id="cd-feedback">
          <div class="game24-feedback-icon" id="cd-fb-icon"></div>
          <div class="game24-feedback-text" id="cd-fb-text"></div>
          <div class="game24-feedback-detail" id="cd-fb-detail"></div>
          <button class="game24-hint-btn" id="cd-show-solutions" style="display:none;">查看所有解法</button>
          <div style="display:flex;gap:var(--s2);margin-top:var(--s4);">
            <button class="btn btn-ghost" id="cd-continue" style="flex:1;">继续尝试</button>
            <button class="btn btn-primary" id="cd-next" style="flex:1;">下一题 →</button>
          </div>
        </div>

        <div class="game24-hint-row">
          <button class="game24-hint-btn" id="cd-hint"><i data-lucide="lightbulb" style="width:14px;height:14px;vertical-align:-2px;margin-right:2px"></i> 提示</button>
          <button class="game24-hint-btn" id="cd-skip">↻ 换一题</button>
        </div>
      </div>
    `;

    // ============================================================
    // DOM 引用
    // ============================================================
    const display = container.querySelector('#cd-display-text');
    const cards = container.querySelectorAll('.game24-number');
    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (card.disabled || state.answered) return;
        const idx = i;
        if (state.usedPositions.has(idx)) return;
        state.usedPositions.add(idx);
        state.tokens.push({type:'num', pos: idx});
        if (Framework.sound) Framework.sound.playTap();
        updateDisplay();
        clearFeedback();
      });
    });
    const submitBtn = container.querySelector('#cd-submit');
    const hintBtn = container.querySelector('#cd-hint');
    const skipBtn = container.querySelector('#cd-skip');
    const feedback = container.querySelector('#cd-feedback');
    const fbIcon = container.querySelector('#cd-fb-icon');
    const fbText = container.querySelector('#cd-fb-text');
    const fbDetail = container.querySelector('#cd-fb-detail');
    const overlay = container.querySelector('#cd-overlay');
    const overlayList = container.querySelector('#cd-overlay-list');
    const overlayTabs = container.querySelector('#cd-tabs');
    const overlayClose = container.querySelector('#cd-overlay-close');
    const showSolutionsBtn = container.querySelector('#cd-show-solutions');
    let solutionsGrouped = {};
    let solutionsTab = '全部';
    const nextBtn = container.querySelector('#cd-next');
    const continueBtn = container.querySelector('#cd-continue');
    const historyEl = container.querySelector('#cd-history');
    const resultEl = container.querySelector('#cd-result');
    const targetEl = container.querySelector('#cd-target');
    const correctEl = container.querySelector('#cd-correct');
    const wrongEl = container.querySelector('#cd-wrong');
    const keypad = container.querySelector('#cd-keypad');
    let displayTimer = null;

    // ============================================================
    // 键盘
    // ============================================================
    keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled || state.answered) return;
      const val = btn.dataset.val;
      if (val === 'bksp') {
        const last = state.tokens.pop();
        if (last?.type === 'num') state.usedPositions.delete(last.pos);
        if (Framework.sound) Framework.sound.playErase();
      } else if (val === 'clear') {
        state.tokens = []; state.usedPositions.clear();
        if (Framework.sound) Framework.sound.playClear();
      } else if (val === '(' || val === ')') {
        const lastTok = state.tokens[state.tokens.length - 1];
        const lastIsExpr = lastTok && (lastTok.type === 'num' || lastTok.val === ')');
        const openCount = state.tokens.filter(t => t.val === '(').length;
        const closeCount = state.tokens.filter(t => t.val === ')').length;
        const unbalanced = openCount - closeCount;
        if (unbalanced > 0) state.tokens.push({type:'op', val: val === ')' ? ')' : '('});
        else if (lastIsExpr) state.tokens = [{type:'op',val:'('}, ...state.tokens, {type:'op',val:')'}];
        else state.tokens.push({type:'op', val: val});
        if (Framework.sound) Framework.sound.playTap();
      } else { state.tokens.push({type:'op', val: val}); if (Framework.sound) Framework.sound.playTap(); }
      updateDisplay(); clearFeedback();
    });

    container.addEventListener('keydown', (e) => {
      if (state.answered) return;
      const key = e.key;
      if (/^[1-9]$/.test(key)) {
        const num = parseInt(key);
        for (let i = 0; i < state.numbers.length; i++) {
          if (state.numbers[i] === num && !state.usedPositions.has(i)) {
            state.usedPositions.add(i); state.tokens.push({type:'num', pos: i}); break;
          }
        }
        updateDisplay(); clearFeedback(); e.preventDefault();
      } else if (key === 'Enter') { submitAnswer(); e.preventDefault(); }
      else if (key === 'Backspace') {
        const last = state.tokens.pop();
        if (last?.type === 'num') state.usedPositions.delete(last.pos);
        updateDisplay(); clearFeedback(); e.preventDefault();
      } else if ('+-*/()'.includes(key)) {
        const mapped = key === '*' ? '×' : key === '/' ? '÷' : key === '-' ? '−' : key;
        if (key === '(' || key === ')') {
          const lastTok = state.tokens[state.tokens.length - 1];
          const lastIsExpr = lastTok && (lastTok.type === 'num' || lastTok.val === ')');
          const openCount = state.tokens.filter(t => t.val === '(').length;
          const closeCount = state.tokens.filter(t => t.val === ')').length;
          const unbalanced = openCount - closeCount;
          if (unbalanced > 0) state.tokens.push({type:'op', val: key === ')' ? ')' : mapped});
          else if (lastIsExpr) state.tokens = [{type:'op',val:'('}, ...state.tokens, {type:'op',val:')'}];
          else state.tokens.push({type:'op', val: mapped});
        } else { state.tokens.push({type:'op', val: mapped}); }
        updateDisplay(); clearFeedback(); e.preventDefault();
      }
    });

    // ============================================================
    // 难度选择
    // ============================================================
    container.querySelectorAll('.g24-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.g24-diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.difficulty = btn.dataset.diff;
        state.correctCount = 0; state.wrongCount = 0; state.totalCount = 0;
        state.answered = false; updateScore(); hideFeedback(); generatePuzzle();
      });
    });

    // ============================================================
    // 核心逻辑
    // ============================================================
    function getExpressionStr() {
      return state.tokens.map(t => t.type === 'num' ? String(state.numbers[t.pos]) : t.val).join('');
    }

    function updateDisplay() {
      const expr = getExpressionStr();
      display.textContent = expr; display.className = 'game24-display-text';
      if (expr) {
        const val = liveEval(expr);
        resultEl.textContent = (val !== null && Number.isFinite(val))
          ? '= ' + (Number.isInteger(val) ? val : val.toFixed(2)) : '';
      } else { resultEl.textContent = ''; }
      updateNumberButtonStates();
    }

    function liveEval(expr) {
      let n = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      if (!/^[\d+\-*/() ]+$/.test(n)) return null;
      try { return Function('"use strict"; return (' + n + ')')(); } catch(e) { return null; }
    }

    function updateNumberButtonStates() {
      const lastTok = state.tokens[state.tokens.length - 1];
      const needOperator = !!(lastTok && (lastTok.type === 'num' || lastTok.val === ')'));
      cards.forEach((card, i) => {
        const used = state.usedPositions.has(i);
        card.disabled = used || needOperator;
        card.classList.toggle('card-used', used);
        card.classList.toggle('card-need-op', !used && needOperator);
      });
    }

    function clearFeedback() {
      if (displayTimer) clearTimeout(displayTimer);
      keypad.style.display = ''; feedback.style.display = 'none';
      display.className = 'game24-display-text';
      if (state.answered) { hideFeedback(); state.answered = false; enableKeys(); }
    }

    function hideFeedback() { feedback.style.display = 'none'; feedback.className = 'game24-feedback'; }
    function enableKeys() { state.answered = false; keypad.style.pointerEvents = 'auto'; keypad.style.opacity = '1'; submitBtn.textContent = '确定'; }
    function disableKeys() { state.answered = true; keypad.style.pointerEvents = 'none'; keypad.style.opacity = '0.5'; }

    /** 生成一道题目 */
    function generatePuzzle() {
      const range = state.difficulty === 'easy' ? 9 : 13;
      const targetMin = state.difficulty === 'easy' ? 10 : state.difficulty === 'medium' ? 20 : 30;
      const targetMax = state.difficulty === 'easy' ? 50 : state.difficulty === 'medium' ? 80 : 150;
      let nums, sols, target;
      let attempts = 0;
      do {
        nums = [
          1 + Math.floor(Math.random() * range),
          1 + Math.floor(Math.random() * range),
          1 + Math.floor(Math.random() * range),
          1 + Math.floor(Math.random() * range),
        ];
        target = targetMin + Math.floor(Math.random() * (targetMax - targetMin + 1));
        sols = solveForTarget(nums, target);
        attempts++;
      } while (sols.length === 0 && attempts < 300);

      state.numbers = nums; state.solutions = sols; state.target = target;
      targetEl.textContent = target;

      solutionsGrouped = {};
      sols.forEach(s => {
        if (!solutionsGrouped[s.category]) solutionsGrouped[s.category] = [];
        solutionsGrouped[s.category].push(s.expr);
      });

      nums.forEach((n, i) => { cards[i].textContent = n; });
      state.tokens = []; state.usedPositions.clear();
      state.foundSolutions = []; state.answered = false;
      keypad.style.display = ''; hideFeedback();
      renderHistory(); updateDisplay();
      overlay.style.display = 'none'; showSolutionsBtn.style.display = 'none';
      enableKeys();
    }

    /** 暴力搜索凑数解法 */
    function solveForTarget(nums, target) {
      const ops = ['+', '-', '*', '/']; const results = [];

      function categorizeExpr(expr, a, b, c, d, o1, o2, o3, patternIdx) {
        const safeEval = (s) => { try { return Function('"use strict"; return (' + s + ')')(); } catch(e) { return NaN; } };
        let leftVal, rightVal, finalOp;
        if (patternIdx === 0) { leftVal = safeEval(`((${a} ${o1} ${b}) ${o2} ${c})`); rightVal = d; finalOp = o3; }
        else if (patternIdx === 1) { leftVal = safeEval(`(${a} ${o1} (${b} ${o2} ${c}))`); rightVal = d; finalOp = o3; }
        else if (patternIdx === 2) { leftVal = safeEval(`(${a} ${o1} ${b})`); rightVal = safeEval(`(${c} ${o3} ${d})`); finalOp = o2; }
        else if (patternIdx === 3) { leftVal = a; rightVal = safeEval(`((${b} ${o2} ${c}) ${o3} ${d})`); finalOp = o1; }
        else { leftVal = a; rightVal = safeEval(`(${b} ${o2} (${c} ${o3} ${d}))`); finalOp = o1; }
        const opsUsed = [o1, o2, o3];
        const onlyAddSub = opsUsed.every(op => op === '+' || op === '-');
        if (finalOp === '*' && Number.isFinite(leftVal) && Number.isFinite(rightVal)) {
          const l = Math.round(leftVal), r = Math.round(rightVal);
          const t = Math.round(target);
          if ((l * r === t) || (l === t && r === 1) || (r === t && l === 1)) return '乘法凑整';
        }
        if (onlyAddSub) return '加减法';
        return '其他';
      }

      function permute(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
          const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
          for (const p of permute(rest)) result.push([arr[i], ...p]);
        }
        return result;
      }
      const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

      for (const [a, b, c, d] of permute(nums)) {
        for (const o1 of ops) for (const o2 of ops) for (const o3 of ops) {
          const patterns = [
            `((${a} ${o1} ${b}) ${o2} ${c}) ${o3} ${d}`,
            `(${a} ${o1} (${b} ${o2} ${c})) ${o3} ${d}`,
            `(${a} ${o1} ${b}) ${o2} (${c} ${o3} ${d})`,
            `${a} ${o1} ((${b} ${o2} ${c}) ${o3} ${d})`,
            `${a} ${o1} (${b} ${o2} (${c} ${o3} ${d}))`,
          ];
          for (let pi = 0; pi < patterns.length; pi++) {
            const expr = patterns[pi];
            try {
              const val = Function('"use strict"; return (' + expr + ')')();
              if (Number.isFinite(val) && Math.abs(val - target) < 0.0001) {
                let pretty = expr;
                Object.entries(opSymbols).forEach(([k, v]) => { pretty = pretty.replace(new RegExp('\\' + k, 'g'), v); });
                const cat = categorizeExpr(expr, a, b, c, d, o1, o2, o3, pi);
                if (!results.some(r => r.expr === pretty)) results.push({ expr: pretty, category: cat });
              }
            } catch(e) {}
          }
        }
      }
      return [...results];
    }

    function evaluateUserExpr(expr) {
      let n = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/x/g,'*').replace(/X/g,'*');
      if (!/^[\d+\-*/() ]+$/.test(n)) return null;
      const numTokens = n.match(/\d+/g);
      if (!numTokens || numTokens.length !== 4) return null;
      const usedNums = numTokens.map(Number).sort((a,b)=>a-b);
      const givenNums = [...state.numbers].sort((a,b)=>a-b);
      for (let i = 0; i < 4; i++) { if (usedNums[i] !== givenNums[i]) return null; }
      try { const val = Function('"use strict"; return (' + n + ')')(); if (!Number.isFinite(val)) return null; return { value: val }; }
      catch(e) { return null; }
    }

    function showFeedback(iconHtml, text, detail, isCorrect) {
      feedback.style.display = 'block';
      feedback.className = 'game24-feedback show ' + (isCorrect ? 'correct' : 'wrong');
      fbIcon.innerHTML = iconHtml; fbText.textContent = text;
      keypad.style.display = 'none'; fbDetail.innerHTML = detail;
      solutionsGrouped = {};
      state.solutions.forEach(s => {
        if (!solutionsGrouped[s.category]) solutionsGrouped[s.category] = [];
        solutionsGrouped[s.category].push(s.expr);
      });
      solutionsTab = '全部';
      showSolutionsBtn.style.display = state.solutions.length > 0 ? 'inline-block' : 'none';
    }

    function updateScore() { correctEl.textContent = state.correctCount; wrongEl.textContent = state.wrongCount; }

    function renderHistory() {
      if (state.foundSolutions.length === 0) { historyEl.innerHTML = ''; return; }
      historyEl.innerHTML = '<div class="g24-history-label">已找到：</div>' +
        state.foundSolutions.map(s => `<span class="g24-history-tag">${s}</span>`).join('');
    }

    function submitAnswer() {
      const expr = getExpressionStr();
      if (!expr) return;
      const result = evaluateUserExpr(expr);
      if (!result) {
        display.className = 'game24-display-text error';
        display.textContent = '⚠ 用 4 个数字各一次，检查格式';
        displayTimer = setTimeout(() => { updateDisplay(); }, 1200);
        return;
      }
      disableKeys(); state.totalCount++;
      const isCorrect = Math.abs(result.value - state.target) < 0.0001;
      if (isCorrect) {
        state.correctCount++;
        const exprStr = getExpressionStr();
        if (!state.foundSolutions.includes(exprStr)) {
          state.foundSolutions.push(exprStr);
          if (state.foundSolutions.length === state.solutions.length && state.solutions.length > 1) {
            if (Framework.sound) Framework.sound.playComplete();
          }
        }
        renderHistory();
        if (Framework.sound) Framework.sound.playCorrect();
        const remaining = state.solutions.length - state.foundSolutions.length;
        showFeedback('<i data-lucide="check-circle" style="width:36px;height:36px;color:var(--primary)"></i>', `凑出 ${state.target} 了！`,
          remaining > 0 ? `还有 ${remaining} 种解法，试试能不能发现更多？` : '太棒了！', true);
        if (typeof lucide !== 'undefined') lucide.createIcons();
      } else {
        state.wrongCount++;
        if (Framework.sound) Framework.sound.playWrong();
        showFeedback('<i data-lucide="frown" style="width:36px;height:36px;color:var(--orange)"></i>', `你算的是 ${result.value}，还差一点！`, '再想想，换一种组合方式试试', false);
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
      updateScore();
    }

    // ============================================================
    // 事件绑定
    // ============================================================
    submitBtn.addEventListener('click', submitAnswer);
    hintBtn.addEventListener('click', () => {
      if (Framework.sound) Framework.sound.playTap();
      if (state.solutions.length > 0) { renderOverlay(solutionsTab); overlay.style.display = 'flex'; }
      else { showFeedback('<i data-lucide="help-circle" style="width:36px;height:36px;color:var(--text-secondary)"></i>', '这道题有点难...', '试试换一题吧！', false); if (typeof lucide !== 'undefined') lucide.createIcons(); }
    });
    skipBtn.addEventListener('click', () => { if (Framework.sound) Framework.sound.playNext(); generatePuzzle(); });
    nextBtn.addEventListener('click', () => { if (Framework.sound) Framework.sound.playNext(); generatePuzzle(); });

    function renderOverlay(tab) {
      const cats = Object.keys(solutionsGrouped);
      const allCount = Object.values(solutionsGrouped).flat().length;
      overlayTabs.innerHTML = `<button class="g24-tab ${tab === '全部' ? 'active' : ''}" data-tab="全部">全部 (${allCount})</button>` +
        cats.map(c => `<button class="g24-tab ${tab === c ? 'active' : ''}" data-tab="${c}">${c} (${solutionsGrouped[c].length})</button>`).join('');
      const isFound = (expr) => state.foundSolutions.includes(expr);
      const itemHtml = (expr) => `<div class="g24-overlay-item${isFound(expr) ? ' found' : ''}">${expr} = ${state.target}${isFound(expr) ? ' ✓' : ''}</div>`;
      const items = tab === '全部' ? Object.entries(solutionsGrouped) : [['', solutionsGrouped[tab] || []]];
      overlayList.innerHTML = tab === '全部'
        ? items.map(([cat, exprs]) => `<div class="g24-category-label">${cat}</div>` + exprs.map(e => itemHtml(e)).join('')).join('')
        : items[0][1].map(e => itemHtml(e)).join('');
    }

    showSolutionsBtn.addEventListener('click', () => { renderOverlay(solutionsTab); overlay.style.display = 'flex'; });
    overlayTabs.addEventListener('click', (e) => { const btn = e.target.closest('.g24-tab'); if (!btn) return; solutionsTab = btn.dataset.tab; renderOverlay(solutionsTab); });
    overlayClose.addEventListener('click', () => { overlay.style.display = 'none'; });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
    continueBtn.addEventListener('click', () => {
      if (Framework.sound) Framework.sound.playTap();
      state.tokens = []; state.usedPositions.clear(); state.answered = false;
      keypad.style.display = ''; overlay.style.display = 'none';
      showSolutionsBtn.style.display = 'none'; hideFeedback(); updateDisplay(); enableKeys();
    });

    // ============================================================
    // 启动
    // ============================================================
    if (Framework.sound) Framework.sound.playStart();
    generatePuzzle();

    this.onDestroy = () => { if (displayTimer) clearTimeout(displayTimer); };
  }
});
