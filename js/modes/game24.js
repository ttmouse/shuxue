/**
 * 24 点挑战模式
 * 用 4 个数字加减乘除凑出 24，锻炼组合思维
 */
Framework.register({
  id: 'game24',
  name: '24 点挑战',
  render(container) {
    const state = {
      numbers: [],
      solutions: [],
      tokens: [],         // [{type:'num', pos:0} | {type:'op', val:'+'}]
      usedPositions: new Set(),
      foundSolutions: [],   // 当前这局已找到的解法
      correctCount: 0,
      wrongCount: 0,
      totalCount: 0,
      difficulty: 'easy',
      answered: false,
    };

    // ============================================================
    // 布局 — 可点击键盘输入
    // ============================================================
    container.innerHTML = `
      <div class="game24-wrap">
        <!-- 顶栏：难度 + 计分 -->
        <div class="game24-header">
          <div class="game24-difficulty" id="g24-diff">
            <button class="g24-diff-btn active" data-diff="easy">初级</button>
            <button class="g24-diff-btn" data-diff="medium">中级</button>
            <button class="g24-diff-btn" data-diff="hard">高级</button>
          </div>
          <div class="game24-score" id="g24-score">
            <span><i data-lucide="check-circle" style="width:16px;height:16px;color:var(--primary)"></i> <span class="correct-count" id="g24-correct">0</span></span>
            <span><i data-lucide="x-circle" style="width:16px;height:16px;color:var(--red)"></i> <span class="wrong-count" id="g24-wrong">0</span></span>
          </div>
        </div>

        <!-- 卡片区 -->
        <div class="game24-cards" id="g24-cards">
          <div class="game24-number">?</div>
          <div class="game24-number">?</div>
          <div class="game24-number">?</div>
          <div class="game24-number">?</div>
        </div>

        <!-- label 已移除 -->

        <!-- 算式显示区（只读） -->
        <div class="game24-display-wrap">
          <div class="game24-display" id="g24-display">
            <span class="game24-display-text" id="g24-display-text"></span>
            <span class="g24-result" id="g24-result"></span>
          </div>
          <div class="game24-history" id="g24-history"></div>
        </div>

        <!-- 自定义键盘 -->
        <div class="game24-keypad" id="g24-keypad">
          <!-- 第 1 行：加减乘除 + 退格 -->
          <div class="kp-row">
            <button class="kp-btn kp-op" data-val="+">+</button>
            <button class="kp-btn kp-op" data-val="−">−</button>
            <button class="kp-btn kp-op" data-val="×">×</button>
            <button class="kp-btn kp-op" data-val="÷">÷</button>
            <button class="kp-btn kp-bksp" data-val="bksp">⌫</button>
          </div>
          <!-- 第 3 行：括号 + 清空 + 提交 -->
          <div class="kp-row">
            <button class="kp-btn kp-op" data-val="(">(</button>
            <button class="kp-btn kp-op" data-val=")">)</button>
            <button class="kp-btn kp-clear" data-val="clear">清空</button>
            <button class="kp-btn kp-submit" id="g24-submit">确定</button>
          </div>
        </div>

        <!-- 提示 / 换题 -->
        <!-- 解法浮层 -->
        <div class="g24-overlay" id="g24-overlay" style="display:none;">
          <div class="g24-overlay-sheet">
            <div class="g24-overlay-header">
              <span class="g24-overlay-title">所有解法</span>
              <button class="g24-overlay-close" id="g24-overlay-close">✕</button>
            </div>
            <div class="g24-tabs" id="g24-tabs"></div>
            <div class="g24-overlay-list" id="g24-overlay-list"></div>
          </div>
        </div>

        <!-- 反馈区 -->
        <div class="game24-feedback" id="g24-feedback">
          <div class="game24-feedback-icon" id="g24-fb-icon"></div>
          <div class="game24-feedback-text" id="g24-fb-text"></div>
          <div class="game24-feedback-detail" id="g24-fb-detail"></div>
          <button class="game24-hint-btn" id="g24-show-solutions" style="display:none;">查看所有解法</button>
          <div style="display:flex;gap:var(--s2);margin-top:var(--s4);">
            <button class="btn btn-ghost" id="g24-continue" style="flex:1;">继续尝试</button>
            <button class="btn btn-primary" id="g24-next" style="flex:1;">下一题 →</button>
          </div>
        </div>

        <div class="game24-hint-row">
          <button class="game24-hint-btn" id="g24-hint"><i data-lucide="lightbulb" style="width:14px;height:14px;vertical-align:-2px;margin-right:2px"></i> 提示</button>
          <button class="game24-hint-btn" id="g24-skip">↻ 换一题</button>
        </div>
      </div>
    `;

    // ============================================================
    // DOM 引用
    // ============================================================
    const display = container.querySelector('#g24-display-text');
    const cards = container.querySelectorAll('.game24-number');
    // 数字卡片可点击输入
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
    const submitBtn = container.querySelector('#g24-submit');
    const hintBtn = container.querySelector('#g24-hint');
    const skipBtn = container.querySelector('#g24-skip');
    const feedback = container.querySelector('#g24-feedback');
    const fbIcon = container.querySelector('#g24-fb-icon');
    const fbText = container.querySelector('#g24-fb-text');
    const fbDetail = container.querySelector('#g24-fb-detail');
    const overlay = container.querySelector('#g24-overlay');
    const overlayList = container.querySelector('#g24-overlay-list');
    const overlayTabs = container.querySelector('#g24-tabs');
    const overlayClose = container.querySelector('#g24-overlay-close');
    const showSolutionsBtn = container.querySelector('#g24-show-solutions');
    let solutionsGrouped = {};    // 按分类分组的解法
    let solutionsTab = '全部';    // 当前选中的 tab
    const nextBtn = container.querySelector('#g24-next');
    const continueBtn = container.querySelector('#g24-continue');
    const historyEl = container.querySelector('#g24-history');
    const resultEl = container.querySelector('#g24-result');
    const correctEl = container.querySelector('#g24-correct');
    const wrongEl = container.querySelector('#g24-wrong');
    const keypad = container.querySelector('#g24-keypad');
    let displayTimer = null;

    // ============================================================
    // 键盘输入处理
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
        state.tokens = [];
        state.usedPositions.clear();
        if (Framework.sound) Framework.sound.playClear();
      } else if (val === '(' || val === ')') {
        // 智能括号：有未配对的 ( 时直接追加/关闭，否则包裹整体
        const lastTok = state.tokens[state.tokens.length - 1];
        const lastIsExpr = lastTok && (lastTok.type === 'num' || lastTok.val === ')');
        const openCount = state.tokens.filter(t => t.val === '(').length;
        const closeCount = state.tokens.filter(t => t.val === ')').length;
        const unbalanced = openCount - closeCount;

        if (unbalanced > 0) {
          // 有未配对的 括号，直接追加/关闭
          state.tokens.push({type:'op', val: val === ')' ? ')' : '('});
        } else if (lastIsExpr) {
          // 无未配对括号且末尾有内容 → 包裹整体
          state.tokens = [{type:'op',val:'('}, ...state.tokens, {type:'op',val:')'}];
        } else {
          state.tokens.push({type:'op', val: val});
        }
        if (Framework.sound) Framework.sound.playTap();
      } else {
        state.tokens.push({type:'op', val: val});
        if (Framework.sound) Framework.sound.playTap();
      }

      updateDisplay();
      clearFeedback();
    });

    // 键盘快捷键（桌面端）
    container.addEventListener('keydown', (e) => {
      if (state.answered) return;
      const key = e.key;
      if (/^[1-9]$/.test(key)) {
        // 数字键 1-9 映射到未使用的最近值位置
        const num = parseInt(key);
        for (let i = 0; i < state.numbers.length; i++) {
          if (state.numbers[i] === num && !state.usedPositions.has(i)) {
            state.usedPositions.add(i);
            state.tokens.push({type:'num', pos: i});
            break;
          }
        }
        updateDisplay();
        clearFeedback();
        e.preventDefault();
      } else if (key === 'Enter') {
        submitAnswer();
        e.preventDefault();
      } else if (key === 'Backspace') {
        const last = state.tokens.pop();
        if (last?.type === 'num') state.usedPositions.delete(last.pos);
        updateDisplay();
        clearFeedback();
        e.preventDefault();
      } else if ('+-*/()'.includes(key)) {
        const mapped = key === '*' ? '×' : key === '/' ? '÷' : key === '-' ? '−' : key;
        if (key === '(' || key === ')') {
          const lastTok = state.tokens[state.tokens.length - 1];
          const lastIsExpr = lastTok && (lastTok.type === 'num' || lastTok.val === ')');
          const openCount = state.tokens.filter(t => t.val === '(').length;
          const closeCount = state.tokens.filter(t => t.val === ')').length;
          const unbalanced = openCount - closeCount;
          if (unbalanced > 0) {
            state.tokens.push({type:'op', val: key === ')' ? ')' : mapped});
          } else if (lastIsExpr) {
            state.tokens = [{type:'op',val:'('}, ...state.tokens, {type:'op',val:')'}];
          } else {
            state.tokens.push({type:'op', val: mapped});
          }
        } else {
          state.tokens.push({type:'op', val: mapped});
        }
        updateDisplay();
        clearFeedback();
        e.preventDefault();
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
        state.correctCount = 0;
        state.wrongCount = 0;
        state.totalCount = 0;
        state.answered = false;
        updateScore();
        hideFeedback();
        generatePuzzle();
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
      display.textContent = expr;
      display.className = 'game24-display-text';
      // 实时计算结果
      if (expr) {
        const val = liveEval(expr);
        if (val !== null && Number.isFinite(val)) {
          resultEl.textContent = '= ' + (Number.isInteger(val) ? val : val.toFixed(2));
        } else {
          resultEl.textContent = '';
        }
      } else {
        resultEl.textContent = '';
      }
      updateNumberButtonStates();
    }

    /** 实时计算表达式值（不验证数字个数，仅计算） */
    function liveEval(expr) {
      let normalized = expr
        .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      if (!/^[\d+\-*/() ]+$/.test(normalized)) return null;
      try {
        return Function('"use strict"; return (' + normalized + ')')();
      } catch (e) {
        return null;
      }
    }

    /** 更新数字按钮状态：数字不能连按，必须接运算符 */
    function updateNumberButtonStates() {
      const lastTok = state.tokens[state.tokens.length - 1];
      // 数字后面不能再接数字，必须接运算符
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
      keypad.style.display = '';
      feedback.style.display = 'none';
      display.className = 'game24-display-text';
      if (state.answered) {
        hideFeedback();
        state.answered = false;
        enableKeys();
      }
    }

    function hideFeedback() {
      feedback.style.display = 'none';
      feedback.className = 'game24-feedback';
    }

    function enableKeys() {
      state.answered = false;
      keypad.style.pointerEvents = 'auto';
      keypad.style.opacity = '1';
      submitBtn.textContent = '确定';
    }

    function disableKeys() {
      state.answered = true;
      keypad.style.pointerEvents = 'none';
      keypad.style.opacity = '0.5';
    }

    /** 生成一道题目 */
    function generatePuzzle() {
      const range = state.difficulty === 'easy' ? 9 : 13;
      let nums, sols;
      let attempts = 0;
      do {
        nums = [
          1 + Math.floor(Math.random() * range),
          1 + Math.floor(Math.random() * range),
          1 + Math.floor(Math.random() * range),
          1 + Math.floor(Math.random() * range),
        ];
        sols = solve24(nums);
        attempts++;
      } while (sols.length === 0 && attempts < 200);

      state.numbers = nums;
      state.solutions = sols;

      // 同时填充浮层数据
      solutionsGrouped = {};
      sols.forEach(s => {
        if (!solutionsGrouped[s.category]) solutionsGrouped[s.category] = [];
        solutionsGrouped[s.category].push(s.expr);
      });

      // 卡片
      nums.forEach((n, i) => { cards[i].textContent = n; });

      // 重置
      state.tokens = [];
      state.usedPositions.clear();
      state.foundSolutions = [];
      state.answered = false;
      keypad.style.display = '';
      hideFeedback();
      renderHistory();
      updateDisplay();
      overlay.style.display = 'none';
      showSolutionsBtn.style.display = 'none';
      enableKeys();
    }

    /** 暴力搜索 24 点解法 */
    function solve24(nums) {
      const ops = ['+', '-', '*', '/'];
      const results = [];

      function categorizeExpr(expr, a, b, c, d, o1, o2, o3, patternIdx) {
        const safeEval = (s) => {
          try { return Function('"use strict"; return (' + s + ')')(); } catch(e) { return NaN; }
        };

        // 检测最终运算是否为乘法，以及左右值
        let leftVal, rightVal, finalOp;
        if (patternIdx === 0) { // ((a o1 b) o2 c) o3 d
          leftVal = safeEval(`((${a} ${o1} ${b}) ${o2} ${c})`);
          rightVal = d; finalOp = o3;
        } else if (patternIdx === 1) { // (a o1 (b o2 c)) o3 d
          leftVal = safeEval(`(${a} ${o1} (${b} ${o2} ${c}))`);
          rightVal = d; finalOp = o3;
        } else if (patternIdx === 2) { // (a o1 b) o2 (c o3 d)
          leftVal = safeEval(`(${a} ${o1} ${b})`);
          rightVal = safeEval(`(${c} ${o3} ${d})`);
          finalOp = o2;
        } else if (patternIdx === 3) { // a o1 ((b o2 c) o3 d)
          leftVal = a;
          rightVal = safeEval(`((${b} ${o2} ${c}) ${o3} ${d})`);
          finalOp = o1;
        } else { // a o1 (b o2 (c o3 d))
          leftVal = a;
          rightVal = safeEval(`(${b} ${o2} (${c} ${o3} ${d}))`);
          finalOp = o1;
        }

        // 判断模式
        const opsUsed = [o1, o2, o3];
        const onlyAddSub = opsUsed.every(op => op === '+' || op === '-');

        if (finalOp === '*' && Number.isFinite(leftVal) && Number.isFinite(rightVal)) {
          const l = Math.round(leftVal), r = Math.round(rightVal);
          if ((l === 4 && r === 6) || (l === 6 && r === 4)) return '4×6';
          if ((l === 3 && r === 8) || (l === 8 && r === 3)) return '3×8';
          if ((l === 2 && r === 12) || (l === 12 && r === 2)) return '2×12';
          if ((l === 24 && r === 1) || (l === 1 && r === 24)) return '24×1';
        }

        if (onlyAddSub) return '加减法';
        return '其他';
      }

      function permute(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
          const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
          for (const p of permute(rest)) {
            result.push([arr[i], ...p]);
          }
        }
        return result;
      }

      const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

      for (const [a, b, c, d] of permute(nums)) {
        for (const o1 of ops) {
          for (const o2 of ops) {
            for (const o3 of ops) {
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
                  if (Number.isFinite(val) && Math.abs(val - 24) < 0.0001) {
                    let pretty = expr;
                    Object.entries(opSymbols).forEach(([k, v]) => {
                      pretty = pretty.replace(new RegExp('\\' + k, 'g'), v);
                    });
                    const cat = categorizeExpr(expr, a, b, c, d, o1, o2, o3, pi);
                    // 去重（相同格式的表达式只保留一次）
                    if (!results.some(r => r.expr === pretty)) {
                      results.push({ expr: pretty, category: cat });
                    }
                  }
                } catch (e) { /* 除零等情况跳过 */ }
              }
            }
          }
        }
      }

      return [...results];
    }

    /** 验证并求值用户输入的表达式 */
    function evaluateUserExpr(expr) {
      let normalized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/x/g, '*')
        .replace(/X/g, '*');

      if (!/^[\d+\-*/() ]+$/.test(normalized)) return null;

      const numTokens = normalized.match(/\d+/g);
      if (!numTokens || numTokens.length !== 4) return null;

      const usedNums = numTokens.map(Number).sort((a, b) => a - b);
      const givenNums = [...state.numbers].sort((a, b) => a - b);

      for (let i = 0; i < 4; i++) {
        if (usedNums[i] !== givenNums[i]) return null;
      }

      try {
        const val = Function('"use strict"; return (' + normalized + ')')();
        if (!Number.isFinite(val)) return null;
        return { value: val };
      } catch (e) {
        return null;
      }
    }

    /** 显示反馈 */
    function showFeedback(iconHtml, text, detail, isCorrect) {
      feedback.style.display = 'block';
      feedback.className = 'game24-feedback show ' + (isCorrect ? 'correct' : 'wrong');
      fbIcon.innerHTML = iconHtml;
      fbText.textContent = text;

      // 反馈替换键盘位置（无需滚动）
      keypad.style.display = 'none';
      fbDetail.innerHTML = detail;

      // 按分类分组存储（供浮层 tab 使用）
      solutionsGrouped = {};
      state.solutions.forEach(s => {
        if (!solutionsGrouped[s.category]) solutionsGrouped[s.category] = [];
        solutionsGrouped[s.category].push(s.expr);
      });
      solutionsTab = '全部';
      showSolutionsBtn.style.display = state.solutions.length > 0 ? 'inline-block' : 'none';
    }

    function updateScore() {
      correctEl.textContent = state.correctCount;
      wrongEl.textContent = state.wrongCount;
    }

    /** 渲染当前这局已找到的解法历史 */
    function renderHistory() {
      if (state.foundSolutions.length === 0) {
        historyEl.innerHTML = '';
        return;
      }
      historyEl.innerHTML = '<div class="g24-history-label">已找到：</div>' +
        state.foundSolutions.map(s =>
          `<span class="g24-history-tag">${s}</span>`
        ).join('');
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

      disableKeys();
      state.totalCount++;

      const isCorrect = Math.abs(result.value - 24) < 0.0001;
      if (isCorrect) {
        state.correctCount++;
        const exprStr = getExpressionStr();
        if (!state.foundSolutions.includes(exprStr)) {
          state.foundSolutions.push(exprStr);
          // 全部解法找到时播放庆祝
          if (state.foundSolutions.length === state.solutions.length && state.solutions.length > 1) {
            if (Framework.sound) Framework.sound.playComplete();
          }
        }
        renderHistory();
        if (Framework.sound) Framework.sound.playCorrect();
        const remaining = state.solutions.length - state.foundSolutions.length;
        showFeedback('<i data-lucide="check-circle" style="width:36px;height:36px;color:var(--primary)"></i>', '凑出 24 了！',
          remaining > 0
            ? `还有 ${remaining} 种解法，试试能不能发现更多？`
            : '太棒了！',
          true);
        if (typeof lucide !== 'undefined') lucide.createIcons();
      } else {
        state.wrongCount++;
        if (Framework.sound) Framework.sound.playWrong();
        showFeedback('<i data-lucide="frown" style="width:36px;height:36px;color:var(--orange)"></i>', `你算的是 ${result.value}，还差一点！`,
          '再想想，换一种组合方式试试',
          false);
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
      // 直接打开解法浮层
      if (state.solutions.length > 0) {
        renderOverlay(solutionsTab);
        overlay.style.display = 'flex';
      } else {
        showFeedback('<i data-lucide="help-circle" style="width:36px;height:36px;color:var(--text-secondary)"></i>', '这道题有点难...', '试试换一题吧！', false);
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    });

    skipBtn.addEventListener('click', () => {
      if (Framework.sound) Framework.sound.playNext();
      generatePuzzle();
    });

    nextBtn.addEventListener('click', () => {
      if (Framework.sound) Framework.sound.playNext();
      generatePuzzle();
    });

    /** 渲染浮层内容（tab + 对应列表） */
    function renderOverlay(tab) {
      const cats = Object.keys(solutionsGrouped);
      // tab 栏
      const allCount = Object.values(solutionsGrouped).flat().length;
      overlayTabs.innerHTML = `<button class="g24-tab ${tab === '全部' ? 'active' : ''}" data-tab="全部">全部 (${allCount})</button>` +
        cats.map(c => `<button class="g24-tab ${tab === c ? 'active' : ''}" data-tab="${c}">${c} (${solutionsGrouped[c].length})</button>`).join('');

      // 列表（已找到的解法高亮）
      const isFound = (expr) => state.foundSolutions.includes(expr);
      const itemHtml = (expr) =>
        `<div class="g24-overlay-item${isFound(expr) ? ' found' : ''}">${expr} = 24${isFound(expr) ? ' ✓' : ''}</div>`;

      const items = tab === '全部' ? Object.entries(solutionsGrouped) : [['', solutionsGrouped[tab] || []]];
      overlayList.innerHTML = tab === '全部'
        ? items.map(([cat, exprs]) =>
            `<div class="g24-category-label">${cat}</div>` +
            exprs.map(e => itemHtml(e)).join('')
          ).join('')
        : items[0][1].map(e => itemHtml(e)).join('');
    }

    // 解法浮层
    showSolutionsBtn.addEventListener('click', () => {
      renderOverlay(solutionsTab);
      overlay.style.display = 'flex';
    });

    // tab 点击切换
    overlayTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.g24-tab');
      if (!btn) return;
      solutionsTab = btn.dataset.tab;
      renderOverlay(solutionsTab);
    });
    overlayClose.addEventListener('click', () => {
      overlay.style.display = 'none';
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });

    continueBtn.addEventListener('click', () => {
      if (Framework.sound) Framework.sound.playTap();
      // 保留同一组数字，只清空算式
      state.tokens = [];
      state.usedPositions.clear();
      state.answered = false;
      keypad.style.display = '';
      overlay.style.display = 'none';
      showSolutionsBtn.style.display = 'none';
      hideFeedback();
      updateDisplay();
      enableKeys();
    });

    // ============================================================
    // 启动
    // ============================================================
    if (Framework.sound) Framework.sound.playStart();
    generatePuzzle();

    this.onDestroy = () => {
      if (displayTimer) clearTimeout(displayTimer);
    };
  }
});
