/**
 * 知识点管理系统
 * 按年级分组，每个知识点绑定一个生成器
 */
const Knowledge = (() => {

    const GRADES = [
        {
            grade: '1年级',
            open: false,
            topics: [
                { id: 'add-easy',        label: '进退位加减法',   desc: '两位/三位数不进退位' },
                { id: 'multi-table',     label: '表内乘法',       desc: '九九乘法表 2×3 到 9×9' },
                { id: 'div-table',       label: '表内除法',       desc: '九九表逆运算，如 56÷7' },
            ],
        },
        {
            grade: '2年级',
            open: false,
            topics: [
                { id: 'add-sub-easy',    label: '不进位加减法',   desc: '如 123+456、789-345' },
            ],
        },
        {
            grade: '3年级',
            open: true,
            topics: [
                {
                    id: 'add-sub',         label: '万以内加减法',   desc: '三位数进位/退位',
                    subtopics: [
                        { id: 'add-sub-easy',    label: '不进位加减法',   desc: '如 123+456、789-345' },
                        { id: 'add-sub-carry',   label: '进位/退位加减法', desc: '如 178+256、823-456' },
                        { id: 'add-sub-mix',     label: '加减混合运算',   desc: '如 123+456-78' },
                    ],
                },
                {
                    id: 'multiplication',  label: '两位数×一位数',  desc: '如 87×6、40×27',
                    subtopics: [
                        { id: 'mul-basic',       label: '不进位乘法',     desc: '如 23×2、31×3' },
                        { id: 'mul-carry',       label: '进位乘法',       desc: '如 87×6、56×8' },
                        { id: 'mul-ten',         label: '整十数×两位数',  desc: '如 60×42' },
                        { id: 'mul-3digit',      label: '三位数×一位数',  desc: '如 125×3、204×4' },
                    ],
                },
                {
                    id: 'division',        label: '除法',           desc: '三位数÷一位数',
                    subtopics: [
                        { id: 'div-basic',       label: '三位数÷一位数',  desc: '如 96÷3、248÷4' },
                        { id: 'div-ten',         label: '整十数÷整十数',  desc: '如 360÷40' },
                        { id: 'div-2digit',      label: '两位数÷两位数',  desc: '如 84÷14' },
                    ],
                },
                {
                    id: 'fraction',        label: '同分母分数',     desc: '同分母加减',
                    subtopics: [
                        { id: 'frac-add',        label: '同分母加法',     desc: '如 2/7+3/7' },
                        { id: 'frac-sub',        label: '同分母减法',     desc: '如 5/8-3/8' },
                        { id: 'frac-mix',        label: '连加连减',      desc: '如 1/5+2/5+3/5' },
                    ],
                },
            ],
        },
        {
            grade: '4年级',
            open: false,
            topics: [
                {
                    id: 'calc-order',      label: '四则运算',       desc: '运算顺序、括号运用',
                    subtopics: [
                        { id: 'calc-no-paren',   label: '不含括号的四则运算', desc: '如 9×104+545+483' },
                        { id: 'calc-small-paren', label: '含小括号的四则运算', desc: '如 (8+1)×399+350' },
                        { id: 'calc-mid-paren',  label: '含中括号的四则运算', desc: '如 8×[498+(286+109)]' },
                    ],
                },
                {
                    id: 'law-arithmetic',  label: '运算定律',       desc: '加法交换律、结合律、分配律',
                    subtopics: [
                        { id: 'law-add-comm',    label: '加法交换律',     desc: '如 36+79+14' },
                        { id: 'law-add-assoc',   label: '加法结合律',     desc: '如 34+22+18' },
                        { id: 'law-sub-prop',    label: '减法运算性质',   desc: '如 544-8-12' },
                        { id: 'law-mul-comm',    label: '乘法交换律和结合律', desc: '如 2×365×5' },
                        { id: 'law-mul-dist',   label: '乘法分配律',     desc: '如 99×25' },
                        { id: 'law-div-prop',    label: '除法运算性质',   desc: '如 260÷2÷5' },
                    ],
                },
                {
                    id: 'dec-meaning',     label: '小数的意义和性质', desc: '比大小、小数点移动',
                    subtopics: [
                        { id: 'dec-compare',     label: '小数比大小',     desc: '如 9.7（）10.2' },
                        { id: 'dec-point-move',  label: '小数点移动',     desc: '如 0.224×10000' },
                    ],
                },
                {
                    id: 'decimal',         label: '小数的加法和减法', desc: '进退位、混合运算',
                    subtopics: [
                        { id: 'dec-addsub-easy', label: '不进退位',      desc: '如 62.6+1.2' },
                        { id: 'dec-addsub-hard', label: '进退位',        desc: '如 3.5+7.4' },
                        { id: 'dec-addsub-mix',  label: '加减混合运算',  desc: '如 13.6+21+39' },
                        { id: 'dec-addsub-law',  label: '定律推广到小数',desc: '如 6.54-3.4-2.6' },
                    ],
                },
            ],
        },
        {
            grade: '5年级',
            open: false,
            topics: [
                { id: 'multi-hard',      label: '运算定律巧算',   desc: '分配律 99×a、101×a' },
                {
                    id: 'decimal-mul',     label: '小数乘法',       desc: '小数×整数、×10/100',
                    subtopics: [
                        { id: 'dec-mul-int',     label: '小数×整数',     desc: '如 3.5×6' },
                        { id: 'dec-mul-ten',     label: '小数×10/100',   desc: '如 4.2×10' },
                        { id: 'dec-mul-dec',     label: '小数×小数',     desc: '如 2.5×0.4' },
                    ],
                },
                {
                    id: 'decimal-div',     label: '小数除法',       desc: '小数÷整数、÷10/100',
                    subtopics: [
                        { id: 'dec-div-int',     label: '小数÷整数',     desc: '如 6.4÷4' },
                        { id: 'dec-div-ten',     label: '小数÷10/100',   desc: '如 37.5÷10' },
                    ],
                },
                {
                    id: 'fraction-hard',   label: '异分母分数',     desc: '异分母加减，需通分',
                    subtopics: [
                        { id: 'frac-hard-add',   label: '异分母加法',     desc: '如 1/2+1/3' },
                        { id: 'frac-hard-sub',   label: '异分母减法',     desc: '如 3/4-1/6' },
                    ],
                },
            ],
        },
        {
            grade: '6年级',
            open: false,
            topics: [
                {
                    id: 'double-paren',    label: '双层括号运算',   desc: '(a−b)÷(c+d)',
                    subtopics: [
                        { id: 'dp-basic',        label: '简单双层括号',   desc: '如 (a+b)÷c+d' },
                        { id: 'dp-hard',         label: '复杂双层括号',   desc: '如 (a-b)÷(c+d)' },
                    ],
                },
                {
                    id: 'percent',         label: '百分数',         desc: '50% = 一半、25% = 四分之一',
                    subtopics: [
                        { id: 'pct-of',          label: '求一个数的百分比', desc: '如 50%的80' },
                        { id: 'pct-frac',        label: '百分数与分数互化', desc: '如 25%=1/4' },
                    ],
                },
                {
                    id: 'unit-convert',    label: '单位换算',       desc: 'm↔cm、kg↔g、元↔角↔分',
                    subtopics: [
                        { id: 'uc-length',       label: '长度单位',       desc: 'm↔cm、km↔m' },
                        { id: 'uc-weight',       label: '重量单位',       desc: 'kg↔g、t↔kg' },
                        { id: 'uc-time',         label: '时间单位',       desc: '时↔分、分↔秒' },
                        { id: 'uc-money',        label: '货币单位',       desc: '元↔角↔分' },
                    ],
                },
            ],
        },
    ];

    function getGrades() { return GRADES; }

    function getAllTopicIds() {
        const ids = [];
        GRADES.forEach(g => g.topics.forEach(t => {
            if (t.subtopics) {
                t.subtopics.forEach(s => ids.push(s.id));
            } else {
                ids.push(t.id);
            }
        }));
        return ids;
    }

    function getTopic(id) {
        for (const g of GRADES) {
            for (const t of g.topics) {
                if (t.id === id) return t;
                if (t.subtopics) {
                    const sub = t.subtopics.find(s => s.id === id);
                    if (sub) return sub;
                }
            }
        }
        return null;
    }

    function getGradeTopicIds(gradeLabel) {
        for (const g of GRADES) {
            if (g.grade === gradeLabel) return g.topics.map(t => t.id);
        }
        return [];
    }

    function getSubTopicIds(parentId) {
        for (const g of GRADES) {
            for (const t of g.topics) {
                if (t.id === parentId && t.subtopics) {
                    return t.subtopics.map(s => s.id);
                }
            }
        }
        return [];
    }

    return { getGrades, getAllTopicIds, getTopic, getGradeTopicIds, getSubTopicIds };
})();
