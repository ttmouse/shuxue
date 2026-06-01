/**
 * 知识点管理系统
 * 按年级分组，每个知识点绑定一个生成器
 */
const Knowledge = (() => {

    // ============================================================
    // 知识点定义（年级 → 知识点列表）
    // ============================================================
    const GRADES = [
        {
            grade: '1~2年级',
            open: false,
            topics: [
                { id: 'add-easy',        label: '进退位加减法',   desc: '两位/三位数不进退位' },
                { id: 'multi-table',     label: '表内乘法',       desc: '九九乘法表 2×3 到 9×9' },
                { id: 'div-table',       label: '表内除法',       desc: '九九表逆运算，如 56÷7' },
            ],
        },
        {
            grade: '3~4年级',
            open: true,
            topics: [
                { id: 'add-sub',         label: '万以内加减法',   desc: '三位数进位/退位' },
                { id: 'multiplication',  label: '两位数×一位数',  desc: '如 87×6、40×27' },
                { id: 'multi-11',        label: '×11 巧算',      desc: '如 34×11=374' },
                { id: 'multi-25',        label: '×25/50 巧算',   desc: '如 25×8=200' },
                { id: 'division',        label: '除法',           desc: '三位数÷一位数、两位数÷两位' },
                { id: 'mixed',           label: '四则混合运算',   desc: '含括号、运算顺序' },
                { id: 'decimal-addsub',  label: '小数加减法',     desc: '一位/两位小数对齐' },
                { id: 'fraction-addsub', label: '同分母分数',     desc: '同分母加减，结果能约分' },
            ],
        },
        {
            grade: '5~6年级',
            open: false,
            topics: [
                { id: 'multi-hard',      label: '运算定律巧算',   desc: '分配律 99×a、101×a' },
                { id: 'double-paren',    label: '双层括号运算',   desc: '(a−b)÷(c+d)' },
                { id: 'decimal-mul',     label: '小数乘法',       desc: '小数×整数、×10/100' },
                { id: 'decimal-div',     label: '小数除法',       desc: '小数÷整数、÷10/100' },
                { id: 'fraction-hard',   label: '异分母分数',     desc: '异分母加减，需通分' },
                { id: 'percent',         label: '百分数入门',     desc: '50% = 一半、25% = 四分之一' },
                { id: 'unit-convert',    label: '单位换算',       desc: 'm↔cm、kg↔g、元↔角↔分' },
            ],
        },
    ];

    /** 获取所有年级 */
    function getGrades() { return GRADES; }

    /** 获取所有知识点 ID 列表（扁平） */
    function getAllTopicIds() {
        const ids = [];
        GRADES.forEach(g => g.topics.forEach(t => ids.push(t.id)));
        return ids;
    }

    /** 根据 ID 获取知识点 */
    function getTopic(id) {
        for (const g of GRADES) {
            for (const t of g.topics) {
                if (t.id === id) return t;
            }
        }
        return null;
    }

    /** 获取指定年级的所有知识点 ID */
    function getGradeTopicIds(gradeLabel) {
        for (const g of GRADES) {
            if (g.grade === gradeLabel) return g.topics.map(t => t.id);
        }
        return [];
    }

    return { getGrades, getAllTopicIds, getTopic, getGradeTopicIds };
})();
