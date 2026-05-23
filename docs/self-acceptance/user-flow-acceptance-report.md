# Web User-Flow Self-Acceptance Report

- Base URL: http://10.20.5.61:5173/index.web.html
- Generated at: 2026-05-23T07:14:01.672Z

## Login

| Check | Status | Details |
| --- | --- | --- |
| usernameLogin | passed | username credential reached the Web workbench |
| emailLogin | passed | email credential reached the Web workbench |
| tokenPersisted | passed | aios_auth_token persisted after username login |
| authMe | passed | /api/auth/me returned 200 after username login |

## Document

| Check | Status | Details |
| --- | --- | --- |
| generalGenerate | passed | generated 1197 chars in A4 editor |
| downloadWord | passed | 未命名文稿.docx, 11227 bytes |
| downloadMarkdown | passed | 未命名文稿.md, 3531 bytes |
| downloadHtml | passed | 未命名文稿.html, 3602 bytes |
| paperWorkflow | passed | paper workflow produced paper-mpi0g195 and Word artifact fb45695f-6652-4949-aa61-e8b3e4c3993d; ordinary generate API not used by this flow |
| reviewWorkflow | passed | review workflow produced paper-mpi0gvsv and Word artifact f84e62d5-737b-47a0-9459-c12ca6bdbfe7; ordinary generate API not used by this flow |
| formalTemplateWorkflow | passed | formal-template produced formal-template-mpi0hdmw and Word artifact e93a6e8e-75f1-4d9e-ab5a-1b60eb207544 with phases analyze, confirm, preview, commit, completed |

## PPT

| Check | Status | Details |
| --- | --- | --- |
| generate | passed | deckId=d0d12a7f-ac3b-42ea-842d-cbbc90f4ba26, slides=2, artifact=dfcebd5e-6e7c-4d54-b8da-24ed2ed14e8b |
| download | passed | 50397 bytes |
| retemplateZeroToken | passed | templateId=web-default-alt, tokenUsed=false, slides preserved=2 |

## Image

| Check | Status | Details |
| --- | --- | --- |
| generateOrExplicitPartial | skipped | provider unavailable was shown explicitly in UI |
| providerConfig | partial | IMAGE_PROVIDER / IMAGE_API_BASE_URL / IMAGE_API_KEY or model returned unavailable/404; no fake success shown |

## Email

| Check | Status | Details |
| --- | --- | --- |
| accounts | passed | email account is configured |
| inbox | passed | messages=30 |
| unreadTriage | passed | triaged 10 unread messages with category/summary/priority |
| replyDraft | passed | reply draft artifact 14fa5993-5b38-4c68-b108-fd6fc21d1651 |
| attachmentArtifact | passed | attachment artifact eb342f5c-6ca4-4dcb-ae2e-a3d7d08d86ba |
| emailToMatter | passed | matter 6338359b-a240-43c3-8b3b-e4ff5673d33b |
| matterGenerateOutputs | passed | Matter generated document/PPT/reply artifacts |

## Report

| Check | Status | Details |
| --- | --- | --- |
| eventsWritten | passed | 4 events written |
| dailyGenerated | passed | artifact 3295dab0-f44c-42a7-b181-c817cae464a1 |
| containsCoreModules | passed | ppt, aios, email, document, resource-center |
| reportArtifact | passed | report artifact 3295dab0-f44c-42a7-b181-c817cae464a1 |

## Artifact

| Check | Status | Details |
| --- | --- | --- |
| typeCoverage | partial | types=document, presentation, email_draft, report, decision_package; image is provider-dependent partial |
| preview | passed | preview 8115cb91-12f7-45a4-aec6-9e860c928226 |
| download | passed | 46 bytes |
| rename | passed | renamed 8115cb91-12f7-45a4-aec6-9e860c928226 |
| delete | passed | deleted 52152a32-0b59-4741-9ee7-f2a7823d65d5 |
| relationships | passed | sourceRefs=1, knowledgeRefs=1 |

## Conclusion

- Can demo: login, document, ppt, email, report
- Cannot demo: image.providerConfig: IMAGE_PROVIDER / IMAGE_API_BASE_URL / IMAGE_API_KEY or model returned unavailable/404; no fake success shown; artifact.typeCoverage: types=document, presentation, email_draft, report, decision_package; image is provider-dependent partial
- Must fix next: none
- Recommend real-user testing: yes
