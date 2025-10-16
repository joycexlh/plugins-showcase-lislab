// 后台管理页面脚本

// 分页配置
let currentPage = 1;
let pageSize = 10;
let searchQuery = '';

// 获取插件数据（从 API）
async function getPluginsData() {
    try {
        const response = await fetch('/api/plugins');
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('获取数据失败:', error);
        return [];
    }
}

// 保存插件数据（到 API）
async function savePluginsData(data) {
    try {
        const response = await fetch('/api/plugins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('保存失败');
        }

        return true;
    } catch (error) {
        console.error('保存数据失败:', error);
        showMessage('保存失败: ' + error.message, 'error');
        return false;
    }
}

// 添加新插件
async function addPlugin() {
    const form = document.getElementById('pluginForm');
    const formData = new FormData();

    // 获取表单数据
    const name = document.getElementById('pluginName').value.trim();
    const icon = document.getElementById('pluginIcon').value.trim();
    const description = document.getElementById('pluginDescription').value.trim();
    const category = document.getElementById('pluginCategory').value;
    const url = document.getElementById('pluginUrl').value.trim();
    const tags = document.getElementById('pluginTags').value.trim();
    const featured = document.getElementById('pluginFeatured').checked;

    // 验证必填字段
    if (!name || !description || !url) {
        showMessage('请填写所有必填字段', 'error');
        return;
    }

    // 验证URL格式
    try {
        new URL(url);
    } catch {
        showMessage('请输入有效的Chrome商店链接', 'error');
        return;
    }

    // 创建插件对象
    const plugin = {
        id: Date.now(),
        name,
        icon: icon || '🔧',
        description,
        category,
        url,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        featured,
        order: featured ? 999 : 0, // 精选插件默认不在首屏，需要手动添加
        createdAt: new Date().toISOString()
    };

    // 添加到数据
    const plugins = await getPluginsData();
    plugins.push(plugin);
    const success = await savePluginsData(plugins);

    if (success) {
        // 更新显示
        await renderPluginsList();
        await renderFeaturedLists();
        clearForm();
        showMessage('插件添加成功！', 'success');
    }
}

// 清空表单
function clearForm() {
    document.getElementById('pluginName').value = '';
    document.getElementById('pluginIcon').value = '';
    document.getElementById('pluginDescription').value = '';
    document.getElementById('pluginCategory').value = 'productivity';
    document.getElementById('pluginUrl').value = '';
    document.getElementById('pluginTags').value = '';
    document.getElementById('pluginFeatured').checked = false;
}

// 删除插件
async function deletePlugin(id) {
    if (!confirm('确定要删除这个插件吗？')) return;

    const plugins = await getPluginsData();
    const updatedPlugins = plugins.filter(p => p.id !== id);
    const success = await savePluginsData(updatedPlugins);

    if (success) {
        await renderPluginsList();
        await renderFeaturedLists();
        showMessage('插件删除成功！', 'success');
    }
}

// 编辑插件
async function editPlugin(id) {
    const plugins = await getPluginsData();
    const plugin = plugins.find(p => p.id === id);

    if (!plugin) return;

    // 填充表单
    document.getElementById('pluginName').value = plugin.name;
    document.getElementById('pluginIcon').value = plugin.icon;
    document.getElementById('pluginDescription').value = plugin.description;
    document.getElementById('pluginCategory').value = plugin.category;
    document.getElementById('pluginUrl').value = plugin.url;
    document.getElementById('pluginTags').value = plugin.tags.join(', ');
    document.getElementById('pluginFeatured').checked = plugin.featured;

    // 删除原插件（编辑模式，不需要确认）
    const updatedPlugins = plugins.filter(p => p.id !== id);
    await savePluginsData(updatedPlugins);
    await renderPluginsList();
    await renderFeaturedLists();

    // 滚动到表单
    document.getElementById('pluginForm').scrollIntoView({ behavior: 'smooth' });
    showMessage('编辑模式：修改后点击"添加插件"保存', 'success');
}

// 切换精选状态
async function toggleFeatured(id) {
    const plugins = await getPluginsData();
    const plugin = plugins.find(p => p.id === id);

    if (!plugin) return;

    plugin.featured = !plugin.featured;
    if (plugin.featured) {
        // 设为精选时，默认不加入首屏，需要手动添加
        plugin.order = 999; // 给一个很大的order，表示不在首屏
    } else {
        plugin.order = 0;
    }

    await savePluginsData(plugins);
    await renderPluginsList();
    await renderFeaturedLists();
}

// 获取首屏展示插件（order < 999）
async function getHomepageFeaturedPlugins() {
    const plugins = await getPluginsData();
    return plugins
        .filter(p => p.featured && p.order < 999)
        .sort((a, b) => a.order - b.order);
}

// 获取可选精选插件（未加入首屏的）
async function getAvailableFeaturedPlugins() {
    const plugins = await getPluginsData();
    return plugins
        .filter(p => p.featured && p.order >= 999)
        .sort((a, b) => a.id - b.id);
}

// 获取精选插件
async function getFeaturedPlugins() {
    const plugins = await getPluginsData();
    return plugins.filter(p => p.featured).sort((a, b) => a.order - b.order);
}

// 渲染插件列表
async function renderPluginsList() {
    const container = document.getElementById('pluginsList');
    const allPlugins = await getFilteredPlugins();

    if (allPlugins.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📦</div>
                <h3>${searchQuery ? '没有找到匹配的插件' : '还没有插件'}</h3>
                <p>${searchQuery ? '试试其他关键词' : '添加第一个插件开始使用吧！'}</p>
            </div>
        `;
        renderPagination();
        return;
    }

    // 计算当前页的插件
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagePlugins = allPlugins.slice(startIndex, endIndex);

    container.innerHTML = pagePlugins.map(plugin => `
        <div class="plugin-item" data-id="${plugin.id}">
            <div class="plugin-info">
                <div class="plugin-icon-display">${plugin.icon}</div>
                <div class="plugin-details">
                    <h3>${plugin.name}</h3>
                    <p>${plugin.description}</p>
                    <div class="plugin-meta">
                        <span class="plugin-category">${getCategoryName(plugin.category)}</span>
                        ${plugin.featured ? '<span class="plugin-featured">精选</span>' : ''}
                        <span style="color: #6b7280; font-size: 0.75rem;">
                            ${plugin.tags.join(' • ')}
                        </span>
                    </div>
                </div>
            </div>
            <div class="plugin-actions">
                <button onclick="toggleFeatured(${plugin.id})" class="btn btn-outline btn-small">
                    ${plugin.featured ? '取消精选' : '设为精选'}
                </button>
                <button onclick="editPlugin(${plugin.id})" class="btn btn-secondary btn-small">
                    编辑
                </button>
                <button onclick="deletePlugin(${plugin.id})" class="btn btn-danger btn-small">
                    删除
                </button>
            </div>
        </div>
    `).join('');

    renderPagination();
}

// 添加插件到首屏
async function addToHomepage(id) {
    const plugins = await getPluginsData();
    const plugin = plugins.find(p => p.id === id);

    if (!plugin) return;

    // 设置order为当前首屏插件数量+1
    const homepagePlugins = await getHomepageFeaturedPlugins();
    plugin.order = homepagePlugins.length + 1;

    await savePluginsData(plugins);
    await renderFeaturedLists();
    showMessage('已添加到首屏！', 'success');
}

// 从首屏移除
async function removeFromHomepage(id) {
    const plugins = await getPluginsData();
    const plugin = plugins.find(p => p.id === id);

    if (!plugin) return;

    plugin.order = 999; // 设回不在首屏

    await savePluginsData(plugins);
    await renderFeaturedLists();
    showMessage('已从首屏移除！', 'success');
}

// 渲染精选插件列表（可选 + 首屏）
async function renderFeaturedLists() {
    await renderAvailableFeatured();
    await renderHomepageFeatured();
}

// 渲染可选精选插件
async function renderAvailableFeatured() {
    const container = document.getElementById('availableFeatured');
    const availablePlugins = await getAvailableFeaturedPlugins();

    if (availablePlugins.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 1.5rem; background: #f9fafb;">
                <p style="color: #6b7280; margin: 0; font-size: 0.875rem;">所有精选插件都已添加到首屏</p>
            </div>
        `;
        return;
    }

    container.innerHTML = availablePlugins.map(plugin => `
        <div class="available-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #b5cfee 0%, #9bb8e8 100%); border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">${plugin.icon}</div>
                <div>
                    <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: #1e293b;">${plugin.name}</h4>
                    <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">${plugin.description.substring(0, 40)}...</p>
                </div>
            </div>
            <button onclick="addToHomepage(${plugin.id})" class="btn btn-outline btn-small">添加到首屏</button>
        </div>
    `).join('');
}

// 渲染首屏展示列表
async function renderHomepageFeatured() {
    const container = document.getElementById('featuredList');
    const homepagePlugins = await getHomepageFeaturedPlugins();

    if (homepagePlugins.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">⭐</div>
                <h3>还没有首屏插件</h3>
                <p>从上方选择精选插件添加到首屏</p>
            </div>
        `;
        return;
    }

    container.innerHTML = homepagePlugins.map(plugin => `
        <div class="featured-item" data-id="${plugin.id}" draggable="true">
            <div class="plugin-info">
                <div class="plugin-icon-display">${plugin.icon}</div>
                <div class="plugin-details">
                    <h3>${plugin.name}</h3>
                    <p>${plugin.description.substring(0, 60)}${plugin.description.length > 60 ? '...' : ''}</p>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <div class="drag-handle" style="cursor: grab; color: #9ca3af;">⋮⋮</div>
                <button onclick="removeFromHomepage(${plugin.id})" class="btn btn-danger btn-small">移除</button>
            </div>
        </div>
    `).join('');

    initDragAndDrop();
}

// 初始化拖拽排序
function initDragAndDrop() {
    const container = document.getElementById('featuredList');
    let draggedElement = null;

    container.querySelectorAll('.featured-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedElement = item;
            item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedElement = null;
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement && draggedElement !== item) {
                const allItems = Array.from(container.querySelectorAll('.featured-item'));
                const draggedIndex = allItems.indexOf(draggedElement);
                const targetIndex = allItems.indexOf(item);

                if (draggedIndex < targetIndex) {
                    item.parentNode.insertBefore(draggedElement, item.nextSibling);
                } else {
                    item.parentNode.insertBefore(draggedElement, item);
                }
            }
        });
    });
}

// 更新精选插件排序
async function updateFeaturedOrder() {
    const container = document.getElementById('featuredList');
    const items = Array.from(container.querySelectorAll('.featured-item'));
    const plugins = await getPluginsData();

    items.forEach((item, index) => {
        const id = parseInt(item.getAttribute('data-id'));
        const plugin = plugins.find(p => p.id === id);
        if (plugin) {
            plugin.order = index + 1;
        }
    });

    await savePluginsData(plugins);
    showMessage('排序更新成功！', 'success');
}

// 获取分类名称
function getCategoryName(category) {
    const names = {
        'productivity': '效率工具',
        'utility': '开发工具',
        'creative': '创意工具'
    };
    return names[category] || category;
}

// 搜索插件
async function searchPlugins() {
    searchQuery = document.getElementById('pluginSearch').value.toLowerCase().trim();
    currentPage = 1; // 重置到第一页
    await renderPluginsList();
}

// 清除搜索
async function clearSearch() {
    document.getElementById('pluginSearch').value = '';
    searchQuery = '';
    currentPage = 1;
    await renderPluginsList();
}

// 获取过滤后的插件列表
async function getFilteredPlugins() {
    let plugins = await getPluginsData();

    if (searchQuery) {
        plugins = plugins.filter(plugin =>
            plugin.name.toLowerCase().includes(searchQuery) ||
            plugin.description.toLowerCase().includes(searchQuery) ||
            plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
    }

    return plugins;
}

// 渲染分页控制
async function renderPagination() {
    const container = document.getElementById('pagination');
    const allPlugins = await getFilteredPlugins();
    const totalPages = Math.ceil(allPlugins.length / pageSize);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <button onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>首页</button>
        <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
        <span class="page-info">第 ${currentPage} / ${totalPages} 页 (共 ${allPlugins.length} 个插件)</span>
        <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
        <button onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>末页</button>
    `;

    container.innerHTML = html;
}

// 跳转页码
async function goToPage(page) {
    const allPlugins = await getFilteredPlugins();
    const totalPages = Math.ceil(allPlugins.length / pageSize);

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    currentPage = page;
    await renderPluginsList();
}

// 导出数据
async function exportData() {
    const data = await getPluginsData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plugins-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('数据导出成功！', 'success');
}

// 导入数据
async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                if (confirm('导入数据将覆盖现有数据，确定继续吗？')) {
                    await savePluginsData(data);
                    await renderPluginsList();
                    await renderFeaturedLists();
                    showMessage('数据导入成功！', 'success');
                }
            } else {
                throw new Error('数据格式错误');
            }
        } catch (error) {
            showMessage('数据格式错误，导入失败！', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// 保存所有数据
function saveAllData() {
    // 这里可以添加额外的保存逻辑
    showMessage('所有设置已保存！', 'success');
}

// 显示消息
function showMessage(text, type = 'success') {
    // 移除现有消息
    const existing = document.querySelector('.message');
    if (existing) {
        existing.remove();
    }

    // 创建新消息
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;

    // 插入到页面顶部
    const main = document.querySelector('.admin-main');
    main.insertBefore(message, main.firstChild);

    // 3秒后自动移除
    setTimeout(() => {
        message.remove();
    }, 3000);

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 页面初始化
document.addEventListener('DOMContentLoaded', async () => {
    await renderPluginsList();
    await renderFeaturedLists();

    // 绑定表单提交事件
    const form = document.getElementById('pluginForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addPlugin();
    });

    // 绑定回车键提交
    form.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            addPlugin();
        }
    });

    // 绑定搜索事件
    const searchInput = document.getElementById('pluginSearch');
    searchInput.addEventListener('input', searchPlugins);
});