/**
 * 错题本管理模块
 * 使用 localStorage 持久化存储
 * v2 — 支持错题频次统计、按题型筛选
 */

const WrongBook = (() => {
    const STORAGE_KEY = 'math_wrong_book';

    /** 获取所有错题 */
    function getAll() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    /** 保存错题列表 */
    function saveAll(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    /** 添加一条错题（相同题目累加次数，不重复录入） */
    function add(record) {
        const items = getAll();
        const existing = items.find(item => item.question === record.question);

        if (existing) {
            existing.count = (existing.count || 1) + 1;
            existing.lastWrongDate = new Date().toISOString();
            if (!existing.userAnswers) existing.userAnswers = [existing.userAnswer || existing.userAnswers?.[0] || ''];
            existing.userAnswers.push(record.userAnswer);
            delete existing.userAnswer; // 旧字段，迁移到 userAnswers 数组
            saveAll(items);
            return items.length;
        }

        items.push({
            id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            question: record.question,
            correctAnswer: record.correctAnswer,
            userAnswers: [record.userAnswer],
            type: record.type,
            typeLabel: record.typeLabel,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            }),
            count: 1,
        });
        saveAll(items);
        return items.length;
    }

    /** 删除一条错题 */
    function remove(id) {
        const items = getAll().filter(item => item.id !== id);
        saveAll(items);
        return items;
    }

    /** 清空所有错题 */
    function clear() {
        saveAll([]);
    }

    /** 获取错题数量 */
    function getCount() {
        return getAll().length;
    }

    /** 题型大类 → 具体 type 映射 */
    const TYPE_GROUP = {
        'add-sub':     ['add-sub', 'add-easy', 'add-sub-easy', 'add-sub-carry', 'add-sub-mix'],
        'multiplication': ['multiplication', 'multi-table', 'multi-11', 'multi-25', 'multi-hard', 'mul-basic', 'mul-carry', 'mul-ten', 'mul-3digit'],
        'division':    ['division', 'div-table', 'div-basic', 'div-ten', 'div-2digit'],
        'mixed':       ['mixed', 'double-paren', 'mixed-basic', 'mixed-paren', 'dp-basic', 'dp-hard', 'calc-no-paren', 'calc-small-paren', 'calc-mid-paren'],
        'law':         ['law-add-comm', 'law-add-assoc', 'law-sub-prop', 'law-mul-comm', 'law-mul-dist', 'law-div-prop'],
        'decimal':     ['decimal', 'decimal-addsub', 'decimal-mul', 'decimal-div', 'dec-addsub-easy', 'dec-addsub-hard', 'dec-addsub-mix', 'dec-addsub-law', 'dec-mul-int', 'dec-mul-ten', 'dec-mul-dec', 'dec-div-int', 'dec-div-ten', 'dec-compare', 'dec-point-move'],
        'fraction':    ['fraction', 'fraction-addsub', 'fraction-hard', 'frac-add', 'frac-sub', 'frac-mix', 'frac-hard-add', 'frac-hard-sub'],
        'percent':     ['percent', 'pct-of', 'pct-frac'],
        'unit-convert': ['unit-convert', 'uc-length', 'uc-weight', 'uc-time', 'uc-money'],
        'clever':      ['clever-split', 'clever-multiple', 'clever-eleven', 'clever-distribute', 'clever-factor', 'clever-rounding'],
    };

    /** 按题型筛选（支持大类匹配） */
    function getByType(type) {
        if (!type || type === 'all') return getAll();
        const matchTypes = TYPE_GROUP[type] || [type];
        return getAll().filter(item => matchTypes.includes(item.type));
    }

    /** 获取错题按题型分组的统计 */
    function getTypeStats() {
        const items = getAll();
        const stats = {};
        Object.keys(TYPE_GROUP).forEach(group => {
            const count = items.filter(item => TYPE_GROUP[group].includes(item.type)).length;
            if (count > 0) stats[group] = count;
        });
        return stats;
    }

    /** 获取按日期分组的错题 */
    function getGroupedByDate(items) {
        const list = items || getAll();
        const groups = {};
        list.forEach(item => {
            const key = item.date || '未知日期';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }

    /** 获取指定数量的错题（用于重练） */
    function getRetryQuestions(limit, type) {
        let items = type && type !== 'all' ? getAll().filter(item => item.type === type) : getAll();
        items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return items.slice(0, limit || items.length);
    }

    /** 获取错题按错误次数排序的统计 */
    function getTopWrong(limit) {
        const items = getAll();
        items.sort((a, b) => (b.count || 1) - (a.count || 1));
        return items.slice(0, limit || items.length);
    }

    return {
        getAll,
        add,
        remove,
        clear,
        getCount,
        getByType,
        getGroupedByDate,
        getRetryQuestions,
        getTopWrong,
    };
})();
