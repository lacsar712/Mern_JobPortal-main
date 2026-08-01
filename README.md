# Job Portal

## 🛠 技术栈
- Frontend: React + Vite + Tailwind CSS（Nginx 部署）
- Backend: Node.js 20 + Express.js
- Database: MongoDB 7
- Auth: Firebase Authentication（可选，登录/注册功能需要）

## 🚀 启动指南 (How to Run)
1. 确保 Docker Desktop 已启动。
2. 在根目录执行：`docker compose up --build`
3. 等待容器启动完成...

## 🔗 服务地址 (Services)
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- Database: localhost:27017 (MongoDB / db: mernJobPortal)

## 🧪 测试说明
- 浏览职位、搜索与筛选：无需登录即可使用（已预置示例岗位数据）
- 登录 / 注册 / 发布职位：需在根目录 `.env` 中配置 Firebase 后重新构建

## ✅ Verification
1. 打开 Frontend（http://localhost:8080），确认首页能加载出示例职位列表。
2. 在 Banner 中按职位名称或地点搜索，确认列表实时过滤。
3. 使用侧边栏按薪资类型、发布时间、经验、雇佣类型筛选，确认结果正确。
4. 点击某个职位卡片，确认能进入详情页。
5. （可选）配置 Firebase 后，注册/登录账号，验证“发布职位”和“My Jobs”管理流程。

---

## 🐳 Docker 镜像源配置 (Docker Registry Configuration)

### 推荐配置（基于实际项目验证）

#### 1. Docker 镜像源
**使用 DaoCloud 加速官方镜像**（国内访问更稳定）

```yaml
# docker-compose.yml 示例
services:
  mongo:
    image: docker.m.daocloud.io/library/mongo:7

  server:
    build: ./job-portal-server

  client:
    build: ./job-portal-client
```

#### 2. npm 依赖源
**使用淘宝镜像**（国内访问快）

在 `Dockerfile` 中添加：
```dockerfile
RUN npm config set registry https://registry.npmmirror.com
```

#### 3. 前端构建加速规范 (Fast Build with npm ci)

为了极致的构建速度和依赖一致性，**必须**遵循以下流程：

1.  **本地预处理**: 在提交代码前，**必须**在本地运行一次 `npm install`（或 `yarn install`），确保 `package-lock.json`（或 `yarn.lock`）文件存在且是最新的。
2.  **锁文件提交**: **绝对严禁**在 `.gitignore` 中忽略锁文件。必须将锁文件提交至仓库，这是容器内高效构建的前提。
3.  **容器内安装**: 在 `Dockerfile` 中，必须使用 `npm ci` 代替 `npm install`。
    -   **优势**: `npm ci` 比 `npm install` 快 2-3 倍，且会根据锁文件进行 100% 确定性的安装，避免“本地能跑，容器报错”的灵异问题。
    -   **注意**: `npm ci` 要求工作目录必须存在 `package-lock.json`，否则会报错。

---

### 常用镜像推荐

| 技术栈 | 推荐镜像 | 说明 |
| :--- | :--- | :--- |
| MongoDB | `mongo:7` | 数据库 |
| Node.js | `node:20-alpine` | 前端/后端构建 |
| Nginx | `nginx:alpine` | 前端生产环境 |

### 配置示例

#### Node.js 项目 Dockerfile
```dockerfile
# 构建阶段
FROM docker.m.daocloud.io/library/node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM docker.m.daocloud.io/library/nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 使用建议

1. ✅ **优先使用官方镜像（经 DaoCloud 加速）**：稳定可靠
2. ✅ **使用 Alpine 版本**：镜像体积小，构建速度快
3. ✅ **配置 npm 淘宝源**：加速国内依赖下载
4. ✅ **多阶段构建**：减小最终镜像体积

### 常见问题

**Q: Docker 镜像拉取失败？**
A: 检查网络连接，确保 Docker Desktop 正常运行

**Q: npm install 很慢？**
A: 确保已配置淘宝镜像源：`npm config set registry https://registry.npmmirror.com`

**Q: 是否需要配置 Docker Hub 镜像加速器？**
A: 本项目已使用 `docker.m.daocloud.io` 加速拉取；如仍失败再考虑额外配置

**Q: Docker端口冲突问题？**
A: 修改 `docker-compose.yml` 中的端口映射即可，例如将 `8080:80` 改为其他未占用端口
