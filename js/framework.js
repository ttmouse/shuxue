/**
 * 数学思维训练 — 框架核心
 * 负责：模式注册、导航切换、公用服务
 */
const Framework = (() => {

  // ============================================================
  // 模式注册表
  // ============================================================
  const registry = {};
  let currentMode = null;

  // DOM 引用
  const $ = id => document.getElementById(id);
  const homeView = $('view-home');
  const modeView = $('view-mode');
  const modeTitle = $('mode-title');
  const modeContent = $('mode-content');

  // ============================================================
  // 公开 API
  // ============================================================
  const api = {
    /** 注册一个训练模式 */
    register(mode) {
      registry[mode.id] = mode;
    },

    /** 为已注册的模式补充 render 函数（模式文件调用，需在注册之后） */
    provideRender(modeId, renderFn) {
      if (registry[modeId]) {
        registry[modeId].render = renderFn;
      }
    },

    /** 切换到指定模式 */
    navigate(modeId) {
      // 销毁当前模式
      if (currentMode && registry[currentMode]?.onDestroy) {
        registry[currentMode].onDestroy();
      }

      // 特殊处理：旧版口算模式
      if (modeId === 'practice') {
        homeView.style.display = 'none';
        modeView.style.display = 'none';
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-home').classList.add('active');
        currentMode = 'practice';
        return;
      }
      // 其他模式恢复内容区展示
      modeContent.style.display = '';

      const mode = registry[modeId];
      if (!mode) return;

      // 隐藏旧版页面（如果刚从旧模式过来）
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

      currentMode = modeId;
      modeTitle.textContent = mode.name || modeId;

      // 切换到模式视图
      homeView.style.display = 'none';
      modeView.style.display = 'flex';

      // 清空并渲染
      modeContent.innerHTML = '';

      if (typeof mode.render === 'function') {
        mode.render(modeContent);
      } else {
        // 没有 render 的模式显示"即将上线"
        modeContent.innerHTML = `
          <div class="coming-soon">
            <div class="coming-soon-icon"><i data-lucide="construction" style="width:56px;height:56px;color:var(--orange);stroke-width:1.5;"></i></div>
            <h3 class="coming-soon-title">即将上线</h3>
            <p class="coming-soon-desc">该模式正在开发中，敬请期待</p>
            <button class="btn btn-primary" onclick="Framework.goHome()" style="margin-top:var(--s6);">返回首页</button>
          </div>
        `;
      }
    },

    /** 返回首页 */
    goHome() {
      if (currentMode && registry[currentMode]?.onDestroy) {
        registry[currentMode].onDestroy();
      }
      currentMode = null;

      // 隐藏旧版页面
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

      // 显示首页
      modeView.style.display = 'none';
      homeView.style.display = 'flex';
    },

    /** 获取已注册的模式列表（用于渲染选择页） */
    getModes() {
      return Object.values(registry);
    },

    /** 公用服务 */
    sound: null,   // 由外部注入
    stats: null,
  };

  return api;
})();
