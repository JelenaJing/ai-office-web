# Manual Web User-Flow Test Checklist

- [ ] 登录：用户名 yifeichen / 密码 12345678 可以进入工作台，localStorage 存在 aios_auth_token。
- [ ] 登录：邮箱 yifeichen@ai.cuhk.edu.cn / 密码 12345678 可以进入工作台。
- [ ] 文稿：普通文稿生成后编辑器有中文正文，Word / Markdown / HTML 可直接下载。
- [ ] 文稿：论文调用 paper workflow，包含摘要、关键词、引言、相关研究、方法/框架、结论、参考文献。
- [ ] 文稿：文献综述调用 review workflow，包含检索筛选、研究脉络、主题分类、代表性研究、争议不足、未来方向、参考文献。
- [ ] 文稿：正式模板调用 formal-template workflow，阶段包含 analyze / confirm / preview / commit，partial 状态不伪装 full。
- [ ] PPT：生成得到 DeckDocument，可预览 slide，可下载 PPTX。
- [ ] PPT：切换模板调用 retemplate，tokenUsed=false，内容不丢失。
- [ ] 图片：provider 可用时生成图片 Artifact；provider 未配置或 404 时显示“图片服务未配置或不可用”。
- [ ] 邮件：有账号时可拉取收件箱、AI 整理未读、生成回复草稿、附件入 Artifact、邮件转 Matter。
- [ ] 日报：写入 document_exported / email_sent / matter_created / ppt_generated 后，日报包含核心模块并保存为 Artifact。
- [ ] Artifact：资源中心可预览、下载、重命名、删除；关系元数据包含 sourceRefs / matterId / knowledgeRefs 或 partialMissing。
