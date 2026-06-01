/**
 * 音效模块 — 使用 Web Audio API 生成简单音效，无需外部文件
 */
const Sound = (() => {
    let ctx = null;

    function getCtx() {
        if (!ctx) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        return ctx;
    }

    /** 播放一个简单的音调 */
    function playTone(freq, duration, type, volume) {
        const c = getCtx();
        if (!c) return;
        // 如果 AudioContext 被挂起（自动播放策略），尝试恢复
        if (c.state === 'suspended') c.resume();

        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = type || 'sine';       // sine, square, triangle, sawtooth
        osc.frequency.setValueAtTime(freq, c.currentTime);

        gain.gain.setValueAtTime(volume || 0.3, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    }

    /** 答对：上升双音 */
    function playCorrect() {
        playTone(523, 0.15, 'sine', 0.25);   // C5
        setTimeout(() => playTone(659, 0.2, 'sine', 0.25), 100);  // E5
    }

    /** 答错：低沉短音 */
    function playWrong() {
        playTone(220, 0.3, 'sawtooth', 0.15);  // A3
    }

    /** 翻题：轻快点击 */
    function playNext() {
        playTone(880, 0.05, 'sine', 0.15);  // A5
    }

    /** 完成庆祝：上升琶音 */
    function playComplete() {
        playTone(523, 0.15, 'sine', 0.2);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 120);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 240);
        setTimeout(() => playTone(1047, 0.3, 'sine', 0.25), 360);
    }

    return {
        playCorrect,
        playWrong,
        playNext,
        playComplete,
    };
})();
