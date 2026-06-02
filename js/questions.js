/**
 * 四年级口算题目生成器
 *
 * 设计原则：所有题目必须能用心算（无纸笔）完成。
 *
 * 题型难度说明：
 *   简单 — 一步运算，数字较小或整齐
 *   中等 — 一步运算但需进位/退位，或运用基本口算技巧
 *   困难 — 需要运用运算定律（分配律/结合律等）进行巧算
 *
 * 题型：
 *   add-sub    — 整数加减法
 *   multiplication — 乘法口算（含运算定律巧算）
 *   division   — 除法（整除）
 *   mixed      — 四则混合运算（两步）
 *   decimal    — 小数加减法
 *   fraction   — 同分母分数加减法
 */

const QuestionGenerator = (() => {

    // ============================================================
    // 工具函数
    // ============================================================
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = arr => arr[rand(0, arr.length - 1)];
    const shuffle = arr => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = rand(0, i);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, a % b);
    const reduceFraction = (num, den) => {
        if (num === 0) return '0';
        if (num === den) return '1';
        const g = gcd(num, den);
        const n = num / g, d = den / g;
        return d === 1 ? `${n}` : `${n}/${d}`;
    };

    // ============================================================
    // 题型生成器
    // ============================================================

    const generators = {

        // ----------------------------------------------------------
        // 整数加减法 — 三位数以内
        // ----------------------------------------------------------
        'add-sub': {
            label: '加减法',
            generate: (difficulty) => {
                let a, b, op, answer;
                if (difficulty === 'easy') {
                    a = rand(100, 999); b = rand(1, 99);
                    op = pick(['+', '-']);
                    answer = op === '+' ? a + b : a - b;
                    if (answer < 0) { b = rand(1, a); answer = a - b; }
                } else if (difficulty === 'medium') {
                    a = rand(100, 999); b = rand(100, 999);
                    op = pick(['+', '-']);
                    answer = op === '+' ? a + b : a - b;
                    if (answer < 0) [a, b] = [b, a], answer = a - b;
                } else {
                    a = rand(1000, 9999); b = rand(100, 999);
                    op = pick(['+', '-']);
                    answer = op === '+' ? a + b : a - b;
                    if (answer < 0) [a, b] = [b, a], answer = a - b;
                }
                return {
                    question: `${a} ${op === '+' ? '+' : '-'} ${b} = ?`,
                    answer: String(answer),
                    typeLabel: '加减法'
                };
            }
        },

        // ----------------------------------------------------------
        // 乘法 — 口算友好，不含需要竖式计算的两位数×两位数
        // ----------------------------------------------------------
        'multiplication': {
            label: '乘法',
            generate: (difficulty) => {
                let a, b, answer, tip;
                if (difficulty === 'easy') {
                    // 两位数×一位数：23×4=92
                    a = rand(11, 99); b = rand(2, 9);
                    answer = a * b;
                } else if (difficulty === 'medium') {
                    // 中等乘法：多种技巧混合
                    const medTemplates = [
                        // 整十数×两位数：60×42=2520
                        () => ({ a: rand(2, 9) * 10, b: rand(11, 99)}),
                        // 两位数×11：34×11=374
                        () => ({ a: rand(11, 89), b: 11 }),
                        // 25/50 × 一位数（b≥4）
                        () => ({ a: pick([25, 50]), b: rand(4, 9) }),
                        // 两位数×一位数（进阶）：87×6=522
                        () => ({ a: rand(11, 99), b: rand(2, 9)}),
                    ];
                    const mt = pick(medTemplates)();
                    a = mt.a; b = mt.b; answer = a * b;
                } else {
                    // 困难：运用运算定律巧算
                    // 所有题目都可以用分配律/结合律简化心算
                    const hardTemplates = [
                        // 99×a：99×34=3400-34=3366
                        () => {
                            const a = rand(11, 99);
                            return { q: `99 × ${a}`, a: 99 * a, tip: '💡 99×a = 100×a − a' };
                        },
                        // 101×a：101×56=5600+56=5656
                        () => {
                            const a = rand(11, 99);
                            return { q: `101 × ${a}`, a: 101 * a, tip: '💡 101×a = 100×a + a' };
                        },
                        // 25×两位数：25×36=25×4×9=900
                        () => {
                            const b = pick([4, 8, 12, 16, 20, 24, 28, 32, 36]);
                            return { q: `25 × ${b}`, a: 25 * b, tip: '💡 25×a = 100×a÷4' };
                        },
                        // 125×一位数：125×6=750
                        () => {
                            const b = pick([2, 4, 6, 8]);
                            return { q: `125 × ${b}`, a: 125 * b, tip: '💡 125×a = 1000×a÷8' };
                        },
                        // 两位数×一位数（大数）：87×6=522（可拆为80×6+7×6）
                        () => {
                            const a = rand(11, 99), b = rand(2, 9);
                            const tens = Math.floor(a / 10) * 10, ones = a % 10;
                            return { q: `${a} × ${b}`, a: a * b, tip: `💡 ${a}×${b} = ${tens}×${b} + ${ones}×${b}` };
                        },
                    ];
                    const ht = pick(hardTemplates)();
                    a = ht.q; b = 0; answer = ht.a; tip = ht.tip;
                    return {
                        question: `${a} = ?`,
                        answer: String(answer),
                        typeLabel: '巧算',
                        tip: tip,
                    };
                }
                return {
                    question: `${a} × ${b} = ?`,
                    answer: String(answer),
                    typeLabel: '乘法'
                };
            }
        },

        // ----------------------------------------------------------
        // 除法 — 整除
        // ----------------------------------------------------------
        'division': {
            label: '除法',
            generate: (difficulty) => {
                let a, b, answer, signed;
                if (difficulty === 'easy') {
                    b = rand(2, 9); answer = rand(2, 30);
                    a = answer * b;
                } else if (difficulty === 'medium') {
                    b = rand(2, 9); answer = rand(10, 99);
                    a = answer * b;
                } else {
                    // 除数是两位数 — 四年级核心
                    const templates = [
                        // 整十数除法：360÷40=9
                        () => {
                            const ans = rand(2, 9), d = rand(2, 9);
                            return { a: ans * d * 10, b: d * 10, ans: ans };
                        },
                        // 几百几十÷两位：240÷30=8
                        () => {
                            const ans = rand(2, 9), d = rand(2, 6);
                            return { a: ans * d * 10, b: d * 10, ans: ans };
                        },
                        // 两位数÷两位数整除：84÷14=6
                        () => {
                            const b = rand(11, 49), ans = rand(2, 9);
                            return { a: b * ans, b: b, ans: ans };
                        },
                    ];
                    const t = pick(templates)();
                    a = t.a; b = t.b; answer = t.ans;
                }
                return {
                    question: `${a} ÷ ${b} = ?`,
                    answer: String(answer),
                    typeLabel: '除法'
                };
            }
        },

        // ----------------------------------------------------------
        // 四则混合运算 — 含步骤
        // ----------------------------------------------------------
        'mixed': {
            label: '混合运算',
            generate: (difficulty) => {
                // ===== 基础模板 =====
                const T = {
                    ab_c: () => {
                        const a = rand(10, 79), b = rand(10, 79);
                        const c = difficulty === 'easy' ? rand(2, 4) : rand(2, 6);
                        const s1 = a + b, ans = s1 * c;
                        return { q: `(${a} + ${b}) × ${c}`, a: ans, steps: [`${a} + ${b} = ${s1}`, `${s1} × ${c} = ${ans}`] };
                    },
                    a_bc: () => {
                        const a = rand(10, 49), b = rand(2, 7), c = rand(1, 99);
                        const s1 = a * b, ans = s1 + c;
                        return { q: `${a} × ${b} + ${c}`, a: ans, steps: [`先算乘法：${a} × ${b} = ${s1}`, `再算加法：${s1} + ${c} = ${ans}`] };
                    },
                    a_b_c: () => {
                        const a = rand(10, 49), b = rand(2, 7), c = rand(1, a * b - 1);
                        const s1 = a * b, ans = s1 - c;
                        return { q: `${a} × ${b} − ${c}`, a: ans, steps: [`先算乘法：${a} × ${b} = ${s1}`, `再算减法：${s1} − ${c} = ${ans}`] };
                    },
                    a_c: () => {
                        const a = rand(30, 79), b = rand(10, a - 5);
                        const c = difficulty === 'easy' ? rand(2, 4) : rand(2, 6);
                        const s1 = a - b, ans = s1 * c;
                        return { q: `(${a} − ${b}) × ${c}`, a: ans, steps: [`${a} − ${b} = ${s1}`, `${s1} × ${c} = ${ans}`] };
                    },
                    a_bc2: () => {
                        const a = rand(10, 99), b = rand(2, 9), c = rand(2, 7);
                        const s1 = b * c, ans = a + s1;
                        return { q: `${a} + ${b} × ${c}`, a: ans, steps: [`先算乘法：${b} × ${c} = ${s1}`, `再算加法：${a} + ${s1} = ${ans}`] };
                    },
                    a_bc3: () => {
                        const b = rand(2, 9), c = rand(2, 6);
                        const s1 = b * c, a = rand(s1 + 20, s1 + 100), ans = a - s1;
                        return { q: `${a} − ${b} × ${c}`, a: ans, steps: [`先算乘法：${b} × ${c} = ${s1}`, `再算减法：${a} − ${s1} = ${ans}`] };
                    },
                    ab_c_div: () => {
                        const c = rand(2, 9), ans = rand(5, 30);
                        const sum = ans * c, a = rand(1, sum - 1), b = sum - a;
                        const s1 = a + b;
                        return { q: `(${a} + ${b}) ÷ ${c}`, a: ans, steps: [`${a} + ${b} = ${s1}`, `${s1} ÷ ${c} = ${ans}`] };
                    },
                };
                // ===== 双层括号 =====
                const DOUBLE = {
                    a_b_c_d_div: () => {
                        const c = rand(1, 9), d = rand(1, 9), sum = c + d, ans = rand(5, 50);
                        const diff = ans * sum, a = rand(diff + 20, diff + 200), b = a - diff;
                        const s1 = a - b, s2 = c + d;
                        return { q: `(${a} − ${b}) ÷ (${c} + ${d})`, a: ans, steps: [`${a} − ${b} = ${s1}`, `${c} + ${d} = ${s2}`, `${s1} ÷ ${s2} = ${ans}`] };
                    },
                    a_b_c_d_mul: () => {
                        const c = rand(4, 9), d = rand(1, c - 2), diff = c - d;
                        const a = rand(10, 89), b = rand(10, 89), s1 = a + b, s2 = c - d, ans = s1 * s2;
                        return { q: `(${a} + ${b}) × (${c} − ${d})`, a: ans, steps: [`${a} + ${b} = ${s1}`, `${c} − ${d} = ${s2}`, `${s1} × ${s2} = ${ans}`] };
                    },
                    a_b_c_d_mul2: () => {
                        const c = rand(1, 9), d = rand(1, 9), sum = c + d;
                        const a = rand(30, 99), b = rand(10, a - 5), s1 = a - b, s2 = c + d, ans = s1 * s2;
                        return { q: `(${a} − ${b}) × (${c} + ${d})`, a: ans, steps: [`${a} − ${b} = ${s1}`, `${c} + ${d} = ${s2}`, `${s1} × ${s2} = ${ans}`] };
                    },
                };

                let result;
                if (difficulty === 'easy') {
                    result = pick([T.ab_c, T.a_bc, T.a_b_c, T.a_c])();
                } else if (difficulty === 'medium') {
                    result = pick([T.ab_c, T.a_bc, T.a_b_c, T.a_c, T.a_bc2, T.a_bc3, T.ab_c_div])();
                } else {
                    result = pick([T.ab_c, T.a_bc, T.a_b_c, T.a_c, T.a_bc2, T.a_bc3, ...Object.values(DOUBLE)])();
                }
                return {
                    question: result.q + ' = ?',
                    answer: String(result.a),
                    typeLabel: '混合运算',
                    steps: result.steps,
                };
            }
        },

        // ----------------------------------------------------------
        // 小数加减法
        // ----------------------------------------------------------
        'decimal': {
            label: '小数运算',
            generate: (difficulty) => {
                let a, b, op, answer;
                if (difficulty === 'easy') {
                    const p1 = rand(1, 9), p2 = rand(1, 9);
                    a = parseFloat(`${rand(1, 9)}.${p1}`);
                    b = parseFloat(`${rand(1, 9)}.${p2}`);
                } else if (difficulty === 'medium') {
                    const p1 = rand(10, 99), p2 = rand(10, 99);
                    a = parseFloat(`${rand(1, 9)}.${p1}`);
                    b = parseFloat(`${rand(1, 9)}.${p2}`);
                } else {
                    const p1 = rand(1, 99), p2 = rand(1, 99);
                    a = parseFloat(`${rand(10, 99)}.${p1}`);
                    b = parseFloat(`${rand(10, 99)}.${p2}`);
                }
                op = pick(['+', '-']);
                answer = parseFloat((op === '+' ? a + b : a - b).toFixed(2));
                if (answer < 0) [a, b] = [b, a], answer = parseFloat((op === '+' ? a + b : a - b).toFixed(2));
                return {
                    question: `${a} ${op} ${b} = ?`,
                    answer: String(answer),
                    typeLabel: '小数运算'
                };
            }
        },

        // ----------------------------------------------------------
        // 同分母分数加减法
        // ----------------------------------------------------------
        'fraction': {
            label: '分数运算',
            generate: (difficulty) => {
                let num1, num2, den, op, ans;
                const pickDen = (easy) => easy ? pick([2, 3, 4, 5, 6, 8, 10]) : pick([6, 8, 9, 10, 12, 15, 16, 18, 20]);
                den = pickDen(difficulty === 'easy');
                num1 = rand(1, den - 1);
                op = pick(['+', '−']);
                const maxNum2 = difficulty === 'hard' ? den - 1 : (op === '-' ? num1 - 1 : den - 1);
                do { num2 = rand(1, den - 1); } while (num2 > maxNum2);
                ans = op === '+' ? num1 + num2 : num1 - num2;
                if (ans <= 0) return generators['fraction'].generate(difficulty);
                const finalAns = reduceFraction(ans, den);
                return {
                    question: `${num1}/${den} ${op} ${num2}/${den} = ?`,
                    answer: finalAns,
                    typeLabel: '分数运算'
                };
            }
        },

        // ----------------------------------------------------------
        // 表内乘法
        // ----------------------------------------------------------
        'multi-table': {
            label: '表内乘法',
            generate: () => {
                const a = rand(2, 9), b = rand(2, 9);
                return { question: `${a} × ${b} = ?`, answer: String(a * b), typeLabel: '表内乘法' };
            }
        },

        // ----------------------------------------------------------
        // 表内除法
        // ----------------------------------------------------------
        'div-table': {
            label: '表内除法',
            generate: () => {
                const b = rand(2, 9), ans = rand(2, 9), a = ans * b;
                return { question: `${a} ÷ ${b} = ?`, answer: String(ans), typeLabel: '表内除法' };
            }
        },

        // ----------------------------------------------------------
        // ×11 巧算
        // ----------------------------------------------------------
        'multi-11': {
            label: '×11 巧算',
            generate: () => {
                const a = rand(11, 89);
                return { question: `${a} × 11 = ?`, answer: String(a * 11), typeLabel: '×11 巧算', tip: '两位数×11：十位和个位相加，插中间。如 34×11=3(3+4)4=374' };
            }
        },

        // ----------------------------------------------------------
        // ×25/50 巧算
        // ----------------------------------------------------------
        'multi-25': {
            label: '×25/50 巧算',
            generate: () => {
                const base = pick([25, 50]), b = rand(4, 9);
                return { question: `${base} × ${b} = ?`, answer: String(base * b), typeLabel: '巧算', tip: base === 25 ? '25×a = 100×a÷4' : '50×a = 100×a÷2' };
            }
        },

        // ----------------------------------------------------------
        // 小数乘法
        // ----------------------------------------------------------
        'decimal-mul': {
            label: '小数乘法',
            generate: (diff) => {
                if (diff === 'easy') {
                    const a = rand(1, 99), f = pick([10, 100]);
                    return { question: `${a} × ${f} = ?`, answer: String(a * f), typeLabel: '小数乘法' };
                }
                const int = rand(1, 9), dec = rand(1, 9), a = parseFloat(`${int}.${dec}`), b = rand(2, 9);
                return { question: `${a} × ${b} = ?`, answer: String(parseFloat((a * b).toFixed(2))), typeLabel: '小数乘法' };
            }
        },

        // ----------------------------------------------------------
        // 小数除法
        // ----------------------------------------------------------
        'decimal-div': {
            label: '小数除法',
            generate: (diff) => {
                if (diff === 'easy') {
                    const a = rand(100, 999), f = pick([10, 100]);
                    return { question: `${a} ÷ ${f} = ?`, answer: String(a / f), typeLabel: '小数除法' };
                }
                const b = rand(2, 9), ans = rand(10, 99), a = ans * b;
                return { question: `${a} ÷ ${b} = ?`, answer: String(a / b), typeLabel: '小数除法' };
            }
        },

        // ----------------------------------------------------------
        // 异分母分数加减
        // ----------------------------------------------------------
        'fraction-hard': {
            label: '异分母分数',
            generate: () => {
                let d1 = pick([2,3,4]), d2 = d1 * 2, n1 = rand(1,d1-1), n2 = rand(1,d2-1);
                const op = pick(['+','-']);
                let ansNum = op === '+' ? n1*d2 + n2*d1 : n1*d2 - n2*d1;
                if (ansNum <= 0) return generators['fraction-hard'].generate();
                const ans = reduceFraction(ansNum, d1*d2);
                return { question: `${n1}/${d1} ${op} ${n2}/${d2} = ?`, answer: ans, typeLabel: '异分母分数' };
            }
        },

        // ----------------------------------------------------------
        // 百分数
        // ----------------------------------------------------------
        'percent': {
            label: '百分数',
            generate: () => {
                const pct = pick([10,20,25,30,40,50,60,75,80,90,100]), base = pick([20,40,50,60,80,100,120,200]);
                return { question: `${pct}% 的 ${base} = ?`, answer: String(pct/100*base), typeLabel: '百分数' };
            }
        },

        // ----------------------------------------------------------
        // 单位换算
        // ----------------------------------------------------------
        'unit-convert': {
            label: '单位换算',
            generate: () => {
                const table = [
                    () => { const v=rand(1,99); return {q:`${v} m = ? cm`, a:v*100}; },
                    () => { const v=rand(100,999); return {q:`${v} cm = ? m`, a:v/100}; },
                    () => { const v=rand(1,9); return {q:`${v} km = ? m`, a:v*1000}; },
                    () => { const v=rand(1,99); return {q:`${v} kg = ? g`, a:v*1000}; },
                    () => { const v=rand(1,9); return {q:`${v} 时 = ? 分`, a:v*60}; },
                    () => { const v=rand(1,99); return {q:`${v} 元 = ? 角`, a:v*10}; },
                ];
                const r = pick(table)();
                return { question: r.q, answer: String(r.a), typeLabel: '单位换算' };
            }
        },

        // ---- 加减法子维度 ----
        'add-sub-easy': { generate: d => generators['add-sub'].generate('easy') },
        'add-sub-carry': { generate: d => generators['add-sub'].generate('medium') },
        'add-sub-mix': {
            generate: () => {
                const a = rand(100, 899), b = rand(1, 99), c = rand(1, 99);
                const s1 = a + b, ans = s1 - c;
                return { question: `${a} + ${b} - ${c} = ?`, answer: String(ans), typeLabel: '加减混合' };
            }
        },
        'mul-basic': {
            generate: () => {
                const a = rand(11, 99), b = rand(2, 4);
                return { question: `${a} × ${b} = ?`, answer: String(a * b), typeLabel: '乘法' };
            }
        },
        'mul-carry': {
            generate: () => {
                const a = rand(11, 99), b = rand(5, 9);
                return { question: `${a} × ${b} = ?`, answer: String(a * b), typeLabel: '乘法' };
            }
        },
        'mul-ten': {
            generate: () => {
                const a = rand(2, 9) * 10, b = rand(11, 99);
                return { question: `${a} × ${b} = ?`, answer: String(a * b), typeLabel: '乘法' };
            }
        },
        'mul-3digit': {
            generate: () => {
                const a = pick([rand(100, 300), rand(400, 999)]), b = rand(2, 4);
                return { question: `${a} × ${b} = ?`, answer: String(a * b), typeLabel: '乘法' };
            }
        },
        'div-basic': { generate: d => generators['division'].generate('easy') },
        'div-ten': { generate: d => generators['division'].generate('hard') },
        'div-2digit': {
            generate: () => {
                const b = rand(11, 49), ans = rand(2, 9);
                return { question: `${b * ans} ÷ ${b} = ?`, answer: String(ans), typeLabel: '除法' };
            }
        },
        'mixed-basic': {
            generate: () => {
                const a = rand(10, 49), b = rand(2, 7), c = rand(1, 99);
                const s1 = a * b, ans = s1 + c;
                return { question: `${a} × ${b} + ${c} = ?`, answer: String(ans), typeLabel: '混合运算' };
            }
        },
        'mixed-paren': {
            generate: () => {
                const a = rand(10, 79), b = rand(10, 79), c = rand(2, 5);
                const s1 = a + b, ans = s1 * c;
                return { question: `(${a} + ${b}) × ${c} = ?`, answer: String(ans), typeLabel: '混合运算' };
            }
        },
        'dec-addsub-easy': {
            generate: () => {
                const a = parseFloat(`${rand(1, 9)}.${rand(1, 9)}`);
                const b = parseFloat(`${rand(1, 9)}.${rand(1, 9)}`);
                const ans = parseFloat((a + b).toFixed(2));
                return { question: `${a} + ${b} = ?`, answer: String(ans), typeLabel: '小数加减' };
            }
        },
        'dec-addsub-hard': {
            generate: () => {
                const a = parseFloat(`${rand(1, 9)}.${rand(10, 99)}`);
                const b = parseFloat(`${rand(1, 9)}.${rand(10, 99)}`);
                const ans = parseFloat((a + b).toFixed(2));
                return { question: `${a} + ${b} = ?`, answer: String(ans), typeLabel: '小数加减' };
            }
        },
        'dec-addsub-mix': {
            generate: () => {
                const a = parseFloat(`${rand(1, 99)}.${rand(1, 99)}`);
                const b = pick([10, 20, 30]);
                const c = parseFloat(`${rand(1, 9)}.${rand(1, 9)}`);
                const s1 = a + b, ans = parseFloat((s1 - c).toFixed(2));
                return { question: `${a} + ${b} - ${c} = ?`, answer: String(ans), typeLabel: '小数加减' };
            }
        },
        'dec-addsub-law': {
            generate: () => {
                const a = parseFloat(`${rand(10, 99)}.${rand(10, 99)}`);
                const b = parseFloat(`${rand(1, 9)}.${rand(1, 9)}`);
                const c = parseFloat(`${rand(1, 9)}.${rand(1, 9)}`);
                const ans = parseFloat((a - b - c).toFixed(2));
                return { question: `${a} - ${b} - ${c} = ?`, answer: String(ans), typeLabel: '小数运算' };
            }
        },
        'frac-add': {
            generate: () => {
                const den = pick([3, 4, 5, 6, 7, 8, 9, 10]);
                const n1 = rand(1, den - 2), n2 = rand(1, den - n1 - 1);
                const ans = reduceFraction(n1 + n2, den);
                return { question: `${n1}/${den} + ${n2}/${den} = ?`, answer: ans, typeLabel: '分数加法' };
            }
        },
        'frac-sub': {
            generate: () => {
                const den = pick([3, 4, 5, 6, 7, 8, 9, 10]);
                const n1 = rand(2, den - 1), n2 = rand(1, n1 - 1);
                const ans = reduceFraction(n1 - n2, den);
                return { question: `${n1}/${den} - ${n2}/${den} = ?`, answer: ans, typeLabel: '分数减法' };
            }
        },
        'frac-mix': {
            generate: () => {
                const den = pick([4, 5, 6, 8, 10]);
                const n1 = rand(1, den - 3), n2 = rand(1, den - 3), n3 = rand(1, den - 3);
                const ans = reduceFraction(n1 + n2 + n3, den);
                return { question: `${n1}/${den} + ${n2}/${den} + ${n3}/${den} = ?`, answer: ans, typeLabel: '分数连加' };
            }
        },
        'dp-basic': {
            generate: () => {
                const a = rand(10, 79), b = rand(10, 79), c = rand(2, 5);
                const s1 = a + b, ans = s1 * c;
                return { question: `(${a} + ${b}) × ${c} = ?`, answer: String(ans), typeLabel: '混合运算' };
            }
        },
        'dp-hard': {
            generate: () => {
                const c = rand(2, 6), d = rand(2, 6), sum = c + d, ans = rand(4, 30);
                const diff = ans * sum, a = rand(diff + 20, diff + 200), b = a - diff;
                return { question: `(${a} - ${b}) ÷ (${c} + ${d}) = ?`, answer: String(ans), typeLabel: '混合运算' };
            }
        },
        'dec-mul-int': { generate: d => generators['decimal-mul'].generate('medium') },
        'dec-mul-ten': { generate: d => generators['decimal-mul'].generate('easy') },
        'dec-mul-dec': {
            generate: () => {
                const a = parseFloat(`${rand(1, 9)}.${rand(1, 9)}`);
                const b = parseFloat(`0.${rand(1, 9)}`);
                return { question: `${a} × ${b} = ?`, answer: String(parseFloat((a * b).toFixed(2))), typeLabel: '小数乘法' };
            }
        },
        'dec-div-int': {
            generate: () => {
                const b = rand(2, 9), ans = rand(10, 99), a = ans * b;
                return { question: `${a} ÷ ${b} = ?`, answer: String(a / b), typeLabel: '小数除法' };
            }
        },
        'dec-div-ten': { generate: d => generators['decimal-div'].generate('easy') },
        'frac-hard-add': {
            generate: () => {
                let d1 = pick([2, 3, 4]), d2 = pick([3, 4, 5]), n1 = rand(1, d1 - 1), n2 = rand(1, d2 - 1);
                while (d1 === d2) d2 = pick([3, 4, 5]);
                const ans = reduceFraction(n1 * d2 + n2 * d1, d1 * d2);
                return { question: `${n1}/${d1} + ${n2}/${d2} = ?`, answer: ans, typeLabel: '异分母加法' };
            }
        },
        'frac-hard-sub': {
            generate: () => {
                let d1 = pick([2, 3, 4]), d2 = pick([3, 4, 5]), n1 = rand(2, d1 - 1), n2 = rand(1, d2 - 1);
                while (d1 === d2) d2 = pick([3, 4, 5]);
                const ansNum = n1 * d2 - n2 * d1;
                if (ansNum <= 0) return generators['frac-hard-sub'].generate();
                return { question: `${n1}/${d1} - ${n2}/${d2} = ?`, answer: reduceFraction(ansNum, d1 * d2), typeLabel: '异分母减法' };
            }
        },
        'pct-of': { generate: d => generators['percent'].generate() },
        'pct-frac': {
            generate: () => {
                const pairs = [
                    [10, '1/10'], [20, '1/5'], [25, '1/4'], [50, '1/2'],
                    [75, '3/4'], [40, '2/5'], [60, '3/5'], [80, '4/5'],
                ];
                const [pct, frac] = pick(pairs);
                return { question: `${pct}% = ?（填分数）`, answer: frac, typeLabel: '百分数互化' };
            }
        },
        'uc-length': {
            generate: () => {
                const t = pick([
                    () => { const v = rand(1, 99); return { q: `${v} m = ? cm`, a: v * 100 }; },
                    () => { const v = rand(1, 9); return { q: `${v} km = ? m`, a: v * 1000 }; },
                    () => { const v = rand(100, 999); return { q: `${v} cm = ? m`, a: v / 100 }; },
                ]);
                return { question: t().q, answer: String(t().a), typeLabel: '长度换算' };
            }
        },
        'uc-weight': {
            generate: () => {
                const t = pick([
                    () => { const v = rand(1, 99); return { q: `${v} kg = ? g`, a: v * 1000 }; },
                    () => { const v = rand(1, 9); return { q: `${v} t = ? kg`, a: v * 1000 }; },
                ]);
                return { question: t().q, answer: String(t().a), typeLabel: '重量换算' };
            }
        },
        'uc-time': {
            generate: () => {
                const t = pick([
                    () => { const v = rand(1, 9); return { q: `${v} 时 = ? 分`, a: v * 60 }; },
                    () => { const v = pick([60, 120, 180, 240]); return { q: `${v} 分 = ? 时`, a: v / 60 }; },
                ]);
                return { question: t().q, answer: String(t().a), typeLabel: '时间换算' };
            }
        },
        'uc-money': {
            generate: () => {
                const v = rand(1, 99);
                return { question: `${v} 元 = ? 角`, answer: String(v * 10), typeLabel: '货币换算' };
            }
        },

        // ---- 四则运算子维度 ----
        'calc-no-paren': { generate: d => generators['mixed-basic'].generate() },
        'calc-small-paren': { generate: d => generators['mixed-paren'].generate() },
        'calc-mid-paren': {
            generate: () => {
                const a = rand(10, 99), b = rand(10, 99), c = rand(10, 99), d = rand(2, 9);
                const s1 = b + c, s2 = a + s1, ans = s2 * d;
                return { question: `${d} × [${a} + (${b} + ${c})] = ?`, answer: String(ans), typeLabel: '混合运算' };
            }
        },

        // ---- 运算定律子维度 ----
        'law-add-comm': {
            generate: () => {
                const a = rand(10, 99), b = rand(10, 99), c = rand(10, 99);
                return { question: `${a} + ${b} + ${c} = ?`, answer: String(a + b + c), typeLabel: '加法交换律' };
            }
        },
        'law-add-assoc': {
            generate: () => {
                const a = rand(10, 50), b = rand(10, 50), c = rand(10, 50);
                return { question: `${a} + ${b} + ${c} = ?`, answer: String(a + b + c), typeLabel: '加法结合律' };
            }
        },
        'law-sub-prop': {
            generate: () => {
                const a = rand(50, 200), b = rand(2, 20), c = rand(2, 20);
                return { question: `${a} - ${b} - ${c} = ?`, answer: String(a - b - c), typeLabel: '减法性质' };
            }
        },
        'law-mul-comm': {
            generate: () => {
                const a = rand(2, 9), b = rand(10, 99), c = rand(2, 9);
                return { question: `${a} × ${b} × ${c} = ?`, answer: String(a * b * c), typeLabel: '乘法交换律' };
            }
        },
        'law-mul-dist': {
            generate: () => {
                const a = pick([99, 101, 98, 102]), b = rand(11, 89);
                return { question: `${a} × ${b} = ?`, answer: String(a * b), typeLabel: '乘法分配律' };
            }
        },
        'law-div-prop': {
            generate: () => {
                const b = rand(2, 9), c = rand(2, 9), ans = rand(10, 30), a = ans * b * c;
                return { question: `${a} ÷ ${b} ÷ ${c} = ?`, answer: String(ans), typeLabel: '除法性质' };
            }
        },

        // ---- 小数意义子维度 ----
        'dec-compare': {
            generate: () => {
                const a = parseFloat(`${rand(1, 99)}.${rand(1, 9)}`);
                const b = parseFloat(`${rand(1, 99)}.${rand(1, 9)}`);
                const sym = a > b ? '>' : a < b ? '<' : '=';
                return { question: `${a} ○ ${b}`, answer: sym, typeLabel: '小数比大小' };
            }
        },
        'dec-point-move': {
            generate: () => {
                const f = pick([10, 100, 1000, 10000]);
                const int = rand(1, 999), dec = rand(1, 999);
                const a = parseFloat(`${int}.${dec}`);
                return { question: `${a} × ${f} = ?`, answer: String(a * f), typeLabel: '小数点移动' };
            }
        },
    };

function generateSet(topics, count, difficulty) {
        const activeGenerators = topics.filter(t => generators[t]);
        if (activeGenerators.length === 0) {
            activeGenerators.push(...Object.keys(generators));
        }

        const questions = [];
        const topicCounts = {};
        activeGenerators.forEach(t => topicCounts[t] = 0);

        for (let i = 0; i < count; i++) {
            const topic = activeGenerators[i % activeGenerators.length];
            const gen = generators[topic];
            const q = gen.generate(difficulty);
            questions.push({ ...q, type: topic });
            topicCounts[topic]++;
        }

        shuffle(questions);
        return { questions, topicCounts };
    }

    function getTopicLabel(type) {
        return generators[type]?.label || type;
    }

    return {
        generateSet,
        getTopicLabel,
    };
})();
