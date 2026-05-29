// ==========================================
// 移动端菜单切换功能
// ==========================================

// 定义并立即执行一个函数，用于初始化移动端菜单
(function initMenu() {
  // 获取汉堡菜单按钮元素
  const toggle = document.querySelector('.menu-toggle');
  // 获取导航链接列表元素
  const nav = document.querySelector('.nav-links');
  // 如果按钮或导航不存在，直接退出
  if (!toggle || !nav) return;

  // 点击汉堡按钮时，切换导航菜单的显示状态
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  // 遍历导航中的所有链接
  nav.querySelectorAll('a').forEach(link => {
    // 点击链接后自动关闭菜单
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  // 点击页面任意位置时
  document.addEventListener('click', (e) => {
    // 如果点击不在header区域内，则关闭菜单
    if (!e.target.closest('.header-inner')) {
      nav.classList.remove('open');
      toggle.classList.remove('active');
    }
  });
})(); // 立即执行此函数


// ==========================================
// 暗黑模式切换
// ==========================================

(function initDarkMode() {
  var html = document.documentElement;
  var stored = localStorage.getItem('theme');

  // 应用已保存的主题
  if (stored === 'dark') {
    html.setAttribute('data-theme', 'dark');
  }

  // 创建切换按钮
  var toggle = document.createElement('button');
  toggle.className = 'theme-toggle';
  toggle.setAttribute('aria-label', '切换暗黑模式');
  toggle.innerHTML = stored === 'dark' ? '☀' : '☾';

  // 插入到导航栏
  var headerInner = document.querySelector('.header-inner');
  if (headerInner) {
    headerInner.appendChild(toggle);
  }

  // 点击切换
  toggle.addEventListener('click', function () {
    var isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      toggle.innerHTML = '☾';
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      toggle.innerHTML = '☀';
    }
  });
})();


// ==========================================
// YAML 前置元数据解析器
// 从 Markdown 文件头部提取标题、分类、日期等信息
// ==========================================

/**
 * 解析 Markdown 文本中的 YAML 前置元数据
 * @param {string} mdText - 完整的 Markdown 文件内容
 * @returns {object} { meta: {title, category, date, tags, excerpt}, body: 正文内容 }
 */
function parseFrontmatter(mdText) {
  // 定义元数据的默认值结构
  const meta = { title: '', category: '', date: '', tags: [], excerpt: '' };
  // 使用正则匹配位于文件开头的 --- 包裹的 YAML 内容
  const match = mdText.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  // 如果没有找到前置元数据，直接返回默认值和完整文本作为正文
  if (!match) return { meta, body: mdText };

  // match[1] 是 YAML 部分的纯文本内容
  const yaml = match[1];
  // match[0] 是整个 --- 包裹区域，剩下的就是正文
  const body = mdText.slice(match[0].length);

  // 按换行符分割 YAML 的每一行
  yaml.split('\n').forEach(line => {
    // 查找 ": " 分隔符的位置
    const sep = line.indexOf(': ');
    // 如果没有分隔符则跳过该行
    if (sep === -1) return;
    // 冒号前是键名
    const key = line.slice(0, sep).trim();
    // 冒号后是值
    let val = line.slice(sep + 2).trim();

    // 如果是 tags 字段，需要特殊处理数组格式
    if (key === 'tags') {
      // 去掉方括号，按逗号分割，去除空白，过滤空字符串
      val = val.replace(/^\[|\]$/g, '').split(',').map(t => t.trim()).filter(Boolean);
      meta.tags = val;
    } else if (key === 'title' || key === 'category' || key === 'date' || key === 'excerpt') {
      // 其他字段直接赋值
      meta[key] = val;
    }
  });

  // 返回解析出的元数据和正文
  return { meta, body };
}


// ==========================================
// 博客数据引擎
// ==========================================

// posts.json 的文件路径（仅存储 slug 列表）
const POSTS_JSON = '../posts/posts.json';
// 缓存文章列表，避免重复请求
let postsCache = null;

/**
 * 获取所有文章的元数据列表
 * @param {boolean} force - 是否强制刷新缓存
 * @returns {Array} 文章对象数组 [{ slug, title, category, date, tags, excerpt }]
 */
async function fetchPosts(force) {
  // 如果缓存存在且不强制刷新，直接返回缓存结果
  if (postsCache && !force) return postsCache;

  try {
    // 第一步：从 posts.json 获取所有 slug 列表
    const res = await fetch(POSTS_JSON);
    // 如果请求失败，抛出错误
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // 解析 JSON 得到 slug 字符串数组
    const slugs = await res.json();

    // 第二步：遍历每个 slug，获取对应的 .md 文件并解析前置元数据
    const posts = [];
    for (const slug of slugs) {
      try {
        // 请求对应的 Markdown 文件
        const mdRes = await fetch(`../posts/${slug}.md`);
        // 如果文件不存在或请求失败，跳过
        if (!mdRes.ok) continue;
        // 读取文件文本内容
        const mdText = await mdRes.text();
        // 解析前置元数据
        const { meta } = parseFrontmatter(mdText);
        // 将 slug 和元数据合并存入数组
        posts.push({ slug, ...meta });
      } catch (err) {
        // 单个文件加载失败时只打印警告，不中断整体流程
        console.warn(`Failed to load ${slug}.md:`, err);
      }
    }

    // 存入缓存供后续使用
    postsCache = posts;
    return posts;
  } catch (err) {
    // 整体加载失败时打印错误并返回空数组
    console.error('Failed to load posts:', err);
    return [];
  }
}

/**
 * 从 URL 查询参数中获取当前文章的 slug
 * @returns {string|null} slug 值
 */
function getSlug() {
  // 解析浏览器 URL 中的查询参数
  const params = new URLSearchParams(window.location.search);
  // 返回 slug 参数的值
  return params.get('slug');
}

/**
 * 生成文章的链接 URL
 * @param {string} slug - 文章标识
 * @returns {string} 完整的文章页 URL
 */
function postUrl(slug) {
  // 将 slug 编码后拼接到 post.html 的查询参数中
  return `post.html?slug=${encodeURIComponent(slug)}`;
}


// ==========================================
// 首页：渲染文章列表
// ==========================================

async function initIndex() {
  // 获取文章列表容器元素
  const container = document.getElementById('post-list');
  // 如果当前页面没有此元素（非首页），直接返回
  if (!container) return;

  // 获取所有文章数据
  const posts = await fetchPosts();
  // 如果没有文章，显示提示信息
  if (!posts.length) {
    container.innerHTML = '<p style="color:#888;text-align:center;padding:48px 0;">No posts yet.</p>';
    return;
  }

  // 将文章数组渲染为 HTML 卡片列表
  container.innerHTML = posts.map(post => `
    <article class="post-card">
      <div class="post-meta">
        <span class="post-category">${post.category}</span>
        &nbsp;·&nbsp; ${post.date}
      </div>
      <h2><a href="${postUrl(post.slug)}">${post.title}</a></h2>
      <p class="post-excerpt">${post.excerpt}</p>
      <a href="${postUrl(post.slug)}" class="read-more">Read More</a>
    </article>
  `).join('');
}


// ==========================================
// 侧边栏：渲染分类、最新文章、标签
// ==========================================

async function initSidebar() {
  // 获取侧边栏容器
  const sidebar = document.querySelector('.sidebar');
  // 如果当前页面没有侧边栏，直接返回
  if (!sidebar) return;

  // 获取所有文章数据
  const posts = await fetchPosts();
  // 没有文章则无需渲染侧边栏
  if (!posts.length) return;

  // ---- 分类列表 ----
  const catWidget = sidebar.querySelector('#sidebar-categories');
  if (catWidget) {
    // 统计每个分类的文章数量
    const catMap = {};
    posts.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
    // 渲染分类列表（分类名 + 文章数量）
    catWidget.innerHTML = Object.entries(catMap).map(([cat, count]) => `
      <li><a href="#">${cat}</a><span class="count">${count}</span></li>
    `).join('');
  }

  // ---- 最新文章（取前 5 篇）----
  const recentWidget = sidebar.querySelector('#sidebar-recent');
  if (recentWidget) {
    const recent = [...posts].slice(0, 5);
    recentWidget.innerHTML = recent.map(p => `
      <li>
        <div class="recent-title"><a href="${postUrl(p.slug)}">${p.title}</a></div>
        <div class="recent-date">${p.date}</div>
      </li>
    `).join('');
  }

  // ---- 标签云（去重后的所有标签）----
  const tagsWidget = sidebar.querySelector('#sidebar-tags');
  if (tagsWidget) {
    // 使用 Set 结构自动去重
    const tagSet = new Set();
    posts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    // 渲染标签链接
    tagsWidget.innerHTML = Array.from(tagSet).map(tag => `
      <a href="#">${tag}</a>
    `).join('');
  }
}


// ==========================================
// 文章页：根据 slug 加载 Markdown 内容
// ==========================================

async function initPost() {
  // 获取文章内容容器
  const container = document.getElementById('post-content');
  // 如果当前页面不是文章页，直接返回
  if (!container) return;

  // 从 URL 中获取当前文章的 slug
  const slug = getSlug();
  // 如果没有指定 slug，显示提示
  if (!slug) {
    container.innerHTML = '<p style="color:#888">No post specified.</p>';
    return;
  }

  // 加载并解析 Markdown 文件
  try {
    // 请求对应的 .md 文件
    const mdRes = await fetch(`posts/${slug}.md`);
    // 请求失败则抛出错误
    if (!mdRes.ok) throw new Error(`HTTP ${mdRes.status}`);
    // 读取文件内容
    const mdText = await mdRes.text();

    // 解析前置元数据和正文
    const { meta, body } = parseFrontmatter(mdText);

    // 更新浏览器标签页标题
    document.title = `${meta.title || slug} — My Blog`;
    // 更新页面描述（用于 SEO）
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = meta.excerpt || '';

    // 渲染文章头部（分类、日期、标题）
    const headerEl = document.getElementById('post-header');
    if (headerEl) {
      headerEl.innerHTML = `
        <div class="post-meta">
          <span class="post-category">${meta.category || ''}</span>
          &nbsp;·&nbsp; ${meta.date || ''}
        </div>
        <h1>${meta.title || slug}</h1>
      `;
    }

    // 使用 marked 库将 Markdown 正文渲染为 HTML
    container.innerHTML = marked.parse(body);

    // 获取完整文章列表，用于渲染上一页/下一页导航
    const posts = await fetchPosts();
    // 查找当前文章在列表中的索引位置
    const idx = posts.findIndex(p => p.slug === slug);
    // 获取上一篇（索引减一）
    const prev = idx > 0 ? posts[idx - 1] : null;
    // 获取下一篇（索引加一）
    const next = idx < posts.length - 1 && idx !== -1 ? posts[idx + 1] : null;
    // 渲染上/下篇文章导航
    const navEl = document.getElementById('post-nav');
    if (navEl) {
      navEl.innerHTML = `
        ${prev ? `<a href="${postUrl(prev.slug)}" class="prev">
          <span class="nav-label">← Previous</span>${prev.title}
        </a>` : '<div></div>'}
        ${next ? `<a href="${postUrl(next.slug)}" class="next">
          <span class="nav-label">Next →</span>${next.title}
        </a>` : '<div></div>'}
      `;
    }
  } catch (err) {
    // 加载失败时打印错误并显示提示
    console.error('Failed to load post:', err);
    container.innerHTML = '<p style="color:#888">Post not found.</p>';
  }
}


// ==========================================
// 归档页：按月份分组展示所有文章
// ==========================================

async function initArchive() {
  // 获取归档列表容器
  const container = document.getElementById('archive-list');
  // 如果当前页面不是归档页，直接返回
  if (!container) return;

  // 获取所有文章数据
  const posts = await fetchPosts();
  // 如果没有文章，显示提示
  if (!posts.length) {
    container.innerHTML = '<p style="color:#888;text-align:center;padding:48px 0;">No posts yet.</p>';
    return;
  }

  // 按年月分组，例如 "May 2026"
  const groups = {};
  posts.forEach(p => {
    // 日期格式为 "May 28, 2026"，取第一个和最后一个单词作为分组键
    const parts = p.date.split(' ');
    const key = parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : p.date;
    // 如果该月份分组还不存在，创建一个新数组
    if (!groups[key]) groups[key] = [];
    // 将文章加入对应月份分组
    groups[key].push(p);
  });

  // 将月份按时间倒序排列（最新的在前）
  const sortedMonths = Object.keys(groups).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  // 渲染归档列表
  container.innerHTML = sortedMonths.map(month => `
    <div class="archive-month">
      <h2 class="archive-month-title">${month}</h2>
      <ul class="archive-list">
        ${groups[month].map(p => `
          <li class="archive-item">
            <span class="archive-day">${p.date.replace(/^\w+ \d+/, '').trim()}</span>
            <a href="${postUrl(p.slug)}">${p.title}</a>
            <span class="archive-category">${p.category}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}


// ==========================================
// 滚动效果：header 阴影 + 阅读进度条
// ==========================================

(function initScrollEffects() {
  var header = document.querySelector('.site-header');
  var progressBar = document.querySelector('.progress-bar');
  var ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY;

        // Header shadow
        if (header) {
          header.classList.toggle('scrolled', scrollY > 10);
        }

        // Reading progress bar
        if (progressBar) {
          var docHeight = document.documentElement.scrollHeight - window.innerHeight;
          var progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
          progressBar.style.width = progress + '%';
        }

        ticking = false;
      });
      ticking = true;
    }
  });
})();


// ==========================================
// 页面初始化入口
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // 所有页面都尝试初始化侧边栏
  initSidebar();

  // 如果页面有 id="post-list" 元素，说明是首页，初始化文章列表
  if (document.getElementById('post-list')) {
    initIndex();
  }

  // 如果页面有 id="post-content" 元素，说明是文章页，加载文章内容
  if (document.getElementById('post-content')) {
    initPost();
  }

  // 如果页面有 id="archive-list" 元素，说明是归档页，渲染归档
  if (document.getElementById('archive-list')) {
    initArchive();
  }
});
