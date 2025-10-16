// 插件展示页面主脚本

// 插件数据存储
let pluginsData = [];

// 从 API 加载数据
async function loadPluginsData() {
    try {
        const response = await fetch('/api/plugins');
        if (response.ok) {
            pluginsData = await response.json();
        } else {
            console.error('加载数据失败');
            // 使用默认数据
            pluginsData = [
                {
                    id: 1,
                    name: "示例插件 1",
                    icon: "🔧",
                    description: "这是一个示例插件的描述，展示插件的主要功能和特点。",
                    category: "productivity",
                    url: "https://chrome.google.com/webstore",
                    tags: ["工具", "效率"],
                    featured: true,
                    order: 1
                },
                {
                    id: 2,
                    name: "示例插件 2",
                    icon: "📝",
                    description: "另一个示例插件，用于演示展示页面的效果。",
                    category: "utility",
                    url: "https://chrome.google.com/webstore",
                    tags: ["实用", "浏览器"],
                    featured: true,
                    order: 2
                }
            ];
        }
    } catch (error) {
        console.error('加载数据出错:', error);
        // 使用默认数据
        pluginsData = [];
    }
}

// 获取精选插件（按order排序）
function getFeaturedPlugins() {
    return pluginsData.filter(p => p.featured).sort((a, b) => a.order - b.order);
}

// 渲染插件网格
function renderPlugins(plugins = null) {
    const pluginsGrid = document.getElementById('pluginsGrid');
    const emptyState = document.getElementById('emptyState');

    // 默认显示所有插件，但精选插件排在前面
    if (!plugins) {
        const featured = pluginsData.filter(p => p.featured).sort((a, b) => a.order - b.order);
        const notFeatured = pluginsData.filter(p => !p.featured);
        plugins = [...featured, ...notFeatured]; // 精选在前，其他在后
    }

    if (plugins.length === 0) {
        pluginsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    pluginsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    pluginsGrid.innerHTML = plugins.map(plugin => `
        <div class="plugin-card" data-category="${plugin.category}">
            ${plugin.featured ? '<div class="featured-badge">精选</div>' : ''}
            <div class="plugin-header">
                <div class="plugin-title-row">
                    <h3 class="plugin-title">${plugin.name}</h3>
                    <a href="${plugin.url}" target="_blank" class="plugin-link-icon" title="查看插件">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15,3 21,3 21,9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>
                <div class="plugin-meta">
                    <span class="plugin-category-label">${getCategoryName(plugin.category)}</span>
                </div>
                <p class="plugin-description">${plugin.description}</p>
                <div class="plugin-tags">
                    ${plugin.tags.map(tag => `<span class="plugin-tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// 获取分类中文名称
function getCategoryName(category) {
    const categoryMap = {
        'productivity': '效率工具',
        'utility': '开发工具',
        'creative': '创意工具'
    };
    return categoryMap[category] || '工具';
}

// 分类筛选功能
function initCategoryFilter() {
    const categoryBtns = document.querySelectorAll('.category-btn');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新按钮状态
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 筛选插件
            const category = btn.getAttribute('data-category');
            let filteredPlugins;

            if (category === 'all') {
                // 显示所有插件，精选在前
                const featured = pluginsData.filter(p => p.featured).sort((a, b) => a.order - b.order);
                const notFeatured = pluginsData.filter(p => !p.featured);
                filteredPlugins = [...featured, ...notFeatured];
            } else {
                // 筛选某个分类，精选在前
                const featured = pluginsData.filter(p => p.featured && p.category === category).sort((a, b) => a.order - b.order);
                const notFeatured = pluginsData.filter(p => !p.featured && p.category === category);
                filteredPlugins = [...featured, ...notFeatured];
            }

            renderPlugins(filteredPlugins);
        });
    });
}

// 搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            if (query === '') {
                renderPlugins();
                return;
            }

            // 搜索所有插件，精选在前
            const featured = pluginsData.filter(p =>
                p.featured && (
                    p.name.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query) ||
                    p.tags.some(tag => tag.toLowerCase().includes(query))
                )
            ).sort((a, b) => a.order - b.order);

            const notFeatured = pluginsData.filter(p =>
                !p.featured && (
                    p.name.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query) ||
                    p.tags.some(tag => tag.toLowerCase().includes(query))
                )
            );

            const filteredPlugins = [...featured, ...notFeatured];
            renderPlugins(filteredPlugins);
        });
    }
}

// 平滑滚动
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    await loadPluginsData();
    renderPlugins();
    initCategoryFilter();
    initSearch();
    initSmoothScroll();

    // 添加加载动画
    setTimeout(() => {
        document.querySelectorAll('.plugin-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 100);
        });
    }, 100);
});

// 移除旧的 pluginManager（后台不再需要这些方法）