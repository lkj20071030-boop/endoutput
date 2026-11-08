# 智析 AI：GitHub + Render + DeepSeek 完整上线

这次的目标是浏览器通过公网访问完整 Web 项目，前端实际调用 Node 后端，后端再调用团队的 DeepSeek 接口。静态演示包与本教程用途不同，请使用本次的「Web端-完整服务部署包.zip」。

## 一、最终结构

访客 → Render 提供的 HTTPS 网站 → 同一个服务的 /api/v1 后端 → DeepSeek。

GitHub 保存部署文件；Render 运行 Node 服务并提供网站链接。GitHub Pages 本身不能运行这个后端。若只需要提交一个在线链接，提交 Render 生成的链接即可。

本包取自「10-成品提交/02-Web端」，保留原 dist 和后端 bundle；新增云端启动入口，监听 0.0.0.0 和平台指定的 PORT。前端保留真实 API 模式，没有替换为预设 mock。密钥不包含在部署包内。

## 二、上传到 GitHub

推荐新建仓库 `zhixi-web-service`，避免与之前的静态文件混在一起。可选 Public；也可选 Private，再授权 Render 读取该仓库。

1. 在电脑上解压「Web端-完整服务部署包.zip」。
2. 在 GitHub 新建仓库，勾选 Add a README file。
3. 打开仓库 Code → Add file → Upload files。
4. 进入解压文件夹，把里面的文件和 dist、server 两个目录一起拖进上传区，保留目录结构。不要直接上传 ZIP，也不要多包一层文件夹。
5. 等待上传完成，点击 Commit changes。

仓库首页应是：

```text
package.json
.node-version
.gitignore
README.md
dist/
  index.html
  demo.html
  assets/
server/
  start.mjs
  server.bundle.mjs
  .env.example
使用说明.md
接口说明.md
```

最关键的是：package.json、dist 和 server 在同一级。dist 不能丢失，本包不需要从 React 源码重新构建。开启 Windows 隐藏项目以看到点开头文件。

本次不需要去 GitHub Pages 配置 Source，也不需要编写 GitHub Actions。Render 从仓库启动完整服务。

## 三、创建 Render Web Service

打开 https://render.com ，登录或注册。点击 New → Web Service，连接 GitHub，授权它读取刚才的仓库。

按照下面填写：

| 字段 | 值 |
|---|---|
| Repository | 刚上传的 zhixi-web-service |
| Name | zhixi-web-service，若被占用则自行换名 |
| Branch | main |
| Language / Runtime | Node |
| Root Directory | 留空，前提是文件按上面的结构上传 |
| Build Command | npm run check |
| Start Command | npm start |
| Health Check Path，若显示此项 | /api/v1/health |
| Instance Type | 先用 Free 验证，比赛展示可按实际需要选付费常驻实例 |

这里选择 Web Service。它要运行 Node，不能选择 Static Site。

本项目后端是已经打包好的单文件，不需要安装依赖；Build Command 只检查语法。package.json 在仓库根目录，因此 npm 不会再找不到项目文件。

## 四、在 Render 配置 DeepSeek

在该服务的 Environment / Environment Variables 中添加：

| Key | Value |
|---|---|
| NODE_VERSION | 24 |
| LLM_BASE_URL | 若直接使用 DeepSeek 官方 API，填 https://api.deepseek.com；若团队使用其他平台，填团队现有的兼容接口基础地址 |
| LLM_MODEL | 团队当前实际调用成功的模型 ID，精确复制，不能只填 DeepSeek 这个品牌名称 |
| LLM_API_KEY | 团队的有效 API Key，只在此处填写 |
| AGENT_ENABLED | true |

不要把 API Key 写进 README、前端 JS、GitHub 文件或公开截图。也无需把它发到聊天里。

重要：这份后端读取的是 LLM_API_KEY，不是 DEEPSEEK_API_KEY。变量名称必须和上表一致。代码会在 LLM_BASE_URL 后补 /chat/completions。模型 ID 与接口地址必须属于同一个供应商配置；“DeepSeek 网页聊天账号可登录”不等于 API 已开通且余额可用。

如果团队现有设置已经成功运行，直接复制相同的基础地址、模型 ID 和 Key 即可，不必为了部署更换模型。

## 五、启动并验证

点击 Deploy Web Service。已创建的服务可保存环境变量并重新部署。

在日志中确认看到类似：

```text
Zhixi Web listening on 0.0.0.0:10000
```

端口以平台实际设置为准。部署成功后，Render 页面会显示一个 https://xxx.onrender.com 网站地址，这才是完整项目的在线链接。

依次验证：

1. 打开「网站地址/api/v1/health」，应有 status: ok。
2. health 中 llmConfigured 应为 true，agent.enabled 应为 true。但这只表示配置存在，不证明 Key 和模型已经可用。
3. 打开网站主页面，在偏好与连接中确认选择「真实后端」，基础地址 /api/v1，健康检查 /health，聊天路径 /chat，保存。
4. 点击测试连接。
5. 在实际聊天入口输入「请解释基尔霍夫电压定律」，应得到后端调用模型后的回答。
6. 再走一次知识诊断、短测、学习路径。诊断 Agent 部分环节有本地规则回退，所以要查看轨迹区是否显示 LLM、是否有 fallback。

首次验证推荐用无痕窗口，避免以前的静态演示站在浏览器中保存了 mock 设置。

## 六、保留已有 GitHub Pages 地址的可选做法

最简单的交付是直接使用 Render 的完整服务链接，前后端同域，无需额外配置跨域。

若团队必须保留原来的 github.io 前端地址，则还要把前端连接模式切到真实后端，基础地址改成 Render 的 HTTPS 域名加 /api/v1；同时在后端环境变量 CORS_ORIGINS 中加入前端来源，例如 https://lkj20071030-boop.github.io。CORS_ORIGINS 填来源域名，不带 /web/ 路径。这个做法比直接使用 Render 地址多一步配置。

## 七、常见错误

| 现象 | 检查 |
|---|---|
| npm 找不到 package.json | 文件被多套了一层；按第二节检查仓库首页 |
| 找不到 dist/index.html | dist 文件夹没有完整上传，或仍在用旧的静态仓库 |
| 云端检测不到端口 | Start Command 应为 npm start，必须运行新增的 server/start.mjs |
| health 中 llmConfigured 为 false | LLM_BASE_URL、LLM_MODEL 名字或值缺失，保存后需重启部署 |
| 模型未配置 / 503 | AGENT_ENABLED 是否为 true，模型配置是否生效 |
| 模型调用失败 / 502 | 检查服务日志、Key、余额、模型 ID、基础地址、请求超时或供应商访问限制 |
| 测试连接成功但回答仍固定 | 前端仍在演示模式，切换真实后端并保存 |
| 网站上仍只显示 README 标题 | 访问了旧的 github.io 静态站，使用新 Web Service 的域名 |
| 诊断只处理少数主题 | 现有知识图谱和题库范围限制，部署不会自动扩展资料库 |

现有产品是学习诊断与辅导系统，三主题资料库和结构化诊断范围仍遵循原项目设计；接上 DeepSeek 不意味着所有诊断主题都会自动支持。请以真实提问和轨迹验证行为，不能仅凭 health 的配置标志判定模型成功。

## 八、展示时的运行限制

Render Free 实例空闲 15 分钟会休眠，下次打开可能需要约一分钟唤醒；本地文件也会随重启、重新部署或休眠丢失。这个项目将诊断会话存在本地文件，免费实例不能保证长期保存；正式展示按需选常驻实例，若要持久保存还需持久盘或数据库。代码支持 SESSION_STORE_PATH 指向已挂载持久盘中的文件。

模型调用使用团队的 API 额度。当前后端接口没有用户登录和限流；公开分享会使用同一份服务端 Key 的额度，建议在供应商控制台设置适合比赛的额度，长期开放前补充访问控制和限流。

本包已本地核对网页、静态资源和后端路径，并验证 Node 启动与接口；真实 DeepSeek 调用需要团队在平台设置密钥后验证。尚未在你的 GitHub 或 Render 账号发布。

官方参考：

- GitHub Pages：https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Render Web Service：https://render.com/docs/web-services
- Render Node 部署：https://render.com/docs/deploy-node-express-app
- Render 免费实例限制：https://render.com/docs/free
- DeepSeek API：https://api-docs.deepseek.com/
