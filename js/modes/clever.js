/**
 * 运算定律巧算模式
 * 训练分配律、结合律、拆分技巧等运算定律
 * 两屏架构：选择页 → 训练页
 */
Framework.register({
  id: 'clever',
  name: '运算定律巧算',
  render(container) {
    // ============================================================
    // 状态
    // ============================================================
    const state = {
      screen: 'select',       // 'select' | 'play'
      selectedCat: 'all',     // 'all' | category id
      difficulty: 'easy',
      questions: [],
      currentIndex: 0,
      correctCount: 0,
      totalCount: 0,
      streakCount: 0,
      maxStreak: 0,
      roundSize: 10,
      answered: false,
      stats: {},
    };

    let inputStr = '';
    let currentQuestion = null;
    let displayTimer = null;

    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = arr => arr[rand(0, arr.length - 1)];

    // SVG 图标
    const ICONS = {
      zap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      scissors: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
      hash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
      grid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      'arrow-r': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
      'arrow-l': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
      target: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
      check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      'corner-down-left': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 15"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>`,
      lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
      'chevron-left': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
      trophy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
      'plus-minus': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="19" x2="19" y2="19"/></svg>`,
      divide: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`,
      braces: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"/></svg>`,
      sigma: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 7V4H6l6 8-6 8h12v-3"/></svg>`,
    };

    // ============================================================
    // 分类定义
    // ============================================================
    const CATS = [
      { id: 'all',       label: '综合训练',    desc: '随机混合所有巧算题型',              icon: 'zap',      color: '#58CC02' },
      { id: 'split',     label: '拆分巧算',    desc: '99×a、101×a、98×a… 拆成整百运算', icon: 'scissors', color: '#1cb0f6' },
      { id: 'multiple',  label: '倍数巧算',    desc: '25×a、125×a 转换为乘除组合',      icon: 'hash',    color: '#c054f7' },
      { id: 'eleven',    label: '×11 巧算',   desc: '两位数×11：两头一拉中间相加',    icon: 'grid',     color: '#ff9600' },
      { id: 'distribute', label: '分配律正用',  desc: '(a±b)×c = a×c ± b×c',          icon: 'arrow-r',  color: '#ce82ff' },
      { id: 'factor',    label: '分配律逆用',  desc: '提取公因数 a×c ± b×c = (a±b)×c', icon: 'arrow-l',  color: '#ff4b4b' },
      { id: 'rounding',  label: '凑整巧算',    desc: '先凑整再运算，化繁为简',          icon: 'target',   color: '#059669' },
    ];

    // ============================================================
    // 题目生成器
    // ============================================================
    const generators = {

      // ---- 拆分巧算 ----
      split: {
        generate(diff) {
          const a = diff === 'easy' ? rand(11, 49) : rand(11, 99);
          const type = pick(['99', '101', '98', '102', '999']);
          let question, answer, breakdown, lawName;
          switch (type) {
            case '99': {
              const prod = 99 * a;
              breakdown = [`${99} × ${a}`, `= (100 − 1) × ${a}`, `= 100 × ${a} − 1 × ${a}`, `= ${100 * a} − ${a}`, `= ${prod}`];
              lawName = '拆分法：99 = 100 − 1';
              question = `99 × ${a} = ?`; answer = String(prod); break;
            }
            case '101': {
              const prod = 101 * a;
              breakdown = [`${101} × ${a}`, `= (100 + 1) × ${a}`, `= 100 × ${a} + 1 × ${a}`, `= ${100 * a} + ${a}`, `= ${prod}`];
              lawName = '拆分法：101 = 100 + 1';
              question = `101 × ${a} = ?`; answer = String(prod); break;
            }
            case '98': {
              const prod = 98 * a;
              breakdown = [`${98} × ${a}`, `= (100 − 2) × ${a}`, `= 100 × ${a} − 2 × ${a}`, `= ${100 * a} − ${2 * a}`, `= ${prod}`];
              lawName = '拆分法：98 = 100 − 2';
              question = `98 × ${a} = ?`; answer = String(prod); break;
            }
            case '102': {
              const prod = 102 * a;
              breakdown = [`${102} × ${a}`, `= (100 + 2) × ${a}`, `= 100 × ${a} + 2 × ${a}`, `= ${100 * a} + ${2 * a}`, `= ${prod}`];
              lawName = '拆分法：102 = 100 + 2';
              question = `102 × ${a} = ?`; answer = String(prod); break;
            }
            case '999': {
              const aa = diff === 'easy' ? rand(2, 9) : a;
              const prod = 999 * aa;
              breakdown = [`${999} × ${aa}`, `= (1000 − 1) × ${aa}`, `= 1000 × ${aa} − 1 × ${aa}`, `= ${1000 * aa} − ${aa}`, `= ${prod}`];
              lawName = '拆分法：999 = 1000 − 1';
              question = `999 × ${aa} = ?`; answer = String(prod); break;
            }
          }
          return { question, answer, breakdown, lawName, category: 'split' };
        }
      },

      // ---- 倍数巧算 ----
      multiple: {
        generate(diff) {
          const type = pick(['25', '125', '50']);
          const a = type === '125' ? (diff === 'easy' ? rand(2, 4) : rand(2, 8)) :
                    type === '50' ? rand(2, 9) : rand(2, diff === 'hard' ? 36 : 20);
          const base = parseInt(type);
          const prod = base * a;
          const breakdown = base === 125
            ? [`${base} × ${a}`, `= (1000 ÷ 8) × ${a}`, `= 1000 × ${a} ÷ 8`, `= ${1000 * a} ÷ 8`, `= ${prod}`, '', `💡 125×a = 1000×a ÷ 8`]
            : base === 50
            ? [`${base} × ${a}`, `= (100 ÷ 2) × ${a}`, `= 100 × ${a} ÷ 2`, `= ${100 * a} ÷ 2`, `= ${prod}`, '', `💡 50×a = 100×a ÷ 2`]
            : [`${base} × ${a}`, `= (100 ÷ 4) × ${a}`, `= 100 × ${a} ÷ 4`, `= ${100 * a} ÷ 4`, `= ${prod}`, '', `💡 25×a = 100×a ÷ 4`];
          return {
            question: `${base} × ${a} = ?`,
            answer: String(prod),
            breakdown,
            lawName: `倍数巧算：${base}×a = ...`,
            category: 'multiple',
          };
        }
      },

      // ---- ×11 巧算 ----
      eleven: {
        generate() {
          const a = rand(11, 89);
          const prod = a * 11;
          const s = String(a);
          const tens = parseInt(s[0]), ones = parseInt(s[1]);
          const mid = tens + ones;
          const carry = mid >= 10;
          const resultTens = tens + 1;
          const breakdown = [
            `${a} × 11`,
            `= ${a} × (10 + 1)`,
            `= ${a} × 10 + ${a} × 1`,
            `= ${a * 10} + ${a}`,
            `= ${prod}`,
            '',
            `📐 口诀：两头一拉，中间相加`,
            `   十位 ${tens}，个位 ${ones}`,
            `   中间 = ${tens} + ${ones} = ${mid}`,
            carry ? `   进位：十位 ${resultTens}，结果 = ${prod}` : `   → ${tens}${mid}${ones}，结果 = ${prod}`,
          ].filter(Boolean);
          return { question: `${a} × 11 = ?`, answer: String(prod), breakdown, lawName: '×11 巧算：两头一拉中间相加', category: 'eleven' };
        }
      },

      // ---- 分配律正用 ----
      distribute: {
        generate(diff) {
          const isAdd = Math.random() > 0.4;
          const c = diff === 'easy' ? rand(2, 5) : rand(2, 9);
          const a = diff === 'easy' ? rand(10, 40) : rand(10, 99);
          const bMax = isAdd ? 99 - a : a - 1;
          const b = diff === 'easy' ? rand(2, Math.min(20, bMax)) : rand(2, Math.min(50, bMax));
          if (b <= 0) return this.generate(diff);
          const ac = a * c, bc = b * c, prod = isAdd ? ac + bc : ac - bc;
          const op = isAdd ? '+' : '−';
          const breakdown = [
            `(${a} ${op} ${b}) × ${c}`, `= ${a} × ${c} ${op} ${b} × ${c}`,
            `= ${ac} ${op} ${bc}`, `= ${prod}`,
            '', `🧮 乘法分配律：(a ${op} b)×c = a×c ${op} b×c`,
          ];
          return { question: `(${a} ${op} ${b}) × ${c} = ?`, answer: String(prod), breakdown, lawName: '乘法分配律正用', category: 'distribute' };
        }
      },

      // ---- 分配律逆用 ----
      factor: {
        generate(diff) {
          const isAdd = Math.random() > 0.4;
          const c = diff === 'easy' ? rand(2, 5) : rand(2, 9);
          const a = diff === 'easy' ? rand(5, 25) : rand(5, 99);
          const bMax = isAdd ? 100 - a : a - 1;
          const b = diff === 'easy' ? rand(2, Math.min(15, bMax)) : rand(2, Math.min(50, bMax));
          if (b <= 0) return this.generate(diff);
          const ac = a * c, bc = b * c, prod = isAdd ? ac + bc : ac - bc;
          const op = isAdd ? '+' : '−';
          const sum = isAdd ? a + b : a - b;
          const breakdown = [
            `${a} × ${c} ${op} ${b} × ${c}`, `= (${a} ${op} ${b}) × ${c}`,
            `= ${sum} × ${c}`, `= ${prod}`,
            '', `🧮 提取公因数 ${c}：a×c ${op} b×c = (a ${op} b)×c`,
          ];
          return { question: `${a} × ${c} ${op} ${b} × ${c} = ?`, answer: String(prod), breakdown, lawName: '提取公因数（分配律逆用）', category: 'factor' };
        }
      },

      // ---- 凑整巧算 ----
      rounding: {
        generate(diff) {
          const templates = [];
          templates.push(() => {
            const a = rand(10, 89);
            const target = Math.ceil(a / 10) * 10;
            const b = target - a;
            if (b <= 0) return null;
            const c = diff === 'easy' ? rand(1, 9) : rand(10, 50);
            const sum = a + b + c;
            return { q: `${a} + ${b} + ${c}`, a: String(sum), bd: [`${a} + ${b} + ${c}`, `= (${a} + ${b}) + ${c}`, `= ${target} + ${c}`, `= ${sum}`, '', `💡 先凑整：${a}+${b}=${target}，再加${c}`], ln: '凑整加法' };
          });
          templates.push(() => {
            const a = rand(20, 89);
            const target = Math.ceil(a / 10) * 10;
            const b = target - a;
            if (b <= 0) return null;
            const c = rand(1, Math.min(20, target - 1));
            const sum = a + b - c;
            return { q: `${a} + ${b} − ${c}`, a: String(sum), bd: [`${a} + ${b} − ${c}`, `= (${a} + ${b}) − ${c}`, `= ${target} − ${c}`, `= ${sum}`, '', `💡 先凑整：${a}+${b}=${target}，再减${c}`], ln: '凑整加减' };
          });
          templates.push(() => {
            const a = rand(20, 70), b = rand(10, a - 5), c = rand(1, 20);
            const sum = a - b + c;
            return { q: `${a} − ${b} + ${c}`, a: String(sum), bd: [`${a} − ${b} + ${c}`, `= (${a} − ${b}) + ${c}`, `= ${a - b} + ${c}`, `= ${sum}`], ln: '交换结合' };
          });
          if (diff !== 'easy') {
            templates.push(() => {
              const base = pick([25, 125, 50]);
              const m = base === 25 ? 4 : base === 125 ? 8 : 2;
              const k = rand(1, diff === 'medium' ? 3 : 6);
              const prod = base * m * k;
              return { q: `${base} × ${m} × ${k}`, a: String(prod), bd: [`${base} × ${m} × ${k}`, `= (${base} × ${m}) × ${k}`, `= ${base * m} × ${k}`, `= ${prod}`, '', `💡 ${base}×${m}=${base*m}，再乘${k}`], ln: '凑整连乘' };
            });
          }
          const r = pick(templates)();
          return r ? { question: r.q + ' = ?', answer: r.a, breakdown: r.bd, lawName: r.ln, category: 'rounding' } : this.generate(diff);
        }
      },

      // ---- 4-6年级通用题型（包装 QuestionGenerator）----
      'add-sub': { generate(diff) {
        const r = QuestionGenerator.generateSet(['add-sub'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'add-sub' };
      }},
      'multiplication': { generate(diff) {
        const r = QuestionGenerator.generateSet(['multiplication'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'multiplication' };
      }},
      'division': { generate(diff) {
        const r = QuestionGenerator.generateSet(['division'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'division' };
      }},
      'mixed': { generate(diff) {
        const r = QuestionGenerator.generateSet(['mixed'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'mixed' };
      }},
      'decimal': { generate(diff) {
        const r = QuestionGenerator.generateSet(['decimal'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'decimal' };
      }},
      'fraction': { generate(diff) {
        const r = QuestionGenerator.generateSet(['fraction'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'fraction' };
      }},
      'double-paren': { generate(diff) {
        const r = QuestionGenerator.generateSet(['mixed'], 1, 'hard');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'double-paren' };
      }},
      'decimal-mul': { generate(diff) {
        const r = QuestionGenerator.generateSet(['decimal-mul'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'decimal-mul' };
      }},
      'decimal-div': { generate(diff) {
        const r = QuestionGenerator.generateSet(['decimal-div'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'decimal-div' };
      }},
      'fraction-hard': { generate(diff) {
        const r = QuestionGenerator.generateSet(['fraction-hard'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'fraction-hard' };
      }},
      'percent': { generate(diff) {
        const r = QuestionGenerator.generateSet(['percent'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'percent' };
      }},
      'unit-convert': { generate(diff) {
        const r = QuestionGenerator.generateSet(['unit-convert'], 1, diff || 'easy');
        const q = r.questions[0]; return { question: q.question, answer: q.answer, category: 'unit-convert' };
      }},
    };

    // ============================================================
    // 渲染函数
    // ============================================================

    function renderSelect() {
      const html = CATS.map((c, i) => `
          <div class="c-sel-card ${state.selectedCat === c.id ? 'active' : ''}"
               data-cat="${c.id}"
               style="--card-color:${c.color}; animation-delay:${i * 0.06}s">
            <div class="c-sel-card-icon" style="background:${c.color}">
              ${ICONS[c.icon] || ICONS.zap}
            </div>
            <div class="c-sel-card-body">
              <div class="c-sel-card-label">${c.label}</div>
              <div class="c-sel-card-desc">${c.desc}</div>
            </div>
            <div class="c-sel-card-check">
              ${state.selectedCat === c.id ? ICONS.check : ''}
            </div>
          </div>
        `).join('');

      container.innerHTML = `
        <div class="c-sel">
          <div class="c-sel-grid">
            ${html}
          </div>
          <div class="c-sel-bottom">
<button class="c-sel-start" id="c-start-btn">开始训练</button>
          </div>
        </div>
      `;
      container.style.overflow = '';

      // 卡片点击
      container.querySelectorAll('.c-sel-card').forEach(card => {
        card.addEventListener('click', () => {
          container.querySelectorAll('.c-sel-card').forEach(c => c.classList.remove('active'));
          container.querySelectorAll('.c-sel-card-check').forEach(c => c.textContent = '');
          card.classList.add('active');
          card.querySelector('.c-sel-card-check').innerHTML = ICONS.check;
          state.selectedCat = card.dataset.cat;
        });
      });

      // 滚动淡出效果
      const selEl = container.querySelector('.c-sel');
      const grid = container.querySelector('.c-sel-grid');
      grid.addEventListener('scroll', () => {
        selEl.classList.toggle('is-scrolled', grid.scrollTop > 0);
      });

      // 难度选择已移除，默认 easy

      // 开始
      container.querySelector('#c-start-btn').addEventListener('click', startRound);
    }

    function renderPlay() {
      container.style.overflow = 'hidden';
      container.innerHTML = `
        <div class="c-play">
          <div class="c-play-progress" id="c-progress-bar">
            <div class="c-play-pb-track">
              <div class="c-play-pb-fill" id="c-progress" style="width:0%"></div>
            </div>
            <span class="c-play-step" id="c-step">1/10</span>
            <div class="c-play-score">
              <span class="c-cor">${ICONS.check} <span id="c-correct">0</span></span>
              <span class="c-str"> <span id="c-streak">0</span></span>
            </div>
          </div>

          <div class="c-play-core">
            <div class="c-play-law" id="c-law"></div>
            <div class="c-play-q" id="c-question">99 × 34 = ?</div>
            <div class="c-play-input" id="c-input-wrap">
              <span class="c-play-input-text" id="c-input-text"></span>
              <span class="c-play-cursor" id="c-cursor">|</span>
            </div>
          </div>

          <div class="c-play-keys" id="c-keys">
            <div class="c-pr"><button class="c-key" data-v="7">7</button><button class="c-key" data-v="8">8</button><button class="c-key" data-v="9">9</button><button class="c-key c-key-bk" data-v="bk">⌫</button></div>
            <div class="c-pr"><button class="c-key" data-v="4">4</button><button class="c-key" data-v="5">5</button><button class="c-key" data-v="6">6</button><button class="c-key c-key-op" data-v="−">−</button></div>
            <div class="c-pr"><button class="c-key" data-v="1">1</button><button class="c-key" data-v="2">2</button><button class="c-key" data-v="3">3</button><button class="c-key c-key-cl" data-v="cl">清空</button></div>
            <div class="c-pr"><button class="c-key" data-v=".">.</button><button class="c-key" data-v="0">0</button><button class="c-key" data-v="/">/</button><button class="c-key c-key-go" id="c-submit">确定</button></div>
          </div>

          <div class="c-fb" id="c-fb" style="display:none">
            <div class="c-fb-icon" id="c-fb-icon"></div>
            <div class="c-fb-title" id="c-fb-title"></div>
            <div class="c-fb-law" id="c-fb-law"></div>
            <div class="c-fb-bd" id="c-fb-bd"></div>
            <button class="c-fb-next" id="c-fb-next">下一题</button>
          </div>

          <div class="c-result" id="c-result" style="display:none">
            <div class="c-result-icon">${ICONS.trophy}</div>
            <div class="c-result-title" id="c-result-title">完成！</div>
            <div class="c-result-ring" id="c-result-ring">
              <svg viewBox="0 0 36 36">
                <circle class="c-result-ring-bg" cx="18" cy="18" r="15.9"/>
                <circle class="c-result-ring-fill" cx="18" cy="18" r="15.9"
                  stroke-dasharray="100" stroke-dashoffset="100" id="c-ring-fill"/>
              </svg>
              <div class="c-result-ring-text">
                <div class="c-result-ring-pct" id="c-ring-pct">0%</div>
                <div class="c-result-ring-label">正确率</div>
              </div>
            </div>
            <div class="c-result-stats" id="c-result-stats"></div>
            <div class="c-result-cats" id="c-result-cats"></div>
            <div class="c-result-actions">
              <button class="c-result-btn c-result-btn-primary" id="c-restart">再来一轮</button>
              <button class="c-result-btn c-result-btn-ghost" id="c-view-wb">查看错题本</button>
              <button class="c-result-btn c-result-btn-ghost" id="c-back-sel">返回选择</button>
            </div>
          </div>
        </div>
      `;

      // --- DOM 引用 ---
      const qEl = container.querySelector('#c-question');
      const display = container.querySelector('#c-input-text');
      const cursor = container.querySelector('#c-cursor');
      const inputWrap = container.querySelector('#c-input-wrap');
      const lawEl = container.querySelector('#c-law');
      const fb = container.querySelector('#c-fb');
      const fbIcon = container.querySelector('#c-fb-icon');
      const fbTitle = container.querySelector('#c-fb-title');
      const fbLaw = container.querySelector('#c-fb-law');
      const fbBd = container.querySelector('#c-fb-bd');
      const fbNext = container.querySelector('#c-fb-next');
      const submit = container.querySelector('#c-submit');
      const keys = container.querySelector('#c-keys');
      const pbFill = container.querySelector('#c-progress');
      const stepEl = container.querySelector('#c-step');
      // Score shown in framework top bar only
      const resultScreen = container.querySelector('#c-result');
      const resultTitle = container.querySelector('#c-result-title');
      const resultStats = container.querySelector('#c-result-stats');
      const resultCats = container.querySelector('#c-result-cats');

      // --- 输入 ---
      function updateInput() {
        display.textContent = inputStr;
        cursor.style.visibility = inputStr === '' ? 'visible' : 'hidden';
        inputWrap.classList.toggle('has-val', inputStr !== '');
      }
      function clearInput() { inputStr = ''; updateInput(); }

      // --- 键盘事件 ---
      keys.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled || state.answered) return;
        const v = btn.dataset.v;
        if (v === 'bk') { inputStr = inputStr.slice(0, -1); updateInput(); }
        else if (v === 'cl') { clearInput(); }
      });
      container.querySelectorAll('.c-key:not(.c-key-bk):not(.c-key-cl):not(#c-submit)').forEach(btn => {
        btn.addEventListener('click', () => {
          if (state.answered) return;
          const v = btn.dataset.v;
          if (v === '−' && inputStr === '') inputStr = '-';
          else inputStr += v;
          updateInput();
          if (Framework.sound) Framework.sound.playTap();
        });
      });

      // 键盘快捷键
      // 使容器可聚焦，PC 键盘直接输入
      container.setAttribute('tabindex', '-1');
      container.focus();

      container.addEventListener('keydown', e => {
        if (state.answered || state.screen !== 'play') return;
        const k = e.key;
        if (/^[0-9]$/.test(k)) { inputStr += k; updateInput(); if(Framework.sound)Framework.sound.playTap(); e.preventDefault(); }
        else if (k === 'Backspace') { inputStr = inputStr.slice(0, -1); updateInput(); if(Framework.sound)Framework.sound.playErase(); e.preventDefault(); }
        else if (k === 'Enter') { submitAnswer(); e.preventDefault(); }
        else if (k === '-' && inputStr === '') { inputStr = '-'; updateInput(); e.preventDefault(); }
        else if (k === '.' || k === '/') { inputStr += k; updateInput(); e.preventDefault(); }
      });

      // --- 提交 ---
      function compareAnswers(user, correct) {
        user = user.trim().replace(/−/g, '-'); correct = correct.trim().replace(/−/g, '-');
        if (user === correct) return true;
        const u = parseFloat(user), c = parseFloat(correct);
        if (!isNaN(u) && !isNaN(c)) { if (Number.isInteger(c) && Number.isInteger(u)) return u === c; if (Math.abs(u - c) < 0.001) return true; }
        const frac = s => { const p = s.split('/'); if (p.length===2) { const n=parseFloat(p[0]),d=parseFloat(p[1]); if(!isNaN(n)&&!isNaN(d)&&d!==0) return n/d; } return NaN; };
        const uf = frac(user), cf = frac(correct);
        return !isNaN(uf) && !isNaN(cf) && Math.abs(uf - cf) < 0.001;
      }

      function submitAnswer() {
        if (state.answered || !currentQuestion) return;
        const ans = inputStr.trim();
        if (ans === '') {
          display.textContent = '输入答案';
          display.className = 'c-play-input-text err';
          cursor.style.visibility = 'hidden';
          displayTimer = setTimeout(() => { display.className = 'c-play-input-text'; updateInput(); }, 1000);
          return;
        }

        state.answered = true;
        state.totalCount++;
        keys.style.pointerEvents = 'none';
        keys.style.opacity = '0.4';

        const q = currentQuestion;
        const isCorrect = compareAnswers(ans, q.answer);
        if (!state.stats[q.category]) state.stats[q.category] = { correct: 0, total: 0 };
        state.stats[q.category].total++;

        if (isCorrect) {
          state.correctCount++; state.streakCount++;
          if (state.streakCount > state.maxStreak) state.maxStreak = state.streakCount;
          state.stats[q.category].correct++;
          if (Framework.sound) Framework.sound.playCorrect();
        } else {
          state.streakCount = 0;
          if (Framework.sound) Framework.sound.playWrong();
          if (typeof WrongBook !== 'undefined') {
            WrongBook.add({
              question: q.question,
              correctAnswer: q.answer,
              userAnswer: ans,
              type: 'clever-' + q.category,
              typeLabel: CATS.find(c => c.id === q.category)?.label || q.category,
            });
          }
        }
        // 答对答错都快速反馈，不展示拆解过程
        qEl.innerHTML = isCorrect
          ? q.question.replace('?', `<span class="c-play-ok">${q.answer}</span>`)
          : q.question.replace('?', `<span class="c-play-no">${ans}</span>`);
        fbTimer = setTimeout(() => advanceQuestion(), 600);
      }
      submit.addEventListener('click', submitAnswer);


      // --- 下一题 / 自动跳转 ---
      function advanceQuestion() {
        if (fbTimer) clearTimeout(fbTimer);
        state.currentIndex++;
        keys.style.display = '';
        if (state.currentIndex >= state.questions.length) {
          showResults();
          return;
        }
        renderQuestion();
      }
      fbNext.addEventListener('click', advanceQuestion);

      // --- 查看错题本 ---
      container.querySelector('#c-view-wb')?.addEventListener('click', () => {
        if (typeof showGlobalWrongBook === 'function') showGlobalWrongBook();
      });

      // --- 返回（结果页→选择页） ---
      container.querySelector('#c-back-sel')?.addEventListener('click', () => {
        state.screen = 'select';
        renderSelect();
      });

      // --- 渲染题目 ---
      function renderQuestion() {
        const q = state.questions[state.currentIndex];
        if (!q) return;
        currentQuestion = q;
        qEl.innerHTML = typeof highlightOperators === 'function' ? highlightOperators(q.question) : q.question;
        lawEl.textContent = q.lawName || '';
        const pct = (state.currentIndex / state.questions.length) * 100;
        pbFill.style.width = pct + '%';
        stepEl.textContent = `${state.currentIndex + 1}/${state.questions.length}`;
        // cat badge removed — no duplicate header
        clearInput();
        fb.style.display = 'none';
        keys.style.display = '';
        keys.style.pointerEvents = 'auto';
        keys.style.opacity = '1';
        state.answered = false;
        display.className = 'c-play-input-text';
        inputWrap.classList.remove('has-val');
        cursor.style.visibility = 'visible';
      }

      function showResults() {
        keys.style.display = 'none';
        fb.style.display = 'none';
        inputWrap.style.display = 'none';
        qEl.style.display = 'none';
        lawEl.style.display = 'none';
        document.getElementById('c-progress-bar').style.display = 'none';
        resultScreen.style.display = 'flex';
        const total = state.totalCount, correct = state.correctCount;
        const rate = total > 0 ? Math.round(correct / total * 100) : 0;
        let title;
        if (rate === 100) { title = '满分通关！运算定律大师！'; if (Framework.sound) Framework.sound.playComplete(); }
        else if (rate >= 80) title = '非常优秀！继续挑战更高难度！';
        else if (rate >= 60) title = '不错！多练几次会更熟练！';
        else title = '加油！看看拆解过程，理解规律！';
        resultTitle.textContent = title;

        const ringFill = document.getElementById('c-ring-fill');
        const ringPct = document.getElementById('c-ring-pct');
        const circumference = 2 * Math.PI * 15.9;
        if (ringFill) {
          ringFill.style.strokeDasharray = circumference;
          ringFill.style.strokeDashoffset = circumference - (rate / 100) * circumference;
        }
        if (ringPct) ringPct.textContent = rate + '%';

        resultStats.innerHTML = `
          <div class="c-rs-row correct-row"><span>正确数</span><span>${correct}/${total}</span></div>
          <div class="c-rs-row streak-row"><span>最高连对</span><span>${state.maxStreak} 题</span></div>
        `;

        const catEntries = Object.entries(state.stats).filter(([_,s]) => s.total > 0);
        if (catEntries.length > 0) {
          resultCats.innerHTML = '<div class="c-rc-title">各类正确率</div>' +
            catEntries.map(([id, s]) => {
              const pct = Math.round((s.correct / s.total) * 100);
              return `<div class="c-rc-row">
                <span>${CATS.find(c=>c.id===id)?.label||id}</span>
                <div class="c-rc-bar"><div class="c-rc-fill" style="width:${pct}%"></div></div>
                <span>${pct}%</span>
              </div>`;
            }).join('');
        } else { resultCats.innerHTML = ''; }

        // 记录统计
        if (typeof Stats !== 'undefined' && typeof Stats.recordPractice === 'function') {
          const topics = state.questions.map(q => 'clever-' + (q.category || 'unknown'));
          const topicDetails = {};
          Object.entries(state.stats).forEach(([id, s]) => {
            if (s.total > 0) {
              topicDetails['clever-' + id] = { label: CATS.find(c => c.id === id)?.label || id, correct: s.correct, total: s.total };
            }
          });
          Stats.recordPractice(total, correct, topics, 'easy', topicDetails);
        }
      }

      // --- 启动 ---
      renderQuestion();
      if (Framework.sound) Framework.sound.playStart();
    }

    // ============================================================
    // 工具
    // ============================================================
    function updateScore(corEl, strEl) {
      if (corEl) corEl.textContent = state.correctCount;
      if (strEl) strEl.textContent = state.streakCount;
    }

    function getActiveIds() {
      return state.selectedCat === 'all'
        ? ['split', 'multiple', 'eleven', 'distribute', 'factor', 'rounding']
        : [state.selectedCat];
    }

    /** 生成题目并启动训练 */
    function startRound() {
      const activeIds = getActiveIds();
      const questions = [];
      for (let i = 0; i < state.roundSize; i++) {
        const id = activeIds[i % activeIds.length];
        const gen = generators[id];
        if (gen) {
          const q = gen.generate(state.difficulty);
          q.category = id;
          questions.push(q);
        }
      }

      state.questions = questions;
      state.currentIndex = 0;
      state.correctCount = 0;
      state.totalCount = 0;
      state.streakCount = 0;
      state.maxStreak = 0;
      state.stats = {};
      state.answered = false;
      inputStr = '';
      currentQuestion = null;
      state.screen = 'play';
      location.hash = '#/clever/play';

      renderPlay();
    }

    // ============================================================
    // 初始渲染
    // ============================================================
    state.screen = 'select';
    renderSelect();

    this.onDestroy = () => {
      if (displayTimer) clearTimeout(displayTimer);
      if (typeof fbTimer !== 'undefined' && fbTimer) clearTimeout(fbTimer);
    };
  }
});