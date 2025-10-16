# Cloudflare Pages 部署指南

本项目使用 Cloudflare Pages + Workers KV + Cloudflare Access 实现安全的后台管理。

## 一、准备工作

1. 注册 Cloudflare 账号（免费）
2. 准备好你的 GitHub 仓库（将代码推送到 GitHub）

---

## 二、部署到 Cloudflare Pages

### 1. 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → 点击 **Create Application** → 选择 **Pages**
3. 连接你的 GitHub 仓库
4. 选择项目目录（如果代码在子目录 `plugins-showcase`，需要指定）
5. 构建配置：
   - **Framework preset**: None
   - **Build command**: 留空
   - **Build output directory**: `/` （或 `plugins-showcase` 如果在子目录）
6. 点击 **Save and Deploy**

### 2. 等待部署完成

部署完成后，你会得到一个地址：`https://your-project.pages.dev`

---

## 三、创建 Workers KV 命名空间

### 1. 创建 KV

1. 在 Cloudflare Dashboard，进入 **Workers & Pages** → **KV**
2. 点击 **Create a namespace**
3. 命名为：`PLUGINS_KV`
4. 点击 **Add**

### 2. 绑定 KV 到 Pages 项目

1. 回到你的 Pages 项目
2. 进入 **Settings** → **Functions** → **KV namespace bindings**
3. 点击 **Add binding**
4. 填写：
   - **Variable name**: `PLUGINS_KV` （必须是这个名字）
   - **KV namespace**: 选择刚才创建的 `PLUGINS_KV`
5. 点击 **Save**

---

## 四、配置 Cloudflare Access（保护后台）

### 1. 启用 Cloudflare Access

1. 在 Cloudflare Dashboard，进入 **Zero Trust**（如果是第一次使用，需要先创建一个 Team，免费版即可）
2. 进入 **Access** → **Applications**
3. 点击 **Add an application**
4. 选择 **Self-hosted**

### 2. 配置应用保护规则

**Application Configuration:**
- **Application name**: `Plugins Admin` （随便起名）
- **Session Duration**: 24 hours （登录后保持24小时）
- **Application domain**:
  - 选择你的 Pages 域名（如 `your-project.pages.dev`）
  - **Path**: `/admin.html` （保护这个路径）

**注意：** 你需要添加两个路径保护：
1. `/admin.html` - 后台页面
2. `/admin-*` - 后台相关资源（js/css）

> 💡 **如何添加多个路径：**
> 添加第一个应用后，再创建第二个应用，路径填 `/admin-*`，使用相同的访问策略

**Policies（访问策略）:**
1. **Policy name**: `Admin Only` （随便起名）
2. **Action**: Allow
3. **Configure rules**:
   - **Selector**: Emails
   - **Value**: 输入你的邮箱（如 `your-email@gmail.com`）
4. 点击 **Add rule**

### 3. 保存并测试

1. 点击 **Save application**
2. 访问 `https://your-project.pages.dev/admin.html`
3. 应该会跳转到 Cloudflare Access 登录页面
4. 用 Google 或 One-Time PIN（邮箱验证码）登录
5. 登录成功后自动跳转到后台管理页面

---

## 五、使用自己的域名（可选）

### 1. 添加自定义域名

1. 在 Pages 项目，进入 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如 `plugins.example.com`）
4. 按照提示添加 DNS 记录（CNAME）

### 2. 更新 Cloudflare Access 规则

1. 回到 **Zero Trust** → **Access** → **Applications**
2. 编辑你的应用
3. 将域名改为你的自定义域名
4. 保存

---

## 六、验证部署

### 测试前台（公开访问）
访问：`https://your-project.pages.dev`
✅ 能正常看到插件列表

### 测试后台（需要登录）
访问：`https://your-project.pages.dev/admin.html`
✅ 跳转到登录页面
✅ 用你的邮箱登录后能进入后台
✅ 能添加、编辑、删除插件
✅ 前台页面能实时看到修改

---

## 七、常见问题

### 1. 访问 `/api/plugins` 报错 404

**原因：** KV 绑定没生效或名字不对

**解决：**
- 确保 KV namespace 绑定的 **Variable name** 是 `PLUGINS_KV`
- 重新部署项目（Settings → Deployments → Redeploy）

### 2. 后台没有要求登录

**原因：** Cloudflare Access 没配置或路径不对

**解决：**
- 检查 Access 应用的路径是否是 `/admin.html` 和 `/admin-*`
- 确保域名匹配（Pages 默认域名或自定义域名）

### 3. 登录后显示 403 Access Denied

**原因：** 你的邮箱不在允许列表中

**解决：**
- 在 Access 应用的 Policy 中添加你的邮箱
- 确保邮箱拼写正确

### 4. 数据保存后前台没有更新

**原因：** 浏览器缓存

**解决：**
- 刷新前台页面（Ctrl + F5 强制刷新）
- 或者清除浏览器缓存

---

## 八、本地开发测试

如果想在本地测试：

```bash
# 安装 wrangler（Cloudflare CLI）
npm install -g wrangler

# 登录
wrangler login

# 在项目目录运行
wrangler pages dev . --kv PLUGINS_KV
```

---

## 九、目录结构

```
plugins-showcase/
├── functions/           # Cloudflare Pages Functions
│   └── api/
│       └── plugins.js   # API 接口（GET 读取，POST 保存）
├── index.html           # 前台展示页面（公开）
├── admin.html           # 后台管理页面（受保护）
├── script.js            # 前台脚本
├── admin-script.js      # 后台脚本
├── _headers             # 配置文件（阻止搜索引擎索引后台）
└── DEPLOYMENT.md        # 本文档
```

---

## 十、安全说明

✅ **数据存储安全：** 数据存在 Cloudflare KV（云端），不在浏览器本地
✅ **访问控制：** `/admin` 路径受 Cloudflare Access 保护，只有你能访问
✅ **无需密码：** 使用 OAuth（Google）或邮箱验证码登录，更安全
✅ **前台公开：** 任何人都能看到插件列表，但不能修改

---

完成！现在你的插件展示网站已经部署成功，后台只有你能访问。🎉
