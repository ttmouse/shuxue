/**
 * 每日练习统计模块
 */
const Stats = (() => {
    const KEY = 'math_practice_stats';

    function getAll() {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || [];
        } catch { return []; }
    }

    function saveAll(data) {
        localStorage.setItem(KEY, JSON.stringify(data));
    }

    /** 记录一次练习结果 */
    function recordPractice(total, correct, topics, difficulty) {
        const all = getAll();
        const today = new Date().toLocaleDateString('zh-CN');

        let day = all.find(d => d.date === today);
        if (!day) {
            day = { date: today, total: 0, correct: 0, sessions: 0, topics: {} };
            all.push(day);
        }

        day.total += total;
        day.correct += correct;
        day.sessions = (day.sessions || 0) + 1;

        (topics || []).forEach(t => {
            day.topics[t] = (day.topics[t] || 0) + 1;
        });

        saveAll(all);
        return day;
    }

    /** 获取今日统计 */
    function getToday() {
        const today = new Date().toLocaleDateString('zh-CN');
        const all = getAll();
        return all.find(d => d.date === today) || null;
    }

    /** 获取本周统计（最近7天） */
    function getWeek() {
        const all = getAll();
        return all.slice(-7);
    }

    /** 获取总练习量 */
    function getTotal() {
        const all = getAll();
        return {
            total: all.reduce((s, d) => s + d.total, 0),
            correct: all.reduce((s, d) => s + d.correct, 0),
            days: all.length,
        };
    }

    return { recordPractice, getToday, getWeek, getTotal };
})();
