const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/EditorPanel-BDg3qSn8.js","assets/vendor-react-DEJtDRDc.js","assets/vendor-editor-MHqHwKWZ.js","assets/vendor-shared-BcAh3SHW.js","assets/vendor-doc-GoCDVH9j.js","assets/vendor-doc-DrELT6T8.css","assets/vendor-ui-ByQTPyrL.js","assets/SkillDevPanel-DnPH36S0.js"])))=>i.map(i=>d[i]);
var Ox=Object.defineProperty;var Wx=(e,n,r)=>n in e?Ox(e,n,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[n]=r;var dd=(e,n,r)=>Wx(e,typeof n!="symbol"?n+"":n,r);import{r as c,j as t,R as Ct,c as Ux}from"./vendor-react-DEJtDRDc.js";import{c as l,p as wr,C as so,a as qn,b as ao,M as ud,X as Rn,S as lo,T as Hx,s as Mt,W as Kx,d as pd,R as Mn,e as Hm,f as Gx,g as qx,L as Vx,h as Yx,i as Jx,B as Xx,G as Zx,j as Qx,I as Km,F as xn,k as Es,P as Gm,U as bi,l as Vn,m as br,n as yr,H as eb,o as qm,q as Or,r as Vm,t as tb,u as nb,v as cc,w as rb,x as Ym,y as Jm,z as ib,A as ob,D as sb,E as ab,J as lb,K as cb,N as db,O as Xm,Q as ub,V as pb,Y as fb,Z as mb,_ as gb,$ as hb,a0 as xb,a1 as dc,a2 as vl,a3 as bb,a4 as yb,a5 as vb,a6 as wb,a7 as fd,a8 as Sb,a9 as kb,aa as jb,ab as Ib,ac as md}from"./vendor-ui-ByQTPyrL.js";import{g as Zm,k as $b}from"./vendor-doc-GoCDVH9j.js";import"./vendor-editor-MHqHwKWZ.js";import"./vendor-shared-BcAh3SHW.js";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function r(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(o){if(o.ep)return;o.ep=!0;const s=r(o);fetch(o.href,s)}})();const wl=()=>{},tr=()=>wl;function gd(e={}){return()=>Promise.resolve({success:!0,...e})}function Tb(){if(typeof window>"u"||window.electronAPI!==void 0)return;const e=window,n="aios_itoken";e.electronAPI={__isWebShim:!0,getAppInfo:()=>Promise.resolve({version:"web",platform:"web"}),resolveAppCloseRequest:()=>Promise.resolve({success:!0}),onAppCloseRequest:tr,getSettings:()=>Promise.resolve({}),saveSettings:()=>Promise.resolve({}),returnToSuiteLauncher:()=>Promise.resolve({success:!0,message:""}),testLlmConnection:()=>Promise.resolve("web mode"),testImageConnection:()=>Promise.resolve("web mode"),launchCompanionApp:()=>Promise.resolve({success:!0,mode:"launched",message:""}),onSuiteNavigate:tr,getIntroductionRemakeServiceInfo:()=>Promise.resolve({}),getIntroductionAllowedJournals:()=>Promise.resolve([]),getIntroductionRecentTasks:()=>Promise.resolve([]),saveIntroductionTaskSnapshot:()=>Promise.resolve({task:{},tasks:[]}),exportIntroductionBundle:()=>Promise.resolve({success:!0,canceled:!1}),testIntroductionLlmSettings:()=>Promise.resolve("ok"),inferIntroductionTopicMeta:()=>Promise.resolve({}),buildIntroductionAllowlistedPool:()=>Promise.resolve({}),generateIntroductionDraft:()=>Promise.resolve({}),startGenerateIntroductionDraftStream:()=>Promise.resolve({streamId:""}),cancelGenerateIntroductionDraftStream:()=>Promise.resolve({success:!0}),onGenerateIntroductionDraftStreamEvent:tr,remapIntroductionDraft:()=>Promise.resolve({}),getPlotAgentStatus:()=>Promise.resolve({ready:!1,running:!1,baseUrl:"",port:0,pythonCommand:null,agentRoot:null}),getPlotChartTypes:()=>Promise.resolve({}),recommendPlot:()=>Promise.resolve({}),generatePlot:()=>Promise.resolve({}),createRealtimePlotSession:()=>Promise.resolve({}),addRealtimePlotPoint:()=>Promise.resolve({}),addRealtimePlotBatch:()=>Promise.resolve({}),getRealtimePlot:()=>Promise.resolve({}),getRealtimePlotStatus:()=>Promise.resolve({}),deleteRealtimePlotSession:()=>Promise.resolve({}),getActiveDocumentEngine:()=>Promise.resolve({engineId:"legacy-tiptap-bridge",availableEngineIds:["legacy-tiptap-bridge"]}),setPreferredDocumentEngine:()=>Promise.resolve({engineId:"legacy-tiptap-bridge",availableEngineIds:["legacy-tiptap-bridge"]}),getKnowledgeBaseInfo:()=>Promise.resolve({departmentId:"",documentCount:0,totalChunks:0}),listKnowledgeDocuments:()=>Promise.resolve([]),getKnowledgeDocument:()=>Promise.resolve(null),getKnowledgeDocumentVersion:()=>Promise.resolve(null),listKnowledgeDocumentChunks:()=>Promise.resolve([]),retrieveKnowledgeChunks:()=>Promise.resolve({chunks:[],total:0}),previewKnowledgeTaskContext:()=>Promise.resolve({context:"",tokenCount:0}),importKnowledgeDocuments:()=>Promise.resolve({imported:0,skipped:0,errors:[]}),importKnowledgeDocumentFromPath:()=>Promise.resolve({imported:0,skipped:0,errors:[]}),ensureReadingSeedDocuments:()=>Promise.resolve({imported:0,skipped:0,errors:[]}),materializeKnowledgeWorkspace:()=>Promise.resolve({success:!0}),deleteKnowledgeDocument:()=>Promise.resolve({success:!0}),setKnowledgeCurrentVersion:()=>Promise.resolve({document:{},version:{}}),submitKnowledgeRemakeTask:()=>Promise.resolve(""),saveKnowledgeTaskRecord:()=>Promise.resolve({task:{}}),createKnowledgeRemakeVersion:()=>Promise.resolve({document:{},version:{},task:{}}),classifyKnowledgeDocument:()=>Promise.resolve(null),updateKnowledgeDocumentCategory:()=>Promise.resolve(),listDepartments:()=>Promise.resolve([]),createDepartment:()=>Promise.resolve({}),renameDepartment:()=>Promise.resolve({}),deleteDepartment:()=>Promise.resolve(),getDefaultDepartmentId:()=>Promise.resolve(""),readOoxmlPackage:()=>Promise.resolve({}),writeOoxmlPackage:()=>Promise.resolve({success:!0}),listWorkspaces:()=>Promise.resolve([]),createWorkspace:()=>Promise.resolve({success:!0,path:"",name:""}),renameWorkspace:()=>Promise.resolve({success:!0,path:"",name:""}),registerWorkspace:()=>Promise.resolve({success:!0,path:"",name:""}),getWorkspaceTree:()=>Promise.resolve([]),readWorkspaceDocumentSchema:()=>Promise.resolve({success:!0,source:"empty",jsonPath:"",legacySourcePath:null,document:{},compatHtml:"",displayName:""}),saveWorkspaceDocumentSchema:()=>Promise.resolve({success:!0,jsonPath:"",document:{},compatHtml:"",displayName:"",resourceCount:0}),saveGeneratedPaperJsonArtifact:()=>Promise.resolve({success:!0,jsonPath:"",relativePath:"",document:{}}),deleteWorkspace:gd(),detectProjectStructure:()=>Promise.resolve({isProject:!1}),createWorkspaceFolder:()=>Promise.resolve({success:!0,path:""}),createWorkspaceFile:()=>Promise.resolve({success:!0,path:""}),createBlankDocument:()=>Promise.resolve({success:!0,path:""}),renameWorkspacePath:()=>Promise.resolve({success:!0,path:""}),copyWorkspacePath:()=>Promise.resolve({success:!0,path:""}),moveWorkspacePath:()=>Promise.resolve({success:!0,path:""}),deleteWorkspacePath:gd(),readReferences:()=>Promise.resolve({references:[]}),readTaskHistory:()=>Promise.resolve({tasks:[]}),appendTaskHistory:()=>Promise.resolve({success:!0,total:0}),saveReferences:()=>Promise.resolve({success:!0,total:0}),appendReferences:()=>Promise.resolve({success:!0,total:0}),cropImageFile:()=>Promise.resolve({success:!0,path:"",relativePath:"",filename:"",dataUrl:""}),saveImageToWorkspace:()=>Promise.resolve({success:!0,path:"",relativePath:"",filename:""}),saveImageToFiguresBase64:()=>Promise.resolve({success:!0,path:"",relativePath:"",filename:""}),saveImageFromUrl:()=>Promise.resolve({success:!0,path:"",relativePath:"",filename:""}),saveImageToFigures:()=>Promise.resolve({success:!0,path:"",relativePath:"",filename:""}),writeWorkspaceFile:()=>Promise.resolve({success:!0,path:""}),saveManuscript:()=>Promise.resolve({success:!0,path:""}),saveExperimentPlan:()=>Promise.resolve({success:!0,path:""}),importFilesToWorkspace:()=>Promise.resolve({imported:[]}),openFileDialog:()=>Promise.resolve(null),openDirectoryDialog:()=>Promise.resolve(null),saveFileDialog:()=>Promise.resolve(null),readFile:()=>Promise.reject(new Error("[web] readFile 不支持，请通过后端 API 访问文件")),listDirectoryImages:()=>Promise.resolve([]),importImageFile:()=>Promise.resolve(null),getFileInfo:()=>Promise.resolve({exists:!1,fileSize:0,path:""}),readImageAsDataUrl:()=>Promise.reject(new Error("[web] readImageAsDataUrl 不支持")),openExternalFile:()=>Promise.resolve({success:!1,filePath:""}),openFolderSafe:()=>Promise.resolve({ok:!1,error:"not supported in web mode"}),openExternalUrl:r=>(window.open(r,"_blank"),Promise.resolve({success:!0})),copyFileToPath:()=>Promise.resolve({success:!0,path:""}),writeFile:()=>Promise.resolve({success:!0,filePath:""}),writeDocxFile:()=>Promise.resolve({success:!0,filePath:""}),internalAccountGetToken:()=>{const r=localStorage.getItem(n)||null;return Promise.resolve({token:r})},internalAccountSetToken:r=>{try{localStorage.setItem(n,r)}catch{}return Promise.resolve({ok:!0})},internalAccountClearToken:()=>{try{localStorage.removeItem(n)}catch{}return Promise.resolve({ok:!0})},internalAccountApplyEmailConfig:()=>Promise.resolve({ok:!0}),matrixGetSession:()=>Promise.resolve({session:null}),matrixSetSession:()=>Promise.resolve({ok:!0}),matrixClearSession:()=>Promise.resolve({ok:!0}),continueWriting:()=>Promise.resolve(""),rewriteParagraph:()=>Promise.resolve(""),writingAssistant:()=>Promise.resolve(""),aiCancelTask:()=>Promise.resolve(),organizeReferences:()=>Promise.resolve({}),generateOutline:()=>Promise.resolve(""),analyzeTopic:()=>Promise.resolve(""),generateExperimentPlan:()=>Promise.resolve(""),generateImage:()=>Promise.resolve({error:"not supported in web mode"}),generatePaper:()=>Promise.resolve({}),compatSubmitTask:()=>Promise.resolve({}),compatGetTaskStatus:()=>Promise.resolve({}),compatGetTaskResult:()=>Promise.resolve({}),compatGetActiveTasks:()=>Promise.resolve({}),compatGetRecentTasks:()=>Promise.resolve({}),compatPauseTask:()=>Promise.resolve({}),compatResumeTask:()=>Promise.resolve({}),compatStopTask:()=>Promise.resolve({}),compatFindCitationForText:()=>Promise.resolve({}),getBackendStatus:()=>Promise.resolve(null),onBackendStatus:wl,exportPdf:()=>Promise.resolve(null),exportPdfFromEditor:()=>Promise.resolve(null),generatePptx:()=>Promise.resolve({success:!1,outputPath:"",slideCount:0,error:"not supported in web mode"}),pptxSaveContentPackage:()=>Promise.resolve({success:!0}),pptxLoadContentPackage:()=>Promise.resolve({success:!0}),pptxListContentPackages:()=>Promise.resolve({success:!0,packages:[]}),pptxRenderWithSkill:()=>Promise.resolve({success:!0}),pptxListSkills:()=>Promise.resolve({success:!0,skills:[]}),pptxImportFromDialog:()=>Promise.resolve({success:!1,previewSlides:[],extractionWarnings:[]}),pptxImportFromFile:()=>Promise.resolve({success:!1,previewSlides:[],extractionWarnings:[]}),deckSave:()=>Promise.resolve({success:!0}),deckLoad:()=>Promise.resolve({success:!0}),deckRender:()=>Promise.resolve({success:!0,llmCalls:0,imageCalls:0,tokenCost:0}),deckUpdateSlide:()=>Promise.resolve({success:!0}),deckUpdateDeckDocument:()=>Promise.resolve({success:!0}),deckOptimizeStructure:()=>Promise.resolve({success:!0,deckId:""}),deckBuildFromPrompt:()=>Promise.resolve({success:!0,warnings:[]}),deckBuildFromManuscript:()=>Promise.resolve({success:!0,warnings:[]}),deckBuildFromImportedPptx:()=>Promise.resolve({success:!0,warnings:[]}),deckExtractPptx:()=>Promise.resolve({success:!0}),deckPreview:()=>Promise.resolve({success:!0}),onAiEvent:tr,voiceStart:()=>Promise.resolve({sessionId:""}),voiceSend:wl,voiceStop:()=>Promise.resolve(),onVoiceEvent:tr,analyzeFormalTemplate:()=>Promise.resolve({}),confirmFormalTemplateFields:()=>Promise.resolve({}),previewFormalTemplateTask:()=>Promise.resolve({}),commitFormalTemplateTask:()=>Promise.resolve({}),emailGetAccount:()=>Promise.resolve(null),emailSaveAccount:()=>Promise.resolve(),emailClearAccount:()=>Promise.resolve(),emailTestConnection:()=>Promise.resolve({ok:!1,message:"not supported in web mode"}),emailTestSmtp:()=>Promise.resolve({ok:!1,message:"not supported in web mode"}),emailFetchInbox:()=>Promise.resolve([]),emailFetchSent:()=>Promise.resolve([]),emailFetchTrash:()=>Promise.resolve([]),emailDeleteMessage:()=>Promise.resolve({ok:!0}),emailRestoreMessage:()=>Promise.resolve({ok:!0}),emailSend:()=>Promise.resolve(),emailDownloadAttachment:()=>Promise.resolve({ok:!1,error:{message:"not supported in web mode"}}),mailOpenAttachmentInWorkspace:()=>Promise.resolve({}),emailSelectAttachments:()=>Promise.resolve({ok:!1}),activityTakeSnapshot:()=>Promise.resolve({}),activityGetActivity:()=>Promise.resolve({}),activityAnalyzeFiles:()=>Promise.resolve({}),activityGenerateReport:()=>Promise.resolve({}),activityGetReport:()=>Promise.resolve({}),activitySyncStatus:()=>Promise.resolve({ok:!0}),activityFlushSync:()=>Promise.resolve({ok:!0}),activityAdminFetch:()=>Promise.resolve({ok:!1}),activityAdminPost:()=>Promise.resolve({ok:!1}),activityLogUserAction:()=>Promise.resolve({ok:!0}),activityGetUserActions:()=>Promise.resolve({ok:!0,actions:[]}),activitySetIdentity:()=>Promise.resolve({ok:!0}),delegationEnable:()=>Promise.resolve({}),delegationDisable:()=>Promise.resolve({}),delegationGetStatus:()=>Promise.resolve({}),delegationGetAuditLog:()=>Promise.resolve({}),delegationGetPendingReplies:()=>Promise.resolve({ok:!0,replies:[]}),delegationReviewReply:()=>Promise.resolve({}),delegationUploadWorkReport:()=>Promise.resolve({}),delegationGenerateAutoReply:()=>Promise.resolve({}),openSkillStore:()=>Promise.resolve({ok:!0}),getSkillSyncPlan:()=>Promise.resolve({ok:!0}),listMySkins:()=>Promise.resolve({ok:!0,skins:[]}),downloadSkillPackage:()=>Promise.resolve({ok:!1,error:"not supported in web mode"}),getSkillStoreEmbedUrl:()=>Promise.resolve({ok:!1}),recognizeSkillPackage:()=>Promise.resolve({ok:!1}),listSkillTemplates:()=>Promise.resolve({ok:!0,templates:[]}),excelAnalysisRun:()=>Promise.resolve({}),excelListDataModels:()=>Promise.resolve([]),excelCheckEnvStatus:()=>Promise.resolve({status:"unavailable",message:"not supported in web mode"}),excelRebuildEnv:()=>Promise.resolve({ok:!1,message:"not supported in web mode"}),excelPythonDiagnostics:()=>Promise.resolve({}),onExcelAnalysisProgress:tr,onExcelAnalysisEnvLog:tr,onExcelAnalysisEnvStatus:tr},e.personalLibraryAPI||(e.personalLibraryAPI={listFolders:()=>Promise.resolve([]),createFolder:()=>Promise.resolve({}),renameFolder:()=>Promise.resolve({}),deleteFolder:()=>Promise.resolve(),listFiles:()=>Promise.resolve([]),getFile:()=>Promise.resolve(null),getFileContent:()=>Promise.resolve({text:"",truncated:!1,sourceType:"text"}),deleteFile:()=>Promise.resolve(),moveFile:()=>Promise.resolve({}),importFiles:()=>Promise.resolve({})}),e.aiOffice||(e.aiOffice={mail:{openAttachmentInWorkspace:()=>Promise.resolve({})}})}const Cb="modulepreload",Pb=function(e){return"/"+e},hd={},co=function(n,r,i){let o=Promise.resolve();if(r&&r.length>0){document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),d=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));o=Promise.allSettled(r.map(u=>{if(u=Pb(u),u in hd)return;hd[u]=!0;const f=u.endsWith(".css"),p=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${p}`))return;const m=document.createElement("link");if(m.rel=f?"stylesheet":Cb,f||(m.as="script"),m.crossOrigin="",m.href=u,d&&m.setAttribute("nonce",d),document.head.appendChild(m),f)return new Promise((g,h)=>{m.addEventListener("load",g),m.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${u}`)))})}))}function s(a){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=a,window.dispatchEvent(d),!d.defaultPrevented)throw a}return o.then(a=>{for(const d of a||[])d.status==="rejected"&&s(d.reason);return n().catch(s)})},Qm=c.createContext(null),qs="ai_writer3_selected_department_id";function Ii(){const e=c.useContext(Qm);if(!e)throw new Error("useDepartment 必须在 DepartmentProvider 内使用");return e}function Ab({children:e}){const[n,r]=c.useState([]),[i,o]=c.useState(""),[s,a]=c.useState(!0),[d,u]=c.useState(null),f=c.useCallback(async()=>{var k,v;a(!0),u(null);try{const y=await window.electronAPI.listDepartments();r(y);const j=localStorage.getItem(qs),S=((k=y.find(z=>z.id===j))==null?void 0:k.id)??((v=y[0])==null?void 0:v.id)??"";o(S),S&&localStorage.setItem(qs,S)}catch(y){const j=y instanceof Error?y.message:String(y);u(j.includes("timeout")||j.includes("abort")?"连接超时":"连接失败"),r([])}finally{a(!1)}},[]);c.useEffect(()=>{f()},[f]);const p=c.useCallback(k=>{o(k),localStorage.setItem(qs,k)},[]),m=c.useCallback(async(k,v)=>{throw new Error("Department creation is managed on the server")},[]),g=c.useCallback(async(k,v,y)=>{throw new Error("Department renaming is managed on the server")},[]),h=c.useCallback(async k=>{throw new Error("Department deletion is managed on the server")},[]),x=c.useMemo(()=>({departments:n,selectedDepartmentId:i,loading:s,error:d,selectDepartment:p,createDepartment:m,renameDepartment:g,deleteDepartment:h,refresh:f}),[n,i,s,d,p,m,g,h,f]);return t.jsx(Qm.Provider,{value:x,children:e})}const Vs=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`,Ys=l.span`
  font-size: var(--font-size-xs);
  color: #6b84a0;
  white-space: nowrap;
  flex-shrink: 0;
`,_b=l.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  overflow: hidden;
  max-width: 280px;
`,eg=l.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  background: #e8f0fe;
  color: #1a56db;
  font-size: var(--font-size-xs);
  font-weight: 500;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
`,Eb=l(eg)`
  background: #f0f4fa;
  color: #6b84a0;
`,zb=l.span`
  font-size: var(--font-size-xs);
  color: #94a3b8;
  font-style: italic;
`,xd=l.button`
  padding: 3px 10px;
  border: 1px solid #c8d6e6;
  border-radius: 6px;
  background: #ffffff;
  color: #304255;
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s;

  &:hover { background: #f0f6ff; border-color: #90b0d8; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`,Db=l.span`
  font-size: var(--font-size-xs);
  color: #94a3b8;
`,Rb=l.span`
  font-size: var(--font-size-xs);
  color: #d97706;
`,bd=2,yd=({departments:e,selectedIds:n,loading:r,error:i,onOpenPicker:o})=>{if(r)return t.jsxs(Vs,{children:[t.jsx(Ys,{children:"知识库"}),t.jsx(Db,{children:"连接中…"})]});if(i)return t.jsxs(Vs,{children:[t.jsx(Ys,{children:"知识库"}),t.jsx(Rb,{title:i,children:"⚠ 连接失败"}),t.jsx(xd,{type:"button",onClick:o,children:"重试"})]});if(e.length===0)return null;const s=new Map(e.map(f=>[f.id,f])),a=n.map(f=>{var p;return((p=s.get(f))==null?void 0:p.name)??null}).filter(f=>f!==null),d=a.slice(0,bd),u=a.length-bd;return t.jsxs(Vs,{children:[t.jsx(Ys,{children:"知识库"}),t.jsx(_b,{children:a.length===0?t.jsx(zb,{children:"未选择"}):t.jsxs(t.Fragment,{children:[d.map((f,p)=>t.jsx(eg,{title:f,children:f},p)),u>0&&t.jsxs(Eb,{children:["+",u]})]})}),t.jsx(xd,{type:"button",onClick:o,disabled:e.length===0,children:"更改"})]})},Mb=wr`
  from { opacity: 0; }
  to   { opacity: 1; }
`,Fb=l.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${Mb} 0.12s ease;
`,Bb=l.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  width: 480px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,Lb=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #e8edf4;
  flex-shrink: 0;
`,Nb=l.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1a2a3a;
`,Ob=l.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #7a91a8;
  cursor: pointer;
  padding: 0;
  &:hover { background: #f0f4fa; color: #304255; }
`,Wb=l.div`
  padding: 10px 14px;
  border-bottom: 1px solid #e8edf4;
  flex-shrink: 0;
  position: relative;
`,Ub=l.div`
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  display: flex;
  align-items: center;
`,Hb=l.input`
  width: 100%;
  box-sizing: border-box;
  padding: 7px 12px 7px 32px;
  border: 1px solid #dce6f0;
  border-radius: 7px;
  font-size: var(--font-size-sm);
  color: #1a2a3a;
  outline: none;
  background: #f8fafc;

  &:focus {
    border-color: #4a90d9;
    background: #ffffff;
  }

  &::placeholder { color: #b0bec5; }
`,Kb=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
`,Gb=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  padding-left: ${e=>8+e.$depth*20}px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  background: ${e=>e.$highlight?"#f0f6ff":"transparent"};

  &:hover { background: ${e=>e.$highlight?"#e8f1ff":"#f5f8fc"}; }
`,vd=l.div`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 3px;
  border: 1.5px solid ${e=>e.$state!=="unchecked"?"#1a56db":"#b0bec5"};
  background: ${e=>e.$state==="checked"?"#1a56db":e.$state==="half"?"#dbeafe":"#ffffff"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, border-color 0.12s;
`,qb=l.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;

  &:hover { background: #e8edf4; color: #304255; }
`,Vb=l.span`
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: ${e=>e.$isGroup?600:400};
  color: ${e=>e.$isGroup?"#1a2a3a":"#304255"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,wd=l.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  font-size: var(--font-size-sm);
  color: #94a3b8;
`,Yb=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #e8edf4;
  flex-shrink: 0;
  gap: 8px;
`,Jb=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
`,Xb=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
`,Zb=l.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #7a91a8;
  font-size: var(--font-size-xs);
  cursor: pointer;
  &:hover { background: #f0f4fa; color: #304255; }
`,Qb=l.button`
  padding: 6px 14px;
  border: 1px solid #dce6f0;
  border-radius: 7px;
  background: #ffffff;
  color: #304255;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  &:hover { background: #f0f4fa; }
`,e0=l.button`
  padding: 6px 18px;
  border: none;
  border-radius: 7px;
  background: #1a56db;
  color: #ffffff;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #1649c7; }
`,t0=l.span`
  font-size: var(--font-size-xs);
  color: #6b84a0;
`;function n0(e){const n=new Map;for(const r of e){const i=r.parentId??"",o=n.get(i)??[];o.push(r),n.set(i,o)}return n}function uc(e,n){const r=n.get(e)??[];return r.length===0?[e]:r.flatMap(i=>uc(i.id,n))}function r0(e,n,r){const i=uc(e,r),o=i.filter(s=>n.has(s));return o.length===0?"unchecked":o.length===i.length?"checked":"half"}function i0(e,n){return e.toLowerCase().includes(n.toLowerCase())}function o0(e,n,r){if(!r.trim())return null;const i=new Set;function o(a){const d=n.get(a.id)??[];let u=!1;for(const p of d)o(p)&&(u=!0);return i0(a.name,r)||u?(i.add(a.id),!0):!1}const s=e.filter(a=>!a.parentId);for(const a of s)o(a);return i}const Sd=({departments:e,selectedIds:n,onApply:r,onClose:i,title:o="选择参考知识库"})=>{const[s,a]=c.useState(()=>new Set(n)),[d,u]=c.useState(()=>{const P=new Set,I=new Map(e.map(b=>[b.id,b.parentId]));for(const b of n){let $=I.get(b);for(;$;)P.add($),$=I.get($)}return P}),[f,p]=c.useState(""),m=c.useMemo(()=>n0(e),[e]),g=c.useMemo(()=>e.filter(P=>!P.parentId),[e]),h=c.useMemo(()=>o0(e,m,f),[e,m,f]),x=!!f.trim(),k=c.useCallback((P,I)=>{I.stopPropagation(),u(b=>{const $=new Set(b);return $.has(P)?$.delete(P):$.add(P),$})},[]),v=c.useCallback(P=>{const b=(m.get(P)??[]).length>0,$=uc(P,m),O=$.every(D=>s.has(D));a(D=>{const R=new Set(D);if(b)if(O)for(const V of $)R.delete(V);else for(const V of $)R.add(V);else R.has(P)?R.delete(P):R.add(P);return R})},[m,s]),y=c.useCallback((P,I)=>{if(h&&!h.has(P.id))return null;const b=m.get(P.id)??[],$=b.length>0,O=x||d.has(P.id),D=r0(P.id,s,m),R=D!=="unchecked";return t.jsxs(Ct.Fragment,{children:[t.jsxs(Gb,{$depth:I,$highlight:R,onClick:()=>v(P.id),children:[$?t.jsx(qb,{type:"button",onClick:V=>k(P.id,V),title:O?"收起":"展开",children:O?t.jsx(so,{size:13}):t.jsx(qn,{size:13})}):t.jsxs(vd,{$state:D,children:[D==="checked"&&t.jsx(ao,{size:10,color:"#fff",strokeWidth:3}),D==="half"&&t.jsx(ud,{size:10,color:"#1a56db",strokeWidth:3})]}),$&&t.jsxs(vd,{$state:D,onClick:V=>{V.stopPropagation(),v(P.id)},children:[D==="checked"&&t.jsx(ao,{size:10,color:"#fff",strokeWidth:3}),D==="half"&&t.jsx(ud,{size:10,color:"#1a56db",strokeWidth:3})]}),t.jsx(Vb,{$isGroup:$,children:P.name})]}),O&&$&&b.map(V=>y(V,I+1))]},P.id)},[h,m,x,d,s,v,k]),j=()=>r([...s]),S=()=>a(new Set),z=c.useMemo(()=>[...s].filter(P=>(m.get(P)??[]).length===0).length,[s,m]);return t.jsx(Fb,{onClick:i,children:t.jsxs(Bb,{onClick:P=>P.stopPropagation(),children:[t.jsxs(Lb,{children:[t.jsx(Nb,{children:o}),t.jsx(Ob,{type:"button",onClick:i,title:"关闭",children:t.jsx(Rn,{size:16})})]}),t.jsxs(Wb,{children:[t.jsx(Ub,{children:t.jsx(lo,{size:13})}),t.jsx(Hb,{value:f,onChange:P=>p(P.target.value),placeholder:"搜索知识库…",autoFocus:!0})]}),t.jsx(Kb,{children:g.length===0?t.jsx(wd,{children:"暂无知识库"}):t.jsxs(t.Fragment,{children:[g.map(P=>y(P,0)),(h==null?void 0:h.size)===0&&t.jsx(wd,{children:"无匹配结果"})]})}),t.jsxs(Yb,{children:[t.jsxs(Jb,{children:[t.jsx(Zb,{type:"button",onClick:S,children:"清空"}),t.jsx(t0,{children:z>0?`已选 ${z} 项`:""})]}),t.jsxs(Xb,{children:[t.jsx(Qb,{type:"button",onClick:i,children:"取消"}),t.jsx(e0,{type:"button",onClick:j,children:"确认"})]})]})]})})},kd="aioffice.kbSelection.free",tg=c.createContext(null);function s0({children:e}){const[n,r]=c.useState(()=>{try{const s=localStorage.getItem(kd);if(s)return JSON.parse(s)}catch{}return[]}),i=c.useCallback(s=>{const a=Array.from(new Set(s.map(d=>String(d||"").trim()).filter(Boolean)));r(a);try{localStorage.setItem(kd,JSON.stringify(a))}catch{}},[]),o=c.useMemo(()=>({workspaceKbIds:n,setWorkspaceKbIds:i}),[n,i]);return t.jsx(tg.Provider,{value:o,children:e})}function a0(){const e=c.useContext(tg);if(!e)throw new Error("useDocumentWorkspaceKnowledge 必须在 DocumentWorkspaceKnowledgeProvider 内使用");return e}const oi="legacy-tiptap-bridge",Js="ai_writer_document_engine",jd="ai_writer_document_engine_migrated_to_tiptap_2026_04_21",Id={"legacy-tiptap-bridge":{id:"legacy-tiptap-bridge",label:"TipTap 文档引擎",shortLabel:"TipTap",kind:"bridge",status:"active",description:"AI-Office 3.0 主文档引擎。基于 TipTap/ProseMirror 的连续流式编辑体验，配合 OOXML data-* 透传在 Word 与编辑器之间实现无损往返。",exchangeFormat:"docx",capabilities:[{key:"workspace-editing",label:"工作区编辑与落盘",ready:!0},{key:"ai-generation",label:"AI 生成链路",ready:!0},{key:"word-fidelity",label:"Word/WPS 高保真兼容",ready:!0}]},"embedded-office-engine":{id:"embedded-office-engine",label:"块式 Office 引擎（备用）",shortLabel:"Embedded Office",kind:"embedded",status:"planned",description:"块式结构化编辑器，保留为备用/对照。主线已切换至 TipTap 引擎。",exchangeFormat:"ooxml",capabilities:[{key:"native-docx-layout",label:"OOXML 布局保真",ready:!0},{key:"editable-export",label:"可编辑 DOCX 回写",ready:!0},{key:"local-embedded-runtime",label:"本地内置运行时",ready:!0}]}};function l0(e=oi){return Id[e]??Id[oi]}function c0(){if(typeof window<"u"){if(!(window.localStorage.getItem(jd)==="true"))return window.localStorage.setItem(Js,oi),window.localStorage.setItem(jd,"true"),oi;const n=window.localStorage.getItem(Js);if(n==="legacy-tiptap-bridge"||n==="embedded-office-engine")return n;window.localStorage.setItem(Js,oi)}return oi}function ng(){return l0(c0())}const d0=c.lazy(()=>co(()=>import("./EditorPanel-BDg3qSn8.js"),__vite__mapDeps([0,1,2,3,4,5,6])));function $d({ghostTextEnabled:e,manuscriptProfile:n="freewrite",headless:r=!1,active:i=!0}){const o=ng();return t.jsx(c.Suspense,{fallback:t.jsx("div",{style:{flex:1,background:"#ffffff"}}),children:t.jsx(d0,{ghostTextEnabled:e,preferredEngineId:o.id,manuscriptProfile:n,headless:r,active:i})})}function di(e){return String(e||"").trim()||null}function xs(e){return e===void 0?void 0:String(e||"")}function pc(e){const n=xs(e==null?void 0:e.currentCompatHtml)||"",r=di(e==null?void 0:e.currentArtifactKey),i=(e==null?void 0:e.acceptedArtifactKey)!==void 0?di(e.acceptedArtifactKey):r,o=xs(e==null?void 0:e.acceptedCompatHtml)??(i===r?n:"");return{ownerLabel:(e==null?void 0:e.ownerLabel)===void 0?null:di(e.ownerLabel),currentArtifactKey:r,acceptedArtifactKey:i,currentCompatHtml:n,acceptedCompatHtml:o}}function u0(e,n){const r=e||pc(),i=n.currentArtifactKey!==void 0?di(n.currentArtifactKey):r.currentArtifactKey,o=n.acceptedArtifactKey!==void 0?di(n.acceptedArtifactKey):r.acceptedArtifactKey,s=xs(n.currentCompatHtml)??r.currentCompatHtml;let a=xs(n.acceptedCompatHtml)??r.acceptedCompatHtml;return n.acceptedArtifactKey!==void 0&&n.acceptedCompatHtml===void 0&&o===i&&(a=s),{ownerLabel:n.ownerLabel===void 0?r.ownerLabel:di(n.ownerLabel),currentArtifactKey:i,acceptedArtifactKey:o,currentCompatHtml:s,acceptedCompatHtml:a}}function rg(e){return e?e.currentArtifactKey!==e.acceptedArtifactKey:!1}function fc(e){const n=e||pc();return{content:n.currentCompatHtml,savedContent:n.acceptedCompatHtml,dirty:rg(n)}}function ig(e,n){const r=fc(n);return{...e,tabKind:"manuscript",manuscriptState:n,content:r.content,savedContent:r.savedContent,dirty:r.dirty}}function wo(e){const n=String(e.content||""),r=e.savedContent!==void 0?String(e.savedContent||""):n;return{id:e.id,filePath:e.filePath,fileName:e.fileName,preview:e.preview,sourceContext:e.sourceContext,canonicalDocumentId:e.canonicalDocumentId,tabKind:"legacy",manuscriptState:null,content:n,savedContent:r,dirty:!!e.dirty}}function Td(e){const n=pc({ownerLabel:e.ownerLabel,currentArtifactKey:e.currentArtifactKey,acceptedArtifactKey:e.acceptedArtifactKey,currentCompatHtml:e.currentCompatHtml,acceptedCompatHtml:e.acceptedCompatHtml});return ig({id:e.id,filePath:e.filePath,fileName:e.fileName,preview:e.preview,sourceContext:e.sourceContext,canonicalDocumentId:e.canonicalDocumentId},n)}function Mr(e,n){const r=u0(e.manuscriptState,n);return ig({id:e.id,filePath:n.filePath!==void 0?n.filePath:e.filePath,fileName:n.fileName??e.fileName,preview:n.preview??e.preview,sourceContext:n.sourceContext??e.sourceContext,canonicalDocumentId:e.canonicalDocumentId},r)}function fo(e){return(e==null?void 0:e.tabKind)==="legacy"}function pr(e){return!!((e==null?void 0:e.tabKind)==="manuscript"&&e.manuscriptState)}function Sl(e){return!!(pr(e)&&!e.preview)}function un(e){return e?fo(e)?e.content:fc(e.manuscriptState).content:""}function Cd(e){return e?fo(e)?e.savedContent:fc(e.manuscriptState).savedContent:""}function Nt(e){return e?fo(e)?e.dirty:rg(e.manuscriptState):!1}function mc(e,n){return fo(e)?{...e,filePath:n.filePath!==void 0?n.filePath:e.filePath,fileName:n.fileName??e.fileName,sourceContext:n.sourceContext??e.sourceContext,content:n.content??e.content,savedContent:n.savedContent??e.savedContent,dirty:n.dirty??e.dirty}:Mr(e,{filePath:n.filePath,fileName:n.fileName,sourceContext:n.sourceContext,currentCompatHtml:n.content,acceptedCompatHtml:n.savedContent})}function Xs(e,n){return mc(e,fo(e)?{content:n,dirty:!0}:{content:n})}function So(e,n){const r=(n==null?void 0:n.content)??un(e);return mc(e,{filePath:n==null?void 0:n.filePath,fileName:n==null?void 0:n.fileName,content:r,savedContent:r,dirty:!1})}function Pd(e){return!!(Sl(e)&&!e.filePath&&!un(e).trim()&&!Nt(e))}const Kr="main",Zs="未保存草稿",og=c.createContext(null);function p0(e,n){const r=String(n||"").trim();if(r)return r;const i=e.filter(o=>!o.filePath&&o.fileName.startsWith(Zs)).length;return i>0?`${Zs} ${i+1}`:Zs}const f0=l.div`
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(15, 23, 42, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`,m0=l.div`
  width: min(420px, calc(100vw - 32px));
  border-radius: 16px;
  border: 1px solid #d9e2ec;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(19, 41, 61, 0.18);
  overflow: hidden;
`,g0=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 10px;
`,h0=l.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`,x0=l.div`
  font-size: 16px;
  font-weight: 700;
  color: #1f3142;
`,b0=l(Hx)`
  flex-shrink: 0;
  color: #ef6c21;
`,y0=l.button`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #7a8794;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: #f2f5f8;
    color: #4f5f70;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,v0=l.div`
  padding: 6px 20px 18px;
  font-size: var(--font-size-xs);
  line-height: 1.7;
  color: #44576a;
`,w0=l.div`
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1f3142;
  word-break: break-word;
`,S0=l.div`
  color: #506272;
`,k0=l.div`
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  padding: 0 20px 20px;
`,Qs=l.button`
  min-width: 92px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${e=>e.$primary?"#2f62d8":"#d6e0ea"};
  background: ${e=>e.$primary?"#2e68e6":"#ffffff"};
  color: ${e=>e.$primary?"#ffffff":"#304255"};
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;function Jn(){const e=c.useContext(og);if(!e)throw new Error("useDocument 必须在 DocumentProvider 内使用");return e}function j0({children:e}){var Te;const[n,r]=c.useState(""),[i,o]=c.useState(null),[s,a]=c.useState(!1),[d,u]=c.useState(!1),[f,p]=c.useState(""),[m,g]=c.useState(null),[h,x]=c.useState(null),[k,v]=c.useState([]),[y,j]=c.useState([]),[S,z]=c.useState(""),[P,I]=c.useState(null),b=c.useRef(""),$=c.useRef([]),O=c.useRef(!1),D=c.useRef(null),R=c.useRef(null),V=c.useRef(null),te=c.useRef(!1);b.current=S,$.current=y,O.current=s;const q=((Te=y.find(C=>C.id===S))==null?void 0:Te.fileName)||"未命名文档",W=c.useCallback(C=>Nt($.current.find(E=>E.id===C)||null),[]),fe=c.useCallback(C=>{const E=$.current.find(K=>K.id===b.current)||null;if(pr(E)){a(Nt(E));return}a(C)},[]),le=c.useCallback(C=>new Promise(E=>{D.current=E,I({...C,closeAfterSaveAttempt:C.closeAfterSaveAttempt??!1,isSaving:!1})}),[]),Q=c.useCallback(C=>{const E=b.current===C&&$.current.find(_=>_.id===C)||null,K=E&&!pr(E)?So(E,{content:Cd(E)}):null;j(_=>_.map(Y=>Y.id!==C||pr(Y)?Y:So(Y,{content:Cd(Y)}))),b.current===C&&K&&(r(un(K)),fe(!1))},[]),ge=c.useCallback(C=>{const E=D.current;D.current=null,I(null),E==null||E(C)},[]),J=c.useCallback(C=>(R.current=C,()=>{R.current===C&&(R.current=null)}),[]),H=c.useCallback(C=>(V.current=C,()=>{V.current===C&&(V.current=null)}),[]),T=c.useCallback(async()=>R.current?R.current():!1,[]),w=c.useCallback((C,E)=>{const K=b.current===C&&$.current.find(Y=>Y.id===C)||null,_=pr(K)?Mr(K,E):null;j(Y=>Y.map(ae=>ae.id!==C||!pr(ae)?ae:Mr(ae,E))),b.current===C&&_&&(_.filePath!==void 0&&o(_.filePath),r(un(_)),a(Nt(_)))},[]),L=c.useCallback(async(C="继续当前操作")=>{const E=b.current;if(!E)return!0;const K=$.current.find(ae=>ae.id===E);if(!Nt(K))return!0;if(R.current)try{if(await R.current())return!0}catch{}const _=(K==null?void 0:K.fileName)||"当前文档",Y=await le({title:"是否保存文档？",fileName:_,description:`是否先保存对“${_}”的更改，再${C}？`,actionLabel:C});return Y==="discard"?V.current?await V.current():pr(K)?(p("当前 manuscript 文稿未接入可用的 discard 回退处理，已取消切换操作"),!1):(Q(E),!0):Y==="save"},[Q,le,p]),N=c.useCallback(C=>{r(C),j(E=>E.map(K=>K.id!==b.current?K:Xs(K,C)))},[]),M=c.useCallback(C=>C.map(E=>E.id===b.current?mc(E,{content:n,dirty:s}):E),[s,n]),A=c.useCallback(C=>{z(C.id),r(un(C)),o(C.filePath),a(Nt(C))},[]),ee=c.useCallback((C,E)=>{const K=b.current===C&&$.current.find(Y=>Y.id===C)||null,_=K?Xs(K,E):null;j(Y=>Y.map(ae=>ae.id!==C?ae:Xs(ae,E))),b.current===C&&(r(E),a(_?Nt(_):!0))},[]),me=c.useCallback((C,E)=>{const K=b.current===C&&$.current.find(Y=>Y.id===C)||null,_=K?So(K,E):null;j(Y=>Y.map(ae=>ae.id!==C?ae:So(ae,E))),b.current===C&&_&&((E==null?void 0:E.filePath)!==void 0&&o(E.filePath),r(un(_)),a(Nt(_)))},[]),Ie=c.useCallback((C,E)=>{ee(C,E)},[ee]),Fe=c.useCallback((C,E)=>{me(C,E)},[me]),Z=()=>{r(""),o(null),fe(!1),u(!1),p(""),g(null),x(null),v([])},X=c.useCallback(async(C,E,K,_)=>{if(!await L("打开其他文件"))return;const Y=!!(_!=null&&_.asManuscript&&!(_!=null&&_.preview)),ae=(_==null?void 0:_.canonicalDocumentId)??null,je=Le=>{if(Y){const Ke=C||`opened:${E}:${Le}`;return Td({id:Le,filePath:C,fileName:E,preview:_==null?void 0:_.preview,sourceContext:_==null?void 0:_.sourceContext,canonicalDocumentId:ae??void 0,currentArtifactKey:Ke,acceptedArtifactKey:Ke,currentCompatHtml:K,acceptedCompatHtml:K})}return wo({id:Le,filePath:C,fileName:E,content:K,savedContent:K,dirty:!1,preview:_==null?void 0:_.preview,sourceContext:_==null?void 0:_.sourceContext,canonicalDocumentId:ae??void 0})};j(Le=>{const Ke=M(Le);let Be=null;if(ae&&(Be=Ke.find(Xe=>Xe.canonicalDocumentId===ae)??null),!Be&&C&&(Be=Ke.find(Xe=>Xe.filePath===C)??null),!Be&&(_!=null&&_.sourceContext)&&(Be=Ke.find(Xe=>{var Re,tt;return((Re=Xe.sourceContext)==null?void 0:Re.messageId)===_.sourceContext.messageId&&((tt=Xe.sourceContext)==null?void 0:tt.originalAttachmentName)===_.sourceContext.originalAttachmentName})??null),Be){const Xe=Y?pr(Be)?Mr(Be,{filePath:C,fileName:E,preview:_==null?void 0:_.preview,sourceContext:_==null?void 0:_.sourceContext,currentArtifactKey:C||`opened:${E}:${Be.id}`,acceptedArtifactKey:C||`opened:${E}:${Be.id}`,currentCompatHtml:K,acceptedCompatHtml:K}):je(Be.id):wo({id:Be.id,filePath:C,fileName:E,content:K,savedContent:K,dirty:!1,preview:_==null?void 0:_.preview,sourceContext:_==null?void 0:_.sourceContext,canonicalDocumentId:ae??Be.canonicalDocumentId??void 0});return z(Xe.id),r(un(Xe)),o(Xe.filePath),a(Nt(Xe)),Ke.map(Re=>Re.id===Xe.id?Xe:Re)}if(Ke.length===1&&!Ke[0].filePath&&!un(Ke[0]).trim()&&!Nt(Ke[0])){const Xe=Ke[0].id,Re=je(Xe);return z(Xe),r(un(Re)),o(Re.filePath),a(Nt(Re)),[Re]}const He=`tab_${Date.now()}`,dt=je(He);return z(He),r(un(dt)),o(dt.filePath),a(Nt(dt)),[...Ke,dt]})},[L,M]),ye=c.useCallback(async C=>{const E=$.current.find(K=>K.id===C);Nt(E)&&!await L("关闭标签页")||j(K=>{const _=K.findIndex(ae=>ae.id===C);if(_===-1)return K;const Y=K.filter(ae=>ae.id!==C);if(b.current===C)if(Y.length>0){const ae=Y[Math.min(_,Y.length-1)];z(ae.id),r(un(ae)),o(ae.filePath),a(Nt(ae))}else z(""),r(""),o(null),fe(!1);return Y})},[L]),Ee=c.useCallback(async C=>{C!==b.current&&!await L("切换标签页")||j(E=>{const K=E.find(_=>_.id===C);return K&&(z(C),r(un(K)),o(K.filePath),a(Nt(K))),E})},[L]),G=c.useCallback(async C=>{const E=C!=null&&C.preferredTabId&&$.current.find(Be=>Be.id===C.preferredTabId)||null,K=!!(C!=null&&C.requireDraft);if(Sl(E)&&(!K||!E.filePath)){const Be=C?Mr(E,C):E;return j(mt=>M(mt).map(He=>He.id===Be.id?Be:He)),A(Be),Be}const _=$.current.find(Be=>Be.id===b.current)||null;if(Sl(_)&&(!K||!_.filePath)){if(!C)return _;const Be=Mr(_,C);return j(mt=>M(mt).map(He=>He.id===Be.id?Be:He)),b.current===Be.id&&A(Be),Be}const Y=(C==null?void 0:C.actionLabel)||"开始全文生成";if(!(C!=null&&C.skipSourceSavePrompt)&&!await L(Y))return null;const ae=M($.current),je=p0(ae,C==null?void 0:C.fileName),Le=ae.length===1&&Pd(ae[0])?{...ae[0],fileName:je}:null,Ke=Le?Mr(Le,C||{}):Td({id:`tab_${Date.now()}`,filePath:(C==null?void 0:C.filePath)??null,fileName:je,ownerLabel:C==null?void 0:C.ownerLabel,currentArtifactKey:C==null?void 0:C.currentArtifactKey,acceptedArtifactKey:C==null?void 0:C.acceptedArtifactKey,currentCompatHtml:C==null?void 0:C.currentCompatHtml,acceptedCompatHtml:C==null?void 0:C.acceptedCompatHtml});return j(Be=>{const mt=M(Be);return mt.length===1&&Pd(mt[0])?[Ke]:[...mt,Ke]}),A(Ke),Ke},[A,L,M]),F=c.useCallback(async C=>G({...C,requireDraft:!0,filePath:null}),[G]),se=c.useCallback(async C=>G(C),[G]),_e=c.useCallback(async()=>{if(!await L("新建标签页"))return;const C=`tab_${Date.now()}`;j(E=>[...M(E),wo({id:C,filePath:null,fileName:"未命名文档",content:"",savedContent:"",dirty:!1})]),z(C),r(""),o(null),fe(!1)},[L,fe,M]),de=c.useCallback(async()=>{b.current!==Kr&&!await L("切换到 AI 生成标签")||j(C=>{const E=M(C),K=E.find(Y=>Y.id===Kr);if(K)return z(Kr),r(un(K)),o(K.filePath),a(Nt(K)),E;const _=wo({id:Kr,filePath:null,fileName:"AI 生成",content:"",savedContent:"",dirty:!1});return z(Kr),r(""),o(null),fe(!1),[...E,_]})},[L,M]);c.useEffect(()=>{const C=E=>{if(te.current)return;const K=b.current,_=$.current.find(Y=>Y.id===K);Nt(_)&&(E.preventDefault(),E.returnValue="")};return window.addEventListener("beforeunload",C),()=>window.removeEventListener("beforeunload",C)},[]),c.useEffect(()=>{const C=window.electronAPI;return!(C!=null&&C.onAppCloseRequest)||!(C!=null&&C.resolveAppCloseRequest)?void 0:C.onAppCloseRequest(()=>{te.current=!0,D.current=null,I(null),C.resolveAppCloseRequest("close")})},[]);const oe=c.useMemo(()=>({markdown:n,setMarkdown:N,filePath:i,setFilePath:o,currentFileName:q,dirty:s,setDirty:fe,isGenerating:d,setIsGenerating:u,statusMessage:f,setStatusMessage:p,continueWritingDocId:m,setContinueWritingDocId:g,clearDocument:Z,tabs:y,activeTabId:S,ensureCurrentDocumentSaved:L,registerSaveHandler:J,registerDiscardHandler:H,runSaveHandler:T,syncManuscriptTabState:w,isTabDirty:W,ensureManuscriptTab:G,openTab:X,closeTab:ye,switchTab:Ee,newTab:_e,mainTabId:Kr,switchToMainTab:de,ensureActiveDraftTab:F,ensureWritableManuscriptTarget:se,setTabShellContent:ee,markTabShellSaved:me,setTabContent:Ie,markTabSaved:Fe,articleType:h,setArticleType:x,articleSections:k,setArticleSections:v}),[n,i,q,s,d,f,m,y,S,h,k,N,o,fe,u,p,g,Z,L,J,H,T,w,W,G,X,ye,Ee,_e,de,F,se,ee,me,Ie,Fe,x,v]);return t.jsxs(t.Fragment,{children:[t.jsx(og.Provider,{value:oe,children:e}),P&&t.jsx(f0,{onMouseDown:()=>!P.isSaving&&ge("cancel"),children:t.jsxs(m0,{onMouseDown:C=>C.stopPropagation(),children:[t.jsxs(g0,{children:[t.jsxs(h0,{children:[t.jsx(b0,{size:18,strokeWidth:2.2}),t.jsx(x0,{children:P.title})]}),t.jsx(y0,{type:"button",onClick:()=>ge("cancel"),disabled:P.isSaving,"aria-label":"关闭弹窗",children:t.jsx(Rn,{size:16})})]}),t.jsxs(v0,{children:[t.jsx(w0,{children:P.fileName}),t.jsx(S0,{children:P.description})]}),t.jsxs(k0,{children:[t.jsx(Qs,{$primary:!0,onClick:async()=>{const C=!!P.closeAfterSaveAttempt;if(!R.current){p(C?"当前文档尚未接入保存能力，将继续退出应用":"当前文档尚未接入保存能力"),ge(C?"save":"cancel");return}I(E=>E&&{...E,isSaving:!0});try{const E=await R.current();if(E||C){!E&&C&&p("保存未完成，将按当前选择继续退出应用"),ge("save");return}I(K=>K&&{...K,isSaving:!1})}catch(E){if(p(C?`保存失败: ${(E==null?void 0:E.message)||"未知错误"}；将继续退出应用`:`保存失败: ${(E==null?void 0:E.message)||"未知错误"}`),C){ge("save");return}I(K=>K&&{...K,isSaving:!1})}},disabled:P.isSaving,children:P.isSaving?"保存中...":"保存(S)"}),t.jsx(Qs,{onClick:()=>ge("discard"),disabled:P.isSaving,children:"不保存(N)"}),t.jsx(Qs,{onClick:()=>ge("cancel"),disabled:P.isSaving,children:"取消"})]})]})})]})}const sg=c.createContext(null);function Sr(){const e=c.useContext(sg);if(!e)throw new Error("useKnowledge 必须在 KnowledgeProvider 内使用");return e}function I0({children:e}){const{selectedDepartmentId:n}=Ii(),[r,i]=c.useState(null),[o,s]=c.useState([]),[a,d]=c.useState(!1),[u,f]=c.useState(!1),p=c.useCallback(async()=>{if(n){d(!0);try{const[v,y]=await Promise.all([window.electronAPI.getKnowledgeBaseInfo(n),window.electronAPI.listKnowledgeDocuments(n)]);i(v),s(y)}finally{d(!1)}}},[n]);c.useEffect(()=>{p()},[p]);const m=c.useCallback(async()=>{f(!0);try{const v=await window.electronAPI.importKnowledgeDocuments(n);return await p(),v}finally{f(!1)}},[p,n]),g=c.useCallback(()=>{},[]),h=c.useCallback(async v=>{},[]),x=c.useCallback(async v=>{const y=String(v||"").trim();y&&(await window.electronAPI.deleteKnowledgeDocument(n,y),await p())},[p,n]),k=c.useMemo(()=>({info:r,documents:o,query:"",loading:a,importing:u,activeDocumentId:null,activeDocument:null,referenceDocumentIds:[],styleImageDocumentIds:[],templateDocumentId:null,departmentId:n,setQuery:g,refresh:p,importDocuments:m,openDocument:h,toggleReferenceDocument:g,selectReferenceDocuments:g,unselectReferenceDocuments:g,toggleStyleImageDocument:g,selectStyleImageDocuments:g,unselectStyleImageDocuments:g,setTemplateDocument:g,clearSelections:g,deleteDocument:x}),[x,o,u,m,r,a,g,h,p,n]);return t.jsx(sg.Provider,{value:k,children:e})}const ag=c.createContext(null);function Cn(){const e=c.useContext(ag);if(!e)throw new Error("useWorkspaceMode 必须在 WorkspaceModeProvider 内使用");return e}function $0({children:e}){const[n,r]=c.useState(()=>{try{const b=localStorage.getItem("aioffice.workspaceMode");if(b==="free"||b==="generation")return b}catch{}return"free"}),[i,o]=c.useState(()=>{try{const b=localStorage.getItem("aioffice.generationMode");if(b&&["document","image","ppt","email","homework","ai-class","ai-forum","paper","data","model","daily-feed"].includes(b))return b}catch{}return"document"}),s=c.useCallback(b=>{r(b);try{localStorage.setItem("aioffice.workspaceMode",b)}catch{}},[]),a=c.useCallback(b=>{o(b),r("generation");try{localStorage.setItem("aioffice.generationMode",b),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),d=c.useCallback(()=>{r("free");try{localStorage.setItem("aioffice.workspaceMode","free")}catch{}},[]),u=c.useCallback(b=>{o(b),r("generation");try{localStorage.setItem("aioffice.generationMode",b),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),f=c.useCallback(()=>{o("document"),r("generation");try{localStorage.setItem("aioffice.generationMode","document"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),p=c.useCallback(()=>{o("document"),r("generation");try{localStorage.setItem("aioffice.generationMode","document"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),m=c.useCallback(()=>{o("image"),r("generation");try{localStorage.setItem("aioffice.generationMode","image"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),g=c.useCallback(()=>{o("ppt"),r("generation");try{localStorage.setItem("aioffice.generationMode","ppt"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),h=c.useCallback(()=>{o("email"),r("generation");try{localStorage.setItem("aioffice.generationMode","email"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),x=c.useCallback(()=>{r("free");try{localStorage.setItem("aioffice.workspaceMode","free")}catch{}},[]),k=c.useCallback(()=>{o("homework"),r("generation");try{localStorage.setItem("aioffice.generationMode","homework"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),v=c.useCallback(()=>{o("ai-class"),r("generation");try{localStorage.setItem("aioffice.generationMode","ai-class"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),y=c.useCallback(()=>{o("ai-forum"),r("generation");try{localStorage.setItem("aioffice.generationMode","ai-forum"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),j=c.useCallback(()=>{o("paper"),r("generation");try{localStorage.setItem("aioffice.generationMode","paper"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),S=c.useCallback(()=>{o("data"),r("generation");try{localStorage.setItem("aioffice.generationMode","data"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),z=c.useCallback(()=>{o("model"),r("generation");try{localStorage.setItem("aioffice.generationMode","model"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]),P=c.useCallback(()=>{o("daily-feed"),r("generation");try{localStorage.setItem("aioffice.generationMode","daily-feed"),localStorage.setItem("aioffice.workspaceMode","generation")}catch{}},[]);c.useEffect(()=>{},[u,i,n,s]);const I=c.useMemo(()=>({mode:n,generationMode:i,currentMode:i,isGenerationMode:n==="generation",setMode:s,setGenerationMode:a,enterFreeMode:d,enterGenerationMode:u,enterFormalTemplateMode:f,enterDocumentGenerationMode:p,enterImageGenerationMode:m,enterPptGenerationMode:g,enterEmailMode:h,enterDailyReportMode:x,enterHomeworkMode:k,enterAiClassMode:v,enterAiForumMode:y,enterPaperGenerationMode:j,enterDataMode:S,enterModelMode:z,enterDailyFeedMode:P}),[n,i,s,a,d,u,f,p,m,g,h,x,k,v,y,j,S,z,P]);return t.jsx(ag.Provider,{value:I,children:e})}const lg=c.createContext(null);function Ft(){const e=c.useContext(lg);if(!e)throw new Error("useWorkspace 必须在 WorkspaceProvider 内使用");return e}function T0({children:e}){const[n,r]=c.useState(null),[i,o]=c.useState(null),[s,a]=c.useState(null),[d,u]=c.useState(null),[f,p]=c.useState(!1),[m,g]=c.useState([]),[h,x]=c.useState([]),[k,v]=c.useState(!1),y=c.useCallback(async()=>{const D=await window.electronAPI.listWorkspaces();x(D),p(!0)},[]),j=c.useCallback(async()=>{if(!s)return;const D=await window.electronAPI.getWorkspaceTree(s);g(D)},[s]),S=c.useCallback(async(D,R)=>{v(!0);try{const V=await window.electronAPI.createWorkspace(D,R);return await y(),V.path}finally{v(!1)}},[y]),z=c.useCallback(async(D,R)=>{v(!0);try{const V=await window.electronAPI.renameWorkspace(D,R);if(await y(),s===D){const te=await window.electronAPI.getWorkspaceTree(V.path);r(V.path),o(V.path),a(V.path),u(V.name),g(te)}return V.path}finally{v(!1)}},[s,y]),P=c.useCallback(async D=>{v(!0);try{const R=await window.electronAPI.registerWorkspace(D);return await y(),R.path}finally{v(!1)}},[y]),I=c.useCallback(async D=>{v(!0);try{const R=await window.electronAPI.getWorkspaceTree(D);r(D),o(D),a(D),u(D.split(/[/\\]/).pop()||D),g(R),(async()=>{try{const V=window.electronAPI;if(typeof V.readWorkspaceDocumentSchema!="function")return;const te=await V.readWorkspaceDocumentSchema(D);te.source==="document-json"&&te.compatHtml&&window.dispatchEvent(new CustomEvent("workspace-document-loaded",{detail:{workspacePath:D,source:te.source,compatHtml:te.compatHtml,displayName:te.displayName}}))}catch{}})()}finally{v(!1)}},[]),b=c.useCallback(()=>{r(null),o(null),a(null),u(null),g([])},[]),$=c.useCallback(async D=>{await window.electronAPI.deleteWorkspace(D),s===D&&b(),await y()},[s,b,y]);c.useEffect(()=>{y()},[y]);const O=c.useMemo(()=>({workspaceRoot:n,projectRoot:i,activeWorkspacePath:s,activeWorkspaceName:d,initialized:f,fileTree:m,fileTreeData:m,workspaces:h,loading:k,createWorkspace:S,renameWorkspace:z,registerWorkspace:P,openWorkspace:I,closeWorkspace:b,refreshTree:j,refreshWorkspaces:y,deleteWorkspace:$}),[n,i,s,d,f,m,h,k,S,z,P,I,b,j,y,$]);return t.jsx(lg.Provider,{value:O,children:e})}function cg(e){return e.replace(/[\\/]+$/,"").split(/[\\/]/).pop()??e}function dg(e,n){try{const r=localStorage.getItem(`aioffice.ws.${cg(e)}.${n}`);return r?JSON.parse(r):null}catch{return null}}function kl(e,n,r){try{localStorage.setItem(`aioffice.ws.${cg(e)}.${n}`,JSON.stringify(r))}catch{}}const si={styleStrength:72,strictStyleLock:!1,preserveComposition:!1,creativity:42},gc="style-continuation",ea={"primary-style":.65,style:.25,content:.1},Ad={style:.7,content:.3};function _d(e,n,r){return Math.max(n,Math.min(r,Number.isFinite(e)?e:n))}function yi(e){return String(e||"").trim()}function Ed(e){return e==="primary-style"?0:e==="style"?1:2}function ug(e){return{styleStrength:_d(Number((e==null?void 0:e.styleStrength)??si.styleStrength),0,100),strictStyleLock:!!((e==null?void 0:e.strictStyleLock)??si.strictStyleLock),preserveComposition:!!((e==null?void 0:e.preserveComposition)??si.preserveComposition),creativity:_d(Number((e==null?void 0:e.creativity)??si.creativity),0,100)}}function Tn(e,n){var h;const r=e.map(x=>({id:yi(x.id),role:x.role,weight:Number(x.weight||0)})).filter(x=>x.id),i=[],o=new Set;for(const x of r)o.has(x.id)||(o.add(x.id),i.push(x));let s=yi(n||"");s||(s=((h=i.find(x=>x.role==="primary-style"))==null?void 0:h.id)||"");const a=i.map(x=>s&&x.id===s?{...x,role:"primary-style"}:x.role==="primary-style"?{...x,role:"style"}:x);a.sort((x,k)=>{const v=Ed(x.role)-Ed(k.role);return v!==0?v:x.id.localeCompare(k.id)});const d=a.filter(x=>x.role==="primary-style").length,u=a.filter(x=>x.role==="style"),f=a.filter(x=>x.role==="content");if(d>0)return a.map(x=>x.role==="primary-style"?{...x,weight:ea["primary-style"]}:x.role==="style"?{...x,weight:u.length>0?ea.style/u.length:0}:{...x,weight:f.length>0?ea.content/f.length:0});const p=u.length>0?Ad.style:0,m=f.length>0?Ad.content:0,g=p+m||1;return a.map(x=>x.role==="style"?{...x,weight:u.length>0?p/u.length/g:0}:{...x,weight:f.length>0?m/f.length/g:0})}function zd(e,n,r){const i=yi(n);if(!i)return Tn(e);const o=e.filter(s=>yi(s.id)!==i);return o.push({id:i,role:r,weight:0}),Tn(o,r==="primary-style"?i:void 0)}function ta(e,n){const r=yi(n);return Tn(e.filter(i=>yi(i.id)!==r))}function mr(e){var n;return((n=Tn(e).find(r=>r.role==="primary-style"))==null?void 0:n.id)||null}function Gr(e){return Tn(e).map(n=>n.id)}function Dd(e,n){const r=Tn(e),i=Tn(n);return r.length!==i.length?!1:r.every((o,s)=>{const a=i[s];return o.id===a.id&&o.role===a.role&&Math.abs(o.weight-a.weight)<1e-4})}function pg(e){return e.map(n=>({id:n.id,name:n.name,role:n.role,weight:n.weight,origin:n.origin,order:n.order}))}function jl(e){return e.slice().sort((r,i)=>(r.order??999)-(i.order??999)).map(r=>`${r.role}:${r.name||r.id}@${Math.round(r.weight*100)}%`)}const Rd={phase:"idle",message:"等待新的生成任务",updatedAt:null};function Ut(){return{selectedAssetIds:[],primaryAssetId:null,imageReferences:[],imageStyleOptions:si,imageGenerationMode:gc,lastImageStyleProfile:null,currentTemplateId:null,generationPrompt:"",generationStatus:Rd,resultAssetId:null,resultType:null,resultPath:null,resultTitle:"",resultPreviewText:"",resultPreviewUrl:null,documentArtifact:null,currentMailId:null,replyDraft:null,replyTone:"formal",replyStatus:Rd,sourceTabId:null,targetTabId:null,targetSelection:null,activeTaskId:null,pendingImageInsertion:null,pendingAutoSubmitToken:null,pendingAutoSubmitTargetAssetId:null,pptPrimarySource:null,pptSourceType:"generated",pptOriginalFilePath:null,pptOriginalFileName:null,pptImportStatus:null,pptImportWarnings:[],pptPreviewSlides:[],resultChartPaths:null,pptContentPackageId:null,pptActiveSkillId:null,pptTaskStatus:"idle",pptLiveSlides:[],pptTotalSlides:0,pptActiveSlideIndex:0,pptStopRequested:!1,pptResumeRequested:!1,pptIsResuming:!1,lastUpdatedAt:null,pptDeckDocumentId:null,pptDeckPath:null,pptActiveTemplateManifestId:null,pptImageMode:null,selectedKnowledgeBaseIds:[]}}function ko(e){return Array.from(new Set(e.map(n=>String(n||"").trim()).filter(Boolean)))}function na(e,n){return e.length!==n.length?!1:e.every((r,i)=>r===n[i])}const fg=c.createContext(null);function kr(){const e=c.useContext(fg);if(!e)throw new Error("useGenerationWorkbench 必须在 GenerationWorkbenchProvider 内使用");return e}function C0({children:e}){const{currentMode:n}=Cn(),{referenceDocumentIds:r,styleImageDocumentIds:i,templateDocumentId:o}=Sr(),{activeWorkspacePath:s}=Ft(),[a,d]=c.useState(()=>({document:Ut(),image:Ut(),ppt:Ut(),email:Ut(),"daily-report":Ut(),homework:Ut(),"ai-class":Ut(),"ai-forum":Ut(),paper:Ut(),data:Ut(),model:Ut(),"daily-feed":Ut()})),u=c.useCallback((J,H)=>{d(T=>{const w=T[J]||Ut(),L=typeof H=="function"?H(w):{...w,...H};return{...T,[J]:L}})},[]),f=c.useRef(null);c.useEffect(()=>{if(!s||f.current===s)return;f.current=s;const J=dg(s,"generationSessions");J&&d(H=>{const T={...H},w=["document","image","ppt","email","daily-report","homework","ai-class","ai-forum","paper"];for(const L of w){const N=J[L];N&&(T[L]={...Ut(),...N,generationStatus:{phase:"idle",message:"等待新的生成任务",updatedAt:null},replyStatus:{phase:"idle",message:"等待新的生成任务",updatedAt:null},pendingImageInsertion:null,pendingAutoSubmitToken:null,pendingAutoSubmitTargetAssetId:null,documentArtifact:null,resultPreviewUrl:null,targetTabId:null,sourceTabId:null,targetSelection:null,activeTaskId:null})}return T})},[s]);const p=c.useRef(null);c.useEffect(()=>{if(s)return p.current&&clearTimeout(p.current),p.current=setTimeout(()=>{const J={},H=["document","image","ppt","email","daily-report","homework","ai-class","ai-forum","paper"];for(const T of H){const w=a[T];w&&(J[T]={selectedAssetIds:w.selectedAssetIds,primaryAssetId:w.primaryAssetId,imageReferences:w.imageReferences,imageStyleOptions:w.imageStyleOptions,imageGenerationMode:w.imageGenerationMode,lastImageStyleProfile:w.lastImageStyleProfile,currentTemplateId:w.currentTemplateId,generationPrompt:w.generationPrompt,resultAssetId:w.resultAssetId,resultType:w.resultType,resultPath:w.resultPath,resultTitle:w.resultTitle,resultPreviewText:w.resultPreviewText,currentMailId:w.currentMailId,replyTone:w.replyTone,pptPrimarySource:w.pptPrimarySource,lastUpdatedAt:w.lastUpdatedAt,selectedKnowledgeBaseIds:w.selectedKnowledgeBaseIds})}kl(s,"generationSessions",J)},1500),()=>{p.current&&clearTimeout(p.current)}},[s,a]),c.useEffect(()=>{const J=ko(r.filter(T=>T!==o)),H=o||null;d(T=>{const w=T.document,L=H||(w.primaryAssetId&&J.includes(w.primaryAssetId)?w.primaryAssetId:J[0]||null);return na(w.selectedAssetIds,J)&&w.currentTemplateId===H&&w.primaryAssetId===L?T:{...T,document:{...w,selectedAssetIds:J,currentTemplateId:H,primaryAssetId:L}}})},[r,o]),c.useEffect(()=>{const J=ko(i);d(H=>{const T=H.image,w=Tn(J.map((M,A)=>{const ee=T.imageReferences.find(me=>me.id===M);return ee||{id:M,role:T.primaryAssetId===M||!T.primaryAssetId&&A===0?"primary-style":"style",weight:0}}),T.primaryAssetId&&J.includes(T.primaryAssetId)?T.primaryAssetId:void 0),L=mr(w),N=Gr(w);return na(T.selectedAssetIds,N)&&T.currentTemplateId===null&&T.primaryAssetId===L&&Dd(T.imageReferences,w)?H:{...H,image:{...T,selectedAssetIds:N,currentTemplateId:null,primaryAssetId:L,imageReferences:w,lastImageStyleProfile:null}}})},[i]);const m=c.useCallback((J,H)=>{const T=H||n;if(T==="image"){u(T,w=>{const L=Tn(ko(J).map((N,M)=>{const A=w.imageReferences.find(ee=>ee.id===N);return A||{id:N,role:w.primaryAssetId===N||!w.primaryAssetId&&M===0?"primary-style":"style",weight:0}}),w.primaryAssetId);return{...w,imageReferences:L,selectedAssetIds:Gr(L),primaryAssetId:mr(L),lastImageStyleProfile:null}});return}u(T,w=>({...w,selectedAssetIds:ko(J)}))},[n,u]),g=c.useCallback((J,H)=>{const T=H||n,w=String(J||"").trim();if(w){if(T==="image"){u(T,L=>{const N=L.imageReferences.some(M=>M.id===w)?ta(L.imageReferences,w):Tn([...L.imageReferences,{id:w,role:L.primaryAssetId?"style":"primary-style",weight:0}],L.primaryAssetId||(L.imageReferences.length?void 0:w));return{...L,imageReferences:N,selectedAssetIds:Gr(N),primaryAssetId:mr(N),lastImageStyleProfile:null}});return}u(T,L=>({...L,selectedAssetIds:L.selectedAssetIds.includes(w)?L.selectedAssetIds.filter(N=>N!==w):[...L.selectedAssetIds,w]}))}},[n,u]),h=c.useCallback((J,H)=>{const T=H||n;if(T==="image"){const w=String(J||"").trim();u(T,L=>{const N=w?zd(L.imageReferences,w,"primary-style"):Tn(L.imageReferences.filter(M=>M.role!=="primary-style"));return{...L,imageReferences:N,selectedAssetIds:Gr(N),primaryAssetId:mr(N),lastImageStyleProfile:null}});return}u(T,w=>({...w,primaryAssetId:J}))},[n,u]),x=c.useCallback((J,H,T)=>{const w=T||n;if(w!=="image")return;const L=String(J||"").trim();L&&u(w,N=>{const M=H?zd(N.imageReferences,L,H):ta(N.imageReferences,L);return{...N,imageReferences:M,selectedAssetIds:Gr(M),primaryAssetId:mr(M),lastImageStyleProfile:null}})},[n,u]),k=c.useCallback((J,H)=>{const T=H||n;T==="image"&&u(T,w=>({...w,imageStyleOptions:ug({...w.imageStyleOptions,...J})}))},[n,u]),v=c.useCallback((J,H)=>{const T=H||n;T==="image"&&u(T,w=>({...w,imageGenerationMode:J}))},[n,u]),y=c.useCallback((J,H)=>{const T=H||n;T==="image"&&u(T,w=>({...w,lastImageStyleProfile:J}))},[n,u]),j=c.useCallback((J,H)=>{u(H||n,w=>({...w,currentTemplateId:J}))},[n,u]),S=c.useCallback(J=>{u("email",H=>({...H,currentMailId:J}))},[u]),z=c.useCallback(J=>{j(J,"email")},[j]),P=c.useCallback(J=>{m(J,"email")},[m]),I=c.useCallback((J,H)=>{const T=H||n,w=Array.from(new Set(J.map(L=>String(L||"").trim()).filter(Boolean)));u(T,L=>({...L,selectedKnowledgeBaseIds:w}))},[n,u]),b=c.useCallback(J=>{g(J,"email")},[g]),$=c.useCallback(J=>{const H=new Date().toISOString();u("email",T=>({...T,replyDraft:J,lastUpdatedAt:H}))},[u]),O=c.useCallback(J=>{const H=new Date().toISOString();u("email",T=>({...T,replyTone:J,lastUpdatedAt:H}))},[u]),D=c.useCallback((J,H)=>{const T=new Date().toISOString();u("email",w=>({...w,replyStatus:{phase:J,message:H,updatedAt:T},lastUpdatedAt:T}))},[u]),R=c.useCallback(J=>{const H=new Date().toISOString();u(n,T=>({...T,generationPrompt:J,lastUpdatedAt:H}))},[n,u]),V=c.useCallback((J,H)=>{const T=new Date().toISOString();u(n,w=>({...w,generationStatus:{phase:J,message:H,updatedAt:T},lastUpdatedAt:T}))},[n,u]),te=c.useCallback(J=>{const H=new Date().toISOString();u(n,T=>({...T,...J,lastUpdatedAt:H}))},[n,u]),q=c.useCallback(()=>{u(n,J=>({...J,resultAssetId:null,resultType:null,resultPath:null,resultTitle:"",resultPreviewText:"",resultPreviewUrl:null,resultChartPaths:null,documentArtifact:null}))},[n,u]),W=c.useCallback(()=>{u(n,J=>({...J,selectedAssetIds:[],primaryAssetId:null,imageReferences:n==="image"?[]:J.imageReferences,lastImageStyleProfile:n==="image"?null:J.lastImageStyleProfile,currentTemplateId:null}))},[n,u]),fe=c.useCallback(J=>{const H=String(J||"").trim();H&&d(T=>{let w=!1;const L=new Date().toISOString(),N={...T};return Object.keys(T).forEach(M=>{const A=T[M],ee=M==="image"?ta(A.imageReferences,H):A.imageReferences,me=M==="image"?Gr(ee):A.selectedAssetIds.filter(X=>X!==H),Ie=A.currentTemplateId===H?null:A.currentTemplateId,Fe=M==="image"?mr(ee):A.primaryAssetId===H?M==="document"?Ie||me[0]||null:me[0]||null:A.primaryAssetId,Z=A.resultAssetId===H;na(A.selectedAssetIds,me)&&A.currentTemplateId===Ie&&A.primaryAssetId===Fe&&Dd(A.imageReferences,ee)&&!Z||(w=!0,N[M]={...A,selectedAssetIds:me,currentTemplateId:Ie,primaryAssetId:Fe,imageReferences:ee,resultAssetId:Z?null:A.resultAssetId,resultType:Z?null:A.resultType,resultPath:Z?null:A.resultPath,resultTitle:Z?"":A.resultTitle,resultPreviewText:Z?"":A.resultPreviewText,resultPreviewUrl:Z?null:A.resultPreviewUrl,resultChartPaths:Z?null:A.resultChartPaths,documentArtifact:Z?null:A.documentArtifact,lastImageStyleProfile:M==="image"?null:A.lastImageStyleProfile,lastUpdatedAt:L})}),w?N:T})},[]),le=c.useCallback(J=>{const H=(J==null?void 0:J.preserveSelections)??!0,T=(J==null?void 0:J.preservePrompt)??!1;u(n,w=>({...Ut(),selectedAssetIds:H?w.selectedAssetIds:[],primaryAssetId:H?w.primaryAssetId:null,imageReferences:H&&n==="image"?w.imageReferences:[],imageStyleOptions:n==="image"?w.imageStyleOptions:si,imageGenerationMode:n==="image"?w.imageGenerationMode:gc,currentTemplateId:H?w.currentTemplateId:null,generationPrompt:T?w.generationPrompt:""}))},[n,u]),Q=a[n]||Ut(),ge=c.useMemo(()=>({currentMode:n,currentSession:Q,sessions:a,selectedAssetIds:Q.selectedAssetIds,primaryAssetId:Q.primaryAssetId,imageReferences:Q.imageReferences,imageStyleOptions:Q.imageStyleOptions,imageGenerationMode:Q.imageGenerationMode,lastImageStyleProfile:Q.lastImageStyleProfile,currentTemplateId:Q.currentTemplateId,generationPrompt:Q.generationPrompt,generationStatus:Q.generationStatus,resultAssetId:Q.resultAssetId,resultType:Q.resultType,resultPath:Q.resultPath,resultTitle:Q.resultTitle,resultPreviewText:Q.resultPreviewText,resultPreviewUrl:Q.resultPreviewUrl,resultChartPaths:Q.resultChartPaths,documentArtifact:Q.documentArtifact,currentMailId:Q.currentMailId,currentReplyTemplateId:Q.currentTemplateId,selectedReferenceAssetIds:Q.selectedAssetIds,replyDraft:Q.replyDraft,replyTone:Q.replyTone,replyStatus:Q.replyStatus,selectedKnowledgeBaseIds:Q.selectedKnowledgeBaseIds,setGenerationPrompt:R,setGenerationStatus:V,setGenerationResult:te,clearCurrentResult:q,clearCurrentSelections:W,resetCurrentModeSession:le,setSelectedAssetIds:m,setSelectedReferenceAssetIds:P,toggleSelectedAsset:g,toggleSelectedReferenceAsset:b,setPrimaryAssetId:h,setImageReferenceRole:x,setImageStyleOptions:k,setImageGenerationMode:v,setLastImageStyleProfile:y,setCurrentTemplateId:j,setCurrentMailId:S,setCurrentReplyTemplateId:z,setReplyDraft:$,setReplyTone:O,setReplyStatus:D,removeDocumentFromSessions:fe,setModeSession:u,setSelectedKnowledgeBaseIds:I}),[q,W,n,Q,fe,le,a,S,z,j,R,te,V,v,x,k,y,u,h,$,D,O,m,I,P,g,b]);return t.jsx(fg.Provider,{value:ge,children:e})}const mg=c.createContext(null);function zs(){const e=c.useContext(mg);if(!e)throw new Error("useFormalTemplateSession 必须在 FormalTemplateSessionProvider 内使用");return e}function P0({children:e}){const[n,r]=c.useState("idle"),[i,o]=c.useState(null),[s,a]=c.useState([]),[d,u]=c.useState(null),[f,p]=c.useState(null),[m,g]=c.useState(null),[h,x]=c.useState(null),[k,v]=c.useState(""),[y,j]=c.useState(""),S=c.useCallback(()=>{r("idle"),o(null),a([]),u(null),p(null),g(null),x(null),v(""),j("")},[]),z=c.useMemo(()=>({phase:n,profile:i,fieldValues:s,previewPlan:d,previewCandidate:f,commitResult:m,errorMessage:h,statusMessage:k,lastInstruction:y,setPhase:r,setProfile:o,setFieldValues:a,setPreviewPlan:u,setPreviewCandidate:p,setCommitResult:g,setErrorMessage:x,setStatusMessage:v,setLastInstruction:j,resetSession:S}),[n,i,s,d,f,m,h,k,y,S]);return t.jsx(mg.Provider,{value:z,children:e})}const ra={size:{preset:"a4"},margins:{top:{value:72,unit:"pt"},right:{value:72,unit:"pt"},bottom:{value:72,unit:"pt"},left:{value:72,unit:"pt"}},orientation:"portrait"},A0={title:{id:"title",fontFamily:"Source Serif 4",fontSize:28,fontWeight:700,lineHeight:1.2,spacingAfter:18,color:"#1f2937"},heading:{id:"heading",fontFamily:"Source Serif 4",fontSize:18,fontWeight:700,lineHeight:1.3,spacingBefore:16,spacingAfter:10,color:"#1f2937"},body:{id:"body",fontFamily:"Source Serif 4",fontSize:12,lineHeight:1.65,spacingAfter:8,textAlign:"justify",color:"#111827"},caption:{id:"caption",fontFamily:"Source Sans 3",fontSize:10,italic:!0,lineHeight:1.4,spacingBefore:4,spacingAfter:10,textAlign:"center",color:"#4b5563"},slot:{id:"slot",fontFamily:"Source Sans 3",fontSize:12,lineHeight:1.5,spacingAfter:8,color:"#0f172a",backgroundColor:"#eef4ff"},table:{id:"table",fontFamily:"Source Sans 3",fontSize:11,lineHeight:1.5,spacingAfter:8,color:"#111827"}};function Il(){return new Date().toISOString()}function Hn(e){try{return JSON.parse(JSON.stringify(e))}catch{return e}}function Nn(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function _0(e){return String(e||"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&")}function Lr(e){return String(e??"").trim()||void 0}function jo(e,n){return`${e}-${n+1}`}function Md(e,n="document"){return(e||[]).map((r,i)=>{if(typeof r=="string"){const o=r.trim();return{id:o||`ref-${i+1}`,label:o||`ref-${i+1}`,uri:o||void 0,kind:n}}return{id:Lr(r.id)||`ref-${i+1}`,kind:r.kind||n,label:Lr(r.label),uri:Lr(r.uri),metadata:r.metadata?Hn(r.metadata):void 0}})}function E0(e){const n=String(e||"").trim();if(!n)return"";const r=typeof DOMParser<"u"?new DOMParser().parseFromString(`<div>${n}</div>`,"text/html").body.firstElementChild:null;if(r){const i=Array.from(r.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th")).map(o=>String(o.textContent||"").replace(/\s+/g," ").trim()).filter(Boolean);if(i.length>0)return i.join(`

`)}return _0(n.replace(/<\s*br\s*\/?>/gi,`
`).replace(/<[^>]+>/g,`
`))}function z0(e){const n=e.split(/\r?\n/).map(i=>i.trim()).filter(Boolean);if(n.length<2||!n.every(i=>i.includes("|")))return null;const r=n.map(i=>i.replace(/^\|?|\|?$/g,"").split("|").map(o=>o.trim()));return r.length<2||!r[1].every(i=>/^:?-{3,}:?$/.test(i))?null:{headers:r[0],rows:r.slice(2)}}function ui(e){return{...e,type:"heading",text:String(e.text||"").trim(),level:e.level||1}}function bs(e,n){return typeof e=="string"?{id:n||`block-${Date.now()}`,type:"paragraph",text:e.trim()}:{...e,type:e.type==="html"||e.type==="citation"?e.type:"paragraph",text:String(e.text||"").trim()}}function gg(e){return{...e,type:"slot",slotKey:String(e.slotKey||"").trim()}}function D0(e){return{...e,type:"table"}}function Ds(e){const n=[],r=e.blockIdPrefix||"block";let i=0;Lr(e.includeTitle)&&(n.push(ui({id:jo(r,i),level:1,text:String(e.includeTitle).trim()})),i+=1);const o=String(e.text||"").replace(/\r/g,"").split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);for(const s of o){const a=z0(s);if(a){n.push(D0({id:jo(r,i),value:a})),i+=1;continue}const d=s.match(/^(#{1,6})\s+(.+)$/);if(d){n.push(ui({id:jo(r,i),level:Math.min(d[1].length,6),text:d[2].trim()})),i+=1;continue}n.push(bs({id:jo(r,i),type:"paragraph",text:s})),i+=1}return n}function hg(e,n){return Ds({text:E0(e),blockIdPrefix:n})}function R0(e){return{size:{...ra.size,...(e==null?void 0:e.size)||{}},margins:{...ra.margins,...(e==null?void 0:e.margins)||{}},orientation:(e==null?void 0:e.orientation)||ra.orientation}}function M0(e){const n=Hn(A0);for(const[r,i]of Object.entries(e||{}))n[r]={...n[r]||{id:r},...i,id:r};return n}function F0(e){return Hn(e||[])}function uo(e){return Rs(Hn(e))}function xg(e){return e.map(n=>{var r,i,o,s,a;if(n.type==="heading"){const d=Math.max(1,Math.min(n.level||1,6));return`<h${d}>${Nn(n.text||"")}</h${d}>`}if(n.type==="image"){const d=Nn(String(((r=n.value)==null?void 0:r.alt)||n.text||"")),u=Lr(((i=n.value)==null?void 0:i.caption)||n.text);return`<figure><img src="${Nn(n.resourceRef)}" alt="${d}" />${u?`<figcaption>${Nn(u)}</figcaption>`:""}</figure>`}if(n.type==="slot"){const d=Nn(String(((o=n.value)==null?void 0:o.text)||n.text||""));return`<p data-slot-key="${Nn(n.slotKey)}">${d}</p>`}if(n.type==="table"){const d=((s=n.value)==null?void 0:s.headers)||[],u=((a=n.value)==null?void 0:a.rows)||[],f=d.length>0?`<thead><tr>${d.map(m=>`<th>${Nn(String(m||""))}</th>`).join("")}</tr></thead>`:"",p=`<tbody>${u.map(m=>`<tr>${(m||[]).map(g=>`<td>${Nn(String(g??""))}</td>`).join("")}</tr>`).join("")}</tbody>`;return`<table>${f}${p}</table>`}return`<p>${Nn(n.text||"")}</p>`}).join(`
`)}function B0(e){const n=Rs(e);return xg(n.blocks)}function Fn(e){var s;const n=e.createdAt||Il(),r=e.updatedAt||n,i=Array.isArray(e.blocks)?F0(e.blocks):Lr(e.html)?hg(String(e.html),e.blockIdPrefix||"block"):Ds({text:e.text,blockIdPrefix:e.blockIdPrefix||"block"}),o={version:"1.0",id:e.id,profile:e.profile,meta:{title:e.title||String(((s=e.metadata)==null?void 0:s.title)||"").trim()||"未命名文稿",createdAt:n,updatedAt:r,sourceType:e.sourceType||"compat",templateId:e.templateId,version:"1.0",...e.metadata||{}},blocks:i,resources:Hn(e.resources||[]),document:{id:e.id,profile:e.profile,templateId:e.templateId,metadata:Hn(e.metadata||{})},page:R0(e.page),styles:M0(e.styles),citations:e.citations?Md(e.citations,"citation"):void 0,sourceRefs:e.sourceRefs?Md(e.sourceRefs,"document"):void 0,bibliography:e.bibliography?Hn(e.bibliography):void 0,exportHints:e.exportHints?Hn(e.exportHints):void 0,templateHints:e.templateHints?Hn(e.templateHints):void 0,html:""};return o.html=Lr(e.html)||xg(o.blocks),o}function L0(e){return Fn({...e,blocks:Ds({text:e.text,blockIdPrefix:e.blockIdPrefix||"block"})})}function b3(e){return Fn({...e,blocks:hg(String(e.html||""),e.blockIdPrefix||"block"),html:String(e.html||"")})}function Rs(e){var n,r,i,o,s,a,d,u,f,p,m;return Fn(e?{id:e.id||"document:compat",profile:e.profile||((n=e.document)==null?void 0:n.profile)||"freewrite",title:((r=e.meta)==null?void 0:r.title)||e.title||String(((o=(i=e.document)==null?void 0:i.metadata)==null?void 0:o.title)||"").trim()||"未命名文稿",createdAt:((s=e.meta)==null?void 0:s.createdAt)||Il(),updatedAt:((a=e.meta)==null?void 0:a.updatedAt)||((d=e.meta)==null?void 0:d.createdAt)||Il(),sourceType:((u=e.meta)==null?void 0:u.sourceType)||"compat",templateId:((f=e.meta)==null?void 0:f.templateId)||((p=e.document)==null?void 0:p.templateId),metadata:{...((m=e.document)==null?void 0:m.metadata)||{},...e.meta||{}},page:e.page,styles:e.styles,blocks:Array.isArray(e.blocks)?e.blocks:void 0,resources:e.resources,citations:e.citations,sourceRefs:e.sourceRefs,bibliography:e.bibliography,exportHints:e.exportHints,templateHints:e.templateHints,html:typeof e.html=="string"?e.html:void 0}:{id:"document:empty",profile:"freewrite",title:"未命名文稿",html:"",blocks:[]})}function Fd(e,n){return(e||[]).map((r,i)=>{if(typeof r=="string"){const o=r.trim();return{id:o||`${n||"ref"}-${i+1}`,label:o||`${n||"ref"}-${i+1}`,uri:o||void 0,kind:n==="export"?"skill-input":"document",role:n}}return{...r,id:String(r.id||r.uri||r.label||`${n||"ref"}-${i+1}`),role:n}})}function bg(e){const n=e.document?Rs(uo(e.document)):Fn({id:`document:${e.id}`,profile:e.profile,templateId:e.templateId,metadata:e.metadata});return{id:e.id,artifactId:e.id,profile:e.profile,document:{...n,document:{...n.document,profile:e.profile,templateId:n.document.templateId??e.templateId}},sourceRefs:Fd(e.sourceRefs,"source"),patches:[...e.patches||[]],profileMetadata:e.profileMetadata?{...e.profileMetadata}:void 0,metadata:e.metadata?{...e.metadata}:void 0,exportRefs:e.exportRefs&&e.exportRefs.length>0?Fd(e.exportRefs,"export"):void 0}}function Lt(e,n){return{code:"invalid_patch_target",message:n,patch:e}}function gn(e,n){return e.findIndex(n)}function N0(e,n){return typeof e=="string"?{text:n||e}:{...e,text:n||e.text||""}}function yg(e,n){const r=uo(e),i=[...r.blocks];switch(n.type){case"update_block_text":{const o=gn(i,s=>s.id===n.blockId);if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到目标块。")};i[o]={...i[o],text:n.text};break}case"replace_block":{const o=gn(i,s=>s.id===n.targetId);if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到需要替换的块。")};i[o]=uo({...r,blocks:[n.block]}).blocks[0];break}case"insert_block_after":{const o=n.afterBlockId??n.targetId,s=o?gn(i,a=>a.id===o):i.length-1;if(o&&s<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到插入参照块。")};i.splice(s+1,0,n.block);break}case"delete_block":{const o=gn(i,s=>s.id===n.targetId);if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到需要删除的块。")};i.splice(o,1);break}case"remove_block":{const o=gn(i,s=>s.id===n.blockId);if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到需要移除的块。")};i.splice(o,1);break}case"replace_image":{const o=gn(i,a=>a.id===n.targetId&&a.type==="image");if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到需要替换的图片块。")};const s=i[o];if(s.type!=="image")return{ok:!1,snapshot:r,applied:[],error:Lt(n,"目标块不是图片。")};i[o]={...s,resourceRef:n.resourceRef,text:n.text??s.text,styleRef:n.styleRef??s.styleRef,value:{...s.value||{},...n.value||{}}};break}case"update_image_caption":{const o=gn(i,a=>a.id===n.blockId&&a.type==="image");if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到图片块。")};const s=i[o];if(s.type!=="image")return{ok:!1,snapshot:r,applied:[],error:Lt(n,"目标块不是图片。")};i[o]={...s,text:n.caption,value:{...s.value||{},caption:n.caption}};break}case"update_image_resource_ref":{const o=gn(i,a=>a.id===n.blockId&&a.type==="image");if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到图片块。")};const s=i[o];if(s.type!=="image")return{ok:!1,snapshot:r,applied:[],error:Lt(n,"目标块不是图片。")};i[o]={...s,resourceRef:n.resourceRef};break}case"fill_slot":{const o="targetId"in n?gn(i,a=>a.id===n.targetId&&a.type==="slot"):gn(i,a=>a.type==="slot"&&a.slotKey===n.slotKey);if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到待补内容块。")};const s=i[o];if(s.type!=="slot")return{ok:!1,snapshot:r,applied:[],error:Lt(n,"目标块不是待补内容。")};i[o]={...s,text:n.text??(typeof n.value=="string"?n.value:n.value.text||s.text),styleRef:n.styleRef??s.styleRef,value:N0(n.value,n.text)};break}case"apply_style":{const o=gn(i,s=>s.id===n.targetId);if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到目标块。")};i[o]={...i[o],styleRef:n.styleRef};break}case"crop_image":{const o=gn(i,a=>a.id===n.targetId&&a.type==="image");if(o<0)return{ok:!1,snapshot:r,applied:[],error:Lt(n,"未找到图片块。")};const s=i[o];if(s.type!=="image")return{ok:!1,snapshot:r,applied:[],error:Lt(n,"目标块不是图片。")};i[o]={...s,value:{...s.value||{},crop:n.crop}};break}case"reorder_blocks":{const o=n.orderedBlockIds.map(s=>i.find(a=>a.id===s)).filter(Boolean);return o.length!==i.length?{ok:!1,snapshot:r,applied:[],error:Lt(n,"重排块数量不匹配。")}:(r.blocks=o,r.html=Fn({...r,blocks:o}).html,{ok:!0,snapshot:r,applied:[n]})}case"set_document_meta":return r.meta={...r.meta,...n.meta},r.document.metadata={...r.document.metadata||{},...n.meta},r.html=Fn({...r,blocks:r.blocks}).html,{ok:!0,snapshot:r,applied:[n]};default:return{ok:!1,snapshot:r,applied:[],error:{code:"unsupported_patch",message:"不支持的 patch 类型。",patch:n}}}return r.blocks=i,r.html=Fn({...r,blocks:i}).html,{ok:!0,snapshot:r,applied:[n]}}function vg(e,n){let r=uo(e);const i=[];for(const o of n){const s=yg(r,o);if(s.ok===!1)return{ok:!1,snapshot:s.snapshot,applied:i,error:s.error};r=s.snapshot,i.push(...s.applied)}return{ok:!0,snapshot:r,applied:i}}function O0(e,n=e.patches){const r=vg(e.document,n),i={...e,document:r.snapshot,patches:n===e.patches?[...e.patches]:[...e.patches,...n]};return r.ok===!1?{ok:!1,artifact:i,applied:r.applied,error:r.error}:{ok:!0,artifact:i,applied:r.applied}}function W0(e){return{baseDocument:e,previewDocument:e,patches:[],lastError:null}}function U0(e,n=[]){const r=W0(e);if(n.length===0)return r;const i=vg(r.previewDocument,n);return{baseDocument:e,previewDocument:i.snapshot,patches:i.ok?[...n]:[...i.applied],lastError:i.ok?null:i.error.message}}function H0(e,n){if(n.type==="replace_block"){const o=e.blocks.find(s=>s.id===n.targetId);return o?{type:"replace_block",targetId:n.targetId,block:o.type==="heading"?{...o,text:n.text}:o.type==="slot"?{...o,text:n.text,value:{...o.value||{},text:n.text}}:o.type==="image"?{...o,text:n.text,value:{...o.value||{},caption:n.text}}:bs({...o,text:n.text,type:"paragraph"})}:{code:"target-not-found",message:"未找到待改写的块。"}}if(n.type==="fill_slot")return!n.targetId&&!n.slotKey?{code:"invalid-action",message:"缺少 slot 定位信息。"}:n.targetId?{type:"fill_slot",targetId:n.targetId,value:n.value,text:n.value}:{type:"fill_slot",slotKey:String(n.slotKey),value:n.value,text:n.value};const r=e.blocks.find(o=>o.id===n.targetId&&o.type==="image");if(!r||r.type!=="image")return{code:"target-not-found",message:"未找到待替换的图片块。"};const i={...n.alt?{alt:n.alt}:{},...n.caption?{caption:n.caption}:{}};return{type:"replace_image",targetId:n.targetId,resourceRef:n.resourceRef,text:n.text,value:i}}function K0(e){return e.type==="replace_block"?"段落预览已更新。":e.type==="fill_slot"?"字段预览已更新。":"图片预览已更新。"}function G0(e,n){const r=H0(e.previewDocument,n);if("code"in r)return{ok:!1,error:r,state:{...e,lastError:r.message}};const i=yg(e.previewDocument,r);return i.ok?{ok:!0,message:K0(n),state:{...e,previewDocument:i.snapshot,patches:[...e.patches,r],lastError:null}}:{ok:!1,error:{code:"invalid-action",message:i.error.message},state:{...e,previewDocument:i.snapshot,lastError:i.error.message}}}const Ms="formalTemplateDebug";function Wr(e){return String(e??"").trim()||void 0}function q0(e){return!!e&&typeof e=="object"&&!Array.isArray(e)}function Bd(e){return["default","first","even"].map(r=>{const i=(e||[]).find(o=>o.variant===r);return{variant:r,status:i?"explicit":"inherit-or-none",relationshipId:Wr(i==null?void 0:i.relationshipId),entryPath:Wr(i==null?void 0:i.entryPath)}})}function V0(e,n){if(n.scope==="document-end")return"文档末尾 section shell";const r=e.blocks.find(i=>i.id===n.boundaryBlockId);return r?`${r.id} · ${String(r.text||r.type||"").trim()||r.type}`:n.boundaryBlockId||"未定位边界块"}function Y0(e){if(e.pageNumber)return{start:e.pageNumber.start,format:Wr(e.pageNumber.format),chapterSeparator:Wr(e.pageNumber.chapterSeparator),chapterStyle:e.pageNumber.chapterStyle,restart:typeof e.pageNumber.start=="number"}}function J0(e){var i;const n=(i=e.document.metadata)==null?void 0:i[Ms];if(!q0(n))return;const r=n;if(!(!r.routingPlan&&!r.executionMode))return r}function X0(e,n){if(!(!e&&!n))return{templateKind:(n==null?void 0:n.templateKind)||(e==null?void 0:e.templateKind),defaultMode:e==null?void 0:e.defaultExecution.mode,defaultStrategy:e==null?void 0:e.defaultExecution.strategy,legacyFallbackAdapter:e==null?void 0:e.legacyFallbackAdapter,actualMode:n==null?void 0:n.mode,actualStrategy:(n==null?void 0:n.mode)==="schema-first"?n.strategy:void 0,fallbackAdapter:(n==null?void 0:n.mode)==="legacy-fallback"?n.fallbackAdapter:void 0,fallbackReasonCode:(n==null?void 0:n.mode)==="legacy-fallback"?n.reasonCode:void 0,fallbackReason:(n==null?void 0:n.mode)==="legacy-fallback"?Wr(n.reason):void 0,usedFallback:(n==null?void 0:n.mode)==="legacy-fallback"}}function Z0(e){var u,f,p;const n=Array.isArray((u=e.templateHints)==null?void 0:u.sectionContracts)?e.templateHints.sectionContracts||[]:[],r=(f=e.templateHints)==null?void 0:f.templateContract,i=J0(e),o=(r==null?void 0:r.mode)||((p=e.templateHints)==null?void 0:p.docxTemplateMode),s=r||o?{kind:Wr(r==null?void 0:r.kind),mode:o,preserveShell:!!(r!=null&&r.preserveShell),legacyFallback:Wr(r==null?void 0:r.legacyFallback),shellEntryCount:Array.isArray(r==null?void 0:r.shellEntries)?r.shellEntries.length:0,shellEntries:Array.isArray(r==null?void 0:r.shellEntries)?r.shellEntries.map(m=>String(m)):[]}:void 0,a=n.map(m=>({id:m.id,scope:m.scope,boundaryBlockId:m.boundaryBlockId,boundaryLabel:V0(e,m),breakType:m.sectionType,titlePage:!!m.titlePage,columnCount:void 0,pageNumber:Y0(m),headerBindings:Bd(m.headerRefs),footerBindings:Bd(m.footerRefs)})),d=X0(i==null?void 0:i.routingPlan,i==null?void 0:i.executionMode);return!s&&a.length===0&&!d?null:{template:s,sections:a,formalTemplate:d}}function wg(e){return{blocks:e.blocks.map(n=>{var r;return{id:n.id,type:n.type,text:String(n.type==="image"?((r=n.value)==null?void 0:r.caption)||n.text||n.resourceRef:n.text||"").trim()}}),diagnostics:Z0(e)}}function Io(e){return t.jsx("button",{type:"button",onClick:e.onClick,style:{border:"1px solid #d5e2ef",background:"#fff",borderRadius:8,padding:"4px 8px",fontSize:14,cursor:"pointer"},children:e.label})}function Q0(e){var o;const n=c.useMemo(()=>e.model||wg(e.document),[e.document,e.model]),r={width:"min(860px, 100%)",margin:"0 auto",background:"#fff",border:"1px solid #d9e4ee",boxShadow:"0 12px 28px rgba(30,58,95,0.08)",padding:32,borderRadius:8},i=async s=>{e.onApplyEditAction&&await e.onApplyEditAction(s)};return t.jsxs("div",{"data-testid":e.testId,style:{width:"100%",minHeight:"100%",overflow:"auto",padding:12},children:[e.editErrorMessage?t.jsx("div",{style:{marginBottom:12,borderRadius:12,border:"1px solid #efd0d0",background:"#fff7f7",color:"#944444",padding:"10px 12px",fontSize:14},children:e.editErrorMessage}):null,t.jsxs("div",{style:r,children:[n.diagnostics?t.jsxs("div",{style:{marginBottom:18,display:"grid",gap:10},children:[n.diagnostics.template?t.jsx("div",{style:{fontSize:14,color:"#4c657c"},children:`templateMode: ${n.diagnostics.template.mode||"未声明"}`}):null,(o=n.diagnostics.formalTemplate)!=null&&o.actualMode?t.jsx("div",{style:{fontSize:14,color:"#4c657c"},children:`execution: ${n.diagnostics.formalTemplate.actualMode}`}):null]}):null,t.jsx("div",{style:{display:"grid",gap:14},children:e.document.blocks.map(s=>{var d,u,f,p,m,g;const a={display:"grid",gap:8};if(s.type==="heading"){const h=`h${Math.max(1,Math.min(s.level||1,6))}`;return t.jsxs("div",{style:a,children:[t.jsx(h,{style:{margin:0,color:"#1f3142"},children:s.text}),e.onApplyEditAction?t.jsx(Io,{label:"改写",onClick:()=>{const x=window.prompt("输入新的标题内容",s.text||"");x!=null&&i({type:"replace_block",targetId:s.id,text:x})}}):null]},s.id)}if(s.type==="image")return t.jsxs("div",{style:a,children:[t.jsxs("div",{style:{border:"1px solid #dbe5ef",borderRadius:12,padding:12,background:"#f8fbff"},children:[t.jsx("img",{src:s.resourceRef,alt:((d=s.value)==null?void 0:d.alt)||s.text||"",style:{maxWidth:"100%",display:"block",margin:"0 auto",borderRadius:8}}),(u=s.value)!=null&&u.caption||s.text?t.jsx("div",{style:{marginTop:8,fontSize:14,color:"#66788b",textAlign:"center"},children:((f=s.value)==null?void 0:f.caption)||s.text}):null]}),e.onApplyEditAction?t.jsx(Io,{label:"替换图片",onClick:()=>{var x;const h=window.prompt("输入新的图片路径或 URL",s.resourceRef||"");h&&i({type:"replace_image",targetId:s.id,resourceRef:h,caption:((x=s.value)==null?void 0:x.caption)||s.text||""})}}):null]},s.id);if(s.type==="slot")return t.jsxs("div",{style:a,children:[t.jsxs("div",{style:{padding:"10px 12px",borderRadius:10,background:"#eef4ff",border:"1px solid #d8e4ff"},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#587191",marginBottom:4},children:s.slotKey}),t.jsx("div",{style:{color:"#1f3142"},children:((p=s.value)==null?void 0:p.text)||s.text||"待补内容"})]}),e.onApplyEditAction?t.jsx(Io,{label:"填写",onClick:()=>{var x;const h=window.prompt(`输入 ${s.slotKey} 的内容`,((x=s.value)==null?void 0:x.text)||s.text||"");h!=null&&i({type:"fill_slot",targetId:s.id,value:h})}}):null]},s.id);if(s.type==="table"){const h=((m=s.value)==null?void 0:m.headers)||[],x=((g=s.value)==null?void 0:g.rows)||[];return t.jsx("div",{style:a,children:t.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:14},children:[h.length>0?t.jsx("thead",{children:t.jsx("tr",{children:h.map((k,v)=>t.jsx("th",{style:{border:"1px solid #dbe5ef",padding:8,background:"#f5f9fc"},children:k},v))})}):null,t.jsx("tbody",{children:x.map((k,v)=>t.jsx("tr",{children:(k||[]).map((y,j)=>t.jsx("td",{style:{border:"1px solid #dbe5ef",padding:8},children:String(y??"")},j))},v))})]})},s.id)}return t.jsxs("div",{style:a,children:[t.jsx("div",{style:{whiteSpace:"pre-wrap",lineHeight:1.8,color:"#24384b"},children:s.text}),e.onApplyEditAction?t.jsx(Io,{label:"改写",onClick:()=>{const h=window.prompt("输入新的段落内容",s.text||"");h!=null&&i({type:"replace_block",targetId:s.id,text:h})}}):null]},s.id)})})]})]})}function hc(e){if(e==="academic-cn"||e==="academic-en"||e==="thesis"||e==="compact")return e}function ey(e){if(e)return{paperTemplateId:hc(e.paperTemplateId),bodyStyle:e.bodyStyle,shell:e.shell}}function ty(e){if(e)try{const n=JSON.parse(e);return!n||typeof n!="object"?void 0:{paperTemplateId:hc(n.paperTemplateId),bodyStyle:n.bodyStyle,shell:n.shell}}catch{return}}function ny(e,n){const r=String(e||"");if(typeof document>"u"||!r.trim().startsWith("<"))return{contentHtml:r,renderState:n};const i=document.createElement("div");if(i.innerHTML=r.trim(),i.childElementCount!==1)return{contentHtml:r,renderState:n};const o=i.firstElementChild;if(!o||o.tagName.toLowerCase()!=="div")return{contentHtml:r,renderState:n};const s=ty(o.getAttribute("data-ai-writer-doc-meta")),a=hc(o.getAttribute("data-paper-template"));return o.getAttribute("data-ai-writer-doc-envelope")==="true"||!!s||!!a?{contentHtml:o.innerHTML||"<p></p>",renderState:{...n||{},...s||{},paperTemplateId:a||(s==null?void 0:s.paperTemplateId)||(n==null?void 0:n.paperTemplateId)}}:{contentHtml:r,renderState:n}}function ry(e){var n,r;return((r=(n=e.diagnostics)==null?void 0:n.message)==null?void 0:r.trim())||"文稿预览读取失败。"}function iy(e){var n,r;return((r=(n=e.diagnostics)==null?void 0:n.message)==null?void 0:r.trim())||"文稿为空，当前没有可展示内容。"}function oy(e,n){const r=String(e||"").trim(),[i,o]=c.useState(()=>r?{kind:"loading",filePath:r}:{kind:"idle",filePath:null});return c.useEffect(()=>{if(!r){o({kind:"idle",filePath:null});return}let s=!1;return o({kind:"loading",filePath:r}),window.electronAPI.readOoxmlPackage(r).then(a=>{var p;if(s)return;const d=ey(a.renderMeta);if(a.status==="empty-document"){o({kind:"empty",filePath:r,message:iy(a),renderState:d,diagnostics:a.diagnostics,snapshot:a});return}if(a.status!=="ok"){o({kind:"error",filePath:r,status:a.status,message:ry(a),detail:(p=a.diagnostics)==null?void 0:p.detail,diagnostics:a.diagnostics,snapshot:a});return}const u=String(a.html||"").trim();if(u){const m=ny(u,d);o({kind:"ready",filePath:r,contentType:"html",contentHtml:m.contentHtml||"<p></p>",plainText:a.plainText,renderState:m.renderState,diagnostics:a.diagnostics,snapshot:a});return}const f=String(a.plainText||"").trim();if(f){o({kind:"ready",filePath:r,contentType:"plain-text",plainText:f,renderState:d,diagnostics:a.diagnostics,snapshot:a});return}o({kind:"empty",filePath:r,message:"文档已读取成功，但未提取到可展示内容。",renderState:d,diagnostics:a.diagnostics,snapshot:a})}).catch(a=>{s||o({kind:"error",filePath:r,status:"parse-failed",message:a instanceof Error?a.message:"文稿预览读取失败。",detail:a instanceof Error?a.stack:void 0,snapshot:{filePath:r,status:"parse-failed",exists:!1,entryCount:0,entries:[],contentTypesXml:null,documentXml:null,paragraphCount:0,paragraphs:[],blockCount:0,blocks:[],bibliographySources:[],plainText:"",html:"<p></p>",diagnostics:{code:"parse-failed",message:a instanceof Error?a.message:"文稿预览读取失败。"}}})}),()=>{s=!0}},[r,n]),i}const xc="templateRegionId",bc="templateRegionLabel",yc="templateRegionIndex",vc="templateRegionEditable",Sg="templateFieldId",kg="templateFieldLabel";function sy(e={}){return{templateDocumentId:e.templateDocumentId,slotBindings:{...e.slotBindings||{}},previewResultPath:e.previewResultPath,commitResultPath:e.commitResultPath,activeTaskId:e.activeTaskId}}function $n(e){return String(e??"").trim()||void 0}function jg(e){if(!(!e.routingPlan&&!e.executionMode))return{routingPlan:e.routingPlan,executionMode:e.executionMode}}function ay(e,n){if(!n)return e;const r=uo(e);return r.document.metadata={...r.document.metadata||{},[Ms]:n},r}function Ld(e,n){return`template-document-region-${e.trim().replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/-{2,}/g,"-").replace(/^-|-$/g,"")||n+1}`}function ly(e,n){return e.map(r=>({...r,metadata:{...r.metadata||{},[xc]:n.regionId,[bc]:n.label,[yc]:n.index,[vc]:n.editable!==!1}}))}function Ig(e){if(!(e!=null&&e.metadata))return null;const n=$n(e.metadata[xc]);if(!n)return null;const r=$n(e.metadata[bc]),i=Number(e.metadata[yc]),o=e.metadata[vc];return{regionId:n,label:r,index:Number.isFinite(i)?i:void 0,editable:o===void 0?!0:!!o}}function cy(e){if(!(e!=null&&e.metadata))return null;const n=$n(e.metadata[Sg]);return n?{fieldId:n,label:$n(e.metadata[kg])}:null}function dy(e,n){return e.blocks.filter(r=>{var i;return((i=Ig(r))==null?void 0:i.regionId)===n})}function uy(e){var n,r;if(e.type==="heading"){const i=Math.max(1,Math.min(e.level||1,6));return`${"#".repeat(i)} ${String(e.text||"").trim()}`.trim()}if(e.type==="image")return`![${typeof e.value=="object"&&e.value&&"alt"in e.value?String(e.value.alt||"").trim():String(e.text||"").trim()}](${e.resourceRef})`;if(e.type==="table"){const i=Array.isArray((n=e.value)==null?void 0:n.headers)?e.value.headers.map(s=>String(s??"")):[],o=Array.isArray((r=e.value)==null?void 0:r.rows)?e.value.rows.map(s=>Array.isArray(s)?s.map(a=>String(a??"")):[]):[];return i.length===0?"":[`| ${i.join(" | ")} |`,`| ${i.map(()=>"---").join(" | ")} |`,...o.map(s=>`| ${s.join(" | ")} |`)].join(`
`)}return String(e.text||"").trim()}function py(e){const n=e.map(r=>uy(r)).map(r=>r.trim()).filter(Boolean);return{finalText:n.join(`

`),finalParagraphs:n}}function fy(e){if(e.document)return e.document;const n=Object.entries(e.session.slotBindings);return Fn({id:`document:${e.artifactId}`,profile:"templateDocument",templateId:e.session.templateDocumentId,metadata:{activeTaskId:e.session.activeTaskId,previewResultPath:e.session.previewResultPath,commitResultPath:e.session.commitResultPath},blocks:[ui({id:"template-document-title",level:1,text:e.session.templateDocumentId?`Template ${e.session.templateDocumentId}`:"Template Document"}),...n.map(([r,i],o)=>gg({id:`slot-${o+1}`,slotKey:r,text:i,value:{text:i}}))],templateHints:{slotOrder:n.map(([r])=>r)},exportHints:{preferredDelivery:"docx",wordSkill:{route:"format-apply",docType:"report"},pdfSkill:{docType:"report"}}})}function $g(e){return Object.fromEntries((e.fieldValues||[]).map(n=>{var o;const r=$n(n.value);return r?[$n((o=e.fieldLabels)==null?void 0:o[n.fieldId])||n.fieldId,r]:null}).filter(n=>!!n))}function my(e){var u;const n=$g(e),r=$n(e.templateTitle)||"正式文稿",i=[ui({id:"template-document-commit-title",level:1,text:r})],o=(e.fieldValues||[]).map(f=>{var p;return{fieldId:f.fieldId,label:$n((p=e.fieldLabels)==null?void 0:p[f.fieldId]),value:$n(f.value)}}).filter(f=>!!f.value);o.length>0&&(i.push(ui({id:"template-document-slot-heading",level:2,text:"字段填充"})),o.forEach((f,p)=>{i.push(gg({id:`template-document-slot-${p+1}`,slotKey:f.label||f.fieldId,text:f.value,value:{text:f.value},metadata:{[Sg]:f.fieldId,[kg]:f.label}}))})),(e.regionResults||[]).map(f=>({regionId:f.regionId,candidateText:$n(f.candidateText)||""})).filter(f=>!!f.candidateText).forEach((f,p)=>{var h;const m=$n((h=e.regionLabels)==null?void 0:h[f.regionId]);m&&i.push(ui({id:`template-document-region-heading-${p+1}`,level:2,text:m}));const g=ly(Ds({text:f.candidateText,blockIdPrefix:Ld(f.regionId,p)}),{regionId:f.regionId,label:m,index:p,editable:!0});g.length>0?i.push(...g):i.push(bs({id:`${Ld(f.regionId,p)}-fallback`,type:"paragraph",text:f.candidateText,metadata:{[xc]:f.regionId,[bc]:m,[yc]:p,[vc]:!0}}))}),i.length===1&&i.push(bs({id:"template-document-empty-body",type:"paragraph",text:"当前结果已生成，但暂未提取到可展示的正文内容。"}));const a=jg({routingPlan:e.routingPlan,executionMode:e.executionMode}),d=(u=e.routingPlan)==null?void 0:u.defaultExecution.strategy;return Fn({id:`document:${e.artifactId||e.templateDocumentId||"template-document-commit"}`,profile:"templateDocument",templateId:e.templateDocumentId,metadata:{activeTaskId:e.activeTaskId,commitResultPath:e.outputPath,previewSource:"commit-result",...a?{[Ms]:a}:{}},blocks:i,templateHints:{slotOrder:Object.keys(n),docxTemplateMode:d,templateContract:d?{kind:"formal-template",mode:d,preserveShell:!0}:void 0},exportHints:{preferredDelivery:"docx",wordSkill:{route:"format-apply",docType:"report"},pdfSkill:{docType:"report"}}})}function gy(e){const n=$g(e),r=jg({routingPlan:e.routingPlan,executionMode:e.executionMode});return hy({artifactId:e.artifactId||`templateDocument:commit:${e.templateDocumentId||"result"}`,command:"commit-template-document",session:sy({templateDocumentId:e.templateDocumentId,slotBindings:n,commitResultPath:e.outputPath,activeTaskId:e.activeTaskId}),document:ay(e.documentOverride||my(e),r),patches:e.patches,metadata:{previewSource:"commit-result",outputPath:e.outputPath,...r?{[Ms]:r}:{}},exportRefs:e.outputPath?[e.outputPath]:void 0})}function Nd(e,n){var r;return{...e,documentArtifact:gy({artifactId:n.artifactId,templateDocumentId:n.templateDocumentId,templateTitle:n.templateTitle,outputPath:e.outputPath,activeTaskId:n.activeTaskId,fieldValues:e.fieldValues,fieldLabels:n.fieldLabels,regionResults:e.regionResults,regionLabels:n.regionLabels,patches:n.patches,documentOverride:n.documentOverride||((r=e.documentArtifact)==null?void 0:r.document),routingPlan:n.routingPlan,executionMode:e.executionMode})}}function hy(e){const n=e.sourceRefs??(e.session.templateDocumentId?[e.session.templateDocumentId]:[]),r=e.exportRefs??[e.session.previewResultPath,e.session.commitResultPath].filter(i=>!!i);return bg({id:e.artifactId,profile:"templateDocument",document:fy(e),sourceRefs:n,patches:e.patches??[],metadata:e.metadata,profileMetadata:{...e.metadata,command:e.command,templateDocumentId:e.session.templateDocumentId,slotBindingCount:Object.keys(e.session.slotBindings).length,previewResultPath:e.session.previewResultPath,commitResultPath:e.session.commitResultPath,activeTaskId:e.session.activeTaskId,runtime:"TemplateDocumentCommandBridge -> useFormalTemplateGeneration -> formalTemplateTaskService"},exportRefs:r})}function Tg(e,n){return e.document.blocks.find(r=>r.id===n)||null}function xy(e,n){return e.document.blocks.find(r=>r.type==="slot"&&r.slotKey===n)||null}function Cg(e){return Array.from(new Set(e.filter(Boolean)))}function Od(e){return String(e??"").trim()||void 0}function by(e){return e.type==="replace_block"||e.type==="fill_slot"||e.type==="replace_image"}function yy(e){if(!e||e.type!=="slot")return"";const n=e.value&&typeof e.value=="object"&&!Array.isArray(e.value)?e.value:null;return Od(n==null?void 0:n.text)||Od(e.text)||""}function vy(e){const n=new Map;e.patches.forEach(s=>{const a="targetId"in s?Tg(e.patchedArtifact,s.targetId):xy(e.patchedArtifact,s.slotKey),d=cy(a),u=yy(a);!(d!=null&&d.fieldId)||!u||n.set(d.fieldId,u)});const r=Array.from(n.keys());if(r.length===0)return{fieldValues:e.currentFieldValues,affectedFieldIds:r};const i=new Map(e.currentFieldValues.map(s=>[s.fieldId,s])),o=Cg([...e.profile.fields.map(s=>s.fieldId),...e.currentFieldValues.map(s=>s.fieldId),...r]);return{affectedFieldIds:r,fieldValues:o.map(s=>{const a=i.get(s),d=n.get(s);return a?d===void 0?a:{...a,value:d,userOverride:!0,confirmed:!0}:d===void 0?null:{fieldId:s,value:d,userOverride:!0,confirmed:!0}}).filter(s=>!!s)}}function wy(e){var p,m,g,h;const n=e.patches.filter(by),r=e.sourceArtifact||((p=e.commitResult)==null?void 0:p.documentArtifact)||null;if(!r)return{ok:!1,error:"当前还没有正式结果，暂时无法提交文稿修改。"};if(!e.commitResult)return{ok:!1,error:"当前模板提交流程上下文不完整，暂时无法提交文稿修改。"};if(!((m=e.profile)!=null&&m.profileId)||!((g=e.profile)!=null&&g.workCopyPath))return{ok:!1,error:"当前模板上下文不完整，暂时无法提交文稿修改。"};if(n.length===0)return{ok:!1,error:"当前没有可提交的文稿修改。"};const i=O0(r,n);if(!i.ok)return{ok:!1,error:`本地预览已更新，但无法整理为可提交版本：${i.error.message}`,patchedArtifact:i.artifact};const o=n.filter(x=>x.type==="fill_slot"),s=n.filter(x=>x.type==="replace_block"||x.type==="replace_image"),{fieldValues:a,affectedFieldIds:d}=vy({currentFieldValues:e.commitResult.fieldValues,profile:e.profile,patchedArtifact:i.artifact,patches:o});if(o.length>0&&d.length===0)return{ok:!1,error:"当前待补内容还没有对应的正式模板字段映射，暂时无法提交。",patchedArtifact:i.artifact};const u=Cg(s.map(x=>{const k=Tg(i.artifact,x.targetId),v=Ig(k);return(v==null?void 0:v.editable)===!1?"":(v==null?void 0:v.regionId)||""}));if(s.length>0&&u.length===0)return{ok:!1,error:"当前修改位置还没有对应的正式模板区域映射，暂时无法提交。",patchedArtifact:i.artifact};const f=u.map(x=>{const k=dy(i.artifact.document,x),v=py(k);return{regionId:x,finalText:v.finalText,finalParagraphs:v.finalParagraphs}}).filter(x=>x.finalText.trim());return s.length>0&&f.length===0?{ok:!1,error:"当前修改区域还没有可提交的正文内容。",patchedArtifact:i.artifact}:d.length===0&&f.length===0?{ok:!1,error:"当前没有整理出可提交的字段或正文修改。",patchedArtifact:i.artifact}:{ok:!0,value:{patchedArtifact:i.artifact,affectedFieldIds:d,affectedRegionIds:u,commitRequest:{profileId:e.profile.profileId,workCopyPath:e.profile.workCopyPath,instruction:((h=e.instruction)==null?void 0:h.trim())||void 0,fieldValues:a,regionPatches:f}}}}function Sy(e){var i,o,s,a,d;const n=e.profile?Object.fromEntries(e.profile.fields.map(u=>[u.fieldId,u.label||u.fieldId])):void 0,r=e.profile?Object.fromEntries(e.profile.regions.map(u=>[u.regionId,u.label||u.regionId])):void 0;return{artifactId:`templateDocument:${e.commitResult.profileId}:commit`,templateDocumentId:e.templateDocumentId||((i=e.profile)==null?void 0:i.knowledgeDocumentId),templateTitle:e.templateTitle||((o=e.profile)==null?void 0:o.title),activeTaskId:(a=(s=e.commitResult.documentArtifact)==null?void 0:s.profileMetadata)==null?void 0:a.activeTaskId,fieldLabels:n,regionLabels:r,routingPlan:(d=e.profile)==null?void 0:d.routingPlan}}function ky(){let e="normal",n="";const r="<think>",i="</think>";function o(a){let d="";for(const u of a)switch(e){case"normal":u==="<"?(n="<",e="maybe-open"):d+=u;break;case"maybe-open":n+=u,r.startsWith(n)?n===r&&(e="inside",n=""):(d+=n,n="",e="normal");break;case"inside":u==="<"&&(n="<",e="maybe-close");break;case"maybe-close":n+=u,i.startsWith(n)?n===i&&(e="normal",n=""):(n="",e="inside");break}return d}function s(){if(e==="normal"||e==="maybe-open"){const a=n;return n="",e="normal",a}return n="",e="normal",""}return{push:o,flush:s}}function Ur(e){let n=e.replace(/<think>[\s\S]*?<\/think>/gi,"");return n=n.replace(/<thinking>[\s\S]*?<\/thinking>/gi,""),n=n.replace(/<think(?:ing)?>[\s\S]*/gi,""),n=n.replace(/<\/think(?:ing)?>/gi,""),n}function y3(e){const n=e.match(/^(#{1,6})\s+.+/m);return n&&n.index!==void 0&&n.index>0&&e.slice(0,n.index).trim().length>0?e.slice(n.index):e}async function pi(e,n,r){const i=window.__imageMode_traceId__;if(i){const p=`[IMAGE-MODE-CIRCUIT-BREAKER] Image mode (traceId=${String(i)}) incorrectly entered paper-generation chain (runWritingAssistant). This is a routing bug — image mode must only call generateImage(), not runWritingAssistant().`;throw console.error(p),new Error(p)}const o=ky();let s="",a=!1;const d=window.electronAPI.onAiEvent(p=>{var g,h;const m=p;if(m.scope==="assistant"&&(m.type==="start"&&((g=n.onStatus)==null||g.call(n,"正在处理当前文档...")),m.type==="status"&&((h=n.onStatus)==null||h.call(n,String(m.message||"正在处理当前文档..."))),m.type==="chunk")){const x=o.push(String(m.chunk||""));s+=x,n.onDelta(x,s)}}),u=()=>{a||(a=!0,d())},f=()=>{u(),n.onError("已停止")};r==null||r.addEventListener("abort",f,{once:!0});try{const p=window.electronAPI.writingAssistant(e);if(r!=null&&r.aborted){u();return}const m=await(r?Promise.race([p,new Promise((g,h)=>{r.addEventListener("abort",()=>h(new DOMException("Aborted","AbortError")),{once:!0})})]):p);u(),await n.onComplete({text:Ur(m)})}catch(p){if(u(),p instanceof DOMException&&p.name==="AbortError")return;n.onError(p instanceof Error?p.message:String(p))}finally{r==null||r.removeEventListener("abort",f)}}const jy="请在底部输入框里描述生成要求。中间区域只负责展示结果预览、打开和下载入口。",Iy="请输入生成需求，例如：以当前模板生成一份给杭州市政府的贺信，时间写 2026 年 4 月，主题围绕浙江人工智能产业发展，语气正式庄重。";function $y(e){return e.fields.map(n=>({fieldId:n.fieldId,value:n.defaultText,userOverride:!1,confirmed:!1}))}function Ty(e,n){return[`请基于正式模板《${e}》生成最终文稿。`,"必须保留模板固定壳层、固定格式和不可编辑区域，只改写允许生成的正文区域与允许替换的字段。","输出内容必须是可直接发出的正式文稿，不要解释流程，不要暴露模板机制。",`用户需求：${n.trim()}`].join(`
`)}function qr(e,n){return(e==null?void 0:e.trim())||n}function Wd(e){return e==="FT_SHELL_INTEGRITY_VIOLATED"}function Cy(e){const n=String(e||"").trim();if(!n)return"";const r=n.match(/```(?:json)?\s*([\s\S]*?)```/i),i=r?r[1].trim():n,o=i.indexOf("{"),s=i.lastIndexOf("}");return o>=0&&s>o?i.slice(o,s+1):i}function Py(e){var i;const n=String(e||"").trim();if(!n)return"";const r=n.match(/用户需求[:：]\s*([\s\S]*)$/);return((i=r==null?void 0:r[1])==null?void 0:i.trim())||n}function $i(e,n){for(const r of n){const i=e.match(r);if(i!=null&&i[1])return i[1].trim()}return""}function Pg(e){const n=new Set(e.fields.map(r=>r.label));return n.has("收件人")&&n.has("主题")&&n.has("发信单位")}function Ay(e){return $i(e,[/recipient\s*[:=：]\s*([^\n,，。；]{2,80})/i,/(?:收件人|收函单位|称谓)\s*[:=：]\s*([^\n,，。；]{2,80})/u,/(?:给|致|向)([^，。；\n]{2,80}?)(?:的)?贺信/u]).replace(/[：:]+$/g,"").trim()}function _y(e){return $i(e,[/date\s*[:=：]\s*([^\n,，。；]{4,40})/i,/(?:日期|时间)\s*[:=：]\s*([^\n,，。；]{4,40})/u,/(?:时间写|日期写)(?:成|为|写|用)?\s*([^\n,，。；]{4,40})/u]).replace(/\s*年\s*/g,"年").replace(/\s*月\s*/g,"月").replace(/\s*日\s*/g,"日").trim()}function Ey(e){return $i(e,[/theme\s*[:=：]\s*([^\n,，。；]{2,80})/i,/主题\s*[:=：]\s*([^\n,，。；]{2,80})/u,/(?:主题(?:围绕|为|是)?|围绕|聚焦|关于)([^，。；\n]{2,80})/u]).replace(/[，。；]+$/g,"").trim()}function zy(e){return $i(e,[/tone\s*[:=：]\s*([^\n,，。；]{2,40})/i,/(?:语气|风格)\s*[:=：]\s*([^\n,，。；]{2,40})/u,/(?:语气|风格)(?:写|为|是|用)?\s*([^，。；\n]{2,40})/u]).replace(/[，。；]+$/g,"").trim()}function Dy(e){return $i(e,[/sender\s*[:=：]\s*([^\n,，。；]{2,80})/i,/(?:发信单位|落款(?:单位)?|署名)\s*[:=：]\s*([^\n,，。；]{2,80})/u,/(?:发信单位|落款(?:单位)?|署名)(?:写|为|是|用)?\s*([^，。；\n]{2,80})/u]).replace(/[，。；]+$/g,"").trim()}function Ry(e){return $i(e,[/(?:optional[_\s-]?context|补充背景)\s*[:=：]\s*([^\n]+)/i]).replace(/[；。]+$/g,"").trim()}function My(e,n,r,i){const o=Pg(e),s=e.fields.map(a=>`- fieldId=${a.fieldId}; label=${a.label}; required=${a.required?"yes":"no"}; default=${a.defaultText||"空"}`).join(`
`);return["你是正式模板字段抽取专家。","任务：把用户需求中的明确信息映射到模板字段。","规则：","1. 只能提取需求中明确给出的信息；无法确定时输出空字符串，不要编造。","2. 保持原始称谓、机构名、日期和电话号码表达。","3. 只输出 JSON，不要附加解释。",'4. JSON 结构固定为：{"fields":[{"fieldId":"...","value":"..."}]}。',o?"5. 当前模板处于语义优先模式：模板原正文只可用于识别文种和版式，不可把模板中的机构名、学校名、地名、历史事件当成待填写事实。":"",`模板标题：${n}`,!o&&i?`模板预览：${i}`:"","字段清单：",s,"用户需求：",r.trim()].filter(Boolean).join(`
`)}function Fy(e){const r=["北京市","天津市","上海市","重庆市","河北省","山西省","辽宁省","吉林省","黑龙江省","江苏省","浙江省","安徽省","福建省","江西省","山东省","河南省","湖北省","湖南省","广东省","海南省","四川省","贵州省","云南省","陕西省","甘肃省","青海省","台湾省","内蒙古自治区","广西壮族自治区","西藏自治区","宁夏回族自治区","新疆维吾尔自治区","香港特别行政区","澳门特别行政区"].find(s=>e.includes(s));if(r)return r;const i={北京:"北京市",天津:"天津市",上海:"上海市",重庆:"重庆市",河北:"河北省",山西:"山西省",辽宁:"辽宁省",吉林:"吉林省",黑龙江:"黑龙江省",江苏:"江苏省",浙江:"浙江省",安徽:"安徽省",福建:"福建省",江西:"江西省",山东:"山东省",河南:"河南省",湖北:"湖北省",湖南:"湖南省",广东:"广东省",海南:"海南省",四川:"四川省",贵州:"贵州省",云南:"云南省",陕西:"陕西省",甘肃:"甘肃省",青海:"青海省",内蒙古:"内蒙古自治区",广西:"广西壮族自治区",西藏:"西藏自治区",宁夏:"宁夏回族自治区",新疆:"新疆维吾尔自治区",香港:"香港特别行政区",澳门:"澳门特别行政区"},o=Object.keys(i).find(s=>e.includes(s));return o?i[o]:""}function By(e,n,r){const i=Py(n);if(!i)return r;const o=new Map,s=i.match(/(?:给|致|向|拜访|前往|到)([^，。；\n]{2,40}(?:招生办公室|教育考试院|教育考试中心|教育厅|招生考试院|办公室|学院|学校|政府))/),a=i.match(/(?:由|安排|拟由|我校由)([^，。；\n]{2,50}(?:一行\d*人|等一行\d*人|等))/),d=i.match(/((?:\d{4}年)?\d{1,2}月\d{1,2}日(?:（[^）]+）)?(?:上午|下午|晚上|中午)?(?:[^，。；\n]{0,12})?)/),u=i.match(/联系人[:：]?\s*([^，。；\n\s]{2,20})/),f=i.match(/(?:联系电话|电话|手机)[:：]?\s*([0-9+＋\-*\s]{7,24})/),p=i.match(/(?:发函日期|日期)[:：]?\s*([^，。；\n]{4,30})/),m=Ay(i),g=_y(i),h=Ey(i),x=zy(i),k=Dy(i),v=Ry(i),y=Fy(i);return s!=null&&s[1]&&o.set("收函单位",s[1].trim()),y&&o.set("目标省份",y),a!=null&&a[1]&&o.set("来访人员说明",a[1].trim()),d!=null&&d[1]&&o.set("拜访时间",d[1].trim()),u!=null&&u[1]&&o.set("联系人",u[1].trim()),f!=null&&f[1]&&o.set("联系电话",f[1].trim()),p!=null&&p[1]&&o.set("发函日期",p[1].trim()),m&&o.set("收件人",m),g&&o.set("日期",g),h&&o.set("主题",h),x&&o.set("语气",x),k&&o.set("发信单位",k),v&&o.set("补充背景",v),r.map(j=>{const S=e.fields.find(P=>P.fieldId===j.fieldId),z=S?o.get(S.label):void 0;return z?{...j,value:z,userOverride:!0,confirmed:!0}:j})}function Ly(e,n,r){const i=JSON.parse(Cy(r)),o=Array.isArray(i.fields)?i.fields:[],s=new Map(o.map(d=>[String(d.fieldId||"").trim(),String(d.value||"").trim()])),a=new Map(o.map(d=>[String(d.label||"").trim(),String(d.value||"").trim()]));return n.map(d=>{const u=e.fields.find(p=>p.fieldId===d.fieldId),f=s.get(d.fieldId)||(u?a.get(u.label):"")||"";return f.trim()?{...d,value:f.trim(),userOverride:!0,confirmed:!0}:d})}async function Ny(e,n,r,i,o){const s=By(e,i,$y(e)),a=Pg(e);try{o("正在理解你的需求，并整理模板里要填写的信息...");let d="";return await pi({instruction:My(e,n,i,r),language:"zh",extraContext:a?void 0:r||void 0},{onDelta:()=>{},onComplete:async u=>{d=u.text},onError:u=>{throw new Error(u)},onStatus:u=>o(u||"正在理解你的需求，并整理模板里要填写的信息...")}),Ly(e,s,d)}catch{return s}}function Oy(e,n){return Array.isArray(e)&&e.length>0?e:n?[n]:[]}function Wy(e){const n=String(e||"").replace(/\\/g,"/").trim();if(!n)return"";const r=n.lastIndexOf("/");return r>=0?n.slice(r+1):n}function Ag(){var R;const{activeWorkspacePath:e}=Ft(),{documents:n,templateDocumentId:r,referenceDocumentIds:i}=Sr(),o=kr(),s=((R=o.sessions.document)==null?void 0:R.selectedKnowledgeBaseIds)||[],{phase:a,profile:d,commitResult:u,resetSession:f,setPhase:p,setProfile:m,setFieldValues:g,setPreviewPlan:h,setPreviewCandidate:x,setCommitResult:k,setErrorMessage:v,setStatusMessage:y,lastInstruction:j,setLastInstruction:S}=zs(),z=c.useMemo(()=>n.find(V=>V.id===r)||null,[n,r]),P=c.useMemo(()=>i.filter(V=>V!==r),[i,r]),I=a==="analyzing"||a==="confirming"||a==="previewing"||a==="committing",b=c.useCallback(V=>{var fe,le;const te=new Date().toISOString(),q=((fe=V.result)==null?void 0:fe.outputPath)||null,W=V.documentArtifact!==void 0?V.documentArtifact:((le=V.result)==null?void 0:le.documentArtifact)||null;o.setModeSession("document",Q=>({...Q,generationPrompt:V.instruction??Q.generationPrompt,generationStatus:{phase:V.phase,message:V.message,updatedAt:te},resultAssetId:q,resultType:q?"docx":null,resultPath:q,resultTitle:q?Wy(q)||Q.resultTitle:"",documentArtifact:W,resultPreviewText:"",resultPreviewUrl:null,lastUpdatedAt:te}))},[o]),$=c.useCallback(async V=>{const te=V.trim();if(f(),S(te),y(jy),b({instruction:te,phase:"running",message:"正在生成正式文稿...",result:null}),!te){const q="请先在底部输入框里描述本次正式文稿需求。";return p("error"),v(q),y(q),b({instruction:te,phase:"error",message:q,result:null}),{success:!1,errorMessage:q}}if(!r){const q="请先在左侧资源管理器里选择模板文档。";return p("error"),v(q),y("还没有选择模板，请先在左侧资源管理器完成这一步。"),b({instruction:te,phase:"error",message:q,result:null}),{success:!1,errorMessage:q}}if(z&&z.sourceType!=="doc"&&z.sourceType!=="docx"){const q="正式模板当前只支持 DOC / DOCX 作为模板，请重新选择模板文档。";return p("error"),v(q),y(q),b({instruction:te,phase:"error",message:q,result:null}),{success:!1,errorMessage:q}}if(!e){const q="请先打开一个工作区，用来保存本次生成的文稿。";return p("error"),v(q),y("还没有打开工作区，暂时无法开始生成。"),b({instruction:te,phase:"error",message:q,result:null}),{success:!1,errorMessage:q}}y("正在读取模板，并确认可以自动填写的内容..."),p("analyzing"),v(null);try{const q=await window.electronAPI.analyzeFormalTemplate({knowledgeDocumentId:r,sampleDocumentIds:[],workspacePath:e});if(!q.success||!q.profile){const w=qr(q.errorMessage,"正式模板分析失败。");return p("error"),v(w),y("模板暂时无法读取，请稍后重试或更换模板。"),b({instruction:te,phase:"error",message:w,result:null}),{success:!1,errorMessage:w}}const W=q.profile;m(W),p("confirming");const fe=await Ny(W,W.title||(z==null?void 0:z.title)||"当前模板",(z==null?void 0:z.previewText)||"",te,y);g(fe),p("previewing"),y("正在根据你的要求起草文稿...");const le=Ty(W.title||(z==null?void 0:z.title)||"当前模板",te),Q=await window.electronAPI.previewFormalTemplateTask({profileId:W.profileId,workCopyPath:W.workCopyPath,instruction:le,referenceDocumentIds:P,sampleDocumentIds:[],fieldValues:fe,retrievalMode:"auto",knowledgeBaseIds:s});if(!Q.success||!Q.plan){const w=qr(Q.errorMessage,"正式模板生成预演失败。");return p("error"),v(w),y("这次起草没有完成，请调整需求后重试。"),b({instruction:te,phase:"error",message:w,result:null}),{success:!1,errorMessage:w}}const ge=Oy(Q.regionCandidates,Q.regionCandidate);if(Q.plan.regionPlans.length>0&&ge.length===0){const w="正式模板预演没有产出任何可写区域候选，请更换模板或稍后重试。";return p("error"),v(w),y("模板已经识别成功，但正文区域没有成功起草出来。"),b({instruction:te,phase:"error",message:w,result:null}),{success:!1,errorMessage:w}}h(Q.plan),x(ge[0]||null);const J=Q.plan.pendingFieldIds.map(w=>W.fields.find(L=>L.fieldId===w)).filter(w=>!!(w!=null&&w.required)).map(w=>(w==null?void 0:w.label)||"").filter(Boolean);if(J.length>0){const w=`需求里还缺少关键信息：${J.join("、")}。请补充后重新生成。`;return p("error"),v(w),y("还缺少几项关键信息，请补充后再试一次。"),b({instruction:te,phase:"error",message:w,result:null}),{success:!1,errorMessage:w}}p("committing"),y("正在整理版式并生成最终文稿...");const H=await window.electronAPI.commitFormalTemplateTask({profileId:W.profileId,workCopyPath:W.workCopyPath,instruction:le,fieldValues:fe,regionPatches:ge.map(w=>({regionId:w.regionId,finalText:w.candidateText,finalParagraphs:w.candidateParagraphs}))});if(!H.success||!H.result){const L=Wd(H.errorCode)?`模板壳层校验失败：${qr(H.errorMessage,"输出结果未通过校验。")}`:qr(H.errorMessage,"文稿写回失败。");return p("error"),v(L),y("生成过程中断了，文稿还没有准备好。"),b({instruction:te,phase:"error",message:L,result:null}),{success:!1,errorMessage:L}}if(!H.result.allCommitted||!H.result.shellValidation.passed){const w=H.result.shellValidation.errorMessage||"模板壳层校验未通过，本次生成未生效。";return p("error"),v(w),y("文稿未能顺利生成，请稍后再试。"),b({instruction:te,phase:"error",message:w,result:null}),{success:!1,errorMessage:w}}const T=Nd(H.result,{artifactId:`templateDocument:${W.profileId}:commit`,templateDocumentId:r||W.knowledgeDocumentId,templateTitle:(z==null?void 0:z.title)||W.title,fieldLabels:Object.fromEntries(W.fields.map(w=>[w.fieldId,w.label||w.fieldId])),regionLabels:Object.fromEntries(W.regions.map(w=>[w.regionId,w.label||w.regionId])),routingPlan:W.routingPlan});return k(T),p("completed"),y("文稿已准备好，可以在中间区域预览、打开或下载。"),b({instruction:te,phase:"completed",message:"正式文稿已生成，可在右侧预览与导出。",result:T}),{success:!0,result:T}}catch(q){const W=q instanceof Error?q.message:"正式模板生成失败。";return p("error"),v(W),y("这次生成没有完成，请调整需求后重试。"),b({instruction:te,phase:"error",message:W,result:null}),{success:!1,errorMessage:W}}},[e,f,P,b,k,v,g,S,p,x,h,m,y,z==null?void 0:z.previewText,z==null?void 0:z.title,r]),O=c.useCallback(async(V,te)=>{const q=o.sessions.document.documentArtifact||(u==null?void 0:u.documentArtifact)||null,W=wy({commitResult:u,sourceArtifact:q,profile:d,instruction:j||void 0,patches:V});if(!W.ok)return y(W.error),{success:!1,errorMessage:W.error};p("committing"),v(null),y((te==null?void 0:te.pendingStatusMessage)||"正在把当前修改提交到正式模板结果...");try{const fe=await window.electronAPI.commitFormalTemplateTask(W.value.commitRequest);if(!fe.success||!fe.result){const H=Wd(fe.errorCode)?`模板壳层校验失败：${qr(fe.errorMessage,"输出结果未通过校验。")}`:qr(fe.errorMessage,(te==null?void 0:te.genericFailureMessage)||"文稿修改提交失败。");return p("error"),v(H),y(H),b({instruction:j||void 0,phase:"error",message:H,result:u,documentArtifact:q}),{success:!1,errorMessage:H}}if(!fe.result.allCommitted||!fe.result.shellValidation.passed){const J=fe.result.shellValidation.errorMessage||(te==null?void 0:te.shellValidationFailureMessage)||"模板壳层校验未通过，本次文稿修改未生效。";return p("error"),v(J),y(J),b({instruction:j||void 0,phase:"error",message:J,result:u,documentArtifact:q}),{success:!1,errorMessage:J}}const le=Sy({commitResult:fe.result,profile:d,templateDocumentId:r||void 0,templateTitle:z==null?void 0:z.title}),Q=[...W.value.patchedArtifact.patches],ge=Nd(fe.result,{...le,patches:Q,documentOverride:W.value.patchedArtifact.document});return k(ge),p("completed"),y((te==null?void 0:te.successStatusMessage)||"文稿修改已提交为正式结果。"),b({instruction:j||void 0,phase:"completed",message:(te==null?void 0:te.successMirrorMessage)||"文稿修改已提交为正式结果。",result:ge}),{success:!0,result:ge,committedPatches:Q,affectedFieldIds:W.value.affectedFieldIds,affectedRegionIds:W.value.affectedRegionIds}}catch(fe){const le=fe instanceof Error?fe.message:(te==null?void 0:te.genericFailureMessage)||"文稿修改提交失败。";return p("error"),v(le),y(le),b({instruction:j||void 0,phase:"error",message:le,result:u,documentArtifact:q}),{success:!1,errorMessage:le}}},[u,j,d,k,v,p,y,b,z==null?void 0:z.title,r,o.sessions.document.documentArtifact]),D=c.useCallback(async V=>O(V.filter(te=>te.type==="replace_block"),{pendingStatusMessage:"正在把当前段落改写提交到正式模板结果...",successStatusMessage:"段落改写已提交为正式结果。",successMirrorMessage:"段落改写已提交为正式结果。",genericFailureMessage:"段落改写提交失败。",shellValidationFailureMessage:"模板壳层校验未通过，本次段落改写未生效。"}),[O]);return{templateDocument:z,isBusy:I,generateDocument:$,commitDocumentEdit:O,commitRewriteBlock:D}}const _g=c.createContext(null);function Uy({children:e}){const[n,r]=c.useState(null),i=c.useMemo(()=>({runtime:n,setRuntime:r}),[n]);return t.jsx(_g.Provider,{value:i,children:e})}function wc(){const e=c.useContext(_g);if(!e)throw new Error("useDocumentEngineRuntime 必须在 DocumentEngineRuntimeProvider 内使用");return e}function v3(e){const{setRuntime:n}=wc();c.useEffect(()=>(n(e),()=>n(null)),[e,n])}function Hy(e){const r=String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").split(/\n{2,}/).map(i=>i.trim()).filter(Boolean);return r.length?r.map(i=>`<p>${i.replace(/\n/g,"<br />")}</p>`).join(""):"<p></p>"}const Eg=c.createContext(null);function Ky(e,n){const r=encodeURI(e.replace(/\\/g,"/"));return`<div style="text-align:center;padding:20px;background:#1a1a2e;min-height:100vh;"><img src="file://${r.startsWith("/")?r:`/${r}`}" alt="${n}" style="max-width:100%;max-height:90vh;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.4);" /></div>`}function $l(e){const n=e.replace(/\\/g,"/"),r=encodeURI(n).replace(/[?#]/g,i=>encodeURIComponent(i));return r.startsWith("/")?`file://${r}`:/^[a-zA-Z]:\//.test(r)?`file:///${r}`:`file:///${r}`}function Gy(e){var r,i;const n=e;return!!(n&&Array.isArray(n.blocks)&&Array.isArray(n.resources)&&(n.profile==="paper"||((i=(r=n.document)==null?void 0:r.metadata)==null?void 0:i.generatedBy)==="paper-generation"))}function Tl(e,n){const r=String(e||"").replace(/\\/g,"/").replace(/\/+$/g,""),i=String(n||"").replace(/\\/g,"/").replace(/^\/+/,"");return r?i?`${r}/${i}`:r:i}function ln(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function qy(e,n){if(e.type==="heading"){const r=Math.max(1,Math.min(Number(e.level||1),6));return`<h${r}>${ln(e.text||"")}</h${r}>`}if(e.type==="paragraph")return`<p>${ln(e.text||"").replace(/\n/g,"<br />")}</p>`;if(e.type==="list")return`<ul>${(Array.isArray(e.items)?e.items:[]).map(i=>`<li>${ln(i)}</li>`).join("")}</ul>`;if(e.type==="table")return`<table><tbody>${(Array.isArray(e.rows)?e.rows:[]).map(i=>`<tr>${Array.isArray(i)?i.map(o=>`<td>${ln(o)}</td>`).join(""):""}</tr>`).join("")}</tbody></table>`;if(e.type==="code")return`<pre><code>${ln(e.text||"")}</code></pre>`;if(e.type==="image"){const r=e.assetId&&n.get(e.assetId)||"";return r?`<figure><img src="${ln(r)}" alt="${ln(e.text||"image")}" /><figcaption>${ln(e.text||"")}</figcaption></figure>`:`<div class="image-placeholder">${ln(e.text||"图片")}</div>`}return e.text?`<p>${ln(e.text)}</p>`:""}function Ud(e,n,r,i,o){var d;const s=new Map;n&&i&&n.assets.forEach(u=>{!u.id||!u.relativePath||s.set(u.id,$l(Tl(i,u.relativePath)))});const a=o||((d=n==null?void 0:n.blocks)!=null&&d.length?n.blocks.map(u=>qy(u,s)).join(""):`<pre>${ln(r||"当前还没有可展示的解析结果。")}</pre>`);return`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${ln(e)}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #eef3f8 0%, #e7edf4 100%);
        color: #243447;
        font-family: 'Segoe UI', 'PingFang SC', 'Noto Sans SC', sans-serif;
      }
      .page {
        box-sizing: border-box;
        max-width: 920px;
        margin: 24px auto;
        padding: 32px 40px;
        background: #fff;
        border-radius: 18px;
        box-shadow: 0 18px 46px rgba(36, 52, 71, 0.12);
      }
      h1, h2, h3, h4, h5, h6 { color: #173457; line-height: 1.45; margin: 1.2em 0 0.55em; }
      p, li, td, th, pre, code { font-size: 14px; line-height: 1.8; }
      p { margin: 0.75em 0; white-space: pre-wrap; }
      ul, ol { padding-left: 1.4em; }
      table { width: 100%; border-collapse: collapse; margin: 1em 0; }
      td, th { border: 1px solid #dbe5ef; padding: 8px 10px; vertical-align: top; }
      th { background: #f5f8fc; }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        background: #f7f9fc;
        border: 1px solid #e1e8f0;
        border-radius: 12px;
        padding: 14px;
      }
      img { max-width: 100%; border-radius: 10px; box-shadow: 0 10px 22px rgba(36, 52, 71, 0.12); }
      figure { margin: 1.2em 0; }
      figcaption { margin-top: 8px; color: #617488; font-size: var(--font-size-xs); }
      .image-placeholder {
        padding: 18px;
        border: 1px dashed #c8d7e5;
        border-radius: 12px;
        background: #f7fbff;
        color: #5f7488;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <main class="page">${a||"<p>当前还没有可展示的解析结果。</p>"}</main>
  </body>
</html>`}function Vy({children:e}){const{runtime:n}=wc(),{openTab:r,tabs:i,activeTabId:o,setStatusMessage:s,ensureCurrentDocumentSaved:a,registerSaveHandler:d,runSaveHandler:u}=Jn(),f=Sr(),p=c.useRef(0),m=i.find(P=>P.id===o)||null,[g,h]=c.useState(null),x=c.useCallback(async(P,I)=>{const b=await window.electronAPI.getKnowledgeDocument(f.departmentId,P),$=String((b==null?void 0:b.extractedText)||(b==null?void 0:b.originalExtractedText)||"").trim();if(!b||!$)return s(`无法提取 ${I} 的结构化文本`),!1;const O=`${b.meta.title||I}-提取文本.md`;return await r(null,O,Hy($)),s(`已将 ${I} 转为结构化文本并载入编辑器`),!0},[r,s,f.departmentId]),k=c.useCallback(async(P,I)=>{var V,te;if(!n){s("文档引擎尚未就绪，请稍后再试");return}const b=++p.current;if(!await a("打开其他文件")||b!==p.current)return;const $=String(P),O=$.split(/[\\/]/).pop()||"document",D=(V=O.split(".").pop())==null?void 0:V.toLowerCase(),R=I!=null&&I.sourceContext?`mail:${I.sourceContext.messageId}:${I.sourceContext.originalAttachmentName}`:`local:${$.replace(/\\/g,"/")}`;try{if(D&&["png","jpg","jpeg","gif","webp","svg"].includes(D)){if(b!==p.current||(await r($,O,Ky($,O),{canonicalDocumentId:R}),b!==p.current))return;s(`已预览图片: ${O}`);return}if(D==="pdf"){const fe=await window.electronAPI.importKnowledgeDocumentFromPath(f.departmentId,$);if(b!==p.current)return;const le=fe.imported[0]||fe.duplicates[0]||null;if(le!=null&&le.id){await x(le.id,O);return}const Q=fe.failed[0];s(Q?`PDF 转文本失败: ${Q.error}`:`无法打开 PDF: ${O}`);return}if(D==="doc"){const fe=await window.electronAPI.openExternalFile($);if(b!==p.current)return;if(!fe.success){s(`无法打开 DOC: ${fe.error||"未知错误"}`);return}s(`DOC 文件已使用系统默认程序打开: ${O}`);return}if(O.endsWith(".aidoc.json")){const fe=await window.electronAPI.readFile($);if(b!==p.current)return;let le=null;try{le=JSON.parse(fe.content||"{}")}catch{le=null}if(Gy(le)){const Q=Rs(le),ge=((te=Q.meta)==null?void 0:te.title)||O.slice(0,-11);if(await n.loadDocument({filePath:$,fileName:ge,content:B0(Q),sourceContext:I==null?void 0:I.sourceContext,canonicalDocumentId:R}),b!==p.current)return;window.dispatchEvent(new CustomEvent("workspace-document-loaded",{detail:{source:"paper-json",documentSchema:Q,filePath:$}})),s(`已打开论文文稿: ${ge}`);return}if(!(I!=null&&I.isInternalOpen)){const Q=$.includes("\\")?"\\":"/",ge=$.replace(/[/\\][^/\\]+$/,""),J=O.slice(0,-11),H=[".docx",".html",".htm",".md",".txt"];for(const w of H){const L=`${ge}${Q}${J}${w}`;try{if(w===".docx"){const N=await window.electronAPI.readOoxmlPackage(L);if(b!==p.current)return;if(!N.exists)continue}else if(await window.electronAPI.readFile(L),b!==p.current)return;k(L,{sourceContext:I==null?void 0:I.sourceContext});return}catch{if(b!==p.current)return}}if(b!==p.current)return;const T=O.endsWith(".aidoc.json")?O.slice(0,-11):O;s(`"${T}" 是 AI Office 内部草稿状态文件，无法直接作为正式文稿打开。请打开对应的 Word 或 HTML 文件。`);return}try{const Q=le||{};if(Q.format==="aidoc"){if(await n.loadDocument({filePath:$,fileName:O,content:Q.html||"<p></p>",...Q.tiptapJson?{tiptapJson:Q.tiptapJson}:{},paperTemplateId:Q.paperTemplateId??null,sourceContext:I==null?void 0:I.sourceContext,canonicalDocumentId:R}),b!==p.current)return;s(`已打开: ${O}`);return}}catch{}if(b!==p.current||(await n.loadDocument({filePath:$,fileName:O,content:"<p></p>",sourceContext:I==null?void 0:I.sourceContext,canonicalDocumentId:R}),b!==p.current))return;s(`已打开: ${O}`);return}if(D==="docx"&&n.engineId==="embedded-office-engine"){const fe=await window.electronAPI.readOoxmlPackage($);if(b!==p.current)return;if(fe.exists&&fe.documentXml){if(await n.loadDocument({filePath:$,fileName:O,content:fe.html,sourceContext:I==null?void 0:I.sourceContext,canonicalDocumentId:R}),b!==p.current)return;s(`已通过 embedded engine 打开 DOCX: ${O}`);return}}const q=await window.electronAPI.readFile($);if(b!==p.current)return;const W=D==="docx"&&q.preserveOriginalOnSave;if(await n.loadDocument({filePath:W?null:$,fileName:O,content:q.content||"<p></p>",preserveOriginalOnSave:W,sourceContext:I==null?void 0:I.sourceContext,canonicalDocumentId:R}),b!==p.current)return;if(W){s(`已安全导入 DOCX（不会自动覆盖原文件）: ${O}`);return}s(D==="docx"?`已打开 DOCX: ${O}`:`已打开: ${O}`)}catch(q){if(b!==p.current)return;const W=q instanceof Error?q.message:String(q);s(`打开文件失败: ${O}${W?` (${W})`:""}`)}},[a,x,r,n,s,f.departmentId]);c.useEffect(()=>{const P=I=>{const b=I.detail,$=String((b==null?void 0:b.filePath)||"").trim();$&&h({filePath:$,sourceContext:b==null?void 0:b.sourceContext})};return window.addEventListener("ai-office-open-document-request",P),()=>window.removeEventListener("ai-office-open-document-request",P)},[]),c.useEffect(()=>{if(!g||!n)return;const P=g;h(null),k(P.filePath,{sourceContext:P.sourceContext})},[k,g,n]);const v=c.useCallback(async P=>{if(!n)return s("文档引擎尚未就绪，请稍后再试"),!1;if(!await a("打开知识库预览"))return!1;const I=String(P||"").trim();if(!I)return s("知识文档 ID 无效"),!1;const[b,$]=await Promise.all([window.electronAPI.getKnowledgeDocument(f.departmentId,I),window.electronAPI.getKnowledgeBaseInfo(f.departmentId)]);if(!b)return s("知识文档不存在或已被删除"),!1;const O=b.meta.originalName||b.meta.title||"知识文档",D=String(($==null?void 0:$.rootPath)||""),R=Tl(D,b.meta.storedRelativePath),V=b.assetDirRelativePath?Tl(D,b.assetDirRelativePath):null,te=b.meta.sourceType;if(te==="pdf")return await r(null,O,"",{preview:{kind:"pdf",source:$l(R),hint:"当前知识文档以 PDF 只读模式内嵌预览。缩放、翻页与搜索由 Chromium 查看器提供。",actionLabel:"用系统程序打开原件",externalFilePath:R}}),s(`已只读打开知识文档：${b.meta.title}`),!0;if(te==="image")return await r(null,O,"",{preview:{kind:"frame",sourceDoc:`<!doctype html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#111827;"><img src="${ln($l(R))}" alt="${ln(O)}" style="max-width:100vw;max-height:100vh;object-fit:contain;" /></body></html>`,hint:"当前知识图片以只读方式打开。",actionLabel:"用系统程序打开原图",externalFilePath:R}}),s(`已只读打开知识图片：${b.meta.title}`),!0;if(te==="docx"){const W=await window.electronAPI.readOoxmlPackage(R).catch(()=>null);if(W!=null&&W.exists&&W.html)return await r(null,O,"",{preview:{kind:"frame",sourceDoc:Ud(b.meta.title,null,"",null,W.html),hint:"当前知识文档以只读方式打开。内容来自 DOCX 结构化快照，不会改写原文件。",actionLabel:"用系统程序打开原件",externalFilePath:R}}),s(`已只读打开知识文档：${b.meta.title}`),!0}const q=Ud(b.meta.title,b.parsedDocument,b.extractedText||b.originalExtractedText||"",V);return await r(null,O,"",{preview:{kind:"frame",sourceDoc:q,hint:`当前知识文档以只读方式打开。内容来自 ${te.toUpperCase()} 的解析结果，不会改写原文件。`,actionLabel:"用系统程序打开原件",externalFilePath:R||null}}),s(`已只读打开知识文档：${b.meta.title}`),!0},[a,r,n,s,f.departmentId]),y=c.useCallback(async()=>{const P=await window.electronAPI.openFileDialog();P&&await k(P)},[k]),j=c.useCallback(async P=>{if(m!=null&&m.preview){s("当前预览标签为只读模式，不能直接保存");return}if(!((P==null?void 0:P.mode)!=="save-as"&&await u())){if(!n){s("文档引擎尚未就绪，请稍后再试");return}await n.saveDocument(P)}},[m==null?void 0:m.preview,u,n,s]),S=c.useCallback(async()=>{await j({reason:"manual",mode:"save-as"})},[j]);c.useEffect(()=>{const P=I=>{if(!(I.ctrlKey||I.metaKey))return;const b=I.key.toLowerCase();if(b==="o"){I.preventDefault(),y();return}if(b==="s"&&I.shiftKey){I.preventDefault(),S();return}b==="s"&&(I.preventDefault(),j({reason:"manual"}))};return window.addEventListener("keydown",P),()=>window.removeEventListener("keydown",P)},[y,j,S]);const z=c.useMemo(()=>({requestOpenFromDialog:y,openDocumentPath:k,openKnowledgeDocumentPreview:v,saveActiveDocument:j,saveActiveDocumentAs:S}),[k,v,y,j,S]);return t.jsx(Eg.Provider,{value:z,children:e})}function Fs(){const e=c.useContext(Eg);if(!e)throw new Error("useDocumentEngineHostCommands 必须在 DocumentEngineHostCommandsProvider 内使用");return e}const $o=3.7795275591,ia={"academic-cn":{id:"academic-cn",label:"中文期刊",pagePadding:"40px 60px 80px",fontFamily:"Source Serif 4, Noto Serif SC, SimSun, serif",fontSize:"15px",lineHeight:"1.9",textIndent:"2em",paragraphSpacing:"8px",headingAlign:"center",pageMargins:{top:25.4,right:31.7,bottom:25.4,left:31.7},fontSizePt:12,lineSpacingMultiple:1.5,spacingBeforePt:0,spacingAfterPt:6},"academic-en":{id:"academic-en",label:"English Journal",pagePadding:"44px 64px 84px",fontFamily:"Times New Roman, Georgia, serif",fontSize:"14px",lineHeight:"1.8",textIndent:"0",paragraphSpacing:"8px",headingAlign:"center",pageMargins:{top:25.4,right:25.4,bottom:25.4,left:25.4},fontSizePt:12,lineSpacingMultiple:2,spacingBeforePt:0,spacingAfterPt:8},thesis:{id:"thesis",label:"学位论文",pagePadding:"48px 72px 88px",fontFamily:"Times New Roman, Noto Serif SC, serif",fontSize:"15px",lineHeight:"2",textIndent:"2em",paragraphSpacing:"10px",headingAlign:"center",pageMargins:{top:25.4,right:31.7,bottom:25.4,left:31.7},fontSizePt:12,lineSpacingMultiple:1.5,spacingBeforePt:0,spacingAfterPt:6},compact:{id:"compact",label:"紧凑报告",pagePadding:"32px 42px 64px",fontFamily:"Source Serif 4, Noto Serif SC, serif",fontSize:"14px",lineHeight:"1.6",textIndent:"0",paragraphSpacing:"6px",headingAlign:"left",pageMargins:{top:20,right:20,bottom:20,left:20},fontSizePt:11,lineSpacingMultiple:1.15,spacingBeforePt:0,spacingAfterPt:4}};function w3(e){return`${Math.round(e.top*$o)}px ${Math.round(e.right*$o)}px ${Math.round(e.bottom*$o)}px ${Math.round(e.left*$o)}px`}const Cl="academic-cn";function S3(e){return String(e||"").toLowerCase()==="en"?"academic-en":"academic-cn"}function zg(e){return e&&ia[e]||ia[Cl]}const Yy=l.div`
  border-radius: 16px;
  border: 1px solid ${({$tone:e})=>e==="error"?"#efc7c7":e==="warning"?"#ead9b8":"#d6e0ea"};
  background: ${({$tone:e})=>e==="error"?"#fff2f2":e==="warning"?"#fff9ef":"#f8fbfe"};
  padding: 16px;
  height: 100%;
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 8px;
`,oa=l.div`
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 4px 2px;
  font-size: var(--font-size-sm);
  line-height: 1.75;
  color: #6a7d91;
`,Jy=l.div`
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: #1f3447;
`,Xy=l.div`
  font-size: var(--font-size-sm);
  line-height: 1.75;
  color: #5f7487;
  white-space: pre-wrap;
  word-break: break-word;
`,Zy=l.div`
  border-radius: 16px;
  border: 1px solid #dfe8f1;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef3f8 100%);
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 16px;
`,Qy=l.div`
  ${({$templateId:e})=>{const n=zg(e),r=parseFloat(n.fontSize)||15;return`
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      box-shadow: 0 14px 38px rgba(20, 40, 62, 0.08);
      border-radius: 12px;
      padding: var(--doc-preview-page-padding, ${n.pagePadding});
      position: relative;
      min-height: 100%;
      color: #222;

      .doc-preview-content {
        position: relative;
        z-index: 1;
        font-family: var(--doc-preview-font-family, ${n.fontFamily});
        font-size: var(--doc-preview-font-size, ${n.fontSize});
        line-height: var(--doc-preview-line-height, ${n.lineHeight});
        letter-spacing: 0.02em;
      }

      .doc-preview-content h1 {
        font-size: 28px;
        font-weight: 700;
        margin: 36px 0 20px;
        text-align: center;
        letter-spacing: 0.04em;
      }

      .doc-preview-content h2 {
        font-size: 21px;
        font-weight: 700;
        margin: 24px 0 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid #eee;
        text-align: var(--doc-preview-heading-align, ${n.headingAlign==="center"?"center":"left"});
      }

      .doc-preview-content h3 {
        font-size: 17px;
        font-weight: 600;
        margin: 18px 0 8px;
      }

      .doc-preview-content p {
        margin: var(--doc-preview-paragraph-spacing, ${n.paragraphSpacing}) 0;
        text-align: justify;
        text-indent: var(--doc-preview-text-indent, ${n.textIndent});
        line-height: var(--doc-preview-line-height, ${n.lineHeight});
      }

      .doc-preview-content [data-semantic-role="paper-title"] {
        margin-top: ${e==="academic-en"?"72px":"48px"};
        margin-bottom: 12px;
        font-size: 30px;
        line-height: 1.4;
        text-align: center;
      }

      .doc-preview-content [data-semantic-role="abstract-heading"] {
        margin-top: 28px;
        border-bottom: none;
        font-size: 18px;
        font-weight: 700;
        text-align: center;
      }

      .doc-preview-content [data-semantic-role="abstract-body"] {
        text-indent: 0;
        font-size: calc(var(--doc-preview-font-size-px, ${r}px) - 1px);
        line-height: 1.75;
        margin-bottom: 4px;
      }

      .doc-preview-content [data-semantic-role="keywords-heading"] {
        border-bottom: none;
        font-size: 16px;
        font-weight: 700;
        text-align: left;
        margin-top: 12px;
        margin-bottom: 8px;
      }

      .doc-preview-content [data-semantic-role="keywords-body"] {
        text-indent: 0;
        font-size: calc(var(--doc-preview-font-size-px, ${r}px) - 1px);
        line-height: 1.75;
        margin-bottom: 8px;
      }

      .doc-preview-content [data-semantic-role="section-heading"],
      .doc-preview-content [data-semantic-role="references-heading"] {
        border-bottom: 1px solid #eee;
        font-size: 21px;
      }

      .doc-preview-content [data-semantic-role="reference-item"] {
        text-indent: 0;
        line-height: 1.8;
      }

      .doc-preview-content blockquote {
        border-left: 2px solid #d9dee8;
        padding: 8px 14px;
        margin: 14px 0;
        border-radius: 0 4px 4px 0;
        background: #fafbfe;
        color: #616975;
        font-size: 14px;
        line-height: 1.7;
      }

      .doc-preview-content ul,
      .doc-preview-content ol {
        padding-left: 24px;
      }

      .doc-preview-content li {
        margin: 4px 0;
      }

      .doc-preview-content li > p {
        text-indent: 0;
      }

      .doc-preview-content img {
        max-width: 100%;
        border-radius: 4px;
        margin: 12px 0;
      }

      .doc-preview-content figure {
        margin: 16px 0;
        text-align: center;
      }

      .doc-preview-content figcaption {
        font-size: var(--font-size-xs);
        color: #666;
        margin-top: 6px;
        line-height: 1.6;
      }

      .doc-preview-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
      }

      .doc-preview-content th,
      .doc-preview-content td {
        border: 1px solid #e0e0e0;
        padding: 8px 12px;
        text-align: left;
      }

      .doc-preview-content th {
        background: #f0f2f8;
        font-weight: 600;
        color: #444;
      }

      .doc-preview-content .formula-node {
        cursor: default;
        user-select: none;
      }

      .doc-preview-content .formula-inline {
        display: inline-block;
        padding: 0 3px;
        margin: 0 1px;
        border-radius: 4px;
        background: rgba(14, 99, 156, 0.08);
        vertical-align: middle;
      }

      .doc-preview-content .formula-block {
        display: flex;
        justify-content: center;
        margin: 10px 0;
        padding: 6px 10px;
        border-radius: 6px;
        background: #f8fafd;
        border: 1px solid #e8edf3;
        overflow-x: auto;
      }

      .doc-preview-content .katex {
        font-size: 1.02em;
      }
    `}}
`,ev=l.div`
  position: absolute;
  top: 18px;
  left: 40px;
  right: 40px;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  color: #64748b;
  font-size: var(--font-size-xs);
  line-height: 1.45;
  white-space: pre-wrap;
  text-align: center;
  pointer-events: none;
  z-index: 1;
`,tv=l.div`
  position: absolute;
  left: 40px;
  right: 40px;
  bottom: 14px;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px 0;
  border-top: 1px solid rgba(148, 163, 184, 0.28);
  color: #64748b;
  font-size: var(--font-size-xs);
  line-height: 1.45;
  white-space: pre-wrap;
  text-align: center;
  pointer-events: none;
  z-index: 1;
`,nv=l.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: rgba(148, 163, 184, 0.22);
  font-size: clamp(56px, 9vw, 96px);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transform: rotate(-24deg);
  text-align: center;
  white-space: pre-wrap;
  pointer-events: none;
  user-select: none;
  z-index: 0;
`,rv=l.div`
  border-radius: 16px;
  border: 1px solid #dfe8f1;
  background: #ffffff;
  padding: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  font-size: var(--font-size-sm);
  line-height: 1.9;
  color: #203245;
  white-space: pre-wrap;
`,Hd=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.7;
  color: #6e8295;
`;function iv(e,n){const r=String(e||n).trim().split(/\s+/).filter(Boolean);return r.length===1?[r[0],r[0],r[0],r[0]]:r.length===2?[r[0],r[1],r[0],r[1]]:r.length===3?[r[0],r[1],r[2],r[1]]:r.length>=4?[r[0],r[1],r[2],r[3]]:["40px","60px","80px","60px"]}function ov(e,n,r,i){const[o,s,a,d]=iv(e,i);return`${n?`calc(${o} + 34px)`:o} ${s} ${r?`calc(${a} + 30px)`:a} ${d}`}function sv({preview:e,idleMessage:n,loadingMessage:r="正在读取文稿预览...",testId:i}){var x,k,v;if(e.kind==="idle")return t.jsx(oa,{"data-testid":i,children:n});if(e.kind==="loading")return t.jsx(oa,{"data-testid":i,children:r});if(e.kind==="error")return t.jsxs(Yy,{$tone:"error","data-testid":i,children:[t.jsx(Jy,{children:"文稿预览读取失败"}),t.jsx(Xy,{children:e.message}),e.detail?t.jsx(Hd,{children:e.detail}):null]});if(e.kind==="empty")return t.jsx(oa,{"data-testid":i,children:e.message});if(e.contentType==="plain-text")return t.jsxs("div",{"data-testid":i,children:[t.jsx(rv,{children:e.plainText}),t.jsx(Hd,{children:"当前预览已回退为纯文本模式，因为没有可直接渲染的 HTML 内容。"})]});const o=((x=e.renderState)==null?void 0:x.paperTemplateId)||Cl,s=zg(o),a=(k=e.renderState)==null?void 0:k.shell,d=(v=e.renderState)==null?void 0:v.bodyStyle,u=!!(a!=null&&a.hasHeader||String((a==null?void 0:a.headerText)||"").trim()),f=!!(a!=null&&a.hasFooter||String((a==null?void 0:a.footerText)||"").trim()),p=!!String((a==null?void 0:a.watermarkText)||"").trim(),m=ov(d==null?void 0:d.pagePadding,u,f,s.pagePadding),g=parseFloat((d==null?void 0:d.fontSize)||s.fontSize)||parseFloat(s.fontSize)||15,h={"--doc-preview-page-padding":m,"--doc-preview-font-family":(d==null?void 0:d.fontFamily)||s.fontFamily,"--doc-preview-font-size":(d==null?void 0:d.fontSize)||s.fontSize,"--doc-preview-font-size-px":`${g}px`,"--doc-preview-line-height":(d==null?void 0:d.lineHeight)||s.lineHeight,"--doc-preview-text-indent":(d==null?void 0:d.textIndent)||s.textIndent,"--doc-preview-paragraph-spacing":(d==null?void 0:d.paragraphSpacing)||s.paragraphSpacing,"--doc-preview-heading-align":(d==null?void 0:d.headingAlign)||(s.headingAlign==="center"?"center":"left")};return t.jsx(Zy,{"data-testid":i,children:t.jsxs(Qy,{$templateId:o,style:h,children:[p&&(a!=null&&a.watermarkText)?t.jsx(nv,{children:a.watermarkText}):null,u?t.jsx(ev,{children:(a==null?void 0:a.headerText)||""}):null,t.jsx("div",{className:"doc-preview-content",dangerouslySetInnerHTML:{__html:e.contentHtml||"<p></p>"}}),f?t.jsx(tv,{children:(a==null?void 0:a.footerText)||""}):null]})})}const Kd=[{value:"document",label:"文稿",description:"基于模板生成可直接检查和导出的正式文稿。",composerPlaceholder:"请输入文稿生成需求，例如：以当前模板生成一份给杭州市政府的贺信，时间写 2026 年 4 月。",knowledgeHint:"支持 DOCX / DOC 作为模板，PDF / Markdown / TXT 作为参考资料。",previewHint:"右侧展示文稿预览，并提供打开、下载和定位输出目录。"},{value:"image",label:"图片",description:"根据参考图和描述生成图片，支持风格锁定。",composerPlaceholder:"请输入图片生成需求，例如：做一张蓝白学术风格的 AI 产业趋势信息图。",knowledgeHint:"支持 JPG / PNG / WEBP 作为参考图，可分别设为主参考、风格参考或内容参考。",previewHint:"右侧展示图片结果，可保存或直接打开。"},{value:"ppt",label:"PPT",description:"基于资料生成 PPT 演示文稿。",composerPlaceholder:"请输入 PPT 生成需求，例如：生成一份 8 页以内的管理层汇报 PPT。",knowledgeHint:"支持 PDF / DOCX / Markdown / 图片作为演示素材。",previewHint:"右侧展示 PPT 页结构预览，可下载或打开。"},{value:"email",label:"邮件",description:"AI 生成邮件草稿，支持发送与收件演示。",composerPlaceholder:"请输入邮件需求，例如：写一封项目延期通知邮件给客户...",knowledgeHint:"邮件模式为本地演示系统。",previewHint:"右侧展示邮件详情与发送操作。"},{value:"homework",label:"作业解答",description:"上传作业 PDF 或 DOCX，AI 逐题提取并解答。",composerPlaceholder:"上传作业文件开始解答...",knowledgeHint:"作业解答模式自动提取题目，无需手动上传资料。",previewHint:"逐题展示题目与 AI 解答，支持导出。"},{value:"ai-class",label:"AI课堂",description:"连接远程 AI 课堂平台，访问课程内容、互动问答与实验环境。",composerPlaceholder:"在 AI 课堂中学习...",knowledgeHint:"AI 课堂模式直接连接远程学习平台。",previewHint:"嵌入式访问远程 AI 课堂系统。"},{value:"ai-forum",label:"AI论坛",description:"嵌入访问 AI 论坛，浏览社区讨论与学习资源。",composerPlaceholder:"在 AI 论坛中浏览...",knowledgeHint:"AI 论坛模式直接嵌入远程论坛页面。",previewHint:"嵌入式访问 AI 论坛社区。"}];function Sc(e){return Kd.find(n=>n.value===e)||Kd[0]}const av={VITE_ALLOW_ALL_WORK_REPORTS:"true"},lv="local://electron-main",fi=av;function Dg(e,n){if(typeof e=="boolean")return e;if(typeof e!="string")return n;const r=e.trim().toLowerCase();return["1","true","yes","on"].includes(r)?!0:["0","false","no","off"].includes(r)?!1:n}const Pl=Dg(fi==null?void 0:fi.VITE_DISABLE_FORCE_PASSWORD_CHANGE,!0),Rg=Dg(fi==null?void 0:fi.VITE_ALLOW_ALL_WORK_REPORTS,!0);function cv(e){return!!e.mustChangePassword&&!Pl}function Mg(){return localStorage.getItem("ai_writer_backend_url")||lv}function kc(e){return/^(https?:)?\/\//i.test(e)}function jc(e){return e.startsWith("data:")}function Ic(e){return e.startsWith("file:///")}function Gd(e){return/^[a-zA-Z]:[\\/]/.test(e)}function $c(e){const n=String(e||"").trim().replace(/^['"]|['"]$/g,"");if(!n)return"";if(jc(n)||kc(n))return n;if(Ic(n))try{const r=decodeURIComponent(n.replace(/^file:\/\//,""));return/^\/[a-zA-Z]:\//.test(r)?r.slice(1):r}catch{const r=n.replace(/^file:\/\//,"");return/^\/[a-zA-Z]:\//.test(r)?r.slice(1):r}if(/^file:\/\/[a-zA-Z]:[\\/]/.test(n))try{return decodeURIComponent(n.replace(/^file:\/\//,""))}catch{return n.replace(/^file:\/\//,"")}return n.replace(/\\/g,"/")}function eo(e){const n=$c(e);if(!n)return"";if(jc(n)||kc(n)||Ic(n))return n;const r=Gd(n)?n.replace(/\\/g,"/"):n.startsWith("/")?n:`/${n}`;return`file:${Gd(r)?"///":"//"}${encodeURI(r)}`}function Fg(e,n){const r=$c(e);if(!r)return"";if(jc(r)||kc(r)||Ic(r))return r;const i=String((n==null?void 0:n.backendUrl)||"").trim().replace(/\/$/,"");return i&&!i.startsWith("local://")?r.startsWith("/")?`${i}${r}`:`${i}/${r.replace(/^\/+/,"")}`:eo(r)}function Un(e){const n=String(e||"").replace(/\\/g,"/").trim(),r=n.lastIndexOf("/");return r>=0?n.slice(r+1):n}function sa(e){const n=String(e||"").replace(/\\/g,"/").replace(/\/+$/g,"").trim(),r=n.lastIndexOf("/");return r>0?n.slice(0,r):n}function as(e){return Fg(e,{backendUrl:Mg()})}function _i(e){return $c(e)}function qd(){const e=new Date;return`${e.getFullYear()}${String(e.getMonth()+1).padStart(2,"0")}${String(e.getDate()).padStart(2,"0")}-${String(e.getHours()).padStart(2,"0")}${String(e.getMinutes()).padStart(2,"0")}${String(e.getSeconds()).padStart(2,"0")}`}function Vd(e,n="生成结果"){return(String(e||"").replace(/\.[^.]+$/g,"").replace(/[\\/:*?"<>|]+/g," ").replace(/\s+/g," ").trim()||n).slice(0,42)}function ls(e){return String(e||"").replace(/\r/g,`
`).replace(/\u0000/g,"").replace(/\n{3,}/g,`

`).trim()}function dv(e){return String(e||"").replace(/\.[^.]+$/,"").trim()||"当前文稿"}function uv(e){var o,s;const n=Array.isArray((o=e.value)==null?void 0:o.headers)?e.value.headers.map(a=>String(a??"").trim()).filter(Boolean):[],r=Array.isArray((s=e.value)==null?void 0:s.rows)?e.value.rows.map(a=>Array.isArray(a)?a.map(d=>String(d??"").trim()).filter(Boolean).join(" | "):"").filter(Boolean):[],i=[n.join(" | "),...r].filter(Boolean);return i.length>0?[`表格：${i.join("；")}`]:[]}function pv(e){var s,a;const n=typeof((s=e.value)==null?void 0:s.richText)=="string"?e.value.richText.trim():"",r=typeof((a=e.value)==null?void 0:a.text)=="string"?e.value.text.trim():"",i=String(e.text||"").trim(),o=n||r||i;return o?[o]:[]}function fv(e){var s,a;const n=String(((s=e.value)==null?void 0:s.alt)||"").trim(),r=String(((a=e.value)==null?void 0:a.caption)||"").trim(),i=String(e.text||"").trim(),o=n||r||i;return o?[`图片：${o}`]:["图片内容"]}function Bg(e,n){if(e.type==="heading"){const r=String(e.text||"").trim();r&&n.push(r)}else if(e.type==="paragraph"||e.type==="html"||e.type==="citation"){const r=String(e.text||"").trim();r&&n.push(r)}else e.type==="slot"?n.push(...pv(e)):e.type==="table"?n.push(...uv(e)):e.type==="image"&&n.push(...fv(e));for(const r of e.children||[])Bg(r,n)}function mv(e){const n=e.documentArtifact||null,r=ls(String(e.previewText||""));return!n&&!r?null:{kind:n?"document-artifact":"preview-text",title:dv(String(e.title||"")),documentArtifact:n,previewText:r,updatedAt:e.updatedAt||null}}function Lg(e){var d,u,f;if(!e)return{title:null,sourceKind:null,paragraphs:[],sourceTextLength:0};const n=[];if((f=(u=(d=e.documentArtifact)==null?void 0:d.document)==null?void 0:u.blocks)!=null&&f.length)for(const p of e.documentArtifact.document.blocks)Bg(p,n);const r=n.map(p=>ls(p)).filter(Boolean),i=r.join(`

`).length,o=ls(e.previewText).split(/\n+/).map(p=>p.replace(/\s+/g," ").trim()).filter(Boolean),s=ls(e.previewText).length,a=s>i+80;return r.length>0&&!a?{title:e.title,sourceKind:e.kind,paragraphs:r,sourceTextLength:i}:{title:e.title,sourceKind:e.kind,paragraphs:o,sourceTextLength:s}}const Yd=l.div`
  width: 180px;
  min-width: 160px;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 6px;
  border-right: 1px solid #e5e7eb;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
`,gv=l.div`
  margin: 0 2px 6px;
  padding: 5px 8px;
  border-radius: 8px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-align: center;
  ${({$mode:e})=>e==="source"?"background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe;":e==="retemplated"?"background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;":"background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb;"}
`,hv=l.div`
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  border: 1.5px solid ${({$active:e})=>e?"#3b82f6":"transparent"};
  background: ${({$active:e})=>e?"#eff6ff":"transparent"};
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: ${({$active:e})=>e?"#eff6ff":"#f3f4f6"};
    border-color: ${({$active:e})=>e?"#3b82f6":"#e5e7eb"};
  }

  ${({$loading:e})=>e&&`
    animation: pulse 1.2s ease-in-out infinite;
    @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
  `}
`,xv=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: ${({$active:e})=>e?"#3b82f6":"#9ca3af"};
  min-width: 16px;
  flex-shrink: 0;
  padding-top: 1px;
  line-height: 1;
  text-align: center;
`,bv=l.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`,yv=l.div`
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: ${({$active:e})=>e?"#1d4ed8":"#374151"};
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
`,vv=l.div`
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 10px;
  align-self: flex-start;
  ${({$intent:e})=>{switch(e){case"cover":return"background: #fef3c7; color: #92400e;";case"toc":return"background: #e0e7ff; color: #3730a3;";case"section":case"section_divider":return"background: #f0fdf4; color: #166534;";case"content_cards":case"cards":return"background: #fff7ed; color: #9a3412;";case"image_text":return"background: #fdf4ff; color: #7e22ce;";case"closing":case"summary":return"background: #ecfeff; color: #155e75;";default:return"background: #f3f4f6; color: #6b7280;"}}}
`,wv=l.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  animation: blink 1s ease-in-out infinite;
  flex-shrink: 0;
  margin-top: 4px;
  @keyframes blink { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
`;function Sv(e){switch(e){case"cover":return"封面";case"toc":return"目录";case"section":case"section_divider":return"章节";case"content":case"text_content":return"内容";case"cards":case"content_cards":return"卡片";case"image_text":return"图文";case"metrics":return"指标";case"comparison":return"对比";case"timeline":return"时间线";case"closing":case"summary":return"总结";default:return"通用"}}function kv({slides:e,activeIndex:n,generatingIndex:r,previewMode:i="structure",onSelectSlide:o}){const s=c.useRef(null);return c.useEffect(()=>{var a;(a=s.current)==null||a.scrollIntoView({block:"nearest",behavior:"smooth"})},[n]),e.length===0?t.jsx(Yd,{children:t.jsx("div",{style:{fontSize:14,color:"#9ca3af",textAlign:"center",marginTop:24},children:"暂无幻灯片"})}):t.jsxs(Yd,{children:[t.jsx(gv,{$mode:i,children:i==="source"?"原版 PPT 预览":i==="retemplated"?"套模板预览":"结构预览"}),e.map((a,d)=>{const u=d===n,f=r!==void 0&&d===r,p=a.title||a.heading||`第 ${d+1} 页`;return t.jsxs(hv,{$active:u,$loading:f,ref:u?m=>{s.current=m}:void 0,onClick:()=>o(d),children:[t.jsx(xv,{$active:u,children:d+1}),t.jsxs(bv,{children:[a.imagePath?t.jsx("img",{src:`file://${a.imagePath}`,alt:`slide ${d+1}`,style:{width:"100%",borderRadius:3,marginBottom:3,display:"block",border:"1px solid #e5e7eb"}}):null,t.jsx(yv,{$active:u,children:p}),t.jsx(vv,{$intent:a.type,children:Sv(a.type)})]}),f&&t.jsx(wv,{})]},d)})]})}const jv=l.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`,Iv=l.div`
  width: min(920px, 96vw);
  max-height: min(720px, 92vh);
  background: #1e2538;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 22px 80px rgba(0,0,0,0.45);
  overflow: hidden;
`,$v=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
`,Tv=l.div`
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
`,Cv=l.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 18px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  &:hover { background: rgba(255,255,255,0.1); color: #fff; }
`,Pv=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(320px, 1fr);
  gap: 14px;
  min-height: 0;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`,Av=l.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`,_v=l.div`
  border: 2px solid ${({$active:e})=>e?"#60a5fa":"rgba(255,255,255,0.1)"};
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  background: ${({$active:e})=>e?"rgba(96,165,250,0.1)":"rgba(255,255,255,0.03)"};
  transition: border-color 0.15s, background 0.15s;
  display: grid;
  gap: 8px;

  &:hover {
    border-color: ${({$active:e})=>e?"#60a5fa":"rgba(255,255,255,0.2)"};
    background: rgba(255,255,255,0.06);
  }
`,Ev=l.div`
  flex: 1;
  min-width: 0;
`,zv=l.div`
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 2px;
`,Dv=l.div`
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.45);
  line-height: 1.4;
`,Rv=l.div`
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.45);
`,Mv=l.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: ${({$large:e})=>e?"14px":"8px"};
  border: 1px solid rgba(255,255,255,0.14);
  background:
    radial-gradient(circle at 84% 18%, ${({$color:e})=>`${vi(e)}33`} 0 14%, transparent 15%),
    linear-gradient(135deg, ${({$color:e})=>`${vi(e)}22`} 0%, #f8fafc 46%, #e2e8f0 100%);
`,Fv=l.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 34%;
  height: 100%;
  background: linear-gradient(180deg, ${({$color:e})=>vi(e)}, ${({$color:e})=>`${vi(e)}99`});
  opacity: 0.9;
`,Bv=l.div`
  position: absolute;
  left: 9%;
  top: ${({$large:e})=>e?"18%":"20%"};
  width: 48%;
  height: ${({$large:e})=>e?"10%":"12%"};
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
`,aa=l.div`
  position: absolute;
  left: 9%;
  top: ${({$top:e})=>`${e}%`};
  width: ${({$width:e})=>`${e}%`};
  height: ${({$large:e})=>e?"4%":"5%"};
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.72);
`,Lv=l.div`
  position: absolute;
  right: 9%;
  top: 24%;
  width: 30%;
  height: 48%;
  border-radius: 12px;
  background: ${({$color:e})=>`${vi(e)}26`};
  border: 2px dashed ${({$color:e})=>`${vi(e)}88`};
`,Nv=l.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  background: rgba(255,255,255,0.035);
`,Ov=l.div`
  font-size: 14px;
  font-weight: 800;
  color: #f8fafc;
`,Wv=l.div`
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.55);
  line-height: 1.6;
`,Uv=l.span`
  background: #60a5fa;
  color: #111827;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  vertical-align: middle;
`,Hv=l.span`
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  background: ${({$source:e})=>e==="built-in"?"rgba(251,191,36,0.18)":"rgba(96,165,250,0.18)"};
  color: ${({$source:e})=>e==="built-in"?"#fde68a":"#bfdbfe"};
`,Kv=l.div`
  padding: 14px 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
`,Gv=l.button`
  width: 100%;
  padding: 10px;
  border-radius: 7px;
  border: none;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: ${({$disabled:e})=>e?"not-allowed":"pointer"};
  background: ${({$disabled:e})=>e?"rgba(255,255,255,0.1)":"#3b82f6"};
  color: ${({$disabled:e})=>e?"rgba(255,255,255,0.3)":"#fff"};
  transition: background 0.15s;

  &:hover:not(:disabled) { background: #2563eb; }
`,Jd=l.div`
  text-align: center;
  font-size: var(--font-size-xs);
  margin-top: 8px;
  color: ${({$type:e})=>e==="error"?"#f87171":e==="success"?"#4ade80":"#fbbf24"};
`,qv=l.div`
  text-align: center;
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.3);
  padding: 32px 0;
`;function vi(e){return`#${String(e||"3b82f6").replace(/^#/,"").slice(0,6).padEnd(6,"0")||"3b82f6"}`}function Xd(e){return e==="built-in"?"内置":"Skill"}function To(e){if(!e)return"";const n=[];return typeof e.widthInches=="number"&&typeof e.heightInches=="number"&&n.push(`${e.widthInches.toFixed(1)} × ${e.heightInches.toFixed(1)} in`),n.join(" · ")}function Zd({skill:e,large:n=!1}){const r=e.previewColor||"3b82f6";return t.jsxs(Mv,{$color:r,$large:n,children:[t.jsx(Fv,{$color:r}),t.jsx(Bv,{$large:n}),t.jsx(aa,{$top:n?38:42,$width:42,$large:n}),t.jsx(aa,{$top:n?49:54,$width:35,$large:n}),t.jsx(aa,{$top:n?60:66,$width:28,$large:n}),t.jsx(Lv,{$color:r})]})}function Vv({open:e,skills:n,activeSkillId:r,contentPackageId:i,workspacePath:o,deckDocumentId:s,onClose:a,onApplied:d}){const[u,f]=c.useState(r),[p,m]=c.useState(!1),[g,h]=c.useState(null);if(c.useEffect(()=>{var y;e&&(f(r??((y=n[0])==null?void 0:y.id)??null),h(null))},[e,r,n]),!e)return null;const x=n.find(y=>y.id===u)||n[0],k=!!(u&&(i||s)&&o&&!p&&u!==r),v=async()=>{if(!(!u||!o||p)&&!(!i&&!s)){m(!0),h({type:"applying",msg:"正在应用模板... · 不消耗 token"});try{if(s){h({type:"applying",msg:"正在重新渲染... · 不消耗 token"});const j=await window.electronAPI.deckRender({workspacePath:o,deckId:s,manifestId:u});if(!j.success||!j.outputPath){if(i){const S=await window.electronAPI.pptxRenderWithSkill({workspacePath:o,contentPackageId:i,skillId:u});if(!S.success||!S.outputPath){h({type:"error",msg:`应用失败：${S.error||"未知错误"}`});return}console.log("[apply_skill]",{skillId:u,path:"legacy_pptxRenderWithSkill",llmCalls:0,imageCalls:0,tokenCost:0}),h({type:"success",msg:"模板已应用 · 不消耗 token"}),d(u,S.outputPath),setTimeout(()=>a(),800);return}h({type:"error",msg:`应用失败：${j.error||"未知错误"}`});return}console.log("[apply_skill]",{skillId:u,path:"deckRender",llmCalls:j.llmCalls,imageCalls:j.imageCalls,tokenCost:j.tokenCost}),h({type:"success",msg:"模板已应用 · 不消耗 token"}),d(u,j.outputPath),setTimeout(()=>a(),800);return}h({type:"applying",msg:"正在重新渲染... · 不消耗 token"});const y=await window.electronAPI.pptxRenderWithSkill({workspacePath:o,contentPackageId:i,skillId:u});if(!y.success||!y.outputPath){h({type:"error",msg:`应用失败：${y.error||"未知错误"}`});return}console.log("[apply_skill]",{skillId:u,path:"legacy_pptxRenderWithSkill",llmCalls:0,imageCalls:0,tokenCost:0}),h({type:"success",msg:"模板已应用 · 不消耗 token"}),d(u,y.outputPath),setTimeout(()=>a(),800)}catch(y){const j=y instanceof Error?y.message:"应用模板失败";h({type:"error",msg:`应用失败：${j}`})}finally{m(!1)}}};return t.jsx(jv,{onClick:y=>{y.target===y.currentTarget&&a()},children:t.jsxs(Iv,{onClick:y=>y.stopPropagation(),children:[t.jsxs($v,{children:[t.jsx(Tv,{children:"替换 PPT 模板"}),t.jsx(Cv,{onClick:a,children:"✕"})]}),t.jsxs(Pv,{children:[t.jsx(Av,{children:n.length===0?t.jsx(qv,{children:"暂无可用模板"}):n.map(y=>t.jsxs(_v,{$active:u===y.id,onClick:()=>!p&&f(y.id),children:[t.jsx(Zd,{skill:y}),t.jsxs(Ev,{children:[t.jsxs(zv,{children:[y.name,t.jsx(Hv,{$source:y.source,children:Xd(y.source)}),y.id===r&&t.jsx(Uv,{children:"当前模板"})]}),y.description&&t.jsx(Dv,{children:y.description}),To(y)&&t.jsx(Rv,{children:To(y)})]})]},y.id))}),x&&t.jsxs(Nv,{children:[t.jsx(Ov,{children:x.name}),t.jsx(Zd,{skill:x,large:!0}),t.jsxs(Wv,{children:["来源：",Xd(x.source),"模板",To(x)?` · ${To(x)}`:"",t.jsx("br",{}),"当前预览根据模板主题、尺寸和布局能力生成；应用模板会使用当前 DeckDocument 重新渲染，不调用 LLM。"]})]})]}),t.jsxs(Kv,{children:[t.jsx(Gv,{$disabled:!k,disabled:!k,onClick:v,children:p?"应用模板中…":"应用并保存为新 PPT"}),g&&t.jsx(Jd,{$type:g.type,children:g.msg}),!g&&t.jsx(Jd,{$type:"applying",style:{color:"rgba(255,255,255,0.3)"},children:"应用模板不消耗 Token"})]})]})})}const Yv=wr`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`,Jv=l.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #F6F8FB;
  color: #1e293b;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
`,Xv=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  flex-wrap: wrap;
`,Zv=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #1e293b;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
`,nr=l.div`
  font-size: var(--font-size-xs);
  padding: 3px 9px;
  border-radius: 12px;
  font-weight: 600;
  flex-shrink: 0;
  ${({$status:e})=>["generating_outline","generating_slide","generating_image","generating_content","generating_deck","validating_deck","saving_deck"].includes(e)?"background: #fef9c3; color: #854d0e; border: 1px solid #fde047;":e==="rendering"||e==="rendering_pptx"||e==="rendering_preview"?"background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe;":e==="applying"?"background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe;":e==="completed"?"background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;":e==="stopped"||e==="failed"?"background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;":"background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb;"}
`,Qv=l.div`
  font-size: var(--font-size-xs);
  color: #6b7280;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,ew=l.div`
  flex: 1;
`,tw=l.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 260px;
  padding: 5px 10px;
  border: 1px solid #dbe4ef;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
`,nw=l.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({$color:e})=>e.startsWith("#")?e:`#${e}`};
  flex-shrink: 0;
`,rw=l.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,iw=l.select`
  height: 30px;
  max-width: 170px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 0 8px;
`,Rt=l.button`
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;

  ${({$variant:e})=>{switch(e){case"primary":return`background: #3b82f6; color: #fff; border-color: #3b82f6;
          &:hover:not(:disabled) { background: #2563eb; }
          &:disabled { opacity: 0.45; cursor: not-allowed; }`;case"danger":return`background: #fff1f2; color: #e11d48; border-color: #fecdd3;
          &:hover:not(:disabled) { background: #ffe4e6; }
          &:disabled { opacity: 0.45; cursor: not-allowed; }`;default:return`background: #fff; color: #374151; border-color: #d1d5db;
          &:hover:not(:disabled) { background: #f9fafb; border-color: #9ca3af; }
          &:disabled { opacity: 0.4; cursor: not-allowed; }`}}}
`,ow=l.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`,rr=l.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #eef2f7;
  overflow: auto;
  gap: 10px;
`,Co=l.div`
  max-width: 400px;
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 40px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`,la=l.div`
  font-size: 40px;
  line-height: 1;
`,Po=l.div`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
`,Ao=l.div`
  font-size: var(--font-size-sm);
  color: #6b7280;
  line-height: 1.7;
`,sw=l.div`
  max-width: 400px;
  width: 100%;
  background: #fff;
  border: 1px solid #fde68a;
  border-radius: 16px;
  padding: 36px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`,aw=l.div`
  font-size: 28px;
  animation: ${Yv} 1.5s linear infinite;
  line-height: 1;
`,lw=l.div`
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
`,Qd=l.div`
  font-size: var(--font-size-sm);
  color: #78716c;
  line-height: 1.7;
  white-space: pre-line;
`,cw=l.div`
  max-width: 400px;
  width: 100%;
  background: #fff;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  padding: 36px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`,dw=l.div`
  font-size: 14px;
  font-weight: 700;
  color: #1d4ed8;
`,uw=l.div`
  max-width: 440px;
  width: 100%;
  background: #fff;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  padding: 36px 32px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`,pw=l.div`
  font-size: 15px;
  font-weight: 700;
  color: #1d4ed8;
  text-align: center;
`,fw=l.div`
  font-size: var(--font-size-sm);
  color: #6b7280;
  line-height: 1.7;
  text-align: center;
  white-space: pre-line;
`,mw=l.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`,gw=l.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--font-size-sm);
  font-weight: ${({$state:e})=>e==="active"?"700":"500"};
  color: ${({$state:e})=>e==="done"?"#15803d":e==="active"?"#1d4ed8":"#9ca3af"};
`,hw=l.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
  ${({$state:e})=>e==="done"?"background: #dcfce7; color: #15803d; border: 1.5px solid #86efac;":e==="active"?"background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd;":"background: #f3f4f6; color: #d1d5db; border: 1.5px solid #e5e7eb;"}
`,xw=l.div`
  padding: 16px 10px;
  font-size: var(--font-size-xs);
  color: #9ca3af;
  text-align: center;
  line-height: 1.7;
`,bw=l.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,yw=l.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.42);
`,vw=l.div`
  width: min(720px, calc(100vw - 48px));
  max-height: calc(100vh - 56px);
  overflow: auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
  padding: 18px;
  display: grid;
  gap: 12px;
`,eu=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`,ww=l.div`
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
`,Sw=l.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,Pr=l.div`
  display: grid;
  gap: 5px;
  ${({$wide:e})=>e?"grid-column: 1 / -1;":""}
`,kw=l.div`
  min-height: 18px;
  font-size: var(--font-size-xs);
  color: #64748b;
`,Ar=l.label`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #64748b;
`,tu=l.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: var(--font-size-xs);
  color: #1f2937;
`,Ei=l.textarea`
  width: 100%;
  min-height: 54px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: var(--font-size-xs);
  color: #1f2937;
  resize: vertical;
  line-height: 1.5;
`;function jw(e){return["importing","extracting","building_deck","generating_outline","generating_slide","generating_image","generating_content","generating_deck","validating_deck","saving_deck"].includes(e)?"generating":["rendering_preview","rendering_pptx"].includes(e)?"rendering":e==="stopped"?"stopped":e==="completed"||e==="ready"?"completed":e==="failed"?"failed":"idle"}function nu(e,n,r,i,o){if(n)return"应用模板中 · 不消耗 token";switch(e){case"importing":return"正在导入邮件附件…";case"extracting":return"正在提取 PPTX 文本、备注与预览…";case"building_deck":return"正在构建可编辑 DeckDocument…";case"ready":return`已导入 · 共 ${o||i} 页`;case"generating_outline":return"生成内容中 · 正在规划大纲…";case"generating_slide":return o>0&&i>=o?"内容已完成 · 正在保存…":r?`生成内容中 · 继续生成 ${i} / ${o||"?"} 页`:`生成内容中 · 第 ${i} / ${o||"?"} 页`;case"generating_image":return"生成内容中 · 正在生成配图…";case"rendering_preview":case"rendering_pptx":return"正在渲染 PPTX…";case"completed":return`已完成 · 共 ${o||i} 页`;case"stopped":return`已停止 · 已保留 ${i}${o?` / ${o}`:""} 页`;case"generating_deck":return"生成内容中 · 正在生成 DeckDocument…";case"validating_deck":return"生成内容中 · 校验内容结构…";case"saving_deck":return"生成内容中 · 保存 DeckDocument…";case"generating_content":return"生成内容中 · 正在生成演示内容…";case"failed":return"生成失败";default:return"PPT 工作台"}}function Iw({title:e,taskStatus:n,liveSlides:r,totalSlides:i,activeSlideIndex:o,activeSkillId:s,contentPackageId:a,resultPath:d,workspacePath:u,availableSkills:f,packageHistory:p,isApplyingSkill:m,isResuming:g,deckDocumentId:h,activeTemplateManifestId:x,templateStatusMessage:k,sourceType:v="generated",originalFilePath:y,originalFileName:j,importStatus:S,importWarnings:z=[],onStop:P,onResume:I,onExportPartial:b,onRerender:$,onOpenPpt:O,onDownloadPpt:D,onOpenFolder:R,onUploadTemplate:V,onSelectSlide:te,onSelectPackage:q,onSkillApplied:W,onOpenOriginalFile:fe,onUpdateSlide:le,onAiOptimizeStructure:Q}){const[ge,J]=c.useState(!1),[H,T]=c.useState(""),[w,L]=c.useState(!1),[N,M]=c.useState({title:"",subtitle:"",summary:"",body:"",items:"",speakerNotes:"",visualBrief:""}),[A,ee]=c.useState(""),me=jw(n),Ie=["generating_deck","generating_content","validating_deck","saving_deck"].includes(n),Fe=me==="generating",Z=r[o]??null,X=v==="imported_pptx"||v==="email_attachment",ye=X&&!!h&&!x,Ee=X?x:x||s,G=f.find(Re=>Re.id===Ee||Re.id===s)??null,F=f.find(Re=>Re.id===Ee)??G,se=ye?"原版 PPT":(F==null?void 0:F.name)||Ee||"未应用模板",_e=ye?"替换模板：原版 PPT":`替换模板：${se}`,de=ye?"source":Ee?"retemplated":"structure",oe=Fe&&r.length>0?r.findIndex(Re=>Re.isGenerating||Re.imageLoading):void 0,Te=nu(n,!!m,!!g,r.length,i);c.useEffect(()=>{M({title:(Z==null?void 0:Z.title)||"",subtitle:(Z==null?void 0:Z.subtitle)||"",summary:(Z==null?void 0:Z.summary)||"",body:(Z==null?void 0:Z.body)||"",items:((Z==null?void 0:Z.items)||[]).join(`
`),speakerNotes:(Z==null?void 0:Z.speakerNotes)||(Z==null?void 0:Z.notes)||"",visualBrief:(Z==null?void 0:Z.visualBrief)||""}),ee("")},[o,Z]);const C=c.useCallback((Re,tt)=>{J(!1),T(""),W(Re,tt)},[W]),E=!!a||!!h,_=!(Fe||me==="rendering"||!!m),Y=(!!a||!!h)&&me==="completed",ae=!!d&&(me==="completed"||me==="stopped"),je=ae,Le=!!u&&!Fe&&me!=="rendering"&&!m,Ke=c.useCallback(()=>{if(!E){T("请先导入或生成 PPT 内容后再替换模板。");return}T(""),J(!0)},[E]),Be=()=>me==="idle"?t.jsx(Rt,{onClick:R,children:"📁 打开目录"}):me==="generating"?t.jsxs(t.Fragment,{children:[t.jsx(Rt,{$variant:"danger",onClick:P,children:"⏹ 停止"}),t.jsx(Rt,{onClick:R,children:"📁 打开目录"})]}):me==="rendering"?t.jsx(Rt,{onClick:R,children:"📁 打开目录"}):me==="stopped"?t.jsxs(t.Fragment,{children:[I&&t.jsx(Rt,{$variant:"primary",onClick:I,children:"▶ 继续生成"}),t.jsx(Rt,{onClick:b??$,disabled:!a||!!m,children:"⬇ 导出已生成"}),t.jsx(Rt,{onClick:O,disabled:!ae,children:"▶ 打开"}),t.jsx(Rt,{onClick:R,children:"📁 目录"})]}):t.jsxs(t.Fragment,{children:[v==="email_attachment"&&t.jsx(Rt,{onClick:fe,disabled:!fe,children:"打开源文件"}),t.jsx(Rt,{onClick:()=>L(!0),disabled:!h,children:"编辑内容"}),t.jsx(Rt,{onClick:Q,disabled:!Q||!h||!!m,children:"AI 优化结构"}),t.jsx(Rt,{onClick:$,disabled:!Y,title:"用当前内容包重新渲染",children:"↺ 重渲染"}),t.jsx(Rt,{onClick:O,disabled:!ae,children:"▶ 打开 PPT"}),t.jsx(Rt,{onClick:D,disabled:!je,children:"导出 PPT"}),t.jsx(Rt,{onClick:R,children:"📁 目录"})]}),mt=async()=>{if(!le||!Z)return;ee("正在保存…");const Re=await le(o,{title:N.title,subtitle:N.subtitle,summary:N.summary,body:N.body,items:N.items.split(/\r?\n/).map(tt=>tt.trim()).filter(Boolean),speakerNotes:N.speakerNotes,visualBrief:N.visualBrief});ee(Re?"已保存并刷新预览":"保存失败")},He=()=>{if(Ie){const Re=[{label:"理解需求",stage:"generating_deck"},{label:"生成内容结构",stage:"generating_deck"},{label:"保存 deck.json",stage:"saving_deck"},{label:"应用模板",stage:"rendering_pptx"},{label:"输出 PPTX",stage:"completed"}],tt=["generating_deck","validating_deck","saving_deck","rendering_pptx","completed"],ue=tt.indexOf(n??""),ze=nu(n??"idle",!!m,!!g,r.length,i);return t.jsx(rr,{children:t.jsxs(uw,{children:[t.jsx(pw,{children:"正在生成 PPT"}),t.jsxs(fw,{children:["DeckDocument 是模板无关的内容结构",t.jsx("br",{}),"生成完成后可自由切换模板"]}),t.jsx(mw,{children:Re.map((re,pe)=>{const ne=tt.indexOf(re.stage),Ve=ue>ne?"done":ue===ne?"active":"pending";return t.jsxs(gw,{$state:Ve,children:[t.jsx(hw,{$state:Ve,children:Ve==="done"?"✓":String(pe+1)}),re.label,Ve==="active"&&t.jsx("span",{style:{marginLeft:"auto",fontSize:"var(--font-size-xs)",color:"#1d4ed8"},children:ze})]},pe)})})]})})}return me==="rendering"&&!Z?t.jsx(rr,{children:t.jsxs(cw,{children:[t.jsx(dw,{children:"正在应用模板并渲染 PPTX"}),t.jsx(Qd,{children:"不消耗 token · 纯本地渲染"})]})}):Z?Z.imagePath?t.jsx(rr,{style:{padding:18,background:"#f3f6fa",justifyContent:"center",alignItems:"center"},children:t.jsx("img",{src:`file://${Z.imagePath}`,alt:`Slide ${o+1}`,style:{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",display:"block",borderRadius:4,boxShadow:"0 10px 30px rgba(15,23,42,0.14)"}})}):t.jsx(rr,{children:t.jsxs(Co,{style:{alignItems:"flex-start",textAlign:"left",maxWidth:560},children:[t.jsx(Po,{style:{fontSize:16,fontWeight:700,marginBottom:8},children:Z.heading||Z.title}),Z.body&&t.jsx(Ao,{style:{whiteSpace:"pre-line",lineHeight:1.7},children:Z.body}),Z.items&&Z.items.length>0&&t.jsx("ul",{style:{paddingLeft:18,margin:"8px 0 0",fontSize:14,color:"#374151"},children:Z.items.map((Re,tt)=>t.jsx("li",{style:{marginBottom:4},children:Re},tt))})]})}):me==="generating"?t.jsx(rr,{children:t.jsxs(sw,{children:[t.jsx(aw,{}),t.jsx(lw,{children:"正在生成 PPT"}),t.jsx(Qd,{children:"等待第一页生成…"})]})}):me==="completed"&&r.length===0?t.jsx(rr,{children:t.jsxs(Co,{style:{borderColor:"#86efac"},children:[t.jsx(la,{style:{color:"#16a34a",fontSize:32},children:"✓"}),t.jsx(Po,{style:{color:"#15803d"},children:"PPT 已生成"}),t.jsx(Ao,{children:i>0?`共 ${i} 页 · 请点击下载`:"请点击右侧下载"})]})}):me==="stopped"&&r.length===0?t.jsx(rr,{children:t.jsxs(Co,{style:{borderColor:"#fca5a5"},children:[t.jsx(la,{style:{color:"#991b1b",fontSize:24},children:"■"}),t.jsx(Po,{style:{color:"#991b1b"},children:"已停止"}),t.jsx(Ao,{children:"生成已被取消"})]})}):t.jsx(rr,{children:t.jsxs(Co,{children:[t.jsx(la,{children:"📄"}),t.jsx(Po,{children:"准备生成 PPT"}),t.jsx(Ao,{children:"填写需求后点击生成"})]})})},dt=()=>r.length>0?t.jsx(kv,{slides:r,activeIndex:o,skillColor:G==null?void 0:G.previewColor,generatingIndex:oe!==void 0&&oe>=0?oe:void 0,previewMode:de,onSelectSlide:te}):t.jsx(bw,{style:{width:180,minWidth:160,background:"#fff",borderRight:"1px solid #e5e7eb"},children:t.jsx(xw,{children:Fe?`正在生成大纲…
等待第一页`:"暂无幻灯片"})}),Xe=()=>!w||!Z||!h?null:t.jsx(yw,{onClick:Re=>{Re.target===Re.currentTarget&&L(!1)},children:t.jsxs(vw,{onClick:Re=>Re.stopPropagation(),children:[t.jsxs(eu,{children:[t.jsxs(ww,{children:["编辑当前页 · 第 ",o+1," 页"]}),t.jsx(Rt,{type:"button",onClick:()=>L(!1),children:"关闭"})]}),t.jsxs(Sw,{children:[t.jsxs(Pr,{children:[t.jsx(Ar,{children:"标题"}),t.jsx(tu,{value:N.title,onChange:Re=>M(tt=>({...tt,title:Re.target.value}))})]}),t.jsxs(Pr,{children:[t.jsx(Ar,{children:"副标题"}),t.jsx(tu,{value:N.subtitle,onChange:Re=>M(tt=>({...tt,subtitle:Re.target.value}))})]}),t.jsxs(Pr,{$wide:!0,children:[t.jsx(Ar,{children:"摘要"}),t.jsx(Ei,{value:N.summary,onChange:Re=>M(tt=>({...tt,summary:Re.target.value}))})]}),t.jsxs(Pr,{$wide:!0,children:[t.jsx(Ar,{children:"正文"}),t.jsx(Ei,{value:N.body,onChange:Re=>M(tt=>({...tt,body:Re.target.value}))})]}),t.jsxs(Pr,{$wide:!0,children:[t.jsx(Ar,{children:"要点（每行一个）"}),t.jsx(Ei,{value:N.items,onChange:Re=>M(tt=>({...tt,items:Re.target.value}))})]}),t.jsxs(Pr,{children:[t.jsx(Ar,{children:"演讲备注"}),t.jsx(Ei,{value:N.speakerNotes,onChange:Re=>M(tt=>({...tt,speakerNotes:Re.target.value}))})]}),t.jsxs(Pr,{children:[t.jsx(Ar,{children:"视觉说明"}),t.jsx(Ei,{value:N.visualBrief,onChange:Re=>M(tt=>({...tt,visualBrief:Re.target.value}))})]})]}),t.jsxs(eu,{children:[t.jsx(kw,{children:A}),t.jsx(Rt,{type:"button",$variant:"primary",onClick:()=>void mt(),disabled:!le,children:"保存到 deck.json"})]})]})});return t.jsxs(Jv,{children:[t.jsxs(Xv,{children:[t.jsx(Zv,{title:e,children:e}),m&&t.jsx(nr,{$status:"applying",children:"应用模板中"}),!m&&Fe&&t.jsx(nr,{$status:n,children:n==="generating_outline"?"生成大纲":`${r.length}${i>0?` / ${i}`:""} 页`}),!m&&me==="rendering"&&t.jsx(nr,{$status:"rendering",children:"渲染中"}),me==="completed"&&t.jsx(nr,{$status:"completed",children:"已完成"}),me==="failed"&&t.jsx(nr,{$status:"failed",children:"失败"}),me==="stopped"&&t.jsx(nr,{$status:"stopped",children:"已停止"}),v==="email_attachment"&&j&&t.jsxs(nr,{$status:S||"ready",title:j,children:["附件：",j]}),ye&&t.jsx(nr,{$status:"original",children:"当前查看：原始 PPT"}),t.jsx(Qv,{title:H||k||z[0]||Te,children:H||k||z[0]||Te}),t.jsxs(tw,{type:"button",onClick:Ke,disabled:!_,title:E?ye?"当前查看：原始 PPT，尚未应用软件模板。":`当前模板：${se}`:"请先导入或生成 PPT 内容后再替换模板。",children:[t.jsx(nw,{$color:ye?"94a3b8":(F==null?void 0:F.previewColor)||"3b82f6"}),t.jsx(rw,{children:_e})]}),p.length>1&&t.jsx(iw,{value:a||"",onChange:Re=>q(Re.target.value),title:"历史内容包",children:p.slice(0,5).map(Re=>t.jsx("option",{value:Re.packageId,children:Re.title||"未命名"},Re.packageId))}),t.jsx(Rt,{onClick:V,disabled:!Le,children:"导入 PPT"}),t.jsx(ew,{}),Be()]}),t.jsxs(ow,{children:[dt(),He()]}),t.jsx(Vv,{open:ge,skills:f,activeSkillId:Ee??null,contentPackageId:a,workspacePath:u,deckDocumentId:h,onClose:()=>J(!1),onApplied:C}),Xe()]})}const $w=l.section`
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  background: linear-gradient(180deg, rgba(252, 253, 255, 0.96) 0%, rgba(245, 249, 253, 0.98) 100%);
`,Tw=l.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e1e9f1;
  background: rgba(255, 255, 255, 0.96);
`,Cw=l.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`,Pw=l.div`
  font-size: 14px;
  font-weight: 800;
  color: #1f3447;
`,Aw=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.65;
  color: #6f8396;
`,_w=l.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
`,Ew=l.div`
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`,zw=l.div`
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 20px;
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: rgba(110, 135, 164, 0.45) rgba(148, 167, 190, 0.12);

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(148, 167, 190, 0.12);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(110, 135, 164, 0.38);
    border-radius: 999px;
    border: 2px solid rgba(248, 251, 255, 0.92);
  }
`,Dw=l.div`
  position: relative;
  min-height: 100%;
`,Rw=l.aside`
  position: absolute;
  right: 28px;
  bottom: 24px;
  z-index: 4;
  width: min(320px, calc(100% - 40px));
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(186, 205, 223, 0.92);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(245, 249, 253, 0.98) 100%);
  box-shadow: 0 18px 40px rgba(31, 52, 71, 0.14);
  backdrop-filter: blur(10px);

  @media (max-width: 960px) {
    position: sticky;
    right: auto;
    bottom: 16px;
    margin: 20px 0 0 auto;
  }
`,Mw=l.div`
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6d8499;
`,Fw=l.div`
  font-size: 16px;
  line-height: 1.45;
  font-weight: 800;
  color: #21384b;
`,Bw=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.7;
  color: #607487;
`,Lw=l.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`,ru=l.button`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid ${({$tone:e})=>e==="primary"?"#5f97d7":"#cad8e6"};
  background: ${({$tone:e})=>e==="primary"?"linear-gradient(180deg, #6aa3e1 0%, #4e8fd6 100%)":"#ffffff"};
  color: ${({$tone:e})=>e==="primary"?"#ffffff":"#2b4358"};
  font-size: var(--font-size-sm);
  font-weight: 800;
  cursor: pointer;
  box-shadow: ${({$tone:e})=>e==="primary"?"0 10px 22px rgba(74, 140, 214, 0.22)":"none"};

  &:hover:not(:disabled) {
    background: ${({$tone:e})=>e==="primary"?"linear-gradient(180deg, #5f9bdd 0%, #4787cf 100%)":"#f4f8fb"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`,Nw=l.div`
  padding: 2px 0;
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: #6e8295;
`,iu=l.div`
  padding: 2px 0 6px;
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: #4e657b;
  font-weight: 700;
`,Ow=l.div`
  width: 100%;
  min-height: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.9;
  color: #23384a;
`,cn=l.button`
  min-width: 108px;
  height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #cfdce8;
  background: #ffffff;
  color: #30485f;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f4f8fb;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,Ww=l.button`
  min-width: 120px;
  height: 38px;
  padding: 0 16px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  color: #ffffff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`,Uw=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 20px 14px;
  border-top: 1px solid #e1e9f1;
  background: rgba(255, 255, 255, 0.96);
`,Hw=l.div`
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
`,Kw=l.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${({$phase:e})=>e==="completed"?"#2f8f5b":e==="running"?"#2f7dd1":e==="error"?"#c84a4a":"#9aacbe"};
  box-shadow: ${({$phase:e})=>e==="running"?"0 0 0 5px rgba(47, 125, 209, 0.12)":e==="completed"?"0 0 0 5px rgba(47, 143, 91, 0.12)":e==="error"?"0 0 0 5px rgba(200, 74, 74, 0.12)":"0 0 0 5px rgba(154, 172, 190, 0.12)"};
`,Gw=l.div`
  min-width: 0;
  font-size: var(--font-size-sm);
  line-height: 1.5;
  font-weight: 700;
  color: #294158;
`,qw=l.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
`,ir=l.div`
  min-width: 0;
  max-width: min(360px, 100%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid ${({$tone:e})=>e==="error"?"#f0c6c6":"#d7e2ec"};
  background: ${({$tone:e})=>e==="error"?"#fff4f4":"#f7fafc"};
`,or=l.span`
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #73879a;
`,sr=l.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: ${({$tone:e})=>e==="error"?"#a33d3d":"#30485f"};
`;function Vw(e){return e==="base-replace"?"替换模式":e==="overlay"?"覆盖模式":"自动"}function ca(e){var n;return(n=e==null?void 0:e.formalTemplate)!=null&&n.actualMode?e.formalTemplate.actualMode==="schema-first"?"模板优先":"兼容模式":null}const Yw=l.img`
  display: block;
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
  box-shadow: 0 12px 28px rgba(30, 58, 95, 0.08);
`,Jw=l.div`
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`,Xw=l.div`
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  border: 1px solid #dbe5ef;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  padding: 28px;
`,Zw=l.div`
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
  padding: 36px 18px;
  color: #6d8296;
`,Qw=l.div`
  font-size: 16px;
  font-weight: 800;
  color: #27445d;
`,e1=l.div`
  max-width: 520px;
  font-size: var(--font-size-sm);
  line-height: 1.75;
`,ou=l.div`
  display: grid;
  gap: 10px;
  align-content: start;
`,su=l.div`
  border: 1px solid #dbe6ef;
  border-radius: 14px;
  background: #fbfdff;
  padding: 14px;
  display: grid;
  gap: 8px;
`,au=l.div`
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: #1f3447;
`,da=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.65;
  color: #5b6f83;
`;function t1(e){try{const n=e.replace(/^```(?:json)?\s*/i,"").replace(/\s*```\s*$/i,"").trim(),r=JSON.parse(n);if(r&&Array.isArray(r.slides)&&r.slides.length>0)return r}catch{}return null}function n1(e){return{cover:"封面",toc:"目录",section:"章节",content:"内容",summary:"总结"}[e]||e}function r1(e,n){var i;return((i={document:{idle:"未开始生成",running:"正在生成文稿…",completed:"文稿已生成",error:"文稿生成失败"},image:{idle:"未开始生成",running:"正在生成图片…",completed:"图片已生成",error:"图片生成失败"},ppt:{idle:"未开始生成",running:"正在生成 PPT…",completed:"PPT 已生成",error:"PPT 生成失败"},email:{idle:"未开始生成",running:"正在生成邮件…",completed:"邮件已生成",error:"邮件生成失败"},"daily-report":{idle:"未开始生成",running:"正在生成日报…",completed:"日报已生成",error:"日报生成失败"},homework:{idle:"未开始生成",running:"正在解答作业…",completed:"作业已解答",error:"作业解答失败"},"ai-class":{idle:"未连接",running:"连接中…",completed:"已连接",error:"连接失败"},"ai-forum":{idle:"未连接",running:"连接中…",completed:"已连接",error:"连接失败"},paper:{idle:"未开始生成",running:"正在生成论文…",completed:"论文已生成",error:"论文生成失败"},data:{idle:"未开始分析",running:"正在分析数据…",completed:"分析完成",error:"分析失败"},model:{idle:"未开始",running:"运行中…",completed:"已完成",error:"运行失败"},"daily-feed":{idle:"未加载",running:"加载中…",completed:"已加载",error:"加载失败"}}[e])==null?void 0:i[n])??n}function i1(e,n){var o;const r=String(e||"").replace(/\s+/g," ").trim();if(!r)return"生成失败，请重试";if(/工作区/.test(r))return"请先打开工作区";if(/模板/.test(r))return"未选择模板";if(/(素材|参考图|参考资料|勾选|至少|主参考图)/.test(r))return n==="image"?"素材不足":"未选择模板 / 素材不足";if(/(第三方|接口|服务|API|超时|timeout|network|fetch|HTTP|连接)/i.test(r))return"第三方接口异常";if(/请重试/.test(r))return"生成失败，请重试";const i=((o=r.split(/[。！？!?]/)[0])==null?void 0:o.trim())||r;return i.length>24?`${i.slice(0,24)}…`:i}function o1(e){if(!e)return null;const n=new Date(e);return Number.isNaN(n.getTime())?null:n.toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1}).replace(/\//g,"-")}function s1(e){const n=String(e||"").replace(/\s+/g," ").trim();return n.length>28?`${n.slice(0,28)}…`:n}function Ng(e){return String(e||"").replace(/\.[^.]+$/,"").trim()}function a1(e){return`请基于《${Ng(e)||"当前文稿"}》生成一份结构清晰、适合汇报展示的 PPT，突出核心信息、逻辑层次与可展示性。`}function l1(e){const n=String(e||"").split(/\r?\n/),r=[];let i="",o=null;for(const s of n){const a=s.trim();if(a){if(!i&&/^#\s+/.test(a)){i=a.replace(/^#\s+/,"").trim();continue}if(/^##\s+/.test(a)){o&&r.push(o),o={title:a.replace(/^##\s+/,"").trim(),bullets:[]};continue}if(!o){i||(i=a);continue}if(/^-\s+/.test(a)){o.bullets.push(a.replace(/^-\s+/,"").trim());continue}o.bullets.push(a.replace(/^[0-9]+[.)、]\s+/,"").trim())}}return o&&r.push(o),{deckTitle:i,slides:r}}function c1(){var Qn,An,Bt;const{currentMode:e,enterPptGenerationMode:n}=Cn(),r=kr(),i=Sr(),{activeWorkspacePath:o,refreshTree:s}=Ft(),{tabs:a,activeTabId:d,mainTabId:u,setStatusMessage:f}=Jn(),{saveActiveDocument:p,saveActiveDocumentAs:m}=Fs(),{runtime:g}=wc(),{commitResult:h}=zs(),{commitDocumentEdit:x}=Ag(),[k,v]=c.useState(null),[y,j]=c.useState(null),[S,z]=c.useState(null),P=c.useRef(null),I=c.useRef([]),[b,$]=c.useState(""),[O,D]=c.useState(!1),[R,V]=c.useState(!1),[te,q]=c.useState([]),[W,fe]=c.useState([]),le=r.sessions.ppt.pptActiveSkillId,Q=r.sessions.ppt.pptContentPackageId,ge=r.sessions.ppt.pptDeckDocumentId??null,J=r.sessions.ppt.pptActiveTemplateManifestId??null,H=r.sessions.ppt.pptTaskStatus,T=r.sessions.ppt.pptLiveSlides,w=r.sessions.ppt.pptTotalSlides,L=r.sessions.ppt.pptActiveSlideIndex,N=r.sessions.ppt.pptIsResuming,M=r.sessions.ppt.pptSourceType,A=r.sessions.ppt.pptOriginalFilePath,ee=r.sessions.ppt.pptOriginalFileName,me=r.sessions.ppt.pptImportStatus,Ie=r.sessions.ppt.pptImportWarnings,Fe=Sc(e),Z=e==="document"?(h==null?void 0:h.outputPath)??r.resultPath:null,X=c.useMemo(()=>a.find(ce=>ce.id===d)||null,[d,a]),ye=!!(X&&X.id!==u&&!X.preview),Ee=ye&&(X==null?void 0:X.filePath)||null,G=!!(ye&&!Ee),F=Ee||Z,se=F?sa(F):"",_e=e==="document"?((Qn=h==null?void 0:h.documentArtifact)==null?void 0:Qn.document)??null:null,de=e==="document"?(S==null?void 0:S.previewDocument)??_e:null,oe=c.useMemo(()=>de?wg(de):null,[de]),Te=(oe==null?void 0:oe.diagnostics)||null,C=e==="document"?Z:r.resultPath,E=oy(e==="document"&&!_e?Z:null),K=c.useMemo(()=>l1(r.resultPreviewText),[r.resultPreviewText]),_=c.useMemo(()=>i.documents.find(ce=>ce.id===r.currentTemplateId)||null,[i.documents,r.currentTemplateId]),Y=c.useMemo(()=>r1(e,r.generationStatus.phase),[e,r.generationStatus.phase]),ae=c.useMemo(()=>r.generationStatus.phase==="error"?i1(r.generationStatus.message,e):null,[e,r.generationStatus.message,r.generationStatus.phase]),je=c.useMemo(()=>o1(r.generationStatus.updatedAt),[r.generationStatus.updatedAt]),Le=e==="image"?r.imageReferences.length:r.selectedAssetIds.length,Ke=e==="image"?"参考图":"已选素材",Be=c.useMemo(()=>k?s1(k):null,[k]),mt=c.useMemo(()=>{const ce=(X==null?void 0:X.fileName)||r.resultTitle||Un(F||"")||"当前文稿";return Ng(ce)||"当前文稿"},[X==null?void 0:X.fileName,F,r.resultTitle]),He=e==="document"&&!G&&!!F,dt=c.useMemo(()=>y==="knowledge"?"正在把当前文稿导入知识库，请稍候。":y==="ppt"?"正在切换到 PPT 工作台，并准备自动开始生成。":G?"当前是未保存草稿，请先保存到工作区后再继续。":F?"你可以把当前文稿沉淀到知识库，或直接把它作为主材料切到 PPT 工作台继续生成。":"请先生成或打开一个可落盘的文稿。",[y,G,F]),Xe=e==="document"?_e?"成稿预览":"文稿预览":`${Fe.label}预览主区`,Re=e==="document"&&_e?"这里默认按 A4 成稿页面展示当前文稿。需要微调时，将鼠标移到标题、正文、待补内容或图片上，即可直接在原位置修改。":Fe.previewHint;c.useEffect(()=>{P.current=S},[S]),c.useEffect(()=>{const ce=_e?U0(_e,I.current):null;I.current=[],P.current=ce,z(ce)},[_e]);const tt=c.useCallback(ce=>ce.type==="replace_block"?{pending:"正在把当前段落改写提交到正式模板结果...",success:"段落改写已提交为正式结果，预览已重新对齐正式结果。",mirror:"段落改写已提交为正式结果。",failure:"段落改写提交失败。",shellValidationFailure:"模板壳层校验未通过，本次段落改写未生效。"}:ce.type==="fill_slot"?{pending:"正在把当前待补内容提交到正式模板结果...",success:"待补内容已提交为正式结果，预览已重新对齐正式结果。",mirror:"待补内容已提交为正式结果。",failure:"待补内容提交失败。",shellValidationFailure:"模板壳层校验未通过，本次待补内容修改未生效。"}:{pending:"正在把当前图片替换提交到正式模板结果...",success:"图片替换已提交为正式结果，预览已重新对齐正式结果。",mirror:"图片替换已提交为正式结果。",failure:"图片替换提交失败。",shellValidationFailure:"模板壳层校验未通过，本次图片替换未生效。"},[]),ue=c.useCallback(async ce=>{const we=P.current;if(!we)return v("当前文稿暂不可编辑。"),!1;const Se=G0(we,ce);if(P.current=Se.state,z(Se.state),!Se.ok)return v(`修改未生效：${Se.error.message}`),!1;if(v(Se.message),ce.type==="replace_block"||ce.type==="fill_slot"||ce.type==="replace_image"){const he=tt(ce),Me=await x(Se.state.patches,{pendingStatusMessage:he.pending,successStatusMessage:he.mirror,successMirrorMessage:he.mirror,genericFailureMessage:he.failure,shellValidationFailureMessage:he.shellValidationFailure});if(!Me.success)return v(`本地预览已更新，但正式提交失败：${Me.errorMessage}`),!0;I.current=Se.state.patches.filter(xe=>xe.type!=="replace_block"&&xe.type!=="fill_slot"&&xe.type!=="replace_image"),v(he.success)}return!0},[x,tt]),ze=async(ce,we,Se)=>{const he=_i(ce);if(!he){v(Se);return}const Me=await window.electronAPI.openExternalFile(he);v(Me.success?we:`${Se}${Me.error?`：${Me.error}`:""}`)},re=async()=>{if(!Z){v("请先生成文稿，再下载结果。");return}const ce=Un(Z)||"正式模板输出.docx",we=await window.electronAPI.saveFileDialog(ce);if(!we)return;const Se=/\.[^.]+$/.test(we)?we:`${we}.docx`;try{const he=await window.electronAPI.copyFileToPath(Z,Se);v(`文稿已保存到 ${he.path}`)}catch(he){v(he instanceof Error?`下载失败：${he.message}`:"下载失败。")}},pe=c.useCallback(async()=>{await p({reason:"manual"}),o&&s().catch(()=>{})},[o,s,p]),ne=c.useCallback(async()=>{await m(),o&&s().catch(()=>{})},[o,s,m]),Ve=async()=>{const ce=r.resultPath;if(!ce){v("请先生成 PPT，再打开。");return}await ze(ce,"已用 PowerPoint 打开 PPT 文件。","打开 PPT 文件失败")},ve=async()=>{const ce=r.resultPath;if(!ce){v("请先生成 PPT，再下载结果。");return}const we=Un(ce)||"演示文稿.pptx",Se=await window.electronAPI.saveFileDialog(we);if(!Se)return;const he=/\.[^.]+$/.test(Se)?Se:`${Se}.pptx`;try{const Me=await window.electronAPI.copyFileToPath(ce,he);v(`PPT 已保存到 ${Me.path}`)}catch(Me){v(Me instanceof Error?`下载 PPT 失败：${Me.message}`:"下载 PPT 失败。")}},ct=async()=>{const ce=r.resultPreviewUrl||as(r.resultPath||"");if(!ce){v("没有可插入的图片，请先生成图表。");return}if(!g){v("当前没有激活的文档，请先打开或新建文档后再插入。");return}await g.insertAnchoredImage({src:ce,alt:r.resultTitle||"图表",placement:"cursor"}),v("图表已插入编辑器。"),f("图表已插入编辑器")},Je=async()=>{const ce=r.resultPath||r.resultPreviewUrl||"";if(!ce||!o){v("请先打开工作区，再保存图片结果。");return}try{const we=await window.electronAPI.detectProjectStructure(o),Se=r.resultTitle||"generated-image.png",he=/^data:image\//i.test(ce);let Me;if(he){const xe=ce.replace(/^data:[^;]+;base64,/,"");Me=we.hasFigures?await window.electronAPI.saveImageToFiguresBase64(o,Se,xe):await window.electronAPI.saveImageToWorkspace(o,Se,xe)}else Me=we.hasFigures?await window.electronAPI.saveImageToFigures(o,_i(ce),Se):await window.electronAPI.saveImageFromUrl(o,_i(ce),Se);r.setGenerationResult({resultAssetId:Me.path,resultPath:Me.path,resultTitle:Me.filename,resultPreviewUrl:as(Me.path)}),f(`图片已保存到工作区：${Me.filename}`),v(`图片已保存到 ${Me.path}`)}catch(we){v(we instanceof Error?`保存图片失败：${we.message}`:"保存图片失败。")}};c.useEffect(()=>{if(e!=="ppt")return;const ce=["academic_defense","chinese_season","business_report"];window.electronAPI.pptxListSkills({workspacePath:o||void 0}).then(we=>{we.success&&we.skills&&q(we.skills.filter(Se=>ce.includes(Se.id)||Se.source==="skill"))}).catch(()=>{}),o&&window.electronAPI.pptxListContentPackages({workspacePath:o}).then(we=>{we.success&&we.packages&&fe(we.packages.slice(0,5))}).catch(()=>{})},[e,o]),c.useEffect(()=>{e==="ppt"&&(Q||o&&window.electronAPI.pptxListContentPackages({workspacePath:o}).then(ce=>{if(ce.success&&ce.packages&&ce.packages.length>0){const we=ce.packages[0];r.setModeSession("ppt",Se=>({...Se,pptContentPackageId:Se.pptContentPackageId||we.packageId}))}}).catch(()=>{}))},[e,Q,o,r]),c.useCallback(async ce=>{var we;if(!(!o||!Q||O)&&ce!==le){D(!0),$("应用模板中 · 不消耗 token"),r.setGenerationStatus("running","应用模板中 · 不消耗 token");try{const Se=await window.electronAPI.pptxRenderWithSkill({workspacePath:o,contentPackageId:Q,skillId:ce});if(!Se.success){$(`应用模板失败：${Se.error||"未知错误"}`),r.setGenerationStatus("error",Se.error||"应用模板失败");return}r.setModeSession("ppt",Me=>({...Me,resultPath:Se.outputPath||Me.resultPath,resultAssetId:Se.outputPath||Me.resultAssetId,pptActiveSkillId:ce,generationStatus:{phase:"completed",message:"模板已切换 · 不消耗 token",updatedAt:new Date().toISOString()}}));const he=((we=te.find(Me=>Me.id===ce))==null?void 0:we.name)||ce;$(`已切换到「${he}」· 不消耗 token`)}catch(Se){const he=Se instanceof Error?Se.message:"应用模板失败";$(`应用模板失败：${he}`),r.setGenerationStatus("error",he)}finally{D(!1)}}},[o,Q,O,le,r,te]);const Ge=c.useCallback(()=>{r.setModeSession("ppt",ce=>({...ce,pptStopRequested:!0,pptTaskStatus:"stopped"}))},[r]),ie=c.useCallback(async(ce,we)=>{var Me;const Se=((Me=te.find(xe=>xe.id===ce))==null?void 0:Me.name)||ce;r.setModeSession("ppt",xe=>({...xe,resultPath:we,resultAssetId:we,resultTitle:Un(we),pptActiveSkillId:ce,pptActiveTemplateManifestId:ce,pptTaskStatus:"completed",generationStatus:{phase:"completed",message:`模板已应用：${Se} · 不消耗 token`,updatedAt:new Date().toISOString()}})),$(`模板已应用：${Se} · 不消耗 token`);const he=r.sessions.ppt.pptDeckDocumentId;if(o&&he&&we)try{const xe=`${o}\\05_Presentation\\decks\\${he}\\preview\\${ce}`,xt=await window.electronAPI.deckPreview({pptxPath:we,previewDir:xe});if(xt.success&&xt.slides&&xt.slides.length>0){const vt=xt.slides;r.setModeSession("ppt",et=>({...et,pptLiveSlides:et.pptLiveSlides.length>0?et.pptLiveSlides.map((It,mn)=>{var Bn;return{...It,imagePath:((Bn=vt[mn])==null?void 0:Bn.imagePath)||It.imagePath,imageLoading:!1,isGenerating:!1}}):vt.map(It=>({index:It.index,type:"content",title:`第 ${It.index+1} 页`,imagePath:It.imagePath,imageLoading:!1,isGenerating:!1})),pptActiveSlideIndex:0,pptTotalSlides:et.pptLiveSlides.length||vt.length,pptPreviewSlides:vt.map(It=>{var mn;return{index:It.index,imagePath:It.imagePath,title:((mn=et.pptLiveSlides[It.index])==null?void 0:mn.title)||`第 ${It.index+1} 页`}})}))}else xt.warning&&console.warn("[pptSkill] preview warning after template switch:",xt.warning)}catch(xe){console.warn("[pptSkill] preview error after template switch:",xe)}},[r,te,o]),Ae=c.useCallback(ce=>{r.setModeSession("ppt",we=>({...we,pptActiveSlideIndex:ce}))},[r]),De=c.useCallback(ce=>{r.setModeSession("ppt",we=>({...we,pptContentPackageId:ce,pptActiveSkillId:null}))},[r]),Ne=c.useCallback((ce,we)=>{const Se=ce&&typeof ce=="object"&&Array.isArray(ce.slides)?ce.slides:[];return Se.length===0?we:Se.map((he,Me)=>{const xe=we[Me],xt=Array.isArray(he.items)?he.items.map(String):xe==null?void 0:xe.items;return{index:typeof he.index=="number"?he.index:Me,type:String(he.intent||(xe==null?void 0:xe.type)||"content"),title:he.title!=null?String(he.title):xe==null?void 0:xe.title,subtitle:he.subtitle!=null?String(he.subtitle):xe==null?void 0:xe.subtitle,heading:he.heading!=null?String(he.heading):xe==null?void 0:xe.heading,body:he.body!=null?String(he.body):xe==null?void 0:xe.body,items:xt,summary:he.summary!=null?String(he.summary):xe==null?void 0:xe.summary,speakerNotes:he.speakerNotes!=null?String(he.speakerNotes):he.notes!=null?String(he.notes):xe==null?void 0:xe.speakerNotes,notes:he.notes!=null?String(he.notes):he.speakerNotes!=null?String(he.speakerNotes):xe==null?void 0:xe.notes,visualBrief:he.visualBrief!=null?String(he.visualBrief):xe==null?void 0:xe.visualBrief,imagePath:(xe==null?void 0:xe.imagePath)||null,imageLoading:!1,isGenerating:!1}})},[]),qe=c.useCallback(async()=>{if(!o){v("请先选择工作区。");return}if(!(R||O)){V(!0),r.setGenerationStatus("running","正在导入 PPT 内容…");try{const ce=await window.electronAPI.pptxImportFromDialog({workspacePath:o});if(ce.canceled){r.setGenerationStatus("idle","");return}if(!ce.success){const Me=ce.error||"导入 PPT 失败。";v(Me),r.setGenerationStatus("error",Me);return}const we=ce.originalPptxPath?Un(ce.originalPptxPath):"导入的 PPT",Se=Ne(ce.deck,[]).map((Me,xe)=>{var xt,vt;return{...Me,imagePath:((vt=(xt=ce.previewSlides)==null?void 0:xt[xe])==null?void 0:vt.imagePath)||null,imageLoading:!1,isGenerating:!1}}),he=`已导入原版 PPT：${we}`;r.setModeSession("ppt",Me=>({...Me,resultPath:ce.originalPptxPath||Me.resultPath,resultAssetId:ce.originalPptxPath||Me.resultAssetId,resultTitle:we,pptDeckDocumentId:ce.deckDocumentId||Me.pptDeckDocumentId,pptDeckPath:ce.deckPath||Me.pptDeckPath,pptOriginalFilePath:ce.originalPptxPath||Me.pptOriginalFilePath,pptOriginalFileName:we,pptSourceType:"imported_pptx",pptActiveSkillId:null,pptActiveTemplateManifestId:null,pptLiveSlides:Se.length>0?Se:Me.pptLiveSlides,pptPreviewSlides:Se.length>0?Se.filter(xe=>xe.imagePath).map(xe=>({index:xe.index,imagePath:xe.imagePath,title:xe.title||""})):Me.pptPreviewSlides,pptTotalSlides:Se.length||Me.pptTotalSlides,pptActiveSlideIndex:0,pptTaskStatus:"completed",pptImportStatus:"ready",pptImportWarnings:ce.extractionWarnings||[],generationStatus:{phase:"completed",message:`${he} · 当前查看：原始 PPT，尚未应用模板`,updatedAt:new Date().toISOString()}})),v(he),$("当前查看：原始 PPT · 尚未应用模板")}catch(ce){const we=ce instanceof Error?ce.message:"导入 PPT 失败。";v(we),r.setGenerationStatus("error",we)}finally{V(!1)}}},[o,Ne,O,R,r]),Oe=c.useCallback(async(ce,we,Se,he)=>{var xt;if(!o)return null;const Me=`${o}\\05_Presentation\\decks\\${we}\\preview\\${Se}`,xe=await window.electronAPI.deckPreview({pptxPath:ce,previewDir:Me});return!xe.success||!((xt=xe.slides)!=null&&xt.length)?null:he.length===0?xe.slides.map(vt=>({index:vt.index,type:"content",title:vt.title||`第 ${vt.index+1} 页`,imagePath:vt.imagePath,imageLoading:!1,isGenerating:!1})):he.map((vt,et)=>{var It,mn;return{...vt,imagePath:((mn=(It=xe.slides)==null?void 0:It[et])==null?void 0:mn.imagePath)||vt.imagePath,imageLoading:!1,isGenerating:!1}})},[o]),gt=c.useCallback(async()=>{var we;if(!o||O||!Q&&!ge)return;const ce=J||le||"business_report";D(!0),$("应用模板中 · 不消耗 token"),r.setModeSession("ppt",Se=>({...Se,pptTaskStatus:"rendering_preview"}));try{const Se=ge?await window.electronAPI.deckRender({workspacePath:o,deckId:ge,manifestId:ce}):await window.electronAPI.pptxRenderWithSkill({workspacePath:o,contentPackageId:Q||"",skillId:ce});if(Se.success&&Se.outputPath){let he=null;if(ge){const Me=`${o}\\05_Presentation\\decks\\${ge}\\preview\\${ce}`,xe=await window.electronAPI.deckPreview({pptxPath:Se.outputPath,previewDir:Me});xe.success&&((we=xe.slides)!=null&&we.length)?he=T.map((xt,vt)=>{var et,It;return{...xt,imagePath:((It=(et=xe.slides)==null?void 0:et[vt])==null?void 0:It.imagePath)||xt.imagePath,imageLoading:!1,isGenerating:!1}}):(xe.warning||xe.error)&&$(`重新渲染完成，预览提示：${xe.warning||xe.error}`)}r.setModeSession("ppt",Me=>({...Me,resultPath:Se.outputPath||Me.resultPath,resultAssetId:Se.outputPath||Me.resultAssetId,pptActiveSkillId:ce,pptActiveTemplateManifestId:ce,pptTaskStatus:"completed",pptLiveSlides:he||Me.pptLiveSlides,pptPreviewSlides:he?he.filter(xe=>xe.imagePath).map(xe=>({index:xe.index,imagePath:xe.imagePath,title:xe.title})):Me.pptPreviewSlides,generationStatus:{phase:"completed",message:"重新渲染完成 · 不消耗 token",updatedAt:new Date().toISOString()}})),$("重新渲染完成 · 不消耗 token")}else{const he=Se.error||"重新渲染失败";r.setGenerationStatus("error",he),$(he)}}catch(Se){const he=Se instanceof Error?Se.message:"重新渲染失败";r.setGenerationStatus("error",he),$(he)}finally{D(!1)}},[o,Q,ge,J,le,O,T,r]),rt=c.useCallback(()=>{Q&&r.setModeSession("ppt",ce=>({...ce,pptResumeRequested:!0,pptStopRequested:!1}))},[Q,r]),Qe=c.useCallback(async()=>{var Se;let ce=A||"";if(!ce&&o&&ge){const he=await window.electronAPI.deckLoad({workspacePath:o,deckId:ge}),Me=he.success&&he.deck&&typeof he.deck=="object"?he.deck.source:null;ce=(Me==null?void 0:Me.sourcePath)||""}if(!ce){const he="源文件不存在，可能已被移动或删除。";v(he),$(he);return}const we=await window.electronAPI.openExternalFile(ce);if(!we.success){const he=(Se=we.error)!=null&&Se.includes("路径不存在")?"源文件不存在，可能已被移动或删除。":`打开源文件失败${we.error?`：${we.error}`:""}`;v(he),$(he);return}v("已打开源文件。"),$("已打开源文件。")},[o,ge,A]),Ze=c.useCallback(async(ce,we)=>{if(!o||!ge)return v("当前没有可保存的 DeckDocument。"),!1;try{const Se=await window.electronAPI.deckUpdateSlide({workspacePath:o,deckId:ge,slideIndex:ce,updates:we});if(!Se.success)return v(`保存当前页失败：${Se.error||"未知错误"}`),!1;const he=J||le||"business_report",Me=Ne(Se.deck,r.sessions.ppt.pptLiveSlides);r.setModeSession("ppt",vt=>({...vt,pptLiveSlides:Me,pptDeckPath:Se.filePath||vt.pptDeckPath,pptTaskStatus:"rendering_preview",generationStatus:{phase:"running",message:"当前页已保存，正在重新渲染预览 · 不消耗 token",updatedAt:new Date().toISOString()}}));const xe=await window.electronAPI.deckRender({workspacePath:o,deckId:ge,manifestId:he});if(!xe.success||!xe.outputPath){const vt=`当前页已保存，但重新渲染失败：${xe.error||"未知错误"}`;return r.setModeSession("ppt",et=>({...et,pptTaskStatus:"completed",generationStatus:{phase:"error",message:vt,updatedAt:new Date().toISOString()}})),v(vt),!0}const xt=await Oe(xe.outputPath,ge,he,Me);return r.setModeSession("ppt",vt=>({...vt,resultPath:xe.outputPath||vt.resultPath,resultAssetId:xe.outputPath||vt.resultAssetId,resultTitle:xe.outputPath?Un(xe.outputPath):vt.resultTitle,pptLiveSlides:xt||Me,pptPreviewSlides:xt?xt.filter(et=>et.imagePath).map(et=>({index:et.index,imagePath:et.imagePath,title:et.title})):vt.pptPreviewSlides,pptTotalSlides:(xt||Me).length,pptTaskStatus:"completed",generationStatus:{phase:"completed",message:"当前页已保存并刷新预览 · 不消耗 token",updatedAt:new Date().toISOString()}})),v("当前页已保存并刷新预览。"),!0}catch(Se){const he=Se instanceof Error?Se.message:"保存当前页失败";return v(he),!1}},[o,Ne,le,J,ge,Oe,r]),ut=c.useCallback(async()=>{if(!o||!ge){const we="请先生成或导入 PPT 内容后再优化结构。";v(we),$(we);return}if(O)return;const ce=J||le||"business_report";D(!0),$("正在优化结构..."),r.setModeSession("ppt",we=>({...we,pptTaskStatus:"generating_deck",generationStatus:{phase:"running",message:"正在优化结构...",updatedAt:new Date().toISOString()}}));try{const we=await window.electronAPI.deckOptimizeStructure({workspacePath:o,deckId:ge});if(!we.success||!we.deck){const xe=we.error||"AI 返回的结构不完整，已保留原 PPT。";r.setModeSession("ppt",xt=>({...xt,pptTaskStatus:"completed",generationStatus:{phase:"error",message:xe,updatedAt:new Date().toISOString()}})),v(xe),$(`优化失败：${xe}`);return}const Se=Ne(we.deck,r.sessions.ppt.pptLiveSlides);$("正在重新渲染..."),r.setModeSession("ppt",xe=>({...xe,pptDeckPath:we.deckPath||xe.pptDeckPath,pptLiveSlides:Se,pptTotalSlides:Se.length,pptTaskStatus:"rendering_preview",generationStatus:{phase:"running",message:"正在重新渲染...",updatedAt:new Date().toISOString()}}));const he=await window.electronAPI.deckRender({workspacePath:o,deckId:ge,manifestId:ce});if(!he.success||!he.outputPath){const xe=he.error||"重新渲染失败";r.setModeSession("ppt",xt=>({...xt,pptTaskStatus:"completed",generationStatus:{phase:"error",message:`优化已保存，但${xe}`,updatedAt:new Date().toISOString()}})),v(`优化已保存，但${xe}`),$(`优化失败：${xe}`);return}const Me=await Oe(he.outputPath,ge,ce,Se);r.setModeSession("ppt",xe=>({...xe,resultPath:he.outputPath||xe.resultPath,resultAssetId:he.outputPath||xe.resultAssetId,resultTitle:he.outputPath?Un(he.outputPath):xe.resultTitle,pptLiveSlides:Me||Se,pptPreviewSlides:Me?Me.filter(xt=>xt.imagePath).map(xt=>({index:xt.index,imagePath:xt.imagePath,title:xt.title})):xe.pptPreviewSlides,pptTotalSlides:(Me||Se).length,pptActiveSkillId:ce,pptActiveTemplateManifestId:ce,pptTaskStatus:"completed",generationStatus:{phase:"completed",message:"优化完成",updatedAt:new Date().toISOString()}})),v("优化完成"),$("优化完成")}catch(we){const Se=we instanceof Error?we.message:"AI 优化结构失败";r.setModeSession("ppt",he=>({...he,pptTaskStatus:"completed",generationStatus:{phase:"error",message:`优化失败：${Se}`,updatedAt:new Date().toISOString()}})),v(`优化失败：${Se}`),$(`优化失败：${Se}`)}finally{D(!1)}},[o,Ne,le,J,ge,O,Oe,r]),zt=c.useCallback(async()=>{if(!o||!Q||O)return;const ce=le||"cuhk_sz_default";D(!0),r.setModeSession("ppt",we=>({...we,pptTaskStatus:"rendering_preview"}));try{const we=await window.electronAPI.pptxRenderWithSkill({workspacePath:o,contentPackageId:Q,skillId:ce});we.success&&we.outputPath&&(r.setModeSession("ppt",Se=>({...Se,resultPath:we.outputPath||Se.resultPath,resultAssetId:we.outputPath||Se.resultAssetId,pptActiveSkillId:ce,pptTaskStatus:"stopped"})),$("已导出已生成部分 · 不消耗 token"))}catch{}finally{D(!1)}},[o,Q,le,O,r]),qt=c.useCallback(async()=>{if(!o){v("请先选择工作区。");return}const ce=r.resultPath?sa(r.resultPath):`${o.replace(/[\\/]+$/,"")}/05_Presentation`;if(!ce){v("无法确定目录路径。");return}const we=await window.electronAPI.openFolderSafe(ce,{createIfMissing:!0});we.ok||v(we.error||"打开目录失败。")},[r.resultPath,o]),_t=c.useCallback(async ce=>{if(G||!F){const Se=G?"请先保存当前文稿，再存入知识库或生成 PPT。":"当前没有可导入到知识库的文稿。";return v(Se),f(Se),null}const we=_i(F);if(!we){const Se="当前文稿路径无效，暂时无法导入知识库。";return v(Se),f(Se),null}try{const Se=await window.electronAPI.importKnowledgeDocumentFromPath(i.departmentId,we),he=Se.imported[0]||Se.duplicates[0]||null;if(!(he!=null&&he.id)){const Me=Se.failed[0],xe=Se.canceled?"已取消导入知识库。":Me?`导入知识库失败：${Me.error}`:"导入知识库失败。";return v(xe),f(xe),null}if(await i.refresh(),(ce==null?void 0:ce.announce)!==!1){const xe=Se.imported.some(xt=>xt.id===he.id)?`已存入知识库：${he.title}`:`知识库已存在该文稿：${he.title}`;v(xe),f(xe)}return he}catch(Se){const he=Se instanceof Error?`导入知识库失败：${Se.message}`:"导入知识库失败。";return v(he),f(he),null}},[G,i,F,f]),Xn=c.useCallback(async()=>{if(!y){j("knowledge");try{await _t()}finally{j(null)}}},[_t,y]),ht=c.useCallback(async()=>{if(!y){j("ppt");try{const ce=new Date().toISOString();let we=E.kind==="ready"&&E.plainText||"";if(!we.trim()&&(F!=null&&F.toLowerCase().endsWith(".docx"))){const xe=await window.electronAPI.readOoxmlPackage(F).catch(()=>null);we=String((xe==null?void 0:xe.plainText)||"").trim()}const Se=mv({title:mt,documentArtifact:(h==null?void 0:h.documentArtifact)||r.sessions.document.documentArtifact,previewText:we,updatedAt:ce});if(!Se){const xe="当前文稿暂无可用于生成 PPT 的正文内容。";v(xe),f(xe);return}const he=r.sessions.ppt.generationPrompt.trim()||a1(mt);r.setModeSession("ppt",xe=>({...xe,generationPrompt:he,generationStatus:{phase:"idle",message:"已载入当前文稿，切换后将自动开始生成 PPT。",updatedAt:ce},pendingAutoSubmitToken:`${Date.now()}-ppt-direct-source`,pendingAutoSubmitTargetAssetId:null,pptPrimarySource:Se,lastUpdatedAt:ce})),n();const Me=`已切换到 PPT 模式，正在基于《${mt}》准备生成。`;v(Me),f(Me)}finally{j(null)}}},[h==null?void 0:h.documentArtifact,mt,E,n,y,F,f,r]),bn=()=>e!=="document"?null:t.jsxs(Rw,{"data-testid":"document-preview-floating-actions",children:[t.jsx(Mw,{children:"文稿后续动作"}),t.jsx(Fw,{children:mt}),t.jsx(Bw,{children:dt}),t.jsxs(Lw,{children:[t.jsx(ru,{type:"button",onClick:()=>void Xn(),disabled:!He||y!==null,"data-testid":"document-preview-save-knowledge-button",children:y==="knowledge"?"正在存入…":"存入知识库"}),t.jsx(ru,{type:"button",$tone:"primary",onClick:()=>void ht(),disabled:!He||y!==null,"data-testid":"document-preview-generate-ppt-button",children:y==="ppt"?"正在跳转…":"生成 PPT"})]})]}),Zn=()=>{if(e==="document")return ye&&G?t.jsxs(t.Fragment,{children:[o&&t.jsx(cn,{type:"button",onClick:()=>void pe(),children:"保存到工作区"}),t.jsx(cn,{type:"button",onClick:()=>void ne(),children:"另存为"})]}):ye?t.jsxs(t.Fragment,{children:[t.jsx(cn,{type:"button",onClick:()=>void ze(F||"","已打开当前文稿。","打开当前文稿失败"),disabled:!F,children:"打开文稿"}),t.jsx(cn,{type:"button",onClick:()=>void ne(),children:"另存为"}),t.jsx(cn,{type:"button",onClick:()=>void ze(se,"已打开文稿目录。","打开文稿目录失败"),disabled:!se,children:"打开目录"})]}):t.jsxs(t.Fragment,{children:[t.jsx(cn,{type:"button",onClick:()=>void ze(Z||"","已打开生成文稿。","打开生成文稿失败"),disabled:!Z,children:"打开文稿"}),t.jsx(cn,{type:"button",onClick:()=>void re(),disabled:!Z,children:"下载文稿"}),t.jsx(cn,{type:"button",onClick:()=>void ze(Wt,"已打开输出目录。","打开输出目录失败"),disabled:!Z,children:"打开目录"})]});if(e==="image"){const ce=!!(r.resultPreviewUrl||r.resultPath);return t.jsxs(t.Fragment,{children:[t.jsx(Ww,{type:"button",onClick:()=>void ct(),disabled:!ce||!g,children:"插入编辑器"}),t.jsx(cn,{type:"button",onClick:()=>void Je(),disabled:!ce||!o||Vt,children:Vt?"已在工作区":"保存到工作区"}),t.jsx(cn,{type:"button",onClick:()=>void ze(r.resultPath||"","已打开图片结果。","打开图片结果失败"),disabled:!r.resultPath,children:"打开图片"})]})}return e==="ppt"?t.jsxs(t.Fragment,{children:[t.jsx(cn,{type:"button",onClick:()=>void ze(r.resultPath||"","已打开 PPT 文件。","打开 PPT 文件失败"),disabled:!r.resultPath,children:"打开 PPT"}),t.jsx(cn,{type:"button",onClick:()=>void ve(),disabled:!r.resultPath,children:"下载 PPT"}),t.jsx(cn,{type:"button",onClick:()=>void qt(),disabled:!r.resultPath,children:"打开目录"})]}):null},kt=()=>{if(e==="document")return de?t.jsx(Q0,{document:de,model:oe||void 0,editErrorMessage:(S==null?void 0:S.lastError)||null,onApplyEditAction:ue,testId:"generation-result-document-preview"}):t.jsx(sv,{preview:E,idleMessage:Fe.previewHint,loadingMessage:"正在读取文稿预览...",testId:"generation-result-document-preview"});if(e==="image"){const we=r.resultPreviewUrl||as(r.resultPath||"");return t.jsx(Xw,{children:we?t.jsx(Jw,{children:t.jsx(Yw,{src:we,alt:r.resultTitle||"生成图片结果"})}):t.jsxs(Zw,{children:[t.jsx(Qw,{children:"图片结果将在这里显示"}),t.jsx(e1,{children:"右侧主区只保留结果预览本身。生成完成后，结果会直接挂载到这里，并可从右上角直接打开、保存到工作区或打开所在目录。"})]})})}if(!r.resultPreviewText.trim())return t.jsx(Nw,{children:Fe.previewHint});const ce=t1(r.resultPreviewText);return ce?t.jsxs(ou,{children:[ce.title?t.jsxs(iu,{children:[ce.title,"（共 ",ce.slides.length," 页）"]}):null,ce.slides.map((we,Se)=>t.jsxs(su,{children:[t.jsxs(au,{children:[n1(we.type),"：",we.heading||we.title||`第 ${Se+1} 页`]}),(we.items||[]).map((he,Me)=>t.jsxs(da,{children:["• ",he]},`${he}-${Me}`)),we.subtitle?t.jsx(da,{children:we.subtitle}):null]},`${we.heading||we.title||""}-${Se}`))]}):K.slides.length===0?t.jsx(Ow,{children:r.resultPreviewText}):t.jsxs(ou,{children:[K.deckTitle?t.jsx(iu,{children:K.deckTitle}):null,K.slides.map((we,Se)=>t.jsxs(su,{children:[t.jsx(au,{children:we.title}),we.bullets.map((he,Me)=>t.jsxs(da,{children:["- ",he]},`${he}-${Me}`))]},`${we.title}-${Se}`))]})},Wt=C?sa(C):"",Vt=e==="image"&&!!(o&&r.resultPath&&_i(r.resultPath).startsWith(o));return e==="ppt"?t.jsx("div",{"data-testid":"generation-result-preview-panel",style:{flex:1,width:"100%",height:"100%",minWidth:0,minHeight:0,display:"flex",flexDirection:"column"},children:t.jsx(Iw,{title:r.resultTitle||r.generationPrompt.slice(0,40)||"PPT 工作台",taskStatus:H,liveSlides:T,totalSlides:w,activeSlideIndex:L,activeSkillId:le,contentPackageId:Q,deckDocumentId:ge,activeTemplateManifestId:J,sourceType:M,originalFilePath:A,originalFileName:ee,importStatus:me,importWarnings:Ie,resultPath:r.resultPath,workspacePath:o,availableSkills:te,packageHistory:W,isApplyingSkill:O||R,isResuming:N,templateStatusMessage:b,onStop:Ge,onResume:rt,onExportPartial:()=>void zt(),onRerender:()=>void gt(),onOpenPpt:()=>void Ve(),onDownloadPpt:()=>void ve(),onOpenFolder:()=>void qt(),onUploadTemplate:()=>void qe(),onSelectSlide:Ae,onSelectPackage:De,onSkillApplied:ie,onOpenOriginalFile:()=>void Qe(),onUpdateSlide:Ze,onAiOptimizeStructure:ut})}):t.jsxs($w,{"data-testid":"generation-result-preview-panel",children:[t.jsxs(Tw,{children:[t.jsxs(Cw,{children:[t.jsx(Pw,{children:Xe}),t.jsx(Aw,{children:Re})]}),t.jsx(_w,{children:Zn()})]}),t.jsx(Ew,{children:t.jsx(zw,{children:t.jsxs(Dw,{children:[kt(),bn()]})})}),t.jsxs(Uw,{children:[t.jsxs(Hw,{children:[t.jsx(Kw,{$phase:r.generationStatus.phase}),t.jsx(Gw,{children:Y})]}),t.jsxs(qw,{children:[_!=null&&_.title?t.jsxs(ir,{title:`当前模板：${_.title}`,children:[t.jsx(or,{children:"当前模板"}),t.jsx(sr,{children:_.title})]}):null,e==="document"&&((An=Te==null?void 0:Te.template)!=null&&An.mode)?t.jsxs(ir,{title:`模板模式：${Te.template.mode}`,children:[t.jsx(or,{children:"模板模式"}),t.jsx(sr,{children:Vw(Te.template.mode)})]}):null,e==="document"&&ca(Te)?t.jsxs(ir,{title:`生成策略：${ca(Te)||""}`,children:[t.jsx(or,{children:"生成策略"}),t.jsx(sr,{children:ca(Te)||""})]}):null,e==="document"&&((Bt=Te==null?void 0:Te.formalTemplate)!=null&&Bt.fallbackReasonCode)?t.jsxs(ir,{$tone:"error",title:Te.formalTemplate.fallbackReason||Te.formalTemplate.fallbackReasonCode,children:[t.jsx(or,{children:"回退原因"}),t.jsx(sr,{$tone:"error",children:Te.formalTemplate.fallbackReason||Te.formalTemplate.fallbackReasonCode})]}):null,Le>0?t.jsxs(ir,{title:`${Ke}：${Le}`,children:[t.jsx(or,{children:Ke}),t.jsx(sr,{children:String(Le)})]}):null,je?t.jsxs(ir,{title:`最近生成：${je}`,children:[t.jsx(or,{children:"最近生成"}),t.jsx(sr,{children:je})]}):null,ae?t.jsxs(ir,{$tone:"error",title:ae,children:[t.jsx(or,{children:"错误"}),t.jsx(sr,{$tone:"error",children:ae})]}):null,Be?t.jsxs(ir,{title:k||void 0,children:[t.jsx(or,{children:"最近操作"}),t.jsx(sr,{children:Be})]}):null]})]})]})}const d1=l.div`
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  overflow: hidden;
  background: linear-gradient(180deg, #f5f8fb 0%, #eef3f7 100%);
`;function u1(){return t.jsx(d1,{"data-workspace-mode":"generation",children:t.jsx(c1,{})})}const p1=[{label:"Gmail",imapHost:"imap.gmail.com",imapPort:993,imapSecure:!0,smtpHost:"smtp.gmail.com",smtpPort:465,smtpSecure:!0},{label:"QQ邮箱",imapHost:"imap.qq.com",imapPort:993,imapSecure:!0,smtpHost:"smtp.qq.com",smtpPort:465,smtpSecure:!0},{label:"163邮箱",imapHost:"imap.163.com",imapPort:993,imapSecure:!0,smtpHost:"smtp.163.com",smtpPort:465,smtpSecure:!0},{label:"Outlook",imapHost:"outlook.office365.com",imapPort:993,imapSecure:!0,smtpHost:"smtp-mail.outlook.com",smtpPort:587,smtpSecure:!1}];let f1=Date.now();const lu=()=>`mail-${(++f1).toString(36)}-${Math.random().toString(36).slice(2,6)}`;function pn(){if(typeof window<"u"){const e=window.electronAPI;if(e&&e.__isWebShim)return""}return"http://10.20.5.61:13100"}const ai="10.20.5.61",Og=993,Wg=465,Ug="https://10.20.5.61:9002/SOGo",m1="http://10.20.5.61:18008";function cu(){const e=pn();if(!e&&typeof window<"u")return window.location.host;try{return new URL(e).host}catch{return e||"API server"}}async function g1(e,n,r){const i=new AbortController,o=setTimeout(()=>i.abort(),r);try{return await fetch(e,{...n,signal:i.signal})}catch(s){throw s.name==="AbortError"?Object.assign(new Error(`请求超时（${r/1e3}s），无法连接 AccountCenter：${cu()}`),{code:"REQUEST_TIMEOUT"}):new Error(`无法连接内部账号中心：${cu()}`)}finally{clearTimeout(o)}}async function fn(e,n={},r=1e4){const o=`${pn()}${e}`,s=await g1(o,{headers:{"Content-Type":"application/json",...n.headers||{}},...n},r);if(!s.ok){let a={};try{a=await s.json()}catch{}const d=a.message||a.error||s.statusText;if(s.status===401){const u=e==="/api/auth/login";throw!u&&typeof window<"u"&&window.dispatchEvent(new CustomEvent("account:session-expired")),new Error(u?"用户名或密码错误":"登录已过期，请重新登录")}throw s.status===403?new Error(d||"该内部账号已被禁用，请联系管理员"):new Error(d||`请求失败 (${s.status})`)}return s.json()}function Pn(e){return{Authorization:`Bearer ${e}`}}async function h1(e,n){return fn("/api/auth/login",{method:"POST",body:JSON.stringify({username:e,password:n})})}async function x1(e){return fn("/api/auth/me",{headers:Pn(e)})}async function b1(e,n,r){await fn("/api/auth/change-password",{method:"POST",headers:Pn(e),body:JSON.stringify({oldPassword:n,newPassword:r})})}function y1(e){return{service:e.service,status:e.status??"unknown",syncStatus:e.syncStatus??e.sync_status??void 0,externalId:e.externalId??e.external_id??void 0,metadata:e.metadata??void 0,createdAt:e.createdAt??e.created_at??void 0,updatedAt:e.updatedAt??e.updated_at??void 0}}function du(e){const n=e,r=Array.isArray(n==null?void 0:n.bindings)?n.bindings:Array.isArray(e)?e:[],i={};for(const o of r){const s=y1(o);s!=null&&s.service&&(s.service==="mail"||s.service==="mailcow"?i.mail=s:s.service==="matrix"?i.matrix=s:s.service==="office"&&(i.office=s))}return i}async function ua(e,n){const i=Pn(e);try{const o=await fn("/api/auth/me/bindings",{headers:i},8e3);return du(o)}catch(o){const s=o instanceof Error?o.message:String(o);if(o.code==="REQUEST_TIMEOUT"||s.includes("无法连接"))throw o;if(s.includes("用户名或密码错误"))throw new Error("登录已失效，请重新登录");if(s.includes("被禁用")||s.includes("403"))throw new Error("当前账号无权读取服务绑定（403）")}try{const o=await fn(`/api/users/${encodeURIComponent(n)}/bindings`,{headers:i},8e3);return du(o)}catch(o){const s=o instanceof Error?o.message:String(o);throw o.code==="REQUEST_TIMEOUT"?new Error("服务绑定状态读取超时，请检查 AccountCenter 是否可访问"):s.includes("无法连接")?o:s.includes("用户名或密码错误")?new Error("登录已失效，请重新登录"):s.includes("被禁用")||s.includes("403")?new Error("当前账号无权读取服务绑定"):new Error(`服务绑定读取失败：${s}`)}}const jr=12e3;function v1(e){if(Array.isArray(e))return e;const n=e;return Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.people)?n.people:Array.isArray(n==null?void 0:n.items)?n.items:[]}function w1(e){return{personId:String(e.personId??e.person_id??e.id??""),name:String(e.nameCn??e.name_cn??e.displayNameCn??e.name??e.displayName??e.display_name??""),enName:e.nameEn??e.name_en??e.displayNameEn??e.enName??e.en_name??e.englishName??void 0,employeeId:e.employeeId??e.employee_id??void 0,position:e.positionCn??e.position_cn??e.position??e.jobTitle??e.job_title??void 0,department:e.department??e.departmentName??e.department_name??void 0,phone:e.phone??e.officePhone??e.office_phone??void 0,officeAddress:e.officeAddress??e.office_address??void 0,sourceEmail:e.sourceEmail??e.source_email??void 0,aiEmail:e.aiEmail??e.ai_email??void 0,status:e.status??void 0}}async function Al(e,n){const r=new URLSearchParams;n!=null&&n.name&&r.set("name",n.name),n!=null&&n.employeeId&&r.set("employeeId",n.employeeId),n!=null&&n.department&&r.set("department",n.department),n!=null&&n.position&&r.set("position",n.position),n!=null&&n.sourceEmail&&r.set("sourceEmail",n.sourceEmail),n!=null&&n.aiEmail&&r.set("aiEmail",n.aiEmail),n!=null&&n.status&&r.set("status",n.status),n!=null&&n.q&&r.set("q",n.q),(n==null?void 0:n.page)!=null&&r.set("page",String(n.page)),(n==null?void 0:n.pageSize)!=null&&r.set("pageSize",String(n.pageSize));const i=r.toString()?`?${r.toString()}`:"",o=await fn(`/api/people${i}`,{headers:Pn(e)},jr);return v1(o).map(w1).filter(s=>s.personId&&!Tc(s))}async function Hg(e){const n=await fn("/api/org-units",{headers:Pn(e)},jr);return(Array.isArray(n)?n:Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.orgUnits)?n.orgUnits:[]).map(i=>({orgUnitId:String(i.orgUnitId??i.org_unit_id??i.id??""),name:String(i.nameCn??i.name_cn??i.name??i.displayName??i.display_name??""),enName:i.nameEn??i.name_en??i.enName??i.en_name??void 0,type:i.type??i.unitType??i.unit_type??void 0,parentOrgUnitId:i.parentOrgUnitId??i.parent_org_unit_id??void 0,memberCount:typeof i.memberCount=="number"?i.memberCount:typeof i.member_count=="number"?i.member_count:typeof i.membersCount=="number"?i.membersCount:void 0})).filter(i=>i.orgUnitId)}async function S1(e){const n=await fn("/api/project-groups",{headers:Pn(e)},jr);return(Array.isArray(n)?n:Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.projectGroups)?n.projectGroups:[]).map(i=>({projectGroupId:String(i.projectGroupId??i.project_group_id??i.id??""),name:String(i.nameCn??i.name_cn??i.name??i.displayName??i.display_name??""),enName:i.nameEn??i.name_en??i.enName??i.en_name??void 0,parentCandidate:i.parentCandidate??i.parent_candidate??void 0,memberCount:typeof i.memberCount=="number"?i.memberCount:typeof i.member_count=="number"?i.member_count:void 0})).filter(i=>i.projectGroupId)}async function Kg(e,n){const r=await fn(`/api/org-units/${encodeURIComponent(n)}/members`,{headers:Pn(e)},jr);return(Array.isArray(r)?r:Array.isArray(r==null?void 0:r.data)?r.data:Array.isArray(r==null?void 0:r.members)?r.members:[]).map(o=>({personId:String(o.personId??o.person_id??o.id??""),name:String(o.nameCn??o.name_cn??o.displayNameCn??o.name??o.displayName??o.display_name??""),enName:o.nameEn??o.name_en??o.displayNameEn??o.enName??o.en_name??void 0,position:o.positionCn??o.position_cn??o.position??o.jobTitle??o.job_title??void 0,aiEmail:o.aiEmail??o.ai_email??void 0,mailboxStatus:o.mailboxStatus??o.mailbox_status??o.mailStatus??"not_created",chatStatus:o.chatStatus??o.chat_status??"not_created",isPrimary:o.isPrimary??o.is_primary??!1})).filter(o=>o.personId)}async function k1(e,n){const r=await fn(`/api/project-groups/${encodeURIComponent(n)}/members`,{headers:Pn(e)},jr);return(Array.isArray(r)?r:Array.isArray(r==null?void 0:r.data)?r.data:Array.isArray(r==null?void 0:r.members)?r.members:[]).map(o=>({personId:String(o.personId??o.person_id??o.id??""),name:String(o.nameCn??o.name_cn??o.displayNameCn??o.name??o.displayName??o.display_name??""),enName:o.nameEn??o.name_en??o.displayNameEn??o.enName??o.en_name??void 0,position:o.positionCn??o.position_cn??o.position??o.jobTitle??o.job_title??void 0,aiEmail:o.aiEmail??o.ai_email??void 0,mailboxStatus:o.mailboxStatus??o.mailbox_status??"not_created",chatStatus:o.chatStatus??o.chat_status??"not_created",role:o.role??void 0})).filter(o=>o.personId)}async function Gg(e,n){const i=await fn(`/api/people/${encodeURIComponent(n)}`,{headers:Pn(e)},jr),o=i.personProfile??i.person_profile??i,s=i.accountIdentity??i.account_identity,a=i.mailIdentity??i.mail_identity,d=i.chatIdentity??i.chat_identity,u=h=>({orgUnitId:String(h.orgUnitId??h.org_unit_id??h.id??""),orgUnitName:h.orgUnitName??h.org_unit_name??h.name??void 0,orgUnitEnName:h.orgUnitEnName??h.org_unit_en_name??h.enName??void 0,role:h.role??void 0,isPrimary:h.isPrimary??h.is_primary??!1}),f=h=>({projectGroupId:String(h.projectGroupId??h.project_group_id??h.id??""),projectGroupName:h.projectGroupName??h.project_group_name??h.name??void 0,projectGroupEnName:h.projectGroupEnName??h.en_name??void 0,role:h.role??void 0}),p=Array.isArray(i.formalMemberships)?i.formalMemberships.map(u):Array.isArray(i.formal_memberships)?i.formal_memberships.map(u):[],m=Array.isArray(i.projectMemberships)?i.projectMemberships.map(f):Array.isArray(i.project_memberships)?i.project_memberships.map(f):[],g=p.find(h=>h.isPrimary)??p[0];return{personId:String(o.personId??o.person_id??o.id??i.personId??i.person_id??i.id??""),name:String(o.nameCn??o.name_cn??o.displayNameCn??o.display_name_cn??o.name??o.displayName??o.display_name??""),enName:o.nameEn??o.name_en??o.displayNameEn??o.display_name_en??o.enName??o.en_name??void 0,employeeId:o.employeeId??o.employee_id??void 0,position:o.positionCn??o.position_cn??o.position??o.jobTitle??o.job_title??(g==null?void 0:g.role)??void 0,department:o.department??o.departmentName??o.department_name??(g==null?void 0:g.orgUnitName)??void 0,phone:o.phone??o.telephone??o.officePhone??void 0,officeAddress:o.officeAddress??o.office_address??void 0,sourceEmail:o.sourceEmail??o.source_email??void 0,aiEmail:o.aiEmail??o.ai_email??(a==null?void 0:a.aiEmail)??(a==null?void 0:a.ai_email)??void 0,status:o.status??i.status??void 0,accountIdentity:s?{id:s.id!=null?String(s.id):void 0,personId:s.personId??s.person_id??void 0,userId:s.userId??s.user_id??void 0,username:s.username??void 0,loginEmail:s.loginEmail??s.login_email??void 0,role:s.role??void 0,canLogin:s.canLogin??s.can_login??void 0,status:s.status??"unknown",mustChangePassword:s.mustChangePassword??s.must_change_password??void 0}:void 0,mailIdentity:a?{aiEmail:a.aiEmail??a.ai_email??void 0,status:a.status??a.mailboxStatus??a.mailbox_status??"not_created",externalId:a.externalId??a.external_id??void 0}:void 0,chatIdentity:d?{chatId:d.chatId??d.chat_id??d.chatUserId??d.chat_user_id??void 0,chatUserId:d.chatUserId??d.chat_user_id??d.chatId??d.chat_id??void 0,status:d.status??"not_created",externalId:d.externalId??d.external_id??void 0}:void 0,formalMemberships:p,projectMemberships:m,memberships:Array.isArray(i.memberships)?i.memberships:void 0}}async function qg(e){const n=await fn("/api/contacts/email",{headers:Pn(e)},jr);return(Array.isArray(n)?n:Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.contacts)?n.contacts:[]).map(i=>({personId:String(i.personId??i.person_id??i.id??""),name:String(i.nameCn??i.name_cn??i.displayNameCn??i.name??i.displayName??i.display_name??""),enName:i.nameEn??i.name_en??i.displayNameEn??i.enName??i.en_name??void 0,employeeId:i.employeeId??i.employee_id??void 0,department:i.department??i.departmentName??i.department_name??void 0,position:i.positionCn??i.position_cn??i.position??i.jobTitle??void 0,aiEmail:String(i.aiEmail??i.ai_email??""),sourceEmail:i.sourceEmail??i.source_email??void 0,mailboxStatus:i.mailboxStatus??i.mailbox_status??i.status??"not_created"})).filter(i=>i.personId&&i.aiEmail&&!Tc(i))}async function Vg(e){const n=await fn("/api/contacts/chat",{headers:Pn(e)},jr);return(Array.isArray(n)?n:Array.isArray(n==null?void 0:n.data)?n.data:Array.isArray(n==null?void 0:n.contacts)?n.contacts:[]).map(i=>({personId:String(i.personId??i.person_id??i.id??""),name:String(i.nameCn??i.name_cn??i.displayNameCn??i.display_name_cn??i.name??i.displayName??i.display_name??""),enName:i.nameEn??i.name_en??i.displayNameEn??i.display_name_en??i.enName??i.en_name??void 0,employeeId:i.employeeId??i.employee_id??void 0,department:i.department??i.departmentName??i.department_name??i.departmentCn??i.department_cn??void 0,position:i.positionCn??i.position_cn??i.position??i.jobTitle??i.job_title??void 0,aiEmail:i.aiEmail??i.ai_email??void 0,chatStatus:i.chatStatus??i.chat_status??i.status??"not_created",chatId:i.chatId??i.chat_id??i.chatUserId??i.chat_user_id??i.externalId??i.external_id??void 0,chatUserId:i.chatUserId??i.chat_user_id??i.chatId??i.chat_id??void 0,accountUserId:i.accountUserId??i.account_user_id??i.userId??i.user_id??void 0,username:i.username??void 0})).filter(i=>i.personId&&!j1(i))}const pa=/^(testuser|test_user|mockuser|mock_user|test\d+)/i;function Tc(e){return!!(e.personId&&pa.test(e.personId)||e.aiEmail&&pa.test(e.aiEmail.split("@")[0])||e.name&&pa.test(e.name))}function j1(e){return!!(Tc(e)||e.chatStatus==="disabled")}async function Yg(e,n,r){const i=`${pn()}${e}`,o=await fetch(i,{...r,headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`,...(r==null?void 0:r.headers)??{}}}),s=await o.json().catch(()=>({}));return{response:o,data:s}}async function I1(e,n){if(e.length===0)return[];const r=[];for(let o=0;o<e.length;o+=100)r.push(e.slice(o,o+100));const i=[];for(const o of r){const{response:s,data:a}=await Yg("/api/activity/log/batch",n,{method:"POST",body:JSON.stringify({activities:o})});if(!s.ok){const u=a;throw new Error(`activity batch sync failed ${s.status}: ${(u==null?void 0:u.error)??(u==null?void 0:u.message)??"unknown"}`)}const d=a.synced??[];i.push(...d)}return i}async function $1(e,n,r){try{const i=`/api/activity/user/${encodeURIComponent(e)}?date=${encodeURIComponent(n)}`,{response:o,data:s}=await Yg(i,r);if(o.status===403){const u=s;return{ok:!1,status:403,error:(u==null?void 0:u.error)??(u==null?void 0:u.message)??"无权查看该用户的工作活动"}}if(o.status===400){const u=s;return{ok:!1,status:400,error:(u==null?void 0:u.error)??(u==null?void 0:u.message)??"日期不在允许范围内（今天/昨天/前天）"}}if(!o.ok){const u=s;return{ok:!1,status:"network",error:`服务器错误 ${o.status}: ${(u==null?void 0:u.error)??""}`}}return{ok:!0,activities:(Array.isArray(s)?s:Array.isArray(s.activities)?s.activities:[]).map(u=>{const f=u;return{localId:String(f.localId??f.local_id??f.id??""),id:String(f.id??f.serverId??f.server_id??""),userId:String(f.userId??f.user_id??e),workspaceId:f.workspaceId??f.workspace_id,module:String(f.module??"system"),action:String(f.action??""),title:f.title,summary:f.summary,metadata:f.metadata,createdAt:String(f.createdAt??f.created_at??new Date().toISOString()),syncStatus:"synced",serverId:String(f.id??f.serverId??f.server_id??"")}}),source:"server"}}catch(i){return{ok:!1,status:"network",error:i instanceof Error?i.message:String(i)}}}const _l="aioffice.workActivityLog",T1=3*24*60*60*1e3;function Jg(){return typeof window<"u"?window.electronAPI:void 0}let Cc=null,wi=null,fa=!1;function El(e){Cc=e}function C1(){return Cc}function zl(e){wi=e}function P1(){return wi}function mi(){try{const e=localStorage.getItem(_l);return e?JSON.parse(e):[]}catch{return[]}}function gi(e){const n=Date.now()-T1;return e.filter(r=>new Date(r.createdAt).getTime()>n)}function Dl(e){try{localStorage.setItem(_l,JSON.stringify(e))}catch{try{const n=e.slice(Math.floor(e.length/2));localStorage.setItem(_l,JSON.stringify(n))}catch{}}}function A1(){return`${Date.now()}-${Math.random().toString(36).slice(2,10)}`}async function Pc(e){const n=e??wi;if(!n||fa)return;const i=gi(mi()).filter(o=>o.userId===Cc&&(!o.syncStatus||o.syncStatus==="pending"||o.syncStatus==="failed"));if(i.length!==0){fa=!0,console.debug("[activity-sync-post]",{count:i.length,endpoint:"/api/activity/log/batch"});try{const o=i.map(u=>({localId:u.localId,workspaceId:u.workspaceId,module:u.module,action:u.action,title:u.title,summary:u.summary,metadata:u.metadata,createdAt:u.createdAt})),s=await I1(o,n),a=new Map(s.map(u=>[u.localId,u.serverId])),d=gi(mi()).map(u=>a.has(u.localId)?{...u,syncStatus:"synced",serverId:a.get(u.localId),syncedAt:new Date().toISOString()}:u);Dl(d),console.debug("[activity-sync-success]",{syncedCount:s.length,results:s})}catch(o){const s=o instanceof Error?o.message:String(o);console.debug("[activity-sync-failed]",{error:s});const a=gi(mi()).map(d=>i.some(u=>u.localId===d.localId)?{...d,syncStatus:"failed",lastSyncError:s}:d);Dl(a)}finally{fa=!1}}}function to(e,n,r,i){if(!e)return;const o=new Date().toISOString(),s=A1(),a={localId:s,id:s,userId:e,workspaceId:i==null?void 0:i.workspaceId,module:n,action:r,title:i==null?void 0:i.title,summary:i==null?void 0:i.summary,metadata:i==null?void 0:i.metadata,createdAt:o,syncStatus:"pending"},d=gi(mi());d.push(a),Dl(d),console.debug("[activity-log-local-written]",{localId:s,userId:e,module:n,action:r,createdAt:o});const u=Jg();u!=null&&u.activityLogUserAction&&u.activityLogUserAction({localId:s,userId:e,module:n,action:r,title:i==null?void 0:i.title,summary:i==null?void 0:i.summary,workspaceId:i==null?void 0:i.workspaceId,metadata:i==null?void 0:i.metadata,createdAt:o}).catch(()=>{}),wi&&Pc(wi)}async function _1(e,n,r){const i=r??wi;if(i){const d=await $1(e,n,i);if(d.ok)return console.debug("[daily-report-activity-query]",{source:"server",targetUserId:e,date:n,activityCount:d.activities.length,status:"ok"}),d.activities;if(d.status===403)throw console.debug("[daily-report-activity-query]",{source:"server",targetUserId:e,date:n,activityCount:0,status:403,error:d.error}),Object.assign(new Error(d.error),{code:"FORBIDDEN"});if(d.status===400)throw console.debug("[daily-report-activity-query]",{source:"server",targetUserId:e,date:n,activityCount:0,status:400,error:d.error}),Object.assign(new Error(d.error),{code:"BAD_DATE"});console.debug("[daily-report-activity-query]",{source:"server-unreachable",targetUserId:e,date:n,error:d.error})}const o=Jg();if(o!=null&&o.activityGetUserActions)try{const d=await o.activityGetUserActions({userId:e,date:n});if(d.ok&&Array.isArray(d.actions)&&d.actions.length>0)return console.debug("[daily-report-activity-query]",{source:"local-fallback",targetUserId:e,date:n,activityCount:d.actions.length,status:"ipc-file"}),d.actions??[]}catch{}const a=gi(mi()).filter(d=>{if(d.userId!==e)return!1;const u=new Date(d.createdAt);return isNaN(u.getTime())?!1:`${u.getFullYear()}-${String(u.getMonth()+1).padStart(2,"0")}-${String(u.getDate()).padStart(2,"0")}`===n});return console.debug("[daily-report-activity-query]",{source:"local-fallback",targetUserId:e,date:n,activityCount:a.length,status:"localStorage"}),a}function E1(e){return gi(mi()).filter(r=>r.userId===e)}function Xg(e){return{document:"文稿",mail:"邮件",chat:"通讯",ppt:"PPT",image:"图片",data:"数据分析",knowledge:"知识库",delegation:"下班托管",system:"系统"}[e]??e}function z1(e,n){const r=[],i=[],o=[],s=[],a=[],d={};for(const f of e){const p=`${f.module}::${f.action}`;d[p]||(d[p]=[]),d[p].push(f)}for(const[f,p]of Object.entries(d)){const[m,g]=f.split("::"),h=p.length,x=[...new Set(p.map(v=>v.title).filter(Boolean))].slice(0,3),k=x.length>0?`（${x.join("、")}）`:"";m==="chat"?i.push(h===1?`发送了 1 条消息${k}`:`发送了 ${h} 条消息${k}`):m==="mail"?g.includes("send")||g==="sent"||g==="send_mail"?i.push(h>1?`发送了 ${h} 封邮件${k}`:`发送了邮件${k}`):g.includes("receive")||g==="received"?i.push(h>1?`收到了 ${h} 封邮件`:"收到了邮件"):i.push(`邮件操作：${g}${k}`):m==="document"?g==="saved"||g==="edited"||g==="save_document"?(r.push(`编辑并保存了文稿${k}`),x.length>0&&o.push(`文稿：${x.join("、")}`)):g==="created"||g==="new_document"?r.push(`新建了文稿${k}`):g==="exported"?o.push(`导出了文稿${k}`):g==="ai_generated"?r.push(`通过 AI 生成了文稿${k}`):r.push(`文稿操作：${g}${k}`):m==="ppt"?(r.push(`生成了 PPT${k}`),x.length>0&&o.push(`PPT：${x.join("、")}`)):m==="image"?r.push(`生成了 ${h>1?h+" 张":""}图片${k}`):m==="data"?r.push(`进行了数据分析${k}`):m==="knowledge"?r.push(`使用了知识库${k}`):m==="delegation"?r.push(`${g==="enabled"?"开启":"操作了"}下班托管`):r.push(`${Xg(m)}：${g}${k}`)}r.length===0&&i.length===0&&r.push("当日无记录到 AI-Office 内工作活动");const u=[r.length>0?`主要工作：${r.join("；")}`:"",i.length>0?`沟通事项：${i.join("；")}`:"",o.length>0?`产出文件：${o.join("；")}`:""].filter(Boolean).join(`
`);return{id:`report-${Date.now()}`,targetUserId:n.targetUserId,targetUsername:n.targetUsername,generatedByUserId:n.viewerUserId,date:n.date,sections:{mainWork:r,communication:i,artifacts:o,followUps:s,risks:a},rawSummary:u,createdAt:new Date().toISOString()}}function D1(){const e=[];for(let n=0;n<3;n++){const r=new Date;r.setDate(r.getDate()-n);const i=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`,o=n===0?"今天":n===1?"昨天":"前天";e.push({label:o,value:i})}return e}const uu=Object.freeze(Object.defineProperty({__proto__:null,buildDailyReportFromLogs:z1,flushPendingActivities:Pc,getActivitiesForUser:_1,getAmbientToken:P1,getAmbientUserId:C1,getRecentActivities:E1,getReportDateOptions:D1,logActivity:to,moduleLabel:Xg,setAmbientToken:zl,setAmbientUserId:El},Symbol.toStringTag,{value:"Module"})),no="ai_office_internal_token",R1=["mustChangePassword","requirePasswordChange","forceChangePassword","firstLogin","pendingPasswordChange"],mo=()=>typeof window<"u"?window.electronAPI:void 0;async function M1(){const e=mo();if(e!=null&&e.internalAccountGetToken){const n=(()=>{try{return localStorage.getItem(no)||null}catch{return null}})();if(n)try{await e.internalAccountSetToken(n);try{localStorage.removeItem(no)}catch{}}catch{console.warn("[InternalAccount] token migration to main process failed; will retry on next launch")}const r=await e.internalAccountGetToken();return(r==null?void 0:r.token)??null}try{return localStorage.getItem(no)||null}catch{return null}}async function F1(e){const n=mo();if(n!=null&&n.internalAccountSetToken)await n.internalAccountSetToken(e);else try{localStorage.setItem(no,e)}catch{}}async function ma(){const e=mo();e!=null&&e.internalAccountClearToken&&await e.internalAccountClearToken();try{localStorage.removeItem(no)}catch{}}function pu(){for(const e of R1)try{localStorage.removeItem(e),sessionStorage.removeItem(e)}catch(n){console.warn(`[InternalAccount] failed to clear password-change flag "${e}"`,n)}}async function ga(e,n){const r={providerType:"internal-imap",label:"内部邮箱",user:e.email,email:e.email,username:e.email,displayName:e.displayName||e.username,password:n,ownerUserId:e.id,ownerUsername:e.username,imapHost:ai,imapPort:Og,imapSecure:!0,smtpHost:ai,smtpPort:Wg,smtpSecure:!0,smtpStartTls:!1,webmailUrl:Ug,allowSelfSignedCerts:!0},i=mo();if(i!=null&&i.internalAccountApplyEmailConfig){const o=await i.internalAccountApplyEmailConfig(r);if(!o.ok)throw new Error(o.error??"邮箱配置写入失败")}else if(i!=null&&i.emailSaveAccount)await i.emailSaveAccount(r);else throw new Error("无法访问邮件配置接口")}const Zg=c.createContext(null);function B1({children:e}){const[n,r]=c.useState({phase:"restoring"});c.useEffect(()=>{var h,x,k,v;if(n.phase==="logged_in"||n.phase==="must_change_password"){const y=((h=n.session.user)==null?void 0:h.id)??null,j=n.session.token??null;El(y),zl(j),y&&((v=(x=mo())==null?void 0:x.activitySetIdentity)==null||v.call(x,{userId:y,username:(k=n.session.user)==null?void 0:k.username})),j&&n.phase==="logged_in"&&Pc(j)}else El(null),zl(null)},[n]);const i=c.useRef(null),o=c.useRef(null),s=c.useRef(!1),a=c.useCallback(()=>o.current,[]);c.useEffect(()=>{M1().then(h=>{if(!h){r({phase:"idle"});return}x1(h).then(x=>(pu(),r({phase:"logged_in",session:{token:h,user:x,bindingsPhase:"loading"}}),ua(h,x.id).then(k=>{r(v=>v.phase==="logged_in"?{phase:"logged_in",session:{...v.session,bindings:k,bindingsPhase:"success"}}:v)},k=>{const v=k instanceof Error?k.message:"服务绑定状态读取失败";r(y=>y.phase==="logged_in"?{phase:"logged_in",session:{...y.session,bindingsPhase:"error",bindingsError:v}}:y)}))).catch(()=>{ma().catch(()=>{}),r({phase:"idle"})})}).catch(()=>{r({phase:"idle"})})},[]),c.useEffect(()=>{const h=()=>{r(x=>x.phase!=="logged_in"?x:(i.current=null,o.current=null,ma().catch(()=>{}),{phase:"error",message:"登录已过期，请重新登录。"}))};return window.addEventListener("account:session-expired",h),()=>window.removeEventListener("account:session-expired",h)},[]);const d=c.useCallback(async(h,x)=>{if(s.current){console.warn("[InternalAccount] login already in progress — duplicate call suppressed");return}s.current=!0;const k=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;console.log(`[InternalAccount] login start requestId=${k} user=${h}`),r({phase:"loading"});try{const{token:v,user:y}=await h1(h,x);if(y.status==="disabled"){r({phase:"error",message:"该内部账号已被禁用，请联系管理员"});return}if(i.current=x,o.current=x,await F1(v),pu(),cv(y)){r({phase:"must_change_password",session:{token:v,user:y,bindingsPhase:"loading"}});return}r({phase:"logged_in",session:{token:v,user:y,bindingsPhase:"loading",emailAutoStatus:"applying"}}),(async()=>{try{await ga(y,x),r(j=>j.phase==="logged_in"?{phase:"logged_in",session:{...j.session,emailAutoStatus:"applied"}}:j)}catch(j){const S=j instanceof Error?j.message:"邮箱配置写入失败";r(z=>z.phase==="logged_in"?{phase:"logged_in",session:{...z.session,emailAutoStatus:"error",emailAutoError:S}}:z)}})(),ua(v,y.id).then(j=>{r(S=>S.phase==="logged_in"?{phase:"logged_in",session:{...S.session,bindings:j,bindingsPhase:"success"}}:S)},j=>{const S=j instanceof Error?j.message:"服务绑定状态读取失败";r(z=>z.phase==="logged_in"?{phase:"logged_in",session:{...z.session,bindingsPhase:"error",bindingsError:S}}:z)})}catch(v){const y=v instanceof Error?v.message:String(v);r({phase:"error",message:y})}finally{s.current=!1}},[]),u=c.useCallback(()=>{i.current=null,o.current=null,ma().catch(()=>{}),r({phase:"idle"})},[]),f=c.useCallback(async()=>{if(n.phase!=="logged_in")return;const{token:h,user:x}=n.session;r(k=>k.phase==="logged_in"?{phase:"logged_in",session:{...k.session,bindingsPhase:"loading",bindingsError:void 0}}:k);try{const k=await ua(h,x.id);r(v=>v.phase==="logged_in"?{phase:"logged_in",session:{...v.session,bindings:k,bindingsPhase:"success",bindingsError:void 0}}:v)}catch(k){const v=k instanceof Error?k.message:"服务绑定状态读取失败";throw r(y=>y.phase==="logged_in"?{phase:"logged_in",session:{...y.session,bindingsPhase:"error",bindingsError:v}}:y),k}},[n]),p=c.useCallback(async(h,x)=>{if(n.phase!=="logged_in"&&n.phase!=="must_change_password")throw new Error("未登录");await b1(n.session.token,h,x),i.current=x,r(k=>k.phase!=="logged_in"&&k.phase!=="must_change_password"?k:{phase:"logged_in",session:{...k.session,user:{...k.session.user,mustChangePassword:!1}}})},[n]),m=c.useCallback(()=>{r(h=>h.phase!=="must_change_password"?h:{phase:"logged_in",session:{...h.session,user:{...h.session.user,mustChangePassword:!1},emailAutoStatus:"applying"}}),setTimeout(()=>{const h=o.current;h&&r(x=>(x.phase!=="logged_in"||ga(x.session.user,h).then(()=>r(k=>k.phase==="logged_in"?{...k,session:{...k.session,emailAutoStatus:"applied"}}:k),()=>r(k=>k.phase==="logged_in"?{...k,session:{...k.session,emailAutoStatus:"error"}}:k)),x))},100)},[]),g=c.useCallback(async()=>{if(n.phase!=="logged_in")throw new Error("未登录");const h=o.current;if(!h)throw new Error("请重新登录内部账号以更新邮箱配置");const{user:x}=n.session;r(k=>k.phase==="logged_in"?{phase:"logged_in",session:{...k.session,emailAutoStatus:"applying"}}:k);try{await ga(x,h),r(k=>k.phase==="logged_in"?{phase:"logged_in",session:{...k.session,emailAutoStatus:"applied"}}:k)}catch(k){const v=k instanceof Error?k.message:"邮箱配置写入失败";throw r(y=>y.phase==="logged_in"?{phase:"logged_in",session:{...y.session,emailAutoStatus:"error",emailAutoError:v}}:y),k}},[n]);return t.jsx(Zg.Provider,{value:{state:n,login:d,logout:u,loadBindings:f,changePassword:p,completeForcePasswordChange:m,applyEmailConfig:g,getSessionPassword:a},children:e})}function rn(){const e=c.useContext(Zg);if(!e)throw new Error("useInternalAccount must be used within InternalAccountProvider");return e}function go(){const{state:e}=rn();return e.phase==="logged_in"||e.phase==="must_change_password"?e.session:null}function ha(e){return e.user||e.email||"local-account"}const cs="ai:mail-triage:v1",fu=600;function Gt(e){let n=5381;for(let r=0;r<e.length;r++)n=((n<<5)+n^e.charCodeAt(r))>>>0;return n.toString(16).padStart(8,"0")}function Bs(){try{const e=localStorage.getItem(cs);return e?JSON.parse(e):{}}catch{return{}}}function L1(e){try{const n=Object.entries(e);if(n.length>fu){n.sort((i,o)=>i[1].updatedAt.localeCompare(o[1].updatedAt));const r=Object.fromEntries(n.slice(n.length-fu));localStorage.setItem(cs,JSON.stringify(r))}else localStorage.setItem(cs,JSON.stringify(e))}catch{try{const n=Object.entries(Bs());n.sort((i,o)=>i[1].updatedAt.localeCompare(o[1].updatedAt));const r=Object.fromEntries(n.slice(Math.floor(n.length/2)));localStorage.setItem(cs,JSON.stringify(r))}catch{}}}function Qg(e,n){return`${e}:${n}`}function _o(e,n,r){const o=Bs()[Qg(e,n)];return!o||o.status!=="success"||o.bodyHash!==r?null:o}function N1(e){const n=Bs();n[Qg(e.accountId,e.messageId)]=e,L1(n)}function mu(e){const n=Bs(),r=`${e}:`,i={};for(const[o,s]of Object.entries(n))o.startsWith(r)&&(i[s.messageId]=s);return i}const Rl="ai:mail-draft:v2",gu=200;function Ac(){try{return JSON.parse(localStorage.getItem(Rl)??"{}")}catch{return{}}}function eh(e){try{const n=Object.keys(e);if(n.length>gu){const r=n.sort((o,s)=>{var u,f;const a=((u=e[o])==null?void 0:u.createdAt)??"",d=((f=e[s])==null?void 0:f.createdAt)??"";return a<d?-1:a>d?1:0}),i={};for(const o of r.slice(-gu))i[o]=e[o];localStorage.setItem(Rl,JSON.stringify(i))}else localStorage.setItem(Rl,JSON.stringify(e))}catch{}}function ro(e,n,r){const i=Ac()[`${e}:${n}:${r}`]??null;return!i||i.status==="discarded"?null:i}function hu(e,n,r){return ro(e,n,r)!==null}function xu(e){const n=Ac();n[`${e.accountId}:${e.messageId}:${e.bodyHash}`]=e,eh(n)}function th(e,n,r,i){const o=Ac(),s=`${e}:${n}:${r}`;o[s]&&(o[s]={...o[s],status:i,updatedAt:new Date().toISOString()},eh(o))}const Ml="ai:user-draft:v1",bu=200;function _c(){try{return JSON.parse(localStorage.getItem(Ml)??"{}")}catch{return{}}}function nh(e){try{const n=Object.keys(e);if(n.length>bu){const r=n.sort((o,s)=>{var u,f;const a=((u=e[o])==null?void 0:u.updatedAt)??"",d=((f=e[s])==null?void 0:f.updatedAt)??"";return a<d?-1:a>d?1:0}),i={};for(const o of r.slice(-bu))i[o]=e[o];localStorage.setItem(Ml,JSON.stringify(i))}else localStorage.setItem(Ml,JSON.stringify(e))}catch{}}function Ec(e,n,r){return`${e}:${n}:${r}`}function O1(e,n,r){const i=_c()[Ec(e,n,r)]??null;return!i||i.status==="sent"||i.status==="discarded"?null:i}function W1(e){const n=_c();n[Ec(e.accountId,e.messageId,e.bodyHash)]=e,nh(n)}function U1(e,n,r,i){const o=_c(),s=Ec(e,n,r);o[s]&&(o[s]={...o[s],status:i,updatedAt:new Date().toISOString()},nh(o))}const dn=()=>new Date().toISOString();function rh(e){return{responderName:String(e.toName||"").trim()||"当前用户",responderAddress:String(e.to||"").trim()||"current-user@example.com",counterpartyName:String(e.fromName||"").trim()||"对方",counterpartyAddress:String(e.from||"").trim()||"unknown@example.com"}}function H1(e){const n=e.trim();return n?/^re:/i.test(n)?n:`Re: ${n}`:"Re: （无主题）"}function K1(e,n){const r=String(e||"").replace(/\r/g,"").replace(/\n{3,}/g,`

`).trim();return r.length<=n?r:`${r.slice(0,n).trim()}…`}function G1(e){const n=(e??[]).map(i=>({...i,text:K1(i.text,900)})).filter(i=>i.text).slice(0,8);return n.length===0?"":`以下是用户选择的知识库中检索到的相关内容，请只在相关时使用：

${n.map((i,o)=>{const s=[i.knowledgeName,i.sourceTitle].filter(Boolean).join(" / ")||"用户选择的知识库";return`[知识库片段 ${o+1}]
来源：${s}
内容：${i.text}`}).join(`

`)}

知识库使用要求：
1. 只能基于邮件正文和知识库片段回答。
2. 不要编造知识库没有的信息。
3. 如果知识库内容与邮件无关，不要强行使用。
4. 如果需要引用流程、政策、材料、时间安排、联系人等，请优先使用知识库内容。
5. 回复应自然、简洁、可直接发送。
6. 回复正文不要出现“知识库片段”“检索结果”“系统提供的上下文”等内部过程表述。`}function q1(e){const n=e==null?void 0:e.triageContext;if(!n)return"";const r=[n.summary?`摘要：${n.summary}`:"",n.category?`分类：${n.category}`:"",n.actionType?`处理类型：${n.actionType}`:"",n.reason?`判断依据：${n.reason}`:"",n.suggestedAction?`建议动作：${n.suggestedAction}`:"",n.timeIntentTitle?`日程事项：${n.timeIntentTitle}`:"",n.timeIntentSourceText?`日程来源文本：${n.timeIntentSourceText}`:""].filter(Boolean);return r.length?`AI 邮件分析结果：
${r.join(`
`)}`:""}function V1(e){const n=e==null?void 0:e.calendarContext;if(!(n!=null&&n.hasTimeRequirement))return"";const r=(n.candidateTimes??[]).slice(0,6).map(i=>`- ${i.startTime}${i.endTime?` 至 ${i.endTime}`:""}${i.hasConflict?"（有冲突）":"（无冲突）"}`);return["日历检查事实（优先级高于知识库补充信息）：",n.intentType?`类型：${n.intentType}`:"",n.title?`事项：${n.title}`:"",n.startTime?`开始时间：${n.startTime}`:"",n.endTime?`结束时间：${n.endTime}`:"",n.deadlineTime?`截止时间：${n.deadlineTime}`:"",n.location?`地点：${n.location}`:"",n.recommendedTime?`推荐回复时间：${n.recommendedTime}`:"",`冲突状态：${n.hasConflict?`有冲突（${n.conflictCount??1} 个）`:"无冲突"}`,r.length?`候选时间：
${r.join(`
`)}`:"","回复必须遵守：日历冲突事实 > 邮件原文要求 > 知识库补充信息 > 通用礼貌表达。若存在冲突，不能确认参加或承诺该时间可用，也不要暴露具体冲突日程标题。"].filter(Boolean).join(`
`)}async function Y1(e,n,r,i){var g;const o=rh(e),s=G1(i==null?void 0:i.knowledgeSnippets),a=q1(i),d=V1(i),u=[a,d,s].filter(Boolean),f=u.length?`

Additional context for this reply:
${u.join(`

`)}`:"",p=`You are a professional email reply expert. Write a well-crafted reply email from the perspective of the recipient.

Requirements:
1. Output the reply body directly — do NOT include a subject line.
2. You are replying on behalf of "${o.responderName} (${o.responderAddress})" to "${o.counterpartyName} (${o.counterpartyAddress})".
3. Automatically determine the appropriate tone and structure based on the email type — do NOT ask the user to choose:
   - Task: confirm todos and deadlines
   - Request: respond to each item
   - Inquiry: answer step by step; if no clear basis, state "pending further confirmation"
   - Notification: brief acknowledgment only if a reply is needed
   - Attachment review: state the attachment handling plan
   - Approval: be formal and cautious; flag items requiring manual confirmation
4. If the email involves policy, procedures, deadlines, or approval criteria not clearly stated in the body, do NOT fabricate facts — state "pending further confirmation".
5. When knowledge snippets are provided, use them only when relevant; do not fabricate information absent from both the email and snippets.
6. If calendar facts are provided, follow them strictly and prioritize conflict facts over any supplemental information.
7. Keep the current email's language style and make the reply natural rather than a mechanical list of references.
8. Sign with "${o.responderName}" at the end of the Chinese section.
9. IMPORTANT — You MUST generate the reply in bilingual format. Use EXACTLY these two section headings with no variation:

English:

<English reply body here>

中文：

<Chinese reply body here>

The English version must appear first. The Chinese version must follow. Do NOT omit either section. The Chinese version should be a natural, formal Chinese expression of the same content — not a word-for-word translation.

Received email:
From: ${o.counterpartyName} (${o.counterpartyAddress})
To: ${o.responderName} (${o.responderAddress})
Subject: ${e.subject}
Body:
${e.body}${f}`;(g=i==null?void 0:i.onPromptBuilt)==null||g.call(i,{knowledgeContextLength:s.length,promptHasKnowledgeContext:p.includes("以下是用户选择的知识库中检索到的相关内容"),promptHasKnowledgeRequirement:p.includes("When knowledge snippets are provided")});let m=!1;try{let h="";if(await pi({instruction:p,language:"zh"},{onDelta:(x,k)=>{n.onDelta(k)},onComplete:({text:x})=>{h=x.trim()},onError:x=>{console.warn("[EmailContext] LLM generation failed, using local fallback:",x),m=!0}},r),!m&&h){n.onComplete(h);return}m=!0}catch{m=!0}if(m){const h=`English:

Dear ${o.counterpartyName},

Thank you for your email regarding "${e.subject||"related matters"}". I have carefully reviewed your message and will address the relevant matters as soon as possible.

Please feel free to contact me if you need anything further.

Best regards,
${o.responderName}

中文：

${o.counterpartyName}您好：

感谢您的来信。关于“${e.subject||"相关事项"}”，我已仔细阅读您的邮件内容，会尽快处理相关事宜。

如有需要进一步讨论的问题，请随时与我联系。

祝好！
${o.responderName}`;await new Promise(x=>{let k=0;const v=()=>{if(r!=null&&r.aborted){n.onError("已取消"),x();return}k+=Math.floor(Math.random()*6)+4,k>=h.length?(n.onDelta(h),n.onComplete(h),x()):(n.onDelta(h.slice(0,k)),setTimeout(v,25))};setTimeout(v,300)})}}const ih=c.createContext(null);function zc(){const e=c.useContext(ih);if(!e)throw new Error("useEmail must be used inside EmailProvider");return e}function J1({children:e}){var ye,Ee;const{state:n}=rn(),[r,i]=c.useState([]),[o,s]=c.useState(null),[a,d]=c.useState({}),[u,f]=c.useState([]),[p,m]=c.useState([]),[g,h]=c.useState([]),[x,k]=c.useState(""),[v,y]=c.useState(null),[j,S]=c.useState(!1),[z,P]=c.useState(null),I=c.useRef(null),b=c.useRef(null),$=c.useRef(null);c.useEffect(()=>{var G;(G=window.electronAPI)!=null&&G.emailGetAccount&&window.electronAPI.emailGetAccount().then(F=>{y(F),F&&te(F)}).catch(()=>{})},[]),c.useEffect(()=>{(n.phase==="idle"||n.phase==="error")&&(i([]),m([]),h([]),s(null),d({}),f([]),y(null),P(null))},[n.phase]);const O=n.phase==="logged_in"?n.session.emailAutoStatus:void 0,D=n.phase==="logged_in"?(ye=n.session.user)==null?void 0:ye.id:void 0,R=n.phase==="logged_in"?(Ee=n.session.user)==null?void 0:Ee.email:void 0;c.useEffect(()=>{var G;O==="applied"&&(G=window.electronAPI)!=null&&G.emailGetAccount&&window.electronAPI.emailGetAccount().then(F=>{if(!F)return;const se=F.email||F.user||"";if(R&&se&&se!==R){console.debug("[Email] Config email mismatch — skipping stale config:",se,"≠",R);return}if(F.ownerUserId&&D&&F.ownerUserId!==D){console.debug("[Email] Config ownerUserId mismatch — skipping stale config:",F.ownerUserId,"≠",D);return}i([]),m([]),h([]),s(null),y(F),te(F)}).catch(()=>{})},[O]);const V=!!v,te=c.useCallback(async G=>{S(!0),P(null);try{const F=await window.electronAPI.emailFetchInbox(),_e=Array.isArray(F)?F:F.ok?F.mails:(()=>{throw new Error(F.error.message)})();i(_e)}catch(F){P(F instanceof Error?F.message:String(F))}finally{S(!1)}},[]),q=c.useCallback(()=>{v&&te(v)},[v,te]);c.useEffect(()=>{if(!o||!v)return;const G=a[o];if(!G||!G.userEdited||G.status==="sent"||G.status==="sending")return;const F=r.find(oe=>oe.id===o);if(!F)return;const se=ha(v),_e=Gt(F.body),de=G.content;return $.current&&clearTimeout($.current),$.current=setTimeout(()=>{W1({accountId:se,messageId:o,bodyHash:_e,replyBody:de,status:"editing",createdAt:G.generatedAt??new Date().toISOString(),updatedAt:new Date().toISOString()})},800),()=>{$.current&&clearTimeout($.current)}},[a,o,r,v]);const W=c.useCallback(async()=>{var G;if((G=window.electronAPI)!=null&&G.emailFetchSent)try{const F=await window.electronAPI.emailFetchSent(),se=Array.isArray(F)?F:F!=null&&F.ok?F.mails:[];m(se)}catch{m([])}},[]),fe=c.useCallback(async()=>{var G;if((G=window.electronAPI)!=null&&G.emailFetchTrash)try{const F=await window.electronAPI.emailFetchTrash(),se=Array.isArray(F)?F:F!=null&&F.ok?F.mails:[];h(se)}catch{h([])}},[]),le=c.useCallback(async(G,F)=>{var se,_e;if((se=window.electronAPI)!=null&&se.emailDeleteMessage){const de=await window.electronAPI.emailDeleteMessage({mailId:G,folder:F==="trash"?"inbox":F});if(de&&typeof de=="object"&&"ok"in de&&!de.ok){const oe=de;throw new Error(((_e=oe.error)==null?void 0:_e.message)||"删除邮件失败")}}if(F==="inbox"){const de=r.find(oe=>oe.id===G);de&&h(oe=>[{...de,folder:"trash"},...oe]),i(oe=>oe.filter(Te=>Te.id!==G))}else m(de=>de.filter(oe=>oe.id!==G))},[r]),Q=c.useCallback(async G=>{var se,_e;if((se=window.electronAPI)!=null&&se.emailRestoreMessage){const de=await window.electronAPI.emailRestoreMessage({mailId:G,folder:"trash"});if(de&&typeof de=="object"&&"ok"in de&&!de.ok){const oe=de;throw new Error(((_e=oe.error)==null?void 0:_e.message)||"恢复邮件失败")}}const F=g.find(de=>de.id===G);F&&i(de=>[{...F,folder:"inbox"},...de]),h(de=>de.filter(oe=>oe.id!==G))},[g]),ge=c.useCallback(async G=>{var E,K;if(!v)throw new Error("请先登录内部账号并连接邮箱");const F=v.email||v.user||"",se=v.displayName||F,_e=G.to.join(", "),de=(G.cc??[]).join(", "),oe=(G.bcc??[]).join(", "),Te={from:F,fromName:se,to:_e,subject:G.subject,body:G.body};de&&(Te.cc=de),oe&&(Te.bcc=oe),(E=G.attachments)!=null&&E.length&&(Te.attachments=G.attachments.map(_=>({filename:_.fileName,path:_.filePath})));const C=await window.electronAPI.emailSend(Te);if(C&&typeof C=="object"&&"ok"in C&&!C.ok){const _=C;throw new Error(((K=_.error)==null?void 0:K.message)||"邮件发送失败")}C&&typeof C=="object"&&"appendWarning"in C&&C.appendWarning&&console.warn("[Email] sendBlank append warning:",C.appendWarning),D&&co(async()=>{const{logActivity:_}=await Promise.resolve().then(()=>uu);return{logActivity:_}},void 0).then(({logActivity:_})=>{_(D,"mail","send_mail",{title:G.subject,summary:`发送了邮件：${G.subject}`})}),W().catch(()=>{})},[v,W,D]),J=c.useCallback(async G=>{await window.electronAPI.emailSaveAccount(G),y(G),te(G)},[te]),H=c.useCallback(async()=>{await window.electronAPI.emailClearAccount(),y(null),i([])},[]),T=c.useCallback(G=>{s(G),G&&(i(F=>F.map(se=>se.id===G&&se.unread?{...se,unread:!1}:se)),d(F=>{var C,E;if(((C=F[G])==null?void 0:C.status)!==void 0&&((E=F[G])==null?void 0:E.status)!=="not_generated")return F;const se=r.find(K=>K.id===G);if(!se||!v)return F;const _e=ha(v),de=Gt(se.body),oe=O1(_e,G,de);if(oe)return{...F,[G]:{mailId:G,content:oe.replyBody,status:"edited",dirty:!1,userEdited:!0,attachments:[],generatedAt:oe.createdAt,updatedAt:oe.updatedAt}};const Te=ro(_e,G,de);return Te?{...F,[G]:{mailId:G,content:Te.draftBody,status:"generated",dirty:!1,userEdited:!1,attachments:[],generatedAt:Te.createdAt,updatedAt:new Date().toISOString()}}:F}))},[r,v]),w=c.useCallback((G,F,se)=>{var de;(de=I.current)==null||de.abort();const _e=new AbortController;I.current=_e,b.current=G,d(oe=>({...oe,[G]:{...oe[G],mailId:G,content:"",status:"generating",dirty:!1,userEdited:!1,errorMessage:void 0}})),k(""),Y1(F,{onDelta:oe=>{_e.signal.aborted||k(oe)},onComplete:oe=>{if(_e.signal.aborted)return;b.current=null,k("");const Te=`

本条回复由 AI 自动生成`;d(C=>({...C,[G]:{...C[G],content:oe+Te,status:"generated",dirty:!1,userEdited:!1,generatedAt:dn(),updatedAt:dn()}}))},onError:oe=>{_e.signal.aborted||(b.current=null,k(""),d(Te=>({...Te,[G]:{...Te[G],status:"error",errorMessage:oe,updatedAt:dn()}})))}},_e.signal,se)},[]),L=c.useCallback(G=>{if(!o)return;const F=r.find(se=>se.id===o);F&&b.current!==o&&w(o,F,G)},[o,r,w]),N=o?a[o]??null:null,M=c.useCallback(G=>{o&&d(F=>{const se=F[o];return se?{...F,[o]:{...se,content:G,status:se.status==="generated"||se.status==="saved"?"edited":se.status,dirty:!0,userEdited:!0,updatedAt:dn()}}:{...F,[o]:{mailId:o,content:G,status:"edited",dirty:!0,userEdited:!0,attachments:[],updatedAt:dn()}}})},[o]),A=c.useCallback(()=>{o&&d(G=>{const F=G[o];return F?{...G,[o]:{...F,status:"saved",dirty:!1,savedAt:dn(),updatedAt:dn()}}:G})},[o]),ee=c.useCallback(G=>{o&&d(F=>{const se=F[o],_e=(se==null?void 0:se.attachments)??[];if(_e.some(oe=>oe.path===G.path))return F;const de=se??{mailId:o,content:"",status:"edited",dirty:!0,userEdited:!1,attachments:[]};return{...F,[o]:{...de,attachments:[..._e,G],dirty:!0,updatedAt:dn()}}})},[o]),me=c.useCallback(G=>{o&&d(F=>{const se=F[o];return se?{...F,[o]:{...se,attachments:(se.attachments??[]).filter(_e=>_e.path!==G),dirty:!0,updatedAt:dn()}}:F})},[o]),Ie=!!(N&&N.userEdited&&N.status!=="sent"),Fe=c.useCallback((G=!1,F)=>{if(!o)return;const se=r.find(_e=>_e.id===o);se&&(!G&&Ie||w(o,se,F))},[o,r,Ie,w]),Z=c.useCallback(()=>{var Te;if(!o)return;const G=a[o];if(!G||!G.content.trim())return;const F=r.find(C=>C.id===o);if(!F)return;const se=rh(F),_e=H1(F.subject);d(C=>({...C,[o]:{...C[o],status:"sending",dirty:!1,updatedAt:dn()}}));const de=C=>{if(d(E=>({...E,[o]:{...E[o],status:"sent",dirty:!1,updatedAt:C}})),i(E=>E.map(K=>K.id===o?{...K,replied:!0}:K)),f(E=>[{id:lu(),sourceMailId:F.id,to:F.from,toName:F.fromName,subject:_e,body:G.content,timestamp:C},...E]),v){const E=ha(v),K=Gt(F.body);U1(E,o,K,"sent"),th(E,o,K,"sent")}},oe=C=>{d(E=>({...E,[o]:{...E[o],status:"error",errorMessage:C,updatedAt:dn()}}))};V?window.electronAPI.emailSend({from:se.responderAddress,fromName:se.responderName,to:se.counterpartyAddress,subject:_e,body:G.content,attachments:(Te=G.attachments)==null?void 0:Te.map(C=>({filename:C.filename,path:C.path})),inReplyTo:F.messageId,references:F.messageId}).then(C=>{var _;if(C&&typeof C=="object"&&"ok"in C&&!C.ok)throw new Error(((_=C.error)==null?void 0:_.message)||"发送失败");const E=dn();de(E),W().catch(()=>{});const K=C&&typeof C=="object"&&"appendWarning"in C?C.appendWarning:void 0;K&&console.warn("[Email] sendReply append warning:",K),D&&co(async()=>{const{logActivity:Y}=await Promise.resolve().then(()=>uu);return{logActivity:Y}},void 0).then(({logActivity:Y})=>{var ae,je;Y(D,"mail","send_reply",{title:_e,summary:`发送邮件回复：${_e}`,metadata:{sourceMailId:o,hasAttachments:!!((ae=G.attachments)!=null&&ae.length),attachmentCount:((je=G.attachments)==null?void 0:je.length)??0}})})}).catch(C=>{oe(C instanceof Error?C.message:String(C))}):setTimeout(()=>{const C=dn();de(C),i(E=>[{id:lu(),from:se.responderAddress,fromName:se.responderName,to:se.counterpartyAddress,toName:se.counterpartyName,subject:_e,body:G.content,timestamp:C,unread:!0,replied:!1,threadId:F.threadId??F.id,isLoopback:!0},...E])},800)},[o,a,r,V,W,D]),X=c.useMemo(()=>({mails:r,selectedMailId:o,selectMail:T,currentDraft:N,generateDraft:L,updateDraftContent:M,saveDraft:A,regenerateDraft:Fe,sendReply:Z,addReplyAttachment:ee,removeReplyAttachment:me,needsRegenerateConfirm:Ie,sentRecords:u,sentMails:p,fetchSentMails:W,trashMails:g,fetchTrashMails:fe,deleteMail:le,restoreMail:Q,sendBlank:ge,streamingPreview:x,accountConfig:v,isRealMode:V,isFetchingMails:j,fetchError:z,saveAccount:J,clearAccount:H,refreshMails:q}),[r,o,T,N,L,M,A,Fe,Z,ee,me,Ie,u,p,W,g,fe,le,Q,ge,x,v,V,j,z,J,H,q]);return t.jsx(ih.Provider,{value:X,children:e})}function X1(e){return`bulk-${e.id||e.email}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}function Z1(e){var i;const n=(i=e.suggestedSubject)==null?void 0:i.trim();if(n)return n;const r=e.objective.trim();return r.length>28?`${r.slice(0,28)}...`:r||"群发邮件"}function Q1(e,n){const r=n.name||n.email,i=e.senderName||"用户";return`${r}您好：

${e.objective.trim()||"现向您同步相关事项，请您查收。"}

如有问题，欢迎随时与我联系。

祝好！
${i}`}function eS(e){var o,s;const n=Ur(e).trim();if(!n)return null;const i=((o=n.match(/```(?:json)?\s*([\s\S]*?)\s*```/i))==null?void 0:o[1])||((s=n.match(/\{[\s\S]*\}/))==null?void 0:s[0])||n;try{const a=JSON.parse(i);return a&&typeof a=="object"?a:null}catch{return null}}function tS(e,n){var s,a;const r=e.senderName||e.senderEmail?`Sender: ${e.senderName||""}${e.senderEmail?` <${e.senderEmail}>`:""}`:"Sender: current user",i=(s=e.suggestedSubject)!=null&&s.trim()?`The user-provided subject is: ${e.suggestedSubject.trim()}`:"Suggest a concise subject.",o=(a=e.workspaceContext)!=null&&a.trim()?`Workspace context:
${e.workspaceContext.trim()}`:"";return`You are helping a user prepare a personalized bulk email draft. Generate exactly one email draft for the recipient below.

Important rules:
1. Do NOT send the email.
2. Personalize the body using the recipient's name, department, and position when useful.
3. Keep the tone professional, concise, and appropriate for an internal formal email.
4. Do not invent facts, dates, commitments, or policies that are not present in the user's objective.
5. Return strict JSON only, with exactly these keys: "subject" and "body".

Bulk email objective:
${e.objective.trim()}

${i}
${r}

Recipient:
- Name: ${n.name||n.email}
- Email: ${n.email}
- Department: ${n.department||"N/A"}
- Position: ${n.position||"N/A"}

${o}

JSON response format:
{"subject":"...","body":"..."}`}async function nS(e,n){var i,o,s,a;const r={id:X1(n),recipient:n,subject:Z1(e),body:Q1(e,n),status:"draft"};if(!((i=window.electronAPI)!=null&&i.writingAssistant))return r;try{const d=await window.electronAPI.writingAssistant({instruction:tS(e,n),language:"zh"}),u=eS(d),f=((o=e.suggestedSubject)==null?void 0:o.trim())||((s=u==null?void 0:u.subject)==null?void 0:s.trim())||r.subject,p=((a=u==null?void 0:u.body)==null?void 0:a.trim())||Ur(d).trim()||r.body;return{...r,subject:f,body:p,status:"draft"}}catch(d){return{...r,status:"failed",error:d instanceof Error?d.message:String(d)}}}async function rS(e){const n=e.objective.trim();if(!n)throw new Error("请输入群发目标");if(e.recipients.length===0)throw new Error("请至少添加一个群发收件人");const r=[];for(const i of e.recipients)r.push(await nS({...e,objective:n},i));return r}const iS=25*1024*1024,zi=50*1024*1024,oh=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,oS=l.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 25, 40, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
`,sS=l.div`
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 48px rgba(15, 25, 40, 0.18);
  width: 640px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
`,aS=l.div`
  padding: 16px 20px 14px;
  border-bottom: 1px solid #eaeff5;
  display: flex;
  align-items: center;
  justify-content: space-between;
`,lS=l.h2`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
`,cS=l.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`,dS=l.div`
  display: inline-flex;
  padding: 3px;
  border-radius: 9px;
  background: #eef3f8;
  gap: 3px;
`,yu=l.button`
  border: none;
  border-radius: 7px;
  padding: 5px 12px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  color: ${e=>e.$active?"#174ea6":"#718096"};
  background: ${e=>e.$active?"#ffffff":"transparent"};
  box-shadow: ${e=>e.$active?"0 1px 4px rgba(15, 25, 40, 0.12)":"none"};
`,uS=l.button`
  width: 28px;
  height: 28px;
  border: none;
  background: #f0f4f8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  color: #627385;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #e2e8f0; }
`,pS=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`,Eo=l.div`
  display: flex;
  align-items: flex-start;
  min-height: 38px;
  border-bottom: 1px solid #eaeff5;
  padding: 6px 14px 6px 16px;
  gap: 8px;
`,zo=l.label`
  flex-shrink: 0;
  width: 44px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #718096;
  padding-top: 8px;
`,Do=l.div`
  flex: 1;
  min-width: 0;
`,vu=l.button`
  flex-shrink: 0;
  border: none;
  background: none;
  font-size: var(--font-size-xs);
  color: #718096;
  cursor: pointer;
  padding: 8px 0 0;
  &:hover { color: #2d3748; }
`,fS=l.div`
  padding: 10px 16px;
  border-bottom: 1px solid #eaeff5;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fbfdff;
`,mS=l.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`,wu=l.button`
  border: 1px solid ${e=>e.$active?"#90cdf4":"#dde4ec"};
  background: ${e=>e.$active?"#ebf8ff":"#ffffff"};
  color: ${e=>e.$active?"#1a5fb4":"#4a5f73"};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
`,Su=l.div`
  font-size: var(--font-size-xs);
  color: #718096;
  line-height: 1.5;
`,ku=l.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`,gS=l.select`
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: var(--font-size-xs);
  color: #2d3748;
  background: #ffffff;
`,ju=l.button`
  border: 1px solid #b7d6f5;
  border-radius: 8px;
  background: #ebf3fd;
  color: #2b6cb0;
  padding: 6px 10px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) { background: #d9ebff; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,hS=l.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 4px 0;
  cursor: text;
  position: relative;
`,xS=l.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${e=>e.$status==="not_created"?"#fff8e6":e.$status==="failed"||e.$status==="disabled"?"#fde8e8":"#e8f0fe"};
  border: 1px solid ${e=>e.$status==="not_created"?"#f5c842":e.$status==="failed"||e.$status==="disabled"?"#f7b2b2":"#c5d8fc"};
  border-radius: 100px;
  padding: 2px 8px 2px 10px;
  font-size: var(--font-size-xs);
  color: ${e=>e.$status==="not_created"?"#856404":e.$status==="failed"||e.$status==="disabled"?"#721c24":"#1a56c4"};
  max-width: 280px;
`,bS=l.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,yS=l.button`
  width: 14px;
  height: 14px;
  border: none;
  background: none;
  color: #4a72c4;
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { color: #c53030; }
`,vS=l.input`
  border: none;
  outline: none;
  font-size: var(--font-size-sm);
  color: #2d3748;
  min-width: 120px;
  flex: 1;
  background: transparent;
  padding: 4px 0;
  &::placeholder { color: #b0bec5; }
`,wS=l.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 340px;
  max-height: 240px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #dde4ec;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(15, 25, 40, 0.12);
  z-index: 200;
`,SS=l.div`
  padding: 8px 12px;
  cursor: pointer;
  background: ${e=>e.$focused?"#eaf2fb":"transparent"};
  border-bottom: 1px solid #f0f4f8;
  &:last-child { border-bottom: none; }
  &:hover { background: #eaf2fb; }
`,kS=l.div`
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #1a202c;
`,jS=l.div`
  font-size: var(--font-size-xs);
  color: #718096;
  margin-top: 1px;
`,Iu=l.div`
  padding: 12px;
  font-size: var(--font-size-xs);
  color: #9faebd;
  text-align: center;
`,IS=l.input`
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1a202c;
  padding: 8px 0;
  background: transparent;
  &::placeholder { color: #b0bec5; }
  box-sizing: border-box;
`,$S=l.textarea`
  width: 100%;
  min-height: 180px;
  border: none;
  outline: none;
  font-size: var(--font-size-sm);
  color: #2d3748;
  line-height: 1.7;
  resize: vertical;
  padding: 12px 0 0;
  background: transparent;
  box-sizing: border-box;
  &::placeholder { color: #b0bec5; }
`,TS=l.div`
  padding: 4px 14px 12px 16px;
`,CS=l.div`
  border-top: 1px solid #eaeff5;
  padding: 12px 16px;
  background: #f8fbff;
`,PS=l.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: var(--font-size-xs);
  color: #4a5f73;
  font-weight: 700;
`,AS=l.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`,_S=l.div`
  border: 1px solid #dde4ec;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px;
`,ES=l.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: var(--font-size-xs);
  color: #718096;
`,zS=l.span`
  font-weight: 700;
  color: ${e=>e.$status==="sent"?"#2f855a":e.$status==="failed"?"#c53030":e.$status==="sending"?"#2b6cb0":"#718096"};
`,DS=l.input`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dde4ec;
  border-radius: 8px;
  padding: 7px 9px;
  font-size: var(--font-size-xs);
  color: #1a202c;
  margin-bottom: 8px;
`,RS=l.textarea`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dde4ec;
  border-radius: 8px;
  padding: 8px 9px;
  min-height: 120px;
  resize: vertical;
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: #2d3748;
`,MS=l.div`
  padding: 10px 16px;
  border-top: 1px solid #eaeff5;
`,FS=l.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px dashed #b0bec5;
  border-radius: 8px;
  background: #f8fbff;
  color: #4a6180;
  font-size: var(--font-size-xs);
  padding: 6px 12px;
  cursor: pointer;
  &:hover { background: #eaf2fb; border-color: #7ab0e0; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,BS=l.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`,LS=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f4f7fa;
  border: 1px solid #dde4ec;
  border-radius: 8px;
  padding: 6px 10px;
`,NS=l.span`
  font-size: 16px;
  flex-shrink: 0;
`,OS=l.span`
  flex: 1;
  font-size: var(--font-size-xs);
  color: #1a202c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,WS=l.span`
  font-size: var(--font-size-xs);
  color: #9faebd;
  flex-shrink: 0;
`,US=l.button`
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: #9faebd;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  &:hover { background: #fce8e8; color: #c53030; }
`,HS=l.div`
  padding: 12px 16px;
  border-top: 1px solid #eaeff5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`,KS=l.div`
  flex: 1;
  font-size: var(--font-size-xs);
  color: #e53e3e;
  min-width: 0;
`,GS=l.div`
  display: flex;
  gap: 8px;
`,qS=l.button`
  border: 1px solid #dde4ec;
  background: #fff;
  color: #4a5f73;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: var(--font-size-sm);
  cursor: pointer;
  &:hover { background: #f4f7fa; }
`,VS=l.button`
  border: none;
  background: linear-gradient(135deg, #1a6fd4, #1558b8);
  color: #fff;
  border-radius: 8px;
  padding: 8px 22px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;function $u(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function YS(e,n){var i;const r=((i=n.split(".").pop())==null?void 0:i.toLowerCase())??"";return e.startsWith("image/")?"🖼️":r==="pdf"?"📕":r==="docx"||r==="doc"?"📝":r==="xlsx"||r==="xls"?"📊":r==="pptx"||r==="ppt"?"📋":r==="zip"?"🗜️":"📄"}function JS(e){return e.displayName?`${e.displayName} <${e.email}>`:e.email}function XS({status:e}){return!e||e==="active"?null:e==="not_created"?t.jsx("span",{style:{marginLeft:6,fontSize:10,color:"#856404",background:"#fff3cd",padding:"1px 5px",borderRadius:4,fontWeight:700},children:"邮箱未创建"}):e==="failed"?t.jsx("span",{style:{marginLeft:6,fontSize:10,color:"#721c24",background:"#f8d7da",padding:"1px 5px",borderRadius:4,fontWeight:700},children:"创建失败"}):e==="disabled"?t.jsx("span",{style:{marginLeft:6,fontSize:10,color:"#721c24",background:"#f8d7da",padding:"1px 5px",borderRadius:4,fontWeight:700},children:"已禁用"}):null}function Br(e){return!!e.aiEmail&&e.mailboxStatus==="active"}function ds(e){return e==="not_created"?"AI 邮箱尚未创建":e==="failed"?"AI 邮箱创建失败":e==="disabled"?"AI 邮箱已禁用":"AI 邮箱状态未知"}function ZS(e){return e==="ready"?"已编辑":e==="sending"?"发送中":e==="sent"?"已发送":e==="failed"?"失败":"草稿"}function xa({recipients:e,onAdd:n,onRemove:r,contacts:i,contactsError:o,placeholder:s="输入姓名或邮箱",autoFocus:a}){const[d,u]=c.useState(""),[f,p]=c.useState(!1),[m,g]=c.useState(-1),[h,x]=c.useState(null),k=c.useRef(null),v=c.useRef(null),y=new Set(e.map(b=>b.email.toLowerCase())),j=d.trim()?i.filter(b=>{if(y.has(b.aiEmail.toLowerCase()))return!1;const $=d.toLowerCase();return b.aiEmail.toLowerCase().includes($)||b.name.toLowerCase().includes($)||(b.enName??"").toLowerCase().includes($)||(b.employeeId??"").toLowerCase().includes($)||(b.department??"").toLowerCase().includes($)||(b.position??"").toLowerCase().includes($)||(b.sourceEmail??"").toLowerCase().includes($)}).slice(0,12):[],S=c.useCallback(b=>{const $=b.split(/[,;]+/).map(D=>D.trim()).filter(Boolean);let O=!1;for(const D of $){if(!oh.test(D)){x(`"${D}" 邮箱格式不正确`),O=!0;continue}const R=i.find(V=>V.aiEmail.toLowerCase()===D.toLowerCase());if(R&&!Br(R)){x(ds(R.mailboxStatus)+`（${R.name||D}）`),O=!0;continue}y.has(D.toLowerCase())||n({email:D,displayName:R==null?void 0:R.name,personId:R==null?void 0:R.personId,department:R==null?void 0:R.department,position:R==null?void 0:R.position,mailboxStatus:R==null?void 0:R.mailboxStatus,fromDirectory:!!R})}O||x(null),u(""),p(!1)},[n,y,i]),z=c.useCallback(b=>{var $;if(!Br(b)){x(ds(b.mailboxStatus)+`（${b.name||b.aiEmail}）`);return}y.has(b.aiEmail.toLowerCase())||n({email:b.aiEmail,displayName:b.name,personId:b.personId,department:b.department,position:b.position,mailboxStatus:b.mailboxStatus,fromDirectory:!0}),u(""),p(!1),g(-1),($=k.current)==null||$.focus()},[n,y]),P=c.useCallback(b=>{b.key==="Enter"||b.key===" "||b.key===","?(b.preventDefault(),m>=0&&j[m]?z(j[m]):d.trim()&&S(d.trim())):b.key==="Tab"?d.trim()&&(b.preventDefault(),m>=0&&j[m]?z(j[m]):S(d.trim())):b.key==="ArrowDown"?(b.preventDefault(),g($=>Math.min($+1,j.length-1))):b.key==="ArrowUp"?(b.preventDefault(),g($=>Math.max($-1,-1))):b.key==="Backspace"&&!d&&e.length>0?r(e[e.length-1].email):b.key==="Escape"&&(p(!1),g(-1))},[d,j,m,z,S,e,r]),I=c.useCallback(b=>{const $=b.clipboardData.getData("text");($.includes(",")||$.includes(";")||$.includes(`
`))&&(b.preventDefault(),S($.replace(/\n/g,",")))},[S]);return c.useEffect(()=>{const b=$=>{v.current&&!v.current.contains($.target)&&p(!1)};return document.addEventListener("mousedown",b),()=>document.removeEventListener("mousedown",b)},[]),t.jsxs(hS,{ref:v,onClick:()=>{var b;return(b=k.current)==null?void 0:b.focus()},children:[e.map(b=>t.jsxs(xS,{title:b.email,$status:b.fromDirectory?b.mailboxStatus:void 0,children:[t.jsxs(bS,{children:[JS(b),b.fromDirectory&&b.mailboxStatus&&b.mailboxStatus!=="active"&&t.jsx("span",{style:{marginLeft:4,opacity:.8},children:"⚠"})]}),t.jsx(yS,{type:"button",onClick:$=>{$.stopPropagation(),r(b.email)},title:`移除 ${b.email}`,children:"×"})]},b.email)),t.jsx(vS,{ref:k,autoFocus:a,value:d,placeholder:e.length===0?s:"",onChange:b=>{u(b.target.value),p(!0),g(-1),x(null)},onFocus:()=>{(d||i.length>0)&&p(!0)},onKeyDown:P,onPaste:I,onBlur:()=>{setTimeout(()=>{p(!1),d.trim()&&S(d.trim())},150)}}),h&&t.jsx("div",{style:{width:"100%",fontSize:14,color:"#e53e3e",paddingTop:2},children:h}),f&&(j.length>0||o)&&t.jsx(wS,{children:o?t.jsxs(Iu,{style:{color:"#e53e3e"},children:["⚠ ",o]}):j.length===0?t.jsx(Iu,{children:"暂无匹配联系人"}):j.map((b,$)=>t.jsxs(SS,{$focused:m===$,onMouseDown:()=>z(b),style:{opacity:Br(b)?1:.55,cursor:Br(b)?"pointer":"not-allowed"},title:Br(b)?void 0:ds(b.mailboxStatus),children:[t.jsxs(kS,{children:[b.name,b.enName?t.jsx("span",{style:{fontWeight:400,color:"#9faebd",marginLeft:4},children:b.enName}):null,t.jsx(XS,{status:b.mailboxStatus})]}),t.jsxs(jS,{children:[b.aiEmail,b.department?t.jsx("span",{style:{color:"#b0bec5",marginLeft:6},children:b.department}):null]})]},b.personId))})]})}function QS({onClose:e,initialTo:n}){const{sendBlank:r,accountConfig:i}=zc(),{state:o}=rn(),s=o.phase==="logged_in"?o.session.token:null,[a,d]=c.useState([]),[u,f]=c.useState(null);c.useEffect(()=>{s&&qg(s).then(E=>{d(E),f(null)}).catch(E=>{f("通讯录加载失败，请检查账号中心连接"),console.warn("[ComposeModal] getEmailContacts failed:",E)})},[s]);const p=c.useMemo(()=>{var K;const E=new Set;for(const _ of a){const Y=(K=_.department)==null?void 0:K.trim();Y&&Br(_)&&E.add(Y)}return Array.from(E).sort((_,Y)=>_.localeCompare(Y,"zh-Hans-CN"))},[a]),[m,g]=c.useState(n??[]),[h,x]=c.useState([]),[k,v]=c.useState([]),[y,j]=c.useState(!1),[S,z]=c.useState(!1),[P,I]=c.useState("single"),[b,$]=c.useState("same"),[O,D]=c.useState(""),[R,V]=c.useState(""),[te,q]=c.useState(""),[W,fe]=c.useState(""),[le,Q]=c.useState([]),[ge,J]=c.useState([]),[H,T]=c.useState(!1),[w,L]=c.useState(!1),[N,M]=c.useState(null),A=c.useCallback(E=>{g(K=>K.find(_=>E.personId&&_.personId===E.personId||_.email.toLowerCase()===E.email.toLowerCase())?K:[...K,E])},[]),ee=c.useCallback(E=>{g(K=>K.filter(_=>_.email.toLowerCase()!==E.toLowerCase()))},[]),me=c.useCallback(E=>{x(K=>K.find(_=>E.personId&&_.personId===E.personId||_.email.toLowerCase()===E.email.toLowerCase())?K:[...K,E])},[]),Ie=c.useCallback(E=>{x(K=>K.filter(_=>_.email.toLowerCase()!==E.toLowerCase()))},[]),Fe=c.useCallback(E=>{v(K=>K.find(_=>E.personId&&_.personId===E.personId||_.email.toLowerCase()===E.email.toLowerCase())?K:[...K,E])},[]),Z=c.useCallback(E=>{v(K=>K.filter(_=>_.email.toLowerCase()!==E.toLowerCase()))},[]),X=c.useCallback(()=>{if(!O)return;const E=a.filter(K=>K.department===O&&Br(K));g(K=>{const _=new Set(K.map(ae=>ae.email.toLowerCase())),Y=[...K];for(const ae of E)_.has(ae.aiEmail.toLowerCase())||(Y.push({email:ae.aiEmail,displayName:ae.name,personId:ae.personId,department:ae.department,position:ae.position,mailboxStatus:ae.mailboxStatus,fromDirectory:!0}),_.add(ae.aiEmail.toLowerCase()));return Y}),M(null)},[a,O]),ye=c.useCallback(()=>m.map(E=>{const K=a.find(_=>E.personId&&_.personId===E.personId||_.aiEmail.toLowerCase()===E.email.toLowerCase());return{id:E.personId||(K==null?void 0:K.personId)||E.email,name:E.displayName||(K==null?void 0:K.name)||E.email,email:E.email,department:E.department||(K==null?void 0:K.department),position:E.position||(K==null?void 0:K.position)}}),[a,m]),Ee=c.useCallback(async()=>{var K;const E=await window.electronAPI.emailSelectAttachments();if(!(!E.ok||!((K=E.files)!=null&&K.length))){for(const _ of E.files)if(_.sizeBytes>iS){M(`文件 "${_.fileName}" 超过单个附件大小限制（25MB）`);return}J(_=>{const Y=[..._];for(const je of E.files)Y.find(Le=>Le.filePath===je.filePath)||Y.push(je);return Y.reduce((je,Le)=>je+Le.sizeBytes,0)>zi?(M("附件总大小超过限制（50MB），请删除部分附件后再添加"),_):(M(null),Y)})}},[]),G=c.useCallback(E=>{J(K=>K.filter(_=>_.filePath!==E)),M(null)},[]),F=ge.reduce((E,K)=>E+K.sizeBytes,0),se=[...m,...h,...k].some(E=>E.fromDirectory&&E.mailboxStatus&&E.mailboxStatus!=="active"),_e=le.filter(E=>E.status!=="sent"&&E.status!=="sending"),de=P==="bulk"&&b==="ai"?_e.length>0&&!H&&!w&&F<=zi&&!se:m.length>0&&!H&&F<=zi&&!se,oe=c.useCallback(async()=>{if(m.length===0){M("请至少添加一个群发收件人。");return}if(!W.trim()){M("请输入 AI 个性化群发目标。");return}const E=m.filter(K=>K.fromDirectory&&K.mailboxStatus&&K.mailboxStatus!=="active");if(E.length>0){M(`以下收件人无法生成正式群发草稿：${E.map(K=>K.displayName||K.email).join("、")}`);return}L(!0),M(null);try{const K=o.phase==="logged_in"?o.session.user.displayName||o.session.user.username:i==null?void 0:i.displayName,_=(i==null?void 0:i.email)||(i==null?void 0:i.user),Y=await rS({objective:W,suggestedSubject:R,recipients:ye(),senderName:K,senderEmail:_});Q(Y)}catch(K){M(`群发草稿生成失败：${K instanceof Error?K.message:String(K)}`)}finally{L(!1)}},[i,W,ye,o,R,m]),Te=c.useCallback((E,K)=>{Q(_=>_.map(Y=>Y.id===E?{...Y,...K,status:Y.status==="sent"||Y.status==="sending"?Y.status:"ready",error:void 0}:Y))},[]),C=c.useCallback(async()=>{if(m.length===0){M("请至少添加一个收件人。");return}const E=[...m,...h,...k],K=E.filter(Y=>Y.fromDirectory&&Y.mailboxStatus&&Y.mailboxStatus!=="active");if(K.length>0){const Y=K.map(ae=>`${ae.displayName||ae.email}（${ds(ae.mailboxStatus)}）`);M(`以下收件人无法发送邮件：${Y.join("、")}`);return}for(const Y of E)if(!oh.test(Y.email)){M(`邮箱地址格式不正确：${Y.email}`);return}if(F>zi){M("附件总大小超过限制（50MB），请删除部分附件后重试。");return}if(P==="bulk"&&b==="same"){T(!0),M(null);try{for(const Y of m)await r({to:[Y.email],subject:R.trim(),body:te,attachments:ge});e()}catch(Y){const ae=Y instanceof Error?Y.message:String(Y);M(`群发邮件发送失败：${ae}`)}finally{T(!1)}return}if(P==="bulk"&&b==="ai"){const Y=le.filter(je=>je.status!=="sent");if(Y.length===0){M("请先生成并确认群发草稿。");return}T(!0),M(null);let ae=0;for(const je of Y){if(!je.subject.trim()||!je.body.trim()){Q(Le=>Le.map(Ke=>Ke.id===je.id?{...Ke,status:"failed",error:"主题或正文为空"}:Ke)),ae+=1;continue}Q(Le=>Le.map(Ke=>Ke.id===je.id?{...Ke,status:"sending",error:void 0}:Ke));try{await r({to:[je.recipient.email],subject:je.subject.trim(),body:je.body,attachments:ge}),Q(Le=>Le.map(Ke=>Ke.id===je.id?{...Ke,status:"sent",error:void 0}:Ke))}catch(Le){ae+=1;const Ke=Le instanceof Error?Le.message:String(Le);Q(Be=>Be.map(mt=>mt.id===je.id?{...mt,status:"failed",error:Ke}:mt))}}T(!1),ae>0?M(`群发完成，但有 ${ae} 封发送失败，请检查草稿状态后重试。`):e();return}const _={to:m.map(Y=>Y.email),cc:h.map(Y=>Y.email),bcc:k.map(Y=>Y.email),subject:R.trim(),body:te,attachments:ge};T(!0),M(null);try{await r(_),e()}catch(Y){const ae=Y instanceof Error?Y.message:String(Y);ae.includes("认证失败")||ae.includes("AUTH")||ae.includes("username or password")?M("邮箱账号或密码认证失败，请检查内部邮箱配置。"):M(`邮件发送失败：${ae}`)}finally{T(!1)}},[m,h,k,R,te,ge,F,P,b,le,r,e]);return c.useEffect(()=>{const E=K=>{K.key==="Escape"&&e()};return window.addEventListener("keydown",E),()=>window.removeEventListener("keydown",E)},[e]),t.jsx(oS,{onClick:e,children:t.jsxs(sS,{onClick:E=>E.stopPropagation(),children:[t.jsxs(aS,{children:[t.jsxs(cS,{children:[t.jsx(lS,{children:"新建邮件"}),t.jsxs(dS,{children:[t.jsx(yu,{type:"button",$active:P==="single",onClick:()=>I("single"),children:"普通邮件"}),t.jsx(yu,{type:"button",$active:P==="bulk",onClick:()=>I("bulk"),children:"群发邮件"})]})]}),t.jsx(uS,{type:"button",onClick:e,title:"关闭",children:"✕"})]}),t.jsxs(pS,{children:[P==="bulk"&&t.jsxs(fS,{children:[t.jsxs(mS,{children:[t.jsx(wu,{type:"button",$active:b==="same",onClick:()=>$("same"),children:"同一正文群发"}),t.jsx(wu,{type:"button",$active:b==="ai",onClick:()=>$("ai"),children:"AI 个性化群发"})]}),t.jsx(Su,{children:"群发会为每位收件人单独发送一封邮件，不会把多人合并到同一个 To，也不会默认使用 BCC。"}),p.length>0&&t.jsxs(ku,{children:[t.jsxs(gS,{value:O,onChange:E=>D(E.target.value),children:[t.jsx("option",{value:"",children:"按部门选择联系人"}),p.map(E=>t.jsx("option",{value:E,children:E},E))]}),t.jsx(ju,{type:"button",onClick:X,disabled:!O,children:"添加部门联系人"})]})]}),t.jsxs(Eo,{children:[t.jsx(zo,{children:"收件人"}),t.jsx(Do,{children:t.jsx(xa,{recipients:m,onAdd:A,onRemove:ee,contacts:a,contactsError:u,placeholder:"搜索联系人或输入邮箱",autoFocus:!0})}),P==="single"&&t.jsxs(t.Fragment,{children:[t.jsx(vu,{type:"button",onClick:()=>{j(E=>!E),z(!1)},children:y?"隐藏抄送":"抄送"}),t.jsx(vu,{type:"button",onClick:()=>{z(E=>!E),j(!1)},children:S?"隐藏密送":"密送"})]})]}),P==="single"&&y&&t.jsxs(Eo,{children:[t.jsx(zo,{children:"抄送"}),t.jsx(Do,{children:t.jsx(xa,{recipients:h,onAdd:me,onRemove:Ie,contacts:a,contactsError:u,placeholder:"搜索联系人或输入邮箱"})})]}),P==="single"&&S&&t.jsxs(Eo,{children:[t.jsx(zo,{children:"密送"}),t.jsx(Do,{children:t.jsx(xa,{recipients:k,onAdd:Fe,onRemove:Z,contacts:a,contactsError:u,placeholder:"搜索联系人或输入邮箱"})})]}),t.jsxs(Eo,{children:[t.jsx(zo,{children:"主题"}),t.jsx(Do,{children:t.jsx(IS,{type:"text",value:R,onChange:E=>V(E.target.value),placeholder:"邮件主题"})})]}),t.jsxs(TS,{children:[t.jsx($S,{value:P==="bulk"&&b==="ai"?W:te,onChange:E=>{P==="bulk"&&b==="ai"?fe(E.target.value):q(E.target.value)},placeholder:P==="bulk"&&b==="ai"?"输入群发目标，例如：给招生办所有老师发一封邀请参加 AI Office 宣讲会的邮件":"正文内容..."}),P==="bulk"&&b==="ai"&&t.jsxs(ku,{style:{marginTop:10},children:[t.jsx(ju,{type:"button",onClick:oe,disabled:w||m.length===0||!W.trim(),children:w?"生成中...":"生成个性化草稿"}),t.jsx(Su,{children:"AI 只生成逐封草稿，必须由你预览、编辑并点击确认后才会发送。"})]})]}),P==="bulk"&&b==="ai"&&le.length>0&&t.jsxs(CS,{children:[t.jsxs(PS,{children:[t.jsxs("span",{children:["逐封预览与编辑（",le.length,"）"]}),t.jsxs("span",{children:[le.filter(E=>E.status==="sent").length," 封已发送"]})]}),t.jsx(AS,{children:le.map(E=>t.jsxs(_S,{children:[t.jsxs(ES,{children:[t.jsxs("span",{children:[E.recipient.name," <",E.recipient.email,">",E.recipient.department?` · ${E.recipient.department}`:"",E.recipient.position?` · ${E.recipient.position}`:""]}),t.jsxs(zS,{$status:E.status,children:[ZS(E.status),E.error?`：${E.error}`:""]})]}),t.jsx(DS,{value:E.subject,onChange:K=>Te(E.id,{subject:K.target.value}),disabled:E.status==="sending"||E.status==="sent",placeholder:"邮件主题"}),t.jsx(RS,{value:E.body,onChange:K=>Te(E.id,{body:K.target.value}),disabled:E.status==="sending"||E.status==="sent",placeholder:"邮件正文"})]},E.id))})]})]}),t.jsxs(MS,{children:[t.jsx(FS,{type:"button",onClick:Ee,disabled:H,children:"📎 添加附件"}),ge.length>0&&t.jsxs(BS,{children:[ge.map(E=>t.jsxs(LS,{children:[t.jsx(NS,{children:YS(E.mimeType,E.fileName)}),t.jsx(OS,{title:E.fileName,children:E.fileName}),t.jsx(WS,{children:$u(E.sizeBytes)}),t.jsx(US,{type:"button",onClick:()=>G(E.filePath),title:"移除附件",children:"✕"})]},E.filePath)),t.jsxs("div",{style:{fontSize:14,color:"#9faebd",marginTop:2},children:["共 ",ge.length," 个附件，",$u(F),F>zi&&t.jsx("span",{style:{color:"#e53e3e",marginLeft:8},children:"⚠ 超过 50MB 限制"})]})]})]}),t.jsxs(HS,{children:[t.jsxs(KS,{children:[N,!N&&se&&t.jsx("span",{style:{color:"#856404"},children:"⚠ 部分收件人的 AI 邮箱不可用，无法发送。"})]}),t.jsxs(GS,{children:[t.jsx(qS,{type:"button",onClick:e,disabled:H,children:"取消"}),t.jsx(VS,{type:"button",onClick:C,disabled:!de,title:se?"部分收件人邮箱不可用，无法发送":void 0,children:H?"发送中...":P==="bulk"?b==="ai"?"确认批量发送":"逐封群发":"发送"})]})]})]})})}let Fl=null;function ek(e){Fl=e}function Tu(){const e=Fl;return Fl=null,e}const tk={一:1,二:2,三:3,四:4,五:5,六:6,日:0,天:0};function Ro(e,n){const r=new Date(e);return r.setDate(r.getDate()+n),r}function nk(e){const n=new Date(e),r=n.getDay()||7;return n.setHours(0,0,0,0),n.setDate(n.getDate()-r+1),n}function rk(e,n){const r=new Date(n);if(r.setHours(0,0,0,0),e==="明天")return Ro(r,1);if(e==="后天")return Ro(r,2);const i=e.match(/^(本周|下周)([一二三四五六日天])$/);if(!i)return null;const o=tk[i[2]],s=nk(n),a=o===0?6:o-1,d=Ro(s,i[1]==="下周"?7+a:a);return i[1]==="本周"&&d.getTime()<r.getTime()?Ro(d,7):d}function Cu(e,n){return n==="下午"||n==="晚上"?e<12?e+12:e:n==="中午"&&e<11?e+12:e}function ik(e){return e==="早上"||e==="上午"?9:e==="中午"?12:e==="晚上"?19:15}function Pu(e,n,r){const i=new Date(e);return i.setHours(n,r,0,0),i}function ok(e,n){if(/前/.test(n))return!0;const r=e.replace(/\s+/g,""),i=n.replace(/\s+/g,""),o=r.indexOf(i);if(o<0)return/截止|提交|反馈|回传|补充/.test(e);const s=r.slice(Math.max(0,o-12),o),a=r.slice(o+i.length,o+i.length+12);return/截止|请在|需在|提交|反馈|回传|补充/.test(s)||/前|截止|提交|反馈|回传|补充/.test(a)}function sk(e,n=new Date){const r="(明天|后天|本周[一二三四五六日天]|下周[一二三四五六日天])",i="(早上|上午|中午|下午|晚上)?",o="(?:(\\d{1,2})(?:[:：](\\d{1,2}))?\\s*点?(半)?)?",s="(?:\\s*(?:到|至|[-—~])\\s*(早上|上午|中午|下午|晚上)?\\s*(\\d{1,2})(?:[:：](\\d{1,2}))?\\s*点?(半)?)?",a=new RegExp(`${r}\\s*${i}\\s*${o}${s}\\s*(前)?`,"g");for(const d of e.matchAll(a)){const u=d[0].trim();if(!u)continue;const f=rk(d[1],n);if(!f)continue;const p=d[2],m=d[3]?Number.parseInt(d[3],10):void 0,g=d[4]?Number.parseInt(d[4],10):void 0,h=!!d[5],x=d[6]||p,k=d[7]?Number.parseInt(d[7],10):void 0,v=d[8]?Number.parseInt(d[8],10):void 0,y=!!d[9],j=Cu(m??ik(p),p),z=Pu(f,j,h?30:g??0),I=typeof k=="number"?Pu(f,Cu(k,x),y?30:v??0):void 0;I&&I.getTime()<=z.getTime()&&p&&!d[6]&&I.setHours(I.getHours()+12);const b={startTime:z.toISOString(),endTime:I==null?void 0:I.toISOString(),matchedText:u};if(ok(e,u))return{deadlineTime:z.toISOString(),matchedText:u};if(!b.endTime&&m!==void 0){const $=new Date(z);$.setMinutes($.getMinutes()+60),b.endTime=$.toISOString()}return b}return{}}const ak=5,Au=800,lk=[/noreply/i,/no-reply/i,/donotreply/i,/do-not-reply/i,/newsletter/i,/automated/i,/mailer-daemon/i,/postmaster/i,/bounce/i,/notification@/i,/alert@/i,/support@/i],_u=[/unsubscribe/i,/newsletter/i,/promotional/i,/marketing/i,/advertisement/i,/special.?offer/i,/取消订阅/i,/退订/i,/营销/i,/广告/i,/促销/i],ck=[/login.alert/i,/security.alert/i,/sign.in.alert/i,/登录提醒/i,/登录通知/i,/账号登录/i,/安全提醒/i,/登录验证/i],dk=[/phishing/i,/your.account.*suspended/i,/verify.*immediately/i,/账户被封/i,/立即验证/i,/钓鱼/i,/密码泄露/i],uk=[/\b(organize|arrange|prepare|coordinate|confirm|submit|handle|process|follow.?up|push|complete|lead|liaise|notify|invite|convene)\b/i,/组织|安排|准备|整理|跟进|协调|确认|提交|补充|处理|推进|完成|负责|对接|通知|邀请|召开/],pk=[/宣讲会|会议|研讨会|活动|汇报|审批|报销|合同|材料|方案|计划|报告|培训|讲座/,/meeting|workshop|seminar|event|presentation|approval|reimbursement|contract|material|plan|report|training/i],fk=[/请查看|请修改|请反馈|请签署|请确认|请回传|请处理|请审阅|请审批|修改后发回/,/截止|尽快|今天|明天/,/please\s+(review|revise|sign|confirm|send\s+back|handle|process)/i,/\b(feedback|deadline|urgent)\b/i,/by\s+(friday|tomorrow|monday|eod|cob|tonight|end\s+of\s+day)/i],mk=[/mailer-daemon/i,/postmaster@/i,/mail-daemon/i,/no-?reply@.*mailer/i,/delivery.status/i,/bounce\+|noreply\+bounce/i],gk=[/undelivered\s+mail/i,/delivery\s+status\s+notification/i,/mail\s+delivery\s+(failed|error|subsystem)/i,/returned\s+to\s+sender/i,/non.?deliverable/i,/permanent\s+failure/i,/failure\s+notice/i,/delivery\s+failure/i,/bounce\s+message/i,/未送达|邮件退回|无法投递|退信通知/i],hk=[/could not be delivered|failed permanently|user unknown|no such user/i,/sender is unauthenticated|sender not authorized/i,/spf\s+(fail|reject|softfail)/i,/dkim\s+(fail|invalid)/i,/dmarc\s+policy/i,/the following addresses had permanent delivery errors/i,/your message to .* was automatically rejected/i,/this\s+message\s+was\s+created\s+automatically\s+by\s+mail\s+delivery\s+software/i];function xk(e){const n=(e.from+" "+(e.fromName||"")).toLowerCase();if(mk.some(s=>s.test(n)))return!0;const r=e.subject;if(gk.some(s=>s.test(r)))return!0;const i=r.toLowerCase();if(/delivery|undelivered|bounce|daemon|postmaster|mailer/i.test(i)||/delivery|undelivered|bounce|daemon|postmaster|mailer/i.test(n)){const s=e.body;if(hk.some(a=>a.test(s)))return!0}return!1}function bk(e){var i;if(!((i=e.attachments)!=null&&i.length))return!1;const n=e.body.trim();if(n.length>80)return!1;const r=`${e.subject}
${n}`.toLowerCase();return!fk.some(o=>o.test(r))}const yk=[{match:/宣讲会|宣讲/,tasks:["撰写宣讲内容稿","制作宣讲 PPT","联系相关人员确认参会","确认宣讲时间与场地","回复对方并同步进展"]},{match:/研讨会|论坛/,tasks:["确定研讨主题与议程","邀请参会嘉宾或同事","预订会议室 / 在线会议链接","准备研讨材料","回复对方确认安排"]},{match:/复盘|回顾|总结会/,tasks:["收集各方反馈与数据","整理项目复盘提纲","召集相关人员确认时间","准备复盘文档"]},{match:/汇报|汇报材料/,tasks:["整理汇报所需数据","撰写汇报文档 / PPT","内部评审草稿","确认汇报时间与受众"]},{match:/报销/,tasks:["整理报销凭证和发票","填写报销申请表","获取主管签字","提交财务审批"]},{match:/审批|合同/,tasks:["整理待审批文件","提交审批流程","跟进审批进度","回复对方确认结果"]},{match:/会议|开会/,tasks:["确认会议时间和地点","准备会议议程","通知参会人员","会后整理会议纪要"]},{match:/活动|培训/,tasks:["制定活动方案","联系场地和参与人员","准备活动材料","确认时间并通知相关方"]},{match:/数据|统计|整理/,tasks:["收集原始数据","整理并核对数据","生成数据报告","发送给相关方审阅"]}];function vk(e){for(const n of yk)if(n.match.test(e))return n.tasks}function wk(e,n){const r=`${e.subject}
${e.body.slice(0,600)}`;if(!uk.some(d=>d.test(r))||!pk.some(d=>d.test(r)))return null;const s=(e.subject.trim()||e.body.trim()).slice(0,20),a=vk(r);return Ji(e,n,{category:"action_required",priority:"medium",needsReply:!0,needsUserAction:!0,canAutoArchive:!1,summary:s,reason:"包含明确任务动词和任务对象",suggestedAction:"确认任务细节并跟进处理",suggestedTasks:a})}const Si=()=>new Date().toISOString();function Dc(e){return`${e.subject}
${e.body}`.toLowerCase()}function Sk(e,n){const r=Dc(e);return n||/urgent|asap|today|tonight|马上|立刻|紧急|今天|截止/.test(r)?"urgent":/tomorrow|by friday|尽快|明天|本周|周五|下周一/.test(r)?"soon":/会议|安排|确认|回复|submit|confirm|meeting/.test(r)?"normal":"none"}function kk(e,n){var o;const r=Dc(e),i=e.from.toLowerCase();return n.category==="promotion"?"promotion":n.category==="risk"||n.riskLevel==="high"?"spam":/meeting|会议|seminar|研讨会|邀请/.test(r)?"meeting_invitation":/审批|批准|确认|approve|approval/.test(r)?"approval_request":/docx|word|文档|修改|审阅|review|附件/.test(r)&&(((o=e.attachments)==null?void 0:o.length)??0)>0?"document_review":/xlsx|csv|数据|报表|统计|excel|report/.test(r)?"data_report_request":/学生|同学|选课|退课|申请|导师|研究生|student|course|late drop|deadline/.test(r)?"student_request":/项目|进展|同步|update|progress/.test(r)?"project_update":n.needsUserAction?"task_assignment":/教务|学院|学校|通知|admin|office/.test(r)||/\.edu(\.cn)?$/.test(i)?"internal_notice":n.category==="read_only"||n.category==="archive_candidate"?"system_notice":n.needsReply?"colleague_collaboration":"ordinary"}function Yi(){return{hasTimeRequirement:!1,type:"none",confidence:0,needsUserConfirmation:!1}}function jk(e,n){const r=new Date(e);if(!Number.isFinite(r.getTime()))return;const i=new Date(r);return i.setMinutes(i.getMinutes()+n),i.toISOString()}function fr(e){return e?Number.isFinite(new Date(e).getTime()):!1}function Yt(e){return typeof e=="string"&&e.trim()?e.trim():void 0}function Ik(e){var n;return e!=null&&e.hasTimeRequirement?!!(e.startTime||e.deadlineTime||(n=e.candidateTimes)!=null&&n.length):!1}function $k(e){var i,o;const n=e.match(/(?:地点|会议地点)[：:\s]*([^。\n；;,，]+)/);if((i=n==null?void 0:n[1])!=null&&i.trim())return n[1].trim().replace(/^在\s*/,"");const r=e.match(/在([^。\n；;,，]+?(?:会议室|办公室|报告厅|教室|Zoom|线上会议|腾讯会议|飞书会议))/i);if((o=r==null?void 0:r[1])!=null&&o.trim())return r[1].trim()}function Tk(e){var n;return(n=e.match(/https?:\/\/\S+/i))==null?void 0:n[0]}function Ck(e){return e.replace(/^关于/,"").replace(/的?(通知|邀请|安排|确认|提醒|请求)$/u,"").replace(/^(明天|后天|本周[一二三四五六日天]|下周[一二三四五六日天])/,"").trim()}function Eu(e,n){var o,s;const r=((o=e.match(/召开([^。\n；;,，]*(?:筹备会议|协调会|同步会|宣讲会|沟通会议|会议|面试|沟通))/))==null?void 0:o[1])||((s=e.match(/参加([^。\n；;,，]*(?:筹备会议|协调会|同步会|宣讲会|沟通会议|会议|面试|沟通))/))==null?void 0:s[1]);return r!=null&&r.trim()?r.trim():(n?Ck(n):"")||n}function Pk(e,n){return/截止|请在|需在|前提交|提交|反馈|回传|报销材料/.test(e)?"deadline":/面试|interview/i.test(e)?"interview":/候选时间|哪个时间|哪个.*方便|周[一二三四五六日天].*周[一二三四五六日天]|available|availability/i.test(e)?"candidate_times":/会议|筹备会|协调会|宣讲会|沟通会议|线上同步|约谈|appointment|meeting/i.test(e)?"meeting":n!=null&&n.type&&n.type!=="none"?n.type:"appointment"}function io(e,n,r=new Date,i){var k;const o=n.trim(),s=sk(o,r),a=Pk(o,e),d=a==="deadline"&&!!(s.deadlineTime||s.startTime),u=(e==null?void 0:e.startTime)||(d?void 0:s.startTime),f=(e==null?void 0:e.deadlineTime)||(d?s.deadlineTime||s.startTime:void 0),p=d?"deadline":u?a==="deadline"?"meeting":a:e!=null&&e.type&&e.type!=="none"?e.type:/找个时间|约个时间|安排时间|方便的时候|约时间/.test(o)?"follow_up":"none",m=!!(u||f||(k=e==null?void 0:e.candidateTimes)!=null&&k.length);if(!m&&/找个时间|约个时间|安排时间|方便的时候|约时间|下周.*聊/.test(o))return{hasTimeRequirement:!0,type:"follow_up",title:Eu(o,i),confidence:Math.max((e==null?void 0:e.confidence)??0,.55),needsUserConfirmation:!0,sourceText:e==null?void 0:e.sourceText};if(!(e!=null&&e.hasTimeRequirement)&&!m&&p==="none"||!m&&(p==="none"||!(e!=null&&e.hasTimeRequirement)))return;if(!m&&(e!=null&&e.hasTimeRequirement))return{...e,type:e.type==="follow_up"||e.type==="appointment"?e.type:"follow_up",needsUserConfirmation:!0};const g=p==="interview"?30:60,h=p==="deadline"?void 0:u,x=p==="deadline"?void 0:(e==null?void 0:e.endTime)||s.endTime||(h?jk(h,g):void 0);return{...e,hasTimeRequirement:!0,type:p,title:(e==null?void 0:e.title)||Eu(o,i),description:e==null?void 0:e.description,startTime:h,endTime:x,timezone:(e==null?void 0:e.timezone)||Intl.DateTimeFormat().resolvedOptions().timeZone||"Asia/Shanghai",location:(e==null?void 0:e.location)||$k(o),meetingLink:(e==null?void 0:e.meetingLink)||Tk(o),attendees:e==null?void 0:e.attendees,candidateTimes:e==null?void 0:e.candidateTimes,deadlineTime:f,confidence:Math.max((e==null?void 0:e.confidence)??0,s.matchedText?.75:.55),needsUserConfirmation:!0,sourceText:(e==null?void 0:e.sourceText)||s.matchedText}}function sh(e,n){const r=`${n.subject}
${n.body}`;if(!e||typeof e!="object")return io(void 0,r,new Date,n.subject)??Yi();const i=e,s=["meeting","interview","deadline","reminder","appointment","candidate_times","follow_up","none"].includes(i.type)?i.type:"none";if(!(!!i.hasTimeRequirement&&s!=="none"))return io(void 0,r,new Date,n.subject)??Yi();const d=Yt(i.startTime),u=Yt(i.endTime),f=Yt(i.deadlineTime),p=Array.isArray(i.candidateTimes)?i.candidateTimes.map(v=>{if(!v||typeof v!="object")return null;const y=v,j=Yt(y.startTime);return fr(j)?{startTime:j,endTime:fr(Yt(y.endTime))?Yt(y.endTime):void 0,timezone:Yt(y.timezone)}:null}).filter(v=>!!v).slice(0,6):void 0,m=Array.isArray(i.attendees)?i.attendees.map(v=>{if(!v||typeof v!="object")return null;const y=v,j=Yt(y.name),S=Yt(y.email);return!j&&!S?null:{name:j,email:S}}).filter(v=>!!v).slice(0,20):void 0,g=s==="deadline"&&fr(f)||s==="candidate_times"&&!!(p!=null&&p.length)||s!=="deadline"&&s!=="candidate_times"&&s!=="follow_up"&&fr(d),h=s==="follow_up",x=typeof i.confidence=="number"?i.confidence:.7,k=io({hasTimeRequirement:!0,type:s,title:Yt(i.title)||n.subject||void 0,description:Yt(i.description),startTime:fr(d)?d:void 0,endTime:fr(u)?u:void 0,timezone:Yt(i.timezone),location:Yt(i.location),meetingLink:Yt(i.meetingLink),attendees:m,candidateTimes:p,deadlineTime:fr(f)?f:void 0,confidence:Math.max(0,Math.min(1,x)),needsUserConfirmation:i.needsUserConfirmation!==!1||!g,sourceText:Yt(i.sourceText)},r,new Date,n.subject);return!k||!Ik(k)&&!h&&k.type!=="follow_up"?Yi():k}function Ak(e,n){const r=sh(n.timeIntent,e);if(r.hasTimeRequirement)return r;const i=`${e.subject}
${e.body}`,o=io(void 0,i,new Date,e.subject);return o!=null&&o.hasTimeRequirement?o:n.deadline&&fr(n.deadline)?{hasTimeRequirement:!0,type:"deadline",title:e.subject||"截止事项",deadlineTime:n.deadline,confidence:.65,needsUserConfirmation:!0,sourceText:n.deadline}:/面试|interview/i.test(i)&&/时间|安排|schedule|slot/i.test(i)?{hasTimeRequirement:!0,type:"follow_up",title:e.subject||"面试安排",confidence:.55,needsUserConfirmation:!0}:(n.emailCategory==="meeting_invitation"||/会议|meeting|appointment|约时间|候选时间|available|availability/i.test(i))&&(n.needsReply||n.needsUserAction)?{hasTimeRequirement:!0,type:"follow_up",title:e.subject||"日程安排",confidence:.5,needsUserConfirmation:!0}:Yi()}function _k(e,n,r){var o;const i=`${n}
${e.subject}
${e.body}`.toLowerCase();return/回复|回信|reply/.test(i)?"reply_email":/附件|修改|文档|docx|word|审阅/.test(i)||r==="document_review"?"edit_document":/上传|提交|材料|upload|submit/.test(i)?"upload_file":/确认|确认信息|confirm/.test(i)?"confirm_information":/会议|日程|安排|meeting|schedule/.test(i)?"schedule_meeting":/审批|批准|拒绝|approve|reject/.test(i)?"approve_or_reject":/数据|报表|统计|excel|xlsx|csv/.test(i)?"analyze_data":/转发|forward/.test(i)?"forward_to_others":(((o=e.attachments)==null?void 0:o.length)??0)>0?"review_attachment":"prepare_material"}function Ek(e,n){const r=`${n.subject}
${n.body}`.toLowerCase();return e==="edit_document"||/\.docx?/.test(r)?"document":/pptx|ppt|演示|presentation/.test(r)?"ppt":e==="analyze_data"||/xlsx|csv|excel|数据|报表/.test(r)?"excel":e==="reply_email"?"mail":"none"}function zk(e,n,r){const i=Dc(e);return r?/附件|材料|上传|提交|attach|file/.test(i)?"send_attachment":n==="document_review"?"submit_revision":n==="approval_request"?"direct_answer":/无法|不能|拒绝|decline|reject/.test(i)?"reject_or_decline":/补充|不清楚|更多信息|more information/.test(i)?"ask_for_more_information":/收到|确认收到|received/.test(i)?"acknowledge_received":/政策|流程|申请|deadline|规定/.test(i)?"explain_policy":"direct_answer":"none"}function Dk(e,n){const r=new Set,i=e.subject.replace(/\s+/g," ").trim();i&&r.add(i.slice(0,80));const o=`${e.subject}
${e.body}`,s=[[/late drop|退课|选课|课程/i,"课程退课申请流程 截止时间"],[/报销|发票|合同|验收/i,"报销材料 审批流程"],[/中期考核|研究生|导师/i,"研究生中期考核材料要求"],[/政策|流程|申请|审批/i,"政策流程申请审批要求"],[/deadline|截止/i,"截止时间 办理要求"]];for(const[a,d]of s)a.test(o)&&r.add(d);return(n==="student_request"||n==="approval_request")&&r.size<2&&r.add(`${e.subject} 办理流程`),[...r].slice(0,4)}function Rk(e,n,r){var s,a;const i=(s=n.suggestedTasks)!=null&&s.length?n.suggestedTasks:[...n.needsReply?["回复来信"]:[],...n.needsUserAction?[(a=n.suggestedTasks)!=null&&a[0]||n.deadline?"处理邮件事项":"跟进邮件事项"]:[]].filter(Boolean);return[...new Set(i.map(d=>String(d).trim()).filter(Boolean))].slice(0,5).map((d,u)=>{const f=_k(e,d,r);return{id:`${e.id}:${Gt(`${d}:${u}`).slice(0,8)}`,title:d,description:void 0,type:f,priority:n.priority,deadline:n.deadline??null,sourceEmailId:e.id,targetWorkspace:Ek(f,e),status:"pending",createdAt:Si(),updatedAt:Si()}})}function Mk(e,n,r){const i=`${e.subject}
${e.body}`.toLowerCase();return n==="spam"||n==="promotion"?"spam":n==="meeting_invitation"?"meeting":n==="approval_request"?"approval":n==="document_review"||r.requiresOpenAttachment?"attachment_review":/批准|审批|同意|拒绝|确认是否|approve|approval|reject/i.test(i)?"approval":/请提供|请发送|需要.*(材料|文件|数据|信息|确认)|协助|provide|send.*(file|data|material)|need.*(file|data|info)/i.test(i)?"request":/请问|如何|是否|能否|为什么|what|how|could you explain|question/i.test(i)?"question":/通知|公告|提醒|安排说明|notice|notification|announcement/i.test(i)?"notice":n==="student_request"?"question":n==="task_assignment"||r.needsUserAction&&!r.needsReply?"task":n==="data_report_request"?"request":n==="internal_notice"||n==="system_notice"?"notice":r.needsUserAction?"task":r.needsReply?"question":"ordinary"}function Fk(e){return e==="student_request"||e==="approval_request"?"formal":e==="colleague_collaboration"||e==="project_update"?"concise":e==="meeting_invitation"?"friendly":e==="spam"||e==="promotion"?"neutral":"formal"}function Bk(e,n){var a,d,u,f;const r=Mk(e,n.emailCategory,{needsReply:n.needsReply,needsUserAction:n.needsUserAction,requiresOpenAttachment:n.requiresOpenAttachment}),i=Fk(n.emailCategory),o=p=>Gt(p).slice(0,8),s={intentType:r,title:n.summary||e.subject.slice(0,40),brief:n.suggestedAction||"",replyStrategy:{shouldReply:n.needsReply,tone:i,reason:n.suggestedAction||(n.needsReply?"对方需要回复":"无需回复")}};if(r==="task"){const p=(a=n.suggestedTasks)!=null&&a.length?n.suggestedTasks:[n.suggestedAction||"处理邮件事项"];s.taskChecklist=p.map((m,g)=>({id:o(`task:${g}:${m}`),text:m,done:!1,deadline:g===0?n.deadline??null:null}))}if(r==="attachment_review"&&((d=e.attachments)!=null&&d.length)&&(s.attachmentActions=e.attachments.map(p=>{const m=p.filename.toLowerCase(),g=/\.(docx?|xlsx?|pptx?)$/.test(m)?"review":"read",h=/\.docx?$/.test(m)?"document":/\.pptx?$/.test(m)?"ppt":/\.xlsx?|\.csv$/.test(m)?"excel":"preview";return{fileName:p.filename,action:g,targetWorkspace:h,note:"请查看并处理附件"}})),r==="notice"&&(s.noticeSummary={keyPoints:((u=n.suggestedTasks)==null?void 0:u.slice(0,4))??[n.summary],needFollowUp:n.needsReply||n.needsUserAction,followUpReason:n.needsReply?n.suggestedAction:void 0}),r==="question"&&(s.questionAnswer={question:e.subject,answerDraft:n.suggestedReplyPrompt||"",usedKnowledgeBase:!1,knowledgeMissing:n.requiresKnowledgeBase}),r==="request"){const p=(f=n.suggestedTasks)!=null&&f.length?n.suggestedTasks:[n.suggestedAction].filter(Boolean);s.requestItems=p.map((m,g)=>({id:o(`req:${g}:${m}`),text:m||"",required:!0}))}return s}function ah(e,n){var g,h;const r=kk(e,n),i=Sk(e,n.deadline),o=/附件|材料|上传|提交|attach|file/i.test(`${e.subject}
${e.body}`)||!!((g=e.attachments)!=null&&g.length),s=!!((h=e.attachments)!=null&&h.some(x=>/\.(docx|pptx|xlsx|csv|pdf|md|txt)$/i.test(x.filename)))||r==="document_review"||r==="data_report_request",a=r==="student_request"||r==="approval_request"||/政策|流程|申请|规定|deadline|late drop|退课|报销|中期考核/i.test(`${e.subject}
${e.body}`),d=a?Dk(e,r):[],u=[...n.riskLevel!=="none"?[`风险等级：${n.riskLevel}`]:[],...r==="spam"?["疑似垃圾或风险邮件"]:[]],f=n.needsReply,p=n.needsUserAction||o||s,m=Ak(e,{...n,emailCategory:r});return{...n,emailCategory:r,importance:n.priority,urgency:i,requiresReply:f,requiresAction:p,requiresKnowledgeBase:a,requiresAttachment:o,requiresOpenAttachment:s,suggestedKnowledgeQueries:d,todos:Rk(e,n,r),replyIntent:zk(e,r,f),timeIntent:m,riskFlags:u,analyzedAt:n.updatedAt||Si(),actionPlan:Bk(e,{emailCategory:r,requiresOpenAttachment:s,requiresKnowledgeBase:a,needsReply:f,needsUserAction:n.needsUserAction,suggestedTasks:n.suggestedTasks,deadline:n.deadline,suggestedReplyPrompt:n.suggestedReplyPrompt,suggestedAction:n.suggestedAction,summary:n.summary})}}function Ji(e,n,r){const i={messageId:e.id,threadId:e.threadId,accountId:n,bodyHash:Gt(e.body),category:"unknown",priority:"medium",needsReply:!1,needsUserAction:!1,canAutoArchive:!0,riskLevel:"none",summary:e.subject.slice(0,20),reason:"",suggestedAction:"无需处理",status:"success",createdAt:Si(),updatedAt:Si(),...r};return ah(e,i)}function Lk(e,n){const r=e.from.toLowerCase(),i=e.subject,o=e.body.slice(0,500);if(dk.some(a=>a.test(i)||a.test(o)))return Ji(e,n,{category:"risk",priority:"high",riskLevel:"high",needsUserAction:!0,canAutoArchive:!1,reason:"包含风险特征",suggestedAction:"谨慎查看，勿点击链接"});if(lk.some(a=>a.test(r))){const a=_u.some(d=>d.test(i)||d.test(o));return Ji(e,n,{category:a?"promotion":"archive_candidate",priority:"low",reason:"系统/自动化邮件",suggestedAction:"可直接归档"})}if(_u.some(a=>a.test(i)))return Ji(e,n,{category:"promotion",priority:"low",reason:"广告/营销内容",suggestedAction:"可归档或退订"});if(ck.some(a=>a.test(i)||a.test(o)))return Ji(e,n,{category:"read_only",priority:"low",reason:"系统登录提醒",suggestedAction:"确认后归档"});const s=wk(e,n);return s||null}function Nk(e){var i;const n=e.body.length>Au?e.body.slice(0,Au)+"...[截断]":e.body,r=(i=e.attachments)!=null&&i.length?`附件: ${e.attachments.map(o=>o.filename).join(", ")}`:"";return[`主题: ${e.subject}`,`发件人: ${e.fromName||""} <${e.from}>`,`收件人: ${e.toName||""} <${e.to}>`,`时间: ${e.timestamp}`,r,`正文:
${n}`].filter(Boolean).join(`
`)}function Ok(e){const n=new Date().toISOString(),r=Intl.DateTimeFormat().resolvedOptions().timeZone||"Asia/Shanghai",i=e.map((o,s)=>`[邮件${s+1}]
${Nk(o)}`).join(`

---

`);return`你是邮件分类专家。请对以下${e.length}封邮件进行批量分类分析。

当前日期时间：${n}
当前时区：${r}

请结合当前日期和当前时区解析邮件中的相对时间表达。
如果邮件中出现“明天、后天、本周五、下周一、下周三、明天下午 3 点、明天下午 3 点到 4 点、下周三下午 3 点、下周三下午 3 点到 4 点、本周五下午 5 点前”等表达，必须尽量转换成 ISO 8601 时间字符串。
如果邮件中存在明确日期/星期/时间组合，不允许只输出 follow_up；必须输出 hasTimeRequirement=true，并根据语义输出 meeting / interview / deadline / appointment / candidate_times，以及 startTime 或 deadlineTime。没有结束时间时：meeting 默认 60 分钟，interview 默认 30 分钟，appointment 默认 60 分钟。
模糊约时间（如“下周找个时间聊一下”）可以输出 follow_up 或 appointment，needsUserConfirmation=true，但不要伪造具体 startTime。

严格返回一个 JSON 数组，长度必须等于邮件数量（${e.length}），顺序与输入一致。
不要输出任何 Markdown、代码块标记或解释文字，只输出纯 JSON 数组。

【关键规则 — 短句任务识别】
你必须识别短句任务。即使邮件没有正式标题、没有截止日期、没有问号，只要正文中包含明显任务动词，
例如"组织、安排、准备、整理、跟进、协调、确认、提交、处理、推进、完成、负责、对接、通知、邀请、召开"等，
并且对象明确（如宣讲会、会议、活动、材料、审批、报销、合同等），就必须判断为 action_required，
而不是 unknown 或 read_only。对于此类邮件，needsReply 和 needsUserAction 均应为 true。

【分类指导】
- action_required：对方要求收件人执行某项任务（含上述任务动词）
- reply_required：对方提出问题或请求，等待收件人回复
- read_only：仅为通知，无需收件人操作或回复
- archive_candidate：可直接归档，无实质内容
- promotion：营销/广告/订阅类
- risk：疑似钓鱼/诈骗
- unknown：完全无法判断意图（仅在内容极度模糊时使用，不得滥用）

【自动判断要求】
- 自动判断是否需要知识库、回复语气和回复结构，不要把这些选择交给用户。
- 任务型输出可执行任务；需求型输出对方要的材料/信息/确认项；询问型提示是否涉及政策/流程依据；通知型不要强行生成长回复；附件处理型说明附件应阅读、审阅、修改、签署或回传；审批型必须谨慎提示人工确认。

每个元素的字段（全部必填，无值的字符串字段用空字符串 ""）：
{
  "category": "action_required" | "reply_required" | "read_only" | "archive_candidate" | "promotion" | "risk" | "unknown",
  "priority": "high" | "medium" | "low",
  "needsReply": boolean,
  "needsUserAction": boolean,
  "canAutoArchive": boolean,
  "riskLevel": "none" | "low" | "medium" | "high",
  "summary": "摘要（20字以内）",
  "reason": "分类理由（30字以内）",
  "suggestedAction": "建议操作（20字以内）",
  "deadline": "截止日期YYYY-MM-DD或空字符串",
  "timeIntent": {
    "hasTimeRequirement": boolean,
    "type": "meeting" | "interview" | "deadline" | "reminder" | "appointment" | "candidate_times" | "follow_up" | "none",
    "title": "日程标题或空字符串",
    "description": "补充说明或空字符串",
    "startTime": "明确开始时间ISO字符串或空字符串",
    "endTime": "明确结束时间ISO字符串或空字符串",
    "timezone": "时区或空字符串",
    "location": "地点或空字符串",
    "meetingLink": "会议链接或空字符串",
    "attendees": [{"name":"姓名或空字符串","email":"邮箱或空字符串"}],
    "candidateTimes": [{"startTime":"ISO字符串","endTime":"ISO字符串或空字符串","timezone":"时区或空字符串"}],
    "deadlineTime": "截止时间ISO字符串或空字符串",
    "confidence": 0到1之间数字,
    "needsUserConfirmation": boolean,
    "sourceText": "触发时间判断的原文片段或空字符串"
  },
  "senderRole": "发件人角色（10字以内）",
  "detectedIntent": "邮件意图（15字以内）",
  "suggestedReplyPrompt": "回复提示（30字以内）",
  "suggestedTasks": ["子任务1（≤20字）", "子任务2", "..."]
}

suggestedTasks 规则：
- category = "action_required" 时必须提供，列出 2-5 个具体可执行的子任务步骤
- 对方索要材料、数据、文件、信息或确认时，也可列出 1-5 个需求项
- 其他 category 时返回空数组 []
- 每项子任务应为简洁的动宾短语，例如：
  "撰写宣讲内容稿"、"制作宣讲 PPT"、"联系相关人员确认参会"、"确认时间与场地"

timeIntent 规则：
- 普通邮件必须返回 {"hasTimeRequirement": false, "type": "none", "confidence": 0, "needsUserConfirmation": false}。
- 明确会议提取 title、startTime、endTime、location、attendees；面试安排 type = "interview"。
- 截止事项 type = "deadline"，提取 deadlineTime；不要把截止事项当会议。
- 多候选时间 type = "candidate_times"，提取 candidateTimes。
- 模糊约时间但无具体时间 type = "follow_up"，needsUserConfirmation = true。
- 时间尽量输出 ISO 字符串；不确定具体时间时不要编造 startTime、endTime 或 deadlineTime。

邮件列表：

${i}`}function Wk(e,n,r){const o=Ur(e).trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/m,"").trim();let s;try{s=JSON.parse(o)}catch{throw new Error(`LLM 返回无效 JSON: ${o.slice(0,120)}`)}if(!Array.isArray(s))throw new Error("LLM 未返回数组");const a=Si();return n.map((d,u)=>{const f=s[u]??{},p=Gt(d.body),m=y=>["action_required","reply_required","read_only","archive_candidate","promotion","risk","unknown"].includes(y)?y:"unknown",g=y=>["high","medium","low"].includes(y)?y:"medium",h=y=>["none","low","medium","high"].includes(y)?y:"none",x=y=>typeof y=="string"&&y.trim()?y.trim():void 0,k=f.suggestedTasks,v=Array.isArray(k)&&k.length>0?k.filter(y=>typeof y=="string"&&y.trim().length>0).slice(0,5):void 0;return ah(d,{messageId:d.id,threadId:d.threadId,accountId:r,bodyHash:p,category:m(f.category),priority:g(f.priority),needsReply:!!f.needsReply,needsUserAction:!!f.needsUserAction,canAutoArchive:!!f.canAutoArchive,riskLevel:h(f.riskLevel),summary:typeof f.summary=="string"?f.summary.slice(0,30):d.subject.slice(0,20),reason:typeof f.reason=="string"?f.reason.slice(0,50):"",suggestedAction:typeof f.suggestedAction=="string"?f.suggestedAction.slice(0,30):"",deadline:x(f.deadline),timeIntent:sh(f.timeIntent,d),senderRole:x(f.senderRole),detectedIntent:x(f.detectedIntent),suggestedReplyPrompt:x(f.suggestedReplyPrompt),suggestedTasks:v,status:"success",createdAt:a,updatedAt:a})})}async function Uk(e,n,r){if(e.length===0)return[];const i=Ok(e),o=await new Promise((s,a)=>{window.electronAPI.writingAssistant({instruction:i,language:"zh"}).then(u=>{s(u)}).catch(u=>{a(u)})});return Wk(o,e,n)}const Bl="ai:mail-todos:v1",zu=1e3;function lh(){try{return JSON.parse(localStorage.getItem(Bl)??"{}")}catch{return{}}}function Hk(e){try{const n=Object.entries(e);if(n.length>zu){n.sort((r,i)=>(r[1].updatedAt??r[1].createdAt).localeCompare(i[1].updatedAt??i[1].createdAt)),localStorage.setItem(Bl,JSON.stringify(Object.fromEntries(n.slice(-zu))));return}localStorage.setItem(Bl,JSON.stringify(e))}catch{}}function Kk(e,n,r){return`${e}:${n}:${r}`}function Mo(e,n){const r=`${e}:${n}:`;return Object.entries(lh()).filter(([i])=>i.startsWith(r)).map(([,i])=>i).sort((i,o)=>i.status!==o.status?i.status==="pending"?-1:1:(i.deadline||i.createdAt).localeCompare(o.deadline||o.createdAt))}function Gk(e,n,r){const i=lh(),o=[];for(const s of r){const a=Kk(e,n,s.id),d=i[a],u={...s,accountId:e,workspaceId:n,status:(d==null?void 0:d.status)??s.status,createdAt:(d==null?void 0:d.createdAt)??s.createdAt,updatedAt:new Date().toISOString()};i[a]=u,o.push(u)}return Hk(i),o}const ys={important:3,normal:2,low:1},ki={need_reply:7,need_schedule:6,need_review:5,need_forward:4,notification:2,no_action:1,spam_or_noise:0},qk={spam:"风险或垃圾邮件",promotion:"推广与订阅邮件",system_notice:"系统通知",internal_notice:"内部通知",student_request:"学生事务咨询",colleague_collaboration:"同事协作",task_assignment:"任务分配",approval_request:"审批确认",meeting_invitation:"会议与日程安排",document_review:"文档与附件审阅",data_report_request:"数据与报表请求",project_update:"项目进展同步",urgent_issue:"紧急事项",ordinary:"普通沟通",action_required:"待处理任务",reply_required:"待回复邮件",read_only:"仅需阅读通知",archive_candidate:"可归档邮件",risk:"风险邮件",unknown:"待人工确认邮件"},Vk={need_reply:"需要回复",need_review:"需要审阅",need_schedule:"需要安排日程",need_forward:"需要转发",notification:"通知类",spam_or_noise:"低价值或风险内容",no_action:"无需处理"},Yk={important:"重要",normal:"普通",low:"低优先级"};function ba(e){return qk[e]||e||"未分类邮件"}function vs(e){return Vk[e]||e}function ws(e){var n,r;return((n=e.fromName)==null?void 0:n.trim())||((r=e.fromEmail)==null?void 0:r.trim())||"未知发件人"}function Ls(e){return[...new Set(e)]}function ch(e){const n=new Map;for(const r of e)n.set(r,(n.get(r)??0)+1);return[...n.entries()].map(([r,i])=>({key:r,count:i})).sort((r,i)=>i.count-r.count||r.key.localeCompare(i.key))}function Jk(e){const n=Ls(e.map(r=>r.importance));return n.length===1?n[0]:"mixed"}function Xk(e,n){const r=n.filter(d=>d.actionType==="need_reply").length,i=n.filter(d=>d.importance==="important").length,o=ch(n.map(d=>d.actionType)).slice(0,2).map(({key:d,count:u})=>`${vs(d)} ${u} 封`).join("，"),s=Ls(n.map(d=>d.summary).filter(Boolean)).slice(0,3).join("；");return`${[`主要围绕${e}`,s?`包括${s}`:"",o?`处理类型以${o}为主`:"",i>0?`其中 ${i} 封为重要邮件`:"",r>0?`${r} 封需要回复`:""].filter(Boolean).join("，")}。`}function Zk(e,n){const r=[...n].sort((i,o)=>ys[o.importance]-ys[i.importance]||ki[o.actionType]-ki[i.actionType]);return{topic:e,count:n.length,importanceLevel:Jk(n),description:Xk(e,n),relatedMessageIds:r.map(i=>i.messageId),representativeSubjects:Ls(r.map(i=>i.subject).filter(Boolean)).slice(0,3)}}function ya(e,n){const r=new Map;for(const i of e){const o=n(i);r.set(o,[...r.get(o)??[],i])}return[...r.entries()].map(([i,o])=>({key:i,items:o})).sort((i,o)=>o.items.length-i.items.length||i.key.localeCompare(o.key))}function Qk(e){const n=e.filter(i=>!i.error);if(n.length===0)return[];let r=ya(n,i=>i.category||"unknown").map(({key:i,items:o})=>({topic:ba(i),items:o}));if(r.length<5){const i=ya(n,o=>`${o.category||"unknown"}::${o.actionType}`).map(({key:o,items:s})=>{const[a,d]=o.split("::");return{topic:`${ba(a)}（${vs(d)}）`,items:s}});i.length>r.length&&(r=i)}if(r.length<5){const i=ya(n,o=>`${o.category||"unknown"}::${o.actionType}::${o.importance}`).map(({key:o,items:s})=>{const[a,d,u]=o.split("::");return{topic:`${ba(a)}（${vs(d)}，${Yk[u]}）`,items:s}});i.length>r.length&&(r=i)}if(r.length>8){const i=r.slice(0,7),o=r.slice(7).flatMap(s=>s.items);r=[...i,{topic:"其他相关邮件",items:o}]}return r.slice(0,8).map(i=>Zk(i.topic,i.items))}function ej(e){var r;const n=new Map;for(const i of e){const o=((r=i.fromEmail)==null?void 0:r.trim())||"未知邮箱",s=n.get(o)??{fromName:i.fromName,fromEmail:o,count:0,importantCount:0,subjects:[]};s.fromName=s.fromName||i.fromName,s.count+=1,!i.error&&i.importance==="important"&&(s.importantCount+=1),s.subjects=Ls([...s.subjects,i.subject].filter(Boolean)).slice(0,5),n.set(o,s)}return[...n.values()].sort((i,o)=>o.count-i.count||o.importantCount-i.importantCount||ws(i).localeCompare(ws(o)))}function tj(e){return ch(e.filter(n=>!n.error).map(n=>n.category||"unknown")).map(({key:n,count:r})=>({category:n,count:r}))}function nj(e){const n=e.filter(r=>{var i;return!r.error&&((i=r.timeIntent)==null?void 0:i.hasTimeRequirement)});return{meetingOrInterviewCount:n.filter(r=>{var i,o,s;return((i=r.timeIntent)==null?void 0:i.type)==="meeting"||((o=r.timeIntent)==null?void 0:o.type)==="interview"||((s=r.timeIntent)==null?void 0:s.type)==="appointment"}).length,deadlineCount:n.filter(r=>{var i;return((i=r.timeIntent)==null?void 0:i.type)==="deadline"}).length,candidateTimesCount:n.filter(r=>{var i;return((i=r.timeIntent)==null?void 0:i.type)==="candidate_times"}).length,conflictCount:n.filter(r=>(r.calendarConflictCount??0)>0).length,tentativeEventCount:n.filter(r=>{var i;return((i=r.timeIntent)==null?void 0:i.needsUserConfirmation)||r.calendarEventId}).length}}function rj(e){const n=e.filter(r=>{var i;return!r.error&&((i=r.timeIntent)==null?void 0:i.hasTimeRequirement)});return{pending:n.filter(r=>{var i;return(i=r.timeIntent)==null?void 0:i.needsUserConfirmation}).slice(0,8).map(r=>{var i,o,s;return{messageId:r.messageId,subject:r.subject,title:((i=r.timeIntent)==null?void 0:i.title)||r.subject,startTime:(o=r.timeIntent)==null?void 0:o.startTime,deadlineTime:(s=r.timeIntent)==null?void 0:s.deadlineTime}}),conflicts:n.filter(r=>(r.calendarConflictCount??0)>0).slice(0,8).map(r=>{var i;return{messageId:r.messageId,subject:r.subject,title:((i=r.timeIntent)==null?void 0:i.title)||r.subject,conflictCount:r.calendarConflictCount??0}}),deadlines:n.filter(r=>{var i;return((i=r.timeIntent)==null?void 0:i.type)==="deadline"}).slice(0,8).map(r=>{var i,o;return{messageId:r.messageId,subject:r.subject,title:((i=r.timeIntent)==null?void 0:i.title)||r.subject,deadlineTime:(o=r.timeIntent)==null?void 0:o.deadlineTime}})}}function ij(e){return e.filter(n=>!n.error&&n.importance==="important").sort((n,r)=>ki[r.actionType]-ki[n.actionType]||(n.receivedAt||"").localeCompare(r.receivedAt||"")).slice(0,10).map(n=>({messageId:n.messageId,fromName:n.fromName,fromEmail:n.fromEmail,subject:n.subject,reason:n.reason||n.summary,actionType:n.actionType}))}function dh(e){var n,r;return(e.calendarConflictCount??0)>0?"存在时间冲突，建议先生成改期回复":((n=e.timeIntent)==null?void 0:n.type)==="candidate_times"?"选择可用候选时间并回复":(r=e.timeIntent)!=null&&r.hasTimeRequirement?"确认日程安排并回复相关方":e.deadlineText?`${vs(e.actionType)}，关注截止时间：${e.deadlineText}`:e.hasDraftReply&&e.actionType==="need_reply"?"查看并确认已生成的预回复草稿":e.actionType==="need_reply"?"优先阅读并回复":e.actionType==="need_review"?"优先审阅邮件内容或附件":e.actionType==="need_schedule"?"确认日程安排并回复相关方":e.actionType==="need_forward"?"确认转发对象后处理":e.importance==="important"?e.reason||"优先查看并人工判断下一步":e.reason||e.summary||"查看邮件详情"}function oj(e){return e.filter(n=>n.error||n.actionType==="spam_or_noise"||n.actionType==="no_action"?!1:n.importance==="important"||n.actionType!=="notification").sort((n,r)=>ys[r.importance]-ys[n.importance]||ki[r.actionType]-ki[n.actionType]).slice(0,15).map(n=>({messageId:n.messageId,subject:n.subject,fromName:n.fromName,fromEmail:n.fromEmail,actionType:n.actionType,suggestedNextStep:dh(n),deadlineText:n.deadlineText,timeIntent:n.timeIntent}))}function sj(e,n){return n.length===0?`本次 ${e} 封未读邮件没有足够的成功分析结果用于归纳内容主题。`:[`本次 ${e} 封未读邮件主要集中在以下 ${n.length} 类：`,"",...n.flatMap((i,o)=>[`${o+1}. ${i.topic}：共 ${i.count} 封`,`   ${i.description}`,i.representativeSubjects.length?`   代表邮件：${i.representativeSubjects.join("；")}`:"",""].filter(Boolean))].join(`
`).trim()}function aj(e){const n=e.senderStats.slice(0,5).map(a=>{const d=a.importantCount>0?`其中 ${a.importantCount} 封重要`:"暂无重要邮件";return`- ${ws(a)}：${a.count} 封，${d}`}),r=e.actionItems.slice(0,5).map((a,d)=>`${d+1}. ${ws(a)}关于“${a.subject||"无主题"}”的邮件，${dh({messageId:a.messageId,fromName:a.fromName,fromEmail:a.fromEmail,subject:a.subject,importance:"important",actionType:a.actionType,summary:a.suggestedNextStep,reason:a.suggestedNextStep,hasDraftReply:!1,deadlineText:a.deadlineText})}。`),i=e.contentTopics.map(a=>a.topic).slice(0,6).join("、"),o=e.failedCount>0?`其中 ${e.failedCount} 封邮件分析失败，建议稍后重试。

`:"",s=[`会议/面试安排：${e.calendarStats.meetingOrInterviewCount} 封`,`截止事项：${e.calendarStats.deadlineCount} 封`,`多候选时间：${e.calendarStats.candidateTimesCount} 封`,`时间冲突：${e.calendarStats.conflictCount} 封`,`已加入待确认日程：${e.calendarStats.tentativeEventCount} 个`].map(a=>`- ${a}`);return[`本次共分析 ${e.totalEmails} 封未读邮件，其中重要邮件 ${e.importantCount} 封，普通邮件 ${e.normalCount} 封，低优先级邮件 ${e.lowCount} 封。`,"",o.trim(),"主要发件人：",n.length?n.join(`
`):"- 暂无发件人统计","","需要优先处理：",r.length?r.join(`
`):"暂无需要优先处理的邮件。","","邮件内容概览：",i?`本批邮件主要集中在${i}几个方向。`:"暂无足够内容用于主题归纳。","","日程发现：",s.join(`
`),"",`已生成预回复草稿 ${e.draftReplyCount} 封。建议先处理 ${e.importantCount} 封重要邮件，再批量查看普通邮件。`].filter(a=>a!=="").join(`
`)}function lj(e,n){const r=n.filter(s=>!s.error),i=Qk(n),o={batchId:e,createdAt:new Date().toISOString(),totalEmails:n.length,analyzedCount:r.length,failedCount:n.length-r.length,importantCount:r.filter(s=>s.importance==="important").length,normalCount:r.filter(s=>s.importance==="normal").length,lowCount:r.filter(s=>s.importance==="low").length,needReplyCount:r.filter(s=>s.actionType==="need_reply").length,noActionCount:r.filter(s=>s.actionType==="no_action").length,draftReplyCount:r.filter(s=>s.hasDraftReply).length,senderStats:ej(n),categoryStats:tj(n),calendarStats:nj(n),calendarItems:rj(n),contentTopics:i,topImportantEmails:ij(n),actionItems:oj(n)};return{...o,reportText:aj(o),contentOverviewText:sj(n.length,i)}}const uh="aioffice.calendar.events.v1";function ph(){return new Date().toISOString()}function cj(){return typeof crypto<"u"&&"randomUUID"in crypto?`cal-${crypto.randomUUID()}`:`cal-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}function Ns(e,n){return e.startTime.localeCompare(n.startTime)}function Os(){try{const e=localStorage.getItem(uh);if(!e)return[];const n=JSON.parse(e);return Array.isArray(n)?n.sort(Ns):[]}catch{return[]}}function Rc(e){localStorage.setItem(uh,JSON.stringify([...e].sort(Ns)))}async function ji(){return Os()}async function Mc(e){const n=ph(),r={...e,id:cj(),createdAt:n,updatedAt:n},i=[...Os(),r].sort(Ns);return Rc(i),r}async function va(e,n){const r=Os(),i=r.findIndex(a=>a.id===e);if(i<0)return null;const o={...r[i],...n,id:e,createdAt:r[i].createdAt,updatedAt:ph()},s=[...r.slice(0,i),o,...r.slice(i+1)].sort(Ns);return Rc(s),o}async function dj(e){const n=Os(),r=n.filter(i=>i.id!==e);return r.length===n.length?!1:(Rc(r),!0)}const uj=["cancelled","declined","ignored"],pj=30*60*1e3;function Ll(e){if(!e)return null;const n=new Date(e).getTime();return Number.isFinite(n)?n:null}function Du(e,n){const r=Ll(n);return r!==null&&r>e?r:e+pj}function vr(e,n){if(e.eventType==="deadline"||e.eventType==="reminder")return[];const r=Ll(e.startTime);if(r===null)return[];const i=Du(r,e.endTime);return n.filter(o=>{if(o.id===e.id||uj.includes(o.status)||o.eventType==="deadline"||o.eventType==="reminder")return!1;const s=Ll(o.startTime);if(s===null)return!1;const a=Du(s,o.endTime);return r<a&&i>s}).map(o=>({eventId:o.id,title:o.title,startTime:o.startTime,endTime:o.endTime,status:o.status,conflictLevel:e.allDay||o.allDay||o.status==="tentative"?"soft":"hard"}))}function fj(e){return e==="interview"?"interview":e==="deadline"?"deadline":e==="reminder"?"reminder":"meeting"}function mj(e,n){return n!=null&&n.startTime?n.startTime:e.type==="deadline"?e.deadlineTime??null:e.startTime??null}function gj(e,n){if(n)return n.endTime;if(e.endTime||!e.startTime||e.type==="deadline"||e.type==="reminder")return e.endTime;const r=new Date(e.startTime);if(!Number.isFinite(r.getTime()))return e.endTime;const i=new Date(r);return i.setMinutes(i.getMinutes()+(e.type==="interview"?30:60)),i.toISOString()}function fh(e,n,r){var o,s;if(!n.hasTimeRequirement||n.type==="follow_up"||n.type==="none"||n.type==="candidate_times"&&!r.candidateTime)return null;const i=mj(n,r.candidateTime);return i?{title:n.type==="deadline"?`截止：${n.title||e.subject||"截止事项"}`:n.title||e.subject||"日程安排",description:n.description||n.sourceText||void 0,startTime:i,endTime:gj(n,r.candidateTime),timezone:((o=r.candidateTime)==null?void 0:o.timezone)||n.timezone,location:n.location,meetingLink:n.meetingLink,attendees:(s=n.attendees)==null?void 0:s.map(a=>({...a,status:"unknown"})),status:r.status,eventType:fj(n.type),source:r.source,sourceMessageId:e.id,sourceThreadId:e.threadId,sourceEmailSubject:e.subject,sourceEmailFrom:e.fromName?`${e.fromName} <${e.from}>`:e.from,confidence:n.confidence,needsUserConfirmation:r.needsUserConfirmation,conflictEventIds:[]}:null}async function hj(e,n,r){const i=fh(e,n,r);if(!i)return null;const o=await ji(),s=vr({id:"",...i},o);return Mc({...i,conflictEventIds:s.map(a=>a.eventId)})}async function xj(e,n){var u;const r=n.timeIntent;if(!(r!=null&&r.hasTimeRequirement)||r.type==="candidate_times"||r.type==="follow_up"||r.type==="none")return null;const i=await ji(),o=i.find(f=>f.sourceMessageId===e.id&&(f.source==="email_ai"||f.source==="email_user_confirmed")&&f.status!=="ignored"&&f.status!=="cancelled");if(o)return{event:o,conflictCount:((u=o.conflictEventIds)==null?void 0:u.length)??0};const s=fh(e,r,{source:"email_ai",status:"tentative",needsUserConfirmation:!0});if(!s)return null;const a=vr({id:"",...s},i);return{event:await Mc({...s,conflictEventIds:a.map(f=>f.eventId)}),conflictCount:a.length}}const mh=c.createContext(null);function bj(){const e=c.useContext(mh);if(!e)throw new Error("useMailTriage must be used inside MailTriageProvider");return e}const Ot=()=>new Date().toISOString(),wa=500,yj=2;function Ru(e,n,r){const i=r==="system_delivery_notice";return{messageId:e.id,threadId:e.threadId,accountId:n,bodyHash:Gt(e.body),category:"read_only",priority:"low",needsReply:!1,needsUserAction:!1,canAutoArchive:!0,riskLevel:"none",summary:i?(e.subject.trim()||"系统退信通知").slice(0,30):(e.subject.trim()||"附件邮件").slice(0,20),reason:i?"系统退信通知，无需 AI 分析":"单纯附件邮件，无需 AI 分析",suggestedAction:i?"检查收件人地址或域名 SPF/DKIM 配置":"查看附件",status:"skipped",skipReason:r,createdAt:Ot(),updatedAt:Ot()}}function vj(e){return e&&(e.user||e.email)||"local-account"}function wj(e){return e?`ws-${Gt(e)}`:"no-workspace"}function Mu(e){return e.status!=="success"||e.riskLevel==="medium"||e.riskLevel==="high"||e.category==="risk"||e.category==="promotion"||e.category==="archive_candidate"||e.category==="read_only"||e.category==="unknown"?!1:e.category==="reply_required"?e.priority!=="low":e.category==="action_required"?e.needsReply&&e.priority!=="low":!1}function Sj(e){return(e.importance||e.priority)==="high"?"important":(e.importance||e.priority)==="low"?"low":"normal"}function kj(e){var r;const n=(r=e.actionPlan)==null?void 0:r.intentType;return e.needsReply||e.requiresReply||e.category==="reply_required"?"need_reply":e.replyIntent==="forward_to_others"?"need_forward":n==="meeting"||e.emailCategory==="meeting_invitation"?"need_schedule":n==="attachment_review"||e.emailCategory==="document_review"?"need_review":e.category==="risk"||e.emailCategory==="spam"||e.emailCategory==="promotion"?"spam_or_noise":e.needsUserAction||e.requiresAction||e.category==="action_required"?"need_review":e.category==="read_only"||e.emailCategory==="system_notice"||e.emailCategory==="internal_notice"?"notification":"no_action"}function jj(e){return e==="interview"?"interview":e==="deadline"?"deadline":e==="reminder"?"reminder":"meeting"}async function Ij(e,n,r,i){const o=i.timeIntent;if(!(o!=null&&o.hasTimeRequirement))return null;const s=await ji(),a=o.candidateTimes??[];if(o.type==="candidate_times"&&a.length>0){const f=a.map(g=>{const h=vr({id:"",startTime:g.startTime,endTime:g.endTime,eventType:"meeting"},s);return{candidate:g,conflicts:h}}),p=f.find(g=>g.conflicts.length===0)??f[0],m=new Date(p.candidate.startTime).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});return`English:

Dear ${r},

Thank you for sharing the available time options. The time that works best for me is ${m}. Please let me know if this works for you.

Best regards,
${n}

中文：

${r}您好：

感谢您提供候选时间。我更方便的时间是 ${m}，请您确认是否合适。

祝好！
${n}`}const d=o.type==="deadline"?o.deadlineTime:o.startTime;return!d||o.type==="follow_up"?`English:

Dear ${r},

Thank you for your email. Could you please share a specific time or a few available time options so that I can confirm the arrangement?

Best regards,
${n}

中文：

${r}您好：

感谢您的来信。能否请您提供一个具体时间或几个候选时间，以便我确认安排？

祝好！
${n}`:vr({id:"",startTime:d,endTime:o.endTime,eventType:jj(o.type)},s).length>0?`English:

Dear ${r},

Thank you for the arrangement regarding "${o.title||e.subject}". I am sorry, but I already have a commitment during that time. Would it be possible to adjust to another suitable time?

Best regards,
${n}

中文：

${r}您好：

感谢您关于“${o.title||e.subject}”的安排。抱歉，我该时间段已有安排，是否可以调整到其他合适时间？

祝好！
${n}`:`English:

Dear ${r},

Thank you for the arrangement regarding "${o.title||e.subject}". I am available at that time and can attend as scheduled.

Best regards,
${n}

中文：

${r}您好：

感谢您关于“${o.title||e.subject}”的安排。可以，我这个时间有空参加。

祝好！
${n}`}function Fu(e,n,r,i){const o=n.status==="failed";return{messageId:e.id,threadId:e.threadId,fromName:e.fromName,fromEmail:e.from,subject:e.subject,receivedAt:e.timestamp,importance:Sj(n),category:n.emailCategory||n.category,actionType:kj(n),summary:n.summary||e.subject||"（无摘要）",reason:n.reason||n.suggestedAction||"",suggestedReply:n.draftReply,hasDraftReply:!!i,draftId:i==null?void 0:i.id,deadlineText:n.deadline,timeIntent:n.timeIntent,calendarEventId:n.calendarEventId,calendarConflictCount:n.calendarConflictCount,relatedPeople:[e.fromName,e.toName].filter(s=>!!(s!=null&&s.trim())),batchId:r,error:o?n.errorMessage||"分析失败":void 0}}function $j(e,n,r){return{messageId:e.id,threadId:e.threadId,fromName:e.fromName,fromEmail:e.from,subject:e.subject,receivedAt:e.timestamp,importance:"normal",category:"unknown",actionType:"no_action",summary:e.subject||"（无摘要）",reason:"",hasDraftReply:!1,batchId:n,error:r}}async function Sa(e,n,r,i){var g;if(!((g=window.electronAPI)!=null&&g.writingAssistant))return null;const o=(e.toName||e.to||"收件人").trim(),s=(e.fromName||e.from||"发件人").trim(),a=e.body.slice(0,800),d=await Ij(e,o,s,i);if(d){const h={id:`draft-${n}-${e.id}-${Date.now()}`,accountId:n,messageId:e.id,bodyHash:r,triageResultId:`${n}:${e.id}:${r}`,subject:`Re: ${e.subject}`,to:[e.from||""],draftBody:d+`

（本条回复由 AI 自动生成，请确认后再发送。）`,tone:"polite",status:"generated",createdAt:Ot(),updatedAt:Ot()};return xu(h),h}const u=i.actionPlan,f=i.requiresKnowledgeBase?`
This email may require external policy or procedural basis. If no clear basis is available in the email or analysis result, do NOT fabricate policies, deadlines, procedures, or approval requirements — state "pending further confirmation" in both languages.`:"",p=(u==null?void 0:u.intentType)||i.detectedIntent||i.emailCategory||i.category,m=[`You are a professional email reply expert. Write an editable pre-reply draft from the perspective of the recipient "${o}".`,`Requirements:
1. Output the reply body directly — do NOT include a subject line.
2. Automatically determine tone and structure from the email and AI analysis result.
3. Task: confirm todos and deadlines; Request: respond to each item; Inquiry: answer step by step; Notification: brief acknowledgment only if needed; Attachment review: state the attachment handling plan; Approval: be formal, cautious, and flag items needing manual confirmation.
4. Sign with "${o}" at the end of the Chinese section.
5. IMPORTANT — You MUST generate the reply in bilingual format. Use EXACTLY these two section headings:

English:

<English reply body here>

中文：

<Chinese reply body here>

The English version must appear first. The Chinese version must follow. Do NOT omit either section.${f}`,`AI-detected type: ${p}`,`Action plan: ${(u==null?void 0:u.brief)||i.suggestedAction||""}`,`Reply strategy: ${(u==null?void 0:u.replyStrategy.reason)||i.reason||""}`,`
To: ${o} (${e.to||""})
From: ${s} (${e.from||""})
Subject: ${e.subject}
Body:
${a}`].join(`

`);try{const h=await window.electronAPI.writingAssistant({instruction:m,language:"zh"}),x=Ur(h).trim();if(!x)return null;const k={id:`draft-${n}-${e.id}-${Date.now()}`,accountId:n,messageId:e.id,bodyHash:r,triageResultId:`${n}:${e.id}:${r}`,subject:`Re: ${e.subject}`,to:[e.from||""],draftBody:x+`

（本条回复由 AI 自动生成，请确认后再发送。）`,tone:"polite",status:"generated",createdAt:Ot(),updatedAt:Ot()};return xu(k),k}catch{return null}}function Tj({children:e}){const{mails:n,accountConfig:r}=zc(),{activeWorkspacePath:i}=Ft(),{state:o}=rn(),s=vj(r),a=wj(i),d=o.phase==="logged_in"?o.session.user.id:null,[u,f]=c.useState(()=>mu(s)),[p,m]=c.useState({}),[g,h]=c.useState(()=>Mo(s,a)),x=c.useRef([]),k=c.useRef(!1),v=c.useRef(null),[y,j]=c.useState(!1),[S,z]=c.useState("idle"),[P,I]=c.useState({total:0,cached:0,enqueued:0,running:0,done:0,drafts:0,failed:0}),[b,$]=c.useState(null),[O,D]=c.useState([]),[R,V]=c.useState(null),[te,q]=c.useState(!1),W=c.useRef(null),fe=c.useRef(new Set),le=c.useRef({}),Q=c.useRef({}),ge=c.useRef(u),J=c.useRef(p);c.useEffect(()=>{ge.current=u},[u]),c.useEffect(()=>{J.current=p},[p]),c.useEffect(()=>{f(mu(s)),m({}),h(Mo(s,a)),x.current=[],W.current=null,fe.current=new Set,le.current={},Q.current={},$(null),D([]),V(null),q(!1)},[s,a]);const H=c.useCallback(Z=>{const X=Gk(s,a,Z.todos??[]),ye={...Z,todos:X,updatedAt:Ot()};N1(ye),f(Ee=>({...Ee,[ye.messageId]:ye})),h(Mo(s,a))},[s,a]),T=c.useCallback(async(Z,X)=>{const ye=await xj(Z,X);return ye?{...X,calendarEventId:ye.event.id,calendarConflictCount:ye.conflictCount}:X},[]),w=c.useCallback(async(Z,X)=>{const ye=io(X.timeIntent,`${Z.subject}
${Z.body}`,new Date,Z.subject),Ee=ye?{...X,timeIntent:ye}:X,G=await T(Z,Ee);return H(G),G},[T,H]),L=c.useCallback((Z,X,ye)=>{const Ee=W.current;if(!Ee||!fe.current.has(Z.id))return;const G=ye??ro(s,Z.id,Gt(Z.body)),F=Fu(Z,X,Ee,G);Q.current={...Q.current,[Z.id]:X},le.current={...le.current,[Z.id]:F},D(Object.values(le.current))},[s]),N=c.useCallback((Z={})=>{const X=W.current;if(!X){q(!1);return}const ye=new Map(n.map(F=>[F.id,F])),Ee={...J.current,...Z},G=[];for(const F of fe.current){const se=ye.get(F);if(!se)continue;const _e=Q.current[F]??ge.current[F];if(!_e){G.push($j(se,X,"未获得分析结果"));continue}const de=Ee[F]??ro(s,F,Gt(se.body));G.push(Fu(se,_e,X,de))}le.current=Object.fromEntries(G.map(F=>[F.messageId,F])),D(G),V(lj(X,G)),q(!1)},[s,n]),M=c.useCallback(Z=>{v.current!==null&&clearTimeout(v.current),v.current=setTimeout(async()=>{v.current=null;const X=x.current.filter(F=>F.status==="pending");if(X.length===0){k.current=!1,j(!1);return}k.current=!0,j(!0);const ye=X.slice(0,ak),Ee=new Map(n.map(F=>[F.id,F]));for(const F of ye)F.status="running",F.updatedAt=Ot(),f(se=>({...se,[F.messageId]:{...Cj(F,Ee.get(F.messageId)),status:"running"}}));I(F=>({...F,running:F.running+ye.length}));const G=ye.map(F=>Ee.get(F.messageId)).filter(F=>F!==void 0);try{const F=await Uk(G,s);for(const de of F){const oe=ye.find(E=>E.messageId===de.messageId);oe&&(oe.status="success",oe.updatedAt=Ot());const Te=Ee.get(de.messageId),C=Te?await T(Te,de):de;H(C),Te&&L(Te,C)}for(const de of ye)if(de.status==="running"){de.status="failed",de.errorMessage="无匹配结果",de.updatedAt=Ot();const oe=Ee.get(de.messageId);oe&&(f(Te=>({...Te,[de.messageId]:ka(de,oe,"无匹配结果")})),L(oe,ka(de,oe,"无匹配结果")))}const se=ye.filter(de=>de.status==="success").length,_e=ye.filter(de=>de.status==="failed").length;I(de=>({...de,running:Math.max(0,de.running-ye.length),done:de.done+se,failed:de.failed+_e}))}catch(F){const se=F instanceof Error?F.message:String(F);for(const de of ye)if(de.status==="running"){if(de.retryCount++,de.retryCount>=yj){de.status="failed",de.errorMessage=se;const oe=Ee.get(de.messageId);if(oe){const Te=ka(de,oe,se);f(C=>({...C,[de.messageId]:Te})),L(oe,Te)}}else de.status="pending";de.updatedAt=Ot()}const _e=ye.filter(de=>de.status==="failed").length;I(de=>({...de,running:Math.max(0,de.running-ye.length),failed:de.failed+_e}))}M(wa)},Z)},[s,H,L,T]);c.useEffect(()=>()=>{v.current!==null&&clearTimeout(v.current)},[]),c.useEffect(()=>{if(y||S!=="running")return;const Z=new Map(n.map(G=>[G.id,G])),X=[];for(const G of fe.current){const F=Q.current[G]??u[G];if(!F||!Mu(F))continue;const se=Z.get(G);if(!se)continue;const _e=Gt(se.body);hu(s,G,_e)||X.push({mail:se,result:F,bodyHash:_e})}const ye=x.current.some(G=>G.status==="failed");X.length>0?(async()=>{let G=0;const F={};for(const{mail:se,result:_e,bodyHash:de}of X){const oe=await Sa(se,s,de,_e);oe&&(G++,F[se.id]=oe,m(Te=>({...Te,[se.id]:oe})),L(se,_e,oe))}I(se=>({...se,drafts:se.drafts+G})),N(F),d&&G>0&&to(d,"mail","ai_reply_draft_generated",{workspaceId:a,summary:`生成了 ${G} 封邮件预回复`,metadata:{draftCount:G}}),z(ye?"failed":"done")})():(N(),z(ye?"failed":"done"));const Ee=setTimeout(()=>z(G=>G==="done"||G==="failed"?"idle":G),8e3);return()=>clearTimeout(Ee)},[y]);const A=c.useCallback(async()=>{var G;x.current=[],k.current=!1,fe.current=new Set,le.current={},Q.current={},D([]),V(null);const Z=n.filter(F=>F.unread&&F.folder!=="sent"&&F.folder!=="trash");if(Z.length===0){I({total:0,cached:0,enqueued:0,running:0,done:0,drafts:0,failed:0}),z("idle"),j(!1),q(!1),$(null),W.current=null,(G=window.alert)==null||G.call(window,"当前没有需要分析的未读邮件。");return}const X=`mail-analysis-${Date.now()}`;W.current=X,fe.current=new Set(Z.map(F=>F.id)),$(X),q(!0);let ye=0,Ee=0;for(const F of Z){const se=Gt(F.body);if(bk(F)){const Te=_o(s,F.id,se);if((Te==null?void 0:Te.status)==="success"){const C=await w(F,Te);L(F,C)}else{const C=Ru(F,s,"attachment_only");H(C),L(F,C)}ye++;continue}if(xk(F)){const Te=_o(s,F.id,se);if((Te==null?void 0:Te.status)==="success"){const C=await w(F,Te);L(F,C)}else{const C=Ru(F,s,"system_delivery_notice");H(C),L(F,C)}ye++;continue}const _e=Lk(F,s);if(_e){const Te=_o(s,F.id,se);if(Te){const C=await w(F,Te);L(F,C)}else{const C=await T(F,_e);H(C),L(F,C)}ye++;continue}const de=_o(s,F.id,se);if(de){const Te=await w(F,de);L(F,Te),ye++;continue}const oe={id:`${F.id}-${Date.now()}`,accountId:s,messageId:F.id,bodyHash:se,status:"pending",retryCount:0,createdAt:Ot(),updatedAt:Ot()};x.current.push(oe),Ee++}if(I({total:Z.length,cached:ye,enqueued:Ee,running:0,done:0,drafts:0,failed:0}),z("running"),j(Ee>0),d&&to(d,"mail","ai_mail_analysis_started",{workspaceId:a,summary:`开始 AI 邮件分析：${Z.length} 封邮件`,metadata:{total:Z.length,cached:ye,enqueued:Ee,batchId:X}}),Ee>0)M(wa);else{k.current=!1;const F=new Map(n.map(se=>[se.id,se]));(async()=>{let se=0;const _e={};for(const de of fe.current){const oe=Q.current[de]??u[de];if(!oe||!Mu(oe))continue;const Te=F.get(de);if(!Te)continue;const C=Gt(Te.body);if(hu(s,de,C)){const K=ro(s,de,C);K&&(m(_=>({..._,[de]:K})),L(Te,oe,K));continue}const E=await Sa(Te,oe.accountId,C,oe);E&&(se++,_e[de]=E,m(K=>({...K,[de]:E})),L(Te,oe,E))}I(de=>({...de,drafts:de.drafts+se})),N(_e),d&&to(d,"mail","ai_mail_analysis_completed",{workspaceId:a,summary:`完成 AI 邮件分析：${Z.length} 封邮件，生成 ${Mo(s,a).length} 条待办`,metadata:{total:Z.length,cached:ye,enqueued:Ee,draftsGenerated:se,batchId:X}}),z("done"),setTimeout(()=>z(de=>de==="done"?"idle":de),8e3)})()}},[n,u,s,H,L,N,M,d,a,T,w]),ee=c.useCallback(Z=>{const X=n.find(G=>G.id===Z);if(!X)return;const ye=Gt(X.body);x.current=x.current.filter(G=>G.messageId!==Z);const Ee={id:`${X.id}-${Date.now()}`,accountId:s,messageId:Z,bodyHash:ye,status:"pending",retryCount:0,createdAt:Ot(),updatedAt:Ot()};x.current.push(Ee),z("running"),j(!0),M(wa)},[n,s,M]),me=c.useCallback(async Z=>{const X=n.find(F=>F.id===Z);if(!X)return;const ye=Gt(X.body),Ee=u[Z];if(!Ee)return;const G=await Sa(X,s,ye,Ee);G&&m(F=>({...F,[Z]:G}))},[n,u,s]),Ie=c.useCallback(Z=>{m(X=>{if(!X[Z])return X;th(s,Z,X[Z].bodyHash,"discarded");const ye={...X};return delete ye[Z],ye})},[s]),Fe=c.useMemo(()=>({triageResults:u,aiDrafts:p,mailTodos:g,triggerAnalysis:A,enqueueMail:ee,regenerateDraft:me,discardDraft:Ie,analysisStatus:S,analysisProgress:P,currentAnalysisBatchId:b,currentBatchResults:O,currentBatchSummary:R,isAnalyzingEmails:te,isWorkerRunning:y}),[u,p,g,A,ee,me,Ie,S,P,b,O,R,te,y]);return t.jsx(mh.Provider,{value:Fe,children:e})}function Cj(e,n){var r;return{messageId:e.messageId,accountId:e.accountId,bodyHash:e.bodyHash,category:"unknown",priority:"medium",needsReply:!1,needsUserAction:!1,canAutoArchive:!1,riskLevel:"none",summary:((r=n==null?void 0:n.subject)==null?void 0:r.slice(0,20))??"",reason:"",suggestedAction:"",status:"pending",createdAt:e.createdAt,updatedAt:Ot()}}function ka(e,n,r){return{messageId:e.messageId,accountId:e.accountId,bodyHash:e.bodyHash,category:"unknown",priority:"medium",needsReply:!1,needsUserAction:!1,canAutoArchive:!1,riskLevel:"none",summary:n.subject.slice(0,20),reason:"",suggestedAction:"",status:"failed",errorMessage:r,createdAt:e.createdAt,updatedAt:Ot()}}const Ss="email:";function hi(e){return e.startsWith(Ss)?e:`${Ss}${e}`}function gr(e){return e.startsWith(Ss)?e.slice(Ss.length):e}function Pj(e){const n=hi(e.id),r=e.folder==="sent";return{id:n,threadId:n,from:e.from,fromName:e.fromName,to:e.to,toName:e.toName,body:e.body,htmlBody:e.htmlBody,timestamp:e.timestamp,isIncoming:!r,attachments:(e.attachments??[]).map(i=>({id:`${n}::${i.filename}`,filename:i.filename,contentType:i.contentType,size:i.size,tempPath:i.tempPath})),providerType:"email"}}function ja(e,n){return e.map(r=>{var a;const i=Pj(r),o=r.folder==="sent",s={id:hi(r.id),providerType:"email",subject:r.subject,participants:o?[r.to,r.from]:[r.from,r.to],participantNames:o?[r.toName,r.fromName]:[r.fromName,r.toName],lastMessage:i,unread:r.unread,hasAttachments:(((a=r.attachments)==null?void 0:a.length)??0)>0,replied:r.replied,messages:[i],folder:r.folder??"inbox"};return n&&(s.sourceAccount=n),s})}const gh=`

（本条回复由 AI 自动生成，请确认后再发送。）`;function Aj(e){const{thread:n,targetMessage:r,responderName:i="用户",tone:o="friendly"}=e,s=o==="professional"?"正式、专业":o==="concise"?"极简，一句话即可":"自然、友好",a=n.messages.slice(-6).map(u=>`${u.isIncoming?u.fromName:i}: ${u.body}`).join(`
`),d=e.knowledgeContext?`

知识库参考资料（仅在与本次回复直接相关时参考，不要照搬原文）：
${e.knowledgeContext}`:"";return`你是一个即时通信助手，帮助用户回复聊天消息。

要求：
1. 直接输出回复内容，不要加任何前缀
2. 语气${s}
3. 使用中文
4. 不超过3句话，简短自然，符合聊天习惯
5. 针对最新消息做出直接回应

最近对话记录：
${a}${d}

请回复最后一条消息："${r.body}"`}function _j(e){return"好的，我知道了。稍后回复您。"}async function Ej(e,n,r){const i=e+gh;await new Promise(o=>{let s=0;const a=()=>{if(r!=null&&r.aborted){n.onError("已取消"),o();return}s+=Math.floor(Math.random()*6)+4,s>=i.length?(n.onDelta(i),n.onComplete(i),o()):(n.onDelta(i.slice(0,s)),setTimeout(a,25))};setTimeout(a,300)})}async function zj(e,n,r){const i=Aj(e);let o=!1;try{let s="";if(await pi({instruction:i,language:"zh"},{onDelta:(a,d)=>{r!=null&&r.aborted||n.onDelta(d)},onComplete:({text:a})=>{s=a.trim()},onError:()=>{o=!0}},r),!o&&s){const a=s+gh;n.onDelta(a),n.onComplete(a);return}o=!0}catch{o=!0}o&&await Ej(_j(),n,r)}const ks=m1;function Bu(){try{return new URL(ks).host}catch{return ks}}async function Hr(e,n={},r=12e3){const{accessToken:i,headers:o,...s}=n,a=`${ks}${e}`,d={"Content-Type":"application/json",...i?{Authorization:`Bearer ${i}`}:{},...o??{}},u=new AbortController,f=setTimeout(()=>u.abort(),r);try{const p=await fetch(a,{...s,headers:d,signal:u.signal});if(!p.ok){let m={};try{m=await p.json()}catch{}throw p.status===401?Object.assign(new Error("即时通讯登录已失效，请重新登录"),{code:"M_UNKNOWN_TOKEN"}):p.status===403?new Error(m.error??"操作被拒绝（403）"):p.status===429?new Error("请求频率过高，请稍候再试"):new Error(m.error??`Matrix API 错误 (${p.status})`)}return p.json()}catch(p){if(p.name==="AbortError")throw Object.assign(new Error(`无法连接内部通讯服务器：${Bu()}`),{code:"TIMEOUT"});const m=p.message??"";throw m.includes("登录已失效")||m.includes("已被禁用")||m.includes("Matrix")?p:m.includes("Failed to fetch")||m.includes("NetworkError")||m.includes("fetch")?new Error(`无法连接内部通讯服务器：${Bu()}`):p}finally{clearTimeout(f)}}async function Lu(e,n){try{return await Hr("/_matrix/client/r0/login",{method:"POST",body:JSON.stringify({type:"m.login.password",identifier:{type:"m.id.user",user:e},password:n})})}catch(r){const i=r.message??"";throw i.includes("403")||i.includes("Invalid")||i.includes("Forbidden")?new Error("即时通讯账号或密码错误"):r}}async function Dj(e){return Hr("/_matrix/client/v3/account/whoami",{accessToken:e})}async function Rj(e,n,r=0){const i=new URLSearchParams;n&&i.set("since",n),i.set("timeout",String(r)),n||i.set("filter",JSON.stringify({room:{timeline:{limit:30}}}));const o=`?${i.toString()}`,s=r>0?r+1e4:15e3;return Hr(`/_matrix/client/v3/sync${o}`,{accessToken:e},s)}async function Nu(e,n,r,i){return Hr(`/_matrix/client/v3/rooms/${encodeURIComponent(n)}/send/m.room.message/${encodeURIComponent(i)}`,{method:"PUT",accessToken:e,body:JSON.stringify({msgtype:"m.text",body:r})})}async function Ou(e,n,r,i){return Hr(`/_matrix/client/v3/rooms/${encodeURIComponent(n)}/send/m.room.message/${encodeURIComponent(r)}`,{method:"PUT",accessToken:e,body:JSON.stringify(i)})}async function Wu(e,n){const r=`${ks}/_matrix/media/v3/upload?filename=${encodeURIComponent(n.name)}`,i=new AbortController,o=setTimeout(()=>i.abort(),12e4);try{const s=await fetch(r,{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":n.type||"application/octet-stream"},body:n,signal:i.signal});if(!s.ok){let d={};try{d=await s.json()}catch{}throw new Error(d.error??`媒体上传失败 (${s.status})`)}return{contentUri:(await s.json()).content_uri}}catch(s){throw s.name==="AbortError"?new Error("媒体上传超时"):s}finally{clearTimeout(o)}}async function Mj(e,n){try{return await Hr("/_matrix/client/v3/createRoom",{method:"POST",accessToken:e,body:JSON.stringify({visibility:"private",is_direct:!0,invite:[n],preset:"trusted_private_chat"})})}catch(r){const i=r.message??"";throw i.includes("403")||i.includes("not found")||i.includes("unknown")?new Error(`无法创建私聊，请检查对方 Matrix ID：${n}`):r}}async function Fj(e,n){try{return await Hr(`/_matrix/client/v3/rooms/${encodeURIComponent(n)}/join`,{method:"POST",accessToken:e,body:JSON.stringify({})})}catch(r){const i=r.message??"";throw new Error(`加入房间失败：${i}`)}}const hh=c.createContext(null);function xh(){const e=c.useContext(hh);if(!e)throw new Error("useMatrixChat must be used inside MatrixChatProvider");return e}function Bj(e){var r;const n=new Map;for(const i of((r=e.account_data)==null?void 0:r.events)??[])if(i.type==="m.direct")for(const[o,s]of Object.entries(i.content))for(const a of s)n.set(a,o);return n}function Nl(e){const n=/^@([^:]+):/.exec(e);return n?n[1]:e}function Lj(e,n,r,i){var f,p,m;const o=Bj(e),s=new Map(n.map(g=>[g.roomId,g])),a={...r};for(const[g,h]of Object.entries(((f=e.rooms)==null?void 0:f.join)??{})){const x=s.get(g),k=[...h.state.events,...h.timeline.events];let v=(x==null?void 0:x.name)??"";for(const D of k)D.type==="m.room.name"&&typeof D.content.name=="string"&&(v=D.content.name);const y=new Map(((x==null?void 0:x.members)??[]).map(D=>[D.userId,D]));for(const D of k)if(D.type==="m.room.member"&&typeof D.state_key=="string"){const R=D.content.membership,V=D.content.displayname;(R==="join"||R==="invite"||R==="leave"||R==="ban")&&y.set(D.state_key,{userId:D.state_key,displayName:V||void 0,membership:R})}const j=Array.from(y.values()),S=o.has(g)||((x==null?void 0:x.isDirect)??!1),z=o.get(g)??(x==null?void 0:x.directUserId);if(!v&&S&&z&&(v=Nl(z)),!v&&j.length>0){const D=j.find(R=>R.userId!==i&&(R.membership==="join"||R.membership==="invite"));D&&(v=D.displayName??Nl(D.userId))}const P=a[g]??[],I=new Set(P.map(D=>D.eventId)),b=[];for(const D of h.timeline.events){if(D.type!=="m.room.message"||I.has(D.event_id))continue;const R=String(D.content.msgtype??"m.text");if(R!=="m.text"&&R!=="m.image"&&R!=="m.file")continue;const V=D.content.info;b.push({eventId:D.event_id,sender:D.sender,body:String(D.content.body??""),msgtype:R,timestamp:D.origin_server_ts,url:typeof D.content.url=="string"?D.content.url:void 0,mimetype:V==null?void 0:V.mimetype,size:V==null?void 0:V.size,width:V==null?void 0:V.w,height:V==null?void 0:V.h})}const $=[...P,...b].sort((D,R)=>D.timestamp-R.timestamp);a[g]=$.slice(-200);const O=a[g][a[g].length-1];s.set(g,{roomId:g,name:v,isDirect:S,directUserId:z,members:j,lastTs:(O==null?void 0:O.timestamp)??(x==null?void 0:x.lastTs)??Date.now(),lastMessage:O})}const d=[];for(const[g,h]of Object.entries(((p=e.rooms)==null?void 0:p.invite)??{})){const k=(((m=h.invite_state)==null?void 0:m.events)??[]).find(v=>v.type==="m.room.member"&&v.state_key===i&&v.content.membership==="invite");k&&(console.debug("[Matrix] Invite detected:",{roomId:g,inviterUserId:k.sender}),d.push({roomId:g,inviterUserId:k.sender}))}return{rooms:Array.from(s.values()).sort((g,h)=>h.lastTs-g.lastTs),messagesByRoom:a,pendingInvites:d}}function Nj({children:e}){const{state:n,getSessionPassword:r}=rn(),[i,o]=c.useState("idle"),[s,a]=c.useState(null),[d,u]=c.useState(null),[f,p]=c.useState([]),[m,g]=c.useState(null),[h,x]=c.useState({}),[k,v]=c.useState(!1),[y,j]=c.useState(null),[S,z]=c.useState(0),P=c.useRef(void 0),I=c.useRef(null),b=c.useRef([]),$=c.useRef({}),O=c.useRef(null);c.useEffect(()=>{I.current=d},[d]),c.useEffect(()=>{b.current=f},[f]),c.useEffect(()=>{$.current=h},[h]);function D(){u(null),p([]),x({}),g(null),a(null),j(null),P.current=void 0,I.current=null,b.current=[],$.current={},O.current=null}c.useEffect(()=>{if(n.phase!=="logged_in")return;let H=!1;return(async()=>{var M;const w=n;if(w.phase!=="logged_in"){o("needs_login");return}const L=w.session.user.username,N=`@${L}:aioffice.cuhksz`;if(!(i==="logged_in"&&((M=I.current)==null?void 0:M.userId)===N)){I.current&&I.current.userId!==N&&(console.debug("[Matrix] Clearing stale session (owner mismatch):",I.current.userId,"→",N),D(),await window.electronAPI.matrixClearSession().catch(()=>{})),o("restoring");try{const{session:A}=await window.electronAPI.matrixGetSession();if(H)return;if(A!=null&&A.accessToken)if(A.userId!==N)console.debug("[Matrix] Stored session userId mismatch — clearing:",A.userId,"≠",N),await window.electronAPI.matrixClearSession().catch(()=>{});else try{const me=await Dj(A.accessToken);if(me.user_id!==N)throw new Error(`whoami user_id mismatch: ${me.user_id} ≠ ${N}`);H||(O.current=L,u(A),o("logged_in"),P.current=void 0);return}catch{await window.electronAPI.matrixClearSession().catch(()=>{})}if(H)return;const ee=r();if(ee)try{const me=await Lu(L,ee),Ie={userId:me.user_id,accessToken:me.access_token,homeserver:me.home_server,deviceId:me.device_id};if(Ie.userId!==N){console.warn("[Matrix] Login returned unexpected userId:",Ie.userId,"≠",N),H||o("needs_login");return}await window.electronAPI.matrixSetSession(Ie),H||(O.current=L,u(Ie),o("logged_in"),P.current=void 0)}catch{H||o("needs_login")}else H||o("needs_login")}catch{H||o("needs_login")}}})(),()=>{H=!0}},[n.phase]),c.useEffect(()=>{if(i!=="logged_in"||!d)return;let H=!1,T;const w=async()=>{if(!H){v(!0),j(null);try{const L=P.current,N=L?5e3:0,M=await Rj(d.accessToken,L,N);if(H)return;P.current=M.next_batch;const{rooms:A,messagesByRoom:ee,pendingInvites:me}=Lj(M,b.current,$.current,d.userId);if(b.current=A,$.current=ee,p(A),x(ee),!H&&me.length>0)for(const{roomId:Ie,inviterUserId:Fe}of me){if(H)break;if(!b.current.some(Z=>Z.roomId===Ie))try{await Fj(d.accessToken,Ie),console.debug("[Matrix] Auto-joined:",Ie,"invited by",Fe);const Z={roomId:Ie,name:Nl(Fe),isDirect:!0,directUserId:Fe,members:[{userId:d.userId,membership:"join"},{userId:Fe,membership:"join"}],lastTs:Date.now(),lastMessage:void 0};b.current=[Z,...b.current.filter(X=>X.roomId!==Ie)],H||p([...b.current])}catch(Z){console.warn("[Matrix] Auto-join failed for",Ie,":",Z.message)}}H||(T=setTimeout(w,500))}catch(L){if(H)return;const N=L.message??"消息同步失败";if(L.code==="M_UNKNOWN_TOKEN"){await window.electronAPI.matrixClearSession(),u(null),o("needs_login"),a("即时通讯登录已失效，请重新登录");return}j(N),H||(T=setTimeout(w,5e3))}finally{H||v(!1)}}};return w(),()=>{H=!0,clearTimeout(T)}},[i,d,S]),c.useEffect(()=>{(n.phase==="idle"||n.phase==="error")&&(o("idle"),D())},[n.phase]);const R=c.useCallback(async H=>{if(n.phase!=="logged_in")throw new Error("请先登录内部账号");const T=n.session.user.username;o("logging_in"),a(null);try{const w=await Lu(T,H),L={userId:w.user_id,accessToken:w.access_token,homeserver:w.home_server,deviceId:w.device_id};await window.electronAPI.matrixSetSession(L),P.current=void 0,u(L),o("logged_in")}catch(w){throw o("needs_login"),a(w.message??"登录失败"),w}},[n]),V=c.useCallback(async()=>{await window.electronAPI.matrixClearSession(),D(),o("needs_login"),j(null)},[]),te=c.useCallback(H=>{g(H)},[]),q=c.useCallback(async H=>{if(!I.current||!m)return;const T=`ai-office-${Date.now()}-${Math.random().toString(36).slice(2)}`;await Nu(I.current.accessToken,m,H,T)},[m]),W=c.useCallback(async(H,T)=>{if(!I.current)throw new Error("Matrix 未登录");const w=`ai-office-${Date.now()}-${Math.random().toString(36).slice(2)}`;console.debug("[Matrix] Sending message:",{from:I.current.userId,roomId:H});const L=await Nu(I.current.accessToken,H,T,w);console.debug("[Matrix] Message sent:",{eventId:L.event_id,roomId:H})},[]),fe=c.useCallback(async H=>{var A;if(!I.current)throw new Error("未登录即时通讯");const T=b.current.find(ee=>{var me;return ee.isDirect&&(ee.directUserId===H||((me=ee.members)==null?void 0:me.some(Ie=>Ie.userId===H)))});if(T)return console.debug("[Matrix] Reusing existing DM room:",T.roomId,"with",H),g(T.roomId),T.roomId;console.debug("[Matrix] Creating DM room with:",H);const{room_id:w}=await Mj(I.current.accessToken,H);console.debug("[Matrix] DM room created:",w);const L=((A=H.match(/^@([^:]+):/))==null?void 0:A[1])??H,N=I.current.userId,M={roomId:w,name:L,isDirect:!0,directUserId:H,members:[{userId:N,membership:"join"},{userId:H,membership:"invite"}],lastTs:Date.now(),lastMessage:void 0};return b.current=[M,...b.current.filter(ee=>ee.roomId!==w)],p([...b.current]),g(w),w},[]),le=c.useCallback(async(H,T)=>{if(!I.current)throw new Error("Matrix 未登录");let w,L;try{const A=URL.createObjectURL(T),ee=new window.Image;await new Promise(me=>{ee.onload=()=>me(),ee.onerror=()=>me(),ee.src=A}),ee.naturalWidth&&(w=ee.naturalWidth),ee.naturalHeight&&(L=ee.naturalHeight),URL.revokeObjectURL(A)}catch{}const{contentUri:N}=await Wu(I.current.accessToken,T),M=`ai-office-${Date.now()}-${Math.random().toString(36).slice(2)}`;await Ou(I.current.accessToken,H,M,{msgtype:"m.image",body:T.name,url:N,info:{mimetype:T.type||"image/jpeg",size:T.size,...w&&L?{w,h:L}:{}}}),console.debug("[Matrix] Image sent:",{roomId:H,filename:T.name})},[]),Q=c.useCallback(async(H,T)=>{if(!I.current)throw new Error("Matrix 未登录");const{contentUri:w}=await Wu(I.current.accessToken,T),L=`ai-office-${Date.now()}-${Math.random().toString(36).slice(2)}`;await Ou(I.current.accessToken,H,L,{msgtype:"m.file",body:T.name,url:w,info:{mimetype:T.type||"application/octet-stream",size:T.size}}),console.debug("[Matrix] File sent:",{roomId:H,filename:T.name})},[]),ge=c.useCallback(()=>{j(null),z(H=>H+1)},[]),J={phase:i,error:s,session:d,rooms:f,currentRoomId:m,messagesByRoom:h,syncing:k,syncError:y,login:R,logout:V,selectRoom:te,sendMessage:q,sendMessageToRoom:W,sendImageMessage:le,sendFileMessage:Q,createDirectRoom:fe,retrySync:ge};return t.jsx(hh.Provider,{value:J,children:e})}const Vr=()=>new Date().toISOString(),bh=c.createContext(null);function yh(){const e=c.useContext(bh);if(!e)throw new Error("useCommunication must be used inside CommunicationProvider");return e}function Uu(e){var n;return((n=e.match(/^@([^:]+):/))==null?void 0:n[1])??e}function Oj(e,n){if(e.directUserId)return{peerUserId:e.directUserId,peerDisplayName:null};if(e.members&&n){const r=e.members.find(i=>i.userId!==n&&(i.membership==="join"||i.membership==="invite"));if(r)return{peerUserId:r.userId,peerDisplayName:r.displayName??null}}return{peerUserId:null,peerDisplayName:null}}function Wj(e,n,r){return e.map(i=>{const{peerUserId:o,peerDisplayName:s}=Oj(i,r),a=s??(o?Uu(o):null),d=i.name||a||o||"未知联系人",u=(()=>{if(s)return s;if(!o||!i.members)return a;const x=i.members.find(k=>k.userId===o);return(x==null?void 0:x.displayName)??a})(),p=(n[i.roomId]??[]).map(x=>({id:`matrix:${x.eventId}`,threadId:`matrix:${i.roomId}`,from:x.sender,fromName:Uu(x.sender),body:x.body,timestamp:new Date(x.timestamp).toISOString(),isIncoming:r?x.sender!==r:!0,attachments:[],providerType:"chat",chatMsgtype:x.msgtype,mxcUrl:x.url,mimetype:x.mimetype,fileSize:x.size,imageWidth:x.width,imageHeight:x.height})),m=p[p.length-1]??null,g=o??"",h=u??o??"未知联系人";return{id:`matrix:${i.roomId}`,providerType:"chat",subject:d,participants:[g],participantNames:[h],lastMessage:m,unread:!1,hasAttachments:!1,replied:!1,messages:p}})}function Uj(e){const n=e.match(/<([^>]+)>/);return(n?n[1]:e).trim().toLowerCase()}function Hj({children:e,mode:n="all"}){var T;const r=zc(),i=xh(),{state:o}=rn(),s=n==="email"?"email":n==="chat"?"chat":"all",[a,d]=c.useState({}),[u,f]=c.useState(""),[p,m]=c.useState(s),[g,h]=c.useState(null),x=c.useRef(null),k=c.useRef(null),v=o.phase==="logged_in"?o.session.user.email??null:null;c.useEffect(()=>{(o.phase==="idle"||o.phase==="error")&&(h(null),m(s),d({}))},[o.phase]);const y=c.useMemo(()=>ja(r.mails,v??void 0),[r.mails,v]),j=c.useMemo(()=>{const w=ja(r.sentMails,v??void 0);return v?w.filter(L=>{var A;const N=((A=L.lastMessage)==null?void 0:A.from)??"";if(!N)return!0;const M=Uj(N);return!(M&&M!==v.toLowerCase())}):[]},[r.sentMails,v]),S=c.useMemo(()=>ja(r.trashMails,v??void 0),[r.trashMails,v]),z=c.useMemo(()=>{var w;return i.phase==="logged_in"?Wj(i.rooms,i.messagesByRoom,(w=i.session)==null?void 0:w.userId):[]},[i.phase,i.rooms,i.messagesByRoom,(T=i.session)==null?void 0:T.userId]),P=c.useMemo(()=>[...y,...z],[y,z]),I=c.useMemo(()=>[...y,...j,...S,...z],[y,j,S,z]);c.useEffect(()=>{p==="sent"&&r.fetchSentMails(),p==="trash"&&r.fetchTrashMails()},[p]);const b=c.useMemo(()=>{switch(p){case"email":return P.filter(w=>w.providerType==="email");case"chat":return P.filter(w=>w.providerType==="chat");case"sent":return j;case"trash":return S;case"unread":return P.filter(w=>w.unread);case"has-attachment":return P.filter(w=>w.hasAttachments);default:return n==="email"?P.filter(w=>w.providerType==="email"):n==="chat"?P.filter(w=>w.providerType==="chat"):P}},[P,j,S,p]);c.useEffect(()=>{if(!g)return;b.some(L=>L.id===g)||(h(null),r.selectMail(null),i.selectRoom(null))},[p]),c.useEffect(()=>{if(!g)return;I.some(L=>L.id===g)||h(null)},[I]);const $=c.useMemo(()=>g?I.find(w=>w.id===g)??null:null,[I,g]),O=c.useCallback(w=>{h(w);const L=w?I.find(N=>N.id===w):null;(L==null?void 0:L.providerType)==="email"?r.selectMail(gr(w)):w!=null&&w.startsWith("matrix:")?i.selectRoom(w.slice(7)):w||(r.selectMail(null),i.selectRoom(null))},[I,r,i]);c.useEffect(()=>{if(!r.selectedMailId)return;const w=hi(r.selectedMailId);w!==g&&h(w)},[r.selectedMailId]);const D=c.useMemo(()=>{if(!g||!$)return null;if($.providerType==="email"){const w=r.currentDraft;return w?{threadId:g,content:w.content,status:w.status,dirty:w.dirty,userEdited:w.userEdited,attachments:(w.attachments??[]).map(L=>({filename:L.filename,path:L.path,size:L.size,contentType:L.contentType})),generatedAt:w.generatedAt,updatedAt:w.updatedAt,errorMessage:w.errorMessage}:null}return a[g]??null},[g,$,r.currentDraft,a]),R=c.useCallback((w,L="friendly",N="")=>{var me;const M=[...w.messages].reverse().find(Ie=>Ie.isIncoming);if(!M)return;(me=x.current)==null||me.abort();const A=new AbortController;x.current=A,k.current=w.id;const ee=w.id;d(Ie=>({...Ie,[ee]:{threadId:ee,content:"",status:"generating",dirty:!1,userEdited:!1,attachments:[]}})),f(""),zj({thread:w,targetMessage:M,responderName:"王明",tone:L},{onDelta:Ie=>{A.signal.aborted||f(Ie)},onComplete:Ie=>{A.signal.aborted||(k.current=null,f(""),d(Fe=>({...Fe,[ee]:{...Fe[ee],content:Ie,status:"generated",dirty:!1,userEdited:!1,generatedAt:Vr(),updatedAt:Vr()}})))},onError:Ie=>{A.signal.aborted||(k.current=null,f(""),d(Fe=>({...Fe,[ee]:{...Fe[ee]??{threadId:ee,attachments:[]},content:N,status:"error",errorMessage:Ie,updatedAt:Vr()}})))}},A.signal)},[]),V=c.useCallback(w=>{if($){if($.providerType==="email"){r.generateDraft(w);return}a[$.id]||k.current!==$.id&&R($)}},[$,a,r,R]),te=c.useCallback((w=!1,L)=>{var ee,me;if(!$)return;if($.providerType==="email"){r.regenerateDraft(w,L);return}const N=$.id,M=((ee=a[N])==null?void 0:ee.content)??"";(me=x.current)==null||me.abort(),k.current=null;const A=$;setTimeout(()=>R(A,"friendly",M),50)},[$,a,r,R]),q=c.useCallback(w=>{if(!$)return;if($.providerType==="email"){r.updateDraftContent(w);return}const L=$.id;d(N=>{const A=N[L]??{threadId:L,content:"",status:"edited",dirty:!1,userEdited:!1,attachments:[]};return{...N,[L]:{...A,content:w,status:"edited",dirty:!0,userEdited:!0,updatedAt:Vr()}}})},[$,r]),W=c.useCallback(()=>{$&&$.providerType==="email"&&r.saveDraft()},[$,r]),fe=c.useCallback(w=>{if($){if($.providerType==="email"){r.addReplyAttachment(w);return}d(L=>{const N=L[$.id];if(!N)return L;const M=N.attachments??[];return M.some(A=>A.path===w.path)?L:{...L,[$.id]:{...N,attachments:[...M,w],dirty:!0,updatedAt:Vr()}}})}},[$,r]),le=c.useCallback(w=>{if($){if($.providerType==="email"){r.removeReplyAttachment(w);return}d(L=>{const N=L[$.id];return N?{...L,[$.id]:{...N,attachments:N.attachments.filter(M=>M.path!==w),dirty:!0,updatedAt:Vr()}}:L})}},[$,r]),Q=c.useCallback(()=>{if(!$)return;if($.providerType==="email"){r.sendReply();return}const w=$.id,L=a[w];if(L!=null&&L.content){if(w.startsWith("matrix:")){const N=w.slice(7);d(M=>({...M,[w]:{...M[w],status:"sending"}})),(async()=>{try{await i.sendMessageToRoom(N,L.content),d(M=>{const{[w]:A,...ee}=M;return ee})}catch(M){d(A=>({...A,[w]:{...A[w],status:"error",errorMessage:M.message??"发送失败"}}))}})();return}d(N=>{const{[w]:M,...A}=N;return A})}},[$,a,r,i]),ge=($==null?void 0:$.providerType)==="chat"?u:r.streamingPreview,J=c.useCallback(async w=>{const L=await i.createDirectRoom(w);h(`matrix:${L}`)},[i]),H=c.useMemo(()=>({threads:P,filteredThreads:b,selectedThreadId:g,selectedThread:$,activeFilter:p,setActiveFilter:m,selectThread:O,currentDraft:D,streamingPreview:ge,generateDraft:V,regenerateDraft:te,updateDraftContent:q,saveDraft:W,addDraftAttachment:fe,removeDraftAttachment:le,sendReply:Q,isRealEmailMode:r.isRealMode,isFetchingMails:r.isFetchingMails,fetchError:r.fetchError,refreshMails:r.refreshMails,emailAccountConfig:r.accountConfig,saveEmailAccount:r.saveAccount,clearEmailAccount:r.clearAccount,sendBlank:r.sendBlank,deleteMail:r.deleteMail,restoreMail:r.restoreMail,refreshSent:r.fetchSentMails,refreshTrash:r.fetchTrashMails,matrixPhase:i.phase,createMatrixDirect:J}),[P,b,g,$,p,O,D,ge,V,te,q,W,fe,le,Q,r.isRealMode,r.isFetchingMails,r.fetchError,r.refreshMails,r.accountConfig,r.saveAccount,r.clearAccount,r.sendBlank,r.deleteMail,r.restoreMail,r.fetchSentMails,r.fetchTrashMails,i.phase,J]);return t.jsx(bh.Provider,{value:H,children:e})}const Kj=new Set(["您好","谢谢","感谢","会议","时间","安排","确认","邮件","工作","请","希望","关于","以下","相关","问题","情况","内容","处理","进行","完成","需要","可以","应该","建议","通知","附件","日程","参加","参与","联系","回复","the","a","an","is","are","was","were","to","of","in","and","for","this","that","with","have","will","be","at","by","from","or","on","it","as","we","you","i","he","she","they","our","your","has","had","not","can","please"]);function Gj(e){const n=new Map;for(const r of e){const i=r.text,o=i.match(/[\u4e00-\u9fa5]{2,10}/g)??[],s=i.match(/[A-Za-z][A-Za-z0-9]{3,}/g)??[];for(const a of[...o,...s])Kj.has(a)||n.set(a,(n.get(a)??0)+1)}return Array.from(n.entries()).filter(([r,i])=>i>1||r.length>=4).sort(([,r],[,i])=>i-r).map(([r])=>r).slice(0,40)}function qj(e,n){if(!e||n.length===0)return{likelyUsed:!1,matchedTerms:[]};const i=Gj(n).filter(o=>e.includes(o));return{likelyUsed:i.length>=2,matchedTerms:i}}function Vj(e){const{mailId:n,selectedKnowledgeIds:r,snippets:i,knowledgeContextLength:o,promptHasKnowledgeContext:s,promptHasKnowledgeRequirement:a,draft:d,error:u}=e,f=new Date().toISOString(),p=d.length>0,m=d.length,g=r.length>0,h=i.length,x=i.slice(0,5).map(v=>({knowledgeId:v.knowledgeId,sourceTitle:v.sourceTitle,textPreview:v.text.slice(0,80),score:v.score}));if(u)return{mailId:n,createdAt:f,selectedKnowledgeIds:r,retrievalAttempted:g,retrievedSnippetCount:h,retrievedSnippetsPreview:x,knowledgeContextLength:o,promptHasKnowledgeContext:s,promptHasKnowledgeRequirement:a,draftGenerated:p,draftLength:m,likelyUsedKnowledge:!1,status:"error",reason:`生成预回复时出现错误：${u}`};if(r.length===0)return{mailId:n,createdAt:f,selectedKnowledgeIds:r,retrievalAttempted:!1,retrievedSnippetCount:0,retrievedSnippetsPreview:[],knowledgeContextLength:0,promptHasKnowledgeContext:!1,promptHasKnowledgeRequirement:a,draftGenerated:p,draftLength:m,likelyUsedKnowledge:!1,status:"not_selected",reason:"当前邮件未选择知识库，已按普通预回复逻辑生成。"};if(h===0)return{mailId:n,createdAt:f,selectedKnowledgeIds:r,retrievalAttempted:!0,retrievedSnippetCount:0,retrievedSnippetsPreview:[],knowledgeContextLength:o,promptHasKnowledgeContext:s,promptHasKnowledgeRequirement:a,draftGenerated:p,draftLength:m,likelyUsedKnowledge:!1,status:"fallback_no_relevant_snippets",reason:"已选择知识库，但未检索到高度相关片段，已按邮件正文生成回复。"};if(!s||o===0)return{mailId:n,createdAt:f,selectedKnowledgeIds:r,retrievalAttempted:!0,retrievedSnippetCount:h,retrievedSnippetsPreview:x,knowledgeContextLength:o,promptHasKnowledgeContext:s,promptHasKnowledgeRequirement:a,draftGenerated:p,draftLength:m,likelyUsedKnowledge:!1,status:"retrieved_but_not_in_prompt",reason:"知识库片段已检索到，但未进入生成 prompt。"};if(!p)return{mailId:n,createdAt:f,selectedKnowledgeIds:r,retrievalAttempted:!0,retrievedSnippetCount:h,retrievedSnippetsPreview:x,knowledgeContextLength:o,promptHasKnowledgeContext:s,promptHasKnowledgeRequirement:a,draftGenerated:!1,draftLength:0,likelyUsedKnowledge:!1,status:"error",reason:"知识库片段已进入 prompt，但草稿未生成。"};const{likelyUsed:k}=qj(d,i);return k?{mailId:n,createdAt:f,selectedKnowledgeIds:r,retrievalAttempted:!0,retrievedSnippetCount:h,retrievedSnippetsPreview:x,knowledgeContextLength:o,promptHasKnowledgeContext:s,promptHasKnowledgeRequirement:a,draftGenerated:p,draftLength:m,likelyUsedKnowledge:!0,status:"likely_used",reason:"知识库片段已进入 prompt，生成回复中检测到相关知识库内容。"}:{mailId:n,createdAt:f,selectedKnowledgeIds:r,retrievalAttempted:!0,retrievedSnippetCount:h,retrievedSnippetsPreview:x,knowledgeContextLength:o,promptHasKnowledgeContext:s,promptHasKnowledgeRequirement:a,draftGenerated:p,draftLength:m,likelyUsedKnowledge:!1,status:"in_prompt_but_unclear_usage",reason:"知识库片段已进入 prompt，但生成回复中未检测到明显知识库内容。"}}const Yj="http://localhost:4080";async function Fc(e,n){const r=`${Yj}${e}`;let i;try{i=await fetch(r,{headers:{"Content-Type":"application/json",...(n==null?void 0:n.headers)??{}},...n})}catch(o){throw new Error(`Flowable 服务不可用，请先启动 aioffice-workflow-service。（${String(o)}）`)}if(!i.ok){let o=`HTTP ${i.status}`;try{const s=await i.json();o=s.message||s.error||o}catch{}throw new Error(`Workflow API error: ${o}`)}return i.json()}async function Ia(e){return Fc("/api/workflows/email/start",{method:"POST",body:JSON.stringify(e)})}async function Jj(e){return Fc(`/api/workflows/tasks/my?assignee=${encodeURIComponent(e)}`)}async function Xj(e,n){return Fc(`/api/workflows/tasks/${encodeURIComponent(e)}/complete`,{method:"POST",body:JSON.stringify(n)})}const Zj=l.div`
  position: fixed; inset: 0; z-index: 900;
  background: rgba(0,0,0,0.25);
  display: flex; align-items: flex-start; justify-content: flex-end;
`,Qj=l.div`
  width: 480px; max-width: 95vw; height: 100%; max-height: 100vh;
  background: #fff; box-shadow: -4px 0 24px rgba(0,0,0,0.12);
  display: flex; flex-direction: column; overflow: hidden;
`,eI=l.div`
  padding: 18px 20px 14px;
  border-bottom: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
`,tI=l.div`
  font-size: 15px; font-weight: 700; color: #1a202c;
  display: flex; align-items: center; gap: 6px;
`,nI=l.div`flex: 1; overflow-y: auto; padding: 10px 14px;`,rI=l.div`
  padding: 12px 14px; border-radius: 8px; margin-bottom: 8px;
  background: #f7fafc; border: 1px solid #e2e8f0;
`,iI=l.div`
  font-size: 13px; font-weight: 700; color: #1a202c; margin-bottom: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`,oI=l.div`
  font-size: 11px; color: #718096; margin-bottom: 6px;
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
`,sI=l.div`
  font-size: 11px; color: #4a5568; margin-bottom: 8px; line-height: 1.55;
`,aI=l.div`
  font-size: 10px; color: #6366f1; font-style: italic;
  margin-bottom: 8px; padding: 4px 8px;
  background: #f0f0ff; border-radius: 4px;
`,lI=l.span`
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 600; padding: 1px 7px;
  border-radius: 8px; background: #ebf8ff; color: #2b6cb0;
  border: 1px solid #bee3f8;
`,cI=l.div`
  font-size: 11px; color: #2d3748; margin-bottom: 8px;
  padding: 8px 10px; background: #f7fafc;
  border-left: 3px solid #4299e1; border-radius: 0 6px 6px 0;
  line-height: 1.6;
`,dI=l.span`
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 600; padding: 1px 7px;
  border-radius: 8px; background: #faf5ff; color: #6b21a8;
  border: 1px solid #d8b4fe;
`,uI=l.div`
  font-size: 11px; color: #2d3748; margin-bottom: 8px;
  padding: 8px 10px; background: #fdf4ff;
  border-left: 3px solid #a855f7; border-radius: 0 6px 6px 0;
  line-height: 1.6;
`,pI=l.div`display: flex; gap: 6px;`,Fo=l.button`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 6px; border: none;
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.13s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  ${({$variant:e})=>e==="approve"?"background:#c6f6d5;color:#276749;&:hover:not(:disabled){background:#9ae6b4;}":e==="reject"?"background:#fed7d7;color:#c53030;&:hover:not(:disabled){background:#feb2b2;}":"background:#edf2f7;color:#4a5568;&:hover:not(:disabled){background:#e2e8f0;}"}
`,fI=l.span`
  display: inline-flex; align-items: center;
  padding: 1px 7px; border-radius: 8px; font-size: 11px; font-weight: 600;
  ${({$p:e})=>e==="urgent"?"background:#fff5f5;color:#c53030;border:1px solid #fc8181;":e==="important"?"background:#fffaf0;color:#c05621;border:1px solid #fbd38d;":"background:#f0fff4;color:#276749;border:1px solid #9ae6b4;"}
`,$a=l.div`
  font-size: 12px; padding: 6px 0;
  color: ${({$variant:e})=>e==="error"?"#c53030":"#718096"};
`;function mI(e){if(!e)return"";try{return new Date(e).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}catch{return e}}function gI(e){return e==="urgent"?"紧急":e==="important"?"重要":"普通"}function hI({tasks:e,loading:n,error:r,completingTaskId:i,onClose:o,onRefresh:s,onApprove:a,onReject:d}){return t.jsx(Zj,{onClick:u=>{u.target===u.currentTarget&&o()},children:t.jsxs(Qj,{children:[t.jsxs(eI,{children:[t.jsx(tI,{children:"📋 流程待办"}),t.jsxs("div",{style:{display:"flex",gap:8,alignItems:"center"},children:[t.jsx(Fo,{$variant:"neutral",onClick:s,disabled:n,children:n?"刷新中…":"🔄 刷新"}),t.jsx(Fo,{$variant:"neutral",onClick:o,children:"✕ 关闭"})]})]}),t.jsxs(nI,{children:[r&&t.jsxs($a,{$variant:"error",children:["⚠ ",r]}),n&&e.length===0&&t.jsx($a,{children:"加载中…"}),!n&&!r&&e.length===0&&t.jsx($a,{children:"暂无待办任务"}),e.map(u=>{const f=u.category==="research_progress_submission",p=u.category==="campus_card_replacement";return t.jsxs(rI,{children:[t.jsx(iI,{children:u.subject||"（无主题）"}),t.jsxs(oI,{children:[u.sender&&t.jsxs("span",{children:["发件人：",u.sender]}),u.priority&&t.jsx(fI,{$p:u.priority,children:gI(u.priority)}),u.category&&(p?t.jsx(dI,{children:"🤖 校园卡补办 · 智能体办理"}):f?t.jsx(lI,{children:"🔗 Research Progress 顺序交接"}):t.jsx("span",{children:u.category})),u.createTime&&t.jsx("span",{children:mI(u.createTime)})]}),p&&t.jsxs(uI,{children:[t.jsxs("div",{children:["🤖 ",t.jsx("strong",{children:"事项类型："}),"校园卡补办"]}),t.jsxs("div",{children:["⚙️ ",t.jsx("strong",{children:"流程模式："}),"智能体自助办理"]}),t.jsxs("div",{children:["🏫 ",t.jsx("strong",{children:"执行智能体："}),"CUHKSZ Agent"]}),t.jsxs("div",{children:["⚠ ",t.jsx("strong",{children:"当前状态："}),"智能体发现异常，需要人工复核。"]}),t.jsx("div",{style:{marginTop:6,fontSize:10,color:"#6b21a8",fontStyle:"italic"},children:"该事项只有在智能体发现异常时才进入人工复核。正常情况下由 CUHKSZ Agent 自动完成。"})]}),f&&t.jsxs(cI,{children:[t.jsxs("div",{children:["📋 ",t.jsx("strong",{children:"事项类型："}),"Research Progress 提交与导师审批"]}),t.jsxs("div",{children:["🔗 ",t.jsx("strong",{children:"流程模式："}),"点对点顺序交接（学生 → 导师 → 归档）"]}),t.jsxs("div",{children:["🎓 ",t.jsx("strong",{children:"当前阶段："}),"学生准备并提交材料"]}),t.jsxs("div",{children:["👨‍🏫 ",t.jsx("strong",{children:"下一处理人："}),"导师确认签字"]})]}),u.aiSummary&&t.jsx(sI,{children:u.aiSummary}),t.jsx(aI,{children:p?"CUHKSZ Agent 发现异常，已转人工复核。请确认后操作。":f?"AI 已拆解顺序流程，请按当前阶段完成后再交由下一处理人确认。":"AI 已完成预处理，请你做最终确认。"}),t.jsxs(pI,{children:[t.jsx(Fo,{$variant:"approve",disabled:i===u.taskId,onClick:()=>a(u.taskId),children:i===u.taskId?"处理中…":p?"✅ 人工确认通过":f?"✅ 确认已准备/提交":"✅ 确认签字"}),t.jsx(Fo,{$variant:"reject",disabled:i===u.taskId,onClick:()=>d(u.taskId),children:i===u.taskId?"处理中…":p?"↩ 要求学生补充材料":f?"↩ 要求补充材料":"↩ 驳回/要求补充"})]})]},u.taskId)})]})]})})}const xI=["校园卡","校园卡补办","补办校园卡","学生卡","学生证补办","卡丢了","卡遗失","挂失校园卡","重新办理校园卡","学生卡补办","补办学生卡"],bI=["campus card","student card","card replacement","lost card","replace my card","reissue card","replace student card","campus card replacement"];function yI(e){const n=e.toLowerCase();return bI.some(r=>n.includes(r))||xI.some(r=>e.includes(r))}const vI=["research progress","progress report","progress review","annual progress","thesis progress","research progress report","phd progress","postgraduate progress","mid-term review","milestone review"],wI=["导师审批","研究进展","进展报告","年度进展","中期检查","开题进展","研究生进展","博士进展","硕士进展","中期报告","阶段汇报"];function SI(e){const n=e.toLowerCase();return vI.some(r=>n.includes(r))||wI.some(r=>e.includes(r))}function Hu(e,n,r=""){var a,d,u;const i=[n,r,e.summary??"",((a=e.actionPlan)==null?void 0:a.brief)??"",((d=e.actionPlan)==null?void 0:d.title)??""].join(" ");if(yI(i))return"campus_card_replacement";if(SI(i))return"research_progress_submission";const o=(u=e.actionPlan)==null?void 0:u.intentType,s=e.emailCategory;return o==="approval"||s==="approval_request"?"approval_request":o==="meeting"||s==="meeting_invitation"?"meeting_invitation":o==="attachment_review"||s==="document_review"?"document_review":o==="task"||s==="task_assignment"?"task_assignment":o==="request"||s==="data_report_request"?"material_collection":o==="notice"?"information_summary":"unknown"}function kI(){return[{id:"step-1-read-requirements",title:"阅读学校提交要求",description:"仔细阅读学校邮件中的 research progress 提交说明和截止日期",actionType:"confirm",assigneeRole:"student",outputType:"none",requiredHumanSignature:!1,status:"pending"},{id:"step-2-prepare-material",title:"准备 research progress 材料",description:"按学校要求整理研究进展报告、成果清单和相关文档",actionType:"prepare_material",assigneeRole:"student",outputType:"document",requiredHumanSignature:!1,evidenceRequired:!0,status:"pending",dependsOn:["step-1-read-requirements"]},{id:"step-3-submit-form",title:"提交 research progress 表格/材料",description:"将准备好的材料填写并提交到学校指定系统或通过邮件发送",actionType:"submit_form",assigneeRole:"student",outputType:"form_submission",requiredHumanSignature:!0,status:"pending",dependsOn:["step-2-prepare-material"]},{id:"step-4-notify-advisor",title:"通知导师审批",description:"提交后通知导师进行审核并确认签字",actionType:"handoff",assigneeRole:"student",handoffToRole:"advisor",outputType:"email_reply",requiredHumanSignature:!1,status:"pending",dependsOn:["step-3-submit-form"]},{id:"step-5-advisor-review",title:"导师审批",description:"导师审阅研究进展材料并做出批准或提出补充意见",actionType:"advisor_review",assigneeRole:"advisor",requiredHumanSignature:!0,status:"waiting",dependsOn:["step-4-notify-advisor"]},{id:"step-6-archive-result",title:"回传结果并归档",description:"将导师批准结果回传学校，并在系统中存档本次进展记录",actionType:"archive_result",assigneeRole:"system",outputType:"record",requiredHumanSignature:!1,status:"waiting",dependsOn:["step-5-advisor-review"]}]}function Ku(e,n,r,i,o,s){return s==="campus_card_replacement"?jI(e,n,r,i,o):s==="research_progress_submission"?II(e,n,r,i,o):null}function jI(e,n,r,i,o){return{matterId:`matter-${e}-campus-card`,title:"校园卡补办",summary:[`发件人（${o}）申请补办校园卡。`,"智能体将自动校验学生身份、材料完整性，并自动提交补办申请（如符合条件）。",r.summary?`AI 摘要：${r.summary}`:""].filter(Boolean).join(" "),scenarioType:"campus_card_replacement",workflowPattern:"agent_autonomous",source:"email",emailId:e,threadId:n||e,subject:i||"(无主题)",sender:o,riskLevel:"low",status:"in_progress",currentAssigneeRole:"cuhksz_agent",agentId:"cuhksz-agent",agentName:"CUHKSZ Agent",autoCompletionEligible:!0,suggestedNextAction:"智能体将自动校验材料并提交补办申请，如发现异常将转交人工复核。",workItems:[{id:"step-1-agent-verify",title:"智能体验证学生身份与材料",description:"CUHKSZ Agent 自动校验学生身份、材料完整性和风险词",actionType:"confirm",assigneeRole:"cuhksz_agent",outputType:"none",requiredHumanSignature:!1,status:"in_progress"},{id:"step-2-agent-submit",title:"智能体自动提交补办申请",description:"校验通过后自动提交至校园卡管理系统",actionType:"submit_form",assigneeRole:"cuhksz_agent",outputType:"form_submission",requiredHumanSignature:!1,status:"pending",dependsOn:["step-1-agent-verify"]}],createdAt:new Date().toISOString()}}function II(e,n,r,i,o){const s=kI();return{matterId:`matter-${e}-research-progress`,title:"Research Progress 提交与导师审批",summary:[`学校（${o}）要求提交 research progress 材料。`,"当前用户需先准备并提交相关材料，随后通知导师进行审批。","最终由导师确认/签字后结果归档。",r.summary?`AI 摘要：${r.summary}`:""].filter(Boolean).join(" "),scenarioType:"research_progress_submission",workflowPattern:"linear_handoff",source:"email",emailId:e,threadId:n||e,subject:i||"(无主题)",sender:o,riskLevel:"medium",status:"in_progress",currentStepId:"step-1-read-requirements",currentAssigneeRole:"student",finalApproverRole:"advisor",suggestedNextAction:"请先准备并提交 research progress 材料，随后系统将协助通知导师进行审批。",workItems:s,createdAt:new Date().toISOString()}}function vh(e){const n=e.workItems.map((r,i)=>`${i+1}.${r.title}(${r.assigneeRole})`).join(" → ");return[`[${e.title}]`,`模式:${e.workflowPattern}`,`当前步骤:${e.currentStepId??"-"}`,`下一步:${e.suggestedNextAction}`,`流程:${n}`].join(" | ")}function $I(e,n){var i,o,s;if(n==="trash"||n==="sent"||n==="spam"||e.emailCategory==="spam"||e.emailCategory==="promotion"||e.skipReason==="system_delivery_notice"||((i=e.actionPlan)==null?void 0:i.intentType)==="spam")return!1;const r=(o=e.actionPlan)==null?void 0:o.intentType;return!!(r==="approval"||r==="task"||r==="request"||r==="attachment_review"||e.requiresAction===!0||e.requiresApproval===!0||e.category==="action_required"||e.category==="reply_required"&&e.priority==="high"||(s=e.timeIntent)!=null&&s.hasTimeRequirement&&e.timeIntent.needsUserConfirmation)}function Gu(e,n,r,i,o,s,a,d){const u=r.urgency==="urgent"?"urgent":r.urgency==="soon"||r.priority==="high"?"important":"normal",f=d?d.scenarioType:r.emailCategory||r.category||"email_approval",p=d?vh(d):r.summary||"";return{sourceType:"email",emailId:e,threadId:n||e,subject:i||"(无主题)",sender:o||"unknown",requesterId:s||"demo-user",assignee:"approver-001",priority:u,category:f,aiSummary:p,attachmentIds:[],workspaceId:a||"default"}}const TI=["cuhk.edu.cn","cuhksz.edu.cn","link.cuhk.edu.cn","cuhk.edu.hk","@stu."];function CI(e){if(!e)return null;const n=e.toLowerCase();if(!TI.some(i=>n.includes(i)))return null;const r=n.split("@")[0]??"unknown";return{studentId:`STU-${r.replace(/[^a-z0-9]/g,"").slice(0,8).toUpperCase()}`,name:r,email:e,program:"MSc Computer Science",status:"active",faculty:"School of Science and Engineering"}}function PI(e){return{studentId:e,cardNumber:`CC-${e.slice(-6)}`,status:"lost",balance:0,lastUsed:new Date(Date.now()-7*24*3600*1e3).toISOString()}}function AI(e){return{ticketId:`CARD-${Date.now()}`,studentId:e.studentId,status:"submitted",estimatedReadyDate:new Date(Date.now()+5*24*3600*1e3).toISOString().slice(0,10),message:"校园卡补办申请已提交，预计 5 个工作日内可领取。"}}function _I(e,n){return{studentId:e,serviceType:n,status:"paid",amount:20,paidAt:new Date().toISOString()}}const wh=[];function EI(e){return wh.filter(n=>n.studentId===e.studentId&&n.scenarioType===e.scenarioType&&n.status==="open")}function zI(e){const n={ticketId:`TKT-${Date.now()}`,studentId:e.studentId,scenarioType:e.scenarioType,status:"open",createdAt:new Date().toISOString(),description:e.description};return wh.push(n),n}const DI={campus_card_replacement:{scenarioType:"campus_card_replacement",matchedPolicyIds:["cuhksz-campus-card-replacement-policy-mvp"],requiredMaterials:["姓名","学号","学校邮箱","补办原因"],requiredKeywords:["校园卡","补办","丢失","挂失","student card","campus card"],riskKeywords:["代办","帮别人","不是本人","借用","on behalf","for someone else"],description:"校园卡补办需提供学生身份信息（姓名、学号、邮箱）及补办原因，需本人申请，不接受代办。"},research_progress_submission:{scenarioType:"research_progress_submission",matchedPolicyIds:["cuhksz-research-progress-policy-mvp"],requiredMaterials:["研究进展报告","导师确认","提交截止日期"],requiredKeywords:["research progress","progress report","进展报告"],riskKeywords:[],description:"研究生需按时提交 Research Progress 报告，经导师审批后归档。"}};function RI(e){return DI[e]??null}const MI=["applicantName","studentId","schoolEmail","reason"],qu={applicantName:"姓名",studentId:"学号",schoolEmail:"学校邮箱",reason:"补办原因"};function FI(e){const{emailBody:n,senderEmail:r}=e,i=n??"",o=[];let s;const a=i.match(/姓名[：:]\s*([^\s,，。\n]{2,10})/),d=i.match(/Name[：:\s]+([A-Za-z][\w\s-]{1,30})/i),u=i.match(/我是([^\s,，。\n]{2,6})/);a?(s=a[1].trim(),o.push({field:"applicantName",value:s,source:"email_body"})):d?(s=d[1].trim(),o.push({field:"applicantName",value:s,source:"email_body"})):u&&(s=u[1].trim(),o.push({field:"applicantName",value:s,source:"email_body"}));let f;const p=i.match(/学号[：:]\s*([A-Za-z]?\d{7,12})/),m=i.match(/Student\s*ID[：:\s]+([A-Za-z]{0,3}\d{7,12})/i),g=i.match(/\b(STU\d{6,10})\b/i),h=i.match(/\b(\d{8,12})\b/);p?(f=p[1].trim(),o.push({field:"studentId",value:f,source:"email_body"})):m?(f=m[1].trim(),o.push({field:"studentId",value:f,source:"email_body"})):g?(f=g[1].trim(),o.push({field:"studentId",value:f,source:"email_body"})):h&&(f=h[1].trim(),o.push({field:"studentId",value:f,source:"email_body"}));let x;if(/@(cuhk\.edu\.hk|cuhksz\.edu\.cn|link\.cuhk\.edu\.cn|cuhk\.edu\.cn)/i.test(r))x=r,o.push({field:"schoolEmail",value:x,source:"sender_email"});else{const $=i.match(/[\w.+-]+@(?:cuhk\.edu\.hk|cuhksz\.edu\.cn|link\.cuhk\.edu\.cn|cuhk\.edu\.cn)/i);$&&(x=$[0],o.push({field:"schoolEmail",value:x,source:"email_body"}))}let v;const y=[/原因[：:]\s*([^\n。！?.]{4,80})/,/因为([^\n。！?.]{4,60})/,/由于([^\n。！?.]{4,60})/,/Reason[：:\s]+([^\n.!?]{4,80})/i,/(丢失|遗失|损坏|无法使用|lost|damaged|not working)[^。\n]*[。\n]?/i];for(const $ of y){const O=i.match($);if(O){v=(O[1]??O[0]).trim(),o.push({field:"reason",value:v,source:"email_body"});break}}const j=/丢了|遗失|挂失|lost|missing|misplaced/i.test(i),S=/补办|重新办理|replacement|replace|reissue/i.test(i),z=/校园卡|学生卡|campus card|student card/i.test(i),P={applicantName:s,studentId:f,schoolEmail:x,reason:v},I=[],b=[];for(const $ of MI)P[$]?I.push(qu[$]):b.push(qu[$]);return{applicantName:s,studentId:f,schoolEmail:x,reason:v,hasLostStatement:j,hasReplacementIntent:S,mentionedCampusCard:z,providedFields:I,missingFields:b,evidence:o}}function BI(e,n){var i,o;const r={matterId:e.matterId,scenarioType:e.scenarioType,decision:"human_review_required",confidence:0,policyChecks:{matchedPolicyIds:((i=n.policy)==null?void 0:i.matchedPolicyIds)??[],requiredMaterials:((o=n.policy)==null?void 0:o.requiredMaterials)??[],providedMaterials:[],missingMaterials:[]},systemChecks:{},riskFlags:[],explanation:"",nextAction:""};return e.scenarioType==="campus_card_replacement"?LI(e,n,r):(r.explanation="未知场景，转人工复核。",r.nextAction="人工复核",r)}function LI(e,n,r){const{policy:i,studentInfo:o,paymentStatus:s,openTickets:a,emailBody:d,senderEmail:u}=n,f=[],p=FI({emailBody:d,senderEmail:u});if(r.extractedFields={applicantName:p.applicantName,studentId:p.studentId,schoolEmail:p.schoolEmail,reason:p.reason,hasLostStatement:p.hasLostStatement,hasReplacementIntent:p.hasReplacementIntent,mentionedCampusCard:p.mentionedCampusCard},r.evidence=p.evidence.map(h=>({...h})),r.policyChecks.providedMaterials=p.providedFields,r.policyChecks.missingMaterials=p.missingFields,!o)return r.systemChecks.studentIdentity="failed",f.push({name:"学生身份验证",status:"failed",detail:`无法通过发件人 ${u} 匹配模拟学生身份。`}),r.systemCheckDetails=f,r.decision="human_review_required",r.confidence=.3,r.explanation=`无法验证发件人 ${u} 的学生身份，需要人工复核。`,r.nextAction="请人工核实学生身份后再处理申请。",r;r.systemChecks.studentIdentity="passed",f.push({name:"学生身份验证",status:"passed",detail:`已通过 ${u} 匹配到学生 ${o.name}（${o.studentId}）。`});const m=[d,e.subject,e.summary].join(" "),g=((i==null?void 0:i.riskKeywords)??[]).filter(h=>m.includes(h));return g.length>0?(r.riskFlags.push(`检测到风险词：${g.join("、")}`),r.systemChecks.authMatch="failed",f.push({name:"代办风险检测",status:"failed",detail:`检测到风险词：${g.join("、")}，可能为代办或非本人申请。`}),r.systemCheckDetails=f,r.decision="human_review_required",r.confidence=.2,r.explanation=`邮件中出现代办/非本人申请风险词（${g.join("、")}），转人工复核。`,r.nextAction="人工核实是否为本人申请。",r):(r.systemChecks.authMatch="passed",f.push({name:"代办风险检测",status:"passed",detail:"未检测到代办或非本人申请风险词。"}),p.missingFields.length>0?(r.decision="request_missing_material",r.confidence=.6,r.explanation=`申请缺少必要材料：${p.missingFields.join("、")}。`,r.nextAction=`请学生补充：${p.missingFields.join("、")}`,f.push({name:"申请材料核查",status:"failed",detail:`已提供：${p.providedFields.join("、")||"（无）"}；缺少：${p.missingFields.join("、")}。`}),r.systemCheckDetails=f,r):(f.push({name:"申请材料核查",status:"passed",detail:`已提供全部必要材料：${p.providedFields.join("、")}。`}),a.length>0?(r.systemChecks.duplicateTicket="failed",f.push({name:"重复工单检测",status:"failed",detail:`学生 ${o.studentId} 已有 ${a.length} 个进行中的校园卡补办工单（${a.map(h=>h.ticketId).join("、")}）。`}),r.systemCheckDetails=f,r.decision="human_review_required",r.confidence=.5,r.explanation=`学生 ${o.studentId} 已有进行中的校园卡补办申请，请人工确认是否重复。`,r.nextAction="人工确认是否重复申请。",r):(r.systemChecks.duplicateTicket="passed",f.push({name:"重复工单检测",status:"passed",detail:"未发现进行中的同类工单。"}),s&&s.status!=="paid"&&s.status!=="waived"?(r.systemChecks.paymentStatus="failed",r.policyChecks.missingMaterials.push("补办费用缴纳"),f.push({name:"缴费状态",status:"failed",detail:`当前缴费状态：${s.status}，尚未完成补办费用缴纳。`}),r.systemCheckDetails=f,r.decision="request_missing_material",r.confidence=.55,r.explanation="尚未完成补办费用缴纳。",r.nextAction="请学生先缴纳校园卡补办费用。",r):(r.systemChecks.paymentStatus="passed",f.push({name:"缴费状态",status:"passed",detail:s?`缴费状态：${s.status}，已通过。`:"（免缴费）已通过。"}),r.systemCheckDetails=f,r.decision="auto_complete",r.confidence=.92,r.explanation="身份、材料、缴费、重复工单检查均通过，可由 CUHKSZ Agent 自动提交补办申请。",r.nextAction="CUHKSZ Agent 自动提交校园卡补办申请。",r))))}function NI(e,n){return e.workflowPattern==="agent_autonomous"?n.decision==="auto_complete"?"agent_auto_complete":n.decision==="request_missing_material"?"request_missing_material":"human_review":e.workflowPattern==="linear_handoff"?"start_linear_handoff":e.workflowPattern==="approval_chain"?"start_approval":"single_step_confirm"}async function OI(e){const{matter:n,senderEmail:r,emailBody:i}=e,o=RI("campus_card_replacement"),s=CI(r);s&&PI(s.studentId);const a=s?_I(s.studentId,"campus_card_replacement"):null,d=s?EI({studentId:s.studentId,scenarioType:"campus_card_replacement"}):[],u=BI(n,{emailBody:i,senderEmail:r,policy:o,studentInfo:s,paymentStatus:a,openTickets:d}),f=NI(n,u);if(f==="agent_auto_complete"){const p=zI({studentId:s.studentId,scenarioType:"campus_card_replacement",subject:n.subject,description:n.summary,sourceEmailId:n.emailId});return AI({studentId:s.studentId,name:s.name,reason:n.summary}),{status:"auto_completed",message:`CUHKSZ Agent 已完成材料校验、身份检查、重复工单检查，并已自动提交校园卡补办流程（工单号：${p.ticketId}）。预计 5 个工作日内可领取。`,ticketId:p.ticketId,explanation:u.explanation,evaluation:u}}if(f==="request_missing_material"){const p=u.policyChecks.missingMaterials;return{status:"waiting_material",message:`CUHKSZ Agent 检查发现申请缺少必要材料：${p.join("、")}。请补充后重新提交。`,missingItems:p,explanation:u.explanation,evaluation:u}}return{status:"human_review_required",message:`智能体发现异常（${u.explanation}），已转交人工复核。`,explanation:u.explanation,evaluation:u}}function WI(e,n){const r=e&&typeof e=="object"&&Array.isArray(e.slides)?e.slides:[],i=new Map(n.map(o=>[o.index,o]));return r.map((o,s)=>{const a=typeof o.index=="number"?o.index:s,d=i.get(a);return{index:a,type:o.intent||"content",title:o.title,subtitle:o.subtitle,heading:o.heading,body:o.body,items:Array.isArray(o.items)?o.items:void 0,summary:o.summary,speakerNotes:o.speakerNotes||o.notes,notes:o.notes||o.speakerNotes,visualBrief:o.visualBrief,imagePath:(d==null?void 0:d.imagePath)||null,imageLoading:!1,isGenerating:!1}})}const Bc=wr`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
`,UI=l.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #f4f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
`,HI=l.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`,KI=l.div`
  width: 340px;
  min-width: 320px;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #dde4ec;
  background: #ffffff;
  overflow-x: hidden;
`,GI=l.div`
  padding: 10px 14px 8px;
  border-bottom: 1px solid #eaeff5;
  display: flex;
  flex-direction: column;
  gap: 8px;
`,qI=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`,VI=l.div`
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  writing-mode: horizontal-tb;
  flex-shrink: 0;
`,YI=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
`,JI=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`,Vu=l.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 15px;
  display: flex;
  align-items: center;
  &:hover { color: #3182ce; background: #ebf3fd; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`,XI=l.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  background: #3182ce;
  color: #fff;
`,ZI=l.div`
  display: flex;
  padding: 10px 12px 0;
  gap: 2px;
  border-bottom: 1px solid #dde4ec;
  background: #ffffff;
`,QI=l.button`
  flex: 1;
  padding: 7px 4px;
  border: none;
  border-bottom: 2.5px solid ${({$active:e})=>e?"#3182ce":"transparent"};
  background: transparent;
  color: ${({$active:e})=>e?"#2b6cb0":"#718096"};
  font-size: var(--font-size-sm);
  font-weight: ${({$active:e})=>e?700:500};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
  &:hover { color: #3182ce; border-bottom-color: #90cdf4; }
`,e$=l.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1.5px solid #3182ce;
  background: #3182ce;
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  min-width: fit-content;
  transition: all 0.12s;
  &:hover { background: #2b6cb0; border-color: #2b6cb0; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`,t$=l.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1.5px solid #553c9a;
  background: #553c9a;
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  min-width: fit-content;
  transition: all 0.12s;
  &:hover { background: #44337a; border-color: #44337a; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-bottom: 1px solid #eaeff5;
  background: #f8fafc;
  font-size: var(--font-size-xs);
  color: #718096;
  flex-shrink: 0;
`;l.span`
  flex-shrink: 0;
`;l.button`
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid ${({$active:e})=>e?"#553c9a":"#dde4ec"};
  background: ${({$active:e})=>e?"#f5f0ff":"transparent"};
  color: ${({$active:e})=>e?"#553c9a":"#a0aec0"};
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
  &:hover { border-color: #9f7aea; color: #553c9a; background: #f5f0ff; }
`;const n$=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid #eaeff5;
  background: #fafcff;
`,r$=l.button`
  padding: 2px 9px;
  border-radius: 10px;
  border: 1px solid ${({$active:e})=>e?"#3182ce":"#dde4ec"};
  background: ${({$active:e})=>e?"#ebf3fd":"transparent"};
  color: ${({$active:e})=>e?"#2b6cb0":"#a0aec0"};
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: none;
  transition: all 0.12s;
  &:hover { border-color: #90cdf4; color: #2b6cb0; background: #f0f7ff; }
`,i$=l.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 6px;
`,o$=l.div`
  padding: 11px 12px;
  border-radius: 8px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
  background: ${({$active:e,$highlighted:n})=>e?"#ebf3fd":n?"#fffbeb":"#fff"};
  border: 1px solid ${({$active:e,$highlighted:n})=>e?"#b3d1f0":n?"#f6ad55":"transparent"};
  &:hover {
    background: ${({$active:e,$highlighted:n})=>e?"#ebf3fd":n?"#fff7d6":"#f7fafc"};
    border-color: ${({$active:e,$highlighted:n})=>e?"#b3d1f0":n?"#f6ad55":"#e2e8f0"};
  }
`,s$=l.div`
  font-size: var(--font-size-sm);
  font-weight: ${({$unread:e})=>e?700:500};
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
`,a$=l.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`,l$=l.div`
  font-size: var(--font-size-xs);
  color: #718096;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
`,c$=l.div`
  font-size: var(--font-size-xs);
  color: #a0aec0;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,d$=l.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  flex-wrap: wrap;
`,u$=l.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  ${({$status:e})=>e==="running"||e==="pending"?Mt`
      background: #ebf4ff; color: #3182ce; border: 1px solid #bee3f8;
      animation: ${Bc} 1.5s ease-in-out infinite;
    `:e==="success"?"background: #f0fff4; color: #276749; border: 1px solid #9ae6b4;":e==="failed"?"background: #fff5f5; color: #c53030; border: 1px solid #fc8181;":e==="skipped"?"background: #f0fff4; color: #276749; border: 1px solid #9ae6b4;":"background: #f7fafc; color: #a0aec0; border: 1px solid #e2e8f0;"}
`,p$=l.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  ${({$cat:e})=>e==="action_required"?"background: #fff5eb; color: #c05621; border: 1px solid #fbd38d;":e==="reply_required"?"background: #ebf4ff; color: #2b6cb0; border: 1px solid #90cdf4;":e==="risk"?"background: #fff5f5; color: #c53030; border: 1px solid #fc8181;":e==="promotion"?"background: #faf5ff; color: #6b46c1; border: 1px solid #d6bcfa;":e==="archive_candidate"?"background: #f7fafc; color: #718096; border: 1px solid #e2e8f0;":e==="read_only"?"background: #f0fff4; color: #276749; border: 1px solid #9ae6b4;":"background: #f7fafc; color: #a0aec0; border: 1px solid #e2e8f0;"}
`,Ta=l.div`
  margin: 10px 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: ${({$risk:e})=>e?"#fff5f5":"#f0f7ff"};
  border: 1px solid ${({$risk:e})=>e?"#fc8181":"#bee3f8"};
`,Ca=l.button`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 6px; border: none;
  font-size: var(--font-size-xs); font-weight: 600; cursor: pointer;
  transition: all 0.13s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  ${({$variant:e})=>e==="approve"?"background:#c6f6d5;color:#276749;&:hover:not(:disabled){background:#9ae6b4;}":e==="reject"?"background:#fed7d7;color:#c53030;&:hover:not(:disabled){background:#feb2b2;}":e==="neutral"?"background:#edf2f7;color:#4a5568;&:hover:not(:disabled){background:#e2e8f0;}":"background:#ebf4ff;color:#2b6cb0;&:hover:not(:disabled){background:#bee3f8;}"}
`,ar=l.div`
  font-size: var(--font-size-xs); margin-top: 6px;
  color: ${({$variant:e})=>e==="error"?"#c53030":e==="success"?"#276749":"#4a5568"};
`,Pa=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`,f$=l.span`
  color: #2d3748;
  word-break: break-word;
`,en=l.div`
  margin-top: 8px;
`,tn=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #4a5568;
  margin-bottom: 3px;
`,Kt=l.div`
  font-size: var(--font-size-xs);
  color: #2d3748;
  line-height: 1.6;
  word-break: break-word;
`,m$=l.span`
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3182ce;
  flex-shrink: 0;
`,Yu=l.div`
  padding: 32px 16px;
  text-align: center;
  color: #a0aec0;
  font-size: var(--font-size-sm);
`,g$=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 5px 10px;
  border-bottom: 1px solid #eaeff5;
  background: #fafcff;
`,h$=l.span`
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({$ok:e,$warn:n})=>e?"#38a169":n?"#dd6b20":"#a0aec0"};
  margin-right: 4px;
  vertical-align: middle;
`,x$=l.span`
  font-size: var(--font-size-xs);
  color: #718096;
`;l.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 6px;
  border-bottom: 1px solid #eaeff5;
  background: #fafcff;
`;l.input`
  flex: 1;
  border: 1px solid #dde4ec;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: var(--font-size-xs);
  color: #2d3748;
  background: #fff;
  outline: none;
  &:focus { border-color: #63b3ed; }
  &::placeholder { color: #a0aec0; }
`;l.button`
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #3182ce;
  background: #ebf3fd;
  color: #2b6cb0;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #bee3f8; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;const b$=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #ffffff;
`,y$=l.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`,v$=l.div`
  padding: 18px 24px 14px;
  border-bottom: 1px solid #eaeff5;
  background: #fff;
  flex-shrink: 0;
`,w$=l.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`,S$=l.h2`
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`,k$=l.div`
  font-size: var(--font-size-xs);
  color: #718096;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`,j$=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`,I$=l.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-size: 14px;
`;l.div`
  padding: 18px 24px 14px;
  border-bottom: 1px solid #eaeff5;
`;l.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  font-size: var(--font-size-xs);
  color: #4a5568;
`;l.span`
  color: #a0aec0;
  font-weight: 600;
  text-align: right;
`;const $$=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 24px;
  background: #f7fafc;
  border-bottom: 1px solid #eaeff5;
  flex-wrap: wrap;
`,Aa=l.button`
  padding: 3px 12px;
  border-radius: 12px;
  border: 1.5px solid ${({$active:e})=>e?"#3182ce":"#cbd5e0"};
  background: ${({$active:e})=>e?"#ebf3fd":"transparent"};
  color: ${({$active:e})=>e?"#2b6cb0":"#718096"};
  font-size: var(--font-size-xs); font-weight: 600; cursor: pointer;
  &:hover { border-color: #3182ce; color: #2b6cb0; background: #ebf3fd; }
`,T$=l.div`
  font-size: var(--font-size-xs); color: #975a16;
  display: flex; align-items: center; gap: 8px; flex: 1;
`,C$=l.iframe`
  width: 100%;
  min-height: 280px;
  border: none;
  display: block;
  border-bottom: 1px solid #eaeff5;
`,P$=l.div`
  padding: 18px 24px 22px;
  font-size: 14px;
  line-height: 1.75;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-word;
  border-bottom: 1px solid #eaeff5;
`,A$=l.div`
  padding: 12px 24px 14px;
  border-bottom: 1px solid #eaeff5;
  background: #fafcff;
`,_$=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
`,E$=l.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`,z$=l.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #dde4ec;
  border-radius: 8px;
  background: #fff;
  flex-wrap: wrap;
  justify-content: space-between;
`,D$=l.div`
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  flex-wrap: wrap;
`,R$=l.span`
  font-size: 20px;
  flex-shrink: 0;
`,M$=l.div`
  flex: 1;
  min-width: 0;
`,F$=l.div`
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,B$=l.div`
  font-size: var(--font-size-xs);
  color: #a0aec0;
  margin-top: 2px;
`,_a=l.button`
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1.5px solid #b7d6f5;
  border-radius: 6px;
  background: #ebf3fd;
  color: #2b6cb0;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) { background: #bee3f8; border-color: #90cdf4; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,Di=l.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  ${({$variant:e})=>e==="spam"||e==="trash"?"background:#fff5f5;color:#c53030;border:1px solid #fc8181;":e==="internal"?"background:#f0fff4;color:#276749;border:1px solid #9ae6b4;":e==="important"?"background:#ebf4ff;color:#2b6cb0;border:1px solid #90cdf4;":e==="low_priority"?"background:#f7fafc;color:#718096;border:1px solid #e2e8f0;":e==="edit"?"background:#fffbeb;color:#b7791f;border:1px solid #fcd34d;":e==="attach"?"background:#f0fff4;color:#276749;border:1px solid #9ae6b4;":e==="reply"?"background:#ebf8ff;color:#2b6cb0;border:1px solid #bee3f8;":e==="calendar"?"background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;":e==="calendar_warning"?"background:#fffbeb;color:#b7791f;border:1px solid #fcd34d;":"background:#f7fafc;color:#a0aec0;border:1px solid #e2e8f0;"}
`,Ju=l.div`
  padding: 8px 12px;
  background: #ebf8ff;
  border-bottom: 1px solid #bee3f8;
  font-size: 13px;
  color: #2b6cb0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`,L$=l.span`
  display: inline-block;
  animation: ${Bc} 1.2s ease-in-out infinite;
`,N$=l.div`
  margin: ${({$collapsed:e})=>e?"10px 16px":"0"};
  border: 1px solid #bee3f8;
  border-radius: ${({$collapsed:e})=>e?"12px":"0"};
  background: #f7fbff;
  overflow: hidden;
  flex-shrink: 0;
  ${({$collapsed:e})=>!e&&Mt`
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  `}
`,O$=l.button`
  width: 100%;
  border: none;
  background: #ebf8ff;
  color: #1a365d;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: var(--font-size-sm);
  font-weight: 800;
  cursor: pointer;
`,W$=l.div`
  padding: 12px 14px 14px;
  display: grid;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`,U$=l.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 8px;
`,_r=l.div`
  padding: 8px 10px;
  border-radius: 9px;
  background: #fff;
  border: 1px solid #e2e8f0;
`,Er=l.div`
  font-size: 18px;
  font-weight: 800;
  color: #2b6cb0;
`,zr=l.div`
  font-size: var(--font-size-xs);
  color: #718096;
  margin-top: 2px;
`,Yr=l.div`
  display: grid;
  gap: 6px;
`,Jr=l.div`
  font-size: var(--font-size-xs);
  font-weight: 800;
  color: #2d3748;
`,us=l.div`
  padding: 9px 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #2d3748;
  font-size: var(--font-size-xs);
  line-height: 1.65;
  white-space: pre-wrap;
`,Ea=l.div`
  display: grid;
  gap: 6px;
`,Ri=l.button`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 8px 10px;
  text-align: left;
  color: #2d3748;
  font-size: var(--font-size-xs);
  line-height: 1.5;
  cursor: ${({$clickable:e})=>e?"pointer":"default"};
  &:hover {
    border-color: ${({$clickable:e})=>e?"#90cdf4":"#e2e8f0"};
    background: ${({$clickable:e})=>e?"#f0f7ff":"#fff"};
  }
`,H$=l.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
`,K$=l.button`
  border: 1px solid ${({$important:e})=>e?"#fbd38d":"#e2e8f0"};
  border-radius: 9px;
  background: ${({$important:e})=>e?"#fffbeb":"#fff"};
  padding: 9px 10px;
  text-align: left;
  cursor: pointer;
  color: #2d3748;
  font-size: var(--font-size-xs);
  line-height: 1.5;
  &:hover { border-color: #90cdf4; background: #f0f7ff; }
`,G$=l.div`
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 3px;
`,q$=l.div`
  margin: 10px 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff5f5;
  border: 1px solid #fc8181;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #c53030;
  font-weight: 600;
`,V$=l.div`
  margin: 10px 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f7faff;
  border: 1px solid #bee3f8;
`,Y$=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;l.div`
  margin: 6px 16px 10px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #2d3748;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
`;l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #4a5568;
  margin: 10px 16px 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;const J$=l.div`
  margin: 6px 16px 8px;
  padding: 8px 12px;
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 7px;
  font-size: 13px;
  color: #276749;
  display: flex;
  align-items: center;
  gap: 6px;
`;l.div`
  padding: 16px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;l.div`
  display: flex;
  flex-direction: column;
  align-items: ${({$incoming:e})=>e?"flex-start":"flex-end"};
`;l.div`
  font-size: var(--font-size-xs);
  color: #a0aec0;
  margin-bottom: 3px;
  padding: 0 4px;
`;l.div`
  max-width: 72%;
  padding: 10px 14px;
  border-radius: ${({$incoming:e})=>e?"4px 14px 14px 14px":"14px 4px 14px 14px"};
  font-size: var(--font-size-base);
  line-height: 1.65;
  background: ${({$incoming:e})=>e?"#f0f4f8":"#3182ce"};
  color: ${({$incoming:e})=>e?"#2d3748":"#fff"};
  white-space: pre-wrap;
  word-break: break-word;
`;l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(255,255,255,0.2);
  border-radius: 6px;
  font-size: var(--font-size-xs);
`;l.img`
  max-width: 280px;
  max-height: 280px;
  border-radius: 8px;
  display: block;
  cursor: pointer;
  object-fit: contain;
`;l.span`
  font-size: var(--font-size-xs);
  opacity: 0.65;
  font-style: italic;
`;l.span`
  font-size: var(--font-size-xs);
  color: #e53e3e;
`;l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.2);
  border-radius: 8px;
  min-width: 180px;
  max-width: 300px;
`;l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;l.span`
  font-size: var(--font-size-sm);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;l.span`
  font-size: var(--font-size-xs);
  opacity: 0.7;
  flex-shrink: 0;
`;const za=l.div`
  border-top: 2px solid #eaeff5;
  background: #ffffff;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
`,Xu=l.div`
  padding: 10px 16px 6px;
`,X$=l.textarea`
  width: 100%;
  min-height: 160px;
  max-height: 360px;
  padding: 12px 14px;
  border: 1px solid #d1dce8;
  border-radius: 8px;
  font-size: var(--font-size-base);
  line-height: 1.75;
  color: #2d3748;
  resize: vertical;
  outline: none;
  font-family: inherit;
  background: #fafcfe;
  box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus { border-color: #4299e1; box-shadow: 0 0 0 2px rgba(66,153,225,0.12); }
  &::placeholder { color: #a0aec0; }
  &:disabled { background: #f7fafc; color: #a0aec0; cursor: not-allowed; }
`,Z$=l.div`
  min-height: 160px;
  padding: 12px 14px;
  border: 1px dashed #b3d1f0;
  border-radius: 8px;
  font-size: var(--font-size-base);
  line-height: 1.75;
  color: #4a5568;
  background: #f0f7ff;
  white-space: pre-wrap;
  word-break: break-word;
  animation: ${Bc} 1.5s ease-in-out infinite;
`,Da=l.div`
  margin-bottom: 6px;
  padding: 7px 10px;
  background: #fff5f5;
  border: 1px solid #fc8181;
  border-radius: 7px;
  font-size: var(--font-size-xs);
  color: #c53030;
`,Xr=l.div`
  margin-bottom: 6px;
  padding: 6px 10px;
  border-radius: 7px;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: 6px;
  ${({$variant:e})=>e==="info"&&Mt`
    background: #ebf8ff; border: 1px solid #90cdf4; color: #2b6cb0;
  `}
  ${({$variant:e})=>e==="success"&&Mt`
    background: #f0fff4; border: 1px solid #9ae6b4; color: #276749;
  `}
  ${({$variant:e})=>e==="error"&&Mt`
    background: #fff5f5; border: 1px solid #fc8181; color: #c53030;
  `}
`,Q$=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 16px 0;
`,Zu=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 10px;
  flex-wrap: wrap;
`,eT=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #edf2ff;
  border: 1px solid #c3d7fa;
  border-radius: 20px;
  font-size: var(--font-size-xs);
  color: #2d3748;
  max-width: 210px;
`,tT=l.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,nT=l.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: #718096;
  font-size: 14px;
  flex-shrink: 0;
  &:hover { color: #e53e3e; }
`,rT=l.button`
  height: 30px;
  padding: 0 12px;
  border: 1.5px dashed #b3d1f0;
  border-radius: 20px;
  background: transparent;
  font-size: var(--font-size-xs);
  color: #4a90d9;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #edf2ff; border-color: #4a90d9; }
`,St=l.button`
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  ${({$variant:e})=>e==="send"?Mt`
      background: linear-gradient(135deg, #38a169, #2f855a);
      color: #fff;
      &:hover:not(:disabled) { background: linear-gradient(135deg, #2f855a, #276749); }
    `:e==="danger"?Mt`
      background: #fed7d7; color: #c53030;
      &:hover:not(:disabled) { background: #feb2b2; }
    `:e==="muted"?Mt`
      background: #edf2f7; color: #4a5568;
      &:hover:not(:disabled) { background: #e2e8f0; }
    `:Mt`
      background: linear-gradient(135deg, #4299e1, #3182ce);
      color: #fff;
      &:hover:not(:disabled) { background: linear-gradient(135deg, #3182ce, #2b6cb0); }
    `}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,iT=l(St)`
  ${({$active:e})=>e&&Mt`
    background: #eef4ff;
    color: #1a56db;
    border: 1.5px solid #3b7ded;
    &:hover:not(:disabled) { background: #e4edff; }
  `}
`,oT=l.input`
  width: 100%;
  box-sizing: border-box;
  border: 1.5px solid #d1dce8;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: var(--font-size-sm);
  color: #2d3748;
  outline: none;
  margin-bottom: 10px;
  &:focus { border-color: #4299e1; box-shadow: 0 0 0 2px rgba(66,153,225,0.12); }
`,sT=l.div`
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fafcff;
`,aT=l.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  padding-left: ${({$depth:e})=>12+e*16}px;
  border-bottom: 1px solid #edf2f7;
  background: ${({$selected:e})=>e?"#eef4ff":"#fff"};
  cursor: pointer;
  &:hover { background: ${({$selected:e})=>e?"#e4edff":"#f7fafc"}; }
  &:last-child { border-bottom: none; }
`,lT=l.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2d3748;
  font-size: var(--font-size-sm);
  font-weight: 600;
`,cT=l.div`
  padding: 24px 12px;
  text-align: center;
  color: #a0aec0;
  font-size: var(--font-size-sm);
`,Sh=l.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
`,kh=l.div`
  background: #fff; border-radius: 12px; padding: 28px 32px;
  width: 520px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
`,dT=l(kh)`
  width: 560px;
  padding: 22px 24px;
`,jh=l.div`
  font-size: 17px; font-weight: 700; color: #1a202c; margin-bottom: 18px;
  display: flex; align-items: center; gap: 8px;
`,uT=l.div`
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px;
`,Qu=l.button`
  padding: 5px 14px; border-radius: 20px;
  border: 1.5px solid ${({$active:e})=>e?"#3182ce":"#cbd5e0"};
  background: ${({$active:e})=>e?"#ebf3fd":"#f7fafc"};
  color: ${({$active:e})=>e?"#2b6cb0":"#4a5568"};
  font-size: var(--font-size-sm); cursor: pointer;
  &:hover { border-color: #3182ce; background: #ebf3fd; color: #2b6cb0; }
`,pT=l.div`
  display: grid; grid-template-columns: 110px 1fr; gap: 10px 12px; align-items: center;
  margin-bottom: 14px;
`,Mi=l.label`font-size: var(--font-size-sm); color: #4a5568; text-align: right; padding-right: 4px;`,ep=l.input`
  padding: 6px 10px; border: 1.5px solid #cbd5e0; border-radius: 6px;
  font-size: var(--font-size-sm); width: 100%; box-sizing: border-box;
  &:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49,130,206,0.15); }
`,Ih=l.div`
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px;
`,fT=l.div`
  font-size: var(--font-size-sm); margin-bottom: 10px;
  color: ${({$tone:e})=>e==="ok"?"#38a169":e==="err"?"#e53e3e":"#718096"};
`,mT=l.div`
  background: #ebf8ff; border: 1px solid #90cdf4; border-radius: 6px;
  padding: 10px 12px; font-size: var(--font-size-xs); color: #2b6cb0; margin-bottom: 12px; line-height: 1.65;
`,gT=l.div`
  background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 6px;
  padding: 8px 12px; font-size: var(--font-size-xs); color: #276749; margin-bottom: 12px;
`,tp=l.select`
  padding: 6px 10px; border: 1.5px solid #cbd5e0; border-radius: 6px;
  font-size: var(--font-size-sm); width: 100%; box-sizing: border-box; background: #fff; color: #2d3748;
  &:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49,130,206,0.15); }
`,np=l.div`
  grid-column: 1 / -1;
  font-size: var(--font-size-xs); font-weight: 700; color: #718096; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 6px 0 2px; border-bottom: 1px solid #eaeff5; margin-top: 2px;
`,hT=l.div`
  display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm); color: #4a5568;
  input[type="checkbox"] { width: 15px; height: 15px; cursor: pointer; }
`,xT=l.span`
  font-size: var(--font-size-xs); font-weight: 600; color: #e67e22; margin-left: 4px;
`;function Ol(e){try{return new Date(e).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}catch{return""}}function bT(e){const n=e.trim()||"（无主题）";return/^(fwd?|转发)\s*[:：]/i.test(n)?n:`Fwd: ${n}`}function yT(e){return typeof DOMParser>"u"?e.replace(/<[^>]+>/g," "):new DOMParser().parseFromString(e,"text/html").body.textContent||""}function vT(e,n){const r=(n.body||(n.htmlBody?yT(n.htmlBody):"")).trim();return["","","---------- 转发邮件 ----------",`发件人：${n.fromName||n.from||"未知发件人"}${n.from?` <${n.from}>`:""}`,`收件人：${n.toName||n.to||""}${n.to?` <${n.to}>`:""}`,`时间：${Ol(n.timestamp)||n.timestamp}`,`主题：${e.subject||"（无主题）"}`,"",r||"（原邮件无正文）"].join(`
`)}function wT(e){return e<1024?`${e} B`:e<1048576?`${(e/1024).toFixed(1)} KB`:`${(e/1048576).toFixed(1)} MB`}function ST(e){return/pdf/i.test(e)?"📄":/image/i.test(e)?"🖼️":/word|docx/i.test(e)?"📝":/excel|xlsx|spreadsheet/i.test(e)?"📊":/zip|rar|7z|tar|gz/i.test(e)?"📦":/text/i.test(e)?"📃":"📎"}function kT(e){return{task:"任务",request:"需求",question:"询问",notice:"通知",attachment_review:"附件处理",meeting:"会议",approval:"审批",spam:"垃圾",ordinary:"普通"}[e||""]||"普通"}function jT(e){return{need_reply:"需要回复",need_review:"需要审阅",need_schedule:"需要安排",need_forward:"需要转发",notification:"通知",spam_or_noise:"低价值/风险",no_action:"无需处理"}[e]||e}function IT(e){return e==="interview"?"interview":e==="deadline"?"deadline":e==="reminder"?"reminder":"meeting"}function $T(e){var i,o;const n=e==null?void 0:e.timeIntent;if(!(n!=null&&n.hasTimeRequirement))return null;if(((e==null?void 0:e.calendarConflictCount)??0)>0)return{label:"时间冲突",variant:"calendar_warning"};const r=!!(n.startTime||n.deadlineTime||(i=n.candidateTimes)!=null&&i.length);return(e!=null&&e.calendarEventId||n.startTime||n.deadlineTime)&&n.needsUserConfirmation?{label:"待确认日程",variant:"calendar"}:n.type==="deadline"&&n.deadlineTime?{label:"截止事项",variant:"calendar_warning"}:n.type==="candidate_times"&&((o=n.candidateTimes)!=null&&o.length)?{label:"候选时间",variant:"calendar"}:r?{label:"日程",variant:"calendar"}:{label:"需确认时间",variant:"calendar_warning"}}function $h(e){var n;return((n=e.timeIntent)==null?void 0:n.title)||e.summary||"日程安排"}function li(e){if(!e)return"时间待确认";const n=new Date(e);return Number.isFinite(n.getTime())?n.toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"时间待确认"}function TT(e,n){const r=String(e||"").replace(/\r/g,"").replace(/\n{3,}/g,`

`).trim();return r.length<=n?r:r.slice(0,n).trim()}function CT(e,n){var r,i,o;return[e.subject,e.fromName,e.from,TT(e.body,1800),n==null?void 0:n.summary,n==null?void 0:n.category,n==null?void 0:n.emailCategory,(r=n==null?void 0:n.actionPlan)==null?void 0:r.intentType,n==null?void 0:n.suggestedAction,n==null?void 0:n.reason,(i=n==null?void 0:n.timeIntent)==null?void 0:i.title,(o=n==null?void 0:n.timeIntent)==null?void 0:o.sourceText].filter(Boolean).join(`
`)}function PT(e){const n=new Map(e.map(r=>[r.id,r]));return e.map(r=>{var a;let i=0,o=r.parentId;const s=new Set;for(;o&&n.has(o)&&!s.has(o);)s.add(o),i+=1,o=(a=n.get(o))==null?void 0:a.parentId;return{department:r,depth:i}})}async function AT(e,n,r){var d;const i=r.trim();if(!i||e.length===0)return[];if(!((d=window.electronAPI)!=null&&d.retrieveKnowledgeChunks))return console.warn("[CommunicationWorkbench] knowledge retrieval API unavailable"),[];const o=new Map(n.map(u=>[u.id,u.name])),s=Math.max(2,Math.ceil(8/Math.max(1,e.length))),a=[];for(const u of e)try{const f=await window.electronAPI.retrieveKnowledgeChunks(u,{query:i,mode:"auto",maxChunks:s}),p=new Map(f.citations.map(m=>[m.chunkId,m]));for(const m of f.hits){const g=new Set(m.matchedBy);if(!(m.score>1||g.has("title")||g.has("summary")||g.has("keyword")))continue;const x=p.get(m.chunk.id);a.push({knowledgeId:u,knowledgeName:o.get(u),sourceId:m.chunk.documentId,sourceTitle:(x==null?void 0:x.documentTitle)||m.chunk.titlePath[0],text:m.chunk.text,score:m.score})}}catch(f){console.warn("[CommunicationWorkbench] knowledge retrieval failed:",f)}return Array.from(new Map(a.map(u=>[`${u.knowledgeId}:${u.sourceId}:${u.text.slice(0,80)}`,u])).values()).sort((u,f)=>(f.score??0)-(u.score??0)).slice(0,8)}function rp(e,n){const r=e.timeIntent;if(!(r!=null&&r.hasTimeRequirement))return null;const i=(n==null?void 0:n.startTime)||(r.type==="deadline"?r.deadlineTime:r.startTime);return i?{id:e.calendarEventId||"",startTime:i,endTime:(n==null?void 0:n.endTime)||r.endTime,eventType:IT(r.type)}:null}function ip(e,n){return{id:gr(e.id),from:n.from,fromName:n.fromName||"",to:n.to||"",toName:n.toName||"",subject:e.subject,body:n.body,htmlBody:n.htmlBody,timestamp:n.timestamp,unread:e.unread,replied:e.replied,threadId:e.id,attachments:[],folder:e.folder==="sent"?"sent":e.folder==="trash"?"trash":"inbox"}}function op(e,n,r){const i=$h(e),o=e.timeIntent,s=r||(o==null?void 0:o.startTime)||(o==null?void 0:o.deadlineTime);if((o==null?void 0:o.type)==="candidate_times"&&r){const a=li(r);return`English:

Thank you for sharing the available time options. The time that works best for me is ${a}. Please let me know if this works for you.

Best regards

中文：

您好：

感谢您提供候选时间。我更方便的时间是 ${a}，请您确认是否合适。

祝好！`}return n.length>0?`English:

Thank you for the arrangement regarding "${i}". I am sorry, but I already have a commitment during that time. Would it be possible to adjust to another suitable time?

Best regards

中文：

您好：

感谢您关于“${i}”的安排。抱歉，我该时间段已有安排，是否可以调整到其他合适时间？

祝好！`:`English:

Thank you for the arrangement regarding "${i}". I am available at ${li(s)} and can attend as scheduled.

Best regards

中文：

您好：

感谢您关于“${i}”的安排。可以，我这个时间有空参加。

祝好！`}function _T(e){return{read:"阅读",edit:"编辑",review:"审阅",sign:"签署",return:"回传",archive:"归档"}[e]||e}function ET(e){return{document:"文稿工作台",ppt:"PPT 工作台",excel:"数据工作台",preview:"预览",none:"无需打开工作台"}[e||"none"]||"无需打开工作台"}const zT=[{key:"email",label:"收件箱"},{key:"sent",label:"已发送"},{key:"trash",label:"回收站"}],DT=[{key:"all",label:"全部"},{key:"unread",label:"未读"},{key:"has-attachment",label:"有附件"}],RT="ai:mail-sort-mode";function MT(){try{if(localStorage.getItem(RT)==="time")return"time"}catch{}return"smart"}function sp(e){var i;const n=((i=e.lastMessage)==null?void 0:i.timestamp)??"";if(!n)return 0;const r=typeof n=="number"?n:new Date(n).getTime();return Number.isFinite(r)?r:0}function ap(e,n,r){if(e.providerType!=="email")return-1;let i=0;if((n==null?void 0:n.status)==="skipped")i=25;else if(!n||n.status!=="success")i=50;else{const{category:o,priority:s,riskLevel:a,deadline:d,detectedIntent:u}=n;o==="risk"||a==="high"?i=1e3:a==="medium"?i=950:o==="reply_required"&&s==="high"?i=900:o==="action_required"&&s==="high"?i=850:o==="reply_required"&&s==="medium"?i=750:o==="action_required"&&s==="medium"?i=700:o==="reply_required"&&s==="low"?i=600:o==="action_required"&&s==="low"?i=550:o==="read_only"?i=300:o==="archive_candidate"?i=150:o==="promotion"?i=100:i=80,d?i+=80:u&&/deadline|meeting|approval|confirmation|urgent/i.test(u)&&(i+=40)}return e.unread&&(i+=20),r&&(i+=30),e.hasAttachments&&(n==null?void 0:n.status)==="success"&&(n.category==="action_required"||n.category==="reply_required")&&(i+=20),i}function FT({attachments:e,messageId:n,subject:r,fromName:i,fromEmail:o,activeWorkspacePath:s,onSavedToWorkspace:a}){const[d,u]=c.useState({}),[f,p]=c.useState({}),{setGenerationMode:m}=Cn(),g=kr(),h=c.useCallback(async k=>{var y,j;if(!k.tempPath){alert("暂无可下载的缓存文件");return}const v=k.id;u(S=>({...S,[v]:!0}));try{const S=await((j=(y=window.electronAPI)==null?void 0:y.emailDownloadAttachment)==null?void 0:j.call(y,{tempPath:k.tempPath,filename:k.filename}));(S==null?void 0:S.ok)===!1&&alert(`下载失败：${S.error.message}`)}catch(S){alert(`下载失败：${S instanceof Error?S.message:String(S)}`)}finally{u(S=>({...S,[v]:!1}))}},[]),x=c.useCallback(async(k,v)=>{var j,S;if(!s){alert("请先打开一个工作区");return}if(!n){alert("缺少邮件信息，无法保存附件");return}const y=k.id;p(z=>({...z,[y]:!0}));try{const z=await((S=(j=window.electronAPI)==null?void 0:j.mailOpenAttachmentInWorkspace)==null?void 0:S.call(j,{messageId:n,attachmentId:k.id,fileName:k.filename,mimeType:k.contentType,source:"imap",subject:r,fromName:i,fromEmail:o,workspacePath:s}));if(!z){alert("当前环境未提供邮件附件保存能力");return}if(z.ok===!1){alert(`保存失败：${z.error.message}`);return}if(a==null||a(z),v)if(z.openTarget==="document"||z.openTarget==="preview")window.dispatchEvent(new CustomEvent("ai-office-open-document-request",{detail:{filePath:z.filePath,sourceContext:z.sourceContext}})),m("document");else if(z.openTarget==="presentation"){const P=new Date().toISOString(),I=z.sourceContext.originalAttachmentName||z.fileName;if(g.setModeSession("ppt",O=>({...O,generationStatus:{phase:"running",message:`正在导入邮件附件 ${I}…`,updatedAt:P},resultTitle:I,resultPath:null,resultAssetId:null,resultType:"pptx",resultPreviewText:"",pptSourceType:"email_attachment",pptOriginalFilePath:z.filePath,pptOriginalFileName:I,pptImportStatus:"importing",pptTaskStatus:"importing",pptLiveSlides:[],pptPreviewSlides:[],pptTotalSlides:0,pptActiveSlideIndex:0,pptDeckDocumentId:null,pptDeckPath:null,pptActiveSkillId:null,pptActiveTemplateManifestId:null,pptImportWarnings:[],lastUpdatedAt:P})),m("ppt"),z.fileName.toLowerCase().endsWith(".ppt")){const O="旧版 .ppt 暂不支持导入为可编辑 DeckDocument，请先另存为 .pptx 后重试。";g.setModeSession("ppt",D=>({...D,generationStatus:{phase:"error",message:O,updatedAt:new Date().toISOString()},pptImportStatus:"failed",pptTaskStatus:"failed",pptImportWarnings:[O]})),alert(O);return}g.setModeSession("ppt",O=>({...O,generationStatus:{phase:"running",message:"正在提取 PPTX 内容…",updatedAt:new Date().toISOString()},pptImportStatus:"extracting",pptTaskStatus:"extracting"}));const b=await window.electronAPI.pptxImportFromFile({workspacePath:s,pptxPath:z.filePath,source:{type:"email_attachment",messageId:n,attachmentId:k.id,filename:I},importMode:"rule_based",language:"zh"});if(!b.success||!b.deckDocumentId||!b.deckPath){const O=b.error||"PPTX 导入失败";g.setModeSession("ppt",D=>({...D,generationStatus:{phase:"error",message:O,updatedAt:new Date().toISOString()},pptImportStatus:"failed",pptTaskStatus:"failed",pptImportWarnings:b.extractionWarnings||[]})),alert(`导入 PPT 失败：${O}`);return}const $=WI(b.deck,b.previewSlides||[]);g.setModeSession("ppt",O=>{var D;return{...O,generationStatus:{phase:"completed",message:"已导入为 AI Office 可编辑内容结构，导出时会生成新的 PPTX 文件。",updatedAt:new Date().toISOString()},pptImportStatus:"ready",pptTaskStatus:"completed",pptDeckDocumentId:b.deckDocumentId||null,pptDeckPath:b.deckPath||null,pptOriginalFilePath:b.originalPptxPath||z.filePath,pptPreviewSlides:b.previewSlides||[],pptLiveSlides:$,pptTotalSlides:$.length||(((D=b.previewSlides)==null?void 0:D.length)??0),pptActiveSlideIndex:0,pptImportWarnings:b.extractionWarnings||[],pptActiveTemplateManifestId:null,resultTitle:I,resultPreviewText:"已导入为 AI Office 可编辑内容结构，导出时会生成新的 PPTX 文件。",lastUpdatedAt:new Date().toISOString()}})}else z.openTarget==="spreadsheet"&&m("data")}catch(z){alert(`保存失败：${z instanceof Error?z.message:String(z)}`)}finally{p(z=>({...z,[y]:!1}))}},[s,o,i,n,a,m,r,g]);return e.length===0?null:t.jsxs(A$,{children:[t.jsxs(_$,{children:["📎 附件（",e.length,"）"]}),t.jsx(E$,{children:e.map(k=>t.jsxs(z$,{children:[t.jsx(R$,{children:ST(k.contentType)}),t.jsxs(M$,{children:[t.jsx(F$,{title:k.filename,children:k.filename}),t.jsx(B$,{children:wT(k.size)})]}),t.jsxs(D$,{children:[t.jsx(_a,{onClick:()=>h(k),disabled:d[k.id]||!k.tempPath,children:d[k.id]?"...":"⬇ 下载"}),t.jsx(_a,{onClick:()=>void x(k,!1),disabled:f[k.id]||!s,children:"保存到工作区"}),t.jsx(_a,{onClick:()=>void x(k,!0),disabled:f[k.id]||!s,children:"打开到工作台"})]})]},k.id))})]})}function BT({message:e}){const[n,r]=c.useState(e.htmlBody?"html":"text"),[i,o]=c.useState(!1),s=c.useRef(null),[a,d]=c.useState(320);c.useEffect(()=>{r(e.htmlBody?"html":"text"),o(!1),d(320)},[e.id,e.htmlBody]);const u=c.useMemo(()=>e.htmlBody?i?e.htmlBody:e.htmlBody.replace(/src="(https?:\/\/[^"]+)"/gi,'src="" data-external-src="$1"'):"",[e.htmlBody,i]),f=c.useCallback(()=>{var h;const g=(h=s.current)==null?void 0:h.contentDocument;g!=null&&g.body&&d(Math.max(200,g.body.scrollHeight+32))},[]),p=!!e.htmlBody,m=p&&/data-external-src=/.test(u);return t.jsxs(t.Fragment,{children:[p&&t.jsxs($$,{children:[t.jsx(Aa,{$active:n==="html",onClick:()=>r("html"),children:"HTML"}),t.jsx(Aa,{$active:n==="text",onClick:()=>r("text"),children:"纯文本"}),n==="html"&&!i&&m&&t.jsxs(T$,{children:["⚠ 已屏蔽外部图片",t.jsx(Aa,{onClick:()=>o(!0),children:"显示外部图片"})]})]}),n==="html"&&p?t.jsx(C$,{ref:s,srcDoc:u,sandbox:"allow-same-origin",style:{height:a},onLoad:f,title:"邮件正文"}):t.jsx(P$,{children:e.body})]})}function LT({onClose:e}){const{emailAccountConfig:n,saveEmailAccount:r,clearEmailAccount:i,isRealEmailMode:o}=yh(),s=new Set(["imap.qq.com","imap.163.com","imap.gmail.com","outlook.office365.com"]),a=()=>({user:"",password:"",displayName:"",imapHost:"imap.qq.com",imapPort:993,imapSecure:!0,smtpHost:"smtp.qq.com",smtpPort:465,smtpSecure:!0,username:"",providerType:"",allowSelfSignedCerts:!1}),[d,u]=c.useState(n??a()),[f,p]=c.useState(null),[m,g]=c.useState(!1),h=d.providerType==="internal-imap",x=!h&&/outlook|office365/i.test(d.imapHost),k=P=>{u(I=>({...I,imapHost:P.imapHost,imapPort:P.imapPort,imapSecure:P.imapSecure,smtpHost:P.smtpHost,smtpPort:P.smtpPort,smtpSecure:P.smtpSecure,providerType:""})),p(null)},v=()=>{u(P=>{const I=!P.imapHost||s.has(P.imapHost);return{...P,providerType:"internal-imap",...I?{imapHost:"mail.ai.cuhk.edu.cn",imapPort:993,imapSecure:!0,smtpHost:"mail.ai.cuhk.edu.cn",smtpPort:465,smtpSecure:!0}:{},username:P.username||P.user||""}}),p(null)},y=async()=>{var P,I;p({tone:"loading",msg:"正在连接..."});try{const b=await((I=(P=window.electronAPI)==null?void 0:P.emailTestConnection)==null?void 0:I.call(P,d));b&&typeof b=="object"&&"ok"in b?p({tone:b.ok?"ok":"err",msg:b.message}):p({tone:"ok",msg:"连接成功！"})}catch(b){p({tone:"err",msg:b instanceof Error?b.message:String(b)})}},j=async()=>{g(!0);try{await r(d),e()}catch{g(!1)}},S=async()=>{await i(),e()},z=(P,I,b="text",$="")=>t.jsxs(t.Fragment,{children:[t.jsx(Mi,{children:I}),t.jsx(ep,{type:b,placeholder:$,value:String(d[P]??""),onChange:O=>u(D=>({...D,[P]:b==="number"?Number(O.target.value):O.target.value}))})]});return t.jsx(Sh,{onClick:P=>{P.target===P.currentTarget&&e()},children:t.jsxs(kh,{children:[t.jsx(jh,{children:"📧 邮件账号设置"}),t.jsxs(uT,{children:[p1.map(P=>t.jsx(Qu,{$active:!h&&d.imapHost===P.imapHost,onClick:()=>k(P),children:P.label},P.label)),t.jsx(Qu,{$active:h,onClick:v,children:"🏢 内部邮箱"})]}),h&&t.jsx(gT,{children:"适用于自建 mailcow、iRedMail、校园/企业内网邮件服务器"}),x&&t.jsxs(mT,{children:["⚠️ ",t.jsx("strong",{children:"Outlook / Office 365 需要应用密码"}),t.jsx("br",{}),"请在 account.microsoft.com → 安全 → 高级安全选项中创建应用密码，填入下方密码栏。"]}),t.jsxs(pT,{children:[z("displayName","显示名称","text",h?"例：王老师":"例：王明"),z("user","邮箱地址","email",h?"teacher@ai.cuhk.edu.cn":"例：wang@qq.com"),h&&t.jsxs(t.Fragment,{children:[t.jsx(Mi,{children:"用户名"}),t.jsx(ep,{type:"text",placeholder:"默认同邮箱地址",value:d.username??"",onChange:P=>u(I=>({...I,username:P.target.value}))})]}),z("password","密码/授权码","password","邮箱密码或授权码"),h&&t.jsx(np,{children:"IMAP 接收服务器"}),z("imapHost","IMAP 服务器","text"),z("imapPort","IMAP 端口","number"),h&&t.jsxs(t.Fragment,{children:[t.jsx(Mi,{children:"IMAP 加密"}),t.jsxs(tp,{value:d.imapSecure?"ssl":"starttls",onChange:P=>u(I=>({...I,imapSecure:P.target.value==="ssl"})),children:[t.jsx("option",{value:"ssl",children:"SSL/TLS（推荐，端口 993）"}),t.jsx("option",{value:"starttls",children:"STARTTLS（端口 143）"}),t.jsx("option",{value:"none",children:"None（不加密）"})]})]}),h&&t.jsx(np,{children:"SMTP 发送服务器"}),z("smtpHost","SMTP 服务器","text"),z("smtpPort","SMTP 端口","number"),h&&t.jsxs(t.Fragment,{children:[t.jsx(Mi,{children:"SMTP 加密"}),t.jsxs(tp,{value:d.smtpSecure?"ssl":"starttls",onChange:P=>u(I=>({...I,smtpSecure:P.target.value==="ssl"})),children:[t.jsx("option",{value:"ssl",children:"SSL/TLS（推荐，端口 465）"}),t.jsx("option",{value:"starttls",children:"STARTTLS（端口 587）"}),t.jsx("option",{value:"none",children:"None（不加密）"})]})]}),h&&t.jsxs(t.Fragment,{children:[t.jsx(Mi,{}),t.jsxs(hT,{children:[t.jsx("input",{type:"checkbox",id:"allowSelfSigned",checked:d.allowSelfSignedCerts??!1,onChange:P=>u(I=>({...I,allowSelfSignedCerts:P.target.checked}))}),t.jsxs("label",{htmlFor:"allowSelfSigned",children:["允许自签名证书",t.jsx(xT,{children:"仅在可信内网服务器使用"})]})]})]})]}),f&&t.jsx(fT,{$tone:f.tone,children:f.msg}),t.jsxs(Ih,{children:[o&&t.jsx(St,{$variant:"danger",onClick:S,style:{marginRight:"auto"},children:"清除账号"}),t.jsx(St,{$variant:"muted",onClick:y,children:"验证连接"}),t.jsx(St,{$variant:"muted",onClick:e,children:"取消"}),t.jsx(St,{onClick:j,disabled:m,children:m?"保存中...":"保存并连接"})]})]})})}function Wl(e){return e.actionPlan??{intentType:e.emailCategory==="promotion"||e.emailCategory==="spam"||e.category==="risk"?"spam":e.requiresOpenAttachment?"attachment_review":e.requiresAction?"task":e.requiresReply?"question":"ordinary",title:e.summary||"邮件处理建议",brief:e.suggestedAction||"人工确认后处理",replyStrategy:{shouldReply:!!(e.requiresReply??e.needsReply),tone:"neutral",reason:e.suggestedAction||"AI 自动判断回复策略"}}}function NT(e,n){var r,i,o,s,a,d,u,f,p;if(e.intentType==="task"){const m=(r=e.taskChecklist)!=null&&r.length?e.taskChecklist.map(g=>`${g.text}${g.deadline?`（截止：${g.deadline}）`:""}`):((i=n.todos)==null?void 0:i.map(g=>`${g.title}${g.deadline?`（截止：${g.deadline}）`:""}`))??[];return m.length?t.jsxs(en,{children:[t.jsx(tn,{children:"关键任务"}),t.jsx(Kt,{children:m.map((g,h)=>t.jsxs("div",{children:["• ",g]},h))})]}):null}if(e.intentType==="request"){const m=(o=e.requestItems)!=null&&o.length?e.requestItems:[{id:"default",text:e.brief,required:!0}];return t.jsxs(en,{children:[t.jsx(tn,{children:"对方需求"}),t.jsxs(Kt,{children:[m.map(g=>t.jsxs("div",{children:["• ",g.text,g.required?"（必需）":""]},g.id)),n.requiresAttachment&&t.jsx("div",{children:"• 可能需要随回复发送附件"})]})]})}if(e.intentType==="question")return t.jsxs(en,{children:[t.jsx(tn,{children:"问题要点"}),t.jsxs(Kt,{children:[t.jsx("div",{children:((s=e.questionAnswer)==null?void 0:s.question)||n.summary}),(((a=e.questionAnswer)==null?void 0:a.answerDraft)||n.suggestedAction)&&t.jsxs("div",{children:["回复要点：",((d=e.questionAnswer)==null?void 0:d.answerDraft)||n.suggestedAction]})]})]});if(e.intentType==="notice"||e.intentType==="meeting"){const m=(f=(u=e.noticeSummary)==null?void 0:u.keyPoints)!=null&&f.length?e.noticeSummary.keyPoints:[n.summary];return t.jsxs(en,{children:[t.jsx(tn,{children:"关键信息"}),t.jsx(Kt,{children:m.map((g,h)=>t.jsxs("div",{children:["• ",g]},`kp-${h}`))})]})}if(e.intentType==="attachment_review"){const m=(p=e.attachmentActions)!=null&&p.length?e.attachmentActions:[{action:"review",targetWorkspace:"preview",note:e.brief,fileName:void 0}];return t.jsxs(en,{children:[t.jsx(tn,{children:"附件处理建议"}),t.jsx(Kt,{children:m.map((g,h)=>t.jsxs("div",{children:["• ",g.fileName||"附件","：",_T(g.action),"，推荐",ET(g.targetWorkspace),"。",g.note]},`att-${h}`))})]})}return e.intentType==="approval"?t.jsxs(en,{children:[t.jsx(tn,{children:"待决事项"}),t.jsxs(Kt,{children:[t.jsxs("div",{children:["• ",e.brief||n.suggestedAction||"确认是否批准或拒绝"]}),t.jsx("div",{children:"• 建议正式、谨慎回复，关键结论需人工确认"})]})]}):null}function OT(e,n){if(e.intentType==="spam")return e.brief||"建议移入可恢复区域，不生成正式回复草稿";const r=e.replyStrategy.shouldReply?"需要回复。":"不需要回复。",i=e.replyStrategy.reason||n.suggestedAction||e.brief||"";return i?`${r}${i}`:r.slice(0,-1)}function WT({topics:e,onTopicClick:n}){return e.length===0?t.jsx(us,{children:"暂无足够的成功分析结果用于归纳内容主题。"}):t.jsx(H$,{children:e.map(r=>{const i=r.importanceLevel==="important"||r.importanceLevel==="mixed";return t.jsxs(K$,{$important:i,onClick:()=>n(r),title:"点击高亮相关邮件",children:[t.jsxs(G$,{children:[r.topic," · ",r.count," 封",i?" · 含重要邮件":""]}),t.jsx("div",{children:r.description}),r.representativeSubjects.length>0&&t.jsxs("div",{style:{marginTop:5,color:"#718096"},children:["代表邮件：",r.representativeSubjects.join("；")]})]},`${r.topic}-${r.relatedMessageIds.join("|")}`)})})}function UT({summary:e,collapsed:n,onCollapsedChange:r,onMailClick:i,onTopicClick:o}){return t.jsxs(N$,{$collapsed:n,children:[t.jsxs(O$,{type:"button",onClick:()=>r(!n),children:[t.jsx("span",{children:"AI邮件分析报告"}),t.jsx("span",{children:n?"展开":"收起"})]}),!n&&t.jsxs(W$,{children:[t.jsxs(U$,{children:[t.jsxs(_r,{children:[t.jsx(Er,{children:e.totalEmails}),t.jsx(zr,{children:"本次分析"})]}),t.jsxs(_r,{children:[t.jsx(Er,{children:e.importantCount}),t.jsx(zr,{children:"重要邮件"})]}),t.jsxs(_r,{children:[t.jsx(Er,{children:e.normalCount}),t.jsx(zr,{children:"普通邮件"})]}),t.jsxs(_r,{children:[t.jsx(Er,{children:e.lowCount}),t.jsx(zr,{children:"低优先级"})]}),t.jsxs(_r,{children:[t.jsx(Er,{children:e.needReplyCount}),t.jsx(zr,{children:"需要回复"})]}),t.jsxs(_r,{children:[t.jsx(Er,{children:e.draftReplyCount}),t.jsx(zr,{children:"已生成草稿"})]}),e.failedCount>0&&t.jsxs(_r,{children:[t.jsx(Er,{children:e.failedCount}),t.jsx(zr,{children:"分析失败"})]})]}),t.jsxs(Yr,{children:[t.jsx(Jr,{children:"主要发件人排行"}),t.jsx(Ea,{children:e.senderStats.slice(0,6).map(s=>t.jsxs(Ri,{type:"button",children:[t.jsx("strong",{children:s.fromName||s.fromEmail}),"：",s.count," 封",s.importantCount>0?`，其中 ${s.importantCount} 封重要`:""]},s.fromEmail))})]}),t.jsxs(Yr,{children:[t.jsx(Jr,{children:"需要优先处理的邮件"}),t.jsx(Ea,{children:(e.actionItems.length?e.actionItems:e.topImportantEmails).slice(0,8).map(s=>t.jsxs(Ri,{type:"button",$clickable:!0,onClick:()=>i(s.messageId),title:"点击定位到邮件详情",children:[t.jsx("strong",{children:s.subject}),t.jsxs("div",{style:{color:"#718096",marginTop:2},children:[s.fromName||s.fromEmail||"未知发件人"," · ",jT(s.actionType),"suggestedNextStep"in s?` · ${s.suggestedNextStep}`:s.reason?` · ${s.reason}`:""]})]},s.messageId))})]}),t.jsxs(Yr,{children:[t.jsx(Jr,{children:"日程发现"}),t.jsxs(us,{children:["本次分析发现：会议/面试安排 ",e.calendarStats.meetingOrInterviewCount," 封，截止事项 ",e.calendarStats.deadlineCount," 封，多候选时间 ",e.calendarStats.candidateTimesCount," 封，时间冲突 ",e.calendarStats.conflictCount," 封，已加入待确认日程 ",e.calendarStats.tentativeEventCount," 个。"]}),(e.calendarItems.pending.length>0||e.calendarItems.conflicts.length>0||e.calendarItems.deadlines.length>0)&&t.jsxs(Ea,{children:[e.calendarItems.pending.slice(0,4).map(s=>t.jsxs(Ri,{type:"button",$clickable:!0,onClick:()=>i(s.messageId),children:[t.jsx("strong",{children:"需要确认的日程："}),s.title," · ",s.startTime||s.deadlineTime||s.subject]},`pending-${s.messageId}`)),e.calendarItems.conflicts.slice(0,4).map(s=>t.jsxs(Ri,{type:"button",$clickable:!0,onClick:()=>i(s.messageId),children:[t.jsx("strong",{children:"存在冲突的日程："}),s.title," · 与 ",s.conflictCount," 个日程冲突"]},`conflict-${s.messageId}`)),e.calendarItems.deadlines.slice(0,4).map(s=>t.jsxs(Ri,{type:"button",$clickable:!0,onClick:()=>i(s.messageId),children:[t.jsx("strong",{children:"截止事项："}),s.title," · ",s.deadlineTime||s.subject]},`deadline-${s.messageId}`))]})]}),t.jsxs(Yr,{children:[t.jsx(Jr,{children:"邮件内容概览"}),t.jsx(us,{children:e.contentOverviewText})]}),t.jsxs(Yr,{children:[t.jsx(Jr,{children:"主题分布"}),t.jsx(WT,{topics:e.contentTopics,onTopicClick:o})]}),t.jsxs(Yr,{children:[t.jsx(Jr,{children:"中文总结"}),t.jsx(us,{children:e.reportText})]})]})]})}function HT({departments:e,selectedIds:n,onCancel:r,onConfirm:i,onClear:o}){const[s,a]=c.useState(""),[d,u]=c.useState(n);c.useEffect(()=>{u(n)},[n]);const f=c.useMemo(()=>{const g=s.trim().toLowerCase(),h=PT(e);return g?h.filter(({department:x})=>x.name.toLowerCase().includes(g)||x.nameEn.toLowerCase().includes(g)||x.id.toLowerCase().includes(g)):h},[e,s]),p=c.useCallback(g=>{u(h=>h.includes(g)?h.filter(x=>x!==g):[...h,g])},[]),m=c.useCallback(()=>{u([]),o()},[o]);return t.jsx(Sh,{onClick:g=>{g.target===g.currentTarget&&r()},children:t.jsxs(dT,{children:[t.jsx(jh,{children:"选择知识库"}),t.jsx(oT,{autoFocus:!0,value:s,onChange:g=>a(g.target.value),placeholder:"搜索知识库名称"}),t.jsx(sT,{children:f.length===0?t.jsx(cT,{children:"暂无可选择的知识库"}):f.map(({department:g,depth:h})=>{const x=d.includes(g.id);return t.jsxs(aT,{$selected:x,$depth:h,children:[t.jsx("input",{type:"checkbox",checked:x,onChange:()=>p(g.id)}),t.jsx(lT,{title:g.name,children:g.name})]},g.id)})}),t.jsxs(Ih,{children:[t.jsx(St,{$variant:"muted",onClick:r,children:"取消"}),t.jsx(St,{$variant:"muted",onClick:m,disabled:d.length===0,children:"清空"}),t.jsx(St,{onClick:()=>i(d),children:"确认"})]})]})})}function KT(e,n,r,i){var u,f;const o=(n==null?void 0:n.status)==="success"?Wl(n):void 0,s=n==null?void 0:n.timeIntent,a=((r==null?void 0:r.conflicts.length)??(n==null?void 0:n.calendarConflictCount)??0)>0,d=i?(u=s==null?void 0:s.candidateTimes)==null?void 0:u.find(p=>p.startTime===i):void 0;return{knowledgeSnippets:e,triageContext:n?{summary:n.summary,category:n.emailCategory||n.category,actionType:(o==null?void 0:o.intentType)||n.detectedIntent,reason:n.reason,suggestedAction:n.suggestedAction,timeIntentTitle:s==null?void 0:s.title,timeIntentSourceText:s==null?void 0:s.sourceText}:void 0,calendarContext:s!=null&&s.hasTimeRequirement?{hasTimeRequirement:!0,intentType:s.type,title:s.title||(n==null?void 0:n.summary),startTime:(d==null?void 0:d.startTime)||s.startTime,endTime:(d==null?void 0:d.endTime)||s.endTime,deadlineTime:s.deadlineTime,location:s.location,candidateTimes:(s.candidateTimes??[]).map(p=>{const m=r==null?void 0:r.candidateConflicts.find(g=>g.startTime===p.startTime);return{startTime:p.startTime,endTime:p.endTime,hasConflict:m?m.conflicts.length>0:void 0}}),recommendedTime:i??((f=r==null?void 0:r.recommendedCandidate)==null?void 0:f.startTime),conflictCount:(r==null?void 0:r.conflicts.length)??(n==null?void 0:n.calendarConflictCount),hasConflict:a}:void 0}}function GT(){var rd,id,od,sd,ad,ld,cd;const{filteredThreads:e,selectedThreadId:n,selectedThread:r,activeFilter:i,setActiveFilter:o,selectThread:s,currentDraft:a,streamingPreview:d,regenerateDraft:u,updateDraftContent:f,saveDraft:p,addDraftAttachment:m,removeDraftAttachment:g,sendReply:h,isRealEmailMode:x,isFetchingMails:k,fetchError:v,refreshMails:y,refreshSent:j,threads:S,matrixPhase:z,createMatrixDirect:P,deleteMail:I,restoreMail:b,refreshTrash:$,emailAccountConfig:O}=yh(),{triageResults:D,aiDrafts:R,mailTodos:V,triggerAnalysis:te,analysisStatus:q,analysisProgress:W,currentBatchSummary:fe,isAnalyzingEmails:le,isWorkerRunning:Q,enqueueMail:ge,regenerateDraft:J,discardDraft:H}=bj(),{activeWorkspacePath:T,refreshTree:w}=Ft(),{departments:L}=Ii(),{state:N}=rn();N.phase;const M=N.phase==="logged_in"?N.session.user.username:null,{session:A,sendImageMessage:ee,sendFileMessage:me}=xh();(A==null?void 0:A.userId)??(M&&`${M}`);const Ie=N.phase==="logged_in"?N.session.user.id:null,[Fe,Z]=c.useState(!1),[X,ye]=c.useState(!1),[Ee,G]=c.useState(void 0),[F,se]=c.useState(void 0);c.useEffect(()=>{const U=Tu();U&&(G([U]),se(void 0),ye(!0))},[]),c.useEffect(()=>{const U=()=>{const Pe=Tu();Pe&&(G([Pe]),se(void 0),ye(!0))};return window.addEventListener("open-communication-workbench",U),()=>window.removeEventListener("open-communication-workbench",U)},[]);const[_e,de]=c.useState(""),[oe,Te]=c.useState(null),[C,E]=c.useState(!1),[K,_]=c.useState(null),[Y,ae]=c.useState(!1),[je,Le]=c.useState(null),[Ke,Be]=c.useState(null),[mt,He]=c.useState(MT),[dt,Xe]=c.useState(null),[Re,tt]=c.useState(()=>{try{const U=sessionStorage.getItem("aioffice.pendingSourceMailId");if(!U)return null;const Pe=JSON.parse(U);return Pe.messageId?{messageId:Pe.messageId,subject:Pe.subject}:null}catch{return null}}),[ue,ze]=c.useState(null),[re,pe]=c.useState(new Set),[ne,Ve]=c.useState(null),[ve,ct]=c.useState(null),[Je,Ge]=c.useState(!1),[ie,Ae]=c.useState({}),[De,Ne]=c.useState(null),[qe,Oe]=c.useState({}),[gt,rt]=c.useState({}),[Qe,Ze]=c.useState(!1),ut=c.useRef(null),zt=c.useRef(void 0),[qt,_t]=c.useState(!1),[Xn,ht]=c.useState(null),bn=c.useRef(null);c.useRef(null),c.useRef(null);const Zn=c.useRef(null),[kt,Wt]=c.useState(new Set),[Vt,Qn]=c.useState({}),[An,Bt]=c.useState({}),[ce,we]=c.useState({}),[Se,he]=c.useState(!1),[Me,xe]=c.useState([]),[xt,vt]=c.useState(!1),[et,It]=c.useState(null),[mn,Bn]=c.useState(null),[xo,$t]=c.useState({}),[bo,Ci]=c.useState({}),Ir=c.useRef(new Set),Pi=c.useMemo(()=>S.filter(U=>U.unread).length,[S]);c.useEffect(()=>{const U=Pe=>{const be=Pe.detail;be!=null&&be.messageId&&tt({messageId:be.messageId,subject:be.subject})};return window.addEventListener("open-calendar-source-mail-select",U),()=>window.removeEventListener("open-calendar-source-mail-select",U)},[]),c.useEffect(()=>{if(!Re)return;o("email"),Wt(new Set([Re.messageId]));const U=hi(Re.messageId);if(S.find(be=>be.id===U)){s(U),Xe(null),tt(null),sessionStorage.removeItem("aioffice.pendingSourceMailId");return}Xe(`请在邮件列表中查看来源邮件：${Re.subject||Re.messageId}`)},[Re,s,o,S]);const B=c.useMemo(()=>[...e].sort((U,Pe)=>{const be=gr(U.id),Ye=gr(Pe.id);if(mt==="smart"){const Ue=ap(U,D[be],!!R[be]),lt=ap(Pe,D[Ye],!!R[Ye]);if(lt!==Ue)return lt-Ue}return sp(Pe)-sp(U)}),[e,D,R,mt]),ke=(r==null?void 0:r.providerType)==="chat"?r.messages.length:0;c.useEffect(()=>{const U=Zn.current;U&&ke>0&&U.scrollTo({top:U.scrollHeight,behavior:"smooth"})},[ke]),c.useEffect(()=>{const U=Pe=>{const{mailId:be,content:Ye}=Pe.detail;((r==null?void 0:r.providerType)==="email"?gr(r.id):null)===be&&f(Ye)};return document.addEventListener("ai-draft-insert",U),()=>document.removeEventListener("ai-draft-insert",U)},[r,f]);const Ce=c.useCallback(U=>{Array.from(U.target.files??[]).forEach(be=>{const Ye=be;m({filename:Ye.name,path:Ye.path??"",size:Ye.size,contentType:Ye.type||"application/octet-stream"})}),U.target.value=""},[m]);c.useCallback(async U=>{var Ye;const Pe=(Ye=U.target.files)==null?void 0:Ye[0];if(U.target.value="",!Pe||!(r!=null&&r.id))return;if(Pe.size>10*1024*1024){ht("图片不能超过 10 MB");return}const be=r.id.replace(/^matrix:/,"");_t(!0),ht(null);try{await ee(be,Pe)}catch(Ue){ht(Ue.message??"图片上传失败")}finally{_t(!1)}},[r,ee]),c.useCallback(async U=>{var Ye;const Pe=(Ye=U.target.files)==null?void 0:Ye[0];if(U.target.value="",!Pe||!(r!=null&&r.id))return;if(Pe.size>25*1024*1024){ht("附件不能超过 25 MB");return}const be=r.id.replace(/^matrix:/,"");_t(!0),ht(null);try{await me(be,Pe)}catch(Ue){ht(Ue.message??"附件上传失败")}finally{_t(!1)}},[r,me]),c.useCallback(async()=>{const U=_e.trim();if(U){Te(null),E(!0);try{await P(U),de("")}catch(Pe){Te(Pe.message??"无法创建私聊")}finally{E(!1)}}},[_e,P]);const pt=c.useCallback(async()=>{if(!K)return;const U=e.find(Ye=>Ye.id===K)??((r==null?void 0:r.id)===K?r:null);if(!U)return;const Pe=U.id.replace(/^email:/,""),be=U.folder==="trash"?"trash":U.folder==="sent"?"sent":"inbox";ae(!0),Le(null);try{await I(Pe,be),_(null),s(null)}catch(Ye){Le(Ye.message||"删除邮件失败")}finally{ae(!1)}},[K,e,r,I,s]),it=(a==null?void 0:a.status)==="generating",yt=!!(a&&a.status!=="not_generated"),on=(a==null?void 0:a.status)==="sent",yo=(a==null?void 0:a.status)==="sending",Pt=!!r&&yt&&!it&&!on&&!yo&&!!((rd=a==null?void 0:a.content)!=null&&rd.trim()),wt=(r==null?void 0:r.lastMessage)??null,$r=(r==null?void 0:r.providerType)==="email"&&(r==null?void 0:r.folder)==="sent",vo=(r==null?void 0:r.providerType)==="email"&&(r==null?void 0:r.folder)==="trash",at=(r==null?void 0:r.providerType)==="email"?gr(r.id):null,We=at?D[at]:void 0,Xc=at?V.filter(U=>U.sourceEmailId===at):[],Tx=(We==null?void 0:We.skipReason)==="system_delivery_notice",er=at?((id=ie[at])==null?void 0:id.knowledgeIds)??[]:[],Ks=at?qe[at]:void 0;at&&gt[at];const Cx=er.length===0?"知识库":er.length===1?"知识库 · 1":`知识库 · ${er.length}`,Px=c.useCallback(()=>{if(!r||!wt)return;const U=wt.attachments.flatMap(Pe=>Pe.tempPath?[{fileName:Pe.filename,filePath:Pe.tempPath,mimeType:Pe.contentType,sizeBytes:Pe.size}]:[]);wt.attachments.length>U.length&&Xe("部分原邮件附件没有本地缓存，未自动加入转发邮件。"),G(void 0),se({subject:bT(r.subject),body:vT(r,wt),attachments:U,variant:"forward"}),ye(!0)},[r,wt]),Ax=c.useCallback((U,Pe)=>{const be=Array.from(new Set(Pe.map(Ye=>Ye.trim()).filter(Boolean)));Ae(Ye=>{if(be.length===0){const{[U]:Ue,...lt}=Ye;return lt}return{...Ye,[U]:{mailId:U,knowledgeIds:be,updatedAt:new Date().toISOString()}}}),Oe(Ye=>{const{[U]:Ue,...lt}=Ye;return lt}),Ne(null)},[]),_x=c.useCallback(U=>{Ae(Pe=>{const{[U]:be,...Ye}=Pe;return Ye}),Oe(Pe=>{const{[U]:be,...Ye}=Pe;return Ye})},[]),Ex=c.useCallback(async()=>{var be,Ye,Ue;if(a!=null&&a.userEdited&&!window.confirm("当前草稿已被编辑，重新生成会覆盖现有内容，是否继续？"))return;const U=at?((be=ie[at])==null?void 0:be.knowledgeIds)??[]:[],Pe=r&&wt?CT(ip(r,wt),We):"";if(U.length>0&&r&&wt&&at){Oe(bt=>({...bt,[at]:{variant:"info",text:"正在检索所选知识库的相关内容..."}}));const lt=await AT(U,L,Pe),Dt={mailId:at,selectedKnowledgeIds:U,snippets:lt,knowledgeContextLength:0,promptHasKnowledgeContext:!1,promptHasKnowledgeRequirement:!1};if(ut.current=Dt,lt.length>0){const bt=KT(lt,We,ne,ve);bt.onPromptBuilt=ot=>{var ft;((ft=ut.current)==null?void 0:ft.mailId)===at&&(ut.current={...ut.current,...ot})},u(!0,bt),Oe(ot=>({...ot,[at]:{variant:"success",text:"已参考知识库内容生成回复。"}}));return}Oe(bt=>({...bt,[at]:{variant:"info",text:"未找到高度相关的知识库内容，已按邮件正文生成回复。"}}))}if((Ye=We==null?void 0:We.timeIntent)!=null&&Ye.hasTimeRequirement){const lt=op(We,(ne==null?void 0:ne.conflicts)??[],(Ue=ne==null?void 0:ne.recommendedCandidate)==null?void 0:Ue.startTime);f(lt),Ge(!0);return}u(!0)},[a==null?void 0:a.userEdited,at,ie,r,wt,L,We,ne,ve,f,u]);c.useEffect(()=>{const U=a==null?void 0:a.status;if(zt.current==="generating"&&U==="generated"){Ge(!0);const Pe=setTimeout(()=>Ge(!1),3e3);zt.current=U;const be=ut.current;if(be){const Ye=(a==null?void 0:a.content)??"",Ue=Vj({mailId:be.mailId,selectedKnowledgeIds:be.selectedKnowledgeIds,snippets:be.snippets,knowledgeContextLength:be.knowledgeContextLength,promptHasKnowledgeContext:be.promptHasKnowledgeContext,promptHasKnowledgeRequirement:be.promptHasKnowledgeRequirement,draft:Ye});if(rt(lt=>({...lt,[be.mailId]:Ue})),ut.current=null,Ue.selectedKnowledgeIds.length>0){const lt=Ue.status==="likely_used"||Ue.status==="in_prompt_but_unclear_usage"?"已参考所选知识库生成回复。":Ue.status==="fallback_no_relevant_snippets"?"未找到高度相关的知识库内容，已按邮件正文生成回复。":Ue.status==="retrieved_but_not_in_prompt"?"知识库参考未生效，已按邮件正文生成回复。":null;lt&&Oe(Dt=>({...Dt,[be.mailId]:{variant:Ue.likelyUsedKnowledge?"success":"info",text:lt}}))}}return()=>clearTimeout(Pe)}zt.current=U},[a==null?void 0:a.status,a==null?void 0:a.content]),c.useEffect(()=>{Ge(!1),ze(null)},[at]),c.useEffect(()=>{let U=!1;async function Pe(){var ot;if(!((ot=We==null?void 0:We.timeIntent)!=null&&ot.hasTimeRequirement)){Ve(null);return}const be=await ji(),Ye=rp(We),Ue=Ye?vr(Ye,be):[],Dt=(We.timeIntent.candidateTimes??[]).map(ft=>{const jt=rp(We,ft);return{startTime:ft.startTime,endTime:ft.endTime,conflicts:jt?vr(jt,be):[]}}),bt=Dt.find(ft=>ft.conflicts.length===0)??Dt[0];U||(Ve({conflicts:Ue,candidateConflicts:Dt,recommendedCandidate:bt?{startTime:bt.startTime,endTime:bt.endTime}:void 0}),ct((bt==null?void 0:bt.startTime)??null))}return Pe(),()=>{U=!0}},[We,at]);const zx=c.useMemo(()=>r?r.messages.flatMap(U=>U.isIncoming?U.attachments:[]):[],[r]),Dx=!r||B.some(U=>U.id===r.id),Rx=c.useCallback(U=>{Ze(!0),o("email"),Wt(new Set([U])),s(hi(U))},[s,o]),Mx=c.useCallback(U=>{Ze(!0),o("email"),Wt(new Set(U.relatedMessageIds));const Pe=U.relatedMessageIds[0];Pe&&s(hi(Pe))},[s,o]),Gs=c.useCallback(async()=>{var lt,Dt;if(!r||!wt||!(We!=null&&We.timeIntent))return;const U=ip(r,wt);if((await ji()).find(bt=>bt.sourceMessageId===U.id&&bt.status!=="ignored"&&bt.status!=="cancelled")){ze("该邮件已有对应日程，请在日程管理中查看。");return}const Ye=ve?(lt=We.timeIntent.candidateTimes)==null?void 0:lt.find(bt=>bt.startTime===ve):ne==null?void 0:ne.recommendedCandidate,Ue=await hj(U,We.timeIntent,{source:"email_user_confirmed",status:"confirmed",needsUserConfirmation:!1,candidateTime:Ye});ze(Ue?(Dt=Ue.conflictEventIds)!=null&&Dt.length?`已加入日程，并检测到 ${Ue.conflictEventIds.length} 个时间冲突。`:"已加入日程。":"当前时间信息不完整，请手动创建日程。")},[r,wt,We,ne,ve]),Tr=c.useCallback((U=!1)=>{var be;if(!(We!=null&&We.timeIntent))return;const Pe=U&&((ne==null?void 0:ne.conflicts.length)??0)===0?[{eventId:"reserved",title:"",startTime:We.timeIntent.startTime||"",status:"confirmed",conflictLevel:"hard"}]:(ne==null?void 0:ne.conflicts)??[];f(op(We,Pe,ve??((be=ne==null?void 0:ne.recommendedCandidate)==null?void 0:be.startTime))),Ge(!0)},[We,ne,ve,f]),Fx=c.useCallback(()=>{at&&pe(U=>new Set([...U,at])),ze(null)},[at]);c.useEffect(()=>{try{JSON.parse(localStorage.getItem("aioffice.autoWorkflowStarted")??"[]").forEach(Pe=>Ir.current.add(Pe))}catch{}},[]),c.useEffect(()=>{var U,Pe;for(const[be,Ye]of Object.entries(D)){if(!Ye||Ye.status!=="success"||Vt[be]||Ir.current.has(be))continue;const Ue=S.find(ft=>(ft.providerType==="email"?gr(ft.id):ft.id)===be);if(!$I(Ye,Ue==null?void 0:Ue.folder))continue;Ir.current.add(be);try{const ft=JSON.parse(localStorage.getItem("aioffice.autoWorkflowStarted")??"[]");localStorage.setItem("aioffice.autoWorkflowStarted",JSON.stringify([...new Set([...ft,be])]))}catch{}const lt=((U=Ue==null?void 0:Ue.messages)==null?void 0:U.find(ft=>ft.isIncoming))??(Ue==null?void 0:Ue.lastMessage),Dt=Hu(Ye,(Ue==null?void 0:Ue.subject)??"",""),bt=Ku(be,(Ue==null?void 0:Ue.id)??be,Ye,(Ue==null?void 0:Ue.subject)??"",(lt==null?void 0:lt.from)??(lt==null?void 0:lt.fromName)??"unknown",Dt);if((bt==null?void 0:bt.workflowPattern)==="agent_autonomous"){const ft=(lt==null?void 0:lt.from)??(lt==null?void 0:lt.fromName)??"";OI({matter:bt,senderEmail:ft,emailBody:((Pe=Ue==null?void 0:Ue.messages)==null?void 0:Pe.map(jt=>jt.text??"").join(" "))??""}).then(jt=>{if(Ci(sn=>({...sn,[be]:jt})),$t(sn=>({...sn,[be]:!0})),jt.status==="human_review_required"){const sn=Gu(be,(Ue==null?void 0:Ue.id)??be,Ye,(Ue==null?void 0:Ue.subject)??"(无主题)",ft||"unknown",Ie??"demo-user",T??"default",bt);Bt(Ln=>({...Ln,[be]:"loading"})),Ia(sn).then(Ln=>{Qn(Cr=>({...Cr,[be]:Ln.processInstanceId})),Bt(Cr=>({...Cr,[be]:"done"}))}).catch(Ln=>{Bt(Cr=>({...Cr,[be]:"error"})),we(Cr=>({...Cr,[be]:Ln instanceof Error?Ln.message:String(Ln)}))})}}).catch(jt=>{Ci(sn=>({...sn,[be]:{status:"human_review_required",message:`Agent 异常：${jt instanceof Error?jt.message:String(jt)}，转人工复核。`}}))});continue}const ot=Gu(be,(Ue==null?void 0:Ue.id)??be,Ye,(Ue==null?void 0:Ue.subject)??"(无主题)",(lt==null?void 0:lt.from)??(lt==null?void 0:lt.fromName)??"unknown",Ie??"demo-user",T??"default",bt);Bt(ft=>({...ft,[be]:"loading"})),we(ft=>{const jt={...ft};return delete jt[be],jt}),Ia(ot).then(ft=>{Qn(jt=>({...jt,[be]:ft.processInstanceId})),Bt(jt=>({...jt,[be]:"done"})),$t(jt=>({...jt,[be]:!0}))}).catch(ft=>{Bt(jt=>({...jt,[be]:"error"})),we(jt=>({...jt,[be]:ft instanceof Error?ft.message:String(ft)}))})}},[D,S]);const Zc=c.useCallback(async()=>{var Dt,bt;if(!r||!at)return;const U=wt,Pe=We,be=(Pe==null?void 0:Pe.urgency)==="urgent"?"urgent":(Pe==null?void 0:Pe.urgency)==="soon"||(Pe==null?void 0:Pe.priority)==="high"?"important":"normal",Ye=Pe?Hu(Pe,r.subject||"",((Dt=U==null?void 0:U.body)==null?void 0:Dt.slice(0,300))??""):"unknown",Ue=Pe?Ku(at,r.id,Pe,r.subject||"",(U==null?void 0:U.from)||(U==null?void 0:U.fromName)||"unknown",Ye):null,lt={sourceType:"email",emailId:at,threadId:r.id,subject:r.subject||"(无主题)",sender:(U==null?void 0:U.from)||(U==null?void 0:U.fromName)||"unknown",requesterId:Ie||"demo-user",assignee:"approver-001",priority:be,category:Ue?Ue.scenarioType:(Pe==null?void 0:Pe.emailCategory)||(Pe==null?void 0:Pe.category)||"email_approval",aiSummary:Ue?vh(Ue):(Pe==null?void 0:Pe.summary)||(((bt=U==null?void 0:U.body)==null?void 0:bt.slice(0,200))??""),attachmentIds:((U==null?void 0:U.attachments)??[]).map(ot=>ot.id),workspaceId:T||"default"};Bt(ot=>({...ot,[at]:"loading"})),we(ot=>{const ft={...ot};return delete ft[at],ft});try{const ot=await Ia(lt);Qn(ft=>({...ft,[at]:ot.processInstanceId})),Bt(ft=>({...ft,[at]:"done"}))}catch(ot){Bt(ft=>({...ft,[at]:"error"})),we(ft=>({...ft,[at]:ot instanceof Error?ot.message:String(ot)}))}},[r,at,wt,We,Ie,T]),Ai=c.useCallback(async()=>{vt(!0),It(null);try{const U=await Jj("approver-001");xe(U)}catch(U){It(U instanceof Error?U.message:String(U))}finally{vt(!1)}},[]),Bx=c.useCallback(()=>{he(!0),Ai()},[Ai]),Qc=c.useCallback(async(U,Pe)=>{Bn(U);try{await Xj(U,{decision:Pe,comment:Pe==="approve"?"同意":"不同意，请补充材料",operatorId:"approver-001"}),await Ai()}catch(be){It(be instanceof Error?be.message:String(be))}finally{Bn(null)}},[Ai]),Lx=!!(fe&&!Qe),ed=W.done+W.cached+W.failed,td=W.total>0&&ed>=W.total&&W.running===0,Nx=td&&(le||Q||q==="running"),nd=(le||Q)&&!td;return t.jsxs(UI,{children:[t.jsxs(HI,{children:[t.jsxs(KI,{children:[t.jsxs(GI,{children:[t.jsxs(qI,{children:[t.jsxs(VI,{children:["邮件工作台",Pi>0&&t.jsx(XI,{children:Pi})]}),t.jsxs(YI,{children:[t.jsx(Vu,{title:"刷新",onClick:i==="sent"?j:i==="trash"?$:y,disabled:k,children:k?"⟳":"🔄"}),t.jsx(Vu,{title:"邮箱设置",onClick:()=>Z(!0),children:"⚙️"})]})]}),t.jsxs(JI,{children:[x&&t.jsx(e$,{type:"button",onClick:()=>{G(void 0),se(void 0),ye(!0)},children:"✉ 新建邮件"}),t.jsx(t$,{type:"button",title:"分析收件箱邮件，自动分类并为重要邮件生成预回复草稿",onClick:te,disabled:nd,children:nd?`🤖 正在分析 ${ed}/${W.total}`:q==="done"||Nx?"✅ 分析完成":q==="failed"?"⚠ 分析失败":"✨ AI邮件分析"}),t.jsx(Ca,{$variant:"neutral",onClick:Bx,title:"查看流程待办",children:"📋 流程待办"})]})]}),t.jsx(ZI,{children:zT.map(({key:U,label:Pe})=>t.jsx(QI,{$active:i===U,onClick:()=>o(U),children:Pe},U))}),t.jsx(n$,{children:DT.map(({key:U,label:Pe})=>t.jsx(r$,{$active:i===U,onClick:()=>o(U),children:Pe},U))}),t.jsx(g$,{children:t.jsxs(x$,{children:[t.jsx(h$,{$ok:x,$warn:!x}),x?`邮箱: ${(O==null?void 0:O.email)||(O==null?void 0:O.user)||"已连接"}`:"未连接邮箱"]})}),le&&t.jsxs(Ju,{children:[t.jsx(L$,{children:"🤖"}),"正在分析 ",W.done+W.cached+W.failed,"/",W.total]}),q==="failed"&&W.failed>0&&t.jsxs(Ju,{style:{background:"#fff5f5",color:"#c53030",borderColor:"#feb2b2"},children:["⚠ 邮件分析部分失败（",W.failed," 封），已完成 ",W.done+W.cached," 封"]}),t.jsxs(i$,{children:[v&&i!=="sent"&&i!=="trash"&&t.jsxs(Yu,{style:{color:"#c53030"},children:["⚠ 收件箱加载失败：",v]}),B.length===0?t.jsx(Yu,{children:i==="trash"?"回收站为空":i==="sent"?"暂无已发送邮件":"暂无邮件"}):B.map(U=>{var lt;const Pe=gr(U.id),be=D[Pe],Ye=(be==null?void 0:be.status)==="success"?Wl(be):null,Ue=$T(be);return t.jsxs(o$,{$active:U.id===n,$unread:U.unread,$highlighted:kt.has(Pe),onClick:()=>{s(U.id),Xe(null),Ze(!0)},children:[t.jsxs(s$,{$unread:U.unread,children:[U.unread&&t.jsx(m$,{}),t.jsxs(a$,{title:U.subject,children:[U.folder==="trash"?"🗑 ":U.folder==="sent"?"↗ ":"📧 ",U.subject]}),U.hasAttachments&&t.jsx("span",{title:"含附件",style:{fontSize:12},children:"📎"})]}),t.jsxs(l$,{children:[t.jsx("span",{children:U.participantNames[0]||U.participants[0]}),t.jsx("span",{style:{marginLeft:"auto"},children:U.lastMessage?Ol(U.lastMessage.timestamp):""})]}),t.jsx(c$,{children:(lt=U.lastMessage)==null?void 0:lt.body.slice(0,72).replace(/\n/g," ")}),t.jsxs(d$,{children:[U.folder==="trash"&&t.jsx(Di,{$variant:"trash",children:"可恢复"}),(be==null?void 0:be.status)==="skipped"?t.jsx(Di,{$variant:"attach",children:"📎 附件"}):(be==null?void 0:be.status)==="success"?t.jsxs(t.Fragment,{children:[t.jsx(p$,{$cat:(Ye==null?void 0:Ye.intentType)||be.emailCategory||be.category,children:kT(Ye==null?void 0:Ye.intentType)}),(be.importance||be.priority)==="high"&&t.jsx(Di,{$variant:"important",children:"重要"}),(be.urgency==="urgent"||be.urgency==="soon")&&t.jsx(Di,{$variant:"edit",children:be.urgency==="urgent"?"紧急":"尽快"}),Ue&&t.jsx(Di,{$variant:Ue.variant,children:Ue.label})]}):t.jsx(u$,{$status:(be==null?void 0:be.status)||"none",children:(be==null?void 0:be.status)==="running"?"分析中":"未分析"})]})]},U.id)})]})]}),t.jsxs(b$,{children:[fe&&t.jsx(UT,{summary:fe,collapsed:Qe,onCollapsedChange:Ze,onMailClick:Rx,onTopicClick:Mx}),!Lx&&(r&&wt&&Dx?t.jsxs(t.Fragment,{children:[t.jsxs(y$,{ref:Zn,children:[vo&&t.jsx(q$,{children:"🗑 此邮件位于可恢复区域"}),dt&&t.jsx(J$,{children:dt}),t.jsx(v$,{children:t.jsxs(w$,{children:[t.jsxs("div",{style:{minWidth:0},children:[t.jsx(S$,{children:r.subject}),t.jsxs(k$,{children:[t.jsxs("span",{children:["发件人：",wt.fromName||wt.from]}),t.jsxs("span",{children:["收件人：",wt.toName||wt.to||""]}),t.jsx("span",{children:Ol(wt.timestamp)})]})]}),t.jsx(j$,{children:t.jsx(St,{$variant:"muted",onClick:Px,children:"转发"})})]})}),t.jsx(BT,{message:wt}),t.jsx(FT,{attachments:zx,messageId:at||void 0,subject:r.subject,fromName:wt.fromName,fromEmail:wt.from,activeWorkspacePath:T,onSavedToWorkspace:U=>{if(!U.ok){Xe(U.error.message);return}w().catch(()=>{}),Xe(U.openTarget==="document"?`附件已保存并可在文稿工作台打开：${U.fileName}`:`附件已保存到工作区：${U.fileName}`),Ie&&to(Ie,"mail","incoming_attachment_saved",{workspaceId:T??void 0,title:U.fileName,summary:`保存邮件附件到工作区：${U.fileName}`,metadata:{messageId:at,openTarget:U.openTarget}})}}),(We==null?void 0:We.status)==="success"&&(()=>{var Pe;const U=Wl(We);return t.jsxs(Ta,{$risk:U.intentType==="spam"||We.category==="risk",children:[t.jsx(Pa,{children:"🤖 AI 分析与处理方案"}),t.jsxs(en,{children:[t.jsx(tn,{children:"邮件摘要"}),t.jsx(Kt,{children:We.summary||U.brief||"（无摘要）"})]}),NT(U,We),t.jsxs(en,{children:[t.jsx(tn,{children:"处理策略"}),t.jsx(Kt,{children:OT(U,We)})]}),(Pe=We.riskFlags)!=null&&Pe.length?t.jsxs(en,{children:[t.jsx(tn,{children:"⚠ 风险提示"}),t.jsx(Kt,{children:We.riskFlags.join("；")})]}):null,(We.emailCategory==="spam"||We.emailCategory==="promotion")&&!vo&&t.jsx(St,{$variant:"danger",style:{marginTop:10},onClick:()=>_(r.id),children:"移入可恢复区域"}),at&&(()=>{const be=An[at]??"idle",Ye=ce[at],Ue=Vt[at],lt=xo[at],Dt=Ir.current.has(at),bt=bo[at];if(bt){const ot=bt.evaluation,ft=(ot==null?void 0:ot.decision)==="auto_complete"?"✅ 自动办理":(ot==null?void 0:ot.decision)==="request_missing_material"?"📋 需要补材料":"⚠ 需要人工复核",jt=(ot==null?void 0:ot.decision)==="auto_complete"?"#276749":(ot==null?void 0:ot.decision)==="request_missing_material"?"#c05621":"#c53030";return t.jsxs("div",{style:{marginTop:10},children:[bt.status==="auto_completed"&&t.jsxs(ar,{$variant:"success",children:["🤖 ",bt.message]}),bt.status==="waiting_material"&&t.jsxs(ar,{$variant:"error",children:["📋 ",bt.message]}),bt.status==="human_review_required"&&t.jsxs(t.Fragment,{children:[t.jsxs(ar,{$variant:"error",children:["⚠ ",bt.message]}),be==="loading"&&t.jsx(ar,{$variant:"success",style:{marginTop:4},children:"⏳ 已提交人工复核流程…"}),be==="done"&&Ue&&t.jsxs(ar,{$variant:"success",style:{marginTop:4},children:["🔄 人工复核流程已创建：",Ue]})]}),ot&&t.jsxs("div",{style:{marginTop:10,border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px",background:"#fafafa",fontSize:12},children:[t.jsx("div",{style:{fontWeight:700,fontSize:13,marginBottom:8,color:"#1a202c"},children:"🏫 CUHKSZ Agent 判断报告"}),t.jsxs("div",{style:{display:"flex",gap:10,marginBottom:8,flexWrap:"wrap"},children:[t.jsx("span",{style:{fontWeight:700,color:jt},children:ft}),t.jsxs("span",{style:{color:"#718096"},children:["置信度：",Math.round((ot.confidence??0)*100),"%"]})]}),ot.extractedFields&&t.jsxs("div",{style:{marginBottom:8},children:[t.jsx("div",{style:{fontWeight:600,color:"#4a5568",marginBottom:3},children:"已识别信息"}),t.jsxs("div",{style:{paddingLeft:10,color:"#4a5568",lineHeight:1.7},children:[t.jsxs("div",{children:["姓名：",ot.extractedFields.applicantName??t.jsx("span",{style:{color:"#a0aec0"},children:"未识别"})]}),t.jsxs("div",{children:["学号：",ot.extractedFields.studentId??t.jsx("span",{style:{color:"#a0aec0"},children:"未识别"})]}),t.jsxs("div",{children:["学校邮箱：",ot.extractedFields.schoolEmail??t.jsx("span",{style:{color:"#a0aec0"},children:"未识别"})]}),t.jsxs("div",{children:["补办原因：",ot.extractedFields.reason??t.jsx("span",{style:{color:"#a0aec0"},children:"未识别"})]})]})]}),t.jsxs("div",{style:{marginBottom:8},children:[t.jsx("div",{style:{fontWeight:600,color:"#4a5568",marginBottom:3},children:"材料检查"}),t.jsxs("div",{style:{paddingLeft:10,lineHeight:1.7},children:[t.jsxs("div",{style:{color:"#276749"},children:["已提供：",ot.policyChecks.providedMaterials.length>0?ot.policyChecks.providedMaterials.join("、"):t.jsx("span",{style:{color:"#a0aec0"},children:"无"})]}),t.jsxs("div",{style:{color:ot.policyChecks.missingMaterials.length>0?"#c53030":"#276749"},children:["缺失：",ot.policyChecks.missingMaterials.length>0?ot.policyChecks.missingMaterials.join("、"):"无"]})]})]}),ot.systemCheckDetails&&ot.systemCheckDetails.length>0&&t.jsxs("div",{style:{marginBottom:8},children:[t.jsx("div",{style:{fontWeight:600,color:"#4a5568",marginBottom:3},children:"系统检查"}),t.jsx("div",{style:{paddingLeft:10},children:ot.systemCheckDetails.map((sn,Ln)=>t.jsxs("div",{style:{display:"flex",gap:6,lineHeight:1.7,alignItems:"flex-start"},children:[t.jsx("span",{style:{color:sn.status==="passed"?"#276749":sn.status==="failed"?"#c53030":"#a0aec0",flexShrink:0},children:sn.status==="passed"?"✅":sn.status==="failed"?"❌":"⚪"}),t.jsxs("span",{style:{color:"#4a5568"},children:[t.jsx("strong",{children:sn.name}),"：",sn.detail]})]},Ln))})]}),t.jsxs("div",{style:{marginBottom:6},children:[t.jsx("span",{style:{fontWeight:600,color:"#4a5568"},children:"判断依据："}),t.jsx("span",{style:{color:"#4a5568"},children:ot.explanation})]}),t.jsxs("div",{children:[t.jsx("span",{style:{fontWeight:600,color:"#4a5568"},children:"下一步："}),t.jsx("span",{style:{color:"#2b6cb0"},children:ot.nextAction})]})]})]})}return t.jsxs("div",{style:{marginTop:10},children:[be==="loading"&&t.jsx(ar,{$variant:"success",children:"⏳ AI 正在自动发起流程…"}),be==="done"&&t.jsx(ar,{$variant:"success",children:lt?`🤖 已由 AI 自动发起流程：${Ue}`:`✅ 已发起流程：${Ue}`}),be==="error"&&t.jsxs(t.Fragment,{children:[t.jsxs(ar,{$variant:"error",children:["⚠ ",Dt?`自动发起流程失败：${Ye}`:Ye]}),t.jsx(Ca,{onClick:Zc,style:{marginTop:6},children:"📋 手动发起流程"})]}),be==="idle"&&!Dt&&t.jsx(Ca,{onClick:Zc,children:"📋 发起流程"})]})})()]})})(),((od=We==null?void 0:We.timeIntent)==null?void 0:od.hasTimeRequirement)&&!re.has(at??"")&&t.jsxs(Ta,{$risk:((ne==null?void 0:ne.conflicts.length)??0)>0||(We.calendarConflictCount??0)>0,children:[t.jsx(Pa,{children:((ne==null?void 0:ne.conflicts.length)??0)>0||(We.calendarConflictCount??0)>0?"📅 检测到时间冲突":We.timeIntent.type==="candidate_times"?"📅 检测到多个候选时间":We.timeIntent.type==="deadline"?"📅 检测到截止事项":We.timeIntent.type==="follow_up"?"📅 检测到日程意图，但时间不完整":"📅 检测到日程安排"}),t.jsxs(en,{children:[t.jsx(tn,{children:"事项"}),t.jsx(Kt,{children:$h(We)})]}),We.timeIntent.type==="candidate_times"?t.jsxs(en,{children:[t.jsx(tn,{children:"候选时间"}),t.jsx(Kt,{children:ne?ne.candidateConflicts.map(U=>{var be;const Pe=U.startTime===((be=ne.recommendedCandidate)==null?void 0:be.startTime);return t.jsxs("label",{style:{display:"block",cursor:"pointer",marginBottom:4},children:[t.jsx("input",{type:"radio",name:"calendar-candidate-time",checked:ve===U.startTime,onChange:()=>ct(U.startTime)})," ",li(U.startTime),U.conflicts.length>0?" · 有冲突":Pe?" · 推荐 · 无冲突":" · 无冲突"]},U.startTime)}):(We.timeIntent.candidateTimes??[]).map(U=>t.jsxs("label",{style:{display:"block",cursor:"pointer",marginBottom:4},children:[t.jsx("input",{type:"radio",name:"calendar-candidate-time",checked:ve===U.startTime,onChange:()=>ct(U.startTime)})," ",li(U.startTime)]},U.startTime))})]}):We.timeIntent.type==="follow_up"?t.jsxs(en,{children:[t.jsx(tn,{children:"提示"}),t.jsx(Kt,{children:"AI 无法确定具体时间。"})]}):t.jsxs(t.Fragment,{children:[t.jsxs(en,{children:[t.jsx(tn,{children:We.timeIntent.type==="deadline"?"截止时间":"时间"}),t.jsx(Kt,{children:li(We.timeIntent.deadlineTime||We.timeIntent.startTime)})]}),t.jsxs(en,{children:[t.jsx(tn,{children:"地点"}),t.jsx(Kt,{children:We.timeIntent.location||"未提供"})]}),t.jsxs(en,{children:[t.jsx(tn,{children:"冲突"}),t.jsx(Kt,{children:((ne==null?void 0:ne.conflicts.length)??We.calendarConflictCount??0)>0?`与 ${(ne==null?void 0:ne.conflicts.length)??We.calendarConflictCount} 个已有日程冲突`:"无冲突"})]})]}),ue&&t.jsx(Kt,{style:{marginTop:8,color:"#2b6cb0"},children:ue}),t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:8,marginTop:10},children:[We.timeIntent.type==="follow_up"?t.jsxs(t.Fragment,{children:[t.jsx(St,{onClick:()=>Tr(!1),children:"生成约时间回复"}),t.jsx(St,{$variant:"muted",onClick:()=>window.dispatchEvent(new CustomEvent("open-calendar-workspace")),children:"手动创建日程"})]}):We.timeIntent.type==="candidate_times"?t.jsxs(t.Fragment,{children:[t.jsx(St,{onClick:()=>{Gs(),Tr(!1)},children:"加入日程并生成回复"}),t.jsx(St,{$variant:"muted",onClick:()=>Tr(!1),children:"只生成回复"})]}):((ne==null?void 0:ne.conflicts.length)??We.calendarConflictCount??0)>0?t.jsxs(t.Fragment,{children:[t.jsx(St,{onClick:()=>Tr(!0),children:"生成改期回复"}),t.jsx(St,{$variant:"muted",onClick:()=>ze("该时间段已有安排，默认不展示具体冲突日程名称。"),children:"查看冲突"}),t.jsx(St,{$variant:"muted",onClick:()=>window.dispatchEvent(new CustomEvent("open-calendar-workspace")),children:"修改时间"})]}):We.timeIntent.type==="deadline"?t.jsxs(t.Fragment,{children:[t.jsx(St,{onClick:()=>void Gs(),children:"加入截止提醒"}),t.jsx(St,{$variant:"muted",onClick:()=>Tr(!1),children:"生成确认回复"})]}):t.jsxs(t.Fragment,{children:[t.jsx(St,{onClick:()=>void Gs(),children:"加入日程"}),t.jsx(St,{$variant:"muted",onClick:()=>Tr(!1),children:"生成确认回复"}),t.jsx(St,{$variant:"muted",onClick:()=>window.dispatchEvent(new CustomEvent("open-calendar-workspace")),children:"修改时间"})]}),t.jsx(St,{$variant:"muted",onClick:Fx,children:"忽略"})]})]}),Xc.length>0&&t.jsxs(V$,{children:[t.jsx(Y$,{children:"📋 任务清单"}),t.jsx("div",{style:{display:"grid",gap:6},children:Xc.map((U,Pe)=>{const be=U.description&&!U.description.startsWith("来源邮件：")?U.description:void 0;return t.jsxs("div",{style:{border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 10px",background:"#fff"},children:[t.jsxs("div",{style:{fontWeight:600,color:"#2d3748",fontSize:13},children:[Pe+1,". ",U.title]}),(be||U.deadline)&&t.jsxs("div",{style:{color:"#718096",fontSize:12,marginTop:2},children:[be&&t.jsx("span",{children:be}),U.deadline&&t.jsxs("span",{children:[be?" · ":"","截止 ",U.deadline]})]})]},U.id)})})]}),K===r.id&&t.jsxs(Ta,{$risk:!0,children:[t.jsx(Pa,{children:"确认移入可恢复区域"}),t.jsx(f$,{children:"该操作不会永久删除邮件，可在回收站中恢复。"}),je&&t.jsx(Da,{children:je}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:10},children:[t.jsx(St,{$variant:"danger",disabled:Y,onClick:()=>void pt(),children:Y?"处理中...":"确认移入"}),t.jsx(St,{$variant:"muted",onClick:()=>_(null),children:"取消"})]})]})]}),!$r&&!vo&&(Tx?t.jsx(za,{children:t.jsx(Xu,{children:t.jsx(Da,{style:{background:"#fffbeb",borderColor:"#f6e05e",color:"#744210"},children:"⚠ 这是系统退信通知，通常不需要回复。请检查收件人地址或发件域名 SPF/DKIM 配置。"})})}):t.jsxs(za,{children:[t.jsxs(Xu,{children:[it&&t.jsx(Xr,{$variant:"info",children:"⏳ AI 正在生成预回复，请稍候..."}),!it&&Je&&t.jsx(Xr,{$variant:"success",children:"✓ 预回复已生成，可编辑后发送。"}),!it&&(a==null?void 0:a.errorMessage)&&t.jsxs(Xr,{$variant:"error",children:["❌ 预回复生成失败：",a.errorMessage]}),!it&&((sd=We==null?void 0:We.timeIntent)==null?void 0:sd.hasTimeRequirement)&&t.jsxs(Xr,{$variant:((ne==null?void 0:ne.conflicts.length)??We.calendarConflictCount??0)>0?"error":"success",children:[We.timeIntent.type==="candidate_times"?`已检查日历：推荐 ${li(ve??((ad=ne==null?void 0:ne.recommendedCandidate)==null?void 0:ad.startTime))}`:((ne==null?void 0:ne.conflicts.length)??We.calendarConflictCount??0)>0?"已检查日历：该时间段已有安排。AI建议：回复对方请求改期。":"已检查日历：该时间段无冲突。AI建议：可以确认参加。"," ",t.jsx("button",{type:"button",onClick:()=>Tr(((ne==null?void 0:ne.conflicts.length)??We.calendarConflictCount??0)>0),children:((ne==null?void 0:ne.conflicts.length)??We.calendarConflictCount??0)>0?"生成改期回复":We.timeIntent.type==="candidate_times"?"使用推荐时间回复":"使用确认回复"})]}),Ks?t.jsx(Xr,{$variant:Ks.variant,children:Ks.text}):er.length>0?t.jsxs(Xr,{$variant:"info",children:["已选择 ",er.length," 个知识库，生成预回复时将自动参考相关内容。"]}):null,d?t.jsx(Z$,{children:d}):t.jsx(X$,{value:(a==null?void 0:a.content)??"",onChange:U=>f(U.target.value),placeholder:"点击生成预回复，或直接输入回复内容。AI 不会自动发送邮件。"})]}),(ld=a==null?void 0:a.attachments)!=null&&ld.length?t.jsx(Q$,{children:a.attachments.map(U=>t.jsxs(eT,{children:[t.jsx(tT,{children:U.filename}),t.jsx(nT,{onClick:()=>g(U.path),children:"×"})]},U.path||U.filename))}):null,t.jsxs(Zu,{children:[t.jsx(St,{onClick:Ex,disabled:it,children:it?"正在生成...":"生成预回复"}),t.jsx(St,{$variant:"muted",onClick:p,disabled:!a,children:"保存草稿"}),t.jsx(rT,{onClick:()=>{var U;return(U=bn.current)==null?void 0:U.click()},children:"添加附件"}),t.jsx(iT,{$variant:"muted",$active:er.length>0,onClick:()=>at&&Ne(at),disabled:!at||it,title:er.length>0?`已选择 ${er.length} 个知识库`:"选择生成预回复时参考的知识库",children:Cx}),t.jsx(St,{$variant:"send",onClick:h,disabled:!Pt,children:"确认发送"}),t.jsx("input",{ref:bn,type:"file",multiple:!0,style:{display:"none"},onChange:Ce})]})]})),vo&&t.jsxs(za,{children:[Ke&&t.jsx(Da,{children:Ke}),t.jsx(Zu,{children:t.jsx(St,{onClick:()=>{at&&(Be(null),b(at).catch(U=>{Be((U instanceof Error?U.message:String(U))||"恢复邮件失败")}))},children:"恢复到收件箱"})})]})]}):t.jsx(I$,{children:"← 选择一封邮件查看详情"}))]})]}),De&&t.jsx(HT,{departments:L,selectedIds:((cd=ie[De])==null?void 0:cd.knowledgeIds)??[],onCancel:()=>Ne(null),onClear:()=>_x(De),onConfirm:U=>Ax(De,U)}),Fe&&t.jsx(LT,{onClose:()=>Z(!1)}),X&&t.jsx(QS,{initialTo:Ee,initialSubject:F==null?void 0:F.subject,initialBody:F==null?void 0:F.body,initialAttachments:F==null?void 0:F.attachments,variant:F==null?void 0:F.variant,onClose:()=>{ye(!1),G(void 0),se(void 0)}}),Se&&t.jsx(hI,{tasks:Me,loading:xt,error:et,completingTaskId:mn,onClose:()=>he(!1),onRefresh:Ai,onApprove:U=>{Qc(U,"approve")},onReject:U=>{Qc(U,"reject")}})]})}function qT(){return t.jsx(J1,{children:t.jsx(Tj,{children:t.jsx(Hj,{mode:"email",children:t.jsx(GT,{})})})})}let Ra=null;async function VT(){return Ra||(Ra=co(()=>import("./vendor-shared-BcAh3SHW.js").then(e=>e.ar),[]).then(e=>{const n=new URL("/assets/pdf.worker-2htIQpfR.mjs",import.meta.url).href;return e.GlobalWorkerOptions.workerSrc=n,e})),Ra}async function YT(e,n=1200,r){const o=await(await VT()).getDocument({data:new Uint8Array(e)}).promise,s=[],a=typeof window<"u"?Math.min(window.devicePixelRatio||1,2):1;try{for(let d=1;d<=o.numPages;d+=1){const u=await o.getPage(d),f=u.getViewport({scale:1}),p=n/Math.max(f.width,1),m=u.getViewport({scale:Math.min(Math.max(p,.85),2)}),g=document.createElement("canvas"),h=g.getContext("2d");if(!h)throw new Error("浏览器无法创建 PDF 预览画布。");g.width=Math.round(m.width*a),g.height=Math.round(m.height*a),h.setTransform(a,0,0,a,0,0),await u.render({canvasContext:h,viewport:m,canvas:g}).promise,s.push({pageNumber:d,width:m.width,height:m.height,dataUrl:g.toDataURL("image/png")}),r==null||r(d,o.numPages)}}finally{await o.destroy().catch(()=>{})}return s}const Th=wr`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
`,JT=wr`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`,XT=l.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #f4f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
`,ZT=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #dde4ec;
  background: #fff;
  flex-shrink: 0;
`,QT=l.span`
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
`,eC=l.div`
  display: flex;
  gap: 8px;
`,Ma=l.button`
  padding: 6px 14px;
  border-radius: 6px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({$primary:e})=>e?"#3182ce":"#c5d0db"};
  background: ${({$primary:e})=>e?"#3182ce":"#fff"};
  color: ${({$primary:e})=>e?"#fff":"#4a5568"};
  transition: background 0.12s, border-color 0.12s;
  &:hover {
    background: ${({$primary:e})=>e?"#2b6cb0":"#edf2f7"};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,Fa=l.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
`,tC=l.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 260px;
  max-width: 520px;
  margin: 40px auto;
  padding: 40px 32px;
  border: 2px dashed ${({$dragOver:e})=>e?"#3182ce":"#c5d0db"};
  border-radius: 14px;
  background: ${({$dragOver:e})=>e?"#ebf4ff":"#fff"};
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: #3182ce;
    background: #f7fbff;
  }
`,nC=l.div`
  font-size: 42px;
  line-height: 1;
  opacity: 0.55;
`,rC=l.div`
  font-size: 15px;
  font-weight: 600;
  color: #2d3748;
`,iC=l.div`
  font-size: var(--font-size-sm);
  color: #718096;
  text-align: center;
  line-height: 1.5;
`,oC=l.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 60px auto;
  animation: ${Th} 1.8s infinite;
  color: #4a5568;
`,sC=l.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 820px;
  margin: 0 auto;
`,aC=l.div`
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  animation: ${JT} 0.25s ease-out;
  ${({$status:e})=>e==="generating"&&Mt`
      border-color: #63b3ed;
      box-shadow: 0 0 0 2px rgba(99, 179, 237, 0.18);
    `}
  ${({$status:e})=>e==="done"&&Mt`
      border-color: #68d391;
    `}
  ${({$status:e})=>e==="error"&&Mt`
      border-color: #fc8181;
    `}
`,lC=l.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #edf2f7;
  background: #fafcfe;
`,cC=l.span`
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #2b6cb0;
  background: #ebf4ff;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
`,dC=l.span`
  font-size: var(--font-size-xs);
  color: #718096;
  background: #edf2f7;
  padding: 2px 7px;
  border-radius: 4px;
`,uC=l.span`
  margin-left: auto;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  ${({$status:e})=>{switch(e){case"pending":return Mt`background: #edf2f7; color: #718096;`;case"generating":return Mt`background: #bee3f8; color: #2b6cb0; animation: ${Th} 1.2s infinite;`;case"done":return Mt`background: #c6f6d5; color: #276749;`;case"error":return Mt`background: #fed7d7; color: #9b2c2c;`;default:return""}}}
`,pC=l.div`
  padding: 14px 16px;
`,fC=l.div`
  font-size: 14px;
  line-height: 1.65;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-word;
`,mC=l.ul`
  list-style: none;
  padding: 6px 0 0 4px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`,gC=l.li`
  font-size: var(--font-size-sm);
  color: #4a5568;
  line-height: 1.55;
`,lp=l.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
`,cp=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #38a169;
  margin-bottom: 6px;
`,dp=l.div`
  font-size: 14px;
  line-height: 1.7;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-word;
`,hC=l.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-top: 1px solid #dde4ec;
  background: #fff;
  flex-shrink: 0;
  font-size: var(--font-size-sm);
  color: #4a5568;
`,xC=l.span`
  font-weight: 600;
  color: #2b6cb0;
`,bC=()=>{const{activeWorkspacePath:e}=Ft(),[n,r]=c.useState(()=>"upload"),[i,o]=c.useState(""),[s,a]=c.useState([]),[d,u]=c.useState({}),[f,p]=c.useState(!1),[m,g]=c.useState(""),[h,x]=c.useState(null),[k,v]=c.useState(null),y=c.useRef(null),j=c.useRef(null),S=c.useRef(!1);c.useEffect(()=>{if(!e||S.current)return;S.current=!0;const q=dg(e,"homeworkState");if(q&&q.questions&&q.questions.length>0){if(a(q.questions),q.answers){const W=Object.fromEntries(Object.entries(q.answers).map(([fe,le])=>[fe,{...le,status:le.status==="generating"?"error":le.status}]));u(W)}q.sourceFileName&&o(q.sourceFileName),q.stage==="answering"&&r("answering")}},[e]);const z=c.useRef(null);c.useEffect(()=>{if(!(!e||!S.current))return z.current&&clearTimeout(z.current),z.current=setTimeout(()=>{kl(e,"homeworkState",{stage:n,sourceFileName:i,questions:s,answers:d})},1e3),()=>{z.current&&clearTimeout(z.current)}},[e,n,i,s,d]);const P=c.useCallback(q=>{switch(q){case"pending":return"等待中";case"generating":return"生成中...";case"done":return"已完成";case"error":return"出错";default:return q}},[]),I=c.useMemo(()=>Object.values(d).filter(q=>q.status==="done").length,[d]);c.useEffect(()=>(j.current=window.electronAPI.onAiEvent(q=>{const W=q;if(W.type==="homework:extractProgress"&&x({current:Number(W.current),total:Number(W.total)}),W.type==="homework:answerChunk"){const fe=String(W.questionNumber);u(le=>({...le,[fe]:{questionNumber:fe,answer:String(W.accumulated??""),status:"generating"}}))}if(W.type==="homework:answerProgress"){const fe=String(W.questionNumber),le=String(W.status);u(Q=>{var ge;return{...Q,[fe]:{questionNumber:fe,answer:String(W.accumulated??((ge=Q[fe])==null?void 0:ge.answer)??""),status:le}}})}}),()=>{var q;(q=j.current)==null||q.call(j)}),[]);const b=c.useCallback(async q=>{var fe;g(""),x(null);const W=((fe=q.name.split(".").pop())==null?void 0:fe.toLowerCase())??"";if(o(q.name),W==="pdf"){r("extracting");try{const le=await q.arrayBuffer(),Q=await YT(le,800),ge=10,J=Q.length>ge,T=Q.slice(0,ge).map(N=>({pageNumber:N.pageNumber,base64:N.dataUrl.replace(/^data:[^;]+;base64,/,""),mediaType:"image/png"})),w=await window.electronAPI.homeworkExtractQuestions({type:"pdf",pageImages:T}),L=Array.isArray(w)?w:w.questions??[];a(L),u(Object.fromEntries(L.map(N=>[N.number,{questionNumber:N.number,answer:"",status:"pending"}]))),r(L.length>0?"answering":"upload"),L.length===0?g("未能从 PDF 中识别出任何题目，请确认文件内容。"):J&&g(`PDF 共 ${Q.length} 页，仅分析前 ${ge} 页（已识别到题目）。`)}catch(le){r("upload"),g(`PDF 解析失败: ${le instanceof Error?le.message:String(le)}`)}}else if(W==="docx"){r("extracting");try{const le=q.path;if(!le)throw new Error("无法获取文件路径，请确保在 Electron 环境中运行。");const Q=await window.electronAPI.homeworkExtractQuestions({type:"docx",filePath:le}),ge=Array.isArray(Q)?Q:Q.questions??[];a(ge),u(Object.fromEntries(ge.map(J=>[J.number,{questionNumber:J.number,answer:"",status:"pending"}]))),r(ge.length>0?"answering":"upload"),ge.length===0&&g("未能从 DOCX 中识别出任何题目，请确认文件内容。")}catch(le){r("upload"),g(`DOCX 解析失败: ${le instanceof Error?le.message:String(le)}`)}}else g("仅支持 PDF 和 DOCX 格式的作业文件。")},[]),$=c.useCallback(q=>{var fe;const W=(fe=q.target.files)==null?void 0:fe[0];W&&b(W),q.target.value=""},[b]),O=c.useCallback(q=>{q.preventDefault(),p(!1);const W=q.dataTransfer.files[0];W&&b(W)},[b]),D=c.useCallback(q=>q.replace(/```[^\n]*\n([\s\S]*?)```/g,"$1").replace(/`([^`]+)`/g,"$1").replace(/^#{1,6}\s+/gm,"").replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*\n]+)\*/g,"$1").replace(/^>\s*/gm,"").replace(/^[-*+]\s+/gm,"• ").replace(/^[-_*]{3,}\s*$/gm,"─────────────").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/\n{3,}/g,`

`).trim(),[]),R=c.useCallback(async q=>{if(k===null){v(q.number),u(W=>({...W,[q.number]:{questionNumber:q.number,answer:"",status:"generating"}}));try{const W=await window.electronAPI.homeworkGenerateAnswer(q);u(fe=>({...fe,[q.number]:{questionNumber:q.number,answer:String(W),status:"done"}}))}catch(W){u(fe=>({...fe,[q.number]:{questionNumber:q.number,answer:`生成失败: ${W instanceof Error?W.message:String(W)}`,status:"error"}}))}finally{v(null)}}},[k]),V=c.useCallback(async()=>{const q=s.map(W=>({question:W,answer:d[W.number]??{questionNumber:W.number,answer:"",status:"pending"}}));try{const W=await window.electronAPI.homeworkExportMarkdown({results:q,title:i});await navigator.clipboard.writeText(W),alert("Markdown 已复制到剪贴板")}catch{alert("导出失败，请重试。")}},[s,d,i]),te=c.useCallback(()=>{r("upload"),a([]),u({}),o(""),g(""),x(null),v(null),e&&kl(e,"homeworkState",null)},[e]);return t.jsxs(XT,{children:[t.jsxs(ZT,{children:[t.jsx(QT,{children:n==="upload"?"作业解答":`作业解答 — ${i}`}),t.jsxs(eC,{children:[n!=="upload"&&t.jsx(Ma,{onClick:te,children:"重新上传"}),n==="answering"&&I>0&&t.jsx(Ma,{onClick:V,children:"导出 Markdown"})]})]}),n==="upload"&&t.jsxs(Fa,{children:[t.jsxs(tC,{$dragOver:f,onClick:()=>{var q;return(q=y.current)==null?void 0:q.click()},onDragOver:q=>{q.preventDefault(),p(!0)},onDragLeave:()=>p(!1),onDrop:O,children:[t.jsx(nC,{children:"📄"}),t.jsx(rC,{children:"上传作业文件"}),t.jsxs(iC,{children:["支持 PDF / DOCX 格式",t.jsx("br",{}),"拖拽文件到此处，或点击选择文件"]}),t.jsx("input",{ref:y,type:"file",accept:".pdf,.docx",style:{display:"none"},onChange:$})]}),m&&t.jsx("div",{style:{textAlign:"center",color:"#e53e3e",marginTop:12,fontSize:14},children:m})]}),n==="extracting"&&t.jsx(Fa,{children:t.jsxs(oC,{children:[t.jsx("div",{style:{fontSize:28},children:"🔍"}),t.jsx("div",{style:{fontSize:15,fontWeight:600},children:"正在解析作业文件..."}),h?t.jsxs("div",{style:{fontSize:14,color:"#718096"},children:["AI 正在识别第 ",h.current," / ",h.total," 页"]}):t.jsx("div",{style:{fontSize:14,color:"#718096"},children:"AI 正在识别题目，请稍候"})]})}),n==="answering"&&t.jsxs(t.Fragment,{children:[t.jsx(Fa,{children:t.jsx(sC,{children:s.map(q=>{const W=d[q.number],fe=k===q.number,le=(W==null?void 0:W.status)!=="generating"&&k===null;return t.jsxs(aC,{$status:(W==null?void 0:W.status)??"pending",children:[t.jsxs(lC,{children:[t.jsxs(cC,{children:["第 ",q.number," 题"]}),t.jsx(dC,{children:q.type}),t.jsx(uC,{$status:(W==null?void 0:W.status)??"pending",children:P((W==null?void 0:W.status)??"pending")}),((W==null?void 0:W.status)==="pending"||(W==null?void 0:W.status)==="error"||(W==null?void 0:W.status)==="done")&&t.jsx(Ma,{$primary:(W==null?void 0:W.status)!=="done",style:{marginLeft:"auto",padding:"3px 10px",fontSize:14},onClick:()=>void R(q),disabled:!le,children:(W==null?void 0:W.status)==="done"?"重新解答":"解答此题"})]}),t.jsxs(pC,{children:[t.jsx(fC,{children:q.text}),q.options&&q.options.length>0&&t.jsx(mC,{children:q.options.map((Q,ge)=>t.jsx(gC,{children:Q},ge))}),fe&&!(W!=null&&W.answer)&&t.jsxs(lp,{children:[t.jsx(cp,{children:"AI 解答"}),t.jsx(dp,{style:{color:"#a0aec0"},children:"正在生成..."})]}),W&&W.answer&&t.jsxs(lp,{children:[t.jsx(cp,{children:"AI 解答"}),t.jsx(dp,{children:D(W.answer)})]})]})]},q.number)})})}),t.jsxs(hC,{children:[t.jsxs("span",{children:["共 ",s.length," 题"]}),t.jsxs(xC,{children:[I," / ",s.length," 已完成"]}),I===s.length&&s.length>0&&t.jsx("span",{style:{color:"#38a169",fontWeight:600},children:"全部完成 🎉"}),k!==null&&t.jsxs("span",{style:{color:"#3182ce",fontSize:14},children:["正在解答第 ",k," 题..."]})]})]})]})},yC=l.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #f4f7fa;
`,vC=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #dde4ec;
  background: #ffffff;
  flex-shrink: 0;
  min-height: 40px;
`,wC=l.div`
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-xs);
  color: #627385;
  background: #f5f8fb;
  border: 1px solid #dde4ec;
  border-radius: 6px;
  padding: 4px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,SC=l.input`
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-xs);
  color: #243447;
  background: #ffffff;
  border: 1px solid #4a90d9;
  border-radius: 6px;
  padding: 4px 10px;
  outline: none;
`,Bo=l.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #dde4ec;
  border-radius: 6px;
  background: #ffffff;
  color: #5a7080;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: #eef3f9; color: #1f3447; }
`,kC=l.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: ${({$connected:e})=>e?"#157347":"#a0522d"};
  background: ${({$connected:e})=>e?"#e7f6ec":"#fff3e0"};
  border: 1px solid ${({$connected:e})=>e?"#b8e4c9":"#f5d5ab"};
  border-radius: 999px;
  padding: 2px 8px;
  flex-shrink: 0;
`,jC=l.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`,IC={width:"100%",height:"100%",border:"none",display:"flex"},$C=l.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f4f7fa;
  gap: 12px;
`,TC=l.p`
  font-size: var(--font-size-sm);
  color: #627385;
  margin: 0;
`,CC=l.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f4f7fa;
  gap: 16px;
  padding: 32px;
`,PC=l.h3`
  margin: 0;
  font-size: 16px;
  color: #1f3142;
`,AC=l.p`
  margin: 0;
  font-size: var(--font-size-sm);
  color: #627385;
  text-align: center;
  max-width: 400px;
  line-height: 1.7;
`,_C=l.button`
  padding: 8px 20px;
  border: 1px solid #4a90d9;
  border-radius: 8px;
  background: #4a90d9;
  color: #ffffff;
  font-size: var(--font-size-sm);
  cursor: pointer;
  &:hover { background: #3a7fc8; }
`;function Ch({urlStorageKey:e,defaultUrl:n,connectingText:r="正在连接…",errorTitle:i="无法连接",errorDesc:o,urlPlaceholder:s,showUrlBar:a=!1}){const[d,u]=c.useState(()=>localStorage.getItem(e)||n),[f,p]=c.useState(!1),[m,g]=c.useState(d),[h,x]=c.useState(!0),[k,v]=c.useState(!1),[y,j]=c.useState(!1),S=c.useRef(null),z=()=>{x(!1),v(!1),j(!0)},P=()=>{x(!1),v(!0),j(!1)},I=()=>{x(!0),v(!1),S.current&&S.current.reload()},b=()=>{g(d),p(!0)},$=()=>{const R=m.trim();R&&(u(R),localStorage.setItem(e,R),x(!0),v(!1),j(!1)),p(!1)},O=()=>{p(!1),g(d)};c.useEffect(()=>{const R=S.current;if(R)return R.addEventListener("did-finish-load",z),R.addEventListener("did-fail-load",P),()=>{R.removeEventListener("did-finish-load",z),R.removeEventListener("did-fail-load",P)}});const D=o?o(d):`无法访问 ${d}。
请确认网络连通正常。`;return t.jsxs(yC,{children:[t.jsxs(vC,{children:[t.jsxs(kC,{$connected:y,children:[y?t.jsx(Kx,{size:10}):t.jsx(pd,{size:10}),y?"已连接":h?"连接中...":"未连接"]}),f?t.jsxs(t.Fragment,{children:[t.jsx(SC,{value:m,onChange:R=>g(R.target.value),onKeyDown:R=>{R.key==="Enter"&&$(),R.key==="Escape"&&O()},autoFocus:!0,placeholder:s||`输入地址，例如 ${n}`}),t.jsx(Bo,{type:"button",onClick:$,title:"确认",children:"✓"}),t.jsx(Bo,{type:"button",onClick:O,title:"取消",children:t.jsx(Rn,{size:13})})]}):t.jsxs(t.Fragment,{children:[a&&t.jsx(wC,{title:d,children:d}),t.jsx(Bo,{type:"button",onClick:I,title:"刷新",children:t.jsx(Mn,{size:13})}),a&&t.jsx(Bo,{type:"button",onClick:b,title:"修改地址",children:t.jsx(Hm,{size:13})})]})]}),t.jsxs(jC,{children:[t.jsx("webview",{ref:S,src:d,allowpopups:!0,style:IC}),h&&!k&&t.jsxs($C,{children:[t.jsx(Mn,{size:24,color:"#4a90d9",style:{animation:"spin 1s linear infinite"}}),t.jsx(TC,{children:r}),t.jsx("style",{children:"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"})]}),k&&t.jsxs(CC,{children:[t.jsx(pd,{size:40,color:"#c0a070"}),t.jsx(PC,{children:i}),t.jsx(AC,{children:D.split(`
`).map((R,V)=>t.jsxs(Ct.Fragment,{children:[R,V<D.split(`
`).length-1&&t.jsx("br",{})]},V))}),t.jsx(_C,{onClick:I,children:"重新连接"})]})]})]})}function EC(){return t.jsx(Ch,{urlStorageKey:"ai_class_remote_url",defaultUrl:"http://10.20.5.61:3005",connectingText:"正在连接 AI 课堂平台…",errorTitle:"无法连接到 AI 课堂",errorDesc:e=>`无法访问 ${e}。
请确认远程服务器正在运行，且网络连通正常。`,urlPlaceholder:"输入 AI 课堂地址，例如 http://10.20.5.61:3005"})}function zC(){return t.jsx(Ch,{urlStorageKey:"ai_forum_url",defaultUrl:"http://nft-core.xyz/forum",connectingText:"正在连接 AI 论坛…",errorTitle:"无法连接到 AI 论坛",errorDesc:e=>`无法访问 ${e}。
请确认网络连通正常。`,urlPlaceholder:"输入 AI 论坛地址，例如 http://nft-core.xyz/forum"})}async function up(){return window.electronAPI.getPlotAgentStatus()}async function DC(){return window.electronAPI.getPlotChartTypes()}async function RC(e,n=!1){return window.electronAPI.recommendPlot({filePath:e,useLlm:n})}async function MC(e,n,r){return window.electronAPI.generatePlot({filePath:e,chartType:n,outputFormat:"base64",style:(r==null?void 0:r.style)||"publication",autoRecommend:!1,mode:r==null?void 0:r.mode,x:r==null?void 0:r.x,y:r==null?void 0:r.y,hue:r==null?void 0:r.hue,title:r==null?void 0:r.title,xlabel:r==null?void 0:r.xlabel,ylabel:r==null?void 0:r.ylabel})}async function FC(){try{return await window.electronAPI.excelListDataModels()}catch{return[]}}const BC={idle:{bg:"#f1f5f9",color:"#475569",text:()=>"未检测到 Python 环境，点击「开始分析」时将自动安装。"},checking:{bg:"#eff6ff",color:"#1d4ed8",text:()=>"正在检查 Python 运行环境…"},installing:{bg:"#fff7ed",color:"#c2410c",text:()=>"正在安装 Python 依赖，首次运行可能需要几分钟…"},rebuilding:{bg:"#fef9c3",color:"#92400e",text:()=>"Python 环境异常，正在重建缓存…"},ready:{bg:"#f0fdf4",color:"#15803d",text:e=>e?`Python 环境就绪 · ${e}`:"Python 环境就绪"},failed:{bg:"#fef2f2",color:"#b91c1c",text:e=>e?`Python 环境初始化失败：${e}`:"Python 环境初始化失败，请查看调试输出。"}},LC=l.div`
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
`,NC=l.div`
  flex-shrink: 0;
  padding: 7px 18px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: ${e=>e.$color};
  background: ${e=>e.$bg};
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 10px;
`,OC=l.div`
  flex-shrink: 0;
  padding: 8px 18px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #42576b;
  background: #eef2f7;
  border-bottom: 1px solid #dde3ec;
`,WC=l.div`
  flex: 0 0 auto;
  overflow: visible;
  padding: 14px 18px 10px;
  display: grid;
  gap: 12px;
  align-content: start;
`,Lo=l.div`
  border: 1px solid rgba(203, 214, 226, 0.95);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcfe 100%);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  padding: 16px 18px;
  display: grid;
  gap: 12px;
`,Zr=l.div`
  font-size: var(--font-size-xs);
  font-weight: 800;
  color: #7a8ea2;
  letter-spacing: 0.04em;
`,UC=l.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`,HC=l.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`,pp=l.button`
  height: 34px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid ${e=>e.$active?"#1f6fd6":"#c9d6e4"};
  background: ${e=>e.$active?"linear-gradient(180deg, #e8f2ff 0%, #dbeafe 100%)":"#fff"};
  color: ${e=>e.$active?"#0c4a9e":"#334155"};
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  &:hover:not(:disabled) {
    border-color: #1f6fd6;
    color: #0c4a9e;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,Lc=l.button`
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #cad6e2;
  background: #fff;
  color: #304255;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #f5f8fc;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,KC=l(Lc)`
  border-color: #1f6fd6;
  background: #1f6fd6;
  color: #fff;
  &:hover:not(:disabled) {
    background: #195cb1;
    border-color: #195cb1;
  }
`,GC=l(Lc)`
  border-color: #fca5a5;
  color: #b91c1c;
  font-size: var(--font-size-xs);
  height: 26px;
  padding: 0 10px;
  &:hover:not(:disabled) {
    background: #fff1f2;
  }
`,Ba=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: #6b7d90;
`,fp=l.div`
  font-size: var(--font-size-sm);
  line-height: 1.45;
  color: #243447;
  word-break: break-all;
`,qC=l.textarea`
  width: 100%;
  min-height: 100px;
  resize: vertical;
  padding: 10px 12px;
  border: 1px solid #d6e0ea;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  line-height: 1.55;
  color: #1f2937;
  box-sizing: border-box;
  outline: none;
  &:focus {
    border-color: #1f6fd6;
  }
`,VC=l.div`
  padding: 12px 14px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: var(--font-size-sm);
  line-height: 1.5;
`,mp=l.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-xs);
  color: #64748b;
  padding: 2px 4px;
  border-radius: 4px;
  &:hover { background: #f1f5f9; }
`,YC=l.div`
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  background: #0f172a;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 11px;
  font-family: 'Cascadia Code', 'Consolas', monospace;
  color: #94a3b8;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
`,JC=l.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`,XC=l.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`,ZC=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #4a6074;
`,QC=l.img`
  max-width: 100%;
  width: 100%;
  border: 1px solid #dde6f0;
  border-radius: 8px;
  background: #f8fafc;
  display: block;
`;function eP(e){return/\.(csv|xlsx|xls)$/i.test(String(e||""))}const tP=["checking","installing","rebuilding"];function nP(){var L,N;console.log("[ExcelAnalysisWorkbench] mounted version: local-image-render-v1");const{activeWorkspacePath:e,refreshTree:n}=Ft(),r=kr(),[i,o]=c.useState(""),[s,a]=c.useState(!1),[d,u]=c.useState(!1),[f,p]=c.useState(null),[m,g]=c.useState(null),[h,x]=c.useState(null),[k,v]=c.useState([]),[y,j]=c.useState(""),[S,z]=c.useState("idle"),[P,I]=c.useState(""),[b,$]=c.useState([]),O=c.useCallback(M=>$(A=>[...A,M]),[]),[D,R]=c.useState(!1),V=c.useRef(null),[te,q]=c.useState([]),[W,fe]=c.useState(""),le=tP.includes(S),Q=!!(e&&i&&!d&&!le);c.useEffect(()=>{FC().then(v).catch(()=>v([]))},[]),c.useEffect(()=>{var M,A;(A=(M=window.electronAPI)==null?void 0:M.excelCheckEnvStatus)==null||A.call(M).then(ee=>{ee!=null&&ee.status&&z(ee.status),ee!=null&&ee.message&&I(ee.message)}).catch(()=>{})},[]),c.useEffect(()=>{var A,ee;const M=(ee=(A=window.electronAPI)==null?void 0:A.onExcelAnalysisEnvLog)==null?void 0:ee.call(A,me=>{$(Ie=>[...Ie.slice(-400),me.message])});return()=>M==null?void 0:M()},[]),c.useEffect(()=>{var A,ee;const M=(ee=(A=window.electronAPI)==null?void 0:A.onExcelAnalysisEnvStatus)==null?void 0:ee.call(A,me=>{me!=null&&me.status&&z(me.status),(me==null?void 0:me.message)!==void 0&&I(me.message??"")});return()=>M==null?void 0:M()},[]),c.useEffect(()=>{var A,ee;const M=(ee=(A=window.electronAPI)==null?void 0:A.onExcelAnalysisProgress)==null?void 0:ee.call(A,me=>{const Ie=me,Fe=String((Ie==null?void 0:Ie.phase)||"").trim();Fe&&r.setGenerationStatus("running",Fe)});return()=>M==null?void 0:M()},[r]),c.useEffect(()=>{var M;D&&((M=V.current)==null||M.scrollIntoView({behavior:"smooth"}))},[b,D]);const ge=c.useCallback(async()=>{a(!0);try{const M=await window.electronAPI.openFileDialog();if(!M||!eP(M))return;o(M),p(null)}finally{a(!1)}},[]),J=c.useCallback(async()=>{var M,A;$([]),z("rebuilding"),I("正在重建 Python 环境…");try{await((A=(M=window.electronAPI)==null?void 0:M.excelRebuildEnv)==null?void 0:A.call(M))}catch(ee){z("failed"),I(ee instanceof Error?ee.message:String(ee))}},[]),H=c.useCallback(async()=>{if(!(!e||!i)){u(!0),p(null),g(null),x(null),q([]),fe(""),R(!0),r.clearCurrentResult(),r.setGenerationStatus("running","正在启动分析…");try{const M=await window.electronAPI.excelAnalysisRun({workspacePath:e,sourcePath:i,userRequirement:r.generationPrompt,dataModelId:y.trim()||""}),A=!!(M!=null&&M.ok),ee=String(M.outputDir||""),me=String(M.scriptRelFolder||"");if(ee&&g(ee),me&&x(me),A){r.setGenerationStatus("completed","分析完成");const Ie=M.outputImages||[];if(console.log("[ExcelAnalysisWorkbench] outputImages from backend",Ie),Ie.length>0){Ie.forEach(Z=>{const X=eo(Z);console.log("[ExcelAnalysisWorkbench] image file path",Z),console.log("[ExcelAnalysisWorkbench] image src",X)});const Fe=Ie.length>1?`数据分析图表（${Ie.length} 张）`:"数据分析图表";q(Ie),fe(Fe),r.setGenerationResult({resultChartPaths:Ie,resultPreviewUrl:eo(Ie[0]),resultPath:Ie[0],resultTitle:Fe})}else{const Fe="分析脚本执行成功，但未生成图表。请打开调试日志查看 Python 输出。";r.setGenerationStatus("error",Fe),p(Fe);const Z=String(M.outputDir||""),X=String(M.stdout||"").slice(-600),ye=String(M.stderr||"").slice(-600);["[warn] exitCode=0 but no outputImages",Z?`[outDir] ${Z}`:"",X?`[stdout]
${X}`:"",ye?`[stderr]
${ye}`:""].filter(Boolean).forEach(G=>O(G)),R(!0)}n().catch(()=>{})}else{const Ie=String((M==null?void 0:M.error)||"分析失败");r.setGenerationStatus("error",Ie),p(Ie);const Fe=String(M.outputDir||""),Z=String(M.stdout||"").slice(-800),X=String(M.stderr||"").slice(-800);[`[error] ${Ie}`,Fe?`[outDir] ${Fe}`:"",Z?`[stdout]
${Z}`:"",X?`[stderr]
${X}`:""].filter(Boolean).forEach(Ee=>O(Ee)),R(!0)}}catch(M){const A=M instanceof Error?M.message:String(M);r.setGenerationStatus("error",A),p(A)}finally{u(!1)}}},[e,O,n,y,i,r]),T=d&&r.generationStatus.phase==="running"&&!!((L=r.generationStatus.message)!=null&&L.trim()),w=BC[S];return t.jsxs(LC,{"data-testid":"excel-analysis-workbench",children:[t.jsxs(NC,{$bg:w.bg,$color:w.color,role:"status","aria-live":"polite",children:[t.jsx("span",{style:{flex:1},children:w.text(P)}),t.jsx(mp,{type:"button",onClick:()=>R(M=>!M),title:"显示/隐藏调试日志",children:D?"▲ 日志":"▼ 日志"}),(S==="failed"||S==="idle")&&t.jsx(GC,{type:"button",onClick:()=>void J(),disabled:le,children:"重建 Python 环境"}),t.jsx(mp,{type:"button",onClick:()=>{var M,A;return void((A=(M=window.electronAPI)==null?void 0:M.excelPythonDiagnostics)==null?void 0:A.call(M).then(ee=>{$(me=>[...me,"[diagnostics] "+JSON.stringify(ee,null,2)]),R(!0)}))},title:"Python 环境诊断",style:{marginLeft:4},children:"🔍 诊断"})]}),D&&b.length>0&&t.jsxs(YC,{children:[b.join(`
`),t.jsx("div",{ref:V})]}),T?t.jsx(OC,{role:"status","aria-live":"polite",children:r.generationStatus.message}):null,t.jsxs(WC,{children:[e?null:t.jsxs(Lo,{children:[t.jsx(Zr,{children:"提示"}),t.jsx(Ba,{children:"请先打开或创建工作区。"})]}),t.jsxs(Lo,{children:[t.jsx(Zr,{children:"数据文件"}),t.jsxs(UC,{children:[t.jsx(Lc,{type:"button",onClick:()=>void ge(),disabled:s,children:"选择文件"}),t.jsx(KC,{type:"button",onClick:()=>void H(),disabled:!Q,children:"开始分析"})]}),t.jsx(Zr,{style:{marginTop:2},children:"模型选择"}),t.jsxs(HC,{role:"group","aria-label":"模型选择",children:[t.jsx(pp,{type:"button",$active:!y,disabled:d,onClick:()=>j(""),children:"不套用模型"}),k.map(M=>t.jsx(pp,{type:"button",$active:y===M.id,disabled:d,onClick:()=>j(M.id),children:M.label},M.id))]}),t.jsx(Ba,{children:y?`${((N=k.find(M=>M.id===y))==null?void 0:N.description)||""} 若下方「分析需求」为空，将直接使用模型随包内置绘图脚本，不再向大模型索要作图代码；填写需求后则按你的描述重新生成 Python 分析脚本（不复用历史脚本）。`:"可选。套用模型时会在分析前预处理表格。"}),t.jsx(Ba,{children:"支持 Excel（.xlsx / .xls）或 CSV，表头从 A1 开始。"}),i?t.jsx(fp,{children:i}):null,t.jsx(Zr,{style:{marginTop:4},children:"分析需求（可选）"}),t.jsx(qC,{value:r.generationPrompt,onChange:M=>r.setGenerationPrompt(M.target.value),placeholder:"例如：按地区汇总销售额并画柱状图；或说明要看的指标与维度。"})]}),f?t.jsxs(Lo,{children:[t.jsx(Zr,{children:"未能完成"}),t.jsx(VC,{style:{whiteSpace:"pre-wrap"},children:f}),t.jsxs("div",{style:{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"},children:[m?t.jsx("button",{type:"button",style:{fontSize:12,padding:"4px 10px",cursor:"pointer",borderRadius:6,border:"1px solid #d6e0ea",background:"#f8fafc"},onClick:()=>{var M,A;(A=(M=window.electronAPI)==null?void 0:M.openExternalFile)==null||A.call(M,m)},children:"📂 打开输出目录"}):null,h?t.jsx("button",{type:"button",style:{fontSize:12,padding:"4px 10px",cursor:"pointer",borderRadius:6,border:"1px solid #d6e0ea",background:"#f8fafc"},onClick:()=>{var M;(M=navigator.clipboard)==null||M.writeText(h)},children:"📋 复制脚本路径"}):null,b.length>0?t.jsx("button",{type:"button",style:{fontSize:12,padding:"4px 10px",cursor:"pointer",borderRadius:6,border:"1px solid #d6e0ea",background:"#f8fafc"},onClick:()=>{var M;(M=navigator.clipboard)==null||M.writeText(b.join(`
`))},children:"📋 复制调试日志"}):null]})]}):null,te.length>0?t.jsxs(Lo,{children:[t.jsx(Zr,{children:W}),t.jsx(JC,{children:te.map((M,A)=>{const ee=eo(M);return t.jsxs(XC,{children:[t.jsxs(ZC,{children:["图表 ",A+1]}),t.jsx(QC,{src:ee,alt:`数据分析图表 ${A+1}`,onLoad:()=>console.log("[ExcelAnalysisWorkbench] image loaded",ee),onError:me=>{console.error("[ExcelAnalysisWorkbench] image load failed",ee,me)}}),t.jsx(fp,{style:{fontSize:10,color:"#9aa5b4"},children:M})]},M)})}),m?t.jsx("div",{children:t.jsx("button",{type:"button",style:{fontSize:12,padding:"4px 10px",cursor:"pointer",borderRadius:6,border:"1px solid #d6e0ea",background:"#f8fafc"},onClick:()=>{var M,A;return void((A=(M=window.electronAPI)==null?void 0:M.openExternalFile)==null?void 0:A.call(M,m))},children:"📂 打开输出目录"})}):null]}):null]})]})}Zm.setOptions({gfm:!0,breaks:!1});const La="AIWFORMULABLOCKTOKEN",gp="AIWFORMULAINLINETOKEN";function hp(e){const n=String(e||"").trim();return!n||/^[\d\s.,%]+$/.test(n)||/^[\d\s.,%+\-]+$/.test(n)?!1:/^[A-Za-z]+(?:_[A-Za-z0-9]+)?$/.test(n)?!0:/[\\^_{}=+\-*/()]/.test(n)||/[A-Za-z]\s*[=<>]/.test(n)}function Fi(e,n="inline"){let r=String(e||"").replace(/\s+/g," ").replace(/(^|[=<>+\-*/,(\[{;:])\s*~\s*(?=[A-Za-z0-9\\])/g,"$1\\sim ").replace(/\s*([{}_^=+\-*/\\()[\]])\s*/g,"$1").replace(/(\d)\s*\.\s*(\d)/g,"$1.$2").trim();for(let i=0;i<4;i+=1){const o=r.replace(/(\d)\s+(\d)/g,"$1$2");if(o===r)break;r=o}return n==="block"&&(r=r.replace(/([_^]\{)\s*([A-Za-z0-9](?:\s+[A-Za-z0-9])+)\s*(\})/g,(i,o,s,a)=>{const d=String(s||"").replace(/\s+/g,"");return`${o}${d}${a}`}),r=r.replace(/\b([A-Z](?:\s+[A-Z]){1,10})\b/g,(i,o)=>String(o||"").replace(/\s+/g,"")),r=rP(r)),r}function rP(e){return String(e||"").replace(/\\begin\{(array|aligned|align|gathered)\}([\s\S]*?)\\tag\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g,(r,i,o,s,a)=>{const d=`${o}${a}`.replace(/(?:\\\\\s*)+$/g,"").trim(),u=d?`${d}\\\\`:"";return`\\begin{${i}}${u}\\end{${i}}\\tag{${String(s||"").trim()}}`})}function Ph(e){const n=String(e||"").trim();if(!n||/^(```|~~~|#{1,6}\s|>\s|\s*[-*+]\s+|\s*\d+\.\s+)/m.test(n)||/^\|.*\|$/m.test(n)||!/[{}_^=\\]/.test(n))return!1;const r=n.split(/\n/).map(d=>d.trim()).filter(Boolean);if(r.length>1&&r.some(d=>!/[\\{}_^=+\-*/&]/.test(d)))return!1;const i=n.search(/\\[A-Za-z]+/);if(i>0&&/\s/.test(n.slice(0,i).trim()))return!1;const o=n.match(/\\[A-Za-z]+/g)||[],s=/\\(?:frac|begin|left|right|sum|prod|int|sqrt|tag|Delta|Gamma|Theta|lambda|mu|langle|rangle|cdot|times|overline|underline|mathbf|mathrm|mathit|mathcal)\b/.test(n),a=/(?:[{}_^=]|\\\\)/.test(n);return s&&a||n.includes(`
`)&&o.length>=1&&a?!0:o.length>=2&&a}function iP(e){const n=String(e||"").trim();return!n||/^(```|~~~|#{1,6}\s|>\s|\s*[-*+]\s+|\s*\d+\.\s+)/.test(n)?!1:/[\\{}_^=+\-*/&]/.test(n)}function oP(e,n){const r=String(e||"").split(`
`),i=[];for(let o=0;o<r.length;o+=1){const s=r[o];if(!Ph(s)){i.push(s);continue}const a=[s];let d=o+1;for(;d<r.length&&iP(r[d]);)a.push(r[d]),d+=1;i.push(n(a.join(`
`))),o=d-1}return i.join(`
`)}function Ul(e){if(!e||!e.trim())return"";const n=/^<(?:h[1-6]|p|div|ul|ol|table|blockquote|img|pre|br)\b/i,r=e.trim();if(n.test(r))return xp(r);const i=sP(e),o=Zm.parse(i.markdown);return xp(aP(o,i))}function sP(e){const n=new Map,r=new Map;let i=0,o=0;const a=String(e||"").replace(/(^|\n)\$\$([\s\S]*?)\$\$(?=\n|$)/g,(p,m,g)=>{const h=Fi(g,"block"),x=`${La}${i++}END`;return n.set(x,h),`${m}
${x}
`}).replace(/(^|\n)\\\[([\s\S]*?)\\\](?=\n|$)/g,(p,m,g)=>{const h=Fi(g,"block"),x=`${La}${i++}END`;return n.set(x,h),`${m}
${x}
`});return{markdown:oP(a,p=>{const m=Fi(p,"block"),g=`${La}${i++}END`;return n.set(g,m),g}).replace(/\\\(([\s\S]*?)\\\)/g,(p,m)=>{const g=Fi(m,"inline");if(!hp(g))return p;const h=`${gp}${o++}END`;return r.set(h,g),h}).replace(new RegExp("(^|[^\\\\$])\\$(?!\\s)([^$\\n]|\\\\\\$)+?(?<!\\s)\\$","g"),(p,m,g,h,x)=>{const k=p.slice(String(m).length),v=k.slice(1,-1),y=Fi(v,"inline");if(!hp(y))return p;const j=h+String(m).length,S=j+k.length-1,z=j>0?x.charAt(j-1):"",P=S+1<x.length?x.charAt(S+1):"";if(/[A-Za-z0-9]/.test(z)||/[A-Za-z0-9]/.test(P))return p;const I=`${gp}${o++}END`;return r.set(I,y),`${m}${I}`}),blockLatexByToken:n,inlineLatexByToken:r}}function aP(e,n){let r=String(e||"");return n.blockLatexByToken.forEach((i,o)=>{const s=`<div data-formula-node="true" data-formula-display="block" data-latex="${Hl(i)}" class="formula-node formula-block">${bp(i,!0)}</div>`;r=r.replace(new RegExp(`<p>\\s*${Na(o)}\\s*</p>`,"g"),s).replace(new RegExp(Na(o),"g"),s)}),n.inlineLatexByToken.forEach((i,o)=>{const s=`<span data-formula-node="true" data-formula-display="inline" data-latex="${Hl(i)}" class="formula-node formula-inline">${bp(i,!1)}</span>`;r=r.replace(new RegExp(Na(o),"g"),s)}),r}function lP(e){const n=String(e||"").trim();if(!n||/^(https?:)?\/\//i.test(n)||n.startsWith("data:")||n.startsWith("file:///"))return n;if(n.startsWith("/")||/^[a-zA-Z]:[\\/]/.test(n)){const r=n.replace(/\\/g,"/"),i=encodeURI(r);return i.startsWith("/")?`file://${i}`:`file:///${i}`}return n}function cP(e){var i;const n=e.ownerDocument;if(!n)return;const r=Array.from(e.querySelectorAll("p"));for(const o of r){if(o.closest(".references-list"))continue;const s=n.createTreeWalker(o,NodeFilter.SHOW_TEXT),a=[];let d;for(;d=s.nextNode();)a.push(d);for(const u of a){const f=u.textContent||"";if(!/\[\d+\]/.test(f))continue;const p=n.createDocumentFragment();let m=0;const g=/\[(\d+)\]/g;let h;for(;(h=g.exec(f))!==null;){h.index>m&&p.appendChild(n.createTextNode(f.slice(m,h.index)));const x=n.createElement("sup");x.textContent=`[${h[1]}]`,p.appendChild(x),m=h.index+h[0].length}m<f.length&&p.appendChild(n.createTextNode(f.slice(m))),(i=u.parentNode)==null||i.replaceChild(p,u)}}}function dP(e){const n=e.ownerDocument;if(!n)return;const r=o=>{const s=String(o||"").replace(/\s+/g," ").trim();if(!s)return[];const a=s.match(/(?:\[\d+\]|\d+[.)])\s+.*?(?=(?:\s+(?:\[\d+\]|\d+[.)])\s+)|$)/g);return Array.isArray(a)?a.map(d=>d.trim()).filter(Boolean):[]},i=Array.from(e.children);for(let o=0;o<i.length;o+=1){const s=i[o];if(s.tagName.toLowerCase()!=="h1"&&s.tagName.toLowerCase()!=="h2"&&s.tagName.toLowerCase()!=="h3"&&s.tagName.toLowerCase()!=="h4"&&s.tagName.toLowerCase()!=="h5"&&s.tagName.toLowerCase()!=="h6")continue;const a=String(s.textContent||"").trim();if(!/^(参考文献|references)$/i.test(a))continue;const d=[],u=[];let f=o+1;for(;f<i.length;){const m=i[f],g=m.tagName.toLowerCase();if(/^h[1-6]$/.test(g))break;if(g==="p"){const h=String(m.textContent||"").trim(),x=r(h);if(x.length>1){u.push(...x),m.remove(),f+=1;continue}if(/^\[\d+\]\s+/.test(h)||/^\d+[.)]\s+/.test(h)){d.push(m),f+=1;continue}}if(!String(m.textContent||"").trim()){f+=1;continue}break}if(d.length===0&&u.length===0)continue;const p=n.createElement("ol");p.className="references-list";for(const m of d){const g=String(m.textContent||"").trim().replace(/^(?:\[(\d+)\]|(\d+)[.)])\s+/,""),h=n.createElement("li");h.textContent=g,p.appendChild(h),m.remove()}for(const m of u){const g=m.replace(/^(?:\[(\d+)\]|(\d+)[.)])\s+/,"").trim();if(!g)continue;const h=n.createElement("li");h.textContent=g,p.appendChild(h)}s.insertAdjacentElement("afterend",p)}}function xp(e){if(typeof DOMParser>"u")return e;const r=new DOMParser().parseFromString(`<div data-paper-root="true">${e}</div>`,"text/html").querySelector('[data-paper-root="true"]');if(!r)return e;let i=!1,o=null;return Array.from(r.children).forEach(s=>{const a=s.tagName.toLowerCase(),d=String(s.textContent||"").trim();if(s.removeAttribute("data-semantic-role"),!!d){if(!i&&a==="h1"&&!/^(摘要|abstract|关键词|关键字|keywords?|参考文献|references)$/i.test(d)){s.setAttribute("data-semantic-role","paper-title"),i=!0,o=null;return}if(/^h[1-6]$/.test(a)){if(/^(摘要|abstract)$/i.test(d)){s.setAttribute("data-semantic-role","abstract-heading"),o="abstract";return}if(/^(关键词|关键字|keywords?)$/i.test(d)){s.setAttribute("data-semantic-role","keywords-heading"),o="keywords";return}/^(参考文献|references)$/i.test(d)?s.setAttribute("data-semantic-role","references-heading"):s.setAttribute("data-semantic-role","section-heading"),o=null;return}if(a==="p"){if(o==="abstract"){s.setAttribute("data-semantic-role","abstract-body");return}if(o==="keywords"){s.setAttribute("data-semantic-role","keywords-body");return}}}}),Array.from(r.querySelectorAll("img")).forEach(s=>{const a=s.getAttribute("src");a&&s.setAttribute("src",lP(a))}),dP(r),cP(r),r.innerHTML}function bp(e,n){try{return $b.renderToString(e,{throwOnError:!1,strict:"ignore",displayMode:n,output:"html"})}catch{return Hl(e)}}function Hl(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Na(e){return String(e||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function k3(e){const n=String(e||"");return/(^|\n)\s*(?:\$\$|\\\[)|\\\(|(^|\n)\s*\\(?:frac|begin|left|right|sum|prod|int|sqrt|tag)\b/m.test(n)||n.split(/\n/).some(r=>Ph(r))?!0:/(^|\n)#{1,6}\s+|\*\*.+?\*\*|\*.+?\*|`[^`]+`|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|(^|\n)\s*[-*+]\s+|(^|\n)\s*\d+\.\s+/m.test(n)}const Oa={},uP="http://10.26.1.25:19080/api/sciencerelay";function pP(){return String((Oa==null?void 0:Oa.VITE_SCIENCERELAY_API_BASE)||"").trim().replace(/\/$/,"")||uP}function Nc(e,n){const r=pP().replace(/\/$/,""),i=e.startsWith("/")?e.slice(1):e,o=new URL(`${r}/${i}`);return Object.entries(n).forEach(([s,a])=>{a!==void 0&&a!==""&&o.searchParams.set(s,a)}),o.toString()}async function fP(e="zh"){const n=await fetch(Nc("topics",{lang:e}));if(!n.ok)throw new Error(`topics ${n.status}`);const r=await n.json();if((r==null?void 0:r.ok)===!1)throw new Error("topics 响应异常");return Array.isArray(r.items)?r.items:[]}async function yp(e){const{offset:n=0,limit:r=20,lang:i="zh",topic:o,edition:s="middle"}=e,a=await fetch(Nc("articles",{lang:i,offset:String(n),limit:String(Math.min(r,200)),edition:s,topic:o||void 0}));if(!a.ok)throw new Error(`articles ${a.status}`);return await a.json()}async function mP(e,n={}){const{lang:r="zh",edition:i="middle"}=n,o=`articles/${encodeURIComponent(e)}`,s=await fetch(Nc(o,{lang:r,edition:i}));if(!s.ok)throw new Error(`article ${s.status}`);return await s.json()}function Ah(e){const n=String(e.commentaryTitle||"").trim();return n||String(e.title||e.id||"").trim()||"未命名"}function gP(e){return String(e.oneLineSummary||"").trim()}function vp(e){var r;const n=(r=e.topicI18n)==null?void 0:r.zh;return n&&String(n).trim()?String(n).trim():String(e.topic||"").trim()||"综合"}function wp(e){var r,i;const n=(i=(r=e.coverImages)==null?void 0:r[0])==null?void 0:i.imageUrl;return n&&String(n).trim()?String(n).trim():null}function Sp(e){var r,i;const n=(i=(r=e.coverImages)==null?void 0:r[0])==null?void 0:i.caption;return n&&String(n).trim()?String(n).trim():""}const hP={primary:"小学",middle:"中学",university:"大学",research:"研究"};function xP(e){return hP[e]||e}function bP(e,n){const r=e==null?void 0:e.markdown;if(!r)return"";const i=r[n];return String(i||"").trim()}const No="zh",kp="middle",jp=20,nn=156,yP=200,_h=Mt`
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
`,Ip=l.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fbfe 0%, #eef4f9 100%);
`,vP=l.div`
  flex-shrink: 0;
  padding: 12px 10px 0;
`,wP=l.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #c5d6ea;
  background: #fff;
  color: #1f3447;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: #f0f6fc;
  }
`,SP=l.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-top: 18px;
`,kP=l.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 10px 12px;
  flex-shrink: 0;
`,$p=l.button`
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid ${({$active:e})=>e?"#1f6fd6":"#cad6e2"};
  background: ${({$active:e})=>e?"#e8f1fc":"#fff"};
  color: ${({$active:e})=>e?"#0f4a8a":"#42576b"};
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: ${({$active:e})=>e?"#dceaf9":"#f5f8fc"};
  }
`,jP=l.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  overflow-x: hidden;
  padding: 10px 8px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: stretch;
  ${_h}
`,Tp=l.div`
  margin: 0 8px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
  font-size: var(--font-size-sm);
  line-height: 1.5;
  display: grid;
  gap: 10px;
`,Cp=l.button`
  justify-self: start;
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #991b1b;
  background: #fff;
  color: #991b1b;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: #fff5f5;
  }
`,IP=l.button`
  flex-shrink: 0;
  box-sizing: border-box;
  text-align: left;
  margin: 0;
  padding: 0;
  border: 1px solid #dce5ef;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  display: grid;
  grid-template-columns: ${yP}px minmax(0, 1fr);
  grid-template-rows: ${nn}px;
  min-height: ${nn}px;
  width: 100%;
  align-items: stretch;
  box-shadow: 0 8px 22px rgba(31, 52, 71, 0.06);
  transition: box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: #b8cce4;
    box-shadow: 0 12px 28px rgba(31, 52, 71, 0.1);
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    grid-template-rows: ${nn}px auto;
    min-height: calc(${nn}px + 120px);
  }
`,$P=l.div`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: ${nn}px;
  min-height: ${nn}px;
  max-height: ${nn}px;
  background: #e8eef4;
`,TP=l.div`
  box-sizing: border-box;
  width: 100%;
  height: ${nn}px;
  min-height: ${nn}px;
  background: ${({$gradient:e})=>e};
`,CP=l.div`
  width: 100%;
  min-height: 200px;
  height: min(36vh, 320px);
  max-height: min(44vh, 400px);
  background: ${({$gradient:e})=>e};
`,PP=l.img`
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: ${nn}px;
  min-height: ${nn}px;
  max-height: ${nn}px;
  object-fit: cover;
`,AP=l.span`
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 1;
  font-size: var(--font-size-xs);
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #1e3a5f;
  max-width: calc(100% - 20px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,_P=l.div`
  box-sizing: border-box;
  min-width: 0;
  min-height: ${nn}px;
  height: ${nn}px;
  max-height: ${nn}px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  overflow: hidden;

  @media (max-width: 720px) {
    height: auto;
    max-height: none;
    min-height: 120px;
    padding: 14px 16px 16px;
  }
`,Pp=l.div`
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  font-weight: 700;
  line-height: 1.35;
  color: #7a8ea2;
  word-break: break-word;
`,EP=l.h2`
  flex: 1;
  margin: 0;
  min-height: 2.8em;
  max-height: 4.2em;
  font-size: 15px;
  font-weight: 800;
  color: #142a3d;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`,zP=l.p`
  flex-shrink: 0;
  margin: 0;
  min-height: 2.4em;
  max-height: calc(1.55em * 2);
  font-size: var(--font-size-sm);
  line-height: 1.55;
  color: #3d556b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  overflow-wrap: anywhere;
`,DP=l.div`
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
  min-height: 52px;
  align-items: center;
`,RP=l.button`
  height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  border: 1px solid #cad6e2;
  background: #fff;
  color: #304255;
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #f5f8fc;
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,MP=l.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  overflow-x: hidden;
  padding: 0 8px 28px;
  ${_h}
`,FP=l.div`
  flex-shrink: 0;
  width: 100%;
  margin: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dce5ef;
  background: #e8eef4;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
`,BP=l.img`
  display: block;
  max-width: 100%;
  max-height: min(78vh, 920px);
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  margin: 0 auto;
`,LP=l.figure`
  margin: 0 0 16px;
  width: 100%;
`,NP=l.figcaption`
  margin: 10px 0 0;
  padding: 10px 12px;
  font-size: var(--font-size-sm);
  line-height: 1.65;
  color: #3d556b;
  background: #f4f7fb;
  border-radius: 10px;
  border: 1px solid #e5edf5;
  word-break: break-word;
  overflow-wrap: anywhere;
`,OP=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 10px 0;
`,WP=l.button`
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid ${({$active:e})=>e?"#1f6fd6":"#cad6e2"};
  background: ${({$active:e})=>e?"#e8f1fc":"#fff"};
  color: ${({$active:e})=>e?"#0f4a8a":"#42576b"};
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
`,UP=l.article`
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  margin: 8px 0 0;
  padding: 18px clamp(10px, 2.5vw, 22px) 24px;
  border-radius: 14px;
  border: 1px solid #e1e9f1;
  background: #fff;
  box-shadow: 0 10px 28px rgba(31, 52, 71, 0.06);
  min-width: 0;
`,HP=l.h1`
  margin: 0 0 10px;
  font-size: clamp(1.05rem, 2.8vw, 1.35rem);
  font-weight: 800;
  color: #142a3d;
  line-height: 1.35;
  word-break: break-word;
  overflow-wrap: anywhere;
`,Ap=l.p`
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.75;
  color: #3d556b;
  word-break: break-word;
  overflow-wrap: anywhere;
`,KP=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: #6b7d90;
  margin-bottom: 12px;
  word-break: break-word;
`,GP=l.a`
  display: inline-block;
  margin-bottom: 16px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #1f6fd6;
  word-break: break-all;
  &:hover {
    text-decoration: underline;
  }
`,qP=l.div`
  font-size: 15px;
  line-height: 1.85;
  color: #2b3f52;
  word-break: break-word;
  overflow-wrap: anywhere;

  & h1, & h2, & h3, & h4 {
    font-weight: 800;
    margin: 1.15em 0 0.45em;
    line-height: 1.35;
    color: #142a3d;
  }
  & h1 { font-size: 1.25rem; }
  & h2 { font-size: 1.12rem; }
  & h3 { font-size: 1.02rem; }
  & p { margin: 0.65em 0; }
  & ul, & ol { margin: 0.65em 0; padding-left: 1.35em; }
  & li { margin: 0.25em 0; }
  /* 顶栏已展示封面，正文不再出图；若 HTML 中仍有残留则隐藏 */
  & img,
  & picture,
  & figure {
    display: none !important;
  }
  & code {
    font-size: 0.88em;
    padding: 0.1em 0.35em;
    border-radius: 4px;
    background: #f0f4f8;
  }
  & pre {
    overflow: auto;
    padding: 12px 14px;
    border-radius: 10px;
    background: #f4f7fb;
    border: 1px solid #e5edf5;
    font-size: var(--font-size-sm);
    line-height: 1.55;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
  }
  & blockquote {
    margin: 0.75em 0;
    padding: 8px 12px;
    border-left: 4px solid #c5d6ea;
    background: #f8fafc;
    color: #3d556b;
  }
  & table {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }
  & th, & td {
    border: 1px solid #dde6ef;
    padding: 6px 8px;
  }
`,_p=l.div`
  padding: 24px 10px;
  text-align: center;
  color: #6b7d90;
  font-size: 14px;
`;function Ep(e){const n=e||"综合";let r=0;for(let s=0;s<n.length;s+=1)r=r*31+n.charCodeAt(s)>>>0;const i=r%360,o=(r*17+40)%360;return`linear-gradient(145deg, hsl(${i}, 42%, 44%) 0%, hsl(${o}, 38%, 36%) 100%)`}const VP=["primary","middle","university","research"];function YP(e){if(!e)return"";if(typeof DOMParser>"u")return e.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi,"").replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi,"").replace(/<img\b[^>]*\/?>/gi,"");const r=new DOMParser().parseFromString(`<div data-feed-strip-root>${e}</div>`,"text/html").querySelector("[data-feed-strip-root]");if(!r)return e;r.querySelectorAll("img, picture, figure").forEach(i=>{i.remove()});for(let i=0;i<3;i+=1)r.querySelectorAll("p, a").forEach(o=>{!(o.textContent||"").replace(/\u00a0/g," ").trim()&&o.children.length===0&&o.remove()});return r.innerHTML}function zp(e,n){return e?Ah(e):n}function Dp(e){return String((e==null?void 0:e.oneLineSummary)||"").trim()}function Rp(e){var r;if(!e)return null;const n=(r=e.subjectsI18n)==null?void 0:r.zh;return Array.isArray(n)&&n.length?`关键词：${n.join("、")}`:Array.isArray(e.subjects)&&e.subjects.length?`关键词：${e.subjects.join("、")}`:null}function JP(){var L;const[e,n]=c.useState([]),[r,i]=c.useState(""),[o,s]=c.useState(0),[a,d]=c.useState([]),[u,f]=c.useState(!1),[p,m]=c.useState(!0),[g,h]=c.useState(null),[x,k]=c.useState(!1),[v,y]=c.useState(null),[j,S]=c.useState("middle"),[z,P]=c.useState(null),[I,b]=c.useState(!1),[$,O]=c.useState(null),[D,R]=c.useState(0);c.useEffect(()=>{let N=!1;return(async()=>{try{const M=await fP(No);N||n(M)}catch{N||n([])}})(),()=>{N=!0}},[]),c.useEffect(()=>{let N=!1;return m(!0),h(null),d([]),f(!1),(async()=>{try{const M=await yp({offset:0,limit:jp,lang:No,topic:r||void 0,edition:kp});if(N)return;if(!(M!=null&&M.ok))throw new Error("列表数据异常");const A=M.items||[];d(A),f(!!M.hasMore)}catch(M){N||(h(M instanceof Error?M.message:String(M)),d([]))}finally{N||m(!1)}})(),()=>{N=!0}},[r,o]);const V=c.useCallback(N=>{i(N)},[]),te=c.useCallback(()=>{s(N=>N+1)},[]),q=c.useCallback(async()=>{if(!(!u||x||p)){k(!0);try{const N=await yp({offset:a.length,limit:jp,lang:No,topic:r||void 0,edition:kp});if(!(N!=null&&N.ok))throw new Error("加载更多失败");const M=N.items||[];d(A=>[...A,...M]),f(!!N.hasMore)}catch(N){h(N instanceof Error?N.message:String(N))}finally{k(!1)}}},[u,a.length,p,x,r]);c.useEffect(()=>{if(!v){P(null),O(null);return}let N=!1;return b(!0),O(null),(async()=>{try{const M=await mP(v,{lang:No,edition:j});if(N)return;if(!(M!=null&&M.ok)||!M.item)throw new Error("详情数据异常");P(M.item)}catch(M){N||(P(null),O(M instanceof Error?M.message:String(M)))}finally{N||b(!1)}})(),()=>{N=!0}},[v,j,D]);const W=c.useCallback(N=>{y(N),S("middle"),R(0)},[]),fe=c.useCallback(()=>{y(null),P(null),O(null)},[]),le=z==null?void 0:z.meta,Q=z==null?void 0:z.commentary,ge=bP(Q,j),J=c.useMemo(()=>{if(!ge)return"";try{return YP(Ul(ge))}catch{return""}},[ge]),H=le?wp(le):null,T=le?Sp(le):"",w=le?vp(le):"";return v?t.jsxs(Ip,{"data-testid":"daily-feed-workbench-detail",children:[t.jsx(vP,{children:t.jsxs(wP,{type:"button",onClick:fe,children:[t.jsx(Gx,{size:16})," 返回列表"]})}),t.jsx(OP,{children:VP.map(N=>t.jsx(WP,{type:"button",$active:j===N,onClick:()=>S(N),children:xP(N)},N))}),t.jsxs(MP,{children:[I?t.jsx(_p,{children:"加载中…"}):null,$?t.jsxs(Tp,{style:{marginTop:12},children:[$,t.jsx(Cp,{type:"button",onClick:()=>R(N=>N+1),children:"重试"})]}):null,!I&&!$&&z?t.jsxs(UP,{children:[t.jsxs(LP,{children:[t.jsx(FP,{children:H?t.jsx(BP,{src:H,alt:T||zp(le,v||""),title:T||void 0,loading:"eager",decoding:"async"}):t.jsx(CP,{$gradient:Ep(w)})}),T?t.jsx(NP,{children:T}):null]}),t.jsxs(Pp,{children:[String((le==null?void 0:le.publishedDate)||"").trim(),w?` · ${w}`:""]}),t.jsx(HP,{children:zp(le,v||"")}),Dp(Q)?t.jsx(Ap,{children:Dp(Q)}):null,Rp(le)?t.jsx(KP,{children:Rp(le)}):null,(L=z==null?void 0:z.source)!=null&&L.url?t.jsx(GP,{href:String(z.source.url),target:"_blank",rel:"noreferrer",children:"查看原论文页面"}):null,J?t.jsx(qP,{dangerouslySetInnerHTML:{__html:J}}):t.jsx(Ap,{style:{color:"#8a9bae"},children:"该学段暂无正文，可切换上方学段或稍后重试。"})]}):null]})]}):t.jsx(Ip,{"data-testid":"daily-feed-workbench-list",children:t.jsxs(SP,{children:[e.length>0?t.jsxs(kP,{children:[t.jsx($p,{type:"button",$active:r==="",onClick:()=>V(""),children:"全部"}),e.map(N=>t.jsxs($p,{type:"button",$active:r===N.key,onClick:()=>V(N.key),children:[N.label,typeof N.count=="number"?` (${N.count})`:""]},N.key))]}):null,t.jsxs(jP,{children:[g?t.jsxs(Tp,{children:["无法加载资讯列表：",g,t.jsx(Cp,{type:"button",onClick:()=>te(),children:"重试"})]}):null,p&&a.length===0?t.jsx(_p,{children:"加载中…"}):null,a.map(N=>{const M=Ah(N),A=gP(N),ee=vp(N),me=wp(N),Ie=Sp(N);return t.jsxs(IP,{type:"button",onClick:()=>W(N.id),children:[t.jsxs($P,{children:[me?t.jsx(PP,{src:me,alt:Ie||M,title:Ie||void 0,loading:"lazy",decoding:"async"}):t.jsx(TP,{$gradient:Ep(ee)}),t.jsx(AP,{title:ee,children:ee})]}),t.jsxs(_P,{children:[t.jsxs(Pp,{children:[String(N.publishedDate||"").trim(),N.journal?` · ${N.journal}`:""]}),t.jsx(EP,{children:M}),A?t.jsx(zP,{children:A}):null]})]},N.id)}),a.length>0&&u?t.jsx(DP,{children:t.jsx(RP,{type:"button",disabled:x,onClick:()=>void q(),children:x?"加载中…":"加载更多"})}):null]})]})})}const XP=l.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #f4f7fc;
  padding: 40px 56px;
  display: flex;
  flex-direction: column;
`,ZP=l.div`
  margin-bottom: 32px;
  flex-shrink: 0;
`,QP=l.h1`
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 800;
  color: #1a2f47;
`,e2=l.p`
  margin: 0;
  font-size: 14px;
  color: #6b7f94;
`,t2=l.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
`,n2=l.div`
  background: #fff;
  border: 1.5px solid #e2eaf4;
  border-radius: 16px;
  padding: 24px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`,r2=l.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${e=>e.$color}22;
  color: ${e=>e.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,i2=l.span`
  font-size: 15px;
  font-weight: 700;
  color: #1a2f47;
`,o2=l.span`
  font-size: var(--font-size-sm);
  color: #6b7f94;
  line-height: 1.5;
`,s2=l.span`
  display: inline-block;
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: #fdf0e2;
  color: #a05c10;
`,a2=[{icon:t.jsx(qx,{size:22}),color:"#1f6fd6",title:"模型配置",desc:"选择和配置 AI 模型，设置推理参数和上下文窗口"},{icon:t.jsx(Vx,{size:22}),color:"#1a7a4a",title:"API 地址配置",desc:"配置 OpenAI 兼容接口地址、Key 与代理设置"},{icon:t.jsx(Yx,{size:22}),color:"#7c4dff",title:"Prompt 调试",desc:"在沙盒环境中测试和迭代系统提示词"},{icon:t.jsx(Jx,{size:22}),color:"#00897b",title:"Skill 管理",desc:"查看、启用和管理已注册的 AI Skill 能力列表"},{icon:t.jsx(Xx,{size:22}),color:"#c05c15",title:"Skill Builder",desc:"可视化构建新 Skill，定义输入、输出和执行链路"},{icon:t.jsx(Zx,{size:22}),color:"#607080",title:"工作流配置",desc:"编排多步骤 AI 工作流，支持条件分支与并行执行"}];function l2(){return t.jsxs(XP,{children:[t.jsxs(ZP,{children:[t.jsx(QP,{children:"模型开发"}),t.jsx(e2,{children:"管理模型、Prompt、Skill、工作流和接口能力"})]}),t.jsx(t2,{children:a2.map(e=>t.jsxs(n2,{children:[t.jsx(r2,{$color:e.color,children:e.icon}),t.jsx(i2,{children:e.title}),t.jsx(o2,{children:e.desc}),t.jsx(s2,{children:"建设中"})]},e.title))})]})}const Mp=l.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fbfe 0%, #eef4f9 100%);
`,c2=l.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  overflow: hidden;
`,Fp=l.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
`,_n=l.div`
  ${({$active:e})=>e?"flex: 1; min-width: 0; min-height: 0; display: flex; overflow: hidden;":"display: none;"}
`;function d2(e,n){return e==="free"?"freewrite":n==="document"||n==="daily-report"?"paper":n==="email"?"email":n==="homework"?"homework":n==="ai-class"?"ai-class":n==="ai-forum"?"ai-forum":n==="data"?"data":n==="model"?"model":n==="daily-feed"?"daily-feed":"workbench"}function u2({ghostTextEnabled:e}){const{mode:n,generationMode:r,setGenerationMode:i}=Cn(),o=d2(n,r);c.useEffect(()=>{const d=()=>i("email");return window.addEventListener("open-communication-workbench",d),()=>window.removeEventListener("open-communication-workbench",d)},[i]);const s=c.useRef(new Set);s.current.add(o);const a=d=>s.current.has(d);return t.jsxs(t.Fragment,{children:[t.jsx(_n,{$active:o==="freewrite",children:a("freewrite")&&t.jsx(Fp,{children:t.jsx($d,{ghostTextEnabled:e,manuscriptProfile:"freewrite",active:o==="freewrite"})})}),t.jsx(_n,{$active:o==="paper",children:a("paper")&&t.jsx(Fp,{children:t.jsx($d,{ghostTextEnabled:e,manuscriptProfile:"paper",active:o==="paper"})})}),t.jsx(_n,{$active:o==="workbench",children:a("workbench")&&t.jsx(Mp,{children:t.jsx(c2,{children:t.jsx(u1,{})})})}),t.jsx(_n,{$active:o==="email",children:a("email")&&t.jsx(qT,{})}),t.jsx(_n,{$active:o==="homework",children:a("homework")&&t.jsx(Mp,{children:t.jsx(bC,{})})}),t.jsx(_n,{$active:o==="ai-class",children:a("ai-class")&&t.jsx(EC,{})}),t.jsx(_n,{$active:o==="ai-forum",children:a("ai-forum")&&t.jsx(zC,{})}),t.jsx(_n,{$active:o==="data",children:a("data")&&t.jsx(nP,{})}),t.jsx(_n,{$active:o==="model",children:a("model")&&t.jsx(l2,{})}),t.jsx(_n,{$active:o==="daily-feed",children:a("daily-feed")&&t.jsx(JP,{})})]})}const p2=1800,Kl=72,js=120,f2=[8,5,3],m2=560,g2=["text","words","letters","alphabet","typography","caption","subtitle","label","watermark","logo","signature","numbers","symbols","Chinese characters","English text","annotations"].join(", ");function Eh(e){return String(e||"").replace(/```[\s\S]*?```/g," ").replace(/`([^`]+)`/g,"$1").replace(/[#>*_~\-]{1,3}/g," ").replace(/\[[^\]]+\]\(([^)]+)\)/g,"$1").replace(/\s+/g," ").trim()}function h2(e){const n=String(e||"").trim();if(!n)return"";const r=n.match(/```(?:json)?\s*([\s\S]*?)```/i),i=r?r[1].trim():n,o=i.indexOf("{"),s=i.lastIndexOf("}");return o>=0&&s>o?i.slice(o,s+1):i}function Kn(e,n){return String(e||"").replace(/\s+/g," ").trim().slice(0,n)}function Bp(e,n=8){const r=Array.isArray(e)?e:String(e||"").split(/[、,，;；\n]/).map(o=>o.trim()),i=new Set;for(const o of r){const s=String(o||"").replace(/\s+/g," ").trim();if(s&&!(s.length>24)&&(i.add(s),i.size>=n))break}return Array.from(i)}function x2(e,n=8){const r=String(e||"").toLowerCase();if(!r)return[];const i=r.match(/[a-z0-9][a-z0-9_-]{2,}/g)||[],o=r.match(/[\u4e00-\u9fa5]{2,8}/g)||[],s=new Map;for(const a of[...i,...o])s.set(a,(s.get(a)||0)+1);return Array.from(s.entries()).sort((a,d)=>d[1]-a[1]||a[0].localeCompare(d[0],"zh-Hans-CN")).slice(0,n).map(([a])=>a)}function Is(e){const n=Eh(e),r=String(n.split(new RegExp("(?<=[。！？.!?；;])"))[0]||n).trim().slice(0,js),i=x2(n,8),o=Kn(i[0]||r||"文档主题",Kl);return{subject:o,scene:Kn(r||o,js),composition:"突出单一主体与关键关系，保持结构清晰，适合作为文档配图。",keywords:i,avoid:["大段文字","字母数字","公式","表格","标题","水印"],alt:Kn(o||r,80)}}function b2(e,n){try{const r=JSON.parse(h2(e)),i=Bp(r.keywords,8),o=Kn(r.subject||i[0],Kl),s=Kn(r.scene||r.summary||o,js),a=Kn(r.composition||r.layout||"突出主体，结构清楚，适合作为文档配图。",js),d=Bp(r.avoid,8),u=Kn(r.alt||o||s,80);return!o&&i.length===0&&!s?Is(n):{subject:o||Kn(i[0]||"文档主题",Kl),scene:s||o,composition:a,keywords:i,avoid:d,alt:u||o||s}}catch{return Is(n)}}async function y2(e,n){const r=Eh(e).slice(0,p2);if(!r)return Is(e);const i=n?`
以下是来自知识库的相关背景资料，可帮助你提取更贴合真实场景的视觉信息：
${n.slice(0,1200)}`:"";try{const o=await window.electronAPI.writingAssistant({language:"zh",instruction:["你是文档配图分析器。","请从给定文本中提取适合用于生成配图的核心视觉信息。","不要复述原文，不要加入任何画风、媒介、摄影或艺术风格描述。","不要输出解释，只返回一个 JSON 对象。","JSON 字段必须包含：subject(string), scene(string), composition(string), keywords(string[]), avoid(string[]), alt(string)。","subject 表示最核心的配图主题；scene 表示一句画面摘要；composition 表示构图重点；keywords 保留 4 到 8 个关键词短语；avoid 写不该画入的元素。","keywords 应优先提取对象、结构、过程、关系、环境，而不是整句原文。"].join(`
`),extraContext:"这是图片生成前的语义提炼任务，不是写作任务。输出必须是 JSON。"+i,documentText:r});return b2(o,r)}catch(o){return console.warn("[image:selection-analysis:fallback]",o),Is(r)}}function v2(e,n){const r=e.keywords.slice(0,Math.max(1,n)),i=[...e.avoid,"任何可读文字","字母","数字","标签","坐标轴标题","水印"];return{prompt:["请生成一张适合插入文档正文的信息型配图。",`主题：${e.subject}`,r.length>0?`核心关键词：${r.join("、")}`:"",e.scene?`画面摘要：${e.scene}`:"",e.composition?`构图要求：${e.composition}`:"",`避免内容：${Array.from(new Set(i)).join("、")}`,"要求：只表现与主题直接相关的主体、结构或过程，不要把原文整段塞进图片，不要出现任何文字、字母、数字、符号、公式、表格、标题、图例或水印；主体明确，层次清楚，适合作为学术或技术文档中的辅助插图。"].filter(Boolean).join(`
`),alt:Kn(e.alt||e.subject||r.join("、"),80)}}async function w2(e,n){const r=await y2(e,n);return f2.map(i=>v2(r,i))}async function Lp(e,n="16:9",r,i){var a;const o=await w2(e,i);let s="图片生成失败";for(let d=0;d<o.length;d+=1){const u=o[d];r==null||r(d+1,o.length);try{const f=await zh({prompt:u.prompt,aspect_ratio:n,negativePrompt:g2});if(f.status==="success")return{...f,alt:u.alt,attemptCount:d+1,fallbackUsed:d>0};s=f.error||s}catch(f){s=f instanceof Error?f.message:String(f)}}return{status:"failed",error:s,alt:((a=o[0])==null?void 0:a.alt)||"",attemptCount:o.length,fallbackUsed:o.length>1}}function j3(){return m2}async function zh(e){var u,f;const n=e.traceId||`img-svc-${Date.now()}`,r=Array.isArray(e.references)?e.references:[],i=r.find(p=>p.role==="primary-style")||null,o=ug(e.styleOptions),s=e.generationMode||gc,a=e.aspectRatio||e.aspect_ratio||"16:9";console.info("[image:renderer-service]",JSON.stringify({traceId:n,handlerName:"generateImage",serviceName:"ImageService",rawUserPrompt:e.prompt,generationMode:s,aspectRatio:a,referenceImageCount:r.length,primaryReferenceId:(i==null?void 0:i.id)||null,roleSummary:jl(r),references:pg(r),styleOptions:o,styleProfileSummary:((u=e.styleProfile)==null?void 0:u.summary)||null,debugEnabled:((f=e.debug)==null?void 0:f.enabled)===!0,note:"Structured image payload is forwarded to IPC at this layer without prompt rewriting"}));const d=await window.electronAPI.generateImage({prompt:e.prompt,negativePrompt:e.negativePrompt,aspectRatio:a,filename:e.filename,workspacePath:e.workspacePath,references:r,referenceImages:r.map((p,m)=>({documentId:p.id,order:p.order??m,isPrimary:p.role==="primary-style",role:p.role,weight:p.weight,filePath:p.filePath,fileName:p.fileName||p.name,contentType:p.contentType,dataUrl:p.dataUrl,url:p.url,origin:p.origin})),primaryImageId:(i==null?void 0:i.id)||null,selectedStyleImageIds:r.filter(p=>p.role!=="content").map(p=>p.id),styleOptions:o,generationMode:s,styleProfile:e.styleProfile||null,traceId:n,debug:e.debug});return d.localPath||d.path?{status:"success",image_url:d.localPath||d.path,file_path:d.localPath||d.path,filename:(d.localPath||d.path||"").split(/[\\/]/).pop()}:{status:"failed",error:d.error||"图片生成失败"}}const Np="(?:生成|创建|制作|输出|做|画|绘制|出图|create|generate|make|draw|illustrate)",Op="(?:图片|图像|配图|插图|海报|插画|封面图|示意图|效果图|banner|poster|cover(?:\\s+image)?|image|illustration|visual)",S2=[new RegExp(`${Np}[\\s\\S]{0,18}${Op}`,"i"),new RegExp(`${Op}[\\s\\S]{0,8}${Np}`,"i")];function k2(e,n){const r=String(e||"").replace(/[\\/]+$/g,""),i=String(n.storedRelativePath||"").replace(/^[\\/]+/g,"");return r&&i?`${r}/${i}`:i}function j2(e){const n=String(e||"").trim();return!n||/^(https?:)?\/\//i.test(n)||n.startsWith("data:")||n.startsWith("file:///")?n:n.startsWith("/")?`file://${encodeURI(n)}`:/^[a-zA-Z]:[\\/]/.test(n)?`file:///${encodeURI(n.replace(/\\/g,"/"))}`:`${Mg()}${n.startsWith("/")?n:`/${n}`}`}function I2(e){const n=String(e||"").trim();return n?S2.some(r=>r.test(n)):!1}function Dh(e,n,r){const i=new Map(e.map(s=>[s.id,s]));return Array.from(new Set([r,...n].map(s=>String(s||"").trim()).filter(Boolean))).map(s=>i.get(s)||null).filter(s=>!!s)}function $2(e,n){return!e||n&&e.sourceImageId!==n?null:e}async function T2(e,n,r){if(!e||n.length===0||r.length===0)return[];const i=new Map(r.map((u,f)=>[u.id,f])),o=n.filter(u=>u.sourceType==="image"&&i.has(u.id)).sort((u,f)=>(i.get(u.id)??999)-(i.get(f.id)??999)).slice(0,4),s=new Map(r.map(u=>[u.id,u]));return(await Promise.all(o.map(async(u,f)=>{const p=k2(e,u),m=s.get(u.id),g=j2(p);try{const h=await window.electronAPI.readImageAsDataUrl(p);return{id:u.id,url:h.dataUrl||g,role:(m==null?void 0:m.role)||"style",weight:(m==null?void 0:m.weight)||0,name:u.title,thumbnailUrl:g,origin:"knowledge-base",order:(m==null?void 0:m.order)??f,filePath:p,fileName:h.fileName||u.originalName||u.title,contentType:h.contentType,dataUrl:h.dataUrl}}catch{return{id:u.id,url:g,role:(m==null?void 0:m.role)||"style",weight:(m==null?void 0:m.weight)||0,name:u.title,thumbnailUrl:g,origin:"knowledge-base",order:(m==null?void 0:m.order)??f,filePath:p,fileName:u.originalName||u.title}}}))).filter(Boolean).sort((u,f)=>(u.order??999)-(f.order??999))}async function C2(e){var p,m;const n=String(e.prompt||"").trim();if(!n)throw new Error("请先输入图片需求");const r=`img-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,i=e.imageReferences.map((g,h)=>({...g,order:h})),o=await T2(e.knowledgeRootPath,e.documents,i),s=o.find(g=>g.role==="primary-style")||null,a=null;e.activeStyleProfile&&await((p=e.onStyleProfileChange)==null?void 0:p.call(e,null));const d=[e.documentContext?`

Document context: ${e.documentContext}`:"",e.knowledgeTextContext?`

Knowledge base reference: ${e.knowledgeTextContext}`:""].join(""),u={prompt:n+d,aspectRatio:e.aspectRatio||"16:9",references:o,styleOptions:e.styleOptions,generationMode:e.generationMode,styleProfile:a,traceId:r,debug:{enabled:!0,source:e.source}};console.info("[image:ui-submit]",JSON.stringify({traceId:r,source:e.source,rawUserPrompt:u.prompt,generationMode:u.generationMode,styleOptions:u.styleOptions,referenceImageCount:o.length,primaryReferenceId:(s==null?void 0:s.id)||null,references:pg(o),roleSummary:jl(o),styleProfileSummary:null,styleProfileMode:"disabled-local-analysis",...e.debugContext})),await((m=e.onStatus)==null?void 0:m.call(e,o.length>0?`正在生成图片，并带入 ${o.length} 张结构化参考图...`:"正在生成图片，请稍候..."));const f=await zh(u);return{traceId:r,payload:u,references:o,primaryReference:s,styleProfile:a,roleSummary:jl(o),result:f}}const P2="请根据当前资料生成新文稿",A2={structure:!0,tone:!0,terminology:!0};function _2(e){return String(e||"").trim()||void 0}function $s(e,n){const r=String(n||"").trim(),i=new Set;return e.reduce((o,s)=>{const a=String(s||"").trim();return!a||a===r||i.has(a)||(i.add(a),o.push(a)),o},[])}function Wp(e,n=P2){return String(e||"").trim()||n}function E2(){return{...A2}}function z2(e){const n=_2(e.templateDocumentId),r=$s(e.requiredReferenceDocumentIds,n),i=$s(e.preferredReferenceDocumentIds||[],n).filter(o=>!r.includes(o));return{mode:e.mode,templateDocumentId:n,requiredReferenceDocumentIds:r,preferredReferenceDocumentIds:i,allowAutoRetrieval:e.mode!=="selected-only",autoRetrievalLimit:e.autoRetrievalLimit,templateInheritance:{...e.templateInheritance}}}function D2(e,n){return String(e||"").trim()?!0:!!(n.templateDocumentId||n.requiredReferenceDocumentIds.length||n.preferredReferenceDocumentIds.length)}async function R2(e){if(!D2(e.instruction,e.constraints))return null;const n=Wp(e.instruction,e.fallbackInstruction),r=Wp(e.cachedInstruction||"",e.fallbackInstruction);if(e.cachedPreview&&n===r)return e.cachedPreview;try{return await e.previewContext({instruction:n,constraints:e.constraints})}catch{return null}}function I3(e,n){if(!e)return;const r=e.citations.filter(o=>o.sourceKind==="required-reference"||o.sourceKind==="preferred-reference"),i=e.citations.filter(o=>o.sourceKind==="auto-retrieval");return{templateDocumentId:n.templateDocumentId,requiredReferenceDocumentIds:n.requiredReferenceDocumentIds,preferredReferenceDocumentIds:n.preferredReferenceDocumentIds,retrievedHits:e.retrievedHits,citations:e.citations,coverage:{templateApplied:!!(n.templateDocumentId&&e.templateSummary),explicitReferenceCount:r.length,autoRetrievedCount:i.length}}}function $3(e){return/^#{1,4}\s*(?:参考文献|references?|bibliography|文献[列清]?单?)\s*$/im.test(e)}function T3(e){if(!e||!e.citations.length)return"";const n=e.citations.filter(a=>a.sourceKind!=="template");if(!n.length)return"";const r=new Map,i=[];let o=1;for(const a of n)if(!r.has(a.documentId)){r.set(a.documentId,o++);const d=a.documentTitle.replace(/\.(pdf|docx?|pptx?|xlsx?|txt|md)$/i,"");i.push({documentId:a.documentId,title:d})}const s=["","---","","**本文参考了以下素材：**",""];for(const a of i){const d=r.get(a.documentId);s.push(`[${d}] ${a.title}`)}return s.push(""),s.join(`
`)}function M2(e){return!!(e.templateDocumentId||e.requiredReferenceDocumentIds.length||e.preferredReferenceDocumentIds.length||e.mode==="auto")}function F2(e){const n=$s([...e.constraints.requiredReferenceDocumentIds,...e.constraints.preferredReferenceDocumentIds],e.constraints.templateDocumentId);return{id:e.taskId,externalTaskId:e.taskId,type:e.constraints.templateDocumentId?"template-generation":"reference-generation",status:e.status,title:e.title,documentId:e.documentId,templateDocumentId:e.constraints.templateDocumentId,sourceDocumentIds:$s([e.constraints.templateDocumentId,...n]),referenceDocumentIds:n,constraints:e.constraints,generationTrace:e.generationTrace,sourceVersionId:e.sourceVersionId,outputVersionId:e.outputVersionId,instruction:e.instruction,outputPreview:e.outputPreview,errorMessage:e.errorMessage}}async function C3(e){M2(e.constraints)&&await e.saveRecord(F2(e))}const Up="桌面语音 smoke";function Rh(){if(typeof window>"u")return null;const e=window;return e.SpeechRecognition||e.webkitSpeechRecognition||null}function B2(){var r;return typeof navigator>"u"?!1:[String(((r=navigator.userAgentData)==null?void 0:r.platform)||""),String(navigator.platform||""),String(navigator.userAgent||"")].join(" ").toLowerCase().includes("linux")}function L2(){return typeof navigator>"u"?!1:/electron/i.test(String(navigator.userAgent||""))}function Mh(){var e;return typeof window<"u"&&typeof window.AudioContext<"u"&&typeof window.Worker<"u"&&!!((e=navigator.mediaDevices)!=null&&e.getUserMedia)}function Fh(){return L2()?!1:!!Rh()&&!B2()}function N2(e){const n=String(e||"").trim().toLowerCase();return n==="not-allowed"||n==="service-not-allowed"?"麦克风权限被拒绝，无法使用语音输入":n==="audio-capture"?"未检测到可用麦克风，无法使用语音输入":n==="network"?"在线语音识别服务暂时不可用，请检查网络后重试":n==="no-speech"?"没有检测到有效语音，请靠近麦克风后重试":"语音输入失败，请稍后重试"}function O2(e,n){if(e instanceof Error&&e.message.trim())return`${n}：${e.message.trim()}`;const r=String(e||"").trim();return r?`${n}：${r}`:n}function W2(){var n;if(typeof window>"u")return"";const e=String(window.__AI_WRITER_VOSK_TEST_MODE__||"").trim();if(e)return e.toLowerCase();try{return String(((n=window.localStorage)==null?void 0:n.getItem("AI_WRITER_VOSK_TEST_MODE"))||"").trim().toLowerCase()}catch{return""}}function Bh(){return W2()==="smoke"}async function U2(e){let n=!1,r=window.setTimeout(()=>{n||e.onPartialText(Up)},80);return{stop:async()=>{n||(n=!0,r!==null&&(window.clearTimeout(r),r=null),e.onFinalText(Up))}}}async function H2(e){const n=Rh();if(!n)throw new Error("当前环境不支持快速语音输入");const r=new n;r.lang="zh-CN",r.continuous=!0,r.interimResults=!0,r.maxAlternatives=1;let i=!1,o=!1,s=!1,a=null;const d=()=>{s||(s=!0,a==null||a(),a=null)};r.onresult=u=>{var g;if(i)return;const f=u.results;if(!f)return;const p=Math.max(0,Number(u.resultIndex||0));let m="";for(let h=p;h<f.length;h+=1){const x=f[h],k=String(((g=x==null?void 0:x[0])==null?void 0:g.transcript)||"").trim();k&&(x!=null&&x.isFinal?e.onFinalText(k):m=`${m} ${k}`.trim())}e.onPartialText(m)},r.onerror=u=>{if(i)return;const f=N2(String(u.error||""));if(o){d();return}e.onError(f)},r.onend=()=>{if(!i){if(o){d();return}e.onError("语音输入已结束，请重新点击麦克风继续")}};try{r.start()}catch(u){throw new Error(O2(u,"启动快速语音输入失败"))}return{stop:async()=>{i||(i=!0,o=!0,await new Promise(u=>{a=u;try{r.stop()}catch{try{r.abort()}catch{u()}}window.setTimeout(u,500)}),r.onresult=null,r.onerror=null,r.onend=null)}}}function K2(){return Bh()||Fh()?!0:Mh()}async function G2(e){var a;const n=window.electronAPI;if(!(n!=null&&n.voiceStart)||!(n!=null&&n.voiceStop)||!(n!=null&&n.onVoiceEvent))throw new Error("当前环境不支持语音输入（缺少 IPC 接口），请改用键盘输入");(a=e.onStatusChange)==null||a.call(e,"正在启动语音输入...");const{sessionId:r}=await n.voiceStart();let i=!1;const o=n.onVoiceEvent(d=>{i||d.sessionId!==r||(d.type==="result"&&d.text?(e.onFinalText(d.text),e.onPartialText("")):d.type==="error"&&d.message&&e.onError(d.message))}),s=async()=>{i||(i=!0,o(),await n.voiceStop(r).catch(()=>{}))};return{stop:async()=>{await s()}}}async function q2(e){if(Bh())return U2(e);if(Fh())try{return await H2(e)}catch{}if(!Mh())throw new Error("当前环境不支持语音输入，请改用键盘输入");return G2(e)}const V2={cover:"cover",toc:"toc",section_divider:"section_divider",text_content:"text_content",content_cards:"content_cards",image_text:"image_text",closing:"closing",unknown:"unknown",agenda:"toc",section:"section_divider",content:"text_content",cards:"content_cards",summary:"closing",ending:"closing",metrics:"text_content",comparison:"text_content",timeline:"text_content"};function Y2(e){const n=e.toLowerCase().trim();return V2[n]??"unknown"}const J2=new Set(["templateId","theme","color","font","background","layout","x","y","w","h","master","animation","style","pptxConfig"]);function X2(e){const n=[],r={};for(const[i,o]of Object.entries(e))J2.has(i)?n.push(i):r[i]=o;return{cleaned:r,stripped:n}}function Z2(e){const{outlineTitle:n,completedSlides:r,outlinePlan:i,sourcePrompt:o,imageAssets:s,imageMode:a,scenario:d}=e,u=`deck-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,f=new Date().toISOString(),p=new Map,m=s.map((y,j)=>{const S=`asset-${j}-si${y.slideIndex}`,z=`slide-${y.slideIndex}`,P=y.purpose??"illustration";return p.set(y.slideIndex,{assetId:S,imagePath:y.imagePath,purpose:P}),{assetId:S,type:"image",source:"generated",path:y.imagePath,purpose:P,targetSlideId:z,imagePath:y.imagePath,slideIndex:y.slideIndex}}),g=new Map;for(const y of i)g.set(y.index,y);const h=[],x=r.map(({slideData:y,outlineIndex:j})=>{const{cleaned:S,stripped:z}=X2(y);z.length>0&&h.push(`slides[${j}]: stripped forbidden fields [${z.join(", ")}]`);const P=g.get(j),I=String(S.intent||S.type||(P==null?void 0:P.role)||"unknown"),b=Y2(I),$=`slide-${j}`,O=p.get(j),D=O?[O.assetId]:[];return{id:$,index:j,intent:b,title:S.title!=null?String(S.title):void 0,subtitle:S.subtitle!=null?String(S.subtitle):void 0,heading:S.heading!=null?String(S.heading):(P==null?void 0:P.heading)||void 0,body:S.body!=null?String(S.body):void 0,items:Array.isArray(S.items)?S.items.map(String):void 0,leftTitle:S.leftTitle!=null?String(S.leftTitle):void 0,leftItems:Array.isArray(S.leftItems)?S.leftItems.map(String):void 0,rightTitle:S.rightTitle!=null?String(S.rightTitle):void 0,rightItems:Array.isArray(S.rightItems)?S.rightItems.map(String):void 0,metrics:Array.isArray(S.metrics)?S.metrics.map(V=>({value:String(V.value??""),label:String(V.label??""),detail:V.detail!=null?String(V.detail):void 0})):void 0,timeline:Array.isArray(S.timeline)?S.timeline.map(V=>({title:String(V.title??""),detail:V.detail!=null?String(V.detail):void 0})):void 0,imagePath:(O==null?void 0:O.imagePath)??null,assetRefs:D.length>0?D:void 0,notes:S.notes!=null?String(S.notes):void 0}});h.length>0&&console.warn("[assembleDeckDocument] stripped forbidden fields from slides:",h);const k=x.filter(y=>y.intent==="section_divider").map(y=>y.heading||y.title||"").filter(Boolean);return{deckId:u,schemaVersion:"1.0",title:n,scenario:d??"business_report",language:"zh",sections:k.length>0?k:void 0,imageMode:a??"none",slides:x,assets:m,sourcePrompt:o,source:{type:"generated"},status:"completed",expectedSlideCount:i.length,completedSlideCount:r.length,createdAt:f,updatedAt:f}}const Q2=new Set(["cover","toc","section_divider","text_content","content_cards","image_text","closing","unknown"]);function Hp(e,n){if(typeof e!="string")throw new TypeError(`DeckDocument: expected string at ${n}, got ${typeof e}`)}function eA(e,n){if(!Array.isArray(e))throw new TypeError(`DeckDocument: expected array at ${n}, got ${typeof e}`)}function Gn(e,n){if(typeof e!="object"||e===null||Array.isArray(e))throw new TypeError(`DeckDocument: expected object at ${n}, got ${typeof e}`)}function Kp(e){if(typeof e!="object"||e===null||Array.isArray(e))return;const n=e;return{messageId:n.messageId!=null?String(n.messageId):void 0,attachmentId:n.attachmentId!=null?String(n.attachmentId):void 0,filename:n.filename!=null?String(n.filename):void 0}}function tA(e,n){Gn(e,`slides[${n}]`);const r=e,i=String(r.intent??"unknown");if(!Q2.has(i))throw new TypeError(`DeckDocument: unknown intent "${i}" at slides[${n}].intent`);return{index:typeof r.index=="number"?r.index:n,intent:i,id:r.id!=null?String(r.id):void 0,sectionId:r.sectionId!=null?String(r.sectionId):void 0,title:r.title!=null?String(r.title):void 0,shortTitle:r.shortTitle!=null?String(r.shortTitle):void 0,displayTitle:r.displayTitle!=null?String(r.displayTitle):void 0,subtitle:r.subtitle!=null?String(r.subtitle):void 0,heading:r.heading!=null?String(r.heading):void 0,body:r.body!=null?String(r.body):void 0,items:Array.isArray(r.items)?r.items.map(String):void 0,textBlocks:Array.isArray(r.textBlocks)?r.textBlocks.map((o,s)=>{Gn(o,`slides[${n}].textBlocks[${s}]`);const a=o;return{blockId:String(a.blockId??`block-${s}`),role:String(a.role??"body"),text:String(a.text??""),maxChars:typeof a.maxChars=="number"?a.maxChars:void 0}}):void 0,assetRequests:Array.isArray(r.assetRequests)?r.assetRequests.map((o,s)=>{Gn(o,`slides[${n}].assetRequests[${s}]`);const a=o;return{requestId:String(a.requestId??`req-${s}`),purpose:String(a.purpose??"illustration"),sourceDescription:String(a.sourceDescription??""),targetSlideId:a.targetSlideId!=null?String(a.targetSlideId):void 0,targetTextBlockIds:Array.isArray(a.targetTextBlockIds)?a.targetTextBlockIds.map(String):void 0,semanticTags:Array.isArray(a.semanticTags)?a.semanticTags.map(String):void 0}}):void 0,leftTitle:r.leftTitle!=null?String(r.leftTitle):void 0,leftItems:Array.isArray(r.leftItems)?r.leftItems.map(String):void 0,rightTitle:r.rightTitle!=null?String(r.rightTitle):void 0,rightItems:Array.isArray(r.rightItems)?r.rightItems.map(String):void 0,metrics:Array.isArray(r.metrics)?r.metrics.map((o,s)=>{Gn(o,`slides[${n}].metrics[${s}]`);const a=o;return{value:String(a.value??""),label:String(a.label??""),detail:a.detail!=null?String(a.detail):void 0}}):void 0,timeline:Array.isArray(r.timeline)?r.timeline.map((o,s)=>{Gn(o,`slides[${n}].timeline[${s}]`);const a=o;return{title:String(a.title??""),detail:a.detail!=null?String(a.detail):void 0}}):void 0,imagePath:r.imagePath!=null?String(r.imagePath):void 0,assetRefs:Array.isArray(r.assetRefs)?r.assetRefs.map(String):void 0,oneLiner:r.oneLiner!=null?String(r.oneLiner):void 0,summary:r.summary!=null?String(r.summary):void 0,keywords:Array.isArray(r.keywords)?r.keywords.map(String):void 0,keyTakeaways:Array.isArray(r.keyTakeaways)?r.keyTakeaways.map(String):void 0,visualBrief:r.visualBrief!=null?String(r.visualBrief):void 0,notes:r.notes!=null?String(r.notes):r.speakerNotes!=null?String(r.speakerNotes):void 0,speakerNotes:r.speakerNotes!=null?String(r.speakerNotes):r.notes!=null?String(r.notes):void 0,contentDensity:r.contentDensity!=null?String(r.contentDensity):void 0,visualDemand:r.visualDemand!=null?String(r.visualDemand):void 0,preferredLayout:r.preferredLayout!=null?String(r.preferredLayout):void 0}}const nA=new Set(["none","cover_only","section","per_slide"]);function rA(e){Gn(e,"root");const n=e;if(Hp(n.deckId,"deckId"),n.schemaVersion!=="1.0")throw new TypeError(`DeckDocument: unsupported schemaVersion "${n.schemaVersion}"`);Hp(n.title,"title"),eA(n.slides,"slides"),Gn(n.source,"source");const r=n.source;if(!new Set(["generated","manuscript","prompt","imported_pptx"]).has(String(r.type)))throw new TypeError(`DeckDocument: invalid source.type "${r.type}"`);if(n.status!=="partial"&&n.status!=="completed")throw new TypeError(`DeckDocument: invalid status "${n.status}"`);const o=String(n.language??"zh");if(o!=="zh"&&o!=="en")throw new TypeError(`DeckDocument: invalid language "${o}"`);let s;if(n.imageMode!=null){const a=String(n.imageMode);if(!nA.has(a))throw new TypeError(`DeckDocument: invalid imageMode "${a}"`);s=a}return{deckId:n.deckId,schemaVersion:"1.0",title:n.title,subtitle:n.subtitle!=null?String(n.subtitle):void 0,scenario:n.scenario!=null?String(n.scenario):void 0,language:o,sections:Array.isArray(n.sections)?n.sections.map(String):void 0,imageMode:s,slides:n.slides.map(tA),assets:Array.isArray(n.assets)?n.assets.map((a,d)=>{Gn(a,`assets[${d}]`);const u=a;return{assetId:String(u.assetId??`asset-${d}`),type:u.type!=null?String(u.type):void 0,source:u.source!=null?String(u.source):void 0,path:u.path!=null?String(u.path):u.imagePath!=null?String(u.imagePath):void 0,purpose:u.purpose!=null?String(u.purpose):void 0,targetSlideId:u.targetSlideId!=null?String(u.targetSlideId):void 0,targetTextBlockIds:Array.isArray(u.targetTextBlockIds)?u.targetTextBlockIds.map(String):void 0,caption:u.caption!=null?String(u.caption):void 0,semanticTags:Array.isArray(u.semanticTags)?u.semanticTags.map(String):void 0,imagePath:u.imagePath!=null?String(u.imagePath):u.path!=null?String(u.path):void 0,slideIndex:u.slideIndex!=null?Number(u.slideIndex):void 0}}):[],sourcePrompt:n.sourcePrompt!=null?String(n.sourcePrompt):void 0,source:{type:r.type,sourcePath:r.sourcePath!=null?String(r.sourcePath):void 0,manuscriptId:r.manuscriptId!=null?String(r.manuscriptId):void 0,emailAttachment:Kp(r.emailAttachment)},sourceRefs:Array.isArray(n.sourceRefs)?n.sourceRefs.map((a,d)=>{Gn(a,`sourceRefs[${d}]`);const u=a;return{sourceId:String(u.sourceId??""),sourceType:String(u.sourceType??"manuscript"),excerpt:u.excerpt!=null?String(u.excerpt):void 0,slideIndex:u.slideIndex!=null?Number(u.slideIndex):void 0,confidence:u.confidence!=null?Number(u.confidence):void 0,emailAttachment:Kp(u.emailAttachment)}}):void 0,status:n.status,expectedSlideCount:Number(n.expectedSlideCount??n.slides.length),completedSlideCount:Number(n.completedSlideCount??n.slides.length),createdAt:n.createdAt!=null?String(n.createdAt):new Date().toISOString(),updatedAt:n.updatedAt!=null?String(n.updatedAt):new Date().toISOString()}}const iA=["templateId","theme","color","font","background","layout","x","y","w","h","master","animation"],oA=["templateId","theme","color","font","background","layout","x","y","w","h","master","animation","style","pptxConfig"],sA=new Set(["cover","toc","section_divider","text_content","content_cards","image_text","closing","unknown"]);function Gp(e,n,r,i){for(const o of n)o in e&&(i.push(`[validateDeckDocumentOutput] ${r} contains forbidden field "${o}" — stripped`),delete e[o])}function aA(e){const n=[],r=[];if(e===null||typeof e!="object"||Array.isArray(e))return{valid:!1,errors:["Input is not an object"],warnings:r};const i=e;if(Gp(i,iA,"document",r),(!i.deckId||typeof i.deckId!="string")&&n.push("Missing or invalid deckId"),(!i.title||typeof i.title!="string")&&n.push("Missing or invalid title"),!Array.isArray(i.slides))return n.push("slides must be an array"),{valid:!1,errors:n,warnings:r};i.slides.length===0&&n.push("slides array is empty"),i.status!=="partial"&&i.status!=="completed"&&n.push(`Invalid status: "${i.status}"`),i.schemaVersion!=="1.0"&&n.push(`Unsupported schemaVersion: "${i.schemaVersion}"`);for(let s=0;s<i.slides.length;s++){const a=i.slides[s];if(a===null||typeof a!="object"||Array.isArray(a)){n.push(`slides[${s}] is not an object`);continue}const d=a;Gp(d,oA,`slides[${s}]`,r);const u=String(d.intent||"");sA.has(u)||(r.push(`slides[${s}].intent "${u}" is not a valid DeckSlideIntent — downgrading to "unknown"`),d.intent="unknown"),d.intent==="content_cards"&&(!Array.isArray(d.items)||d.items.length===0)&&(r.push(`slides[${s}]: content_cards has no items — downgrading intent to "text_content"`),d.intent="text_content")}let o=0;for(let s=0;s<i.slides.length;s++){const a=i.slides[s],d=typeof a.title=="string"?a.title:"";if(!d)continue;let u=!1;a.displayTitle||(a.displayTitle=d.length<=14?d:d.slice(0,14),u=!0),a.shortTitle||(a.shortTitle=d.length<=8?d:d.slice(0,8),u=!0),u&&o++}if(o>0&&r.push(`[validateDeckDocumentOutput] Auto-derived shortTitle/displayTitle for ${o} slide(s)`),n.length>0)return{valid:!1,errors:n,warnings:r};try{const s=rA(i);return{valid:!0,errors:[],warnings:r,deck:s}}catch(s){return{valid:!1,errors:[s instanceof Error?s.message:String(s)],warnings:r}}}const Lh=l.div`
  flex-shrink: 0;
  border-top: 1px solid #dfe7ef;
  background: linear-gradient(180deg, rgba(249, 252, 255, 0.96) 0%, rgba(244, 248, 252, 0.98) 100%);
  padding: 12px 18px 16px;
`,Nh=l.div`
  position: relative;
  min-width: 0;
  border: 1px solid ${({$dragging:e})=>e?"#6aa6ff":"#d9e3ee"};
  border-radius: 20px;
  background: #ffffff;
  padding: 14px 16px 12px;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus-within {
    border-color: ${({$dragging:e})=>e?"#6aa6ff":"#80addd"};
    box-shadow: 0 10px 26px rgba(74, 140, 214, 0.12);
  }
`,lA=l.textarea`
  width: 100%;
  min-height: 72px;
  max-height: 144px;
  resize: none;
  border: none;
  background: transparent;
  color: #304255;
  padding: 0;
  font-size: 14px;
  line-height: 1.7;
  outline: none;

  &::placeholder {
    color: #a0aebc;
  }
`,cA=l.div`
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`,qp=l.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`,Gl=l.button`
  min-height: 34px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid #d9e3ee;
  background: #f9fbfd;
  color: #607487;
  font-size: var(--font-size-sm);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f4f8fc;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,Vp=l.button`
  min-height: 34px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid #76a7de;
  background: linear-gradient(180deg, #6aa3e1 0%, #4d8fd7 100%);
  color: #ffffff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(74, 140, 214, 0.18);

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`,dA=l.button`
  min-height: 34px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid #dd8d8d;
  background: #fff4f4;
  color: #b33a3a;
  font-size: var(--font-size-sm);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #ffeaea;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;l.button`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #76a7de;
  background: linear-gradient(180deg, #6aa3e1 0%, #4d8fd7 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(74, 140, 214, 0.18);
  cursor: pointer;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;function uA({capabilities:e,running:n=!1,sendDisabled:r=!1,onSend:i,onStop:o,onPause:s,onResume:a,leftActions:d,rightActions:u,sendLabel:f="发送"}){return t.jsxs(cA,{children:[t.jsxs(qp,{children:[d,e.canPause&&n?t.jsx(Gl,{type:"button",onClick:s,children:"暂停"}):null,e.canResume&&n?t.jsx(Vp,{type:"button",onClick:a,children:"继续"}):null,e.canStop&&n?t.jsx(dA,{type:"button",onClick:o,children:"停止"}):null]}),t.jsxs(qp,{children:[u,e.canSend&&!n?t.jsx(Vp,{type:"button",onClick:i,disabled:r,children:f}):null]})]})}const pA=l.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`,Yp=l.span`
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: #667b90;
`,fA=l.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid ${({$tone:e})=>e==="running"?"#8bb6ea":e==="paused"?"#e2c07a":e==="error"?"#e3a1a1":"#d9e3ee"};
  background: ${({$tone:e})=>e==="running"?"#edf5ff":e==="paused"?"#fff6e8":e==="error"?"#fff2f2":"#f7fafd"};
  color: ${({$tone:e})=>e==="running"?"#2455c3":e==="paused"?"#946118":e==="error"?"#b33a3a":"#607487"};
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
`,mA=l.button`
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid ${({$active:e})=>e?"#d98b52":"#d9e3ee"};
  background: ${({$active:e})=>e?"#fff1e7":"#f9fbfd"};
  color: ${({$active:e})=>e?"#b85b18":"#607487"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${({$active:e})=>e?"0 0 0 4px rgba(217, 139, 82, 0.12)":"none"};
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: ${({$active:e})=>e?"#ffe7d7":"#f4f8fc"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,gA=l.div`
  margin-top: 10px;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: #667b90;
`,hA=l.div`
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #1e3a5f;
  margin-bottom: 6px;
`,xA=l.div`
  font-size: var(--font-size-sm);
  line-height: 1.65;
  color: #667b90;
`,bA=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  height: 32px;
  background: rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid #dce5ef;
  border-top: 1px solid #dfe7ef;
`,yA=l.span`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #5f7387;
  letter-spacing: 0.04em;
`,vA=l.button`
  font-size: var(--font-size-xs);
  color: #7b8794;
  background: #ffffff;
  border: 1px solid #dde3ec;
  border-radius: 6px;
  padding: 2px 10px;
  cursor: pointer;
  line-height: 1.5;
  &:hover {
    background: #eef2f7;
    color: #304255;
  }
`,wA=l.div`
  width: 100%;
  height: 40px;
  border-top: 1px solid #dde3ec;
  background: linear-gradient(180deg, rgba(249, 252, 255, 0.96) 0%, rgba(244, 248, 252, 0.98) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  &:hover {
    background: linear-gradient(180deg, #f3f7fc 0%, #e8eef6 100%);
  }
`,SA=l.span`
  color: #2455c3;
  font-size: var(--font-size-sm);
  font-weight: 600;
  white-space: nowrap;
`,kA=l.span`
  font-size: var(--font-size-sm);
  color: #7b8794;
  padding: 2px 10px;
  border: 1px solid #dde3ec;
  border-radius: 6px;
  background: #ffffff;
`,jA=["pdf","docx","doc","txt","md","pptx"],Oh=16e3,IA=12e3;function Jp(e){return!!(e&&(e.sourceType==="doc"||e.sourceType==="docx"))}function $A(e){return!!(e&&jA.includes(e.sourceType))}function Nr(e){return String(e||"").replace(/\r/g,`
`).replace(/\u0000/g,"").replace(/\n{3,}/g,`

`).trim()}function TA(e){switch(e){case"cover":return"cover";case"toc":return"toc";case"section_divider":return"section";case"closing":return"summary";default:return"content"}}function CA(e){const n=Nr(e);if(!n)return[];const r=n.split(/\n+/).map(i=>i.replace(/\s+/g," ").trim()).filter(Boolean);return r.length>=3?r:n.split(new RegExp("(?<=[。！？；.!?;])\\s*")).map(i=>i.replace(/\s+/g," ").trim()).filter(Boolean)}function Ts(e,n){const r=e.map(s=>Nr(s)).filter(Boolean),i=[];let o=0;for(const s of r){const a=i.length>0?1:0;if(o+a+s.length<=n){i.push(s),o+=a+s.length;continue}i.length===0&&i.push(s.slice(0,Math.max(0,n)).trim());break}return{segments:i.filter(Boolean),omittedCount:Math.max(0,r.length-i.length)}}function PA(e,n){var f,p;const r=Nr((n==null?void 0:n.extractedText)||(n==null?void 0:n.originalExtractedText)||""),i=CA(r).filter(m=>m!==e.title&&m!==e.originalName),o=i.map((m,g)=>`${g+1}. ${m}`),s=Ts(o,Oh),a=(p=(f=n==null?void 0:n.parsedDocument)==null?void 0:f.sections)!=null&&p.length?[...n.parsedDocument.sections].sort((m,g)=>m.order-g.order):[],d=Ts(a.map((m,g)=>`${g+1}. ${Nr(m.title||`第 ${g+1} 部分`)}`),1200);if(s.segments.length===0)return{summary:[`主内容 Word：${e.title}`,"未读取到稳定的正文提要；请主要根据下方命中的正文证据组织 PPT。"].join(`
`),sourceTextLength:r.length,paragraphCount:i.length};const u=[`主内容 Word：${e.title}`,"以下为该 Word 尽量保全的原始正文内容，请优先依据这些段落组织 PPT；不要只提炼标题，要从正文事实、论点、步骤和结论中提取页面内容。"];return d.segments.length>0&&(u.push("文档章节："),u.push(...d.segments),d.omittedCount>0&&u.push(`其余 ${d.omittedCount} 个章节标题因提示词长度限制未展开，但正文段落仍已尽量保留。`)),u.push("正文段落："),u.push(...s.segments),s.omittedCount>0&&u.push(`其余 ${s.omittedCount} 段正文因提示词长度限制未继续展开；已优先保留靠前且完整的原文段落。`),{summary:u.join(`
`),sourceTextLength:r.length,paragraphCount:i.length}}function AA(e){const n=Lg(e),r=n.title||"当前文稿",i=n.paragraphs.filter(d=>d!==r),o=i.map((d,u)=>`${u+1}. ${d}`),s=Ts(o,Oh);if(s.segments.length===0)return{title:r,kind:"direct-document",summary:[`主内容文稿：${r}`,"当前本轮内存文稿尚未提取到稳定正文；如已勾选补充资料，请结合下方正文证据生成 PPT。"].join(`
`),sourceTextLength:n.sourceTextLength,paragraphCount:i.length};const a=[`主内容文稿：${r}`,"以下为本轮内存文稿提取出的正文内容，请优先依据这些段落组织 PPT；不要只根据标题、文件名或空泛常识生成。","正文段落：",...s.segments];return s.omittedCount>0&&a.push(`其余 ${s.omittedCount} 段正文因提示词长度限制未继续展开；已优先保留靠前且完整的原文段落。`),{title:r,kind:"direct-document",summary:a.join(`
`),sourceTextLength:n.sourceTextLength,paragraphCount:i.length}}function _A(e){const n=((e==null?void 0:e.citations)||[]).filter(s=>s.sourceKind==="required-reference"||s.sourceKind==="preferred-reference");if(n.length===0)return{summary:"当前未命中稳定的正文证据；若存在主内容文稿，请优先依据其正文提要生成 PPT。",evidenceCount:0,evidenceTextLength:0};const r=new Map(((e==null?void 0:e.retrievedHits)||[]).map(s=>[s.chunk.id,Nr(s.chunk.text||s.quote||"")])),i=n.map(s=>{const a=r.get(s.chunkId)||Nr(s.quote||"");return`- ${s.documentTitle}｜${s.locatorLabel}
  ${a}`}),o=Ts(i,IA);return{summary:["以下片段来自你本轮明确勾选的资料正文，必须作为 PPT 内容事实与术语表达的主要依据：",...o.segments,...o.omittedCount>0?[`其余 ${o.omittedCount} 条正文证据因提示词长度限制未继续展开；已优先保留完整 chunk 原文而非短摘要。`]:[]].join(`
`),evidenceCount:n.length,evidenceTextLength:n.reduce((s,a)=>s+(r.get(a.chunkId)||Nr(a.quote||"")).length,0)}}function EA(e){const{primaryContentTitle:n,primaryContentKind:r,primaryPptDocument:i,sourceTextLength:o,paragraphCount:s,evidenceCount:a,evidenceTextLength:d}=e,u=r!=="none"?o<900||s<4:d<500||a<3;return[n?`主内容来源：${n}（${r==="direct-document"?"本轮内存文稿优先":"Word 正文优先"}）${i?`；主素材 PPT ${i.title} 仅提供页序和版式参考。`:"；当前没有主素材 PPT，请直接按主内容正文组织结构。"}`:i?"当前没有显式主内容文稿；请以主素材 PPT 的页序为骨架，并严格依据勾选资料正文证据填充内容。":"当前没有显式主素材 PPT；请严格依据勾选资料正文证据自行组织演示结构。",u?"当前正文资料信息密度偏低。你可以在不脱离原文主题和事实边界的前提下做适度扩写，用于补足背景说明、概念解释、过渡句、总结句、影响与建议，但不得编造新的具体事实、数字、案例、政策或实验结果。":"当前正文资料较充足。请以提炼、重组和演示化表达为主，尽量少做扩写，不要把一页写成空泛套话。"].join(`
`)}async function zA(e,n,r,i,o){const s=r.find(h=>h.id===i&&h.sourceType==="pptx")||r.find(h=>h.sourceType==="pptx")||null,a=r.find(h=>h.id===i&&Jp(h))||r.find(h=>Jp(h))||null,d=r.filter(h=>$A(h)),u=o?AA(o):null,[f,p]=await Promise.all([!u&&a?window.electronAPI.getKnowledgeDocument(e,a.id).catch(()=>null):Promise.resolve(null),d.length>0?R2({instruction:n,constraints:z2({mode:"selected-only",requiredReferenceDocumentIds:d.map(h=>h.id),autoRetrievalLimit:Math.min(24,Math.max(10,d.length*6)),templateInheritance:E2()}),previewContext:h=>window.electronAPI.previewKnowledgeTaskContext(e,h),fallbackInstruction:"请根据当前勾选资料生成 PPT"}):Promise.resolve(null)]),m=u||(a?(()=>{const h=PA(a,f);return{title:a.title,summary:h.summary,sourceTextLength:h.sourceTextLength,paragraphCount:h.paragraphCount,kind:"word-knowledge"}})():{title:null,summary:"当前未指定主内容文稿。",sourceTextLength:0,paragraphCount:0,kind:"none"}),g=_A(p);return{primaryWordDocument:a,primaryContentTitle:m.title,primaryContentSummary:m.summary,evidenceSummary:g.summary,contentStrategy:EA({primaryContentTitle:m.title,primaryContentKind:m.kind,primaryPptDocument:s,sourceTextLength:m.sourceTextLength,paragraphCount:m.paragraphCount,evidenceCount:g.evidenceCount,evidenceTextLength:g.evidenceTextLength})}}function ql(e,n=40){return String(e||"").replace(/\s+/g," ").trim().slice(0,n)}function DA(e){var r,i,o;const n=[];for(const s of e){if(n.length>=4)break;if(s.type==="image"){n.push("图片占位");continue}if(s.type==="table"){const d=((r=s.rows)==null?void 0:r.length)||0,u=((o=(i=s.rows)==null?void 0:i[0])==null?void 0:o.length)||0;n.push(d>0&&u>0?`表格 ${d}x${u}`:"表格");continue}if(s.type==="list"){const d=(s.items||[]).map(u=>ql(u,24)).filter(Boolean).slice(0,3).join("；");d&&n.push(`要点 ${d}`);continue}const a=ql(s.text||"",s.type==="heading"?28:36);a&&n.push(a)}return Array.from(new Set(n.filter(Boolean))).slice(0,4)}function RA(e,n,r){const i=n.filter(u=>u.type==="image").length,o=n.filter(u=>u.type==="table").length,s=DA(n),a=[i>0?`${i} 张图片`:"",o>0?`${o} 个表格`:""].filter(Boolean),d=[ql(e.title||`第 ${r+1} 页`,32),...a,...s].filter(Boolean);return`${r+1}. 第 ${r+1} 页｜${d.join("｜")||"以图片或版式占位为主"}`}function MA(e,n){if(!n)return[`主素材：${e.title}`,"未读取到可用的逐页解析结果；请仍以该 PPT 作为整体版式和页序参考。"].join(`
`);const r=[...n.sections].sort((o,s)=>o.order-s.order),i=r.map((o,s)=>{const a=n.blocks.filter(d=>d.sectionId===o.id).sort((d,u)=>d.order-u.order);return RA(o,a,s)});return[`主素材：${e.title}`,`总页数：${r.length}`,...i].join(`
`)}async function Xp(e,n,r,i,o){const s=await zA(e,n,r,i,o),a=r.find(p=>p.id===i&&p.sourceType==="pptx")||r.find(p=>p.sourceType==="pptx")||null,d=a?await window.electronAPI.getKnowledgeDocument(e,a.id).catch(()=>null):null,u=a?MA(a,(d==null?void 0:d.parsedDocument)||null):"当前未指定 PPT 主素材；请仅根据用户需求组织演示结构。",f=r.filter(p=>p.id!==(a==null?void 0:a.id)).map((p,m)=>{var h;const g=[p.sourceType];return((h=s.primaryWordDocument)==null?void 0:h.id)===p.id&&g.push("主内容 Word"),`${m+1}. ${p.title}｜${g.join("｜")}｜${p.originalName}`});return{prompt:n,primaryContentSummary:s.primaryContentSummary,evidenceSummary:s.evidenceSummary,contentStrategy:s.contentStrategy,primaryPptSummary:u,materialLines:f.length>0?f.join(`
`):"除主素材外，当前没有其他已选资料。"}}function FA(e){return["你是一位专业的企业/机构 PPT 策划助手。","请根据以下材料，为用户需求规划一份 PPT 演示文稿的结构大纲。","你必须且只能输出一段合法的 JSON，不要输出任何额外解释、代码块标记或 markdown。","","## 输出格式（只需规划结构，不需要填写具体内容）","{",'  "title": "演示标题",','  "slides": [','    {"index": 0, "intent": "cover", "heading": "封面标题", "hint": "副标题关键词"},','    {"index": 1, "intent": "toc", "heading": "目录"},','    {"index": 2, "intent": "section_divider", "heading": "第一章：背景"},','    {"index": 3, "intent": "text_content", "heading": "页面标题", "hint": "此页核心观点一句话"},','    {"index": 4, "intent": "content_cards", "heading": "核心要点", "hint": "要展示哪些卡片"},','    {"index": 5, "intent": "closing", "heading": "总结与展望"}',"  ]","}","","## 页面意图说明","- cover：封面（必须第 0 页）- toc：目录 - section_divider：章节分隔 - text_content：正文（最常用）- content_cards：要点卡片 - image_text：图文页 - closing：总结","","## 约束","1. 第 0 页必须是 cover。2. 总页数 8~16 页。3. 至少使用 2 种非 text_content 的页面类型。4. 只输出 JSON，禁止包含 theme/color/font/style/templateId 字段。","",`## 用户需求
${e.prompt}`,"","## 内容处理策略",e.contentStrategy,"","## 主内容正文提要",e.primaryContentSummary,"","## 主素材 PPT 逐页结构摘要",e.primaryPptSummary,"","## 勾选素材正文证据",e.evidenceSummary,"","## 其他素材",e.materialLines].join(`
`)}function Zp(e,n,r){const i=n.slides.map(a=>`  ${a.index+1}. [${a.role}] ${a.heading}`).join(`
`),o={cover:'{"intent": "cover", "title": "封面主标题", "subtitle": "副标题或机构名"}',toc:'{"intent": "toc", "title": "目录", "items": ["章节一", "章节二", "章节三"]}',section_divider:'{"intent": "section_divider", "heading": "章节标题", "subtitle": "章节描述（可选）"}',section:'{"intent": "section_divider", "heading": "章节标题", "subtitle": "章节描述（可选）"}',text_content:'{"intent": "text_content", "heading": "页面标题", "body": "可选导语（直接引用原文结论）", "items": ["具体事实或数据（15字以上）", "要点2", "要点3", "要点4"]}',content:'{"intent": "text_content", "heading": "页面标题", "body": "可选导语（直接引用原文结论）", "items": ["具体事实或数据（15字以上）", "要点2", "要点3", "要点4"]}',content_cards:'{"intent": "content_cards", "heading": "核心要点", "items": ["要点一（15字以上）", "要点二", "要点三", "要点四"]}',metrics:'{"intent": "text_content", "heading": "核心指标", "body": "可选说明", "metrics": [{"value": "87%", "label": "指标名", "detail": "说明"}]}',comparison:'{"intent": "text_content", "heading": "对比标题", "leftTitle": "左侧标题", "leftItems": ["要点1", "要点2"], "rightTitle": "右侧标题", "rightItems": ["要点1", "要点2"]}',timeline:'{"intent": "text_content", "heading": "推进节奏", "timeline": [{"title": "阶段1", "detail": "具体说明"}]}',closing:'{"intent": "closing", "heading": "总结标题", "body": "可选收束语", "items": ["总结要点1", "要点2", "要点3"]}',summary:'{"intent": "closing", "heading": "总结标题", "body": "可选收束语", "items": ["总结要点1", "要点2", "要点3"]}',image_text:'{"intent": "image_text", "heading": "页面标题", "body": "配图说明文字", "items": ["要点1", "要点2"]}'},s=o[r.role]??o.text_content;return["你是一位专业的企业/机构 PPT 内容撰写助手。","请为 PPT 中的单页幻灯片生成完整内容。只输出一段合法的 JSON，不要输出任何额外解释、代码块标记或 markdown。","禁止在 JSON 中出现 theme、color、font、style、templateId、imagePath、x、y、w、h、master、animation 等视觉样式或模板字段。","",`## 整份 PPT 概要：${n.title}（共 ${n.slides.length} 页）`,i,"","## 当前需要生成的页面",`第 ${r.index+1} 页 · 页面意图：${r.role} · heading：${r.heading}`,r.hint?`内容提示：${r.hint}`:"","","## 输出格式（严格按照如下 JSON 结构）",s,"",'## 内容约束：每条 items 至少 15 字；不要使用"要点1"等占位符；text_content 页建议 4~6 条 items；metrics 建议 2~4 个指标。',"",`## 用户原始需求
${e.prompt}`,"","## 内容处理策略",e.contentStrategy,"","## 主内容正文提要（优先参考）",e.primaryContentSummary,"","## 勾选素材正文证据",e.evidenceSummary].filter(Boolean).join(`
`)}function BA(e,n,r){return Dh(e,n,r)}function Wh(){var oe,Te;const{currentMode:e,enterImageGenerationMode:n}=Cn(),r=kr(),i=Sr(),o=((Te=(oe=r.sessions.ppt)==null?void 0:oe.selectedKnowledgeBaseIds)==null?void 0:Te[0])||i.departmentId,{activeWorkspacePath:s}=Ft(),{setStatusMessage:a}=Jn(),{commitResult:d,setCommitResult:u}=zs(),{generateDocument:f,isBusy:p}=Ag(),[m,g]=c.useState(!1),h=c.useRef(!1),x=c.useRef(!1),k=c.useRef(null),v=c.useRef(""),y=c.useRef(null),j=c.useMemo(()=>K2(),[]),[S,z]=c.useState(!1),P=c.useRef(null),I=c.useRef(""),b=c.useRef(!1),$=Sc(e),O=c.useMemo(()=>e==="image"?r.imageReferences.map(C=>C.id):r.selectedAssetIds,[e,r.imageReferences,r.selectedAssetIds]),D=c.useMemo(()=>BA(i.documents,O,r.primaryAssetId),[i.documents,O,r.primaryAssetId]),R=r.sessions.image,V=c.useMemo(()=>R.imageReferences.map(C=>C.id),[R.imageReferences]),te=c.useMemo(()=>Dh(i.documents,V,R.primaryAssetId),[R.primaryAssetId,V,R.imageReferences,i.documents]),q=c.useMemo(()=>r.imageReferences.map((C,E)=>({...C,order:E})),[r.imageReferences]),W=c.useMemo(()=>mr(r.imageReferences),[r.imageReferences]),fe=c.useMemo(()=>mr(R.imageReferences),[R.imageReferences]),le=c.useMemo(()=>$2(R.lastImageStyleProfile,fe),[R.lastImageStyleProfile,fe]),Q=r.sessions.ppt.pendingAutoSubmitToken,ge=r.sessions.ppt.pendingAutoSubmitTargetAssetId,J=r.sessions.ppt.pptPrimarySource,H=r.sessions.ppt.pptStopRequested,T=r.sessions.ppt.pptResumeRequested;c.useEffect(()=>{var C;H&&(x.current=!0,(C=k.current)==null||C.abort(),v.current&&window.electronAPI.aiCancelTask(v.current).catch(()=>{}))},[H]);const w=c.useMemo(()=>{if(e!=="image")return null;const C=[`已选参考图 ${q.length} 张`];return C.push(W?"主参考图将直接随请求上传给图片 API":"建议先设为主参考图，以明确参考优先级"),C.join(" · ")},[e,W,q]);c.useMemo(()=>i.documents.find(C=>C.id===r.currentTemplateId)||null,[i.documents,r.currentTemplateId]),c.useMemo(()=>i.documents.find(C=>C.id===r.primaryAssetId)||null,[i.documents,r.primaryAssetId]);const L=e==="document"?p:m,[N,M]=c.useState([]),[A,ee]=c.useState("cuhk_sz_default");c.useEffect(()=>{var C,E;e==="ppt"&&((E=(C=window.electronAPI).listSkillTemplates)==null||E.call(C).then(K=>{K!=null&&K.ok&&Array.isArray(K.templates)&&M(K.templates)}).catch(()=>{}))},[e]);const me=c.useMemo(()=>({canSend:!0,canStop:!1,canPause:!1,canResume:!1}),[]),Ie=c.useMemo(()=>{const C=String(r.generationStatus.message||"").trim();return L?C||`正在${$.label}生成...`:e==="image"?"可生成图片结果（支持参考图）":e==="ppt"?"可生成 PPT 文件与预览":"就绪"},[e,L,$.label,r.generationStatus.message]),Fe=e==="document"?!!(d!=null&&d.outputPath||r.resultType):!!r.resultType,Z=async()=>{const C=await f(r.generationPrompt.trim());if(!C.success){a(C.errorMessage);return}a("正式文稿已生成")},X=()=>{e==="document"&&u(null),r.clearCurrentResult()},ye=async C=>{var K;const E=String((C==null?void 0:C.prompt)??r.generationPrompt??R.generationPrompt).trim();if(E){C!=null&&C.forceEnterImageMode&&n(),g(!0),r.setModeSession("image",_=>({..._,generationPrompt:E,generationStatus:{phase:"running",message:R.imageReferences.length>0?`正在准备并上传 ${R.imageReferences.length} 张参考图...`:"正在生成图片，请稍候...",updatedAt:new Date().toISOString()},lastImageStyleProfile:null,resultAssetId:null,resultType:null,resultPath:null,resultTitle:"",resultPreviewText:"",resultPreviewUrl:null,lastUpdatedAt:new Date().toISOString()}));try{const{result:_,references:Y,roleSummary:ae}=await C2({prompt:E,knowledgeRootPath:(K=i.info)==null?void 0:K.rootPath,documents:te,imageReferences:R.imageReferences,styleOptions:R.imageStyleOptions,generationMode:R.imageGenerationMode,activeStyleProfile:le,aspectRatio:"16:9",source:(C==null?void 0:C.source)||"GenerationPromptComposer.handleGenerateImage",debugContext:{currentMode:e,handlerName:"handleGenerateImage",note:"Dialog/workbench image generation uses shared structured-reference pipeline"},onStatus:Le=>{r.setModeSession("image",Ke=>({...Ke,generationStatus:{phase:"running",message:Le,updatedAt:new Date().toISOString()},lastUpdatedAt:new Date().toISOString()}))},onStyleProfileChange:Le=>{r.setModeSession("image",Ke=>({...Ke,lastImageStyleProfile:Le,lastUpdatedAt:new Date().toISOString()}))}});if(_.status!=="success"||!_.image_url){const Le=_.error||"图片生成失败";r.setModeSession("image",Ke=>({...Ke,generationStatus:{phase:"error",message:Le,updatedAt:new Date().toISOString()},lastUpdatedAt:new Date().toISOString()})),a(Le);return}const je=_.file_path||_.image_url;r.setModeSession("image",Le=>({...Le,generationPrompt:E,generationStatus:{phase:"completed",message:"图片已生成，可在右侧保存或直接打开。",updatedAt:new Date().toISOString()},resultType:"image",resultAssetId:je||null,resultPath:je||null,resultTitle:_.filename||Un(je||"")||"generated.png",resultPreviewUrl:as(_.image_url||je||""),lastUpdatedAt:new Date().toISOString()})),a(Y.length>0?`图片生成完成，参考链路：${ae.join(" / ")}`:"图片生成完成")}catch(_){const Y=_ instanceof Error?_.message:"图片生成失败";r.setModeSession("image",ae=>({...ae,generationStatus:{phase:"error",message:Y,updatedAt:new Date().toISOString()},lastUpdatedAt:new Date().toISOString()})),a(Y)}finally{g(!1)}}},Ee=async C=>{var _,Y,ae;if(h.current)return;if(!s){const je="请先打开工作区，再生成 PPT。";r.setGenerationStatus("error",je),a(je);return}const E=r.generationPrompt.trim();h.current=!0,x.current=!1;const K=new AbortController;k.current=K,v.current=`ppt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,g(!0),r.setGenerationStatus("running","正在分析已选素材内容..."),r.clearCurrentResult(),r.setModeSession("ppt",je=>({...je,pptTaskStatus:"generating_outline",pptLiveSlides:[],pptTotalSlides:0,pptActiveSlideIndex:0,pptStopRequested:!1,pptDeckDocumentId:null,pptDeckPath:null,pptActiveTemplateManifestId:null,pptContentPackageId:null,pptSourceType:"generated",pptOriginalFilePath:null,pptOriginalFileName:null,pptImportStatus:null,pptImportWarnings:[],pptPreviewSlides:[]}));try{const je=await Xp(o,E,D,r.primaryAssetId,J);if(x.current){r.setModeSession("ppt",ve=>({...ve,pptTaskStatus:"stopped"})),r.setGenerationStatus("completed","已停止");return}{const ve=Lg(J).paragraphs.join(`

`).trim(),ct=!!(C!=null&&C.fromManuscriptAutoSubmit)&&ve.length>200,Je=ct?"deckBuildFromManuscript":"deckBuildFromPrompt";console.log("[deck] build request",{sourceType:ct?"manuscript":"prompt",rawPromptPreview:E.slice(0,80),rawPromptLength:E.length,hasPrimarySource:!!J,primarySourceKind:(J==null?void 0:J.sourceKind)??null,manuscriptTextLength:ve.length,selectedBuilder:Je,fromManuscriptAutoSubmit:!!(C!=null&&C.fromManuscriptAutoSubmit)});const Ge=[E,je.primaryContentSummary?`

参考素材摘要：
${je.primaryContentSummary.slice(0,3e3)}`:"",je.evidenceSummary?`

知识库证据：
${je.evidenceSummary.slice(0,2e3)}`:""].join("").trim();r.setGenerationStatus("running","正在生成演示文稿内容 · 消耗 token"),r.setModeSession("ppt",Ae=>({...Ae,pptTaskStatus:"generating_deck"}));let ie=null;try{ct?ie=await window.electronAPI.deckBuildFromManuscript({sourceType:"manuscript",manuscriptContent:ve.slice(0,8e3),prompt:Ge,imageMode:"none",language:"zh",workspacePath:s,taskId:v.current}):ie=await window.electronAPI.deckBuildFromPrompt({sourceType:"prompt",prompt:Ge,imageMode:"none",language:"zh",workspacePath:s,taskId:v.current})}catch(Ae){console.warn("[deck] deckBuild failed (exception), falling back to legacy loop:",Ae)}if(x.current){r.setModeSession("ppt",Ae=>({...Ae,pptTaskStatus:"stopped"})),r.setGenerationStatus("completed","已停止");return}if(x.current){r.setModeSession("ppt",Ae=>({...Ae,pptTaskStatus:"stopped"})),r.setGenerationStatus("completed","已停止");return}if(ie!=null&&ie.success&&ie.deckDocumentId){const Ae=ie.deckDocumentId,De=((_=ie==null?void 0:ie.deck)==null?void 0:_.title)??"(unknown)";console.log("[deck] deckBuild succeeded:",{deckId:Ae,isManuscriptMode:ct,selectedBuilder:Je,title:De,rawPromptHash:E.slice(0,12)}),r.setGenerationStatus("running","应用模板中 · 不消耗 token"),r.setModeSession("ppt",qe=>({...qe,pptTaskStatus:"rendering_pptx"}));let Ne=null;try{Ne=await window.electronAPI.deckRender({workspacePath:s,deckId:Ae,manifestId:"business_report"})}catch(qe){console.warn("[deck] deckRender failed (exception), falling back to legacy loop:",qe)}if(Ne!=null&&Ne.success&&Ne.outputPath){const qe=Ne.outputPath,Oe=Ne.slideCount??0;console.log("[deck] deckRender succeeded:",{deckId:Ae,outputPath:qe,slideCount:Oe,llmCalls:Ne.llmCalls,imageCalls:Ne.imageCalls,tokenCost:Ne.tokenCost});let gt=[];try{const rt=await window.electronAPI.deckLoad({workspacePath:s,deckId:Ae});rt.success&&rt.deck&&(gt=(rt.deck.slides??[]).map((Ze,ut)=>({index:Ze.index??ut,type:TA(Ze.intent??"unknown"),title:Ze.title,subtitle:Ze.subtitle,heading:Ze.heading??Ze.title,body:Ze.body??Ze.summary,items:Ze.items,imagePath:Ze.imagePath??null,imageLoading:!1,isGenerating:!1,leftTitle:Ze.leftTitle,leftItems:Ze.leftItems,rightTitle:Ze.rightTitle,rightItems:Ze.rightItems,metrics:Ze.metrics,timeline:Ze.timeline,notes:Ze.speakerNotes??Ze.notes})))}catch{}try{const rt=`${s}/05_Presentation/decks/${Ae}/preview/business_report`,Qe=await window.electronAPI.deckPreview({pptxPath:qe,previewDir:rt.replace(/\//g,"\\")});if(Qe.success&&Qe.slides&&Qe.slides.length>0){console.log("[deck] pptxPreview succeeded:",Qe.slides.length,"slides");const Ze=new Map(Qe.slides.map(ut=>[ut.index,ut.imagePath]));gt=gt.map((ut,zt)=>({...ut,imagePath:Ze.get(zt)??ut.imagePath??null})),gt.length===0&&Qe.slides.length>0&&(gt=Qe.slides.map(ut=>({index:ut.index,type:"content",title:`第 ${ut.index+1} 页`,imagePath:ut.imagePath,imageLoading:!1,isGenerating:!1})))}else Qe.warning&&console.warn("[deck] pptxPreview warning:",Qe.warning)}catch(rt){console.warn("[deck] pptxPreview exception:",rt)}r.setGenerationStatus("completed",`PPT 已生成（${Oe} 页）· 模板：商务汇报`),r.setModeSession("ppt",rt=>({...rt,resultType:"pptx",resultAssetId:qe,resultPath:qe,resultTitle:Un(qe),resultPreviewText:"",pptContentPackageId:null,pptActiveSkillId:"business_report",pptTaskStatus:"completed",pptTotalSlides:Oe,pptDeckDocumentId:Ae,pptActiveTemplateManifestId:"business_report",pptLiveSlides:gt,pptActiveSlideIndex:0})),a(`PPT 已生成，${Oe} 页`);return}console.warn("[deck] deckRender failed, falling back to legacy loop:",Ne==null?void 0:Ne.error)}else console.warn("[deck] deckBuild failed, falling back to legacy loop:",ie==null?void 0:ie.error);if(x.current){r.setModeSession("ppt",Ae=>({...Ae,pptTaskStatus:"stopped"})),r.setGenerationStatus("completed","已停止");return}if(x.current){r.setModeSession("ppt",Ae=>({...Ae,pptTaskStatus:"stopped"})),r.setGenerationStatus("completed","已停止");return}r.setGenerationStatus("running","正在规划幻灯片结构..."),r.setModeSession("ppt",Ae=>({...Ae,pptTaskStatus:"generating_outline"}))}r.setGenerationStatus("running","生成大纲中 · 可能消耗 token");let Le="",Ke="";if(await pi({instruction:FA(je),language:"zh",taskId:v.current},{onDelta:(ve,ct)=>{Le=ct},onComplete:async ve=>{Le=ve.text},onError:ve=>{Ke=ve},onStatus:ve=>{r.setGenerationStatus("running",ve||"正在规划幻灯片结构...")}},K.signal),x.current){r.setModeSession("ppt",ve=>({...ve,pptTaskStatus:"stopped"})),r.setGenerationStatus("completed","已停止 · 大纲阶段");return}if(Ke&&Ke!=="已停止")throw new Error(Ke);if(!Le.trim())throw new Error("LLM 未返回幻灯片大纲内容，请重试。");let Be;try{const ve=Le.replace(/^```(?:json)?\s*/i,"").replace(/\s*```\s*$/i,"").trim(),ct=JSON.parse(ve);Be={title:String(ct.title||r.generationPrompt.slice(0,60)||"演示文稿"),slides:Array.isArray(ct.slides)?ct.slides.map((Je,Ge)=>({index:Ge,role:String(Je.intent||Je.role||Je.type||"text_content"),heading:String(Je.heading||Je.title||`第 ${Ge+1} 页`),hint:Je.hint?String(Je.hint):void 0})):[]}}catch{throw new Error("LLM 返回的幻灯片大纲不是合法 JSON，请重试。")}if(Be.slides.length===0)throw new Error("大纲为空，请重试。");const mt=Be.slides.map(ve=>({index:ve.index,type:ve.role,heading:ve.heading,isGenerating:!1,imageLoading:!1}));r.setModeSession("ppt",ve=>({...ve,pptLiveSlides:mt,pptTotalSlides:Be.slides.length,pptActiveSlideIndex:0,pptTaskStatus:"generating_slide"})),r.setGenerationStatus("running",`大纲已规划 ${Be.slides.length} 页，开始逐页生成内容...`);let He=null;try{const ve=await window.electronAPI.pptxSaveContentPackage({workspacePath:s,pkg:{title:Be.title,sourcePrompt:r.generationPrompt,slides:[],assets:[],outlinePlan:Be.slides,expectedSlideCount:Be.slides.length,status:"partial"}});ve.success&&(He=ve.packageId??null)}catch{}const dt=[];for(let ve=0;ve<Be.slides.length&&!x.current;ve++){const ct=Be.slides[ve];r.setModeSession("ppt",kt=>({...kt,pptLiveSlides:kt.pptLiveSlides.map((Wt,Vt)=>Vt===ve?{...Wt,isGenerating:!0}:Wt),pptActiveSlideIndex:ve})),r.setGenerationStatus("running",`生成内容中 · 可能消耗 token（第 ${ve+1}/${Be.slides.length} 页）`);let Je="";if(await pi({instruction:Zp(je,Be,ct),language:"zh",taskId:v.current},{onDelta:(kt,Wt)=>{Je=Wt},onComplete:async kt=>{Je=kt.text},onError:()=>{},onStatus:()=>{}},K.signal),x.current)break;let Ge={type:ct.role,heading:ct.heading};try{const kt=Je.replace(/^```(?:json)?\s*/i,"").replace(/\s*```\s*$/i,"").trim();kt&&(Ge=JSON.parse(kt))}catch{}const{theme:ie,templateId:Ae,color:De,font:Ne,style:qe,imagePath:Oe,x:gt,y:rt,w:Qe,h:Ze,master:ut,animation:zt,background:qt,layout:_t,pptxConfig:Xn,...ht}=Ge,bn=String(ht.intent||ht.type||ct.role||"text_content"),Zn={index:ve,type:bn,title:ht.title?String(ht.title):void 0,subtitle:ht.subtitle?String(ht.subtitle):void 0,heading:ht.heading?String(ht.heading):ct.heading,body:ht.body?String(ht.body):void 0,items:Array.isArray(ht.items)?ht.items.map(String):void 0,metrics:Array.isArray(ht.metrics)?ht.metrics.map(kt=>({value:String(kt.value??""),label:String(kt.label??""),detail:kt.detail?String(kt.detail):void 0})):void 0,timeline:Array.isArray(ht.timeline)?ht.timeline.map(kt=>({title:String(kt.title??""),detail:kt.detail?String(kt.detail):void 0})):void 0,leftTitle:ht.leftTitle?String(ht.leftTitle):void 0,leftItems:Array.isArray(ht.leftItems)?ht.leftItems.map(String):void 0,rightTitle:ht.rightTitle?String(ht.rightTitle):void 0,rightItems:Array.isArray(ht.rightItems)?ht.rightItems.map(String):void 0,imagePath:null,imageLoading:bn==="content",isGenerating:!1,notes:ht.notes?String(ht.notes):void 0};dt.push({slideData:{index:ve,...ht,type:bn},outlineIndex:ve}),r.setModeSession("ppt",kt=>({...kt,pptLiveSlides:kt.pptLiveSlides.map((Wt,Vt)=>Vt===ve?Zn:Wt)})),He&&window.electronAPI.pptxSaveContentPackage({workspacePath:s,pkg:{id:He,title:Be.title,sourcePrompt:r.generationPrompt,slides:dt.map(({slideData:kt})=>kt),assets:[],outlinePlan:Be.slides,status:"partial",expectedSlideCount:Be.slides.length,completedSlideCount:dt.length}}).catch(()=>{})}if(r.setModeSession("ppt",ve=>({...ve,pptLiveSlides:ve.pptLiveSlides.map(ct=>({...ct,isGenerating:!1}))})),x.current){He&&await window.electronAPI.pptxSaveContentPackage({workspacePath:s,pkg:{id:He,title:Be.title,sourcePrompt:r.generationPrompt,slides:dt.map(({slideData:ve})=>ve),assets:[],outlinePlan:Be.slides,status:"partial",expectedSlideCount:Be.slides.length,completedSlideCount:dt.length,stoppedAt:new Date().toISOString()}}).catch(()=>{}),r.setModeSession("ppt",ve=>({...ve,pptTaskStatus:"stopped",pptContentPackageId:He})),r.setGenerationStatus("completed",`已停止 · 已保留 ${dt.length} / ${Be.slides.length} 页`);return}const Xe=dt.filter(({slideData:ve})=>ve.type==="content"&&!ve.imagePath).map(({slideData:ve,outlineIndex:ct})=>({slide:ve,index:ct}));if(Xe.length>0){const ve=((ae=(Y=i.info)==null?void 0:Y.rootPath)==null?void 0:ae.replace(/[\\/]+$/g,""))||"",ct=i.documents,Je=D.filter(De=>De.sourceType==="image"),Ge=new Set;if(i.departmentId&&ve){r.setGenerationStatus("running","正在为幻灯片匹配知识库图片...");const De=await Promise.allSettled(Xe.map(({slide:qe})=>{const Oe=[String(qe.heading||""),String(qe.body||""),...Array.isArray(qe.items)?qe.items.map(String):[]].filter(Boolean).join(" ").slice(0,200);return window.electronAPI.previewKnowledgeTaskContext(o,{instruction:Oe,topK:4})}));let Ne=0;for(let qe=0;qe<De.length;qe++){const Oe=De[qe];if(Oe.status!=="fulfilled"||!Oe.value)continue;const gt=(Oe.value.retrievedHits||[]).filter(rt=>{const Qe=ct.find(Ze=>{var ut;return Ze.id===((ut=rt==null?void 0:rt.chunk)==null?void 0:ut.documentId)});return(Qe==null?void 0:Qe.sourceType)==="image"&&(rt.score??0)>=.6&&!Ge.has(Qe.id)}).sort((rt,Qe)=>(Qe.score??0)-(rt.score??0));if(gt.length>0){const rt=gt[0],Qe=ct.find(Ze=>{var ut;return Ze.id===((ut=rt==null?void 0:rt.chunk)==null?void 0:ut.documentId)});if(Qe!=null&&Qe.storedRelativePath){const Ze=`${ve}/${Qe.storedRelativePath.replace(/^[\\/]+/g,"")}`;Xe[qe].slide.imagePath=Ze,Ge.add(Qe.id),Ne++;const ut=Xe[qe].index;r.setModeSession("ppt",zt=>({...zt,pptLiveSlides:zt.pptLiveSlides.map((qt,_t)=>_t===ut?{...qt,imagePath:Ze,imageLoading:!1}:qt)}))}}}Ne>0&&r.setGenerationStatus("running",`已为 ${Ne} 页匹配知识库图片`)}const ie=Xe.filter(({slide:De})=>!De.imagePath);if(ie.length>0&&Je.length>0&&ve){const De=Je.filter(qe=>!Ge.has(qe.id));let Ne=0;for(const{slide:qe,index:Oe}of ie){if(Ne>=De.length)break;const gt=De[Ne],rt=`${ve}/${gt.storedRelativePath.replace(/^[\\/]+/g,"")}`;qe.imagePath=rt,Ge.add(gt.id),Ne++,r.setModeSession("ppt",Qe=>({...Qe,pptLiveSlides:Qe.pptLiveSlides.map((Ze,ut)=>ut===Oe?{...Ze,imagePath:rt,imageLoading:!1}:Ze)}))}}const Ae=Xe.filter(({slide:De})=>!De.imagePath);if(Ae.length>0){r.setModeSession("ppt",Ne=>({...Ne,pptTaskStatus:"generating_image"}));let De=0;for(let Ne=0;Ne<Ae.length;Ne++){if(x.current){r.setModeSession("ppt",rt=>({...rt,pptTaskStatus:"stopped"})),r.setGenerationStatus("completed",`已停止 · 已保留 ${dt.length} / ${Be.slides.length} 页`);break}const{slide:qe,index:Oe}=Ae[Ne];r.setGenerationStatus("running",`生成图片中 · 可能消耗 token（第 ${Ne+1}/${Ae.length} 张）`);const gt=[String(qe.heading||""),String(qe.body||""),...Array.isArray(qe.items)?qe.items.map(String):[]].filter(Boolean).join(", ");if(!gt.trim()){r.setModeSession("ppt",rt=>({...rt,pptLiveSlides:rt.pptLiveSlides.map((Qe,Ze)=>Ze===Oe?{...Qe,imageLoading:!1}:Qe)}));continue}try{const rt=await Lp(gt,"1:1");if(rt.status==="success"){const Qe=rt.file_path||rt.image_url||null;Qe?(qe.imagePath=Qe,De++,r.setModeSession("ppt",Ze=>({...Ze,pptLiveSlides:Ze.pptLiveSlides.map((ut,zt)=>zt===Oe?{...ut,imagePath:Qe,imageLoading:!1}:ut)}))):r.setModeSession("ppt",Ze=>({...Ze,pptLiveSlides:Ze.pptLiveSlides.map((ut,zt)=>zt===Oe?{...ut,imageLoading:!1}:ut)}))}else r.setModeSession("ppt",Qe=>({...Qe,pptLiveSlides:Qe.pptLiveSlides.map((Ze,ut)=>ut===Oe?{...Ze,imageLoading:!1}:Ze)}))}catch{r.setModeSession("ppt",rt=>({...rt,pptLiveSlides:rt.pptLiveSlides.map((Qe,Ze)=>Ze===Oe?{...Qe,imageLoading:!1}:Qe)}))}}De>0&&r.setGenerationStatus("running",`已完成 AI 插图生成（共 ${De} 张）`)}}if(x.current){r.setModeSession("ppt",ve=>({...ve,pptTaskStatus:"stopped",pptContentPackageId:He})),r.setGenerationStatus("completed",`已停止 · 已保留 ${dt.length} / ${Be.slides.length} 页`);return}r.setGenerationStatus("running","正在保存内容包...");const Re=dt.map(({slideData:ve,outlineIndex:ct})=>ve.imagePath?{slideIndex:ct,imagePath:String(ve.imagePath)}:null).filter(Boolean),tt=await window.electronAPI.pptxSaveContentPackage({workspacePath:s,pkg:{...He?{id:He}:{},title:Be.title,sourcePrompt:r.generationPrompt,slides:dt.map(({slideData:ve})=>ve),assets:Re}}),ue=tt.success?tt.packageId??He:He;r.setGenerationStatus("running","应用模板中 · 不消耗 token"),r.setModeSession("ppt",ve=>({...ve,pptTaskStatus:"rendering_pptx"}));const ze=`${Vd(r.generationPrompt,"演示文稿")}-${qd()}.pptx`,pe=`${`${s.replace(/[\\/]+$/g,"")}/05_Presentation`}/${ze}`;let ne;if(ue){const ve=await window.electronAPI.pptxRenderWithSkill({workspacePath:s,contentPackageId:ue,skillId:"cuhk_sz_default",outputPath:pe});ne={success:!!ve.success,outputPath:ve.outputPath||pe,slideCount:ve.slideCount||0,error:ve.error}}else ne=await window.electronAPI.generatePptx({plan:{title:Be.title,slides:dt.map(({slideData:ve})=>ve)},outputPath:pe});if(!ne.success)throw new Error(ne.error||"PPT 生成失败");let Ve=null;try{console.log("[deck] generate_deck_document_started",{slideCount:dt.length});const ve=dt.filter(({slideData:Ge})=>!!Ge.imagePath).map(({slideData:Ge,outlineIndex:ie})=>({slideIndex:ie,imagePath:String(Ge.imagePath)})),ct=Z2({outlineTitle:Be.title,completedSlides:dt.map(({slideData:Ge,outlineIndex:ie})=>({slideData:Ge,outlineIndex:ie})),outlinePlan:Be.slides,sourcePrompt:r.generationPrompt,imageAssets:ve}),Je=aA(ct);if(Je.warnings.length>0&&console.warn("[deck] deck_validation_warnings",Je.warnings),!Je.valid||!Je.deck)console.warn("[deck] deck_assemble_failed",{errors:Je.errors,fallback_to_legacy_pptx:!0});else{const Ge=Je.deck;console.log("[deck] generate_deck_document_completed",{deckId:Ge.deckId,slideCount:Ge.slides.length,assetCount:Ge.assets.length});const ie=await window.electronAPI.deckSave({workspacePath:s,deck:Ge});if(!ie.success)console.warn("[deck] deck_save_failed",{error:ie.error,fallback_to_legacy_pptx:!0});else{Ve=Ge.deckId,console.log("[deck] deck_render_started",{deckId:Ge.deckId,manifestId:"business_report"});const Ae=await window.electronAPI.deckRender({workspacePath:s,deckId:Ge.deckId,manifestId:"business_report"});Ae.success?console.log("[deck] deck_render_completed",{deckId:Ge.deckId,outputPath:Ae.outputPath,slideCount:Ae.slideCount,llmCalls:Ae.llmCalls,imageCalls:Ae.imageCalls,tokenCost:Ae.tokenCost}):console.warn("[deck] deck_render_failed",{error:Ae.error,fallback_to_legacy_pptx:!0})}}}catch(ve){console.warn("[deck] deck_assemble_failed (exception)",{error:ve instanceof Error?ve.message:String(ve),fallback_to_legacy_pptx:!0})}r.setGenerationStatus("completed",`PPT 已生成（${ne.slideCount} 页），可在右侧打开或下载。`),r.setModeSession("ppt",ve=>({...ve,resultType:"pptx",resultAssetId:ne.outputPath,resultPath:ne.outputPath,resultTitle:ze,resultPreviewText:JSON.stringify({title:Be.title,slides:Be.slides}),pptContentPackageId:ue,pptActiveSkillId:"business_report",pptTaskStatus:"completed",pptTotalSlides:dt.length,pptDeckDocumentId:Ve,pptActiveTemplateManifestId:Ve?"business_report":null})),a(`PPT 已生成：${ze}`)}catch(je){const Le=je instanceof Error?je.message:"PPT 生成失败";r.setGenerationStatus("error",Le),r.setModeSession("ppt",Ke=>({...Ke,pptTaskStatus:"failed"})),a(Le)}finally{k.current=null,h.current=!1,g(!1)}},G=async()=>{var K,_;if(h.current)return;if(!s){r.setGenerationStatus("error","请先打开工作区。");return}const C=r.sessions.ppt.pptContentPackageId;if(!C){r.setGenerationStatus("error","没有可继续的内容包，请重新生成。");return}h.current=!0,x.current=!1;const E=new AbortController;k.current=E,v.current=`ppt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,g(!0),r.setGenerationStatus("running","加载已保存内容包...");try{const Y=await window.electronAPI.pptxLoadContentPackage({workspacePath:s,packageId:C});if(!(Y!=null&&Y.success)||!Y.pkg)throw new Error("内容包加载失败，请重新生成。");const ae=Y.pkg;if(!ae.outlinePlan||ae.outlinePlan.length===0)throw new Error("内容包中没有大纲信息，无法继续生成。请重新生成。");const je={title:ae.title,slides:ae.outlinePlan},Le=Math.max(0,ae.completedSlideCount);if(Le>=je.slides.length){r.setModeSession("ppt",re=>({...re,pptResumeRequested:!1,pptIsResuming:!1,pptTaskStatus:"completed"}));return}const Ke=ae.slides.map((re,pe)=>{var ne;return{index:pe,type:String(re.type||"content"),title:re.title?String(re.title):void 0,subtitle:re.subtitle?String(re.subtitle):void 0,heading:re.heading?String(re.heading):((ne=je.slides[pe])==null?void 0:ne.heading)??"",body:re.body?String(re.body):void 0,items:Array.isArray(re.items)?re.items.map(String):void 0,metrics:Array.isArray(re.metrics)?re.metrics.map(Ve=>({value:String(Ve.value??""),label:String(Ve.label??""),detail:Ve.detail?String(Ve.detail):void 0})):void 0,timeline:Array.isArray(re.timeline)?re.timeline.map(Ve=>({title:String(Ve.title??""),detail:Ve.detail?String(Ve.detail):void 0})):void 0,leftTitle:re.leftTitle?String(re.leftTitle):void 0,leftItems:Array.isArray(re.leftItems)?re.leftItems.map(String):void 0,rightTitle:re.rightTitle?String(re.rightTitle):void 0,rightItems:Array.isArray(re.rightItems)?re.rightItems.map(String):void 0,imagePath:re.imagePath?String(re.imagePath):null,imageLoading:!1,isGenerating:!1,notes:re.notes?String(re.notes):void 0}}),Be=je.slides.slice(Le).map(re=>({index:re.index,type:re.role,heading:re.heading,isGenerating:!1,imageLoading:!1}));r.setModeSession("ppt",re=>({...re,pptTaskStatus:"generating_slide",pptLiveSlides:[...Ke,...Be],pptTotalSlides:je.slides.length,pptActiveSlideIndex:Le,pptStopRequested:!1,pptResumeRequested:!1,pptIsResuming:!0})),r.setGenerationStatus("running",`正在继续生成 · 从第 ${Le+1} 页开始...`);const mt=await Xp(o,ae.sourcePrompt||r.generationPrompt.trim(),D,r.primaryAssetId,J);if(x.current){r.setModeSession("ppt",re=>({...re,pptTaskStatus:"stopped",pptIsResuming:!1})),r.setGenerationStatus("completed","已停止");return}const He=ae.slides.map((re,pe)=>({slideData:{...re,index:pe},outlineIndex:pe}));for(let re=Le;re<je.slides.length&&!x.current;re++){const pe=je.slides[re];r.setModeSession("ppt",Oe=>({...Oe,pptLiveSlides:Oe.pptLiveSlides.map((gt,rt)=>rt===re?{...gt,isGenerating:!0}:gt),pptActiveSlideIndex:re})),r.setGenerationStatus("running",`正在继续生成 · 已生成 ${re} / ${je.slides.length} 页`);let ne="";if(await pi({instruction:Zp(mt,je,pe),language:"zh",taskId:v.current},{onDelta:(Oe,gt)=>{ne=gt},onComplete:async Oe=>{ne=Oe.text},onError:()=>{},onStatus:()=>{}},E.signal),x.current)break;let Ve={type:pe.role,heading:pe.heading};try{const Oe=ne.replace(/^```(?:json)?\s*/i,"").replace(/\s*```\s*$/i,"").trim();Oe&&(Ve=JSON.parse(Oe))}catch{}const{theme:ve,templateId:ct,color:Je,font:Ge,style:ie,imagePath:Ae,...De}=Ve,Ne=String(De.type||pe.role||"content"),qe={index:re,type:Ne,title:De.title?String(De.title):void 0,subtitle:De.subtitle?String(De.subtitle):void 0,heading:De.heading?String(De.heading):pe.heading,body:De.body?String(De.body):void 0,items:Array.isArray(De.items)?De.items.map(String):void 0,metrics:Array.isArray(De.metrics)?De.metrics.map(Oe=>({value:String(Oe.value??""),label:String(Oe.label??""),detail:Oe.detail?String(Oe.detail):void 0})):void 0,timeline:Array.isArray(De.timeline)?De.timeline.map(Oe=>({title:String(Oe.title??""),detail:Oe.detail?String(Oe.detail):void 0})):void 0,leftTitle:De.leftTitle?String(De.leftTitle):void 0,leftItems:Array.isArray(De.leftItems)?De.leftItems.map(String):void 0,rightTitle:De.rightTitle?String(De.rightTitle):void 0,rightItems:Array.isArray(De.rightItems)?De.rightItems.map(String):void 0,imagePath:null,imageLoading:Ne==="content",isGenerating:!1,notes:De.notes?String(De.notes):void 0};He.push({slideData:{index:re,...De,type:Ne},outlineIndex:re}),r.setModeSession("ppt",Oe=>({...Oe,pptLiveSlides:Oe.pptLiveSlides.map((gt,rt)=>rt===re?qe:gt)})),window.electronAPI.pptxSaveContentPackage({workspacePath:s,pkg:{id:C,title:je.title,sourcePrompt:ae.sourcePrompt||r.generationPrompt,slides:He.map(({slideData:Oe})=>Oe),assets:[],outlinePlan:je.slides,status:"partial",expectedSlideCount:je.slides.length,completedSlideCount:He.length}}).catch(()=>{})}if(r.setModeSession("ppt",re=>({...re,pptLiveSlides:re.pptLiveSlides.map(pe=>({...pe,isGenerating:!1}))})),x.current){await window.electronAPI.pptxSaveContentPackage({workspacePath:s,pkg:{id:C,title:je.title,sourcePrompt:ae.sourcePrompt||r.generationPrompt,slides:He.map(({slideData:re})=>re),assets:[],outlinePlan:je.slides,status:"partial",expectedSlideCount:je.slides.length,completedSlideCount:He.length,stoppedAt:new Date().toISOString()}}).catch(()=>{}),r.setModeSession("ppt",re=>({...re,pptTaskStatus:"stopped",pptIsResuming:!1,pptContentPackageId:C})),r.setGenerationStatus("completed",`已停止 · 已保留 ${He.length} / ${je.slides.length} 页`);return}const dt=He.filter(({slideData:re,outlineIndex:pe})=>pe>=Le&&re.type==="content"&&!re.imagePath).map(({slideData:re,outlineIndex:pe})=>({slide:re,index:pe}));if(dt.length>0){const re=((_=(K=i.info)==null?void 0:K.rootPath)==null?void 0:_.replace(/[\\/]+$/g,""))||"",pe=i.documents,ne=D.filter(Je=>Je.sourceType==="image"),Ve=new Set;if(i.departmentId&&re){r.setGenerationStatus("running","正在为新生成幻灯片匹配知识库图片...");const Je=await Promise.allSettled(dt.map(({slide:Ge})=>{const ie=[String(Ge.heading||""),String(Ge.body||""),...Array.isArray(Ge.items)?Ge.items.map(String):[]].filter(Boolean).join(" ").slice(0,200);return window.electronAPI.previewKnowledgeTaskContext(o,{instruction:ie,topK:4})}));for(let Ge=0;Ge<Je.length;Ge++){const ie=Je[Ge];if(ie.status!=="fulfilled"||!ie.value)continue;const Ae=(ie.value.retrievedHits||[]).filter(De=>{const Ne=pe.find(qe=>{var Oe;return qe.id===((Oe=De==null?void 0:De.chunk)==null?void 0:Oe.documentId)});return(Ne==null?void 0:Ne.sourceType)==="image"&&(De.score??0)>=.6&&!Ve.has(Ne.id)}).sort((De,Ne)=>(Ne.score??0)-(De.score??0));if(Ae.length>0){const De=Ae[0],Ne=pe.find(qe=>{var Oe;return qe.id===((Oe=De==null?void 0:De.chunk)==null?void 0:Oe.documentId)});if(Ne!=null&&Ne.storedRelativePath){const qe=`${re}/${Ne.storedRelativePath.replace(/^[\\/]+/g,"")}`;dt[Ge].slide.imagePath=qe,Ve.add(Ne.id);const Oe=dt[Ge].index;r.setModeSession("ppt",gt=>({...gt,pptLiveSlides:gt.pptLiveSlides.map((rt,Qe)=>Qe===Oe?{...rt,imagePath:qe,imageLoading:!1}:rt)}))}}}}const ve=dt.filter(({slide:Je})=>!Je.imagePath);if(ve.length>0&&ne.length>0&&re){const Je=ne.filter(ie=>!Ve.has(ie.id));let Ge=0;for(const{slide:ie,index:Ae}of ve){if(Ge>=Je.length)break;const De=Je[Ge],Ne=`${re}/${De.storedRelativePath.replace(/^[\\/]+/g,"")}`;ie.imagePath=Ne,Ve.add(De.id),Ge++,r.setModeSession("ppt",qe=>({...qe,pptLiveSlides:qe.pptLiveSlides.map((Oe,gt)=>gt===Ae?{...Oe,imagePath:Ne,imageLoading:!1}:Oe)}))}}const ct=dt.filter(({slide:Je})=>!Je.imagePath);if(ct.length>0){r.setModeSession("ppt",Je=>({...Je,pptTaskStatus:"generating_image"}));for(let Je=0;Je<ct.length&&!x.current;Je++){const{slide:Ge,index:ie}=ct[Je];r.setGenerationStatus("running",`生成图片中 · 可能消耗 token（第 ${Je+1}/${ct.length} 张）`);const Ae=[String(Ge.heading||""),String(Ge.body||""),...Array.isArray(Ge.items)?Ge.items.map(String):[]].filter(Boolean).join(", ");if(!Ae.trim()){r.setModeSession("ppt",De=>({...De,pptLiveSlides:De.pptLiveSlides.map((Ne,qe)=>qe===ie?{...Ne,imageLoading:!1}:Ne)}));continue}try{const De=await Lp(Ae,"1:1");if(De.status==="success"){const Ne=De.file_path||De.image_url||null;Ne?(Ge.imagePath=Ne,r.setModeSession("ppt",qe=>({...qe,pptLiveSlides:qe.pptLiveSlides.map((Oe,gt)=>gt===ie?{...Oe,imagePath:Ne,imageLoading:!1}:Oe)}))):r.setModeSession("ppt",qe=>({...qe,pptLiveSlides:qe.pptLiveSlides.map((Oe,gt)=>gt===ie?{...Oe,imageLoading:!1}:Oe)}))}else r.setModeSession("ppt",Ne=>({...Ne,pptLiveSlides:Ne.pptLiveSlides.map((qe,Oe)=>Oe===ie?{...qe,imageLoading:!1}:qe)}))}catch{r.setModeSession("ppt",De=>({...De,pptLiveSlides:De.pptLiveSlides.map((Ne,qe)=>qe===ie?{...Ne,imageLoading:!1}:Ne)}))}}}}if(x.current){r.setModeSession("ppt",re=>({...re,pptTaskStatus:"stopped",pptIsResuming:!1,pptContentPackageId:C})),r.setGenerationStatus("completed",`已停止 · 已保留 ${He.length} / ${je.slides.length} 页`);return}r.setGenerationStatus("running","正在保存内容包..."),r.setModeSession("ppt",re=>({...re,pptTaskStatus:"rendering_preview"}));const Xe=He.map(({slideData:re,outlineIndex:pe})=>re.imagePath?{slideIndex:pe,imagePath:String(re.imagePath)}:null).filter(Boolean);await window.electronAPI.pptxSaveContentPackage({workspacePath:s,pkg:{id:C,title:je.title,sourcePrompt:ae.sourcePrompt||r.generationPrompt,slides:He.map(({slideData:re})=>re),assets:Xe,outlinePlan:je.slides,status:"completed",expectedSlideCount:je.slides.length,completedSlideCount:He.length}}),r.setGenerationStatus("running","应用模板中 · 不消耗 token");const Re=r.sessions.ppt.pptActiveSkillId||"cuhk_sz_default",tt=`${Vd(je.title,"演示文稿")}-${qd()}.pptx`,ue=`${s.replace(/[\\/]+$/g,"")}/05_Presentation/${tt}`,ze=await window.electronAPI.pptxRenderWithSkill({workspacePath:s,contentPackageId:C,skillId:Re,outputPath:ue});if(!ze.success)throw new Error(ze.error||"渲染失败");r.setGenerationStatus("completed",`PPT 已生成（${ze.slideCount} 页），可在右侧打开或下载。`),r.setModeSession("ppt",re=>({...re,resultType:"pptx",resultAssetId:ze.outputPath||ue,resultPath:ze.outputPath||ue,resultTitle:tt,pptContentPackageId:C,pptActiveSkillId:Re,pptTaskStatus:"completed",pptTotalSlides:He.length,pptIsResuming:!1})),a(`PPT 已生成：${tt}`)}catch(Y){const ae=Y instanceof Error?Y.message:"PPT 继续生成失败";r.setGenerationStatus("error",ae),r.setModeSession("ppt",je=>({...je,pptTaskStatus:"failed",pptIsResuming:!1})),a(ae)}finally{k.current=null,h.current=!1,g(!1)}};c.useEffect(()=>{e==="ppt"&&T&&(h.current||G())},[e,T]),c.useEffect(()=>{if(e==="ppt"&&!(!Q||L)&&!h.current&&y.current!==Q){if(!r.generationPrompt.trim()){r.setModeSession("ppt",C=>({...C,pendingAutoSubmitToken:null,pendingAutoSubmitTargetAssetId:null}));return}ge&&!D.some(C=>C.id===ge)||(y.current=Q,r.setModeSession("ppt",C=>({...C,pendingAutoSubmitToken:null,pendingAutoSubmitTargetAssetId:null})),Ee({fromManuscriptAutoSubmit:!0}))}},[e,L,Ee,ge,Q,J,D,r]);const F=async()=>{if(!(!r.generationPrompt.trim()||L)){if(e==="image"||I2(r.generationPrompt)){await ye({prompt:r.generationPrompt.trim(),forceEnterImageMode:e!=="image",source:e==="image"?"GenerationPromptComposer.handleGenerateImage":`GenerationPromptComposer.handleSubmit.${e}.imageIntent`});return}if(e==="document"){await Z();return}if(e==="ppt"){await Ee();return}await Z()}},se=async C=>{b.current=!0;const E=P.current;P.current=null,z(!1),C&&a(C),await(E==null?void 0:E.stop().catch(()=>{}))},_e=async()=>{if(!(L&&!S)){if(S){await se("已停止语音输入");return}if(!j){a("当前环境不支持语音输入，请改用键盘输入");return}try{b.current=!1,I.current=r.generationPrompt,a("正在启动语音输入...");const C=await q2({onPartialText:E=>{const K=I.current,_=E?K.trim()?`${K}
${E.trim()}`:E.trim():K;r.setGenerationPrompt(_)},onFinalText:E=>{const K=I.current,_=E?K.trim()?`${K}
${E.trim()}`:E.trim():K;E&&(I.current=_),r.setGenerationPrompt(_)},onError:E=>{se(E||"语音输入失败，请稍后重试")},onStatusChange:E=>{a(E)}});P.current=C,z(!0),a("语音输入中，请说出您的需求")}catch(C){const E=C instanceof Error&&C.message.trim()?C.message.trim():"启动语音输入失败，请稍后重试";a(E),z(!1),P.current=null}}},de=C=>{C.key!=="Enter"||C.shiftKey||(C.preventDefault(),S&&se(),F())};return t.jsx(Lh,{"data-testid":"generation-prompt-composer",children:t.jsxs(Nh,{children:[t.jsx(lA,{value:r.generationPrompt,onChange:C=>r.setGenerationPrompt(C.target.value),onKeyDown:de,placeholder:e==="document"?Iy:$.composerPlaceholder,disabled:L}),w?t.jsx(gA,{children:w}):null,t.jsx(uA,{capabilities:me,sendLabel:`生成${$.label}`,sendDisabled:!r.generationPrompt.trim()||L,onSend:()=>{S&&se(),F()},leftActions:t.jsxs(t.Fragment,{children:[t.jsxs(Gl,{type:"button",onClick:()=>r.setGenerationPrompt(""),disabled:L||!r.generationPrompt,children:[t.jsx(Mn,{size:14})," 清空输入"]}),t.jsx(Gl,{type:"button",onClick:X,disabled:L||!Fe,children:"清空结果"})]}),rightActions:t.jsx(mA,{type:"button",$active:S,onClick:()=>{_e()},disabled:L&&!S,title:j?S?"停止语音输入":"开启语音输入":"当前环境不支持语音输入",children:t.jsx(Qx,{size:16})})}),t.jsxs(pA,{children:[t.jsx(fA,{$tone:L?"running":"idle",children:e==="image"?"图片生成":e==="ppt"?"PPT 生成":$.label}),t.jsx(Yp,{children:Ie}),t.jsx(Yp,{children:S?"语音输入中…":"Enter 发送，Shift+Enter 换行"}),e==="ppt"&&!1]})]})})}const LA=l.div`display:flex;flex-direction:column;height:100%;overflow-y:auto;padding:12px 16px 20px;background:#f6f8fb;`,NA=l.button`width:100%;padding:24px 16px;border:2px dashed #cbd5e1;border-radius:12px;background:#fff;color:#64748b;font-size:var(--font-size-sm);cursor:pointer;text-align:center;line-height:2;transition:border-color .2s,background .2s;&:hover{border-color:#2563eb;background:#eff6ff;color:#1d4ed8;}`,OA=l.div`display:flex;align-items:center;justify-content:space-between;border:1px solid #d1fae5;border-radius:8px;background:#f0fdf4;padding:8px 12px;font-size:var(--font-size-xs);color:#065f46;`,WA=l.span`font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;`,UA=l.button`border:1px solid #a7f3d0;border-radius:6px;background:#fff;color:#065f46;font-size:var(--font-size-xs);padding:3px 8px;cursor:pointer;flex-shrink:0;&:hover{background:#d1fae5;}`,HA=l.div`margin-top:10px;padding:14px 16px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;font-size:var(--font-size-sm);display:flex;align-items:center;gap:8px;`,KA=l.div`margin-top:10px;border-radius:10px;border:1px solid #dbe3ef;background:#fff;overflow:hidden;`,GA=l.div`padding:12px 14px 10px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;`,qA=l.div`display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#0f766e,#2563eb);color:#fff;border-radius:8px;padding:5px 12px;font-size:var(--font-size-sm);font-weight:700;`,VA=l.span`border-radius:999px;padding:2px 8px;font-size:var(--font-size-xs);font-weight:600;background:${e=>e.$level==="high"?"#d1fae5":e.$level==="mid"?"#fef9c3":"#fee2e2"};color:${e=>e.$level==="high"?"#065f46":e.$level==="mid"?"#854d0e":"#991b1b"};`,YA=l.div`padding:10px 14px;font-size:var(--font-size-xs);color:#475569;line-height:1.7;`,JA=l.div`padding:6px 14px 12px;display:flex;flex-wrap:wrap;gap:6px;`,XA=l.button`border:1px solid ${e=>e.$active?"#2563eb":"#dbe3ef"};border-radius:999px;background:${e=>e.$active?"#dbeafe":"#f8fafc"};color:${e=>e.$active?"#1d4ed8":"#475569"};font-size:var(--font-size-xs);font-weight:600;padding:3px 10px;cursor:pointer;`,Qp=l.div`margin-top:12px;`,ef=l.div`font-size:var(--font-size-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;`,Dr=l.label`font-size:var(--font-size-xs);color:#64748b;display:block;margin-bottom:3px;`,ZA=l.div`display:flex;flex-direction:column;gap:8px;`,Wa=l.div`display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;`,Ua=l.input`width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:var(--font-size-xs);outline:none;background:#fff;color:#1f2937;box-sizing:border-box;&:focus{border-color:#2563eb;}`,Oo=l.select`width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:var(--font-size-xs);outline:none;background:#fff;color:#1f2937;`,QA=l.button`margin-top:14px;width:100%;padding:12px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,#0f766e,#2563eb);color:#fff;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.02em;&:disabled{opacity:.5;cursor:not-allowed;}`,e4=l.div`display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;`,tf=l.span`display:inline-flex;align-items:center;border:1px solid #dbe3ef;border-radius:999px;background:#fff;padding:2px 8px;font-size:var(--font-size-xs);color:#475569;`;l.button`border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#1f2937;font-size:var(--font-size-xs);padding:6px 10px;cursor:pointer;`;const t4=l.div`margin-top:10px;padding:8px 12px;border-radius:8px;border:1px solid ${e=>e.$error?"#fecaca":"#e2e8f0"};background:${e=>e.$error?"#fef2f2":"#f8fafc"};color:${e=>e.$error?"#991b1b":"#64748b"};font-size:var(--font-size-xs);line-height:1.7;`;function n4(e){return eo(e)}function r4(e){return String(e||"").replace(/\.[^.]+$/,"").replace(/[^a-zA-Z0-9_-]+/g,"_").replace(/^_+|_+$/g,"")||`plot_${Date.now()}`}function i4(e){const n=String(e||"").match(/^data:[^;]+;base64,(.*)$/);return n?n[1]:String(e||"")}function o4(e){return(String(e||"").split(/[\\/]/).pop()||"plot").replace(/\.[^.]+$/,"")}function s4(e){return/\.(csv|json|xlsx|xls)$/i.test(String(e||""))}const a4=()=>{var ze,re;const{setStatusMessage:e}=Jn(),{activeWorkspacePath:n,refreshTree:r}=Ft(),i=kr(),[o,s]=c.useState("static"),[a,d]=c.useState(""),[u,f]=c.useState(null),[p,m]=c.useState([]),[g,h]=c.useState(null),[x,k]=c.useState(""),[v,y]=c.useState("smart"),[j,S]=c.useState("publication"),[z,P]=c.useState(""),[I,b]=c.useState(""),[$,O]=c.useState(""),[D,R]=c.useState(""),[V,te]=c.useState(""),[q,W]=c.useState(""),[fe,le]=c.useState(!1),[Q,ge]=c.useState("请选择数据文件后开始绘图。"),[J,H]=c.useState(!1),[T,w]=c.useState(!1),[L,N]=c.useState("line"),[M,A]=c.useState(""),[ee,me]=c.useState(""),[Ie,Fe]=c.useState(""),[Z,X]=c.useState(""),[ye,Ee]=c.useState(null),[G,F]=c.useState(`{
  "x": 1,
  "y": 2
}`),[se,_e]=c.useState(`[
  { "x": 1, "y": 2 },
  { "x": 2, "y": 3 },
  { "x": 3, "y": 5 }
]`),[de,oe]=c.useState(""),[Te,C]=c.useState(""),[E,K]=c.useState(!1);c.useEffect(()=>{Promise.all([up(),DC()]).then(([pe,ne])=>{f(pe),m(Array.isArray(ne.chart_types)?ne.chart_types:[]);const Ve=Array.isArray(ne.chart_types)&&ne.chart_types[0]?String(ne.chart_types[0].chart_type||""):"";!x&&Ve&&k(Ve),Ve&&L==="line"&&!p.length&&N(Ve)}).catch(pe=>{ge(pe instanceof Error?pe.message:String(pe))})},[]);const _=c.useMemo(()=>{const pe=p.map(Ve=>Ve.chart_type),ne=((g==null?void 0:g.recommendations)||[]).map(Ve=>Ve.chart_type);return Array.from(new Set([...ne,...pe])).filter(Boolean)},[p,g]),Y=async()=>{try{f(await up())}catch{}},ae=async()=>{const pe=await window.electronAPI.openFileDialog();if(pe){if(!s4(pe)){ge("当前支持 CSV、JSON、XLSX、XLS 数据文件。"),e("当前支持 CSV、JSON、XLSX、XLS 数据文件");return}d(pe),h(null),k(""),y("smart"),P(""),b(""),O(""),R(""),te(""),W(""),await Le(pe)}},je=pe=>{y("smart"),k(pe.chart_type);const ne=pe.suggested_parameters||{};P(typeof ne.x=="string"?ne.x:""),b(typeof ne.y=="string"?ne.y:""),O(typeof ne.hue=="string"?ne.hue:""),R(typeof ne.title=="string"?ne.title:""),te(typeof ne.xlabel=="string"?ne.xlabel:""),W(typeof ne.ylabel=="string"?ne.ylabel:"")},Le=async pe=>{const ne=pe||a;if(ne){H(!0),ge("正在分析数据并获取图表推荐..."),e("正在获取绘图推荐...");try{const Ve=await RC(ne,fe);h(Ve);const ve=(Ve.recommendations||[])[0];ve?je(ve):k(Ve.recommended_chart),ge(`推荐完成，首选图表为 ${Ve.recommended_chart}`),e(`绘图推荐完成: ${Ve.recommended_chart}`),await Y()}catch(Ve){const ve=Ve instanceof Error?Ve.message:String(Ve);ge(ve),e(`绘图推荐失败: ${ve}`)}finally{H(!1)}}},Ke=async(pe,ne,Ve)=>{if(n){const ve=await window.electronAPI.detectProjectStructure(n),ct=`${r4(Ve)}_${ne}_${Date.now()}.png`,Je=i4(pe),Ge=ve!=null&&ve.hasFigures?await window.electronAPI.saveImageToFiguresBase64(n,ct,Je):await window.electronAPI.saveImageToWorkspace(n,ct,Je);i.setGenerationResult({resultPreviewUrl:n4(Ge.path),resultPath:Ge.path,resultTitle:`${ne} 图表 — ${Ge.filename}`}),r().catch(()=>{}),ge("图表已生成并保存到工作区，可在主区点击「插入编辑器」插入文稿。"),e("图表已生成，可从主区插入编辑器")}else i.setGenerationResult({resultPreviewUrl:pe,resultPath:null,resultTitle:`${ne} 图表`}),ge("图表已生成，可在主区点击「插入编辑器」插入文稿。打开工作区后可保存。"),e("图表已生成，可从主区插入编辑器")},Be=async()=>{if(!(!a||!x)){w(!0),ge(`正在生成 ${x} 图表...`),e(`正在生成 ${x} 图表...`);try{const ne=await MC(a,x,{mode:v==="manual"&&(z||I||$)?"manual":"smart",x:z||void 0,y:I||void 0,hue:$||void 0,title:D||void 0,xlabel:V||void 0,ylabel:q||void 0,style:j});if(!ne.success||!ne.image)throw new Error(ne.message||"图表生成失败");await Ke(ne.image,ne.chart_type,o4(a)),await Y()}catch(pe){const ne=pe instanceof Error?pe.message:String(pe);ge(ne),e(`图表生成失败: ${ne}`)}finally{w(!1)}}},mt=pe=>pe>=.75?"high":pe>=.5?"mid":"low",He=pe=>({bar:"📊",barh:"📊",line:"📈",scatter:"🔵",pie:"🥧",heatmap:"🟥",box:"📦",histogram:"📉",violin:"🎻",area:"📐",volcano:"🌋",waterfall:"💧",errorbar:"±️",contour:"〰️",streamplot:"🌊",polar:"🔄",radar:"🕸️",circular_bar:"⭕",wind_rose:"💨",smith:"📡",hexbin:"🔶",pareto:"📏",parallel_coords:"⟶",trellis:"🔲",scatter_3d:"🔵",surface_3d:"🏔️",bubble_3d:"🫧",network:"🕸️",wordcloud:"☁️",venn:"🔵",candlestick:"🕯️",treemap:"🗂️",funnel:"🔻",sankey:"↔️",gauge:"⏱️",bullet:"🎯",rose:"🌹",sunburst:"🌞",chord:"🎵",calendar_heatmap:"📅"})[pe.toLowerCase()]||"📊",dt=a?a.split(/[\\/]/).pop()||a:"",Xe=!a&&!J,Re=J,tt=!!g&&!J,ue=/失败|错误|异常|未找到|不能为空|HTTP/i.test(Q);return t.jsxs(LA,{children:[Xe?t.jsxs(NA,{onClick:()=>void ae(),children:[t.jsx("div",{style:{fontSize:28,marginBottom:4},children:"📂"}),t.jsx("div",{style:{fontWeight:600,color:"#334155"},children:"点击上传数据文件"}),t.jsx("div",{style:{fontSize:14,marginTop:4},children:"支持 CSV · XLSX · XLS · JSON"})]}):t.jsxs(OA,{children:[t.jsx("span",{style:{fontSize:16},children:"📄"}),t.jsx(WA,{title:a,children:dt}),t.jsx(UA,{onClick:()=>void ae(),children:"更换文件"})]}),Re?t.jsxs(HA,{children:[t.jsx("span",{style:{fontSize:18},children:"⏳"}),t.jsx("span",{children:"AI 正在分析数据结构，推荐最优绘图方案..."})]}):null,tt&&g?(()=>{const pe=g.recommendations||[],ne=pe[0],Ve=pe.slice(1);return t.jsxs(KA,{children:[ne?t.jsxs(GA,{children:[t.jsxs(qA,{children:[t.jsx("span",{children:He(ne.chart_type)}),t.jsx("span",{children:ne.chart_type})]}),t.jsxs(VA,{$level:mt(ne.confidence),children:["置信度 ",(ne.confidence*100).toFixed(0),"%"]})]}):null,ne!=null&&ne.reasoning?t.jsx(YA,{children:ne.reasoning}):null,Ve.length>0?t.jsxs(JA,{children:[t.jsx("span",{style:{fontSize:14,color:"#94a3b8",marginRight:4},children:"备选:"}),Ve.map(ve=>t.jsxs(XA,{$active:x===ve.chart_type,onClick:()=>je(ve),children:[He(ve.chart_type)," ",ve.chart_type]},ve.chart_type))]}):null]})})():null,tt||a&&!Re?t.jsxs(Qp,{children:[t.jsx(ef,{children:"图表设置"}),t.jsxs(ZA,{children:[t.jsxs("div",{children:[t.jsx(Dr,{children:"图表标题"}),t.jsx(Ua,{value:D,onChange:pe=>R(pe.target.value),placeholder:"留空由 AI 自动设定"})]}),t.jsxs(Wa,{children:[t.jsxs("div",{children:[t.jsx(Dr,{children:"X 轴标签"}),t.jsx(Ua,{value:V,onChange:pe=>te(pe.target.value),placeholder:"自动"})]}),t.jsxs("div",{children:[t.jsx(Dr,{children:"Y 轴标签"}),t.jsx(Ua,{value:q,onChange:pe=>W(pe.target.value),placeholder:"自动"})]})]}),t.jsxs(Wa,{children:[t.jsxs("div",{children:[t.jsx(Dr,{children:"图表风格"}),t.jsxs(Oo,{value:j,onChange:pe=>S(pe.target.value),children:[t.jsx("option",{value:"publication",children:"发布级 (publication)"}),t.jsx("option",{value:"default",children:"默认 (default)"}),t.jsx("option",{value:"colorful",children:"彩色 (colorful)"})]})]}),tt?null:t.jsxs("div",{children:[t.jsx(Dr,{children:"图表类型"}),t.jsxs(Oo,{value:x,onChange:pe=>k(pe.target.value),children:[t.jsx("option",{value:"",children:"请选择"}),_.map(pe=>t.jsx("option",{value:pe,children:pe},pe))]})]})]})]})]}):null,tt&&((re=(ze=g==null?void 0:g.data_analysis)==null?void 0:ze.columns)!=null&&re.length)?t.jsxs(Qp,{children:[t.jsx(ef,{children:"字段映射（高级）"}),t.jsxs(Wa,{children:[t.jsxs("div",{children:[t.jsx(Dr,{children:"X 字段"}),t.jsxs(Oo,{value:z,onChange:pe=>{y("manual"),P(pe.target.value)},children:[t.jsx("option",{value:"",children:"智能推断"}),(g.data_analysis.columns||[]).map(pe=>t.jsx("option",{value:pe,children:pe},pe))]})]}),t.jsxs("div",{children:[t.jsx(Dr,{children:"Y 字段"}),t.jsxs(Oo,{value:I,onChange:pe=>{y("manual"),b(pe.target.value)},children:[t.jsx("option",{value:"",children:"智能推断"}),(g.data_analysis.columns||[]).map(pe=>t.jsx("option",{value:pe,children:pe},pe))]})]})]}),t.jsxs(e4,{children:[(g.data_analysis.numeric_columns||[]).map(pe=>t.jsxs(tf,{children:["数值: ",pe]},`n_${pe}`)),(g.data_analysis.categorical_columns||[]).map(pe=>t.jsxs(tf,{children:["分类: ",pe]},`cat_${pe}`))]})]}):null,tt||a&&!Re?t.jsx(QA,{onClick:()=>void Be(),disabled:!a||!x||T,children:T?"⏳ 生成中...":"🎨 生成图表"}):null,t.jsxs(t4,{$error:ue,children:[t.jsx("div",{children:Q}),u?t.jsxs("div",{children:["Plot Agent: ",u.ready?"✅ ready":u.running?"🔄 starting":"⏸ idle"]}):null,u!=null&&u.lastError?t.jsxs("div",{children:["错误: ",u.lastError]}):null]})]})},l4=l.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`,c4=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  padding-left: ${e=>10+(e.$depth??0)*18}px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  background: ${e=>e.$selected?"#eef4ff":"transparent"};

  &:hover {
    background: ${e=>e.$selected?"#e4edff":"#f0f4fa"};
  }
`,d4=l.div`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1.5px solid ${e=>e.$checked?"#1a56db":"#b0bec5"};
  border-radius: 3px;
  background: ${e=>e.$checked?"#1a56db":"#ffffff"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
`,nf=l.span`
  flex: 1;
  font-size: var(--font-size-sm);
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;l.span`
  font-size: var(--font-size-xs);
  color: #708396;
  flex-shrink: 0;
`;const rf=l.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #708396;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;

  &:hover {
    background: #e4ecf5;
    color: #304255;
  }
`,u4=l.div`
  margin-left: ${e=>24+(e.$depth??0)*18}px;
  padding-left: 10px;
  border-left: 2px solid #e4ecf5;
  margin-bottom: 4px;
`,p4=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  font-size: var(--font-size-xs);
  color: ${e=>e.$active?"#1a56db":"#304255"};
  background: ${e=>e.$active?"#eef4ff":"transparent"};
  cursor: ${e=>e.$clickable?"pointer":"default"};
  border-radius: 4px;

  &:hover {
    background: ${e=>e.$clickable?e.$active?"#e4edff":"#f0f4fa":"transparent"};
  }
`,f4=l.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`,of=l.div`
  padding: 4px 8px;
  font-size: var(--font-size-xs);
  color: #94a3b8;
`;function m4(e){const n=(e.split(".").pop()||"").toLowerCase();return["png","jpg","jpeg","gif","webp","svg","bmp"].includes(n)?t.jsx(Km,{size:12,color:"#708396"}):t.jsx(xn,{size:12,color:"#708396"})}const Oc=e=>{const n=Ii(),r=e.departments??n.departments,i=e.selectedDepartmentId??n.selectedDepartmentId,o=e.onSelectDepartment??n.selectDepartment,[s,a]=c.useState(new Set),[d,u]=c.useState({}),f=c.useRef(i);c.useEffect(()=>{if(!e.onFileClick)return;const S=f.current;f.current=i,i&&i!==S?(a(z=>{if(z.has(i))return z;const P=new Set(z);return P.add(i),P}),d[i]||(u(z=>({...z,[i]:{docs:[],loading:!0}})),window.electronAPI.listKnowledgeDocuments(i).then(z=>u(P=>({...P,[i]:{docs:z,loading:!1}}))).catch(()=>u(z=>({...z,[i]:{docs:[],loading:!1}}))))):!i&&S&&a(z=>{if(!z.has(S))return z;const P=new Set(z);return P.delete(S),P})},[i,e.onFileClick,d]);const p=c.useCallback(S=>{o(i===S?"":S)},[o,i]),m=c.useCallback(async S=>{if(a(z=>{const P=new Set(z);return P.has(S)?P.delete(S):P.add(S),P}),!d[S]&&!s.has(S)){u(z=>({...z,[S]:{docs:[],loading:!0}}));try{const z=await window.electronAPI.listKnowledgeDocuments(S);u(P=>({...P,[S]:{docs:z,loading:!1}}))}catch{u(z=>({...z,[S]:{docs:[],loading:!1}}))}}},[d,s]),g=Ct.useMemo(()=>{const S=new Map;for(const z of r){const P=z.parentId||"",I=S.get(P)||[];I.push(z),S.set(P,I)}return S},[r]),h=c.useCallback(S=>(g.get(S)||[]).length>0,[g]),[x,k]=c.useState(new Set),v=c.useCallback(S=>{k(z=>{const P=new Set(z);return P.has(S)?P.delete(S):P.add(S),P})},[]),y=c.useCallback((S,z)=>{const P=S.id===i,I=s.has(S.id),b=d[S.id],$=h(S.id),O=x.has(S.id),D=g.get(S.id)||[];return t.jsxs(Ct.Fragment,{children:[t.jsx(c4,{$selected:P,$depth:z,children:$?t.jsxs(t.Fragment,{children:[t.jsx(rf,{type:"button",onClick:R=>{R.stopPropagation(),v(S.id)},title:O?"展开分组":"收起分组",children:O?t.jsx(qn,{size:13}):t.jsx(so,{size:13})}),t.jsx(nf,{onClick:()=>v(S.id),style:{fontWeight:600},children:S.name})]}):t.jsxs(t.Fragment,{children:[t.jsx(d4,{$checked:P,onClick:()=>p(S.id),children:P&&t.jsx(ao,{size:11,color:"#ffffff",strokeWidth:3})}),t.jsx(nf,{onClick:()=>p(S.id),children:S.name}),t.jsx(rf,{type:"button",onClick:R=>{R.stopPropagation(),m(S.id)},title:I?"收起文件列表":"展开文件列表",children:I?t.jsx(so,{size:13}):t.jsx(qn,{size:13})})]})}),!$&&I&&t.jsx(u4,{$depth:z,children:b!=null&&b.loading?t.jsx(of,{children:"加载中..."}):!b||b.docs.length===0?t.jsx(of,{children:"暂无文档"}):b.docs.map(R=>t.jsxs(p4,{$clickable:!!e.onFileClick,$active:e.activeFileId===R.id,onClick:e.onFileClick?()=>e.onFileClick(S.id,R.id):void 0,children:[m4(R.title||R.originalName||""),t.jsx(f4,{title:R.title||R.originalName,children:R.title||R.originalName||R.id})]},R.id))}),$&&!O&&D.map(R=>y(R,z+1))]},S.id)},[i,s,d,h,x,g,v,p,m,e.onFileClick,e.activeFileId]),j=Ct.useMemo(()=>r.filter(S=>!S.parentId),[r]);return t.jsx(l4,{children:j.map(S=>y(S,0))})};function sf(e){return String(e||"").replace(/\.docx$/i,"").trim()}async function af(e){var r,i;const n=await window.electronAPI.materializeKnowledgeWorkspace(e.departmentId,{workspaceName:sf(e.workspaceName||e.fileName||""),fileName:sf(e.fileName||e.workspaceName||""),documentId:e.documentId,versionId:e.versionId,sourceDocumentIds:e.sourceDocumentIds,content:e.content});return await e.openWorkspace(n.workspacePath),await((r=e.refreshTree)==null?void 0:r.call(e)),await e.openDocumentPath(n.documentPath,{isInternalOpen:!0}),(i=e.setStatusMessage)==null||i.call(e,`已新建文章工作区：${n.name}`),n}l.div`
  height: ${({$expanded:e})=>e?"460px":"148px"};
  flex-shrink: 0;
  border-top: 1px solid #dce5ef;
  background: linear-gradient(180deg, #f9fbfe 0%, #f3f7fc 100%);
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: height 0.22s cubic-bezier(0.4, 0, 0.2, 1);
`;l.div`
  padding: 10px 16px 8px;
  border-bottom: 1px solid #dce5ef;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255, 255, 255, 0.7);
`;l.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`;l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #1e3a5f;
`;l.div`
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: #607487;
`;l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
`;l.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  background: ${({$tone:e})=>e==="accent"?"#eaf4ff":e==="warn"?"#fff7e5":"#f5f8fb"};
  border: 1px solid ${({$tone:e})=>e==="accent"?"#b9d4f0":e==="warn"?"#edd4a6":"#dce5ef"};
  color: ${({$tone:e})=>e==="accent"?"#1e5a92":e==="warn"?"#8a5f1f":"#607487"};
`;l.button`
  min-width: 72px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #4b6278;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f4f8fc;
  }
`;l.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;const g4=l.div`
  padding: 0 16px 8px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #dce5ef;
`,lf=l.button`
  min-height: 28px;
  border-radius: 999px;
  border: 1px solid ${({$active:e})=>e?"#7aa8dc":"#d6e0ea"};
  background: ${({$active:e})=>e?"#eaf3ff":"#ffffff"};
  color: ${({$active:e})=>e?"#1e5a92":"#607487"};
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 0 12px;
  cursor: pointer;
  transition: all 0.15s;
`;l.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;

  @media (max-width: 1320px) {
    grid-template-columns: 1fr 300px;
  }
`;l.div`
  min-width: 0;
  min-height: 0;
  border-right: 1px solid #dce5ef;
  display: flex;
  flex-direction: column;
`;l.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 16px;
  display: grid;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 7px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(110, 140, 175, 0.4);
    border-radius: 999px;
  }
`;l.div`
  max-width: min(760px, 90%);
  justify-self: ${({$role:e})=>e==="user"?"end":"start"};
  border-radius: 14px;
  padding: 10px 14px;
  background: ${({$role:e})=>e==="user"?"linear-gradient(180deg, #4a8cd6 0%, #3570b8 100%)":e==="assistant"?"#ffffff":"#fff8ed"};
  color: ${({$role:e})=>e==="user"?"#ffffff":e==="assistant"?"#2c3e50":"#8a5f1f"};
  border: 1px solid ${({$role:e})=>e==="assistant"?"#dce5ef":e==="system"?"#edd4a6":"transparent"};
  box-shadow: ${({$role:e})=>e==="assistant"?"0 4px 16px rgba(30, 58, 95, 0.06)":"none"};
  font-size: var(--font-size-xs);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
`;l.div`
  min-width: 0;
  min-height: 0;
  padding: 10px 14px;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 8px;
  overflow-y: auto;
`;l.div`
  padding: 12px 20px 14px;
  display: grid;
  gap: 8px;
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.96) 0%, rgba(240, 246, 253, 0.94) 100%);
`;l.div`
  position: relative;
  min-width: 0;
`;l.div`
  position: relative;
  min-width: 0;
  border: 1px solid #d6e0ea;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 16px rgba(30, 58, 95, 0.06);
  padding: 12px 16px 10px;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus-within {
    border-color: #7aa8dc;
    box-shadow: 0 4px 20px rgba(74, 140, 214, 0.12);
  }
`;l.textarea`
  width: 100%;
  min-height: 44px;
  max-height: 80px;
  resize: none;
  border: none;
  background: transparent;
  color: #304255;
  padding: 0;
  font-size: 14px;
  line-height: 1.55;
  outline: none;

  &::placeholder {
    color: #a0aebc;
  }

  &:focus {
    box-shadow: none;
  }
`;l.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
`;l.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;l.button`
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid ${({$active:e})=>e?"#d98b52":"#d6e0ea"};
  background: ${({$active:e})=>e?"#fff1e7":"#ffffff"};
  color: ${({$active:e})=>e?"#b85b18":"#607487"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${({$active:e})=>e?"0 0 0 4px rgba(217, 139, 82, 0.12)":"none"};
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({$active:e})=>e?"#ffe7d7":"#f4f8fc"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;l.button`
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #30343d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f0f2f6;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;l.button`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid ${({$stop:e})=>e?"#d9ba77":"#7aa8dc"};
  background: ${({$stop:e})=>e?"#fff7e5":"linear-gradient(180deg, #6ba3e0 0%, #4a8cd6 100%)"};
  color: ${({$stop:e})=>e?"#8a601f":"#ffffff"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({$stop:e})=>e?"none":"0 4px 12px rgba(74, 140, 214, 0.2)"};
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;l.div`
  border-radius: 10px;
  border: 1px solid #dce5ef;
  background: rgba(255, 255, 255, 0.88);
  padding: 8px 12px;
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: #4b6278;
`;l.div`
  border-radius: 10px;
  border: 1px solid #dce5ef;
  background: rgba(255, 255, 255, 0.74);
  padding: 8px 12px;
  display: grid;
  gap: 4px;
`;l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #1e3a5f;
`;l.div`
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: #607487;
`;l.div`
  border-radius: 10px;
  border: 1px solid #dce5ef;
  background: rgba(255, 255, 255, 0.82);
  padding: 10px;
  display: grid;
  gap: 8px;
`;l.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
`;l.div`
  display: grid;
  gap: 6px;
`;l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #3d5b78;
`;l.select`
  width: 100%;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #304255;
  padding: 0 10px;
  font-size: var(--font-size-xs);
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #7aa8dc;
    box-shadow: 0 0 0 3px rgba(74, 140, 214, 0.1);
  }
`;l.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
`;l.input`
  width: 100%;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #304255;
  padding: 0 10px;
  font-size: var(--font-size-xs);
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #7aa8dc;
    box-shadow: 0 0 0 3px rgba(74, 140, 214, 0.1);
  }
`;l.button`
  min-width: 72px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #4b6278;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #f4f8fc;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;l.div`
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: #8a9caf;
`;l.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;l.button`
  min-height: 32px;
  border-radius: 8px;
  padding: 0 10px;
  border: 1px solid ${({$active:e})=>e?"#7aa8dc":"#d6e0ea"};
  background: ${({$active:e})=>e?"#eaf3ff":"#ffffff"};
  color: ${({$active:e})=>e?"#1e5a92":"#607487"};
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({$active:e})=>e?"#e0edff":"#f4f8fc"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;l.textarea`
  width: 100%;
  min-height: 80px;
  resize: none;
  border-radius: 10px;
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #304255;
  padding: 10px 12px;
  font-size: var(--font-size-sm);
  line-height: 1.65;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #7aa8dc;
    box-shadow: 0 0 0 3px rgba(74, 140, 214, 0.1);
  }
`;l.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;l.button`
  min-width: 100px;
  height: 36px;
  border-radius: 8px;
  padding: 0 14px;
  border: 1px solid ${e=>e.$primary?"#2f6fb0":e.$warn?"#e3b55f":"#d6e0ea"};
  background: ${e=>e.$primary?"linear-gradient(180deg, #4a8cd6 0%, #3570b8 100%)":e.$warn?"#fff7e5":"#ffffff"};
  color: ${e=>e.$primary?"#ffffff":e.$warn?"#8a601f":"#4b6278"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;function h4({mode:e,testId:n}){const r=Sc(e),i=e==="email"?"草稿生成、预回复与发送请在上方面板中完成；此处不提供独立提交，避免与文稿写作通道混淆。":"题目提取与逐题解答请在上传区与主列表中完成；此处不提供独立提交，避免与文稿写作通道混淆。";return t.jsx(Lh,{"data-testid":n,children:t.jsxs(Nh,{children:[t.jsx(hA,{children:r.label}),t.jsxs(xA,{children:[r.description," ",i]})]})})}function x4(){const[e,n]=c.useState("ai-image");return t.jsxs(t.Fragment,{children:[t.jsxs(g4,{children:[t.jsx(lf,{$active:e==="ai-image",onClick:()=>n("ai-image"),children:"AI 生图"}),t.jsx(lf,{$active:e==="data-plot",onClick:()=>n("data-plot"),children:"数据绘图"})]}),e==="ai-image"?t.jsx(Wh,{}):t.jsx(a4,{})]})}const b4=()=>{const{mode:e,generationMode:n}=Cn(),[r,i]=c.useState({});if(e!=="generation"||n==="document"||n==="daily-report"||n==="data"||n==="model"||n==="email")return null;const o=r[n]??!1,s=u=>{i(f=>({...f,[n]:u}))},a=n==="image"?"图片生成":n==="ppt"?"PPT 生成":n==="homework"?"作业解答":"生成";if(o)return t.jsxs(wA,{onClick:()=>s(!1),children:[t.jsxs(SA,{children:["✨ ",a]}),t.jsx(kA,{children:"展开 ↑"})]});const d=n==="homework"?t.jsx(h4,{mode:"homework",testId:"homework-hint-dock"}):n==="image"?t.jsx(x4,{}):t.jsx(Wh,{});return t.jsxs("div",{children:[t.jsxs(bA,{children:[t.jsx(yA,{children:a}),t.jsx(vA,{type:"button",onClick:()=>s(!0),children:"收起 ↓"})]}),d]})},y4={admin:["admin.panel.view","chat.audit.view_tenant","work_report.view_tenant_summary","work_report.view_department_summary","work_report.view_subordinate_summary","chat.view_own","chat.create_room","chat.send_message"],super_admin:["admin.panel.view","chat.audit.view_tenant","work_report.view_tenant_summary","work_report.view_department_summary","work_report.view_subordinate_summary","chat.view_own","chat.create_room","chat.send_message"],system_admin:["admin.panel.view","chat.audit.view_tenant","work_report.view_tenant_summary","work_report.view_department_summary","work_report.view_subordinate_summary","chat.view_own","chat.create_room","chat.send_message"],user:["chat.view_own","chat.create_room","chat.send_message"]};function v4(e,n){if(n&&n.length>0)return n;const r=new Set;for(const i of e)for(const o of y4[i]??[])r.add(o);return Array.from(r)}function w4(e){const n=go();return n?v4(n.user.roles,n.user.permissions).includes(e):!1}function S4(e){return`${pn()}${e}`}function k4(e){return String((e==null?void 0:e.method)??"GET").toUpperCase()}function j4(e){if(typeof(e==null?void 0:e.body)=="string")try{return JSON.parse(e.body)}catch{return e.body}}async function Ti(e,n,r){const i=S4(e),o=k4(r),s=j4(r);let a;try{a=await fetch(i,{...r,headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`,...(r==null?void 0:r.headers)??{}}})}catch(d){throw console.error("[chat] fetch error",d),console.error("[chat] start conversation failed",{url:i,method:o,payload:s,status:void 0,error:d}),new Error("无法连接聊天服务，请检查 AccountCenter Chat 服务是否已启动")}if(!a.ok){const d=await a.json().catch(()=>({})),u=d.error??d.message??`HTTP ${a.status}`;throw console.error("[chat] start conversation failed",{url:i,method:o,payload:s,status:a.status,error:u}),new Error(u)}return a.json()}function Wo(e){return!e||e.trim()===""?"":e.startsWith("http://")||e.startsWith("https://")?e:e.startsWith("/")?`${pn()}${e}`:e}function Uh(e){return Ti("/api/chat/conversations",e)}function Hh(e,n){return Ti("/api/chat/conversations",e,{method:"POST",body:JSON.stringify(n)})}async function I4(e,n){await Ti(`/api/chat/conversations/${n}/hide`,e,{method:"POST"})}function $4(e,n){return Ti(`/api/chat/conversations/${n}/dissolve`,e,{method:"POST"})}function T4(e,n){return e.find(r=>r.conversation_type!=="direct"?!1:(r.members??[]).some(i=>n.targetUserId&&i.userId===n.targetUserId?!0:!!(n.targetUsername&&i.username===n.targetUsername)))??null}async function Vl(e,n){const r=await Uh(e),i=T4(r,n);return i||Hh(e,{conversationType:"direct",memberIds:[n.targetUserId]})}function C4(e,n,r){return Ti(`/api/chat/conversations/${n}/messages`,e).then(o=>o.map(Wc))}function P4(e,n,r,i="text"){return Ti(`/api/chat/conversations/${n}/messages`,e,{method:"POST",body:JSON.stringify({body:r,message_type:i})}).then(Wc)}function Wc(e){const n=e??{},r=n.createdAt??n.created_at??n.timestamp??n.time??n.date,i=r!=null&&String(r).trim()!==""?String(r):"";let o;if(n.attachment&&typeof n.attachment=="object"){const d=n.attachment,u=String(d.id??""),f=d.previewUrl??d.preview_url,p=d.downloadUrl??d.download_url,m=f!=null&&String(f).trim()!==""?Wo(String(f)):u?`${pn()}/api/chat/attachments/${u}/preview`:void 0,g=p!=null&&String(p).trim()!==""?Wo(String(p)):u?`${pn()}/api/chat/attachments/${u}/download`:"";o={id:u,fileName:String(d.fileName??d.file_name??""),mimeType:String(d.mimeType??d.mime_type??"application/octet-stream"),sizeBytes:Number(d.sizeBytes??d.size_bytes??0),previewUrl:m,downloadUrl:g}}else if(n.file_name||n.fileName){const d=String(n.attachment_id??n.attachmentId??n.id??""),u=n.previewUrl??n.preview_url,f=n.downloadUrl??n.download_url,p=u!=null&&String(u).trim()!==""?Wo(String(u)):d?`${pn()}/api/chat/attachments/${d}/preview`:void 0,m=f!=null&&String(f).trim()!==""?Wo(String(f)):d?`${pn()}/api/chat/attachments/${d}/download`:"";o={id:d,fileName:String(n.file_name??n.fileName??""),mimeType:String(n.mime_type??n.mimeType??"application/octet-stream"),sizeBytes:Number(n.size_bytes??n.sizeBytes??0),previewUrl:p,downloadUrl:m}}const s=String(n.messageType??n.message_type??"text"),a=s==="image"?"image":s==="file"?"file":"text";return{id:String(n.id??""),conversationId:String(n.conversationId??n.conversation_id??""),senderId:String(n.senderId??n.sender_id??""),senderUsername:String(n.senderUsername??n.sender_username??n.username??""),senderDisplayName:n.senderDisplayName!=null?String(n.senderDisplayName):n.sender_display_name!=null?String(n.sender_display_name):void 0,messageType:a,body:String(n.body??n.content??n.text??""),attachmentId:n.attachment_id!=null?String(n.attachment_id):n.attachmentId!=null?String(n.attachmentId):null,createdAt:i,attachment:o}}function A4(e,n,r,i,o,s){return new Promise((a,d)=>{const u=new FormData;u.append("file",r),u.append("messageType",i),o!=null&&o.trim()&&u.append("optionalText",o.trim());const f=new XMLHttpRequest;f.open("POST",`${pn()}/api/chat/conversations/${n}/attachments`),f.setRequestHeader("Authorization",`Bearer ${e}`),s&&(f.upload.onprogress=p=>{p.lengthComputable&&s(Math.round(p.loaded/p.total*100))}),f.onload=()=>{if(f.status>=200&&f.status<300)try{a(Wc(JSON.parse(f.responseText)))}catch{d(new Error("响应解析失败"))}else{let p=`HTTP ${f.status}`;try{const m=JSON.parse(f.responseText);p=m.error??m.message??p}catch{}d(new Error(p))}},f.onerror=()=>d(new Error("网络错误，上传失败")),f.onabort=()=>d(new Error("上传已取消")),f.send(u)})}async function _4(e){let n;try{n=await fetch(`${pn()}/api/chat/contacts`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`}})}catch(o){throw new Error(`网络错误：${o instanceof Error?o.message:String(o)}`)}if(n.status===401)throw new Error("未授权，请重新登录");if(n.status===403)throw new Error("无权限访问联系人目录");if(!n.ok){const o=await n.json().catch(()=>({}));throw new Error(o.error??o.message??`HTTP ${n.status}`)}const r=await n.json();let i;if(Array.isArray(r))i=r;else if(r&&typeof r=="object"){const o=r,s=o.contacts??o.users??o.data??o.items;i=Array.isArray(s)?s:[]}else i=[];return i.map(o=>({id:String(o.id??o.userId??o.user_id??""),username:String(o.username??""),displayName:o.display_name!=null?String(o.display_name):o.displayName!=null?String(o.displayName):void 0,email:o.email!=null?String(o.email):void 0,departmentId:o.department_id!=null?String(o.department_id):o.departmentId!=null?String(o.departmentId):null,departmentName:o.department_name!=null?String(o.department_name):o.departmentName!=null?String(o.departmentName):o.department!=null&&typeof o.department=="object"?String(o.department.name??""):void 0,position:o.position!=null?String(o.position):o.job_title!=null?String(o.job_title):o.jobTitle!=null?String(o.jobTitle):void 0,managerId:o.manager_id!=null?String(o.manager_id):o.managerId!=null?String(o.managerId):o.supervisor_id!=null?String(o.supervisor_id):o.supervisorId!=null?String(o.supervisorId):null,canViewWorkReport:typeof o.canViewWorkReport=="boolean"?o.canViewWorkReport:typeof o.can_view_work_report=="boolean"?o.can_view_work_report:void 0,roles:Array.isArray(o.roles)?o.roles:void 0,status:o.status==="disabled"?"disabled":"active",avatarColor:o.avatar_color!=null?String(o.avatar_color):o.avatarColor!=null?String(o.avatarColor):void 0,avatarUrl:o.avatar_url!=null?String(o.avatar_url):o.avatarUrl!=null?String(o.avatarUrl):void 0,roleLabel:o.role_label!=null?String(o.role_label):o.roleLabel!=null?String(o.roleLabel):void 0,bio:o.bio!=null?String(o.bio):void 0})).filter(o=>o.id!=="")}function Kh(e,n,r=!1){return e.id===n||e.status!=="active"?!1:r?!0:!!(e.canViewWorkReport||e.canGenerateDailyReport||e.can_view_work_report||e.can_generate_daily_report)}const Yl=!1;function Qr(e){if(!e)return"";const n=new Date(e);return isNaN(n.getTime())?"":n.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}function cf(e){if(!e)return null;const n=new Date(e);if(isNaN(n.getTime()))return null;const r=new Date;if(n.toDateString()===r.toDateString())return"今天";const i=new Date(r);return i.setDate(r.getDate()-1),n.toDateString()===i.toDateString()?"昨天":n.toLocaleDateString("zh-CN")}const st={overlay:{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center"},window:{background:"#F5F7FB",color:"#111827",borderRadius:14,width:"90vw",maxWidth:1060,height:"84vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",overflow:"hidden",border:"1px solid #E5E7EB"},header:{padding:"12px 18px",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",gap:10,flexShrink:0,background:"#FFFFFF"},body:{flex:1,display:"flex",overflow:"hidden",minHeight:0},sidebar:{width:280,borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",flexShrink:0,background:"#FFFFFF"},sidebarTop:{padding:"10px 12px",borderBottom:"1px solid #EEF1F5",display:"flex",gap:6},convList:{flex:1,overflowY:"auto",background:"#FFFFFF"},convItem:e=>({padding:"11px 14px",cursor:"pointer",borderBottom:"1px solid #EEF1F5",background:e?"#EAF2FF":"transparent",transition:"background 0.12s"}),msgArea:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0,background:"#F5F7FB"},msgHeader:{padding:"11px 18px",borderBottom:"1px solid #E5E7EB",flexShrink:0,display:"flex",alignItems:"center",gap:8,background:"#FFFFFF"},msgList:{flex:1,overflowY:"auto",padding:"16px 20px",minHeight:0},msgBubble:e=>({maxWidth:"68%",background:e?"#2563eb":"#FFFFFF",color:e?"#fff":"#111827",borderRadius:e?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"9px 14px",marginBottom:6,alignSelf:e?"flex-end":"flex-start",fontSize:16,lineHeight:1.55,wordBreak:"break-word",boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:e?"none":"1px solid #E5E7EB"}),inputRow:{padding:"10px 16px",borderTop:"1px solid #E5E7EB",display:"flex",gap:8,alignItems:"flex-end",flexShrink:0,background:"#FFFFFF"},input:{flex:1,background:"#FFFFFF",border:"1px solid #D1D5DB",color:"#111827",borderRadius:10,padding:"9px 13px",fontSize:16,resize:"none",outline:"none",fontFamily:"inherit"},searchInput:{width:"100%",background:"#FFFFFF",border:"1px solid #D1D5DB",color:"#111827",borderRadius:8,padding:"7px 10px",fontSize:14,outline:"none",boxSizing:"border-box"},btn:(e,n)=>({padding:n?"5px 11px":"8px 15px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,fontWeight:600,background:e?"#2563eb":"#F3F4F6",color:e?"#fff":"#374151",whiteSpace:"nowrap",flexShrink:0}),chip:{background:"#EAF2FF",color:"#1d4ed8",borderRadius:20,padding:"3px 10px",fontSize:14,display:"inline-flex",alignItems:"center",gap:5,margin:"2px",border:"1px solid #bfdbfe"},iconBtn:e=>({width:32,height:32,borderRadius:8,border:"1px solid #D1D5DB",background:e?"#F9FAFB":"#FFFFFF",cursor:e?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,color:e?"#D1D5DB":"#6B7280",transition:"background 0.12s",padding:0}),fileCard:e=>({background:e?"#1d4ed8":"#FFFFFF",border:e?"none":"1px solid #E5E7EB",borderRadius:10,padding:"10px 13px",maxWidth:260,display:"flex",alignItems:"center",gap:10}),previewBar:{padding:"8px 14px",background:"#F0F9FF",borderTop:"1px solid #BAE6FD",display:"flex",alignItems:"center",gap:10,flexShrink:0},imgThumb:{maxWidth:220,maxHeight:160,borderRadius:8,display:"block",border:"1px solid #E5E7EB",cursor:"pointer",objectFit:"contain"},tab:e=>({flex:1,padding:"7px 0",border:"none",cursor:"pointer",fontSize:14,fontWeight:e?700:500,background:e?"#EAF2FF":"transparent",color:e?"#2563eb":"#6B7280",borderBottom:e?"2px solid #2563eb":"2px solid transparent",transition:"all 0.12s"}),rightPanel:{width:260,borderLeft:"1px solid #E5E7EB",display:"flex",flexDirection:"column",flexShrink:0,background:"#FFFFFF",overflowY:"auto"}};function E4(e){const n=e==null?void 0:e.trim();if(!(!n||!n.includes("@")))return n.split("@")[0]||void 0}function Jl(e){const n=e instanceof Error?e.message:String(e);return/Failed to fetch|NetworkError|无法连接聊天服务|Empty reply/i.test(n)?"无法创建会话，请检查聊天服务是否已启动":/登录已过期|未授权|401/.test(n)?"登录已过期，请重新登录后再发消息":/Forbidden|403|无权限/i.test(n)?"当前账号无权限创建该会话":n||"创建会话失败"}async function Xl(e,n){var s,a,d;const r=await Gg(e,n.personId),i=n.accountUserId??((s=r.accountIdentity)==null?void 0:s.userId),o=n.username??((a=r.accountIdentity)==null?void 0:a.username)??E4(((d=r.mailIdentity)==null?void 0:d.aiEmail)??r.aiEmail??n.aiEmail);if(!i)throw new Error("无法创建会话：该联系人缺少内部账号用户 ID");return{targetUserId:i,targetUsername:o,displayName:r.name||n.name||n.enName||o}}const z4=({previewUrl:e,fileName:n,token:r,style:i,onOpen:o})=>{const[s,a]=c.useState(null),[d,u]=c.useState(null),[f,p]=c.useState(!0);return c.useEffect(()=>{if(!e){p(!1),u("无预览地址");return}let m=!1,g=null;return p(!0),u(null),a(null),fetch(e,{headers:{Authorization:`Bearer ${r}`}}).then(async h=>{if(!h.ok)throw new Error(`HTTP ${h.status}`);return h.blob()}).then(h=>{m||(g=URL.createObjectURL(h),a(g),p(!1))}).catch(h=>{m||(u(h instanceof Error?h.message:"加载失败"),p(!1))}),()=>{m=!0,g&&URL.revokeObjectURL(g)}},[e,r]),f?t.jsx("div",{style:{...i,display:"flex",alignItems:"center",justifyContent:"center",background:"#F3F4F6",minWidth:80,minHeight:60,fontSize:14,color:"#9CA3AF",borderRadius:8},children:"图片加载中…"}):d||!s?t.jsxs("div",{style:{...i,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#FEF2F2",minWidth:80,minHeight:60,padding:"8px 12px",borderRadius:8},children:[t.jsx("div",{style:{fontSize:14,color:"#EF4444"},children:"图片加载失败"}),d&&t.jsx("div",{style:{fontSize:14,color:"#9CA3AF",marginTop:2},children:d})]}):t.jsx("img",{src:s,alt:n,style:{...i,cursor:"pointer"},onClick:()=>o==null?void 0:o(s)})};function D4({token:e,currentUserId:n,onCreated:r,onClose:i}){const[o,s]=c.useState([]),[a,d]=c.useState(""),[u,f]=c.useState(!0),[p,m]=c.useState(""),[g,h]=c.useState([]),[x,k]=c.useState("direct"),[v,y]=c.useState(""),[j,S]=c.useState(!1),[z,P]=c.useState("");c.useEffect(()=>{f(!0),d(""),Vg(e).then(D=>{s(D.filter(R=>R.personId!==n))}).catch(D=>{d(D instanceof Error?D.message:"联系人加载失败")}).finally(()=>f(!1))},[e,n]);const I=(D,R)=>{R||h(x==="direct"?V=>V[0]===D?[]:[D]:V=>V.includes(D)?V.filter(te=>te!==D):[...V,D])},b=async()=>{if(g.length===0){P("请至少选择一个成员");return}if(x==="direct"&&g.length!==1){P("私信只能选择一个用户");return}S(!0),P("");try{const D=await Promise.all(o.filter(te=>g.includes(te.personId)).map(te=>Xl(e,te))),R=D.map(te=>te.targetUserId),V=x==="direct"?await Vl(e,D[0]):await Hh(e,{conversationType:x,title:v.trim()||void 0,memberIds:R});r(V)}catch(D){P(Jl(D))}finally{S(!1)}},$=o.filter(D=>!p||D.name.toLowerCase().includes(p.toLowerCase())||(D.enName??"").toLowerCase().includes(p.toLowerCase())||(D.department??"").toLowerCase().includes(p.toLowerCase())||(D.position??"").toLowerCase().includes(p.toLowerCase())),O=o.filter(D=>g.includes(D.personId));return t.jsx("div",{style:{position:"fixed",inset:0,zIndex:1e4,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsxs("div",{style:{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:12,padding:"22px 24px",width:420,color:"#111827",boxShadow:"0 8px 32px rgba(0,0,0,0.12)"},children:[t.jsx("div",{style:{fontWeight:700,fontSize:16,marginBottom:16},children:"新建会话"}),t.jsx("div",{style:{display:"flex",gap:8,marginBottom:14},children:["direct","group"].map(D=>t.jsx("button",{onClick:()=>{k(D),h([])},style:{...st.btn(x===D,!0),flex:1},children:D==="direct"?"🧑 私信":"👥 群聊"},D))}),x==="group"&&t.jsx("input",{placeholder:"群聊名称（可选，不填则自动生成）",value:v,onChange:D=>y(D.target.value),style:{...st.searchInput,marginBottom:10}}),O.length>0&&t.jsx("div",{style:{marginBottom:10,minHeight:28},children:O.map(D=>t.jsxs("span",{style:st.chip,children:[D.name,t.jsx("span",{style:{cursor:"pointer",fontSize:14},onClick:()=>I(D.personId,!1),children:"✕"})]},D.personId))}),t.jsx("input",{placeholder:"搜索姓名 / 部门 / 职位…",value:p,onChange:D=>m(D.target.value),style:{...st.searchInput,marginBottom:8}}),t.jsxs("div",{style:{maxHeight:220,overflowY:"auto",marginBottom:12,borderRadius:8,border:"1px solid #E5E7EB"},children:[u&&t.jsx("div",{style:{padding:"20px",textAlign:"center",color:"#6B7280",fontSize:14},children:"加载联系人中…"}),!u&&a&&t.jsx("div",{style:{padding:"14px",color:"#dc2626",fontSize:14},children:"⚠️ 无法连接账号中心，请检查 AccountCenter 服务状态"}),!u&&!a&&$.length===0&&t.jsx("div",{style:{padding:"20px",textAlign:"center",color:"#6B7280",fontSize:14},children:o.length===0?"暂无通讯录数据，请先在 AccountCenter 导入人员。":`没有匹配"${p}"的用户`}),!u&&!a&&$.map(D=>{const R=D.chatStatus==="not_created",V=D.chatStatus==="disabled",te=R||V;return t.jsxs("div",{onClick:()=>I(D.personId,te),title:R?"内部通讯账号未开通。":V?"内部通讯账号已禁用":void 0,style:{padding:"9px 14px",cursor:te?"not-allowed":"pointer",fontSize:14,borderBottom:"1px solid #EEF1F5",opacity:te?.5:1,background:g.includes(D.personId)?"#EAF2FF":"transparent",display:"flex",alignItems:"center",gap:10},children:[t.jsx("div",{style:{width:30,height:30,borderRadius:"50%",background:"#E5E7EB",color:"#374151",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontWeight:600},children:D.name.charAt(0)}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsxs("div",{style:{fontWeight:500,color:"#111827",display:"flex",alignItems:"center",gap:6},children:[D.name,D.enName&&t.jsx("span",{style:{fontWeight:400,color:"#9faebd",fontSize:12},children:D.enName}),R&&t.jsx("span",{style:{fontSize:10,color:"#856404",background:"#fff3cd",padding:"1px 5px",borderRadius:4,fontWeight:700},children:"未开通"})]}),(D.department||D.position)&&t.jsx("div",{style:{fontSize:12,color:"#6B7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:[D.department,D.position].filter(Boolean).join(" · ")})]}),g.includes(D.personId)&&t.jsx("span",{style:{color:"#2563eb",fontSize:16,flexShrink:0},children:"✓"})]},D.personId)})]}),z&&t.jsxs("div",{style:{color:"#dc2626",fontSize:14,marginBottom:10},children:["⚠️ ",z]}),t.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"flex-end"},children:[t.jsx("button",{style:st.btn(),onClick:i,children:"取消"}),t.jsx("button",{style:{...st.btn(!0),opacity:g.length===0?.5:1},disabled:j||g.length===0,onClick:()=>{b()},children:j?"创建中…":"创建"})]})]})})}function R4(){const e=[];for(let n=0;n<3;n++){const r=new Date;r.setDate(r.getDate()-n);const i=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`;e.push({label:n===0?"今天":n===1?"昨天":"前天",value:i})}return e}async function M4(e){var i;const n=(i=window.electronAPI)==null?void 0:i.activityAdminFetch;if(!n)throw new Error("activityAdminFetch API not available — 请确保在 Electron 环境中运行");const r=await n(e);if(!r.ok)throw r.httpStatus===403?new Error("无权限查看该用户日报（403）"):new Error(String(r.error??`HTTP ${r.httpStatus}`));return r.data}async function F4(e,n){var o;const r=(o=window.electronAPI)==null?void 0:o.activityAdminPost;if(!r)throw new Error("activityAdminPost API not available — 请确保在 Electron 环境中运行");const i=await r(e,n);if(!i.ok)throw i.httpStatus===403?new Error("无权限（403）"):new Error(String(i.error??`HTTP ${i.httpStatus}`));return i.data}function B4(e){const n=new Date,r=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`,i=new Date(n);i.setDate(n.getDate()-1);const o=`${i.getFullYear()}-${String(i.getMonth()+1).padStart(2,"0")}-${String(i.getDate()).padStart(2,"0")}`;return e===r?"该用户今日暂无具体操作记录。":e===o?"该用户昨日没有具体操作记录。":"该用户在该日期暂无具体操作记录。"}function Gh({contact:e,viewerUserId:n,onClose:r}){const i=R4(),[o,s]=c.useState(i[0].value),[a,d]=c.useState("pick"),[u,f]=c.useState(null),[p,m]=c.useState(null),[g,h]=c.useState(!1),x=async()=>{if(!Kh(e,n,Rg)){f("无权生成该用户日报"),d("error");return}d("loading"),f(null);try{await F4("/api/admin/activity/reports/generate",{dateKey:o,scope:"user",userId:e.id,force:!0});const y=await M4(`/api/admin/activity/users/${e.id}/daily/${o}`),j=y.data??y;j.report?(m(j),d("result")):(m(j),d("no_activity"))}catch(y){console.error("[daily-report] generate failed",{currentUserId:n,targetUser:{id:e.id,username:e.username},dateKey:o,error:y}),f(y instanceof Error?y.message:"无法生成日报，请检查权限或日志服务状态"),d("error")}},k=a==="result",v=e.displayName||e.username;return t.jsx("div",{style:{position:"fixed",inset:0,zIndex:10002,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsxs("div",{style:{background:"#FFFFFF",borderRadius:12,padding:"24px 28px",width:k?520:340,maxHeight:"82vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.14)",border:"1px solid #E5E7EB",color:"#111827"},children:[t.jsx("div",{style:{fontWeight:700,fontSize:16,marginBottom:4},children:k?`${v} · 工作日报`:"生成工作日报"}),t.jsx("div",{style:{fontSize:14,color:"#6B7280",marginBottom:16},children:k?o:`对象：${v}`}),(a==="pick"||a==="error")&&t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{marginBottom:16},children:[t.jsx("div",{style:{fontSize:14,fontWeight:600,color:"#374151",marginBottom:8},children:"选择日期"}),t.jsx("div",{style:{display:"flex",gap:8},children:i.map(y=>t.jsx("button",{onClick:()=>s(y.value),style:{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",background:o===y.value?"#2563eb":"#F3F4F6",color:o===y.value?"#fff":"#374151",fontWeight:o===y.value?700:500,fontSize:14},children:y.label},y.value))}),t.jsx("div",{style:{fontSize:14,color:"#9CA3AF",marginTop:6},children:o})]}),u&&t.jsxs("div",{style:{color:"#dc2626",fontSize:14,marginBottom:12,background:"#fef2f2",padding:"8px 10px",borderRadius:6},children:["⚠️ ",u]}),t.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"flex-end"},children:[t.jsx("button",{onClick:r,style:{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:"#F3F4F6",color:"#374151",fontSize:14,fontWeight:600},children:"取消"}),t.jsx("button",{onClick:()=>{x()},style:{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:"#2563eb",color:"#fff",fontSize:14,fontWeight:600},children:"生成日报"})]})]}),a==="loading"&&t.jsxs("div",{style:{textAlign:"center",padding:"28px 0",color:"#6B7280",fontSize:14},children:[t.jsx("div",{style:{fontSize:28,marginBottom:10},children:"⏳"}),"生成中，请稍候…"]}),a==="no_activity"&&t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{textAlign:"center",padding:"12px 0 8px"},children:[t.jsx("div",{style:{fontSize:32,marginBottom:8},children:"📭"}),t.jsx("div",{style:{fontSize:16,fontWeight:700,color:"#374151",marginBottom:6},children:"暂无工作记录"}),t.jsx("div",{style:{fontSize:14,color:"#6B7280",marginBottom:4},children:B4(o)}),t.jsx("div",{style:{fontSize:13,color:"#9CA3AF"},children:"系统未检测到文档编辑、AI 调用、邮件处理或内部通讯等有效工作事件。"})]}),Yl,t.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12},children:[t.jsx("button",{onClick:()=>{d("pick"),h(!1)},style:{padding:"7px 14px",borderRadius:8,border:"1px solid #D1D5DB",cursor:"pointer",background:"#F9FAFB",color:"#374151",fontSize:14},children:"换个日期"}),t.jsx("button",{onClick:r,style:{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",background:"#F3F4F6",color:"#374151",fontSize:14},children:"关闭"})]})]}),a==="result"&&(p==null?void 0:p.report)&&(()=>{const y=p.report,j=y.structured_json??{},S=j.detailedMarkdown??y.detailedMarkdown,z=Array.isArray(j.mainWork)?j.mainWork.join(`
`):j.mainWork,P=j.fileOutputs??j.fileOperationSummary,I=j.aiUsage??j.aiUsageSummary,b=j.emailAndChat??j.communicationSummary,$=j.timeStats??j.durationSummary,O=Array.isArray(j.failedTasks)?j.failedTasks.join(`
`):j.anomalies??(typeof j.failedTasks=="string"?j.failedTasks:void 0),D=S||[j.overview??y.summary_text?`【今日概览】
${j.overview??y.summary_text}`:"",z&&z!=="无"?`【主要工作】
${z}`:"",P&&P!=="无"?`【文件与产出】
${P}`:"",I&&I!=="无"?`【AI 使用情况】
${I}`:"",b&&b!=="无"?`【邮件与内部通讯】
${b}`:"",$&&$!=="无耗时数据"&&$!=="无"?`【耗时统计】
${$}`:"",O&&O!=="无"?`【异常情况】
${O}`:""].filter(Boolean).join(`

`);return t.jsxs(t.Fragment,{children:[S?t.jsx("div",{style:{marginBottom:8},children:S.split(`
`).map((R,V)=>R.startsWith("## ")?t.jsx("div",{style:{fontWeight:700,fontSize:14,color:"#374151",marginTop:14,marginBottom:4,borderBottom:"1px solid #E5E7EB",paddingBottom:3},children:R.slice(3)},V):R.startsWith("**")&&R.endsWith("**")&&R.length>4?t.jsx("div",{style:{fontWeight:700,fontSize:14,color:"#111827",marginBottom:4},children:R.slice(2,-2)},V):R.trim()?t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.7},children:R},V):t.jsx("div",{style:{height:5}},V))}):t.jsxs(t.Fragment,{children:[(j.overview??y.summary_text)&&t.jsxs("div",{style:{marginBottom:12,background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,padding:"10px 14px"},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#9CA3AF",marginBottom:4},children:"今日概览"}),t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"},children:j.overview??y.summary_text})]}),z&&z!=="无"&&t.jsxs("div",{style:{marginBottom:10},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4},children:"主要工作"}),t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"},children:z})]}),P&&P!=="无"&&t.jsxs("div",{style:{marginBottom:10},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4},children:"文件与产出"}),t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"},children:P})]}),I&&I!=="无"&&t.jsxs("div",{style:{marginBottom:10},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4},children:"AI 使用情况"}),t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"},children:I})]}),b&&b!=="无"&&t.jsxs("div",{style:{marginBottom:10},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4},children:"邮件与内部通讯"}),t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"},children:b})]}),$&&$!=="无耗时数据"&&$!=="无"&&t.jsxs("div",{style:{marginBottom:10},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4},children:"耗时统计"}),t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"},children:$})]}),O&&O!=="无"&&t.jsxs("div",{style:{marginBottom:10,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"10px 12px"},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#92400E",marginBottom:4},children:"异常情况"}),t.jsx("div",{style:{fontSize:14,color:"#78350F",lineHeight:1.7,whiteSpace:"pre-wrap"},children:O})]}),p.summaries.length>0&&t.jsxs("div",{style:{marginBottom:10},children:[t.jsxs("div",{style:{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4},children:["文件记录（",p.summaries.length,"）"]}),p.summaries.slice(0,8).map((R,V)=>t.jsxs("div",{style:{fontSize:14,color:"#4B5563",lineHeight:1.6},children:["• ",R.file_name,R.summary?`：${R.summary}`:""]},R.id??V)),p.summaries.length>8&&t.jsxs("div",{style:{fontSize:14,color:"#9CA3AF"},children:["…等共 ",p.summaries.length," 个文件"]})]})]}),p.jobs.filter(R=>R.status==="failed").length>0&&t.jsxs("div",{style:{marginBottom:10,background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 12px"},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700,color:"#DC2626",marginBottom:4},children:"异常任务"}),p.jobs.filter(R=>R.status==="failed").map(R=>t.jsxs("div",{style:{fontSize:14,color:"#7F1D1D",lineHeight:1.6},children:["• ",R.job_type,R.error_message?`：${R.error_message}`:""]},R.id))]}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"},children:[t.jsx("button",{onClick:()=>{var R;(R=navigator.clipboard)==null||R.writeText(D)},style:{padding:"6px 14px",borderRadius:7,border:"1px solid #D1D5DB",cursor:"pointer",fontSize:14,background:"#fff",color:"#374151",fontWeight:600},children:"复制"}),t.jsx("button",{onClick:()=>{d("pick"),m(null)},style:{padding:"6px 14px",borderRadius:7,border:"1px solid #D1D5DB",cursor:"pointer",fontSize:14,background:"#fff",color:"#374151",fontWeight:600},children:"重新生成"}),t.jsx("button",{onClick:r,style:{padding:"6px 14px",borderRadius:7,border:"1px solid #D1D5DB",cursor:"pointer",fontSize:14,background:"#fff",color:"#374151",fontWeight:600,marginLeft:"auto"},children:"关闭"})]})]})})()]})})}function L4({contact:e,viewerUserId:n,onSendMessage:r,onClose:i}){const[o,s]=c.useState(!1),a=Kh(e,n,Rg),d=e.displayName||e.username,u=d.slice(0,2).toUpperCase();return t.jsxs("div",{style:st.rightPanel,children:[t.jsxs("div",{style:{padding:"12px 14px",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0},children:[t.jsx("span",{style:{fontSize:14,fontWeight:700,color:"#374151"},children:"联系人资料"}),t.jsx("button",{onClick:i,style:{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:18,lineHeight:1,padding:"0 2px"},children:"✕"})]}),t.jsxs("div",{style:{padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,borderBottom:"1px solid #EEF1F5",flexShrink:0},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:"#DBEAFE",color:"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700},children:u}),t.jsx("div",{style:{fontWeight:700,fontSize:15,color:"#111827",textAlign:"center"},children:d}),e.displayName&&e.displayName!==e.username&&t.jsxs("div",{style:{fontSize:14,color:"#6B7280"},children:["@",e.username]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:5},children:[t.jsx("div",{style:{width:8,height:8,borderRadius:"50%",background:e.status==="active"?"#10b981":"#9CA3AF"}}),t.jsx("span",{style:{fontSize:14,color:e.status==="active"?"#10b981":"#9CA3AF"},children:e.status==="active"?"在线":"离线"})]})]}),t.jsxs("div",{style:{padding:"14px 16px",borderBottom:"1px solid #EEF1F5",display:"flex",flexDirection:"column",gap:10,flexShrink:0},children:[e.departmentName&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:14,color:"#9CA3AF",marginBottom:2},children:"部门"}),t.jsx("div",{style:{fontSize:14,color:"#374151"},children:e.departmentName})]}),e.position&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:14,color:"#9CA3AF",marginBottom:2},children:"职位"}),t.jsx("div",{style:{fontSize:14,color:"#374151"},children:e.position})]}),e.email&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:14,color:"#9CA3AF",marginBottom:2},children:"邮箱"}),t.jsx("div",{style:{fontSize:14,color:"#374151",wordBreak:"break-all"},children:e.email})]})]}),t.jsxs("div",{style:{padding:"14px 16px",display:"flex",flexDirection:"column",gap:8,flexShrink:0},children:[t.jsx("button",{onClick:()=>r(e),style:{padding:"9px 0",borderRadius:8,border:"none",cursor:"pointer",background:"#2563eb",color:"#fff",fontSize:14,fontWeight:600},children:"💬 发消息"}),a&&t.jsx("button",{onClick:()=>s(!0),style:{padding:"9px 0",borderRadius:8,border:"none",cursor:"pointer",background:"#F3F4F6",color:"#374151",fontSize:14,fontWeight:600},children:"📋 生成日报"})]}),o&&t.jsx(Gh,{contact:e,viewerUserId:n,onClose:()=>s(!1)})]})}const N4=({onClose:e,inline:n})=>{var Ir,Pi;const r=go(),i=w4("chat.view_own"),o=(r==null?void 0:r.token)??"",s=((Ir=r==null?void 0:r.user)==null?void 0:Ir.id)??"",a=((Pi=r==null?void 0:r.user)==null?void 0:Pi.username)??"",[d,u]=c.useState([]),[f,p]=c.useState(null),[m,g]=c.useState(null),[h,x]=c.useState([]),[k,v]=c.useState(null),[y,j]=c.useState(""),[S,z]=c.useState(!1),[P,I]=c.useState(!1),[b,$]=c.useState(""),[O,D]=c.useState(!1),R=c.useRef(null),V=c.useRef(null),[te,q]=c.useState("conversations"),[W,fe]=c.useState([]),[le,Q]=c.useState(!1),[ge,J]=c.useState(null),[H,T]=c.useState(""),[w,L]=c.useState(null),[N,M]=c.useState([]),[A,ee]=c.useState(!1),[me,Ie]=c.useState(null),[Fe,Z]=c.useState(null),[X,ye]=c.useState([]),[Ee,G]=c.useState(!1),[F,se]=c.useState([]),[_e,de]=c.useState(!1),[oe,Te]=c.useState(null),[C,E]=c.useState(""),[K,_]=c.useState(null),Y=c.useRef(null),[ae,je]=c.useState(null),[Le,Ke]=c.useState(null),[Be,mt]=c.useState(null),[He,dt]=c.useState(null),[Xe,Re]=c.useState(!1),[tt,ue]=c.useState(0),[ze,re]=c.useState(null),[pe,ne]=c.useState(null),[Ve,ve]=c.useState(!1),ct=c.useRef(null),Je=c.useRef(null),[Ge,ie]=c.useState(null),[Ae,De]=c.useState(null),[Ne,qe]=c.useState(null),[Oe,gt]=c.useState(null),[rt,Qe]=c.useState(null),[Ze,ut]=c.useState(null),[zt,qt]=c.useState(null),_t=c.useCallback(async()=>{if(o)try{const B=await Uh(o);u(B),p(null)}catch(B){p(B instanceof Error?B.message:"无法加载会话列表")}},[o]),Xn=c.useCallback(async B=>{if(o){I(!0),v(null);try{const ke=await C4(o,B);x(ke),setTimeout(()=>{var Ce;return(Ce=R.current)==null?void 0:Ce.scrollIntoView({behavior:"smooth"})},50)}catch(ke){const Ce=ke instanceof Error?ke.message:"消息加载失败";Ce.includes("403")||Ce.toLowerCase().includes("forbidden")?v("无权限查看该会话"):v("消息加载失败，请稍后重试")}finally{I(!1)}}},[o]);c.useEffect(()=>{_t()},[_t]),c.useEffect(()=>{if(m)return x([]),v(null),Xn(m),V.current=setInterval(()=>{Xn(m)},5e3),()=>{V.current&&clearInterval(V.current)}},[m,Xn]);const ht=c.useCallback(async()=>{if(o){Q(!0),J(null);try{let B=await _4(o);if(B=B.filter(ke=>ke.id!==s),B.length===0){const ke=new Set;for(const Ce of d)if(Array.isArray(Ce.members))for(const pt of Ce.members){const it=pt.userId??pt.user_id,yt=String(it??"");!yt||yt==="0"||yt===s||ke.has(yt)||(ke.add(yt),B.push({id:yt,username:pt.username,status:"active"}))}}fe(B)}catch(B){J(B instanceof Error?B.message:"联系人加载失败")}finally{Q(!1)}}},[o,s]);c.useEffect(()=>{o&&W.length===0&&!le&&ht()},[o]);const bn=c.useCallback(async()=>{if(o){ee(!0),Ie(null);try{M(await Hg(o))}catch(B){Ie(B instanceof Error?B.message:"无法连接账号中心，请检查 AccountCenter 服务状态。")}finally{ee(!1)}}},[o]),Zn=c.useCallback(async B=>{if(o){G(!0);try{ye(await Kg(o,B))}catch{ye([])}finally{G(!1)}}},[o]),kt=c.useCallback(async B=>{if(!o||!B.trim()){se([]),de(!1);return}de(!0);try{se(await Al(o,{q:B}))}catch{se([])}finally{de(!1)}},[o]);c.useEffect(()=>{te==="contacts"&&N.length===0&&!A&&bn()},[te]);const Wt=c.useCallback(async B=>{if(Te(B),!(!o||!B.personId||B.chatStatus!=="active")){_(null);try{const ke=await Xl(o,B),Ce=await Vl(o,ke);u(pt=>[Ce,...pt.filter(it=>it.id!==Ce.id)]),Vt(Ce.id),_t()}catch(ke){_(Jl(ke))}}},[o,_t]),Vt=B=>{V.current&&clearInterval(V.current),g(B)},Qn=c.useCallback(async B=>{const ke=d.find(Ce=>Ce.conversation_type==="group"?!1:(Ce.members??[]).filter(it=>it.userId!==s).some(it=>it.userId===B.id));if(ke){Vt(ke.id),q("conversations");return}try{const Ce=await Vl(o,{targetUserId:B.id,targetUsername:B.username});u(pt=>[Ce,...pt.filter(it=>it.id!==Ce.id)]),Vt(Ce.id),q("conversations"),_t()}catch(Ce){p(Jl(Ce))}},[d,s,o,_t]),An=c.useCallback(()=>{He&&URL.revokeObjectURL(He),Ke(null),mt(null),dt(null),ue(0),re(null)},[He]),Bt=(B,ke)=>{An(),Ke(B),mt(ke),re(null),ke==="image"&&dt(URL.createObjectURL(B))},ce=c.useCallback(async B=>{const ke=B.downloadUrl.startsWith("http")?B.downloadUrl:`${pn()}${B.downloadUrl}`;try{const Ce=await fetch(ke,{headers:{Authorization:`Bearer ${o}`}});if(!Ce.ok)throw new Error(`HTTP ${Ce.status}`);const pt=await Ce.blob(),it=URL.createObjectURL(pt),yt=document.createElement("a");yt.href=it,yt.download=B.fileName,yt.click(),setTimeout(()=>URL.revokeObjectURL(it),1e4)}catch(Ce){alert(`下载失败：${Ce instanceof Error?Ce.message:String(Ce)}`)}},[o]);function we(B){if(B.attachment)return B.attachment;if(B.attachmentId){const ke=`${pn()}/api/chat/attachments/${B.attachmentId}`;return{id:B.attachmentId,fileName:"附件",mimeType:"application/octet-stream",sizeBytes:0,downloadUrl:ke}}return null}function Se(B){return B<1024?`${B} B`:B<1024*1024?`${(B/1024).toFixed(1)} KB`:`${(B/(1024*1024)).toFixed(1)} MB`}const he=async()=>{var Ce,pt;if(!m||S||Xe)return;const B=d.find(it=>it.id===m);if((B==null?void 0:B.status)==="dissolved"){v("该群聊已解散，无法发送消息");return}if(Le&&Be){Re(!0),re(null),ue(0);try{const it=await A4(o,m,Le,Be,y.trim()||void 0,yt=>ue(yt));x(yt=>[...yt,it]),setTimeout(()=>{var yt;return(yt=R.current)==null?void 0:yt.scrollIntoView({behavior:"smooth"})},50),An(),j(""),_t()}catch(it){re(it instanceof Error?it.message:"上传失败")}finally{Re(!1)}return}if(!y.trim())return;z(!0);const ke=y.trim();j("");try{const it=await P4(o,m,ke);x(yt=>[...yt,it]),setTimeout(()=>{var yt;return(yt=R.current)==null?void 0:yt.scrollIntoView({behavior:"smooth"})},50),_t(),s&&((pt=(Ce=window.electronAPI)==null?void 0:Ce.activityLogUserAction)==null||pt.call(Ce,{userId:s,module:"chat",action:"sendMessage",eventType:"chat_message_sent",summary:"发送了一条内部通讯消息",details:{conversationId:m,messageType:"text",messageSummary:ke.slice(0,30),hasAttachment:!1,attachmentCount:0}}))}catch(it){v(it instanceof Error?it.message:"发送失败"),j(ke)}finally{z(!1)}},Me=c.useCallback(B=>{if(!m)return;const Ce=Array.from(B.clipboardData.items).find(pt=>pt.type.startsWith("image/"));if(Ce){const pt=Ce.getAsFile();pt&&(B.preventDefault(),Bt(pt,"image"))}},[m,An]),xe=c.useCallback(B=>{if(B.preventDefault(),ve(!1),!m)return;const ke=B.dataTransfer.files[0];ke&&Bt(ke,ke.type.startsWith("image/")?"image":"file")},[m,An]),xt=async B=>{Qe(null);try{await I4(o,B),u(ke=>ke.filter(Ce=>Ce.id!==B)),m===B&&g(null),gt(null)}catch(ke){console.error("[chat] hide conversation failed",ke),Qe("无法移除会话，请检查网络或服务状态")}},vt=async B=>{qt(null);try{await $4(o,B),u(ke=>ke.map(Ce=>Ce.id===B?{...Ce,status:"dissolved"}:Ce)),ut(null)}catch(ke){console.error("[chat] dissolve conversation failed",ke);const Ce=ke instanceof Error?ke.message:String(ke);/403|forbidden|无权限/i.test(Ce)?qt("无权限解散该群聊"):/dissolved|已解散/i.test(Ce)?qt("该群聊已经解散"):qt("解散群聊失败，请检查网络或服务状态")}},et=d.find(B=>B.id===m)??null,It=(et==null?void 0:et.status)==="dissolved",mn=d.filter(B=>b?Bn(B).toLowerCase().includes(b.toLowerCase()):!0);function Bn(B){if(B.conversation_type==="group"&&B.title)return B.title;const ke=(B.members??[]).filter(Ce=>Ce.userId!==s);return ke.length>0?ke.map(Ce=>Ce.username).join(", "):B.title??`会话 ${B.id.slice(0,8)}`}function xo(B){if(B.conversation_type==="group")return"👥";const ke=(B.members??[]).filter(Ce=>Ce.userId!==s);return ke.length>0?ke[0].username.charAt(0).toUpperCase():"?"}function $t(B){return String(B??"").trim().toLowerCase().split("@")[0]}const bo=t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:"#FFFFFF",position:"relative"},children:[!n&&t.jsx("button",{onClick:e,style:{position:"absolute",top:14,right:18,background:"transparent",border:"none",color:"#9CA3AF",fontSize:22,cursor:"pointer",padding:"2px 8px",lineHeight:1},children:"✕"}),t.jsx("div",{style:{fontSize:40,marginBottom:4},children:"💬"}),t.jsx("div",{style:{fontSize:17,fontWeight:700,color:"#1f2937"},children:"内部通讯"}),t.jsx("div",{style:{fontSize:14,color:"#6B7280",textAlign:"center",maxWidth:320},children:"请先登录内部账号才能使用内部通讯功能。"}),t.jsx("button",{style:{...st.btn(!0),marginTop:4,padding:"10px 24px",fontSize:14},onClick:()=>{e(),window.dispatchEvent(new CustomEvent("open-account-center"))},children:"去账号中心登录"})]});if(!r||!o)return n?bo:t.jsx("div",{style:st.overlay,onClick:B=>B.target===B.currentTarget&&e(),children:t.jsxs("div",{style:{...st.window,alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"#FFFFFF"},children:[t.jsx("button",{onClick:e,style:{position:"absolute",top:14,right:18,background:"transparent",border:"none",color:"#9CA3AF",fontSize:22,cursor:"pointer",padding:"2px 8px",lineHeight:1},children:"✕"}),bo]})});if(!i){const B=t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:"#FFFFFF"},children:[t.jsx("div",{style:{fontSize:40,marginBottom:4},children:"🔒"}),t.jsx("div",{style:{fontSize:17,fontWeight:700,color:"#1f2937"},children:"内部通讯"}),t.jsx("div",{style:{fontSize:14,color:"#6B7280",textAlign:"center",maxWidth:320},children:"当前账号无内部通讯权限，请联系管理员开通。"})]});return n?B:t.jsx("div",{style:st.overlay,onClick:ke=>ke.target===ke.currentTarget&&e(),children:t.jsxs("div",{style:{...st.window,alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"#FFFFFF"},children:[t.jsx("button",{onClick:e,style:{position:"absolute",top:14,right:18,background:"transparent",border:"none",color:"#9CA3AF",fontSize:22,cursor:"pointer",padding:"2px 8px",lineHeight:1},children:"✕"}),B]})})}const Ci=t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:st.header,children:[t.jsx("span",{style:{fontSize:18},children:"💬"}),t.jsx("span",{style:{fontWeight:700,fontSize:15},children:"内部通讯"}),t.jsxs("span",{style:{fontSize:14,color:"#6B7280"},children:["@",a]}),t.jsx("button",{style:{...st.btn(!0,!0),marginLeft:"auto"},onClick:()=>D(!0),children:"+ 新建会话"}),!n&&t.jsx("button",{onClick:e,style:{background:"transparent",border:"none",color:"#9CA3AF",fontSize:20,cursor:"pointer",padding:"2px 6px",lineHeight:1},children:"✕"})]}),t.jsxs("div",{style:st.body,children:[t.jsxs("div",{style:st.sidebar,children:[t.jsxs("div",{style:{display:"flex",borderBottom:"1px solid #EEF1F5",flexShrink:0},children:[t.jsx("button",{style:st.tab(te==="conversations"),onClick:()=>q("conversations"),children:"最近会话"}),t.jsx("button",{style:st.tab(te==="contacts"),onClick:()=>q("contacts"),children:"通讯录"})]}),te==="conversations"?t.jsxs(t.Fragment,{children:[t.jsx("div",{style:st.sidebarTop,children:t.jsx("input",{placeholder:"搜索会话…",value:b,onChange:B=>$(B.target.value),style:st.searchInput})}),f&&t.jsxs("div",{style:{padding:"10px 14px",color:"#dc2626",fontSize:14,background:"#fef2f2",borderBottom:"1px solid #fecaca"},children:["⚠️ ",f,t.jsx("span",{style:{cursor:"pointer",marginLeft:8,color:"#2563eb"},onClick:()=>{_t()},children:"重试"})]}),t.jsxs("div",{style:st.convList,children:[mn.length===0&&!f&&t.jsx("div",{style:{padding:"28px 16px",textAlign:"center",color:"#9CA3AF",fontSize:14},children:d.length===0?t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{fontSize:28,marginBottom:8},children:"💬"}),t.jsx("div",{style:{color:"#6B7280"},children:"暂无会话"}),t.jsx("div",{style:{marginTop:6,fontSize:14},children:'点击"新建会话"开始聊天'})]}):t.jsx("div",{children:"没有匹配的会话"})}),mn.map(B=>{const Ce=(()=>{if(B.conversation_type==="group")return null;const on=(B.members??[]).find(Pt=>{const wt=String(Pt.userId||Pt.user_id||"");return wt?wt!==String(s):$t(Pt.username)!==$t(a)});if(on){const Pt=String(on.userId||on.user_id||""),wt=(Pt?W.find($r=>String($r.id)===Pt):null)??W.find($r=>$t($r.username)===$t(on.username));return wt||{id:Pt||on.username,username:on.username,status:"active"}}return!B.title||$t(B.title)===$t(a)?null:W.find(Pt=>$t(Pt.username)===$t(B.title??"")||Pt.displayName&&$t(Pt.displayName)===$t(B.title??""))??{id:B.title,username:B.title,status:"active"}})(),pt=!!Ce,it=Ae===B.id;return t.jsx("div",{style:{...st.convItem(B.id===m),position:"relative"},onClick:()=>{it||Vt(B.id)},onMouseEnter:()=>ie(B.id),onMouseLeave:()=>ie(yt=>yt===B.id?null:yt),children:t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[t.jsx("div",{style:{width:36,height:36,borderRadius:"50%",background:B.conversation_type==="group"?"#E5E7EB":"#DBEAFE",color:B.conversation_type==="group"?"#374151":"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontWeight:600},children:xo(B)}),t.jsxs("div",{style:{minWidth:0,flex:1},children:[t.jsxs("div",{style:{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#111827"},children:[Bn(B),B.status==="dissolved"&&t.jsx("span",{style:{marginLeft:6,fontSize:11,padding:"1px 5px",borderRadius:4,background:"#F3F4F6",color:"#9CA3AF",fontWeight:500,verticalAlign:"middle"},children:"已解散"})]}),t.jsx("div",{style:{fontSize:14,color:"#6B7280",marginTop:2},children:B.conversation_type==="group"?`群聊 · ${B.member_count??(B.members??[]).length} 人`:"私信"})]}),pt&&t.jsx("button",{title:"生成工作日报",onClick:yt=>{yt.stopPropagation(),je(Ce)},style:{padding:"3px 8px",borderRadius:6,border:"1px solid #bfdbfe",background:"#EAF2FF",color:"#1d4ed8",fontSize:14,fontWeight:600,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"},children:"📋 日报"}),(Ge===B.id||it)&&t.jsx("button",{title:"更多操作",onClick:yt=>{if(yt.stopPropagation(),it)De(null),qe(null);else{const on=yt.currentTarget.getBoundingClientRect();qe({top:on.bottom+4,right:window.innerWidth-on.right}),De(B.id)}},style:{width:26,height:26,borderRadius:6,border:"1px solid #E5E7EB",background:it?"#F3F4F6":"#FFFFFF",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#6B7280",padding:0,flexShrink:0},children:"···"})]})},B.id)})]})]}):t.jsxs(t.Fragment,{children:[t.jsx("div",{style:st.sidebarTop,children:t.jsx("input",{placeholder:"搜索姓名 / 工号 / 部门 / 职位 / 邮箱",value:C,onChange:B=>{const ke=B.target.value;E(ke),Z(null),Te(null),Y.current&&clearTimeout(Y.current),ke.trim()?Y.current=setTimeout(()=>void kt(ke),400):se([])},style:st.searchInput})}),t.jsx("div",{style:{flex:1,overflowY:"auto"},children:C.trim()?_e?t.jsx("div",{style:{padding:"24px 16px",textAlign:"center",color:"#6B7280",fontSize:14},children:"搜索中…"}):F.length===0?t.jsxs("div",{style:{padding:"24px 16px",textAlign:"center",color:"#9CA3AF",fontSize:14},children:['没有匹配"',C,'"的人员']}):t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{padding:"5px 14px 4px",fontSize:12,color:"#9CA3AF",background:"#F9FAFB",borderBottom:"1px solid #EEF1F5"},children:["搜索结果（",F.length,"）"]}),F.map(B=>{const ke=B.name||B.enName||B.aiEmail||"未命名成员",Ce=(oe==null?void 0:oe.personId)===B.personId;return t.jsxs("div",{onClick:()=>Ce?Te(null):void Wt(B),style:{padding:"9px 14px",cursor:"pointer",borderBottom:"1px solid #EEF1F5",background:Ce?"#EAF2FF":"transparent",display:"flex",alignItems:"center",gap:10},children:[t.jsx("div",{style:{width:32,height:32,borderRadius:"50%",background:"#DBEAFE",color:"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontWeight:700},children:ke.slice(0,1)||"?"}),t.jsxs("div",{style:{minWidth:0,flex:1},children:[t.jsxs("div",{style:{fontSize:14,fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:[ke,B.enName&&B.enName!==B.name&&t.jsx("span",{style:{color:"#9CA3AF",fontWeight:400,marginLeft:4,fontSize:13},children:B.enName})]}),t.jsx("div",{style:{fontSize:13,color:"#6B7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:[B.position,B.aiEmail||B.sourceEmail].filter(Boolean).join(" · ")})]}),t.jsxs("div",{style:{display:"flex",gap:4,flexShrink:0},children:[B.mailboxStatus&&t.jsx("span",{style:{fontSize:11,padding:"1px 5px",borderRadius:4,background:B.mailboxStatus==="active"?"#DCFCE7":"#FEF9C3",color:B.mailboxStatus==="active"?"#166534":"#92400e"},children:"邮"}),B.chatStatus&&t.jsx("span",{style:{fontSize:11,padding:"1px 5px",borderRadius:4,background:B.chatStatus==="active"?"#DBEAFE":"#F3F4F6",color:B.chatStatus==="active"?"#1d4ed8":"#6B7280"},children:"聊"})]})]},B.personId)})]}):(()=>{if(A)return t.jsx("div",{style:{padding:"24px 16px",textAlign:"center",color:"#6B7280",fontSize:14},children:"加载部门目录…"});if(me)return t.jsxs("div",{style:{padding:"12px 14px",color:"#dc2626",fontSize:14,background:"#fef2f2"},children:["⚠️ ",me,t.jsx("span",{style:{cursor:"pointer",marginLeft:8,color:"#2563eb"},onClick:()=>void bn(),children:"重试"})]});if(N.length===0)return t.jsx("div",{style:{padding:"24px 16px",textAlign:"center",color:"#9CA3AF",fontSize:14},children:"暂无部门数据，请先在 AccountCenter 导入人员。"});if(Fe){const B=Fe.name||Fe.enName||"未命名部门";return t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{padding:"8px 14px",borderBottom:"1px solid #EEF1F5",display:"flex",alignItems:"center",gap:8,background:"#F9FAFB",flexShrink:0},children:[t.jsx("button",{onClick:()=>{Z(null),ye([]),Te(null)},style:{background:"none",border:"none",cursor:"pointer",color:"#2563eb",fontSize:14,padding:0,fontWeight:500},children:"← 返回"}),t.jsx("span",{style:{fontSize:13,fontWeight:700,color:"#374151"},children:B}),X.length>0&&t.jsxs("span",{style:{fontSize:12,color:"#9CA3AF"},children:["（",X.length," 人）"]})]}),Ee?t.jsx("div",{style:{padding:"20px 16px",textAlign:"center",color:"#6B7280",fontSize:14},children:"加载成员…"}):X.length===0?t.jsx("div",{style:{padding:"20px 16px",textAlign:"center",color:"#9CA3AF",fontSize:14},children:"该部门暂无成员"}):X.map(ke=>{const Ce=ke.name||ke.enName||ke.aiEmail||"未命名成员",pt=(oe==null?void 0:oe.personId)===ke.personId;return t.jsxs("div",{onClick:()=>pt?Te(null):void Wt(ke),style:{padding:"9px 14px",cursor:"pointer",borderBottom:"1px solid #EEF1F5",background:pt?"#EAF2FF":"transparent",display:"flex",alignItems:"center",gap:10},children:[t.jsx("div",{style:{width:32,height:32,borderRadius:"50%",background:"#DBEAFE",color:"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontWeight:700},children:Ce.slice(0,1)||"?"}),t.jsxs("div",{style:{minWidth:0,flex:1},children:[t.jsxs("div",{style:{fontSize:14,fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:[Ce,ke.enName&&ke.enName!==ke.name&&t.jsx("span",{style:{color:"#9CA3AF",fontWeight:400,marginLeft:4,fontSize:13},children:ke.enName})]}),t.jsx("div",{style:{fontSize:13,color:"#6B7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:[ke.position,ke.aiEmail].filter(Boolean).join(" · ")})]}),t.jsxs("div",{style:{display:"flex",gap:4,flexShrink:0},children:[t.jsx("span",{style:{fontSize:11,padding:"1px 5px",borderRadius:4,background:ke.mailboxStatus==="active"?"#DCFCE7":"#FEF9C3",color:ke.mailboxStatus==="active"?"#166534":"#92400e"},children:"邮"}),t.jsx("span",{style:{fontSize:11,padding:"1px 5px",borderRadius:4,background:ke.chatStatus==="active"?"#DBEAFE":"#F3F4F6",color:ke.chatStatus==="active"?"#1d4ed8":"#6B7280"},children:"聊"})]})]},ke.personId)})]})}return t.jsx(t.Fragment,{children:N.map(B=>{const ke=B.name||B.enName||"未命名部门";return t.jsxs("div",{onClick:()=>{Z(B),ye([]),Te(null),Zn(B.orgUnitId)},style:{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #EEF1F5",display:"flex",alignItems:"center",gap:10},children:[t.jsx("div",{style:{width:32,height:32,borderRadius:8,background:"#E0E7FF",color:"#4338ca",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0},children:"🏢"}),t.jsxs("div",{style:{minWidth:0,flex:1},children:[t.jsx("div",{style:{fontSize:14,fontWeight:600,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:ke}),B.enName&&B.enName!==B.name&&t.jsx("div",{style:{fontSize:12,color:"#9CA3AF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:B.enName})]}),B.memberCount!=null&&t.jsxs("span",{style:{fontSize:13,color:"#6B7280",flexShrink:0},children:[B.memberCount," 人"]}),t.jsx("span",{style:{color:"#D1D5DB",fontSize:16,flexShrink:0},children:"›"})]},B.orgUnitId)})})})()})]})]}),t.jsx("div",{style:st.msgArea,children:m?t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:st.msgHeader,children:[t.jsx("div",{style:{width:32,height:32,borderRadius:"50%",background:(et==null?void 0:et.conversation_type)==="group"?"#E5E7EB":"#DBEAFE",color:(et==null?void 0:et.conversation_type)==="group"?"#374151":"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontWeight:600},children:et?xo(et):"?"}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsx("div",{style:{fontSize:14,fontWeight:700},children:et?Bn(et):""}),(et==null?void 0:et.members)&&t.jsx("div",{style:{fontSize:14,color:"#6B7280"},children:et.members.map(B=>B.username).join(", ")})]}),et&&et.conversation_type!=="group"&&(()=>{const B=et.members??[];let ke=null;const Ce=B.find(pt=>{const it=String(pt.userId||pt.user_id||"");return it?it!==String(s):$t(pt.username)!==$t(a)});if(Ce){const pt=String(Ce.userId||Ce.user_id||"");ke=(pt?W.find(it=>String(it.id)===pt):null)??W.find(it=>$t(it.username)===$t(Ce.username))??{id:pt||Ce.username,username:Ce.username,status:"active"}}else et.title&&$t(et.title)!==$t(a)&&(ke=W.find(pt=>$t(pt.username)===$t(et.title??"")||pt.displayName&&$t(pt.displayName)===$t(et.title??""))??{id:et.title,username:et.title,status:"active"});return ke?t.jsx("button",{title:"生成工作日报",onClick:()=>je(ke),style:{padding:"5px 12px",borderRadius:7,border:"1px solid #bfdbfe",background:"#EAF2FF",color:"#1d4ed8",fontSize:14,fontWeight:600,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:4},children:"📋 生成日报"}):null})(),(et==null?void 0:et.conversation_type)==="group"&&et.status!=="dissolved"&&et.created_by===s&&t.jsx("button",{title:"解散群聊",onClick:()=>{ut(et.id),qt(null)},style:{padding:"5px 12px",borderRadius:7,border:"1px solid #fecaca",background:"#FEF2F2",color:"#dc2626",fontSize:14,fontWeight:600,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:4},children:"🗑️ 解散群聊"})]}),t.jsxs("div",{style:{...st.msgList,outline:Ve?"2px dashed #2563eb":"none",background:Ve?"#EFF6FF":"#F5F7FB",transition:"background 0.1s"},onDragOver:B=>{B.preventDefault(),ve(!0)},onDragLeave:()=>ve(!1),onDrop:xe,onPaste:Me,children:[P&&!h.length&&t.jsx("div",{style:{textAlign:"center",color:"#6B7280",fontSize:14,paddingTop:40},children:"加载中…"}),k&&t.jsxs("div",{style:{textAlign:"center",color:"#dc2626",fontSize:14,paddingTop:40},children:["⚠️ ",k,t.jsx("br",{}),t.jsx("span",{style:{color:"#2563eb",cursor:"pointer",fontSize:14},onClick:()=>{Xn(m)},children:"重试"})]}),!k&&h.length===0&&!P&&t.jsxs("div",{style:{textAlign:"center",color:"#6B7280",fontSize:14,paddingTop:40},children:[t.jsx("div",{style:{fontSize:28,marginBottom:8},children:"🗨️"}),"暂无消息，发送第一条消息开始聊天"]}),h.map((B,ke)=>{const Ce=B.senderId===s,pt=h[ke-1],it=cf(B.createdAt),yt=pt?cf(pt.createdAt):null,on=it!==null&&it!==yt,yo=!Ce&&(!pt||pt.senderId!==B.senderId||on),Pt=we(B),wt=B.senderDisplayName||B.senderUsername||B.senderId.slice(0,8)||"未知用户";return t.jsxs(Ct.Fragment,{children:[on&&it&&t.jsxs("div",{style:{textAlign:"center",color:"#9CA3AF",fontSize:14,margin:"14px 0 10px"},children:["— ",it," —"]}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:Ce?"flex-end":"flex-start",marginBottom:2},children:[yo&&t.jsx("div",{style:{fontSize:14,color:"#6B7280",marginBottom:3,marginLeft:4},children:wt}),B.messageType==="image"&&Pt?t.jsxs("div",{style:{maxWidth:240},children:[t.jsx(z4,{previewUrl:Pt.previewUrl??Pt.downloadUrl,fileName:Pt.fileName,token:o,style:st.imgThumb,onOpen:$r=>ne($r)}),B.body&&t.jsx("div",{style:{fontSize:14,color:Ce?"#1e40af":"#374151",marginTop:4},children:B.body}),Qr(B.createdAt)&&t.jsx("div",{style:{fontSize:14,color:"#9CA3AF",marginTop:3,textAlign:"right"},children:Qr(B.createdAt)})]}):B.messageType==="file"&&Pt?t.jsxs("div",{style:st.fileCard(Ce),children:[t.jsx("div",{style:{fontSize:22,flexShrink:0},children:"📎"}),t.jsxs("div",{style:{minWidth:0,flex:1},children:[t.jsx("div",{style:{fontSize:14,fontWeight:600,color:Ce?"#fff":"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:Pt.fileName}),t.jsx("div",{style:{fontSize:14,color:Ce?"#93c5fd":"#6B7280"},children:Se(Pt.sizeBytes)}),B.body&&t.jsx("div",{style:{fontSize:14,color:Ce?"#e0f2fe":"#374151",marginTop:2},children:B.body}),Qr(B.createdAt)&&t.jsx("div",{style:{fontSize:14,color:Ce?"#93c5fd":"#9CA3AF",marginTop:3},children:Qr(B.createdAt)})]}),t.jsx("button",{onClick:()=>{ce(Pt)},style:{...st.iconBtn(),border:Ce?"1px solid rgba(255,255,255,0.3)":"1px solid #D1D5DB",color:Ce?"#fff":"#374151",background:Ce?"rgba(255,255,255,0.15)":"#FFFFFF",fontSize:16},title:"下载",children:"⬇"})]}):t.jsxs("div",{style:st.msgBubble(Ce),children:[t.jsx("div",{children:B.body}),Qr(B.createdAt)&&t.jsx("div",{style:{fontSize:14,color:Ce?"#93c5fd":"#9CA3AF",marginTop:4,textAlign:"right"},children:Qr(B.createdAt)})]})]})]},B.id)}),t.jsx("div",{ref:R})]}),Le&&t.jsxs("div",{style:st.previewBar,children:[Be==="image"&&He?t.jsx("img",{src:He,alt:"预览",style:{height:48,width:48,objectFit:"cover",borderRadius:6,border:"1px solid #BAE6FD"}}):t.jsx("span",{style:{fontSize:22},children:"📎"}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsx("div",{style:{fontSize:14,fontWeight:600,color:"#0369a1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:Le.name}),t.jsx("div",{style:{fontSize:14,color:"#0284c7"},children:Se(Le.size)})]}),Xe?t.jsxs("div",{style:{fontSize:14,color:"#0284c7",flexShrink:0},children:["上传中… ",tt,"%"]}):t.jsx("button",{onClick:An,style:{...st.iconBtn(),fontSize:14,color:"#6B7280"},title:"取消",children:"✕"})]}),ze&&t.jsxs("div",{style:{padding:"6px 14px",background:"#fef2f2",borderTop:"1px solid #fecaca",fontSize:14,color:"#dc2626",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[t.jsxs("span",{children:["⚠️ ",ze]}),t.jsx("button",{onClick:()=>re(null),style:{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:14,padding:"0 4px"},children:"✕"})]}),It&&t.jsx("div",{style:{padding:"10px 20px",background:"#FEF9C3",borderTop:"1px solid #FDE68A",textAlign:"center",fontSize:14,color:"#92400E",flexShrink:0},children:"该群聊已解散"}),t.jsx("div",{style:{...st.inputRow,gap:6},children:It?t.jsxs(t.Fragment,{children:[t.jsx("button",{disabled:!0,style:st.iconBtn(!0),children:"🖼️"}),t.jsx("button",{disabled:!0,style:st.iconBtn(!0),children:"📎"}),t.jsx("textarea",{rows:2,disabled:!0,placeholder:"该群聊已解散，无法继续发送消息",value:"",onChange:()=>{},style:{...st.input,background:"#F9FAFB",color:"#9CA3AF",cursor:"not-allowed"}}),t.jsx("button",{disabled:!0,style:{...st.btn(!0),opacity:.4},children:"发送"})]}):t.jsxs(t.Fragment,{children:[t.jsx("button",{title:"发送图片",disabled:!m||Xe,onClick:()=>{var B;return(B=ct.current)==null?void 0:B.click()},style:st.iconBtn(!m||Xe),children:"🖼️"}),t.jsx("button",{title:"发送附件",disabled:!m||Xe,onClick:()=>{var B;return(B=Je.current)==null?void 0:B.click()},style:st.iconBtn(!m||Xe),children:"📎"}),t.jsx("textarea",{rows:2,placeholder:Le?"可添加说明文字… (Enter 发送)":"输入消息… (Enter 发送，Shift+Enter 换行)",value:y,onChange:B=>j(B.target.value),onKeyDown:B=>{B.key==="Enter"&&!B.shiftKey&&(B.preventDefault(),he())},style:st.input}),t.jsx("button",{style:{...st.btn(!0),opacity:!y.trim()&&!Le||S||Xe?.5:1},disabled:S||Xe||!y.trim()&&!Le,onClick:()=>{he()},children:Xe?`${tt}%`:S?"…":"发送"})]})}),t.jsx("input",{ref:ct,type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",style:{display:"none"},onChange:B=>{var Ce;const ke=(Ce=B.target.files)==null?void 0:Ce[0];ke&&Bt(ke,"image"),B.target.value=""}}),t.jsx("input",{ref:Je,type:"file",style:{display:"none"},onChange:B=>{var Ce;const ke=(Ce=B.target.files)==null?void 0:Ce[0];ke&&Bt(ke,"file"),B.target.value=""}})]}):t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#9CA3AF"},children:[t.jsx("div",{style:{fontSize:44,marginBottom:12},children:"💬"}),t.jsx("div",{style:{fontSize:15,fontWeight:600,marginBottom:6,color:"#6B7280"},children:"选择一个会话"}),t.jsx("div",{style:{fontSize:14},children:'或点击"新建会话"开始聊天'})]})}),w&&!oe&&t.jsx(L4,{contact:w,viewerUserId:s,onSendMessage:B=>{Qn(B)},onClose:()=>L(null)}),oe&&t.jsxs("div",{style:st.rightPanel,children:[t.jsxs("div",{style:{padding:"12px 14px",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0},children:[t.jsx("span",{style:{fontSize:14,fontWeight:700,color:"#374151"},children:"联系人资料"}),t.jsx("button",{onClick:()=>Te(null),style:{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:18,lineHeight:1,padding:"0 2px"},children:"✕"})]}),t.jsxs("div",{style:{padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,borderBottom:"1px solid #EEF1F5",flexShrink:0},children:[t.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:"#DBEAFE",color:"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700},children:(oe.name||oe.enName||"?").slice(0,1)}),t.jsx("div",{style:{fontWeight:700,fontSize:15,color:"#111827",textAlign:"center"},children:oe.name||oe.enName||oe.aiEmail||"未命名成员"}),oe.enName&&t.jsx("div",{style:{fontSize:14,color:"#6B7280"},children:oe.enName})]}),t.jsxs("div",{style:{padding:"14px 16px",borderBottom:"1px solid #EEF1F5",display:"flex",flexDirection:"column",gap:10,flexShrink:0},children:[oe.position&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:13,color:"#9CA3AF",marginBottom:2},children:"职位"}),t.jsx("div",{style:{fontSize:14,color:"#374151"},children:oe.position})]}),"department"in oe&&oe.department&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:13,color:"#9CA3AF",marginBottom:2},children:"部门"}),t.jsx("div",{style:{fontSize:14,color:"#374151"},children:oe.department})]}),"employeeId"in oe&&oe.employeeId&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:13,color:"#9CA3AF",marginBottom:2},children:"工号"}),t.jsx("div",{style:{fontSize:14,color:"#374151"},children:oe.employeeId})]}),oe.aiEmail&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:13,color:"#9CA3AF",marginBottom:2},children:"AI Office 邮箱"}),t.jsx("div",{style:{fontSize:14,color:"#374151",wordBreak:"break-all"},children:oe.aiEmail})]}),"sourceEmail"in oe&&oe.sourceEmail&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:13,color:"#9CA3AF",marginBottom:2},children:"原办公邮箱"}),t.jsx("div",{style:{fontSize:14,color:"#6B7280",wordBreak:"break-all"},children:oe.sourceEmail})]}),oe.mailboxStatus&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:13,color:"#9CA3AF",marginBottom:4},children:"邮箱状态"}),t.jsx("span",{style:{fontSize:12,padding:"2px 7px",borderRadius:4,background:oe.mailboxStatus==="active"?"#DCFCE7":"#FEF9C3",color:oe.mailboxStatus==="active"?"#166534":"#92400e"},children:oe.mailboxStatus==="active"?"已开通":oe.mailboxStatus==="not_created"?"AI 邮箱尚未创建":oe.mailboxStatus})]}),oe.chatStatus&&t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:13,color:"#9CA3AF",marginBottom:4},children:"内部通讯状态"}),t.jsx("span",{style:{fontSize:12,padding:"2px 7px",borderRadius:4,background:oe.chatStatus==="active"?"#DBEAFE":"#F3F4F6",color:oe.chatStatus==="active"?"#1d4ed8":"#6B7280"},children:oe.chatStatus==="active"?"已开通":oe.chatStatus==="not_created"?"内部通讯账号未开通":oe.chatStatus})]})]}),t.jsxs("div",{style:{padding:"14px 16px",display:"flex",flexDirection:"column",gap:8,flexShrink:0},children:[K&&t.jsxs("div",{style:{color:"#dc2626",fontSize:13,marginBottom:4},children:["⚠️ ",K]}),(()=>{const B=oe.chatStatus,ke=B==="active",Ce=B==="not_created";return t.jsx("button",{disabled:!ke,title:Ce?"内部通讯账号未开通":B?"发送内部消息":"内部通讯不可用",onClick:()=>void Wt(oe),style:{padding:"9px 0",borderRadius:8,border:"none",cursor:ke?"pointer":"not-allowed",background:ke?"#2563eb":"#E5E7EB",color:ke?"#fff":"#9CA3AF",fontSize:14,fontWeight:600},children:Ce?"💬 内部通讯账号未开通":"💬 发消息"})})(),(()=>{const B=oe.mailboxStatus,ke=B==="active"&&!!oe.aiEmail,Ce=B==="not_created"?"✉️ AI 邮箱尚未创建":B==="failed"?"✉️ AI 邮箱创建失败":B==="disabled"?"✉️ AI 邮箱已禁用":oe.aiEmail?"✉️ 发邮件":"✉️ 无 AI 邮箱";return t.jsx("button",{disabled:!ke,title:ke?"发送邮件":B==="not_created"?"AI 邮箱尚未创建":B==="failed"?"AI 邮箱创建失败":B==="disabled"?"AI 邮箱已禁用":"无 AI 邮箱",onClick:()=>{!ke||!oe.aiEmail||(ek({email:oe.aiEmail,displayName:oe.name||oe.enName,personId:oe.personId,mailboxStatus:"active",fromDirectory:!0}),window.dispatchEvent(new CustomEvent("open-email-compose")))},style:{padding:"9px 0",borderRadius:8,border:"none",cursor:ke?"pointer":"not-allowed",background:ke?"#059669":"#E5E7EB",color:ke?"#fff":"#9CA3AF",fontSize:14,fontWeight:600},children:Ce})})(),oe.chatStatus==="active"&&t.jsx("button",{title:"生成工作日报",onClick:async()=>{try{const B=await Xl(o,oe);B.targetUserId&&B.targetUserId!==s&&je({id:B.targetUserId,username:B.targetUsername??B.displayName??"",displayName:B.displayName,status:"active"})}catch{}},style:{padding:"9px 0",borderRadius:8,border:"none",cursor:"pointer",background:"#EAF2FF",color:"#1d4ed8",fontSize:14,fontWeight:600},children:"📋 生成日报"})]})]})]}),O&&t.jsx(D4,{token:o,currentUserId:s,onCreated:B=>{u(ke=>[B,...ke.filter(Ce=>Ce.id!==B.id)]),D(!1),Vt(B.id),_t()},onClose:()=>D(!1)}),ae&&t.jsx(Gh,{contact:ae,viewerUserId:s,onClose:()=>je(null)}),pe&&t.jsxs("div",{style:{position:"fixed",inset:0,zIndex:10001,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center"},onClick:()=>ne(null),children:[t.jsx("img",{src:pe,alt:"大图预览",style:{maxWidth:"92vw",maxHeight:"88vh",borderRadius:8,boxShadow:"0 8px 48px rgba(0,0,0,0.5)",objectFit:"contain"},onClick:B=>B.stopPropagation()}),t.jsx("button",{onClick:()=>ne(null),style:{position:"absolute",top:18,right:22,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:22,cursor:"pointer",borderRadius:8,padding:"4px 10px",lineHeight:1},children:"✕"})]}),Ae&&Ne&&t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{position:"fixed",inset:0,zIndex:10010},onClick:()=>{De(null),qe(null)}}),t.jsx("div",{style:{position:"fixed",top:Ne.top,right:Ne.right,zIndex:10011,background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:128,overflow:"hidden"},children:t.jsx("button",{onClick:()=>{De(null),qe(null),gt(Ae),Qe(null)},style:{display:"block",width:"100%",padding:"10px 16px",border:"none",background:"transparent",cursor:"pointer",fontSize:14,color:"#374151",textAlign:"left",lineHeight:1.4},onMouseEnter:B=>{B.currentTarget.style.background="#F3F4F6"},onMouseLeave:B=>{B.currentTarget.style.background="transparent"},children:"移除会话"})})]}),Oe&&t.jsx("div",{style:{position:"fixed",inset:0,zIndex:10020,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center"},onClick:B=>{B.target===B.currentTarget&&(gt(null),Qe(null))},children:t.jsxs("div",{style:{background:"#FFFFFF",borderRadius:12,padding:"24px 28px",maxWidth:400,width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,0.16)"},children:[t.jsx("div",{style:{fontSize:16,fontWeight:700,color:"#111827",marginBottom:12},children:"移除会话"}),t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.6,marginBottom:20},children:"确定从最近会话中移除该会话吗？历史消息不会被删除。"}),rt&&t.jsxs("div",{style:{color:"#dc2626",fontSize:13,marginBottom:12},children:["⚠️ ",rt]}),t.jsxs("div",{style:{display:"flex",gap:10,justifyContent:"flex-end"},children:[t.jsx("button",{onClick:()=>{gt(null),Qe(null)},style:{...st.btn(!1),padding:"7px 18px"},children:"取消"}),t.jsx("button",{onClick:()=>{xt(Oe)},style:{...st.btn(!0),padding:"7px 18px",background:"#dc2626"},children:"移除"})]})]})}),Ze&&t.jsx("div",{style:{position:"fixed",inset:0,zIndex:10020,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center"},onClick:B=>{B.target===B.currentTarget&&(ut(null),qt(null))},children:t.jsxs("div",{style:{background:"#FFFFFF",borderRadius:12,padding:"24px 28px",maxWidth:420,width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,0.16)"},children:[t.jsx("div",{style:{fontSize:16,fontWeight:700,color:"#111827",marginBottom:12},children:"解散群聊"}),t.jsx("div",{style:{fontSize:14,color:"#374151",lineHeight:1.6,marginBottom:20},children:"确定解散该群聊吗？解散后所有成员都无法继续发送消息，历史消息仍会保留。"}),zt&&t.jsxs("div",{style:{color:"#dc2626",fontSize:13,marginBottom:12},children:["⚠️ ",zt]}),t.jsxs("div",{style:{display:"flex",gap:10,justifyContent:"flex-end"},children:[t.jsx("button",{onClick:()=>{ut(null),qt(null)},style:{...st.btn(!1),padding:"7px 18px"},children:"取消"}),t.jsx("button",{onClick:()=>{vt(Ze)},style:{...st.btn(!0),padding:"7px 18px",background:"#dc2626"},children:"解散"})]})]})})]});return n?t.jsx("div",{style:{...st.window,width:"100%",maxWidth:"100%",height:"100%",borderRadius:0,boxShadow:"none",border:"none"},children:Ci}):t.jsx("div",{style:st.overlay,onClick:B=>B.target===B.currentTarget&&e(),children:t.jsx("div",{style:st.window,children:Ci})})},qh=c.createContext(null);function O4(){const e=c.useContext(qh);if(!e)throw new Error("useLanguage 必须在 LanguageProvider 内使用");return e}const W4={zh:"中文",en:"English"};function U4({children:e}){const[n,r]=c.useState(()=>localStorage.getItem("ai_writer_language")||"zh"),i=c.useCallback(s=>{r(s),localStorage.setItem("ai_writer_language",s)},[]),o=c.useMemo(()=>({language:n,setLanguage:i,languageLabel:W4[n]}),[n,i]);return t.jsx(qh.Provider,{value:o,children:e})}const H4=new Date().getFullYear().toString(),nt={rewriteLanguage:"auto",rewriteRequirements:"保持原意，增强学术表达与论证严谨性",refTopic:"",refYearFrom:"",refYearTo:"",refTargetCount:36,refSoftFloorPercent:80,refCandidatePoolSize:500,refAnalysisWindow:40,continueGoal:"保持学术风格自然续写",continueWords:500,imageAspectRatio:"16:9",genLanguage:"zh",genPaperType:"review",genNoImageMode:!1,genCitationMode:"deferred",genYearFrom:"2021",genYearTo:H4,genExtraContext:""};function K4(e=localStorage){const n=e.getItem("ai_tool_ref_max_results")||"",r=parseInt(e.getItem("ai_tool_ref_target_count")||String(nt.refTargetCount),10),i=parseInt(e.getItem("ai_tool_ref_soft_floor_percent")||String(nt.refSoftFloorPercent),10),o=parseInt(e.getItem("ai_tool_ref_candidate_pool_size")||n||String(nt.refCandidatePoolSize),10),s=parseInt(e.getItem("ai_tool_ref_analysis_window")||String(nt.refAnalysisWindow),10);return{rewriteLanguage:e.getItem("ai_tool_rewrite_language")||nt.rewriteLanguage,rewriteRequirements:e.getItem("ai_tool_rewrite_requirements")||nt.rewriteRequirements,refTopic:e.getItem("ai_tool_ref_topic")||nt.refTopic,refYearFrom:e.getItem("ai_tool_ref_year_from")||nt.refYearFrom,refYearTo:e.getItem("ai_tool_ref_year_to")||nt.refYearTo,refTargetCount:Number.isFinite(r)?Math.min(80,Math.max(1,r)):nt.refTargetCount,refSoftFloorPercent:Number.isFinite(i)?Math.min(100,Math.max(0,i)):nt.refSoftFloorPercent,refCandidatePoolSize:Number.isFinite(o)?Math.min(1e3,Math.max(20,o)):nt.refCandidatePoolSize,refAnalysisWindow:Number.isFinite(s)?Math.min(120,Math.max(5,s)):nt.refAnalysisWindow,continueGoal:e.getItem("ai_tool_continue_goal")||nt.continueGoal,continueWords:parseInt(e.getItem("ai_tool_continue_words")||String(nt.continueWords),10),imageAspectRatio:e.getItem("ai_tool_image_aspect_ratio")||nt.imageAspectRatio,genLanguage:e.getItem("ai_tool_gen_language")||nt.genLanguage,genPaperType:e.getItem("ai_tool_gen_paper_type")||nt.genPaperType,genNoImageMode:e.getItem("ai_tool_gen_no_image_mode")==="true",genCitationMode:e.getItem("ai_tool_gen_citation_mode")==="inline"?"inline":nt.genCitationMode,genYearFrom:e.getItem("ai_tool_gen_year_from")||nt.genYearFrom,genYearTo:e.getItem("ai_tool_gen_year_to")||nt.genYearTo,genExtraContext:e.getItem("ai_tool_gen_extra_context")||nt.genExtraContext}}function P3(e){return{language:e.genLanguage==="en"?"en":"zh",paperType:e.genPaperType==="research"||e.genPaperType==="thesis_research"?e.genPaperType:"review"}}function A3(e,n=window,r=localStorage){const i=()=>{e(K4(r))};return n.addEventListener("ai-settings-updated",i),()=>{n.removeEventListener("ai-settings-updated",i)}}function Zl(e){localStorage.setItem("ai_tool_rewrite_language","auto"),localStorage.setItem("ai_tool_rewrite_requirements",e.defaults.rewriteRequirements),localStorage.setItem("ai_tool_ref_topic",e.defaults.referenceTopic),localStorage.setItem("ai_tool_ref_year_from",e.defaults.referenceYearFrom),localStorage.setItem("ai_tool_ref_year_to",e.defaults.referenceYearTo),localStorage.setItem("ai_tool_ref_target_count",String(e.defaults.referenceCount)),localStorage.setItem("ai_tool_ref_soft_floor_percent",String(e.defaults.referenceSoftFloorPercent)),localStorage.setItem("ai_tool_ref_max_results",String(e.defaults.referenceCandidatePoolSize)),localStorage.setItem("ai_tool_ref_candidate_pool_size",String(e.defaults.referenceCandidatePoolSize)),localStorage.setItem("ai_tool_ref_analysis_window",String(e.defaults.referenceAnalysisWindow)),localStorage.setItem("ai_tool_continue_goal",e.defaults.continueGoal),localStorage.setItem("ai_tool_continue_words",String(e.defaults.targetWords)),localStorage.setItem("ai_tool_image_aspect_ratio",e.defaults.imageAspectRatio),localStorage.setItem("ai_tool_gen_language",e.defaults.language),localStorage.setItem("ai_tool_gen_paper_type",e.defaults.paperType),localStorage.setItem("ai_tool_gen_no_image_mode",String(e.defaults.noImageMode)),localStorage.getItem("ai_tool_gen_citation_mode")||localStorage.setItem("ai_tool_gen_citation_mode",nt.genCitationMode),localStorage.setItem("ai_tool_gen_year_from",e.defaults.yearFrom),localStorage.setItem("ai_tool_gen_year_to",e.defaults.yearTo),localStorage.setItem("ai_tool_gen_extra_context",e.defaults.extraContext)}const G4=c.createContext(null);function q4({children:e,userId:n,username:r,activeWorkspacePath:i}){const[o,s]=c.useState(null),[a,d]=c.useState(!1),[u,f]=c.useState(!1),[p,m]=c.useState([]),[g,h]=c.useState(null),x=typeof window<"u"?window.electronAPI:void 0,k=c.useCallback(async()=>{if(x!=null&&x.delegationGetStatus)try{const b=await x.delegationGetStatus();b.ok&&s(b.state)}catch{}},[x]),v=c.useCallback(async()=>{if(x!=null&&x.delegationGetPendingReplies)try{const b=await x.delegationGetPendingReplies();b.ok&&m(b.replies.filter($=>$.status==="pending_review"))}catch{}},[x]);c.useEffect(()=>{if(!n){s(null),m([]);return}k(),v()},[n,k,v]),c.useEffect(()=>{if((o==null?void 0:o.status)!=="ai_delegated")return;const b=setInterval(()=>{v()},3e4);return()=>clearInterval(b)},[o==null?void 0:o.status,v]);const y=c.useCallback(async b=>{if(!n||!(x!=null&&x.delegationEnable)){h("请先登录账号");return}d(!0),h(null);try{if(b&&x.activityTakeSnapshot&&await x.activityTakeSnapshot(b).catch(()=>{}),b&&x.activityGetActivity&&x.delegationUploadWorkReport)try{const O=new Date().toISOString().split("T")[0],D=await x.activityGetActivity({workspacePath:b,date:O}),R=D.ok?[...D.diff.created,...D.diff.modified,...D.diff.deleted].map(te=>({fileName:te.fileName,changeType:te.changeType,topic:"",summary:`${te.changeType} — ${te.relativePath}`,workType:"other"})):[],V={userId:n,date:O,fileSummaries:R,emailActivity:{received:0,sent:0,drafts:0,threadSummaries:[]},chatActivity:{messagesSent:0,messagesReceived:0,conversationCount:0},aiUsage:{totalRequests:0,modes:[],tasksCompleted:0},workspacePath:b};await x.delegationUploadWorkReport(V).catch(()=>{})}catch{}const $=await x.delegationEnable({userId:n,workspacePath:b??"",policyId:"default"});$.ok?s($.state):h($.error||"开启托管失败")}catch($){h($ instanceof Error?$.message:"开启托管失败")}finally{d(!1)}},[n,x,i]),j=c.useCallback(async()=>{if(!(!n||!(x!=null&&x.delegationDisable))){f(!0),h(null);try{const b=await x.delegationDisable({userId:n});b.ok?s(b.state):h(b.error||"关闭托管失败")}catch(b){h(b instanceof Error?b.message:"关闭托管失败")}finally{f(!1)}}},[n,x]),S=c.useCallback(()=>h(null),[]),z=(o==null?void 0:o.status)==="ai_delegated",P=(o==null?void 0:o.status)??"online",I=c.useMemo(()=>({delegationState:o,isActive:z,presenceStatus:P,isEnabling:a,isDisabling:u,pendingReplyCount:p.length,pendingReplies:p,lastError:g,enableDelegation:y,disableDelegation:j,refreshStatus:k,refreshPendingReplies:v,clearError:S}),[o,z,P,a,u,p,g,y,j,k,v,S]);return t.jsx(G4.Provider,{value:I,children:e})}const V4=!1,Y4=new Set([".docx",".doc",".md",".txt",".pdf"]),J4=new Set(["images","imgs","assets","pictures","image","figures","fig","media"]);function X4(e){if(e.endsWith(".aidoc.json"))return V4;if(e.endsWith(".references.json")||e.endsWith(".out"))return!1;const n=e.toLowerCase(),r=n.lastIndexOf(".");return r<0?!1:Y4.has(n.slice(r))}function Vh(e){const n=[];for(const r of e)if(r.type==="file")X4(r.name)&&n.push(r);else{if(J4.has(r.name.toLowerCase()))continue;const i=Vh(r.children??[]);i.length>0&&n.push({...r,children:i})}return n}function Yh(e,n){if(!n)return e;const r=[];for(const i of e)if(i.type==="file")i.name.toLowerCase().includes(n)&&r.push(i);else{const o=Yh(i.children??[],n);o.length>0&&r.push({...i,children:o})}return r}function Z4(e){return e.endsWith(".aidoc.json")?e.slice(0,-11):e}function Q4(e){const n=e.toLowerCase();return n.endsWith(".aidoc.json")||n.endsWith(".docx")||n.endsWith(".doc")?"#519aba":n.endsWith(".pdf")?"#e44d26":n.endsWith(".md")?"#42a86c":"#8094a8"}const df=l.div`
  width: 252px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #e2e8f2;
  overflow: hidden;
  min-height: 0;
`,uf=l.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 12px;
  gap: 4px;
  border-bottom: 1px solid #e2e8f2;
  background: #f8fafd;
  flex-shrink: 0;
`,pf=l.span`
  flex: 1;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #2c3e52;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,ei=l.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6b7f94;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  &:hover { background: #e8edf5; color: #1a2f47; }
`,e_=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-bottom: 1px solid #e8edf5;
  background: #f8fafd;
  flex-shrink: 0;
`,t_=l.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--font-size-xs);
  color: #1a2f47;
  outline: none;
  &::placeholder { color: #a0aebb; }
`,n_=l.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-bottom: 1px solid #e2e8f2;
  background: #f8fafd;
  flex-shrink: 0;
`,r_=l.input`
  flex: 1;
  height: 26px;
  border: 1px solid #1f6fd6;
  border-radius: 4px;
  padding: 0 6px;
  font-size: var(--font-size-xs);
  outline: none;
  color: #1a2f47;
  background: #fff;
`,i_=l.button`
  height: 26px;
  padding: 0 8px;
  border: 1px solid #1f6fd6;
  border-radius: 4px;
  background: #1f6fd6;
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: default; }
`,o_=l.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 4px 0;
`,ff=l.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px 4px ${e=>8+e.$depth*14}px;
  font-size: var(--font-size-xs);
  color: #2c3e52;
  cursor: pointer;
  user-select: none;
  &:hover { background: #f0f5fb; }
  &:active { background: #e5eef8; }
`,ci=l.span`
  display: inline-flex;
  flex-shrink: 0;
  color: ${e=>e.$color||"#888"};
`,mf=l.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,gf=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
  color: #8094a8;
  text-align: center;
`,hf=l.div`
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #304255;
`,xf=l.p`
  margin: 0;
  font-size: var(--font-size-xs);
  color: #8094a8;
  line-height: 1.6;
`;function Jh({node:e,depth:n,expandedFolders:r,toggleFolder:i,onFileOpen:o}){if(e.type==="folder"){const a=r.has(e.path);return t.jsxs(t.Fragment,{children:[t.jsxs(ff,{$depth:n,onClick:()=>i(e.path),children:[t.jsx(ci,{children:a?t.jsx(so,{size:10}):t.jsx(qn,{size:10})}),t.jsx(ci,{$color:"#dcb67a",children:a?t.jsx(Vn,{size:13}):t.jsx(br,{size:13})}),t.jsx(mf,{title:e.name,children:e.name})]}),a&&(e.children??[]).map(d=>t.jsx(Jh,{node:d,depth:n+1,expandedFolders:r,toggleFolder:i,onFileOpen:o},d.path))]})}const s=Q4(e.name);return t.jsxs(ff,{$depth:n,onClick:()=>o(e),children:[t.jsx(ci,{style:{width:10}}),t.jsx(ci,{$color:s,children:t.jsx(xn,{size:13})}),t.jsx(mf,{title:e.name,children:Z4(e.name)})]})}function s_(){const{fileTreeData:e,activeWorkspacePath:n,activeWorkspaceName:r,refreshTree:i}=Ft(),{openDocumentPath:o}=Fs(),{setStatusMessage:s}=Jn(),[a,d]=c.useState(!1),[u,f]=c.useState(""),[p,m]=c.useState(new Set),[g,h]=c.useState(!1),[x,k]=c.useState(""),v=c.useRef(null),y=c.useMemo(()=>{const O=Vh(e);return u.trim()?Yh(O,u.trim().toLowerCase()):O},[e,u]),j=c.useCallback(O=>{m(D=>{const R=new Set(D);return R.has(O)?R.delete(O):R.add(O),R})},[]),S=c.useCallback(async O=>{if(O.type!=="folder")try{await o(O.path)}catch(D){s(`打开失败: ${(D==null?void 0:D.message)||""}`)}},[o,s]),z=c.useCallback(async()=>{if(!n||!x.trim())return;const O=x.trim(),R=`documents/${O.endsWith(".aidoc.json")?O:`${O}.aidoc.json`}`;try{const V=await window.electronAPI.createBlankDocument(n,R);await i(),await o(V.path,{isInternalOpen:!0}),s(`已创建: ${O}`)}catch(V){s(`创建失败: ${(V==null?void 0:V.message)||""}`)}h(!1),k("")},[n,x,o,i,s]),P=c.useCallback(async()=>{var O;if(n)try{const D=await window.electronAPI.importFilesToWorkspace(n,"documents");(O=D==null?void 0:D.imported)!=null&&O.length&&(await i(),s(`已导入 ${D.imported.length} 个文件`))}catch(D){s(`导入失败: ${(D==null?void 0:D.message)||""}`)}},[n,i,s]),I=c.useCallback(()=>{d(O=>!O),a||(f(""),setTimeout(()=>{var O;return(O=v.current)==null?void 0:O.focus()},50))},[a]),b=c.useCallback(()=>{h(!0),k("")},[]),$=c.useCallback(()=>{h(!1),k("")},[]);return n?t.jsxs(df,{children:[t.jsxs(uf,{children:[t.jsx(pf,{title:n,children:r??"文稿"}),t.jsx(ei,{title:"新建文稿",onClick:b,children:t.jsx(Gm,{size:13})}),t.jsx(ei,{title:"导入文件",onClick:()=>void P(),children:t.jsx(bi,{size:12})}),t.jsx(ei,{title:"搜索",onClick:I,children:t.jsx(lo,{size:12})}),t.jsx(ei,{title:"刷新",onClick:()=>void i(),children:t.jsx(Mn,{size:12})})]}),g&&t.jsxs(n_,{children:[t.jsx(r_,{autoFocus:!0,value:x,onChange:O=>k(O.target.value),placeholder:"新文稿名称...",onKeyDown:O=>{O.key==="Enter"&&z(),O.key==="Escape"&&$()}}),t.jsx(i_,{disabled:!x.trim(),onClick:()=>void z(),children:"创建"}),t.jsx(ei,{onClick:$,title:"取消",children:t.jsx(Rn,{size:11})})]}),a&&t.jsxs(e_,{children:[t.jsx(lo,{size:12,color:"#8094a8"}),t.jsx(t_,{ref:v,value:u,onChange:O=>f(O.target.value),placeholder:"搜索文稿...",onKeyDown:O=>{O.key==="Escape"&&(d(!1),f(""))}}),u&&t.jsx(ei,{onClick:()=>f(""),title:"清除",children:t.jsx(Rn,{size:10})})]}),t.jsx(o_,{children:y.length===0?t.jsxs(gf,{children:[t.jsx(ci,{$color:"#c8d6e6",children:t.jsx(xn,{size:28})}),t.jsx(hf,{children:u?"未找到匹配文稿":"暂无文稿"}),t.jsx(xf,{children:u?"请尝试其他关键词。":"点击上方 + 新建文稿，或点击 ↑ 导入已有文件。"})]}):y.map(O=>t.jsx(Jh,{node:O,depth:0,expandedFolders:p,toggleFolder:j,onFileOpen:S},O.path))})]}):t.jsxs(df,{children:[t.jsx(uf,{children:t.jsx(pf,{children:"文稿"})}),t.jsxs(gf,{children:[t.jsx(ci,{$color:"#c8d6e6",children:t.jsx(Es,{size:28})}),t.jsx(hf,{children:"未打开工作区"}),t.jsx(xf,{children:"请先在资源中心选择工作区，以管理文稿文件。"})]})]})}const a_=l.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #eef2f8 0%, #f5f8fc 60%, #e8eef7 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  overflow: hidden;
`,l_=wr`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`,c_=l.div`
  background: #ffffff;
  border: 1px solid #dde3ec;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(30, 50, 90, 0.10), 0 1px 4px rgba(30, 50, 90, 0.06);
  padding: 44px 44px 36px;
  width: 400px;
  max-width: calc(100vw - 40px);
  animation: ${l_} 0.25s ease;
`,d_=l.div`
  text-align: center;
  margin-bottom: 28px;
`,u_=l.div`
  font-size: 26px;
  font-weight: 800;
  color: #1a3150;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
`,p_=l.div`
  font-size: var(--font-size-sm);
  color: #627385;
`,bf=l.div`
  margin-top: 14px;
`,yf=l.label`
  display: block;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #4a5f73;
  margin-bottom: 6px;
`,vf=l.input`
  width: 100%;
  padding: 11px 13px;
  border: 1.5px solid ${e=>e.$error?"#e07070":"#d6e0ea"};
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  color: #1f3142;
  background: #ffffff;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${e=>e.$error?"#e07070":"#4a90d9"};
    box-shadow: 0 0 0 3px ${e=>e.$error?"rgba(224,112,112,0.12)":"rgba(74,144,217,0.12)"};
  }

  &:disabled {
    background: #f7f9fc;
    color: #9eafbf;
  }
`,f_=l.button`
  width: 100%;
  margin-top: 22px;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a6fd4, #1558b8);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: opacity 0.15s, transform 0.1s;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,wf=l.div`
  margin-top: 14px;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid ${e=>e.$warn?"#f5c94a":"#f1c5c5"};
  background: ${e=>e.$warn?"#fffdf0":"#fff6f6"};
  color: ${e=>e.$warn?"#7a5a10":"#b33838"};
  font-size: var(--font-size-xs);
  line-height: 1.6;
`,m_=l.div`
  margin-top: 20px;
  text-align: center;
  font-size: var(--font-size-xs);
  color: #9eafbf;
`,g_=l.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 8px;
  border: 2px solid rgba(255,255,255,0.5);
  border-top-color: #fff;
  border-radius: 50%;
  vertical-align: middle;
  animation: spin 0.7s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;function h_(){const{state:e,login:n}=rn(),[r,i]=c.useState(""),[o,s]=c.useState(""),a=c.useRef(null),d=e.phase==="loading",u=e.phase==="error"?e.message:null,f=!!(u!=null&&u.includes("登录已过期"));c.useEffect(()=>{const m=setTimeout(()=>{var g;return(g=a.current)==null?void 0:g.focus()},100);return()=>clearTimeout(m)},[]);const p=c.useCallback(async m=>{if(m.preventDefault(),!r.trim()||!o||d)return;const g=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;console.log(`[LoginGate] submit requestId=${g} user=${r.trim()}`),await n(r.trim(),o)},[n,r,o,d]);return t.jsx(a_,{children:t.jsxs(c_,{children:[t.jsxs(d_,{children:[t.jsx(u_,{children:"AI Office"}),t.jsx(p_,{children:"登录内部账号后继续使用"})]}),f&&t.jsxs(wf,{$warn:!0,style:{marginTop:0,marginBottom:4},children:["⏱ ",u]}),t.jsxs("form",{onSubmit:p,autoComplete:"on",children:[t.jsxs(bf,{children:[t.jsx(yf,{htmlFor:"lg-username",children:"AI Office 邮箱"}),t.jsx(vf,{id:"lg-username",ref:a,type:"text",autoComplete:"username",value:r,onChange:m=>i(m.target.value),placeholder:"请输入 AI Office 邮箱（aiEmail）",disabled:d,$error:!!u&&!f})]}),t.jsxs(bf,{children:[t.jsx(yf,{htmlFor:"lg-password",children:"密码"}),t.jsx(vf,{id:"lg-password",type:"password",autoComplete:"current-password",value:o,onChange:m=>s(m.target.value),placeholder:"输入密码",disabled:d,$error:!!u&&!f})]}),u&&!f&&t.jsx(wf,{children:u}),t.jsx(f_,{type:"submit",disabled:d||!r.trim()||!o,children:d?t.jsxs(t.Fragment,{children:[t.jsx(g_,{}),"验证中..."]}):"登录"})]}),t.jsx(m_,{children:"AI Office 3.0 · AccountCenter 内部账号"})]})})}const x_=l.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #eef2f8 0%, #f5f8fc 60%, #e8eef7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
`,b_=wr`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`,y_=l.div`
  background: #ffffff;
  border: 1px solid #dde3ec;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(30, 50, 90, 0.10);
  padding: 40px 44px 36px;
  width: 420px;
  max-width: calc(100vw - 40px);
  animation: ${b_} 0.25s ease;
`,v_=l.div`
  text-align: center;
  font-size: 36px;
  margin-bottom: 8px;
`,w_=l.h2`
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: #1a3150;
  margin: 0 0 6px;
`,S_=l.p`
  text-align: center;
  font-size: 13px;
  color: #627385;
  margin: 0 0 24px;
  line-height: 1.6;
`,Ha=l.div`
  margin-bottom: 14px;
`,Ka=l.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #4a5f73;
  margin-bottom: 6px;
`,Ga=l.input`
  width: 100%;
  padding: 11px 13px;
  border: 1.5px solid ${e=>e.$error?"#e07070":"#d6e0ea"};
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  color: #1f3142;
  background: #ffffff;
  box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus {
    border-color: ${e=>e.$error?"#e07070":"#4a90d9"};
    box-shadow: 0 0 0 3px ${e=>e.$error?"rgba(224,112,112,0.12)":"rgba(74,144,217,0.12)"};
  }
  &:disabled { background: #f7f9fc; color: #9eafbf; }
`,qa=l.div`
  margin-top: 12px;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid ${e=>e.$error?"#f1c5c5":e.$ok?"#b7e4c7":"#f5d28a"};
  background: ${e=>e.$error?"#fff6f6":e.$ok?"#f0fff4":"#fffbf0"};
  color: ${e=>e.$error?"#b33838":e.$ok?"#276749":"#7a5a10"};
  font-size: 12px;
  line-height: 1.6;
`,k_=l.button`
  width: 100%;
  margin-top: 20px;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a6fd4, #1558b8);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover:not(:disabled) { opacity: 0.92; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`,j_=l.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 8px;
  border: 2px solid rgba(255,255,255,0.5);
  border-top-color: #fff;
  border-radius: 50%;
  vertical-align: middle;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;function I_(){const{state:e,changePassword:n,completeForcePasswordChange:r}=rn(),[i,o]=c.useState(""),[s,a]=c.useState(""),[d,u]=c.useState(""),[f,p]=c.useState(!1),[m,g]=c.useState(null),[h,x]=c.useState(!1),k=c.useRef(null),v=e.phase==="must_change_password"?e.session.user.username:"";c.useEffect(()=>{const j=setTimeout(()=>{var S;return(S=k.current)==null?void 0:S.focus()},80);return()=>clearTimeout(j)},[]);const y=c.useCallback(async j=>{if(j.preventDefault(),g(null),!i){g("请输入当前密码（初始密码：12345678）");return}if(s.length<8){g("新密码至少 8 位");return}if(s===i){g("新密码不能与当前密码相同");return}if(s!==d){g("两次输入的新密码不一致");return}p(!0);try{await n(i,s),x(!0),setTimeout(()=>r(),1200)}catch(S){g(S instanceof Error?S.message:"修改密码失败，请重试")}finally{p(!1)}},[i,s,d,n,r]);return t.jsx(x_,{children:t.jsxs(y_,{children:[t.jsx(v_,{children:"🔒"}),t.jsx(w_,{children:"首次登录，请修改密码"}),t.jsxs(S_,{children:["账号 ",t.jsx("strong",{children:v})," 初始密码为 ",t.jsx("code",{children:"12345678"}),"，",t.jsx("br",{}),"请立即设置新密码后进入 AI Office。"]}),h?t.jsx(qa,{$ok:!0,children:"✅ 密码修改成功，正在进入系统…"}):t.jsxs("form",{onSubmit:y,autoComplete:"off",children:[t.jsxs(Ha,{children:[t.jsx(Ka,{children:"当前密码（初始 12345678）"}),t.jsx(Ga,{ref:k,type:"password",value:i,onChange:j=>o(j.target.value),placeholder:"当前密码",disabled:f,$error:!!m&&!i,autoComplete:"current-password"})]}),t.jsxs(Ha,{children:[t.jsx(Ka,{children:"新密码（至少 8 位）"}),t.jsx(Ga,{type:"password",value:s,onChange:j=>a(j.target.value),placeholder:"新密码",disabled:f,$error:!!m&&s.length>0&&s.length<8,autoComplete:"new-password"})]}),t.jsxs(Ha,{children:[t.jsx(Ka,{children:"确认新密码"}),t.jsx(Ga,{type:"password",value:d,onChange:j=>u(j.target.value),placeholder:"再次输入新密码",disabled:f,$error:!!m&&!!d&&s!==d,autoComplete:"new-password"})]}),m&&t.jsx(qa,{$error:!0,children:m}),!m&&t.jsx(qa,{children:"⚠️ 修改完成前无法进入 AI Office 主界面"}),t.jsx(k_,{type:"submit",disabled:f||!i||!s||!d,children:f?t.jsxs(t.Fragment,{children:[t.jsx(j_,{}),"提交中…"]}):"修改密码并进入"})]})]})})}const $_=l.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f7f8fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
`,T_=l.div`
  padding: 10px 14px 8px;
  border-bottom: 1px solid #e5eaf0;
  background: #ffffff;
  flex-shrink: 0;
`,C_=l.input`
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border: 1.5px solid #d6e0ea;
  border-radius: 10px;
  font-size: 13px;
  color: #1f3142;
  background: #f9fbfd;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: #4a90d9; background: #fff; }
  &::placeholder { color: #b0bec5; }
`,P_=l.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
`,A_=l.div`
  width: 140px;
  border-right: 1px solid #e5eaf0;
  background: #ffffff;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 8px 0;
`,__=l.div`
  margin-bottom: 4px;
`,E_=l.div`
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  color: #9faebd;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`,Bi=l.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 7px 12px;
  font-size: 12px;
  color: ${e=>e.$active?"#1558b8":"#304255"};
  background: ${e=>e.$active?"#e8f0fe":"transparent"};
  border: none;
  border-left: 3px solid ${e=>e.$active?"#1558b8":"transparent"};
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { background: ${e=>e.$active?"#e8f0fe":"#f4f7fa"}; }
`,z_=l.div`
  flex: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
`,Sf=l.div`
  width: 260px;
  border-right: 1px solid #e5eaf0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
`,kf=l.div`
  padding: 10px 12px 6px;
  border-bottom: 1px solid #eef1f5;
  flex-shrink: 0;
`,jf=l.div`
  font-size: 12px;
  font-weight: 700;
  color: #627385;
`,If=l.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`,$f=l.div`
  padding: 9px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f4f8;
  background: ${e=>e.$active?"#e8f0fe":"transparent"};
  &:hover { background: ${e=>e.$active?"#e8f0fe":"#f4f8fe"}; }
`,Li=l.div`
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,Ni=l.div`
  font-size: 11px;
  color: #718096;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,Uo=l.span`
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 999px;
  font-weight: 700;
  margin-left: 4px;
  background: ${e=>e.$ok?"#d4edda":e.$warn?"#fff3cd":(e.$disabled,"#f0f0f0")};
  color: ${e=>e.$ok?"#155724":e.$warn?"#856404":e.$disabled?"#999":"#666"};
`,Ho=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f7f8fb;
  min-width: 0;
`,Ql=l.div`
  background: #ffffff;
  border: 1px solid #e5eaf0;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 2px 8px rgba(15,25,40,0.06);
`,ec=l.div`
  font-size: 18px;
  font-weight: 800;
  color: #1a3150;
  margin-bottom: 2px;
`,tc=l.div`
  font-size: 13px;
  color: #718096;
  margin-bottom: 12px;
`,Ko=l.div`
  margin-top: 14px;
  border-top: 1px solid #eef1f5;
  padding-top: 12px;
`,Xi=l.div`
  font-size: 11px;
  font-weight: 700;
  color: #9faebd;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`,Zt=l.div`
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
`,Qt=l.span`
  color: #718096;
  flex-shrink: 0;
  width: 90px;
`,Ht=l.span`
  color: #1a202c;
  word-break: break-all;
`,Go=l.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;
  background: ${e=>e.$status==="active"?"#d4edda":e.$status==="not_created"?"#fff3cd":e.$status==="failed"||e.$status==="disabled"?"#f8d7da":"#e2e8f0"};
  color: ${e=>e.$status==="active"?"#155724":e.$status==="not_created"?"#856404":e.$status==="failed"||e.$status==="disabled"?"#721c24":"#627385"};
`,On=l.div`
  padding: 40px 20px;
  text-align: center;
  color: #9faebd;
  font-size: 13px;
  line-height: 1.8;
`,Xh=l.div`
  padding: 20px;
  background: #fff6f6;
  border: 1px solid #f1c5c5;
  border-radius: 10px;
  color: #b33838;
  font-size: 13px;
  margin: 12px;
  line-height: 1.6;
`,ps=l.div`
  padding: 20px;
  text-align: center;
  color: #9faebd;
  font-size: 13px;
`,Va=l.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f4f8;
  background: ${e=>e.$active?"#e8f0fe":"transparent"};
  &:hover { background: ${e=>e.$active?"#e8f0fe":"#f4f8fe"}; }
`,Oi=l.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,Ya=l.div`
  flex: 1;
  min-width: 0;
`;function Wi(e){const n=e.trim();if(!n)return"?";if(/[\u4e00-\u9fff]/.test(n))return n.slice(-2);const r=n.split(/\s+/);return r.length>=2?(r[0][0]+r[r.length-1][0]).toUpperCase():n.slice(0,2).toUpperCase()}function xr(e){return e?e==="active"?"已开通":e==="not_created"?"未创建":e==="disabled"?"已禁用":e==="failed"?"创建失败":e:"未知"}function Rr(e,...n){if(!e.trim())return!0;const r=e.toLowerCase();return n.some(i=>i&&i.toLowerCase().includes(r))}function Ja({personId:e,token:n}){var g,h,x,k,v,y;const[r,i]=c.useState(null),[o,s]=c.useState(!1),[a,d]=c.useState(null);if(c.useEffect(()=>{e&&(s(!0),d(null),Gg(n,e).then(i).catch(j=>d(j instanceof Error?j.message:String(j))).finally(()=>s(!1)))},[e,n]),o)return t.jsx(ps,{children:"加载中…"});if(a)return t.jsxs(Xh,{children:["无法加载人员详情：",a]});if(!r)return null;const u=((g=r.formalMemberships)==null?void 0:g.find(j=>j.isPrimary))??((h=r.formalMemberships)==null?void 0:h[0]),f=((x=r.mailIdentity)==null?void 0:x.status)??"not_created",p=((k=r.chatIdentity)==null?void 0:k.status)??"not_created",m=((v=r.accountIdentity)==null?void 0:v.status)??"unknown";return t.jsxs(Ql,{children:[t.jsx(ec,{children:r.name}),r.enName&&t.jsx(tc,{children:r.enName}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"工号"}),t.jsx(Ht,{children:r.employeeId||"—"})]}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"职位"}),t.jsx(Ht,{children:r.position||"—"})]}),u&&t.jsxs(Zt,{children:[t.jsx(Qt,{children:"主要单位"}),t.jsx(Ht,{children:u.orgUnitName||u.orgUnitId})]}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"办公电话"}),t.jsx(Ht,{children:r.phone||"—"})]}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"办公地址"}),t.jsx(Ht,{children:r.officeAddress||"—"})]}),t.jsxs(Ko,{children:[t.jsx(Xi,{children:"正式所属单位"}),!r.formalMemberships||r.formalMemberships.length===0?t.jsx(Ht,{style:{fontSize:13,color:"#9faebd"},children:"暂无记录"}):r.formalMemberships.map((j,S)=>t.jsxs(Zt,{children:[t.jsx(Qt,{children:j.isPrimary?"主要单位":"所属单位"}),t.jsxs(Ht,{children:[j.orgUnitName||j.orgUnitId,j.role?` · ${j.role}`:""]})]},S))]}),r.projectMemberships&&r.projectMemberships.length>0&&t.jsxs(Ko,{children:[t.jsx(Xi,{children:"项目归属"}),r.projectMemberships.map((j,S)=>t.jsxs(Zt,{children:[t.jsx(Qt,{children:"项目组"}),t.jsxs(Ht,{children:[j.projectGroupName||j.projectGroupId,j.role?` · ${j.role}`:""]})]},S))]}),t.jsxs(Ko,{children:[t.jsx(Xi,{children:"邮箱信息"}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"AI Office 邮箱"}),t.jsxs(Ht,{children:[r.aiEmail||((y=r.mailIdentity)==null?void 0:y.aiEmail)||"—"," ",t.jsx(Go,{$status:f,children:xr(f)})]})]}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"原办公邮箱"}),t.jsx(Ht,{children:r.sourceEmail||"—"})]})]}),t.jsxs(Ko,{children:[t.jsx(Xi,{children:"账号状态"}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"登录账号"}),t.jsx(Ht,{children:t.jsx(Go,{$status:m,children:xr(m)})})]}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"内部通讯"}),t.jsx(Ht,{children:t.jsx(Go,{$status:p,children:xr(p)})})]}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"邮箱"}),t.jsx(Ht,{children:t.jsx(Go,{$status:f,children:xr(f)})})]})]})]})}function D_(){const e=go(),n=(e==null?void 0:e.token)??"",[r,i]=c.useState("all"),[o,s]=c.useState(""),[a,d]=c.useState(null),[u,f]=c.useState(null),[p,m]=c.useState(null),[g,h]=c.useState([]),[x,k]=c.useState([]),[v,y]=c.useState([]),[j,S]=c.useState([]),[z,P]=c.useState([]),[I,b]=c.useState([]),[$,O]=c.useState([]),[D,R]=c.useState(!1),[V,te]=c.useState(null),[q,W]=c.useState(!1),fe=c.useRef(null);c.useEffect(()=>{n&&(te(null),r==="all"?(R(!0),Al(n,{pageSize:500}).then(h).catch(A=>te(A instanceof Error?A.message:"无法连接账号中心，请检查 AccountCenter 服务状态。")).finally(()=>R(!1))):r==="by-dept"?(R(!0),Hg(n).then(k).catch(A=>te(A instanceof Error?A.message:"无法连接账号中心，请检查 AccountCenter 服务状态。")).finally(()=>R(!1))):r==="projects"?(R(!0),S1(n).then(y).catch(A=>te(A instanceof Error?A.message:"无法连接账号中心，请检查 AccountCenter 服务状态。")).finally(()=>R(!1))):r==="has-email"?(R(!0),qg(n).then(b).catch(A=>te(A instanceof Error?A.message:"无法连接账号中心，请检查 AccountCenter 服务状态。")).finally(()=>R(!1))):r==="has-chat"&&(R(!0),Vg(n).then(O).catch(A=>te(A instanceof Error?A.message:"无法连接账号中心，请检查 AccountCenter 服务状态。")).finally(()=>R(!1))))},[r,n]),c.useEffect(()=>{!n||!u||(W(!0),S([]),Kg(n,u).then(S).catch(()=>S([])).finally(()=>W(!1)))},[u,n]),c.useEffect(()=>{!n||!p||(W(!0),P([]),k1(n,p).then(P).catch(()=>P([])).finally(()=>W(!1)))},[p,n]);const le=c.useCallback(A=>{const ee=A.target.value;s(ee),r==="all"&&n&&ee.trim().length>=1&&(fe.current&&clearTimeout(fe.current),fe.current=setTimeout(()=>{Al(n,{q:ee.trim(),pageSize:200}).then(h).catch(()=>{})},350))},[r,n]),Q=c.useMemo(()=>g.filter(A=>Rr(o,A.name,A.enName,A.department,A.position,A.aiEmail,A.employeeId)),[g,o]),ge=c.useMemo(()=>x.filter(A=>Rr(o,A.name,A.enName)),[x,o]),J=c.useMemo(()=>v.filter(A=>Rr(o,A.name,A.enName,A.parentCandidate)),[v,o]),H=c.useMemo(()=>I.filter(A=>Rr(o,A.name,A.enName,A.aiEmail,A.department,A.position,A.employeeId,A.sourceEmail)),[I,o]),T=c.useMemo(()=>$.filter(A=>Rr(o,A.name,A.enName,A.department,A.position,A.employeeId,A.aiEmail)),[$,o]),w=c.useMemo(()=>j.filter(A=>Rr(o,A.name,A.enName,A.position,A.aiEmail)),[j,o]),L=c.useMemo(()=>z.filter(A=>Rr(o,A.name,A.enName,A.position,A.aiEmail)),[z,o]),N=()=>n?D?t.jsx(ps,{children:"加载中…"}):V?t.jsx(Xh,{children:V}):r==="by-dept"?ge.length===0?t.jsx(On,{children:"暂无通讯录数据，请先在 AccountCenter 导入人员。"}):t.jsx(t.Fragment,{children:ge.map(A=>t.jsxs($f,{$active:u===A.orgUnitId,onClick:()=>{f(A.orgUnitId),d(null),m(null)},children:[t.jsx(Li,{children:A.name}),t.jsxs(Ni,{children:[A.enName||"",A.memberCount!=null?` · ${A.memberCount} 人`:""]})]},A.orgUnitId))}):r==="projects"?J.length===0?t.jsx(On,{children:"暂无项目组数据"}):t.jsx(t.Fragment,{children:J.map(A=>t.jsxs($f,{$active:p===A.projectGroupId,onClick:()=>{m(A.projectGroupId),d(null),f(null)},children:[t.jsx(Li,{children:A.name}),t.jsxs(Ni,{children:[A.enName||"",A.parentCandidate?` · ${A.parentCandidate}`:"",A.memberCount!=null?` · ${A.memberCount} 人`:""]})]},A.projectGroupId))}):r==="has-email"?H.length===0?t.jsx(On,{children:"暂无已开通邮箱的人员"}):t.jsx(t.Fragment,{children:H.map(A=>t.jsxs(Va,{$active:a===A.personId,onClick:()=>d(A.personId),children:[t.jsx(Oi,{children:Wi(A.name)}),t.jsxs(Ya,{children:[t.jsxs(Li,{children:[A.name,A.enName?t.jsxs("span",{style:{fontWeight:400,color:"#718096"},children:[" ",A.enName]}):null]}),t.jsxs(Ni,{children:[A.aiEmail,t.jsx(Uo,{$ok:A.mailboxStatus==="active",$warn:A.mailboxStatus==="not_created",$disabled:A.mailboxStatus==="disabled"||A.mailboxStatus==="failed",children:xr(A.mailboxStatus)})]})]})]},A.personId))}):r==="has-chat"?T.length===0?t.jsx(On,{children:"暂无已开通内部通讯的人员"}):t.jsx(t.Fragment,{children:T.map(A=>t.jsxs(Va,{$active:a===A.personId,onClick:()=>d(A.personId),children:[t.jsx(Oi,{children:Wi(A.name)}),t.jsxs(Ya,{children:[t.jsxs(Li,{children:[A.name,A.enName?t.jsxs("span",{style:{fontWeight:400,color:"#718096"},children:[" ",A.enName]}):null]}),t.jsxs(Ni,{children:[A.department||A.position||"",t.jsx(Uo,{$ok:A.chatStatus==="active",$warn:A.chatStatus==="not_created",children:xr(A.chatStatus)})]})]})]},A.personId))}):Q.length===0?t.jsx(On,{children:"暂无通讯录数据，请先在 AccountCenter 导入人员。"}):t.jsx(t.Fragment,{children:Q.map(A=>t.jsxs(Va,{$active:a===A.personId,onClick:()=>d(A.personId),children:[t.jsx(Oi,{children:Wi(A.name)}),t.jsxs(Ya,{children:[t.jsxs(Li,{children:[A.name,A.enName?t.jsxs("span",{style:{fontWeight:400,color:"#718096"},children:[" ",A.enName]}):null]}),t.jsxs(Ni,{children:[A.department?`${A.department}`:"",A.position?` · ${A.position}`:""]})]})]},A.personId))}):t.jsx(On,{children:"请先登录账号中心"}),M=()=>{if(r==="by-dept"&&u){const A=x.find(ee=>ee.orgUnitId===u);return t.jsxs(Ho,{children:[A&&t.jsxs(Ql,{style:{marginBottom:14},children:[t.jsx(ec,{children:A.name}),A.enName&&t.jsx(tc,{children:A.enName}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"成员数量"}),t.jsxs(Ht,{children:[A.memberCount??w.length," 人"]})]})]}),q?t.jsx(ps,{children:"加载成员中…"}):w.length===0?t.jsx(On,{children:"该组织单位暂无成员"}):w.map(ee=>t.jsxs("div",{style:{background:a===ee.personId?"#e8f0fe":"#fff",border:"1px solid #e5eaf0",borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12},onClick:()=>d(ee.personId),children:[t.jsx(Oi,{children:Wi(ee.name)}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsxs("div",{style:{fontSize:13,fontWeight:600,color:"#1a202c"},children:[ee.name,ee.enName?t.jsxs("span",{style:{fontWeight:400,color:"#718096"},children:[" ",ee.enName]}):null]}),t.jsxs("div",{style:{fontSize:11,color:"#718096",marginTop:2},children:[ee.position||"",ee.aiEmail?` · ${ee.aiEmail}`:""]})]}),t.jsxs("div",{children:[t.jsxs(Uo,{$ok:ee.mailboxStatus==="active",$warn:ee.mailboxStatus==="not_created",children:["邮箱 ",xr(ee.mailboxStatus)]}),t.jsxs(Uo,{$ok:ee.chatStatus==="active",$warn:ee.chatStatus==="not_created",style:{marginLeft:4},children:["通讯 ",xr(ee.chatStatus)]})]})]},ee.personId)),a&&t.jsxs("div",{style:{marginTop:16},children:[t.jsx(Xi,{style:{marginBottom:8,color:"#9faebd",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px"},children:"人员详情"}),t.jsx(Ja,{personId:a,token:n})]})]})}if(r==="projects"&&p){const A=v.find(ee=>ee.projectGroupId===p);return t.jsxs(Ho,{children:[A&&t.jsxs(Ql,{style:{marginBottom:14},children:[t.jsx(ec,{children:A.name}),A.enName&&t.jsx(tc,{children:A.enName}),A.parentCandidate&&t.jsxs(Zt,{children:[t.jsx(Qt,{children:"上级候选"}),t.jsx(Ht,{children:A.parentCandidate})]}),t.jsxs(Zt,{children:[t.jsx(Qt,{children:"成员数量"}),t.jsxs(Ht,{children:[A.memberCount??L.length," 人"]})]})]}),q?t.jsx(ps,{children:"加载成员中…"}):L.length===0?t.jsx(On,{children:"该项目组暂无成员"}):L.map(ee=>t.jsxs("div",{style:{background:a===ee.personId?"#e8f0fe":"#fff",border:"1px solid #e5eaf0",borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12},onClick:()=>d(ee.personId),children:[t.jsx(Oi,{children:Wi(ee.name)}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsxs("div",{style:{fontSize:13,fontWeight:600,color:"#1a202c"},children:[ee.name,ee.enName?t.jsxs("span",{style:{fontWeight:400,color:"#718096"},children:[" ",ee.enName]}):null]}),t.jsxs("div",{style:{fontSize:11,color:"#718096",marginTop:2},children:[ee.position||"",ee.role?` · ${ee.role}`:""]})]})]},ee.personId)),a&&t.jsx("div",{style:{marginTop:16},children:t.jsx(Ja,{personId:a,token:n})})]})}return a?t.jsx(Ho,{children:t.jsx(Ja,{personId:a,token:n})}):t.jsx(Ho,{children:t.jsx(On,{children:"点击左侧人员或组织单位查看详情"})})};return t.jsxs($_,{children:[t.jsx(T_,{children:t.jsx(C_,{placeholder:"搜索姓名 / 部门 / 职位 / 邮箱 / 工号",value:o,onChange:le})}),t.jsxs(P_,{children:[t.jsx(A_,{children:t.jsxs(__,{children:[t.jsx(E_,{children:"通讯录"}),t.jsx(Bi,{$active:r==="all",onClick:()=>{i("all"),d(null),f(null),m(null)},children:"全部人员"}),t.jsx(Bi,{$active:r==="by-dept",onClick:()=>{i("by-dept"),d(null)},children:"按部门"}),t.jsx(Bi,{$active:r==="projects",onClick:()=>{i("projects"),d(null)},children:"项目组"}),t.jsx(Bi,{$active:r==="has-email",onClick:()=>{i("has-email"),d(null)},children:"已开通邮箱"}),t.jsx(Bi,{$active:r==="has-chat",onClick:()=>{i("has-chat"),d(null)},children:"已开通通讯"})]})}),t.jsxs(z_,{children:[r!=="by-dept"&&r!=="projects"&&t.jsxs(Sf,{children:[t.jsx(kf,{children:t.jsxs(jf,{children:[r==="all"&&`全部人员 (${Q.length})`,r==="has-email"&&`已开通邮箱 (${H.length})`,r==="has-chat"&&`已开通内部通讯 (${T.length})`,r==="recent"&&"最近会话"]})}),t.jsx(If,{children:N()})]}),(r==="by-dept"||r==="projects")&&t.jsxs(Sf,{children:[t.jsx(kf,{children:t.jsxs(jf,{children:[r==="by-dept"&&`组织单位 (${ge.length})`,r==="projects"&&`项目组 (${J.length})`]})}),t.jsx(If,{children:N()})]}),M()]})]})]})}const R_=wr`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`,M_=l.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #eef2f8 0%, #f5f8fc 60%, #e8eef7 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  overflow: hidden;
`,F_=l.div`
  background: #ffffff;
  border: 1px solid #dde3ec;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(30, 50, 90, 0.10), 0 1px 4px rgba(30, 50, 90, 0.06);
  padding: 44px 44px 36px;
  width: 480px;
  max-width: calc(100vw - 40px);
  animation: ${R_} 0.25s ease;
`,B_=l.div`
  text-align: center;
  margin-bottom: 32px;
`,L_=l.div`
  font-size: 40px;
  margin-bottom: 12px;
`,N_=l.div`
  font-size: 26px;
  font-weight: 800;
  color: #1a3150;
  letter-spacing: -0.5px;
  margin-bottom: 10px;
`,O_=l.div`
  font-size: var(--font-size-sm);
  color: #627385;
  line-height: 1.7;
`,W_=l.div`
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
`,Tf=l.button`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: #1f6fd6;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  &:hover:not(:disabled) { background: #1760bc; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,Cf=l.button`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px 16px;
  border: 1px solid #c8d6e8;
  border-radius: 10px;
  background: #ffffff;
  color: #304255;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  &:hover:not(:disabled) { background: #f0f6ff; border-color: #a8c4e0; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,U_=l.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 24px;
`,H_=l.input`
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #b8ccdf;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  color: #213346;
  outline: none;
  &:focus { border-color: #1f6fd6; box-shadow: 0 0 0 3px rgba(31,111,214,0.10); }
`,K_=l.div`
  margin-top: 4px;
`,G_=l.div`
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #8094a8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
`,q_=l.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #e2eaf4;
  background: #f7fafd;
  cursor: pointer;
  text-align: left;
  margin-bottom: 6px;
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: #eaf2ff; border-color: #b0cce8; }
`,V_=l.div`
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #213346;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,Y_=l.div`
  font-size: var(--font-size-xs);
  color: #8094a8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 1px;
`,J_=l.div`
  font-size: var(--font-size-xs);
  color: #c0392b;
  margin-bottom: 12px;
  text-align: center;
`;function X_(){const{workspaces:e,openWorkspace:n,createWorkspace:r,loading:i}=Ft(),[o,s]=c.useState(!1),[a,d]=c.useState(""),[u,f]=c.useState(!1),[p,m]=c.useState(null),g=async()=>{var x,k;m(null);try{const v=await((k=(x=window.electronAPI).openDirectoryDialog)==null?void 0:k.call(x));if(!v)return;await n(v)}catch{m("打开工作区失败，请重试。")}},h=async()=>{if(a.trim()){f(!0),m(null);try{const x=await r(a.trim());x?(await n(x),s(!1),d("")):m("创建工作区失败，请重试。")}catch{m("创建工作区失败，请重试。")}finally{f(!1)}}};return t.jsx(M_,{children:t.jsxs(F_,{children:[t.jsxs(B_,{children:[t.jsx(L_,{children:"📁"}),t.jsx(N_,{children:"选择工作区"}),t.jsxs(O_,{children:["工作区用于保存你生成的文稿、PPT、图片和分析结果。",t.jsx("br",{}),"请新建或打开一个工作区以继续使用 AI-Office。"]})]}),o?t.jsxs(U_,{children:[t.jsx(H_,{autoFocus:!0,placeholder:"输入工作区名称...",value:a,onChange:x=>d(x.target.value),onKeyDown:x=>{x.key==="Enter"&&h(),x.key==="Escape"&&(s(!1),d(""))}}),t.jsxs(Tf,{onClick:()=>void h(),disabled:!a.trim()||u,style:{flex:"none",padding:"10px 18px"},children:[t.jsx(yr,{size:14}),"创建"]}),t.jsx(Cf,{onClick:()=>{s(!1),d("")},style:{flex:"none",padding:"10px 14px"},children:"取消"})]}):t.jsxs(W_,{children:[t.jsxs(Tf,{onClick:()=>s(!0),children:[t.jsx(yr,{size:15}),"新建工作区"]}),t.jsxs(Cf,{onClick:()=>void g(),disabled:i,children:[t.jsx(Vn,{size:15}),"打开已有工作区"]})]}),p&&t.jsx(J_,{children:p}),e.length>0&&t.jsxs(K_,{children:[t.jsx(G_,{children:"最近使用"}),e.slice(0,5).map(x=>t.jsxs(q_,{onClick:()=>void n(x.path),children:[t.jsx(br,{size:15,style:{color:"#dcb67a",flexShrink:0}}),t.jsxs("div",{style:{overflow:"hidden",flex:1},children:[t.jsx(V_,{children:x.name}),t.jsx(Y_,{children:x.path})]})]},x.path))]})]})})}const Zh={home:!0,work:!0,learning:!0,life:!0,resources:!0,skills:!0,communication:!0,settings:!0},Z_="/home",Q_=[{section:"home",label:"首页",title:"首页",icon:eb,featureKey:"home"},{section:"work",label:"工作",title:"工作",icon:qm,featureKey:"work"},{section:"study",label:"学习",title:"学习",icon:Or,featureKey:"learning"},{section:"life",label:"生活",title:"生活",icon:Vm,featureKey:"life"},{section:"resource",label:"资源",title:"资源",icon:Vn,featureKey:"resources"},{section:"skill-center",label:"Skill",title:"Skill 中心",icon:tb,featureKey:"skills"},{section:"chat",label:"通讯",title:"通讯",icon:nb,featureKey:"communication"}],eE=Q_.filter(e=>Zh[e.featureKey]),tE=l.nav`
  width: 84px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a2840 0%, #1e3252 100%);
  border-right: 1px solid #14213a;
  overflow: hidden;
`,nE=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  gap: 2px;
`,rE=l.div`
  display: flex;
  flex-direction: column;
  padding: 6px 0 12px;
  gap: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`,Xa=l.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  min-height: 70px;
  padding: 12px 4px;
  border: none;
  border-radius: 0;
  background: ${e=>e.$active?"rgba(31, 111, 214, 0.85)":"transparent"};
  color: ${e=>e.$active?"#ffffff":"rgba(200, 215, 235, 0.78)"};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  position: relative;

  &:hover {
    background: ${e=>e.$active?"rgba(31, 111, 214, 0.9)":"rgba(255, 255, 255, 0.08)"};
    color: ${e=>e.$active?"#ffffff":"#d8e8f5"};
  }

  &::before {
    content: '';
    display: ${e=>e.$active?"block":"none"};
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 20%;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: #5badff;
  }
`,Za=l.span`
  font-size: var(--font-size-sm);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.01em;
`,iE=l.div`
  padding: 14px 0 10px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(180, 200, 225, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
`;function oE({section:e,onNavigate:n,username:r}){return t.jsxs(tE,{children:[t.jsx(iE,{children:"AI·OFFICE"}),t.jsx(nE,{children:eE.map(({section:i,label:o,title:s,icon:a})=>t.jsxs(Xa,{$active:e===i,onClick:()=>n(i),title:s,children:[t.jsx(a,{size:22}),t.jsx(Za,{children:o})]},i))}),t.jsxs(rE,{children:[t.jsxs(Xa,{$active:e==="settings",onClick:()=>n("settings"),title:"设置",children:[t.jsx(Hm,{size:22}),t.jsx(Za,{children:"设置"})]}),t.jsxs(Xa,{$active:e==="account",onClick:()=>n("account"),title:r||"账号",children:[t.jsx(cc,{size:22}),t.jsx(Za,{children:r?r.slice(0,3):"账号"})]})]})]})}const sE=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background: #f4f7fc;
  padding: 48px 64px;
`,aE=l.div`
  margin-bottom: 44px;
  text-align: center;
`,lE=l.h1`
  margin: 0 0 10px;
  font-size: 36px;
  font-weight: 800;
  color: #1a2f47;
`,cE=l.p`
  margin: 0;
  font-size: 16px;
  color: #6b7f94;
`,dE=l.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(320px, 1fr));
  gap: 32px;
  width: 100%;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`,uE=l.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 36px 32px 28px;
  min-height: clamp(260px, 30vh, 360px);
  border: 1.5px solid ${e=>e.$accentBg};
  border-radius: 18px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;

  &:hover {
    border-color: ${e=>e.$accent};
    box-shadow: 0 8px 36px rgba(0,0,0,0.11);
    transform: translateY(-4px);
  }
`,pE=l.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${e=>e.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  flex-shrink: 0;
`,fE=l.div`
  font-size: 20px;
  font-weight: 800;
  color: #1a2f47;
  margin-bottom: 10px;
`,mE=l.div`
  font-size: 14px;
  color: #6b7f94;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
`,gE=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`,hE=l.span`
  display: inline-block;
  padding: 5px 14px;
  border-radius: 999px;
  background: ${e=>e.$accentBg};
  color: ${e=>e.$accent};
  font-size: var(--font-size-xs);
  font-weight: 600;
`,xE=l.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 36px;
  padding: 14px 24px;
  background: #ffffff;
  border: 1px solid #dde6f0;
  border-radius: 12px;
  width: 100%;
`,bE=l.span`
  font-size: 14px;
  color: #6b7f94;
  flex-shrink: 0;
`,yE=l.span`
  font-size: 14px;
  font-weight: 700;
  color: #1a2f47;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`,vE=l.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border: 1px solid #c8d6e8;
  border-radius: 8px;
  background: #f4f7fb;
  color: #3d5a78;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.13s, border-color 0.13s;
  &:hover { background: #e6f0fb; border-color: #96b8dc; }
`,wE=[{featureKey:"work",section:"work",accent:"#1f6fd6",accentBg:"#e6f0fc",iconBg:"#deeeff",icon:t.jsx(qm,{size:30,color:"#1f6fd6"}),title:"工作",desc:"文稿、PPT、邮件、图片与办公资料",chips:["文稿","PPT","邮件","图片"]},{featureKey:"learning",section:"study",accent:"#1a7a4a",accentBg:"#e4f5ec",iconBg:"#d5f0e2",icon:t.jsx(Or,{size:30,color:"#1a7a4a"}),title:"学习",desc:"作业解析、课程学习与科学研究",chips:["作业解析","AI课堂","课程资料","科学研究"]},{featureKey:"life",section:"life",accent:"#c05c15",accentBg:"#fdf0e6",iconBg:"#fce5cf",icon:t.jsx(Vm,{size:30,color:"#c05c15"}),title:"生活",desc:"兴趣创作、个人记录与轻量社区",chips:["AI论坛","轻量写作","图片创作","生活记录"]}];function SE({onNavigate:e}){const{activeWorkspaceName:n,activeWorkspacePath:r,closeWorkspace:i}=Ft(),o=wE.filter(s=>Zh[s.featureKey]);return t.jsxs(sE,{children:[t.jsxs(aE,{children:[t.jsx(lE,{children:"AI-Office 个人工作台"}),t.jsx(cE,{children:"围绕工作、学习、生活三个场景组织你的 AI 能力"})]}),t.jsx(dE,{children:o.map(s=>t.jsxs(uE,{$accent:s.accent,$accentBg:s.accentBg,onClick:()=>e(s.section),children:[t.jsx(pE,{$bg:s.iconBg,children:s.icon}),t.jsx(fE,{children:s.title}),t.jsx(mE,{children:s.desc}),t.jsx(gE,{children:s.chips.map(a=>t.jsx(hE,{$accent:s.accent,$accentBg:s.accentBg,children:a},a))})]},s.featureKey))}),n&&t.jsxs(xE,{children:[t.jsx(bE,{children:"当前工作区："}),t.jsx(yE,{title:r??void 0,children:n}),t.jsxs(vE,{onClick:i,children:[t.jsx(Mn,{size:11}),"切换工作区"]})]})]})}const po={blue:{border:"#d4e2f0",iconBg:"#deeeff",iconColor:"#1f6fd6",btn:"#1f6fd6"},green:{border:"#cce9d8",iconBg:"#d5f0e2",iconColor:"#1a7a4a",btn:"#1a7a4a"},orange:{border:"#f0d9c4",iconBg:"#fce5cf",iconColor:"#c05c15",btn:"#c05c15"},purple:{border:"#ddd0f5",iconBg:"#ede4ff",iconColor:"#7c4dff",btn:"#7c4dff"},teal:{border:"#c4e8e4",iconBg:"#d0f0ec",iconColor:"#00897b",btn:"#00897b"},gray:{border:"#e2e8f0",iconBg:"#f0f4f8",iconColor:"#607080",btn:"#607080"},indigo:{border:"#c7d2fe",iconBg:"#e0e7ff",iconColor:"#4338ca",btn:"#4338ca"}},kE=l.button`
  width: 100%;
  min-height: 96px;
  padding: 20px 24px;
  border: 1.5px solid ${e=>po[e.$accent].border};
  border-radius: 18px;
  background: ${e=>e.$disabled?"#f9fafb":"#ffffff"};
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: 20px;
  cursor: ${e=>e.$disabled?"default":"pointer"};
  text-align: left;
  transition: border-color 0.14s, box-shadow 0.14s, background 0.14s;
  opacity: ${e=>e.$disabled?.55:1};

  ${e=>!e.$disabled&&`
    &:hover {
      border-color: ${po[e.$accent].btn};
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      background: #fafcff;
    }
  `}
`,jE=l.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: ${e=>po[e.$accent].iconBg};
  color: ${e=>po[e.$accent].iconColor};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,IE=l.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
`,$E=l.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`,TE=l.span`
  font-size: 17px;
  font-weight: 700;
  color: #1a2f47;
  line-height: 1.2;
`,CE=l.span`
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: ${e=>e.$kind==="requiresNetwork"?"#e8f0fc":e.$kind==="comingSoon"?"#fdf0e2":"#f0f2f5"};
  color: ${e=>e.$kind==="requiresNetwork"?"#1f5fb4":e.$kind==="comingSoon"?"#a05c10":"#7a8898"};
`,PE=l.span`
  font-size: 14px;
  color: #6b7f94;
  line-height: 1.5;
`,AE=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`,_E=l.span`
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: #f0f4fa;
  color: #4a6080;
`,EE=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`,zE=l.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 18px;
  border-radius: 10px;
  background: ${e=>e.$disabled?"#e8edf4":po[e.$accent].btn};
  color: ${e=>e.$disabled?"#9aaab8":"#ffffff"};
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
`;function DE(e){return e==="comingSoon"?"即将接入":e==="requiresNetwork"?"需要网络":e==="disabled"?"不可用":null}function Et({icon:e,title:n,description:r,tags:i,status:o="available",accent:s="blue",actionLabel:a="进入",onClick:d}){const u=o==="comingSoon"||o==="disabled",f=DE(o);return t.jsxs(kE,{$disabled:u,$accent:s,onClick:u?void 0:d,children:[t.jsx(jE,{$accent:s,children:e}),t.jsxs(IE,{children:[t.jsxs($E,{children:[t.jsx(TE,{children:n}),f&&t.jsx(CE,{$kind:o,children:f})]}),t.jsx(PE,{children:r}),i&&i.length>0&&t.jsx(AE,{children:i.map(p=>t.jsx(_E,{children:p},p))})]}),t.jsx(EE,{children:t.jsxs(zE,{$accent:s,$disabled:u,children:[u?"待接入":a,!u&&t.jsx(qn,{size:15})]})})]})}const RE=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background: #f4f7fc;
  padding: 40px 56px;
`,ME=l.div`
  margin-bottom: 28px;
  flex-shrink: 0;
`,FE=l.h1`
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 800;
  color: #1a2f47;
`,BE=l.p`
  margin: 0;
  font-size: 14px;
  color: #6b7f94;
`,LE=l.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
`;function NE({onGoToWorkspace:e,onNavigate:n}){const{enterFreeMode:r,enterEmailMode:i,enterDataMode:o,enterPptGenerationMode:s}=Cn(),a=d=>{d(),e()};return t.jsxs(RE,{children:[t.jsxs(ME,{children:[t.jsx(FE,{children:"工作场景"}),t.jsx(BE,{children:"文稿编辑、邮件收发、日程管理、数据分析与 PPT 生成"})]}),t.jsxs(LE,{children:[t.jsx(Et,{icon:t.jsx(xn,{size:24}),title:"文稿编辑",description:"新建、编辑、生成和导出文稿 / PPT / 模板材料",accent:"blue",actionLabel:"进入",onClick:()=>a(r)}),t.jsx(Et,{icon:t.jsx(rb,{size:24}),title:"邮件收发",description:"收发邮件、新建邮件、AI 预回复和附件管理",accent:"purple",actionLabel:"进入",onClick:()=>a(i)}),t.jsx(Et,{icon:t.jsx(Ym,{size:24}),title:"日程管理",description:"AI识别邮件中的会议、截止事项和候选时间，自动生成日程并检测时间冲突",accent:"indigo",actionLabel:"进入",onClick:()=>n("calendar")}),t.jsx(Et,{icon:t.jsx(Jm,{size:24}),title:"数据分析",description:"分析表格、生成图表、整理数据结论",accent:"teal",actionLabel:"进入",onClick:()=>a(o)}),t.jsx(Et,{icon:t.jsx(ib,{size:24}),title:"PPT 生成",description:"根据主题、资料和模板生成演示文稿，支持 Skill 模板",accent:"orange",actionLabel:"进入",onClick:()=>a(s)})]})]})}const OE=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background: #f4f7fc;
  padding: 40px 56px;
`,WE=l.div`
  margin-bottom: 28px;
  flex-shrink: 0;
`,UE=l.h1`
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 800;
  color: #1a2f47;
`,HE=l.p`
  margin: 0;
  font-size: 14px;
  color: #6b7f94;
`,KE=l.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
`;function GE({onGoToWorkspace:e}){const{enterHomeworkMode:n,enterAiClassMode:r,enterDocumentGenerationMode:i,enterImageGenerationMode:o}=Cn(),s=a=>{a(),e()};return t.jsxs(OE,{children:[t.jsxs(WE,{children:[t.jsx(UE,{children:"学习场景"}),t.jsx(HE,{children:"作业解析、课程学习与科学研究辅助"})]}),t.jsxs(KE,{children:[t.jsx(Et,{icon:t.jsx(ob,{size:24}),title:"作业解析",description:"上传或输入题目，获得解题思路、步骤和答案",accent:"green",actionLabel:"作业解析",onClick:()=>s(n)}),t.jsx(Et,{icon:t.jsx(sb,{size:24}),title:"AI 课堂",description:"进入课程学习和 AI 辅助讲解，需要网络连接",accent:"green",status:"requiresNetwork",actionLabel:"进入课堂",onClick:()=>s(r)}),t.jsx(Et,{icon:t.jsx(ab,{size:24}),title:"论文写作",description:"生成论文初稿、修改论文结构和整理参考文献",accent:"blue",actionLabel:"论文写作",onClick:()=>s(i)}),t.jsx(Et,{icon:t.jsx(Jm,{size:24}),title:"数据图表",description:"生成科研图表和数据可视化，辅助科研汇报",accent:"blue",actionLabel:"生成图表",onClick:()=>s(o)}),t.jsx(Et,{icon:t.jsx(Vn,{size:24}),title:"课程资料",description:"管理和引用课程资料、讲义和参考文件",accent:"green",status:"comingSoon"}),t.jsx(Et,{icon:t.jsx(lb,{size:24}),title:"知识整理",description:"整理笔记、资料和知识点，构建个人知识库",accent:"green",status:"comingSoon"}),t.jsx(Et,{icon:t.jsx(cb,{size:24}),title:"文献资料",description:"管理文献、论文和阅读材料，支持 PDF 解析",accent:"blue",status:"comingSoon"})]})]})}const qE=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background: #fdf8f4;
  padding: 40px 56px;
`,VE=l.div`
  margin-bottom: 28px;
  flex-shrink: 0;
`,YE=l.h1`
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 800;
  color: #2d1f0f;
`,JE=l.p`
  margin: 0;
  font-size: 14px;
  color: #8a6f58;
`,XE=l.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
`;function ZE({onGoToWorkspace:e}){const{enterAiForumMode:n,enterFreeMode:r,enterImageGenerationMode:i,enterDailyFeedMode:o}=Cn(),s=a=>{a(),e()};return t.jsxs(qE,{children:[t.jsxs(VE,{children:[t.jsx(YE,{children:"生活场景"}),t.jsx(JE,{children:"兴趣创作、个人记录与轻量社区"})]}),t.jsxs(XE,{children:[t.jsx(Et,{icon:t.jsx(db,{size:24}),title:"AI 论坛",description:"连接在线社区，浏览和参与讨论内容",accent:"orange",status:"requiresNetwork",actionLabel:"打开论坛",onClick:()=>s(n)}),t.jsx(Et,{icon:t.jsx(Xm,{size:24}),title:"轻量写作",description:"自由写作、随笔和日常表达，轻松记录想法",accent:"orange",actionLabel:"开始写作",onClick:()=>s(r)}),t.jsx(Et,{icon:t.jsx(ub,{size:24}),title:"图片创作",description:"生成生活图片、头像、海报和创意图",accent:"orange",actionLabel:"创作图片",onClick:()=>s(i)}),t.jsx(Et,{icon:t.jsx(pb,{size:24}),title:"科学资讯",description:"浏览最新科研动态，阅读科学解读文章（需要网络连接）",accent:"orange",status:"requiresNetwork",actionLabel:"科学资讯",onClick:()=>s(o)}),t.jsx(Et,{icon:t.jsx(fb,{size:24}),title:"生活记录",description:"记录日常想法、计划和备忘，管理个人日志",accent:"orange",status:"comingSoon"}),t.jsx(Et,{icon:t.jsx(mb,{size:24}),title:"兴趣创作",description:"围绕兴趣主题进行创意生成和内容探索",accent:"orange",status:"comingSoon"}),t.jsx(Et,{icon:t.jsx(gb,{size:24}),title:"放松助手",description:"提供轻量陪伴和放松内容，调节工作节奏",accent:"orange",status:"comingSoon"})]})]})}const Pf={notice:"通知",report:"报告",briefing:"汇报",proposal:"方案",minutes:"纪要",contract:"合同",letter:"函件",regulation:"制度",plan:"计划",summary:"总结",manual:"手册",academic:"论文",other:"其他"},QE=l.div`
  flex: ${e=>e.$embedded?"1 1 auto":"0 0 320px"};
  width: ${e=>e.$embedded?"100%":"auto"};
  height: ${e=>e.$embedded?"100%":"auto"};
  min-height: 0;
  border-top: ${e=>e.$embedded?"none":"1px solid #dce5ef"};
  background: linear-gradient(180deg, #fbfdff 0%, #f3f8fd 100%);
  color: #233648;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: ${e=>e.$embedded?"hidden":"auto"};
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(110, 135, 164, 0.45) rgba(148, 167, 190, 0.12);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(148, 167, 190, 0.1);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(110, 135, 164, 0.35);
    border-radius: 999px;
    border: 2px solid rgba(248, 251, 255, 0.9);
  }
`,e5=l.div`
  padding: 8px 12px 6px;
  display: grid;
  gap: 6px;
  border-bottom: 1px solid #e3ebf3;
  background: rgba(255, 255, 255, 0.88);
`,t5=l.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`,n5=l.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`,r5=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  letter-spacing: 0.04em;
`,i5=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.45;
  color: #607487;
`,o5=l.input`
  width: 100%;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #d7e2ed;
  background: #ffffff;
  color: #213346;
  padding: 0 12px;
  outline: none;
  font-size: var(--font-size-xs);

  &::placeholder {
    color: #8b9caf;
  }

  &:focus {
    border-color: #98b7d6;
    box-shadow: 0 0 0 3px rgba(62, 126, 197, 0.1);
  }
`,s5=l.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`,Af=l.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`,_f=l.button`
  min-height: 28px;
  border-radius: 9px;
  border: 1px solid ${({$accent:e})=>e?"#a8c8ea":"#dbe5ef"};
  background: ${({$accent:e})=>e?"#edf6ff":"#ffffff"};
  color: ${({$accent:e})=>e?"#16476f":"#607487"};
  padding: 0 10px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({$accent:e})=>e?"#e5f1fe":"#f5f9fd"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,Qh=l.select`
  min-height: 28px;
  border-radius: 9px;
  border: 1px solid #dbe5ef;
  background: #ffffff;
  color: #35516d;
  padding: 0 10px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  outline: none;
  cursor: pointer;
`,a5=l(Qh)`
  min-width: 124px;
`,Ef=l.button`
  min-height: 28px;
  border-radius: 9px;
  border: 1px solid ${({$active:e})=>e?"#9fc5e8":"#dbe5ef"};
  background: ${({$active:e})=>e?"#eaf4ff":"#ffffff"};
  color: ${({$active:e})=>e?"#17456d":"#607487"};
  padding: 0 10px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({$active:e})=>e?"#e3f0ff":"#f5f9fd"};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,l5=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`,qo=l.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid ${({$accent:e})=>e?"#bcd7f3":"#dfe8f1"};
  background: ${({$accent:e})=>e?"#e9f4ff":"#ffffff"};
  color: ${({$accent:e})=>e?"#17456d":"#607487"};
  font-size: var(--font-size-xs);
  font-weight: 700;
`,c5=l.div`
  flex: 1 1 auto;
  min-height: 140px;
  overflow: auto;
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  scrollbar-width: thin;
  scrollbar-color: rgba(110, 135, 164, 0.45) rgba(148, 167, 190, 0.12);
`,d5=l.div`
  display: grid;
  gap: 8px;
`,u5=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`,p5=l.div`
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #6d8196;
`,Qa=l.div`
  font-size: var(--font-size-xs);
  color: #8a9caf;
`,f5=l.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(182px, 1fr));
  align-items: stretch;
`,m5=l.div`
  border-radius: 14px;
  border: 1px dashed #cfdbea;
  background: #ffffff;
  padding: 14px;
  font-size: var(--font-size-xs);
  line-height: 1.75;
  color: #667b8f;
`,g5=l.div`
  border-radius: 12px;
  border: 1px solid ${({$selected:e,$active:n})=>e?"#bed9f3":n?"#d9e6f4":"#e2eaf2"};
  background: ${({$selected:e,$active:n})=>e?"linear-gradient(180deg, #f4f9ff 0%, #edf5ff 100%)":n?"linear-gradient(180deg, #fbfdff 0%, #f3f8fd 100%)":"#ffffff"};
  box-shadow: ${({$selected:e})=>e?"0 4px 12px rgba(33, 90, 148, 0.06)":"none"};
  padding: 8px;
  display: grid;
  gap: 8px;
  grid-template-rows: auto auto auto 1fr auto;
  transition: box-shadow 0.15s, border-color 0.15s;
  height: 100%;
`,h5=l.button`
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  display: grid;
  gap: 6px;
  cursor: pointer;

  text-align: left;
`,x5=l.div`
  position: relative;
  min-height: 112px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dde8f2;
  background: linear-gradient(180deg, #f9fcff 0%, #edf4fb 100%);
`,b5=l.div`
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
`,y5=l.div`
  width: 100%;
  height: 112px;
  display: grid;
  place-items: center;
  gap: 6px;
  color: #6a7f94;
  background: linear-gradient(180deg, #f7fafe 0%, #edf3f9 100%);
`,v5=l.span`
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.06em;
`,w5=l.button`
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 1px solid ${({$selected:e})=>e?"#2f6fb0":"#bfd0e0"};
  background: ${({$selected:e})=>e?"#2f6fb0":"#ffffff"};
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: ${({$selected:e})=>e?"#2b679f":"#f4f8fc"};
  }
`,S5=l.div`
  min-width: 0;
  display: grid;
  gap: 6px;
`,k5=l.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
`,j5=l.div`
  min-width: 0;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #233648;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,I5=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`,Vo=l.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  border: 1px solid ${({$tone:e})=>e==="ready"?"#cae6d3":e==="pending"?"#e8d8b0":e==="failed"?"#efcece":"#dfe7f0"};
  background: ${({$tone:e})=>e==="ready"?"#f3fbf6":e==="pending"?"#fff9ee":e==="failed"?"#fff5f5":"#f7fafc"};
  color: ${({$tone:e})=>e==="ready"?"#2e7a48":e==="pending"?"#9a6a08":e==="failed"?"#b14545":"#6d8196"};
  font-size: var(--font-size-xs);
  font-weight: 700;
`,$5=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.55;
  color: #607487;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`,T5=l.div`
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #dde8f2;
  background: linear-gradient(180deg, #f9fcff 0%, #edf4fb 100%);
`,C5=l.img`
  width: 100%;
  height: 112px;
  object-fit: cover;
  display: block;
`,zf=l.span`
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${e=>e.$accent?"#173457":"#607487"};
  background: ${e=>e.$accent?"#dff0ff":"#f5f8fb"};
  border: 1px solid ${e=>e.$accent?"#c5e0f8":"#dfe7f0"};
`,P5=l.span`
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #5e4b08;
  background: #fef9e7;
  border: 1px solid #f5e6a3;
`,A5=l.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${({$tone:e})=>e==="ready"?"#3b9f62":e==="pending"?"#d09a2d":"#d06262"};
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
  flex-shrink: 0;
`,_5=l.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
`,Ui=l.button`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid ${e=>e.$danger?"#efc4c4":e.$active?"#9fc8ef":"#d7e2ed"};
  background: ${e=>e.$danger?"#fff5f5":e.$active?"#ebf5ff":"#ffffff"};
  color: ${e=>e.$danger?"#b14545":e.$active?"#1d5b92":"#607487"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${e=>e.$danger?"#ffeaea":e.$active?"#e5f1fe":"#f4f8fc"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,E5=l.div`
  padding: 10px 12px;
  border-top: 1px solid #e3ebf3;
  background: rgba(255, 255, 255, 0.88);
`,z5=l.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`,el=l.button`
  width: 100%;
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid #d7e2ed;
  background: #ffffff;
  color: #4b6278;
  font-size: var(--font-size-xs);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f4f8fc;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,D5=l.div`
  position: fixed;
  z-index: 3000;
  min-width: 180px;
  border-radius: 12px;
  border: 1px solid rgba(222, 234, 248, 0.9);
  background: rgba(10, 27, 59, 0.96);
  box-shadow: 0 16px 44px rgba(4, 11, 24, 0.32);
  padding: 6px;
  display: grid;
  gap: 4px;
`,Hi=l.button`
  min-height: 34px;
  border-radius: 8px;
  border: none;
  background: ${({$danger:e})=>e?"rgba(125, 18, 18, 0.18)":"transparent"};
  color: ${({$danger:e})=>e?"#ffd6d6":"#f4f8ff"};
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  text-align: left;

  &:hover:not(:disabled) {
    background: ${({$danger:e})=>e?"rgba(160, 27, 27, 0.3)":"rgba(255,255,255,0.12)"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`,R5=l.div`
  height: 1px;
  background: rgba(255,255,255,0.12);
  margin: 4px 0;
`;function M5(e){const n=String(e||"").replace("T"," ");return n?n.slice(0,16):"未知时间"}function Df(e){return e==="image"?"图片":e==="pdf"?"PDF":e==="pptx"?"PPTX":e==="doc"||e==="docx"?"Word":e==="md"?"Markdown":"文本"}function F5(e,n){return n==="image"?"已入库":e==="ready"?"已抽取":e==="pending"?"抽取中":"抽取失败"}function B5(e,n){const r=String(e||"").replace(/[\\/]+$/,""),i=String(n||"").replace(/^[\\/]+/,"");return r?i?`${r}/${i}`:r:i}function L5(e){return e?Fg(e):""}function N5(e,n,r){if(r==="name"){const o=e.title.localeCompare(n.title,"zh-CN");return o!==0?o:String(n.importedAt||"").localeCompare(String(e.importedAt||""))}const i=String(e.importedAt||"").localeCompare(String(n.importedAt||""));return r==="oldest"?i!==0?i:e.title.localeCompare(n.title,"zh-CN"):i!==0?-i:e.title.localeCompare(n.title,"zh-CN")}const O5=({embedded:e=!1,clearDocumentResultOnReset:n=!1})=>{const{info:r,documents:i,query:o,loading:s,importing:a,activeDocumentId:d,referenceDocumentIds:u,styleImageDocumentIds:f,templateDocumentId:p,departmentId:m,setQuery:g,refresh:h,importDocuments:x,openDocument:k,toggleReferenceDocument:v,selectReferenceDocuments:y,selectStyleImageDocuments:j,unselectReferenceDocuments:S,toggleStyleImageDocument:z,unselectStyleImageDocuments:P,setTemplateDocument:I,clearSelections:b,deleteDocument:$}=Sr(),{clearCurrentResult:O,removeDocumentFromSessions:D}=kr(),{setCommitResult:R}=zs(),{openWorkspace:V,refreshTree:te}=Ft(),{setStatusMessage:q}=Jn(),{openDocumentPath:W,openKnowledgeDocumentPreview:fe}=Fs(),[le,Q]=c.useState(null),[ge,J]=c.useState(null),[H,T]=c.useState("all"),[w,L]=c.useState("all"),[N,M]=c.useState("recent"),A=c.useMemo(()=>{const _=new Set(u);return p&&_.add(p),_},[u,p]),ee=c.useMemo(()=>{const _=new Set(A);return f.forEach(Y=>_.add(Y)),_},[A,f]),me=c.useMemo(()=>{if(!p)return"未指定，生成时将使用首个勾选文档作为模板";const _=i.find(Y=>Y.id===p);return(_==null?void 0:_.title)||"当前模板已不在筛选结果中"},[i,p]),Ie=c.useMemo(()=>i.filter(Y=>!(H==="selected"&&!ee.has(Y.id)||w!=="all"&&Y.sourceType!==w)).sort((Y,ae)=>N5(Y,ae,N)),[i,ee,N,w,H]),Fe=c.useMemo(()=>Ie.map(_=>_.id),[Ie]),Z=c.useMemo(()=>Ie.filter(_=>_.sourceType!=="image").map(_=>_.id),[Ie]),X=c.useMemo(()=>Ie.filter(_=>_.sourceType==="image").map(_=>_.id),[Ie]),ye=c.useMemo(()=>Fe.length===0?!1:Ie.every(_=>_.sourceType==="image"?f.includes(_.id):u.includes(_.id)),[u,f,Ie,Fe.length]);c.useEffect(()=>{if(!ge)return;const _=()=>J(null);return window.addEventListener("click",_),window.addEventListener("contextmenu",_),()=>{window.removeEventListener("click",_),window.removeEventListener("contextmenu",_)}},[ge]);const Ee=async()=>{const _=await x().catch(()=>null);if(!(!_||_.canceled)&&_.imported.length===1&&_.imported[0].sourceType==="pdf"){Q(_.imported[0].id);try{await af({departmentId:m,documentId:_.imported[0].id,workspaceName:_.imported[0].title,fileName:_.imported[0].title,sourceDocumentIds:[_.imported[0].id],openWorkspace:V,openDocumentPath:W,refreshTree:te,setStatusMessage:q})}finally{Q(null)}}},G=async _=>{const Y=i.find(ae=>ae.id===_);if(Y){Q(_);try{await af({departmentId:m,documentId:_,workspaceName:Y.title,fileName:Y.title,sourceDocumentIds:[_],openWorkspace:V,openDocumentPath:W,refreshTree:te,setStatusMessage:q})}finally{Q(null)}}},F=async _=>{const Y=i.find(je=>je.id===_);if(!(!Y||!window.confirm(`确认从知识库移除“${Y.title}”吗？`)))try{await $(_),D(_),q(`已从知识库移除：${Y.title}`)}catch(je){const Le=je instanceof Error?je.message:"未知错误";q(`删除失败：${Le}`),window.alert(`删除“${Y.title}”失败：${Le}`)}},se=async _=>{try{await k(_.id),await fe(_.id)}catch(Y){const ae=Y instanceof Error?Y.message:"未知错误";q(`打开资料预览失败：${ae}`)}},_e=(_,Y)=>{Y||v(_),I(p===_?null:_)},de=_=>{p===_&&ee.has(_)&&I(null),v(_)},oe=()=>{if(Fe.length!==0){if(ye){S(Z),P(X),p&&Z.includes(p)&&I(null),q(`已取消当前结果中的 ${Fe.length} 项选择`);return}y(Z),j(X),q(`已勾选当前结果中的 ${Fe.length} 项资料 / 风格图`)}},Te=()=>{g(""),T("all"),L("all"),M("recent")},C=()=>{b(),n&&(R(null),O()),q("已清空本轮模板、资料与风格图选择")},E=_=>{var mt;const Y=_.sourceType==="image",ae=Y?f.includes(_.id):A.has(_.id),je=p===_.id,Le=_.extractionStatus==="ready"?"ready":_.extractionStatus==="pending"?"pending":"failed",Ke=_.extractionStatus==="failed"&&_.errorMessage?`抽取失败：${_.errorMessage}`:((mt=_.previewText)==null?void 0:mt.trim())||_.originalName||"当前还没有可展示摘要，点击可打开详情。",Be=Y?L5(B5(r==null?void 0:r.rootPath,_.storedRelativePath)):"";return t.jsxs(g5,{$selected:ae,$active:d===_.id,"data-knowledge-document-id":_.id,"data-testid":`knowledge-document-card-${_.id}`,onContextMenu:He=>{He.preventDefault(),J({x:He.clientX,y:He.clientY,documentId:_.id})},children:[t.jsxs(x5,{children:[t.jsx(b5,{children:t.jsx(w5,{type:"button",$selected:ae,title:Y?ae?"取消风格参考":"勾选为风格参考":ae?"取消勾选参考资料":"勾选为参考资料",onClick:He=>{if(He.stopPropagation(),Y){z(_.id);return}de(_.id)},children:ae?t.jsx(ao,{size:14}):null})}),Y&&Be?t.jsx(T5,{children:t.jsx(C5,{src:Be,alt:_.title,loading:"lazy"})}):t.jsxs(y5,{children:[t.jsx(xn,{size:24}),t.jsx(v5,{children:Df(_.sourceType)})]})]}),t.jsx(h5,{type:"button",onClick:()=>void se(_),children:t.jsxs(S5,{children:[t.jsxs(k5,{children:[Y?t.jsx(Km,{size:14,style:{flexShrink:0,color:"#5e7892"}}):t.jsx(xn,{size:14,style:{flexShrink:0,color:"#5e7892"}}),t.jsx(j5,{title:_.title,children:_.title}),je?t.jsx(zf,{$accent:!0,children:"模板"}):null,Y?t.jsx(zf,{$accent:!0,children:"风格图"}):null,_.documentCategory&&_.documentCategory!=="other"?t.jsx(P5,{title:_.categoryDetail||Pf[_.documentCategory],children:_.categoryDetail||Pf[_.documentCategory]}):null]}),t.jsxs(I5,{children:[t.jsx(Vo,{children:Df(_.sourceType)}),t.jsxs(Vo,{$tone:Le,children:[t.jsx(A5,{$tone:Le}),F5(_.extractionStatus,_.sourceType)]}),_.extractedTextLength>0?t.jsxs(Vo,{children:[_.extractedTextLength.toLocaleString()," 字"]}):null,t.jsx(Vo,{children:M5(_.importedAt)})]}),t.jsx($5,{children:Ke})]})}),t.jsxs(_5,{children:[t.jsx(l5,{children:Y?ae?t.jsx(qo,{$accent:!0,children:"已加入本轮参考"}):t.jsx(qo,{children:"默认勾选动作为加入参考"}):ae?t.jsx(qo,{$accent:!0,children:"已加入本轮参考"}):t.jsx(qo,{children:"默认勾选动作为加入参考"})}),Y?t.jsxs(t.Fragment,{children:[t.jsx(Ui,{type:"button",$active:ae,title:ae?"取消参考":"加入参考",onClick:He=>{He.stopPropagation(),z(_.id)},children:"加入参考"}),t.jsx(Ui,{type:"button",$danger:!0,title:"删除当前文档",onClick:He=>{He.stopPropagation(),F(_.id)},children:"删除"})]}):t.jsxs(t.Fragment,{children:[t.jsx(Ui,{type:"button",$active:je,title:je?"取消模板":"设为模板","aria-label":`${je?"取消模板":"设为模板"}：${_.title}`,"data-testid":`knowledge-template-toggle-${_.id}`,onClick:He=>{He.stopPropagation(),_e(_.id,ae)},children:"设为模板"}),t.jsx(Ui,{type:"button",$active:ae,title:ae?"取消参考":"加入参考",onClick:He=>{He.stopPropagation(),de(_.id)},children:"加入参考"}),t.jsx(Ui,{type:"button",$danger:!0,title:"删除当前文档",onClick:He=>{He.stopPropagation(),F(_.id)},children:"删除"})]})]})]},_.id)},K=c.useMemo(()=>((r==null?void 0:r.documentCount)||0)===0?"这里还没有知识文档。点击底部导入按钮，把 PDF、Word、Markdown 或图片加入知识库后，就可以把它们作为写作模板、参考资料或风格参考。":H==="selected"?"当前还没有勾选任何资料或风格图。切回“全部文档”后，点击每行左侧方框即可加入本轮选择。":"没有找到匹配的知识文档。可以清空搜索词，或切换来源筛选查看全部资料和风格图。",[r==null?void 0:r.documentCount,H]);return t.jsxs(QE,{$embedded:e,children:[t.jsx(Oc,{}),t.jsxs(e5,{children:[t.jsx(t5,{children:t.jsxs(n5,{children:[t.jsxs(r5,{children:[t.jsx(Or,{size:14})," 知识库"]}),t.jsx(i5,{children:"统一浏览文档与图片素材。默认勾选动作是加入参考，需要时可把任意文档直接设为本轮模板。"})]})}),t.jsx(o5,{value:o,onChange:_=>g(_.target.value),placeholder:"搜索知识文档、参考资料或风格图..."}),t.jsxs(s5,{children:[t.jsxs(Af,{children:[t.jsx(Ef,{$active:H==="all",onClick:()=>T("all"),children:"全部文档"}),t.jsx(Ef,{$active:H==="selected",onClick:()=>T("selected"),children:"仅看已选"}),t.jsxs(_f,{$accent:!0,onClick:oe,disabled:Fe.length===0,children:[t.jsx(ao,{size:13})," ",ye?"取消当前结果":"全选当前结果"]}),t.jsxs(_f,{onClick:Te,disabled:!o&&H==="all"&&w==="all"&&N==="recent",children:[t.jsx(hb,{size:13})," 清空筛选"]})]}),t.jsxs(Af,{children:[t.jsx(Qa,{children:"类型"}),t.jsxs(a5,{value:w,onChange:_=>L(_.target.value),children:[t.jsx("option",{value:"all",children:"全部类型"}),t.jsx("option",{value:"pdf",children:"PDF"}),t.jsx("option",{value:"docx",children:"DOCX"}),t.jsx("option",{value:"doc",children:"DOC"}),t.jsx("option",{value:"pptx",children:"PPTX"}),t.jsx("option",{value:"md",children:"Markdown"}),t.jsx("option",{value:"txt",children:"TXT"}),t.jsx("option",{value:"image",children:"图片"})]}),t.jsx(Qa,{children:"排序"}),t.jsxs(Qh,{value:N,onChange:_=>M(_.target.value),children:[t.jsx("option",{value:"recent",children:"最近导入"}),t.jsx("option",{value:"oldest",children:"最早导入"}),t.jsx("option",{value:"name",children:"按名称"})]})]})]})]}),t.jsx(c5,{"aria-label":"知识库资料列表，可滚动浏览",children:t.jsxs(d5,{children:[t.jsxs(u5,{children:[t.jsx(p5,{children:H==="selected"?"本轮已选资料 / 风格图":"资料与图片列表"}),t.jsx(Qa,{children:p?`模板：${me}`:"未设置模板"})]}),Ie.length===0?t.jsx(m5,{children:K}):t.jsx(f5,{children:Ie.map(_=>E(_))})]})}),t.jsx(E5,{children:t.jsxs(z5,{children:[t.jsxs(el,{onClick:()=>void Ee(),disabled:a,children:[t.jsx(xb,{size:14})," ",a?"导入中":"导入资料"]}),t.jsxs(el,{onClick:()=>void h(),disabled:s||a,children:[t.jsx(Mn,{size:14})," 刷新"]}),t.jsxs(el,{onClick:C,disabled:ee.size===0&&!p,children:[t.jsx(Or,{size:14})," 清空本轮"]})]})}),ge?(()=>{const _=i.find(Le=>Le.id===ge.documentId);if(!_)return null;const Y=_.sourceType==="image",ae=Y?f.includes(_.id):A.has(_.id),je=p===_.id;return t.jsxs(D5,{style:{left:ge.x,top:ge.y},onClick:Le=>Le.stopPropagation(),children:[t.jsx(Hi,{onClick:()=>{se(_),J(null)},children:"只读打开"}),t.jsx(Hi,{onClick:()=>{Y?z(_.id):de(_.id),J(null)},children:Y?ae?"取消风格参考":"勾选为风格参考":ae?"取消勾选参考":"勾选为参考"}),Y?null:t.jsx(Hi,{onClick:()=>{_e(_.id,ae),J(null)},children:je?"取消模板":"设为模板"}),Y?null:t.jsx(Hi,{disabled:le===_.id||_.extractionStatus!=="ready",onClick:()=>{G(_.id),J(null)},children:"新建文章"}),t.jsx(R5,{}),t.jsxs(Hi,{$danger:!0,onClick:()=>{F(_.id),J(null)},children:[t.jsx(dc,{size:14})," 删除文档"]})]})})():null]})},W5=l.div`
  width: ${e=>e.$embedded?"100%":"336px"};
  min-width: ${e=>e.$embedded?"0":"300px"};
  max-width: ${e=>e.$embedded?"none":"340px"};
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fafdff 0%, #f3f7fb 100%);
  border-right: ${e=>e.$embedded?"none":"1px solid #dbe4ee"};
  color: #304255;
`,U5=l.div`
  padding: 12px 14px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4ecf5;
`,H5=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1f3044;
`,K5=l.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #708396;
  cursor: pointer;

  &:hover {
    background: #e8eef6;
    color: #1f3044;
  }
`,G5=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
`,q5=l.div`
  padding: 10px 14px;
  border-top: 1px solid #e4ecf5;
`,V5=l.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 7px 0;
  border: none;
  border-radius: 6px;
  background: #e8f0fe;
  color: #1a56db;
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #d4e4fd;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;function Y5({onCollapse:e,embedded:n=!1}){const{importing:r,importDocuments:i}=Sr(),{selectedDepartmentId:o}=Ii();return t.jsxs(W5,{$embedded:n,"data-testid":"generation-knowledge-sidebar",children:[t.jsxs(U5,{children:[t.jsxs(H5,{children:[t.jsx(Or,{size:14})," 知识库"]}),e?t.jsx(K5,{type:"button",onClick:e,title:"收起左栏",children:t.jsx(vl,{size:14})}):null]}),t.jsx(G5,{children:t.jsx(Oc,{})}),t.jsx(q5,{children:t.jsxs(V5,{type:"button",disabled:r||!o,onClick:()=>void i(),children:[t.jsx(bi,{size:13}),r?"导入中...":"上传文件"]})})]})}function ti(e,n){if(!e||!n)return null;const r=s=>s.replace(/\\/g,"/").replace(/\/+$/,""),i=r(e),o=r(n);return o===i?"":o.startsWith(`${i}/`)?o.slice(i.length+1):null}function Yo(e,n){const r=(e||"").replace(/\\/g,"/").replace(/^\/+|\/+$/g,""),i=(n||"").replace(/\\/g,"/").replace(/^\/+|\/+$/g,"");return r?i?`${r}/${i}`:r:i}const Rf=l.div`
  width: ${e=>e.$embedded?"100%":`${e.$width}px`};
  min-width: ${e=>e.$embedded?"0":"200px"};
  max-width: ${e=>e.$embedded?"none":"420px"};
  background: #ffffff;
  color: #304255;
  display: flex;
  flex-direction: column;
  border-right: ${e=>e.$embedded?"none":"1px solid #dde3ec"};
  height: 100%;
  position: relative;
`,Mf=l.div`position:absolute;top:0;right:-2px;width:4px;height:100%;cursor:col-resize;z-index:10;&:hover{background:#007acc;}`,Ff=l.div`padding:8px 10px 6px;font-size:var(--font-size-xs);font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#627385;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e7edf4;min-height:32px;background:#f8fbff;`,Bf=l.span`overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;`,Lf=l.div`display:flex;gap:1px;flex-shrink:0;`,En=l.button`background:transparent;border:none;color:#6c7b8a;cursor:pointer;padding:3px 4px;border-radius:4px;display:flex;align-items:center;justify-content:center;&:hover{background:${e=>e.$danger?"#fdecec":"#edf3fa"};color:${e=>e.$danger?"#c64b4b":"#1f3142"};}`,J5=l.div`padding:6px 10px;border-bottom:1px solid #e7edf4;background:#f8fbff;display:flex;align-items:center;justify-content:space-between;gap:8px;`,X5=l.span`font-size:var(--font-size-xs);color:#6c7b8a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`,Z5=l.button`border:1px solid #d8e1ea;background:#fff;color:#304255;border-radius:4px;padding:4px 10px;font-size:var(--font-size-xs);cursor:pointer;white-space:nowrap;&:hover{background:#edf3fa;color:#1f3142;}`,Q5=l.div`padding:4px 8px;border-bottom:1px solid #e7edf4;background:#ffffff;`,ez=l.div`display:flex;align-items:center;background:#f7f9fc;border:1px solid #d8e1ea;border-radius:4px;padding:0 8px;gap:6px;`,tz=l.input`flex:1;background:transparent;border:none;color:#304255;font-size:var(--font-size-xs);padding:5px 0;outline:none;&::placeholder{color:#95a1ad;}`,nz=l.div`flex:1;overflow:auto;`,rz=l.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,oo=l.div`display:flex;align-items:center;height:22px;padding-left:${e=>8+e.$depth*16}px;padding-right:8px;cursor:pointer;white-space:nowrap;position:relative;background:${e=>e.$active?"#eaf3ff":e.$highlight?"#f3f8fe":"transparent"};&:hover{background:${e=>e.$active?"#eaf3ff":"#f5f8fc"};}`,fs=l.span`display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;visibility:${e=>e.$visible?"visible":"hidden"};color:#7b8794;flex-shrink:0;`,ms=l.span`display:inline-flex;align-items:center;justify-content:center;margin-right:5px;width:16px;height:16px;color:${e=>e.$color||"#627385"};flex-shrink:0;`,nc=l.span`font-size:var(--font-size-sm);color:${e=>e.$dim?"#95a1ad":e.$active?"#1f3142":"#304255"};overflow:hidden;text-overflow:ellipsis;line-height:22px;flex:1;`,gs=l.input`background:#ffffff;border:1px solid #007acc;border-radius:2px;color:#304255;font-size:var(--font-size-sm);padding:0 4px;height:20px;outline:none;flex:1;min-width:0;`,iz=l.div`flex:1;display:flex;flex-direction:column;padding:16px;overflow:auto;`,oz=l.div`font-size:var(--font-size-sm);font-weight:600;color:#304255;margin-bottom:10px;display:flex;align-items:center;gap:6px;`,sz=l.input`width:100%;padding:7px 10px;border:1px solid #d8e1ea;border-radius:4px;background:#ffffff;color:#304255;font-size:var(--font-size-sm);outline:none;margin-bottom:8px;`,Nf=l.button`width:100%;padding:7px 12px;border:${e=>e.$primary?"none":"1px solid #d8e1ea"};border-radius:4px;background:${e=>e.$primary?"#007acc":"#ffffff"};color:${e=>e.$primary?"#fff":"#304255"};font-size:var(--font-size-sm);cursor:pointer;margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:6px;`,az=l.div`display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:6px;`,lz=l.div`margin-top:8px;flex:1;overflow:auto;`,cz=l.div`padding:6px 8px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:6px;&:hover{background:#f5f8fc;}`,dz=l.div`flex:1;overflow:hidden;`,uz=l.div`font-size:var(--font-size-sm);color:#304255;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`,pz=l.div`font-size:var(--font-size-xs);color:#95a1ad;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;`,fz=l.div`padding:4px 10px;font-size:var(--font-size-xs);color:#7b8794;border-bottom:1px solid #e7edf4;display:flex;align-items:center;gap:2px;overflow:hidden;white-space:nowrap;background:#fafcff;`,Of=l.span`color:${e=>e.$clickable?"#0e639c":"#7b8794"};cursor:${e=>e.$clickable?"pointer":"default"};overflow:hidden;text-overflow:ellipsis;`,mz=l.div`padding:4px 10px;font-size:var(--font-size-xs);color:#7b8794;border-top:1px solid #e7edf4;display:flex;align-items:center;gap:6px;min-height:24px;background:#ffffff;`,gz=l.div`position:fixed;z-index:9999;background:#ffffff;border:1px solid #d6e0ea;border-radius:6px;padding:4px 0;min-width:180px;box-shadow:0 12px 32px rgba(19,41,61,.14);`,hn=l.div`padding:6px 16px;font-size:var(--font-size-xs);color:${e=>e.$danger?"#c64b4b":"#304255"};cursor:pointer;display:flex;align-items:center;gap:8px;&:hover{background:#eef4fb;color:${e=>e.$danger?"#b33838":"#1f3142"};}`,Wf=l.div`height:1px;background:#e7edf4;margin:4px 0;`;function Uf(e){return e.endsWith(".aidoc.json")?e.slice(0,-11):e}function rc(e){return e.filter(n=>n.type==="folder"||!n.name.endsWith(".aidoc.json")).map(n=>n.type==="folder"?{...n,children:rc(n.children??[])}:n)}function hz(e){var r;if(e.endsWith(".aidoc.json"))return{icon:t.jsx(xn,{size:15}),color:"#519aba"};const n=(r=e.split(".").pop())==null?void 0:r.toLowerCase();return["png","jpg","jpeg","gif","webp","svg"].includes(n||"")?{icon:t.jsx(vb,{size:15}),color:"#a074c4"}:["md","txt","docx","doc","html","htm"].includes(n||"")?{icon:t.jsx(xn,{size:15}),color:"#519aba"}:{icon:t.jsx(Es,{size:15}),color:"#999"}}function ex(e){return[...e].sort((n,r)=>n.type!==r.type?n.type==="folder"?-1:1:n.name.localeCompare(r.name,"zh"))}function tx(e,n){if(!n)return!0;const r=n.toLowerCase();return e.name.toLowerCase().includes(r)?!0:e.type==="folder"&&e.children?e.children.some(i=>tx(i,n)):!1}const nx=({node:e,depth:n,onFileClick:r,onContextMenu:i,activeFile:o,filterText:s,renamingPath:a,renameValue:d,creatingIn:u,newItemName:f,onRenameChange:p,onNewItemNameChange:m,onRenameSubmit:g,onCreateSubmit:h,onRenameCancel:x,onCreateCancel:k})=>{const[v,y]=c.useState(n===0||!!s),j=a===e.path,S=(u==null?void 0:u.parentPath)===e.path;if(c.useEffect(()=>{s&&y(!0)},[s]),!tx(e,s))return null;if(e.type==="folder"){const b=ex(e.children||[]);return t.jsxs(t.Fragment,{children:[t.jsxs(oo,{$depth:n,onClick:()=>y($=>!$),onContextMenu:$=>i($,e),children:[t.jsx(fs,{$visible:!0,children:v?t.jsx(so,{size:14}):t.jsx(qn,{size:14})}),t.jsx(ms,{$color:"#dcb67a",children:v?t.jsx(Vn,{size:15}):t.jsx(br,{size:15})}),j?t.jsx(gs,{autoFocus:!0,value:d,onChange:$=>p($.target.value),onKeyDown:$=>{$.key==="Enter"&&g(),$.key==="Escape"&&x()},onBlur:g,onClick:$=>$.stopPropagation()}):t.jsx(nc,{children:Uf(e.name)})]}),v&&b.map($=>t.jsx(nx,{node:$,depth:n+1,onFileClick:r,onContextMenu:i,activeFile:o,filterText:s,renamingPath:a,renameValue:d,creatingIn:u,newItemName:f,onRenameChange:p,onNewItemNameChange:m,onRenameSubmit:g,onCreateSubmit:h,onRenameCancel:x,onCreateCancel:k},$.path)),v&&S&&t.jsxs(oo,{$depth:n+1,children:[t.jsx(fs,{$visible:!1,children:t.jsx(qn,{size:14})}),t.jsx(ms,{$color:(u==null?void 0:u.type)==="folder"?"#dcb67a":(u==null?void 0:u.type)==="blank-doc"?"#519aba":"#999",children:(u==null?void 0:u.type)==="folder"?t.jsx(br,{size:15}):(u==null?void 0:u.type)==="blank-doc"?t.jsx(xn,{size:15}):t.jsx(Es,{size:15})}),t.jsx(gs,{autoFocus:!0,placeholder:(u==null?void 0:u.type)==="folder"?"文件夹名称...":(u==null?void 0:u.type)==="blank-doc"?"文档名称...":"文件名称...",value:f,onChange:$=>m($.target.value),onKeyDown:$=>{$.key==="Enter"&&h(),$.key==="Escape"&&k()},onBlur:k,onClick:$=>$.stopPropagation()})]})]})}const z=o===e.path,{icon:P,color:I}=hz(e.name);return t.jsxs(oo,{$depth:n,$active:z,$highlight:!!(s&&e.name.toLowerCase().includes(s.toLowerCase())),onClick:()=>r(e),onContextMenu:b=>i(b,e),children:[t.jsx(fs,{$visible:!1,children:t.jsx(qn,{size:14})}),t.jsx(ms,{$color:I,children:P}),j?t.jsx(gs,{autoFocus:!0,value:d,onChange:b=>p(b.target.value),onKeyDown:b=>{b.key==="Enter"&&g(),b.key==="Escape"&&x()},onBlur:g,onClick:b=>b.stopPropagation()}):t.jsx(nc,{$active:z,children:Uf(e.name)})]})};function rx(e){return e.reduce((n,r)=>n+(r.type==="file"?1:0)+(r.children?rx(r.children):0),0)}const xz=({onCollapse:e,embedded:n=!1,panelMode:r="auto",showKnowledgeDock:i=!0,onFileOpen:o,hideWorkspaceManagement:s=!1})=>{const{mode:a,generationMode:d}=Cn(),{projectRoot:u,fileTreeData:f,activeWorkspacePath:p,activeWorkspaceName:m,workspaces:g,loading:h,createWorkspace:x,registerWorkspace:k,openWorkspace:v,closeWorkspace:y,refreshTree:j,refreshWorkspaces:S,deleteWorkspace:z}=Ft(),{setMarkdown:P,setStatusMessage:I,setFilePath:b,filePath:$,openTab:O}=Jn(),{openDocumentPath:D}=Fs(),[R,V]=c.useState(""),[te,q]=c.useState(null),[W,fe]=c.useState(null),[le,Q]=c.useState(""),[ge,J]=c.useState(!1),[H,T]=c.useState(null),[w,L]=c.useState(null),[N,M]=c.useState(null),[A,ee]=c.useState(""),[me,Ie]=c.useState(260),[Fe,Z]=c.useState(null),[X,ye]=c.useState(""),Ee=c.useRef(null),G=c.useRef(null);c.useEffect(()=>{S()},[S]),c.useEffect(()=>{p&&j()},[p,j]),c.useEffect(()=>{const ue=()=>T(null);if(H)return document.addEventListener("click",ue),document.addEventListener("contextmenu",ue),()=>{document.removeEventListener("click",ue),document.removeEventListener("contextmenu",ue)}},[H]);const F=c.useCallback(ue=>{ue.preventDefault();const ze=ue.clientX,re=me,pe=Ve=>Ie(Math.max(180,Math.min(420,re+Ve.clientX-ze))),ne=()=>{document.removeEventListener("mousemove",pe),document.removeEventListener("mouseup",ne)};document.addEventListener("mousemove",pe),document.addEventListener("mouseup",ne)},[me]),se=c.useCallback(async()=>{if(R.trim())try{const ue=await x(R.trim());ue&&(await v(ue),P(""),b(null),I(`工作区 "${R.trim()}" 已创建`)),V("")}catch(ue){I(`创建失败: ${(ue==null?void 0:ue.message)||""}`)}},[x,R,v,b,P,I]),_e=c.useCallback(async ue=>{try{await v(ue),P(""),b(null),I(`已打开工作区: ${ue.split(/[/\\]/).pop()}`)}catch(ze){I(`打开失败: ${(ze==null?void 0:ze.message)||""}`)}},[v,b,P,I]),de=c.useCallback(async()=>{try{const ue=await window.electronAPI.openDirectoryDialog();if(!ue){I("已取消选择已有工作区");return}const ze=await k(ue);ze&&(await v(ze),P(""),b(null),I(`已打开工作区: ${ze.split(/[/\\]/).pop()}`))}catch(ue){I(`打开失败: ${(ue==null?void 0:ue.message)||""}`)}},[v,k,b,P,I]),oe=c.useCallback(()=>{y(),q(null),Q(""),J(!1),T(null),Z(null),ye(""),M(null),I("已返回工作区选择，可创建工作区或打开已有工作区")},[y,I]),Te=c.useCallback(async ue=>{try{await z(ue),fe(null),I("工作区已删除")}catch(ze){I(`删除失败: ${(ze==null?void 0:ze.message)||""}`)}},[z,I]),C=c.useCallback(async ue=>{q(ue.path);try{await D(ue.path),o==null||o()}catch(ze){I(`无法读取文件: ${(ze==null?void 0:ze.message)||"未知错误"}`)}},[o,D,I]),E=c.useCallback(ue=>{M(ue.path),ee(ue.name),T(null)},[]),K=c.useCallback(async()=>{if(!N||!A.trim()||!p){M(null);return}const ue=ti(p,N);if(ue==null){M(null);return}const re=ue.split(/[/\\]/).filter(Boolean).slice(0,-1).join("/"),pe=Yo(re,A.trim());try{await window.electronAPI.renameWorkspacePath(p,ue,pe),await j(),I(`已重命名为: ${A.trim()}`)}catch(ne){I(`重命名失败: ${(ne==null?void 0:ne.message)||""}`)}M(null)},[p,j,A,N,I]),_=c.useCallback(async ue=>{if(T(null),!p)return;const ze=ti(p,ue.path);if(ze!=null)try{await window.electronAPI.deleteWorkspacePath(p,ze),await j(),I(`已删除: ${ue.name}`)}catch(re){I(`删除失败: ${(re==null?void 0:re.message)||""}`)}},[p,j,I]),Y=c.useCallback(ue=>ue?ue.type==="folder"?ue.path:ue.path.split(/[/\\]/).slice(0,-1).join("/"):p,[p]),ae=c.useCallback(async ue=>{const ze=ue.type==="folder"?ue.path:Y(ue);if(!ze){I("未找到可打开的目录"),T(null);return}try{const re=await window.electronAPI.openExternalFile(ze);re!=null&&re.success?I(ue.type==="folder"?`已打开目录: ${ue.name}`:`已打开所在目录: ${ue.name}`):I(`打开目录失败: ${(re==null?void 0:re.error)||"未知错误"}`)}catch(re){I(`打开目录失败: ${(re==null?void 0:re.message)||""}`)}T(null)},[Y,I]),je=c.useCallback(async ue=>{var re;if(!p)return;const ze=ue?ti(p,ue)??"":"";try{const pe=await window.electronAPI.importFilesToWorkspace(p,ze);(re=pe==null?void 0:pe.imported)!=null&&re.length&&(await j(),I(`已导入 ${pe.imported.length} 个文件`))}catch(pe){I(`导入失败: ${(pe==null?void 0:pe.message)||""}`)}T(null)},[p,j,I]),Le=c.useCallback((ue,ze)=>{const re=ze||p;re&&(Z({parentPath:re,type:ue}),ye(""),T(null))},[p]),Ke=c.useCallback(async()=>{if(!Fe||!X.trim()||!p){Z(null),ye("");return}const ue=ti(p,Fe.parentPath);if(ue==null){Z(null),ye("");return}const ze=Yo(ue,X.trim());try{if(Fe.type==="folder")await window.electronAPI.createWorkspaceFolder(p,ze);else if(Fe.type==="blank-doc"){const re=/\.aidoc\.json$/i.test(X.trim())?X.trim():`${X.trim()}.aidoc.json`,pe=Yo(ue,re),ne=await window.electronAPI.createBlankDocument(p,pe);await D(ne.path,{isInternalOpen:!0})}else{const re=await window.electronAPI.createWorkspaceFile(p,ze);await O(re.path,X.trim(),""),b(re.path)}await j(),I(`已创建: ${X.trim()}`)}catch(re){I(`创建失败: ${(re==null?void 0:re.message)||""}`)}Z(null),ye("")},[p,Fe,X,D,O,j,b,I]),Be=c.useCallback((ue,ze)=>{L({mode:ue,node:ze}),T(null),I(ue==="copy"?`已复制: ${ze.name}`:`已剪切: ${ze.name}`)},[I]),mt=c.useCallback(async ue=>{if(!w||!p)return;const ze=ti(p,w.node.path),re=ti(p,ue);if(ze==null||re==null)return;const pe=Yo(re,w.node.name);try{w.mode==="copy"?(await window.electronAPI.copyWorkspacePath(p,ze,pe),I(`已复制到: ${re||m||"工作区根目录"}`)):(await window.electronAPI.moveWorkspacePath(p,ze,pe),L(null),I(`已移动到: ${re||m||"工作区根目录"}`)),await j()}catch(ne){I(`粘贴失败: ${(ne==null?void 0:ne.message)||""}`)}T(null)},[m,p,w,j,I]),He=c.useMemo(()=>ex(rc(f)),[f]),dt=c.useMemo(()=>rx(rc(f)),[f]),Xe=p&&te?te.replace(p,"").split(/[/\\]/).filter(Boolean):[],Re=(H==null?void 0:H.node)??null;return r==="auto"&&a==="generation"&&d!=="document"?t.jsx(Y5,{onCollapse:e}):p?t.jsxs(Rf,{$width:me,$embedded:n,ref:Ee,children:[n?null:t.jsx(Mf,{onMouseDown:F}),t.jsxs(Ff,{children:[t.jsx(Bf,{title:u||p,children:m}),t.jsxs(Lf,{children:[t.jsx(En,{onClick:()=>{J(ue=>!ue),ge||setTimeout(()=>{var ue;return(ue=G.current)==null?void 0:ue.focus()},50)},title:"搜索文件",children:t.jsx(lo,{size:14})}),t.jsx(En,{onClick:()=>void je(),title:"导入文件",children:t.jsx(bi,{size:13})}),t.jsx(En,{onClick:()=>void j(),title:"刷新",children:t.jsx(Mn,{size:13})}),t.jsx(En,{$danger:!0,onClick:y,title:"关闭工作区",children:t.jsx(Rn,{size:14})}),e&&t.jsx(En,{onClick:e,title:"收起文件管理器",children:t.jsx(vl,{size:14})})]})]}),!s&&t.jsxs(J5,{children:[t.jsx(X5,{children:"当前已进入工作区；需要切换时可返回工作区选择。"}),t.jsx(Z5,{onClick:oe,children:"返回选择工作区"})]}),ge&&t.jsx(Q5,{children:t.jsxs(ez,{children:[t.jsx(lo,{size:13,color:"#777"}),t.jsx(tz,{ref:G,value:le,onChange:ue=>Q(ue.target.value),placeholder:"搜索文件..."}),le&&t.jsx(En,{onClick:()=>Q(""),children:t.jsx(Rn,{size:12})})]})}),Xe.length>0&&t.jsxs(fz,{children:[t.jsx(Of,{$clickable:!0,onClick:()=>q(null),children:m}),Xe.map((ue,ze)=>t.jsxs(Ct.Fragment,{children:[t.jsx("span",{style:{color:"#555"},children:"/"}),t.jsx(Of,{$clickable:ze===Xe.length-1,children:ue})]},ze))]}),t.jsxs(rz,{children:[t.jsxs(nz,{onContextMenu:ue=>{ue.preventDefault(),ue.stopPropagation(),p&&T({x:ue.clientX,y:ue.clientY,node:null,parentPath:p})},children:[He.length===0&&t.jsx(oo,{$depth:0,children:t.jsx(nc,{$dim:!0,children:"当前工作区为空，可右键新建空白文档、文件或文件夹"})}),He.map(ue=>t.jsx(nx,{node:ue,depth:0,onFileClick:C,onContextMenu:(ze,re)=>{ze.preventDefault(),ze.stopPropagation();const pe=re.type==="folder"?re.path:Y(re)||p||re.path;T({x:ze.clientX,y:ze.clientY,node:re,parentPath:pe})},activeFile:te||$,filterText:le,renamingPath:N,renameValue:A,creatingIn:Fe,newItemName:X,onRenameChange:ee,onNewItemNameChange:ye,onRenameSubmit:()=>void K(),onCreateSubmit:()=>void Ke(),onRenameCancel:()=>M(null),onCreateCancel:()=>{Z(null),ye("")}},ue.path)),Fe&&Fe.parentPath===p&&t.jsxs(oo,{$depth:0,children:[t.jsx(fs,{$visible:!1,children:t.jsx(qn,{size:14})}),t.jsx(ms,{$color:Fe.type==="folder"?"#dcb67a":Fe.type==="blank-doc"?"#519aba":"#999",children:Fe.type==="folder"?t.jsx(br,{size:15}):Fe.type==="blank-doc"?t.jsx(xn,{size:15}):t.jsx(Es,{size:15})}),t.jsx(gs,{autoFocus:!0,placeholder:Fe.type==="folder"?"文件夹名称...":Fe.type==="blank-doc"?"文档名称...":"文件名称...",value:X,onChange:ue=>ye(ue.target.value),onKeyDown:ue=>{ue.key==="Enter"&&Ke(),ue.key==="Escape"&&(Z(null),ye(""))},onBlur:()=>{Z(null),ye("")},onClick:ue=>ue.stopPropagation()})]})]}),i?t.jsx(O5,{}):null]}),t.jsxs(mz,{children:[t.jsx(br,{size:12,style:{color:"#dcb67a"}}),t.jsxs("span",{children:[dt," 个文件"]}),w&&t.jsxs("span",{style:{color:"#007acc"},children:[w.mode==="copy"?"复制中":"剪切中",": ",w.node.name]}),te&&t.jsx("span",{style:{marginLeft:"auto",color:"#007acc",fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140},children:te.split(/[/\\]/).pop()})]}),H&&t.jsxs(gz,{style:{left:H.x,top:H.y},children:[t.jsxs(hn,{onClick:()=>Le("blank-doc",H.parentPath),children:[t.jsx(xn,{size:13})," 新建空白文档"]}),t.jsxs(hn,{onClick:()=>Le("file",H.parentPath),children:[t.jsx(bb,{size:13})," 新建文件"]}),t.jsxs(hn,{onClick:()=>Le("folder",H.parentPath),children:[t.jsx(yr,{size:13})," 新建文件夹"]}),t.jsxs(hn,{onClick:()=>void je(H.parentPath),children:[t.jsx(bi,{size:13})," 导入文件"]}),w&&t.jsxs(hn,{onClick:()=>void mt(H.parentPath),children:[t.jsx("span",{style:{width:13,display:"inline-flex",justifyContent:"center"},children:"📋"})," 粘贴"]}),Re&&t.jsxs(t.Fragment,{children:[t.jsx(Wf,{}),t.jsxs(hn,{onClick:()=>Be("copy",Re),children:[t.jsx(yb,{size:13})," 复制"]}),t.jsxs(hn,{onClick:()=>Be("cut",Re),children:[t.jsx("span",{style:{width:13,display:"inline-flex",justifyContent:"center"},children:"✂"})," 剪切"]}),t.jsxs(hn,{onClick:()=>{T(null),navigator.clipboard.writeText(Re.path),I("已复制路径")},children:[t.jsx("span",{style:{width:13,display:"inline-flex",justifyContent:"center"},children:"⎘"})," 复制路径"]}),t.jsxs(hn,{onClick:()=>E(Re),children:[t.jsx(Xm,{size:13})," 重命名"]}),Re.type==="file"?t.jsxs(hn,{onClick:()=>{T(null),C(Re)},children:[t.jsx(xn,{size:13})," 打开"]}):null,t.jsxs(hn,{onClick:()=>void ae(Re),children:[t.jsx(Vn,{size:13})," ",Re.type==="folder"?"打开此目录":"打开所在目录"]}),t.jsx(Wf,{}),t.jsxs(hn,{$danger:!0,onClick:()=>void _(Re),children:[t.jsx(dc,{size:13})," 删除"]})]})]})]}):t.jsxs(Rf,{$width:me,$embedded:n,ref:Ee,children:[n?null:t.jsx(Mf,{onMouseDown:F}),t.jsxs(Ff,{children:[t.jsx(Bf,{children:"文件管理器"}),e&&t.jsx(Lf,{children:t.jsx(En,{onClick:e,title:"收起文件管理器",children:t.jsx(vl,{size:14})})})]}),t.jsxs(iz,{children:[t.jsxs(oz,{children:[t.jsx(yr,{size:14})," 新建文章"]}),t.jsx("div",{style:{fontSize:14,lineHeight:1.7,color:"#6c7b8a",marginBottom:10},children:"输入名称后会自动创建对应目录。正文、图片和引用文献会一起保存在当前工作区里。"}),t.jsx(sz,{value:R,onChange:ue=>V(ue.target.value),placeholder:"输入新文章名称...",onKeyDown:ue=>ue.key==="Enter"&&void se()}),t.jsx(az,{children:t.jsxs(Nf,{$primary:!0,onClick:()=>void se(),disabled:!R.trim()||h,children:[t.jsx(yr,{size:14})," 创建工作区"]})}),t.jsxs(Nf,{onClick:()=>void de(),disabled:h,children:[t.jsx(Vn,{size:14})," 打开已有工作区"]}),g.length>0&&t.jsx(lz,{children:g.map(ue=>t.jsxs(cz,{onClick:()=>void _e(ue.path),children:[t.jsx(br,{size:14,style:{flexShrink:0,color:"#dcb67a"}}),t.jsxs(dz,{children:[t.jsx(uz,{title:ue.path,children:ue.name}),t.jsx(pz,{children:ue.path})]}),W===ue.path?t.jsxs(t.Fragment,{children:[t.jsx(En,{$danger:!0,onClick:ze=>{ze.stopPropagation(),Te(ue.path)},title:"确认删除",children:"✓"}),t.jsx(En,{onClick:ze=>{ze.stopPropagation(),fe(null)},title:"取消",children:"✕"})]}):t.jsx(En,{$danger:!0,onClick:ze=>{ze.stopPropagation(),fe(ue.path)},title:"删除",children:t.jsx(Rn,{size:12})})]},ue.path))})]})]})},bz=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  gap: 14px;
  color: #7a91a8;
  text-align: center;
`,yz=l.div`
  font-size: 40px;
  opacity: 0.45;
`,vz=l.div`
  font-size: 14px;
  font-weight: 600;
  color: #304255;
`,wz=l.p`
  margin: 0;
  font-size: var(--font-size-xs);
  color: #7a91a8;
  line-height: 1.6;
  max-width: 260px;
`,Sz=l.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`,Jo=l.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: ${e=>e.$primary?"none":"1px solid #c8d6e6"};
  background: ${e=>e.$primary?"#1f6fd6":"#ffffff"};
  color: ${e=>e.$primary?"#ffffff":"#304255"};
  transition: background 0.15s, opacity 0.15s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,kz=l.input`
  width: 220px;
  padding: 8px 12px;
  border: 1px solid #b8ccdf;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  color: #213346;
  outline: none;
  &:focus { border-color: #1f6fd6; box-shadow: 0 0 0 3px rgba(31,111,214,0.10); }
`,jz=l.div`
  display: flex;
  gap: 8px;
  align-items: center;
`,Iz=l.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;function $z({onFileOpen:e}){const{activeWorkspacePath:n,activeWorkspaceName:r,createWorkspace:i,openWorkspace:o,loading:s}=Ft(),[a,d]=c.useState(!1),[u,f]=c.useState(""),[p,m]=c.useState(!1),g=async()=>{var x,k;try{const v=await((k=(x=window.electronAPI).openDirectoryDialog)==null?void 0:k.call(x));if(!v)return;await o(v)}catch{}},h=async()=>{if(u.trim()){m(!0);try{const x=await i(u.trim());x&&(await o(x),d(!1),f(""))}finally{m(!1)}}};return n?t.jsx(Iz,{children:t.jsx(xz,{embedded:!0,panelMode:"documents",showKnowledgeDock:!1,hideWorkspaceManagement:!0,onFileOpen:e})}):t.jsxs(bz,{children:[t.jsx(yz,{children:"📁"}),t.jsx(vz,{children:"未打开工作区"}),t.jsx(wz,{children:"工作区是保存文档、图片和生成结果的项目容器，请打开或新建一个工作区。"}),a?t.jsxs(jz,{children:[t.jsx(kz,{autoFocus:!0,placeholder:"输入工作区名称...",value:u,onChange:x=>f(x.target.value),onKeyDown:x=>{x.key==="Enter"&&h(),x.key==="Escape"&&(d(!1),f(""))}}),t.jsxs(Jo,{$primary:!0,onClick:()=>void h(),disabled:!u.trim()||p,children:[t.jsx(yr,{size:14}),"创建"]}),t.jsx(Jo,{onClick:()=>{d(!1),f("")},children:"取消"})]}):t.jsxs(Sz,{children:[t.jsxs(Jo,{$primary:!0,onClick:()=>void g(),disabled:s,children:[t.jsx(Vn,{size:14}),"打开工作区"]}),t.jsxs(Jo,{onClick:()=>d(!0),children:[t.jsx(yr,{size:14}),"新建工作区"]})]}),t.jsx(Ez,{onOpen:o})]})}const Tz=l.div`
  width: 100%;
  max-width: 320px;
  margin-top: 8px;
`,Cz=l.div`
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #8094a8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
`,Pz=l.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #e2eaf4;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  margin-bottom: 5px;
  transition: background 0.12s;
  &:hover { background: #f0f6ff; border-color: #b8d0ef; }
`,Az=l.div`
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #213346;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,_z=l.div`
  font-size: var(--font-size-xs);
  color: #95a1ad;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;function Ez({onOpen:e}){const{workspaces:n}=Ft();if(!n.length)return null;const r=n.slice(0,5);return t.jsxs(Tz,{children:[t.jsx(Cz,{children:"最近使用"}),r.map(i=>t.jsxs(Pz,{onClick:()=>void e(i.path),children:[t.jsx(br,{size:14,style:{color:"#dcb67a",flexShrink:0}}),t.jsxs("div",{style:{overflow:"hidden"},children:[t.jsx(Az,{children:i.name}),t.jsx(_z,{children:i.path})]})]},i.path))]})}const zz=l.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #fafeff 0%, #f3f7fb 100%);
`,Dz=l.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid #e4ecf5;
  flex-shrink: 0;
`,Rz=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`,Mz=l.div`
  font-size: 15px;
  font-weight: 700;
  color: #1f3044;
  display: flex;
  align-items: center;
  gap: 7px;
`,Fz=l.div`
  font-size: var(--font-size-xs);
  color: #6b84a0;
  line-height: 1.5;
`,Bz=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
`,Lz=l.div`
  padding: 10px 14px;
  border-top: 1px solid #e4ecf5;
  flex-shrink: 0;
`,Nz=l.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 0;
  border: none;
  border-radius: 6px;
  background: #e8f0fe;
  color: #1a56db;
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) { background: #d4e4fd; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`,Oz=l.div`
  margin-top: 6px;
  font-size: var(--font-size-xs);
  color: #8094a8;
  text-align: center;
`,Hf=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 24px;
  text-align: center;
`,Kf=l.div`
  font-size: 36px;
  opacity: 0.4;
`,Gf=l.div`
  font-size: 14px;
  font-weight: 600;
  color: #304255;
`,qf=l.p`
  margin: 0;
  font-size: var(--font-size-xs);
  color: #7a91a8;
  line-height: 1.6;
  max-width: 260px;
`,Vf=l.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 7px;
  border: 1px solid #c8d6e6;
  background: #ffffff;
  color: #304255;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f0f6ff; }
`,Wz=l.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8094a8;
  font-size: var(--font-size-sm);
  gap: 8px;
`;function Uz(){const{importing:e,importDocuments:n}=Sr(),{departments:r,selectedDepartmentId:i,loading:o,error:s,refresh:a}=Ii(),[d,u]=c.useState(!1),f=async()=>{u(!0);try{await a()}finally{u(!1)}},p=!o&&!s&&r.length>0;return t.jsxs(zz,{children:[t.jsxs(Dz,{children:[t.jsx(Rz,{children:t.jsxs(Mz,{children:[t.jsx(Or,{size:15}),"知识库"]})}),t.jsx(Fz,{children:"来自服务器的学校/企业知识库，可作为 AI 生成时的参考资料。"})]}),o?t.jsxs(Wz,{children:[t.jsx(Mn,{size:16,style:{opacity:.5}}),"正在连接知识库…"]}):s?t.jsxs(Hf,{children:[t.jsx(Kf,{children:"⚠️"}),t.jsx(Gf,{children:"知识库连接失败"}),t.jsx(qf,{children:s==="连接超时"?"连接知识库服务器超时，请检查网络连接或联系管理员。":"无法连接到知识库服务器，请检查网络连接或联系管理员。"}),t.jsxs(Vf,{onClick:()=>void f(),disabled:d,children:[t.jsx(Mn,{size:13}),d?"重试中...":"重新连接"]})]}):p?t.jsxs(t.Fragment,{children:[t.jsx(Bz,{children:t.jsx(Oc,{})}),t.jsxs(Lz,{children:[t.jsxs(Nz,{type:"button",disabled:e||!i,onClick:()=>void n(),children:[t.jsx(bi,{size:13}),e?"上传中...":"上传文件到知识库"]}),t.jsx(Oz,{children:"文件将上传到服务器知识库"})]})]}):t.jsxs(Hf,{children:[t.jsx(Kf,{children:"📚"}),t.jsx(Gf,{children:"知识库未配置"}),t.jsx(qf,{children:"当前未连接到知识库服务器。如需使用学校或企业知识库，请联系管理员配置服务地址。"}),t.jsxs(Vf,{onClick:()=>void f(),disabled:d,children:[t.jsx(Mn,{size:13}),d?"重试中...":"重新连接"]})]})]})}const Hz={folders:[],files:[],activeFolder:null,selectedFileIds:new Set,loading:!1,importInProgress:!1};function Kz(e,n){switch(n.type){case"SET_LOADING":return{...e,loading:n.loading};case"SET_IMPORT_IN_PROGRESS":return{...e,importInProgress:n.value};case"SET_FOLDERS":return{...e,folders:n.folders};case"SET_FILES":return{...e,files:n.files};case"UPSERT_FOLDER":{const r=e.folders.findIndex(i=>i.id===n.folder.id);if(r>=0){const i=e.folders.map((o,s)=>s===r?n.folder:o);return{...e,folders:i}}return{...e,folders:[...e.folders,n.folder]}}case"REMOVE_FOLDER":{const r=e.folders.filter(o=>o.id!==n.id),i=e.activeFolder===n.id?null:e.activeFolder;return{...e,folders:r,activeFolder:i}}case"UPSERT_FILES":{const r=new Map(n.files.map(a=>[a.id,a])),i=e.files.map(a=>r.has(a.id)?r.get(a.id):a),o=new Set(e.files.map(a=>a.id)),s=n.files.filter(a=>!o.has(a.id));return{...e,files:[...i,...s]}}case"REMOVE_FILE":{const r=e.files.filter(o=>o.id!==n.id),i=new Set(e.selectedFileIds);return i.delete(n.id),{...e,files:r,selectedFileIds:i}}case"SET_ACTIVE_FOLDER":return{...e,activeFolder:n.folderId};case"TOGGLE_FILE_SELECTED":{const r=new Set(e.selectedFileIds);return r.has(n.fileId)?r.delete(n.fileId):r.add(n.fileId),{...e,selectedFileIds:r}}case"SET_FILES_SELECTED":{const r=new Set(n.fileIds);return{...e,selectedFileIds:r}}case"CLEAR_SELECTION":return{...e,selectedFileIds:new Set};default:return e}}const ix=c.createContext(null);function Gz({children:e}){const[n,r]=c.useReducer(Kz,Hz),i=typeof window<"u"?window.personalLibraryAPI:null,o=c.useRef(!1),s=c.useCallback(async()=>{if(i){r({type:"SET_LOADING",loading:!0});try{const[S,z]=await Promise.all([i.listFolders(),i.listFiles(null)]);r({type:"SET_FOLDERS",folders:S}),r({type:"SET_FILES",files:z})}finally{r({type:"SET_LOADING",loading:!1})}}},[i]);c.useEffect(()=>{o.current||(o.current=!0,s())},[s]);const a=c.useCallback(async S=>{if(!i)return;const z=await i.createFolder(S);r({type:"UPSERT_FOLDER",folder:z})},[i]),d=c.useCallback(async(S,z)=>{if(!i)return;const P=await i.renameFolder(S,z);r({type:"UPSERT_FOLDER",folder:P})},[i]),u=c.useCallback(async S=>{if(!i)return;await i.deleteFolder(S),r({type:"REMOVE_FOLDER",id:S});const z=await i.listFiles(null);r({type:"SET_FILES",files:z})},[i]),f=c.useCallback(S=>{r({type:"SET_ACTIVE_FOLDER",folderId:S})},[]),p=c.useCallback(async()=>{if(!i)return null;r({type:"SET_IMPORT_IN_PROGRESS",value:!0});try{const S=await i.importFiles(n.activeFolder);return!S.canceled&&S.imported.length>0&&r({type:"UPSERT_FILES",files:S.imported}),S}finally{r({type:"SET_IMPORT_IN_PROGRESS",value:!1})}},[i,n.activeFolder]),m=c.useCallback(async S=>{i&&(await i.deleteFile(S),r({type:"REMOVE_FILE",id:S}))},[i]),g=c.useCallback(async(S,z)=>{if(!i)return;const P=await i.moveFile(S,z);r({type:"UPSERT_FILES",files:[P]})},[i]),h=c.useCallback(S=>{r({type:"TOGGLE_FILE_SELECTED",fileId:S})},[]),x=c.useCallback(S=>{r({type:"SET_FILES_SELECTED",fileIds:S})},[]),k=c.useCallback(()=>{r({type:"CLEAR_SELECTION"})},[]),v=n.activeFolder===null?n.files:n.files.filter(S=>S.folderId===n.activeFolder),y=n.files.filter(S=>n.selectedFileIds.has(S.id)),j={state:n,visibleFiles:v,selectedFiles:y,createFolder:a,renameFolder:d,deleteFolder:u,setActiveFolder:f,importFiles:p,deleteFile:m,moveFile:g,toggleFileSelected:h,setFilesSelected:x,clearSelection:k,refresh:s};return t.jsx(ix.Provider,{value:j,children:e})}function qz(){const e=c.useContext(ix);if(!e)throw new Error("usePersonalLibrary must be used within PersonalLibraryProvider");return e}const Vz=l.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,Yz=l.div`
  padding: 10px 14px 6px;
  flex-shrink: 0;
  border-bottom: 1px solid #e0e8f1;
`,Jz=l.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #17456d;
`,Xz=l.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  overflow-x: auto;
  padding: 8px 14px 6px;
  flex-shrink: 0;
  border-bottom: 1px solid #e8f0fa;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`,Yf=l.button`
  white-space: nowrap;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: var(--font-size-xs);
  border: 1px solid ${({$active:e})=>e?"#a8cdee":"#d0dce8"};
  background: ${({$active:e})=>e?"#deeeff":"transparent"};
  color: ${({$active:e})=>e?"#17456d":"#5a7490"};
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  &:hover { background: #e8f4ff; color: #17456d; }
`,Zz=l.button`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px dashed #b0c4d8;
  background: transparent;
  color: #7a9db8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 2px;
  &:hover { background: #edf4ff; color: #17456d; }
`,Qz=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
`,Jf=l.div`
  text-align: center;
  color: #9eb5c8;
  font-size: var(--font-size-xs);
  padding: 28px 16px;
`,ox=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  cursor: pointer;
  background: ${({$selected:e})=>e?"#edf6ff":"transparent"};
  border-left: 3px solid ${({$selected:e})=>e?"#4ba0e0":"transparent"};
  transition: background 0.1s;
  &:hover { background: ${({$selected:e})=>e?"#e4f2ff":"#f4f8fd"}; }
`,e8=l.span`
  flex-shrink: 0;
  color: ${({$checked:e})=>e?"#3a8cd9":"#b0c4d8"};
  display: flex;
  align-items: center;
`,t8=l.div`
  flex: 1;
  min-width: 0;
`,n8=l.div`
  font-size: var(--font-size-xs);
  color: #1e3548;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,r8=l.div`
  font-size: var(--font-size-xs);
  color: #8aaabf;
  margin-top: 1px;
  display: flex;
  align-items: center;
  gap: 4px;
`,i8=l.span`
  font-size: var(--font-size-xs);
  padding: 1px 5px;
  border-radius: 6px;
  background: ${({$status:e})=>e==="ready"?"#e4f7ec":e==="failed"?"#fdeaea":e==="image-only"?"#f3f1fe":"#fff9e0"};
  color: ${({$status:e})=>e==="ready"?"#2a7a48":e==="failed"?"#b92b2b":e==="image-only"?"#6045a8":"#7a6200"};
`,o8=l.button`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #8aaabf;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.1s, background 0.1s;
  ${ox}:hover & { opacity: 1; }
  &:hover { background: #f0eeee; color: #c0392b; }
`,s8=l.div`
  flex-shrink: 0;
  padding: 10px 14px;
  border-top: 1px solid #e0e8f1;
  display: flex;
  gap: 6px;
`,Xf=l.button`
  flex: 1;
  height: 32px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border: 1px solid ${({$primary:e})=>e?"#4ba0e0":"#c8d8e8"};
  background: ${({$primary:e})=>e?"#4ba0e0":"transparent"};
  color: ${({$primary:e})=>e?"#fff":"#4a6a84"};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: background 0.12s, border-color 0.12s;
  &:hover {
    background: ${({$primary:e})=>e?"#3990d4":"#e8f4ff"};
    border-color: ${({$primary:e})=>e?"#3990d4":"#a4c4de"};
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`,a8=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 14px;
  background: #edf6ff;
  font-size: var(--font-size-xs);
  color: #2e6fa0;
  border-bottom: 1px solid #d2e8f8;
  flex-shrink: 0;
`,Zf=l.button`
  font-size: var(--font-size-xs);
  color: #3a8cd9;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  &:hover { background: #ddeefb; }
`,l8=l.input`
  border: 1px solid #a8cdee;
  border-radius: 8px;
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  height: 24px;
  outline: none;
  color: #17456d;
  background: #f8fdff;
  width: 100px;
  &:focus { border-color: #4ba0e0; }
`;function c8(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(0)} KB`:`${(e/1024/1024).toFixed(1)} MB`}function d8(e){return e==="ready"?"已提取":e==="failed"?"提取失败":e==="image-only"?"图片":"提取中"}function u8(){const{state:e,visibleFiles:n,createFolder:r,renameFolder:i,deleteFolder:o,setActiveFolder:s,importFiles:a,deleteFile:d,toggleFileSelected:u,setFilesSelected:f,clearSelection:p}=qz(),[m,g]=c.useState(""),[h,x]=c.useState(!1),k=async I=>{I.key==="Enter"&&m.trim()?(await r(m.trim()),g(""),x(!1)):I.key==="Escape"&&(g(""),x(!1))},v=async()=>{await a()},y=async(I,b)=>{I.stopPropagation(),window.confirm("确认删除此文件吗？删除后无法恢复。")&&await d(b)},j=async(I,b)=>{I.stopPropagation(),window.confirm(`确认删除文件夹"${b.name}"？文件夹内的文件将移至未分类。`)&&await o(b.id)},S=e.selectedFileIds.size,z=n.length>0&&n.every(I=>e.selectedFileIds.has(I.id)),P=()=>{if(z){const I=new Set(n.map($=>$.id)),b=[...e.selectedFileIds].filter($=>!I.has($));f(b)}else{const I=n.map(b=>b.id);f([...new Set([...e.selectedFileIds,...I])])}};return t.jsxs(Vz,{children:[t.jsx(Yz,{children:t.jsxs(Jz,{children:[t.jsx(wb,{size:14}),"个人文件库"]})}),t.jsxs(Xz,{children:[t.jsx(Yf,{$active:e.activeFolder===null,onClick:()=>s(null),children:"全部"}),e.folders.map(I=>t.jsxs(Yf,{$active:e.activeFolder===I.id,onClick:()=>s(I.id),title:I.name,style:{position:"relative",paddingRight:24},children:[I.name,t.jsx("span",{style:{position:"absolute",right:5,top:"50%",transform:"translateY(-50%)",color:"#9eb5c8",cursor:"pointer"},onClick:b=>j(b,I),title:"删除文件夹",children:t.jsx(Rn,{size:10})})]},I.id)),h?t.jsx(l8,{autoFocus:!0,value:m,placeholder:"文件夹名…",onChange:I=>g(I.target.value),onKeyDown:k,onBlur:()=>{x(!1),g("")}}):t.jsx(Zz,{type:"button",title:"新建文件夹",onClick:()=>x(!0),children:t.jsx(yr,{size:12})})]}),S>0&&t.jsxs(a8,{children:[t.jsxs("span",{children:["已选 ",S," 个文件"]}),t.jsxs("div",{style:{display:"flex",gap:4},children:[t.jsx(Zf,{onClick:P,children:z?"取消全选":"全选当前"}),t.jsx(Zf,{onClick:p,children:"清空"})]})]}),t.jsxs(Qz,{children:[e.loading&&n.length===0&&t.jsxs(Jf,{children:[t.jsx(fd,{size:14,style:{display:"inline",marginRight:4}}),"加载中…"]}),!e.loading&&n.length===0&&t.jsxs(Jf,{children:["暂无文件",t.jsx("br",{}),t.jsx("span",{style:{fontSize:14,marginTop:4,display:"block"},children:'点击下方"导入文件"添加 PDF/Word/PPT/TXT 等文档'})]}),n.map(I=>{const b=e.selectedFileIds.has(I.id);return t.jsxs(ox,{$selected:b,onClick:()=>u(I.id),children:[t.jsx(e8,{$checked:b,children:b?t.jsx(Sb,{size:15}):t.jsx(kb,{size:15})}),t.jsxs(t8,{children:[t.jsx(n8,{title:I.originalName,children:I.originalName}),t.jsxs(r8,{children:[t.jsx("span",{children:c8(I.size)}),I.extractionStatus!=="ready"&&t.jsx(i8,{$status:I.extractionStatus,children:d8(I.extractionStatus)}),I.extractionStatus==="ready"&&I.extractedTextLength>0&&t.jsxs("span",{children:[(I.extractedTextLength/1e3).toFixed(0)," K字"]})]})]}),t.jsx(o8,{type:"button",title:"删除",onClick:$=>y($,I.id),children:t.jsx(dc,{size:12})})]},I.id)})]}),t.jsxs(s8,{children:[t.jsxs(Xf,{$primary:!0,disabled:e.importInProgress,onClick:v,title:"选择文件导入到个人文件库",children:[e.importInProgress?t.jsx(fd,{size:13}):t.jsx(bi,{size:13}),"导入文件"]}),S>0&&t.jsxs(Xf,{onClick:p,title:"清空本次文件选择（不删除文件）",children:[t.jsx(jb,{size:13}),"清空选择"]})]})]})}const p8=l.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,f8=l.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid #e4ecf5;
  flex-shrink: 0;
  background: #fafdff;
`,m8=l.div`
  font-size: 15px;
  font-weight: 700;
  color: #1f3044;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
`,g8=l.div`
  font-size: var(--font-size-xs);
  color: #6b84a0;
  line-height: 1.5;
`,h8=l.div`
  margin: 0 14px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f0f7ff;
  border: 1px solid #d0e6f7;
  font-size: var(--font-size-xs);
  color: #3a6fa0;
  line-height: 1.5;
  flex-shrink: 0;
`,x8=l.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;function b8(){return t.jsxs(p8,{children:[t.jsxs(f8,{children:[t.jsxs(m8,{children:[t.jsx(cc,{size:15}),"个人文件"]}),t.jsx(g8,{children:"上传和管理个人文件，可在生成任务中作为参考资料。"})]}),t.jsx(h8,{style:{marginTop:10,marginBottom:8},children:"💡 已选择的个人文件将在后续生成任务中作为参考资料使用（接入进行中）"}),t.jsx(x8,{children:t.jsx(u8,{})})]})}const y8=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f4f7fc;
`,v8=l.div`
  padding: 20px 28px 0;
  flex-shrink: 0;
`,w8=l.h1`
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #1a2f47;
`,S8=l.p`
  margin: 0 0 16px;
  font-size: var(--font-size-xs);
  color: #6b7f94;
`,k8=l.div`
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 28px;
  border-bottom: 1px solid #dde3ec;
  background: #f4f7fc;
  flex-shrink: 0;
`,tl=l.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: none;
  border-bottom: 2px solid ${e=>e.$active?"#1f6fd6":"transparent"};
  background: transparent;
  color: ${e=>e.$active?"#1f6fd6":"#4a5f73"};
  font-size: var(--font-size-xs);
  font-weight: ${e=>e.$active?"700":"500"};
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: #1f6fd6;
  }
`,j8=l.div`
  flex: 1;
  min-height: 0;
  background: #ffffff;
  margin: 12px 28px 20px;
  border: 1px solid #e2e8f2;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
`,nl=l.div`
  display: ${e=>e.$visible?"flex":"none"};
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;function I8({onGoToWorkspace:e}){const[n,r]=c.useState("files");return t.jsxs(y8,{children:[t.jsxs(v8,{children:[t.jsx(w8,{children:"资源中心"}),t.jsx(S8,{children:"管理工作区文件、知识库和个人文件"})]}),t.jsxs(k8,{children:[t.jsxs(tl,{$active:n==="files",onClick:()=>r("files"),children:[t.jsx(Vn,{size:14})," 工作区文件"]}),t.jsxs(tl,{$active:n==="kb",onClick:()=>r("kb"),children:[t.jsx(Or,{size:14})," 知识库"]}),t.jsxs(tl,{$active:n==="personal",onClick:()=>r("personal"),children:[t.jsx(cc,{size:14})," 个人文件"]})]}),t.jsxs(j8,{children:[t.jsx(nl,{$visible:n==="files",children:t.jsx($z,{onFileOpen:e})}),t.jsx(nl,{$visible:n==="kb",children:t.jsx(Uz,{})}),t.jsx(nl,{$visible:n==="personal",children:t.jsx(b8,{})})]})]})}const $8={providers:{cuhk:{label:"CUHK AI",defaultModel:"gpt-4o",defaultBaseUrl:"https://ai.cuhk.edu.cn/open/v1",builtinKeySupported:!1,builtinKeyEnvNames:[]},qwen:{label:"通义千问",defaultModel:"qwen-max",defaultBaseUrl:"https://dashscope.aliyuncs.com/compatible-mode/v1",builtinKeySupported:!1,builtinKeyEnvNames:["QWEN_API_KEY"]},openai:{label:"OpenAI",defaultModel:"gpt-4o",defaultBaseUrl:"https://api.openai.com/v1",builtinKeySupported:!1,builtinKeyEnvNames:["OPENAI_API_KEY"]},deepseek:{label:"DeepSeek",defaultModel:"deepseek-chat",defaultBaseUrl:"https://api.deepseek.com/v1",builtinKeySupported:!1,builtinKeyEnvNames:["DEEPSEEK_API_KEY"]},anthropic:{label:"Anthropic Claude",defaultModel:"claude-3-5-sonnet-20241022",defaultBaseUrl:"https://api.anthropic.com/v1",builtinKeySupported:!1,builtinKeyEnvNames:["ANTHROPIC_API_KEY"]},custom:{label:"自定义",defaultModel:"",defaultBaseUrl:"",builtinKeySupported:!1,builtinKeyEnvNames:[]}}},T8={active:"openai-image",providers:{nanobanana:{label:"Nanobanana",defaultModel:"nanobanana-v1",defaultEndpoint:"",builtinKeySupported:!1,builtinKeyEnvNames:["NANOBANANA_API_KEY"]},"openai-image":{label:"OpenAI Image",defaultModel:"dall-e-3",defaultEndpoint:"https://api.openai.com/v1/images/generations",builtinKeySupported:!1,builtinKeyEnvNames:["OPENAI_API_KEY"]},custom:{label:"自定义图像",defaultModel:"",defaultEndpoint:"",builtinKeySupported:!1,builtinKeyEnvNames:[]}}},Uc={llm:$8,image:T8},ni=Uc.llm.providers,rl=Uc.image.providers,hr={cuhk:{id:"cuhk",...ni.cuhk},qwen:{id:"qwen",...ni.qwen},deepseek:{id:"deepseek",...ni.deepseek},openai:{id:"openai",...ni.openai},anthropic:{id:"anthropic",...ni.anthropic},custom:{id:"custom",...ni.custom}},ic={nanobanana:{id:"nanobanana",...rl.nanobanana},"openai-image":{id:"openai-image",...rl["openai-image"]},custom:{id:"custom",...rl.custom}},C8=Uc.image.active,P8={cuhk:hr.cuhk.label,qwen:hr.qwen.label,deepseek:hr.deepseek.label,openai:hr.openai.label,anthropic:hr.anthropic.label,custom:hr.custom.label,nanobanana:ic.nanobanana.label,"openai-image":ic["openai-image"].label};function Fr(e){return hr[e]}function sx(e){return ic[e]}function il(e){return Fr(e).builtinKeySupported}function A8(e){return sx(e).builtinKeySupported}function _8(e){return e?P8[e]||e:"未设置"}function Qf(e){return e==="build-config"?"本地 build 配置":e==="environment"?"环境变量 / .env":"未配置"}const em=l.div`
  display: grid;
  gap: 14px;
  padding: 16px;
  color: #304255;
`,Xo=l.section`
  border: 1px solid #dde3ec;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
`,Zo=l.div`
  padding: 12px 14px;
  border-bottom: 1px solid #e7edf4;
  background: #f8fbff;
`,Qo=l.div`
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #1f3142;
`,es=l.div`
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: #627385;
  line-height: 1.6;
`,ts=l.div`
  padding: 14px;
`,Tt=l.label`
  font-size: var(--font-size-xs);
  color: #627385;
  display: block;
  margin-bottom: 6px;
`,Jt=l.input`
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #d6e0ea;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  outline: none;
  color: #304255;
  background: #ffffff;
`,tm=l.textarea`
  width: 100%;
  min-height: 82px;
  padding: 9px 10px;
  border: 1px solid #d6e0ea;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  outline: none;
  color: #304255;
  background: #ffffff;
  resize: vertical;
`,ri=l.select`
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #d6e0ea;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  outline: none;
  color: #304255;
  background: #ffffff;
`,Xt=l.div`
  margin-top: 10px;
`,lr=l.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`,zn=l.div`
  flex: 1;
`,ol=l.button`
  width: 100%;
  padding: 10px 14px;
  border: ${e=>e.$primary?"none":"1px solid #d6e0ea"};
  border-radius: 8px;
  background: ${e=>e.$primary?"#0e639c":"#ffffff"};
  color: ${e=>e.$primary?"#fff":"#304255"};
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`,Ki=l.div`
  margin-top: 8px;
  font-size: var(--font-size-xs);
  color: #627385;
  line-height: 1.6;
`,sl=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #dce5ef;
  border-radius: 8px;
  background: #f8fbff;
  margin-top: 10px;
`,al=l.div`
  flex: 1;
`,ll=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #1f3142;
`,cl=l.div`
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: #627385;
  line-height: 1.5;
`,dl=l.button`
  border: 1px solid ${e=>e.$active?"#0e639c":"#d6e0ea"};
  border-radius: 999px;
  background: ${e=>e.$active?"#0e639c":"#ffffff"};
  color: ${e=>e.$active?"#fff":"#304255"};
  padding: 8px 12px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
`,nm=l.div`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${e=>e.$error?"#f1c5c5":"#cfe0ef"};
  background: ${e=>e.$error?"#fff6f6":"#f5fbff"};
  color: ${e=>e.$error?"#b33838":"#2a5f8f"};
  font-size: var(--font-size-xs);
  line-height: 1.6;
`,E8=()=>{const e=sx(C8),[n,r]=c.useState(!0),[i,o]=c.useState(!1),[s,a]=c.useState(!1),[d,u]=c.useState(!1),[f,p]=c.useState(""),[m,g]=c.useState(!1),[h,x]=c.useState("qwen"),[k,v]=c.useState(""),[y,j]=c.useState(!0),[S,z]=c.useState(!1),[P,I]=c.useState("none"),[b,$]=c.useState(""),[O,D]=c.useState(""),[R,V]=c.useState("nanobanana"),[te,q]=c.useState(""),[W,fe]=c.useState(!0),[le,Q]=c.useState(!1),[ge,J]=c.useState("none"),[H,T]=c.useState(""),[w,L]=c.useState(""),[N,M]=c.useState(nt.rewriteLanguage),[A,ee]=c.useState(nt.rewriteRequirements),[me,Ie]=c.useState(nt.refTopic),[Fe,Z]=c.useState(nt.refYearFrom),[X,ye]=c.useState(nt.refYearTo),[Ee,G]=c.useState(nt.refTargetCount),[F,se]=c.useState(nt.refSoftFloorPercent),[_e,de]=c.useState(nt.refCandidatePoolSize),[oe,Te]=c.useState(nt.refAnalysisWindow),[C,E]=c.useState(nt.continueGoal),[K,_]=c.useState(nt.continueWords),[Y,ae]=c.useState(nt.imageAspectRatio),[je,Le]=c.useState(nt.genLanguage),[Ke,Be]=c.useState(nt.genPaperType),[mt,He]=c.useState(nt.genNoImageMode),[dt,Xe]=c.useState(nt.genCitationMode),[Re,tt]=c.useState(nt.genYearFrom),[ue,ze]=c.useState(nt.genYearTo),[re,pe]=c.useState(nt.genExtraContext);c.useEffect(()=>{(async()=>{try{const Ae=await window.electronAPI.getSettings(),De=Ae.llm.provider,Ne=Fr(De);x(De),v(Ae.llm.apiKey);const qe=Ae.llm.builtinKeyAvailable;z(qe);const Oe=qe?Ae.llm.useBuiltinKey:!1;j(Oe),I(Ae.llm.builtinKeySource!=="none"?Ae.llm.builtinKeySource:"environment"),$(Ae.llm.model||Ne.defaultModel),D(Ae.llm.baseUrl||Ne.defaultBaseUrl),V(e.id),q(Ae.image.provider===e.id?Ae.image.apiKey:""),fe(Ae.image.provider===e.id?Ae.image.useBuiltinKey:!0),Q(Ae.image.provider===e.id?Ae.image.builtinKeyAvailable:!0),J(Ae.image.provider===e.id&&Ae.image.builtinKeySource!=="none"?Ae.image.builtinKeySource:"environment"),T(e.defaultModel),L(e.defaultEndpoint),ee(Ae.defaults.rewriteRequirements),Ie(Ae.defaults.referenceTopic),Z(Ae.defaults.referenceYearFrom),ye(Ae.defaults.referenceYearTo),G(Ae.defaults.referenceCount),se(Ae.defaults.referenceSoftFloorPercent),de(Ae.defaults.referenceCandidatePoolSize),Te(Ae.defaults.referenceAnalysisWindow),E(Ae.defaults.continueGoal),_(Ae.defaults.targetWords),ae(Ae.defaults.imageAspectRatio),Le(Ae.defaults.language),Be(Ae.defaults.paperType),He(Ae.defaults.noImageMode),Xe(localStorage.getItem("ai_tool_gen_citation_mode")==="inline"?"inline":nt.genCitationMode),tt(Ae.defaults.yearFrom),ze(Ae.defaults.yearTo),pe(Ae.defaults.extraContext),Zl(Ae)}finally{r(!1)}})()},[]);const ne=async()=>{o(!0),p(""),g(!1);try{const ie=await window.electronAPI.saveSettings({llm:{provider:h,apiKey:y?"":k.trim(),useBuiltinKey:y,builtinKeyAvailable:S,builtinKeySource:y?P:"none",model:b.trim()||Fr(h).defaultModel,baseUrl:O.trim()||Fr(h).defaultBaseUrl},image:{provider:e.id,apiKey:W?"":te.trim(),useBuiltinKey:W,builtinKeyAvailable:le,builtinKeySource:W?ge:"none",model:e.defaultModel,endpoint:e.defaultEndpoint},defaults:{language:je,paperType:Ke,noImageMode:mt,yearFrom:Re.trim(),yearTo:ue.trim(),extraContext:re.trim(),continueGoal:C.trim(),targetWords:Math.max(80,Math.min(1e4,Number(K)||nt.continueWords)),rewriteRequirements:A.trim(),referenceTopic:me.trim(),referenceYearFrom:Fe.trim(),referenceYearTo:X.trim(),referenceCount:Math.max(1,Math.min(80,Number(Ee)||nt.refTargetCount)),referenceSoftFloorPercent:Math.max(0,Math.min(100,Number(F)||0)),referenceCandidatePoolSize:Math.max(20,Math.min(1e3,Number(_e)||nt.refCandidatePoolSize)),referenceAnalysisWindow:Math.max(5,Math.min(120,Number(oe)||nt.refAnalysisWindow)),livePreview:!0,imageAspectRatio:Y}});return x(ie.llm.provider),v(ie.llm.apiKey),j(ie.llm.useBuiltinKey),z(ie.llm.builtinKeyAvailable),I(ie.llm.builtinKeySource),$(ie.llm.model),D(ie.llm.baseUrl),q(ie.image.apiKey),fe(ie.image.useBuiltinKey),Q(ie.image.builtinKeyAvailable),J(ie.image.builtinKeySource),Zl(ie),localStorage.setItem("ai_tool_rewrite_language",N),localStorage.setItem("ai_tool_gen_citation_mode",dt),p("设置已保存，后续文字生成、图片生成、文献检索和续写将按这些预设执行。"),window.dispatchEvent(new CustomEvent("ai-settings-updated",{detail:ie})),!0}catch(ie){return g(!0),p(ie instanceof Error?ie.message:String(ie)),!1}finally{o(!1)}},Ve=async()=>{a(!0),p(""),g(!1);try{if(!await ne())return;const Ae=await window.electronAPI.testLlmConnection();p(`文字模型连通成功: ${Ae}`)}catch(ie){g(!0),p(ie instanceof Error?ie.message:String(ie))}finally{a(!1)}},ve=async()=>{u(!0),p(""),g(!1);try{if(!await ne())return;const Ae=await window.electronAPI.testImageConnection();p(`图片模型连通成功: ${Ae}`)}catch(ie){g(!0),p(ie instanceof Error?ie.message:String(ie))}finally{u(!1)}};if(n)return t.jsx(em,{children:t.jsx(nm,{children:"正在加载设置..."})});const ct=ie=>{const Ae=Fr(ie);x(ie),$(Ae.defaultModel),D(Ae.defaultBaseUrl),v("");const De=il(ie);z(De),j(De)},Je=il(h)&&S,Ge=A8(R)&&le;return t.jsxs(em,{children:[f&&t.jsx(nm,{$error:m,children:f}),t.jsxs(Xo,{children:[t.jsxs(Zo,{children:[t.jsx(Qo,{children:"文字模型设置"}),t.jsx(es,{children:"选择 AI 供应商并填写对应的 API Key；内置 Key 可用时无需填写。"})]}),t.jsxs(ts,{children:[t.jsxs(Xt,{children:[t.jsx(Tt,{children:"供应商"}),t.jsx(ri,{value:h,onChange:ie=>ct(ie.target.value),children:Object.values(hr).map(ie=>t.jsxs("option",{value:ie.id,children:[ie.label,ie.builtinKeySupported?" ✦":""]},ie.id))}),t.jsx(Ki,{style:{marginTop:4},children:"✦ 标注的供应商支持软件内置 Key（学校 / 平台提供），无需自备 Key。"})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"模型名"}),t.jsx(Jt,{type:"text",value:b,onChange:ie=>$(ie.target.value),placeholder:Fr(h).defaultModel})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"接口地址 (Base URL)"}),t.jsx(Jt,{type:"text",value:O,onChange:ie=>D(ie.target.value),placeholder:Fr(h).defaultBaseUrl})]}),t.jsxs(sl,{children:[t.jsxs(al,{children:[t.jsx(ll,{children:"内置默认 Key"}),t.jsx(cl,{children:Je?`当前供应商支持软件内置 Key，界面不会显示其明文。当前来源：${Qf(P)}。`:il(h)?`当前构建里没有可用的内置 ${_8(h)} Key，请改用你自己的 Key。`:"当前供应商不支持软件内置默认 Key，请填写自己的 Key。"})]}),t.jsx(dl,{type:"button",$active:y,disabled:!Je,onClick:()=>j(ie=>Je?!ie:ie),children:y?"使用内置 Key":"使用自定义 Key"})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"API Key"}),t.jsx(Jt,{type:"password",value:y?"":k,disabled:y,onChange:ie=>v(ie.target.value),placeholder:y?"当前使用软件内置默认 Key，明文不会显示":"输入文字模型 API Key"})]}),t.jsx(lr,{children:t.jsx(ol,{onClick:()=>void Ve(),disabled:s,children:s?"检测中...":"检测文字模型"})})]})]}),t.jsxs(Xo,{children:[t.jsxs(Zo,{children:[t.jsx(Qo,{children:"图片模型设置"}),t.jsxs(es,{children:["当前版本固定为 ",e.label," 默认链路，暂不开放图片供应商切换。"]})]}),t.jsxs(ts,{children:[t.jsxs(Ki,{children:["当前固定供应商：",e.label,"；模型：",e.defaultModel,"；接口：",e.defaultEndpoint,"。"]}),t.jsxs(sl,{children:[t.jsxs(al,{children:[t.jsx(ll,{children:"内置默认 Key"}),t.jsx(cl,{children:Ge?`当前供应商支持软件内置 Key，界面不会显示其明文。当前来源：${Qf(ge)}。`:R==="nanobanana"?`当前构建里没有可用的内置 ${e.label} Key，请改用你自己的 Key。`:`只有 ${e.label} 供应商支持软件内置默认 Key。`})]}),t.jsx(dl,{type:"button",$active:W,disabled:!Ge,onClick:()=>fe(ie=>Ge?!ie:ie),children:W?"使用内置 Key":"使用自定义 Key"})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"API Key"}),t.jsx(Jt,{type:"password",value:W?"":te,disabled:W,onChange:ie=>q(ie.target.value),placeholder:W?"当前使用软件内置默认 Key，明文不会显示":"输入图片模型 API Key"})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"默认图片比例"}),t.jsxs(ri,{value:Y,onChange:ie=>ae(ie.target.value),children:[t.jsx("option",{value:"1:1",children:"1:1"}),t.jsx("option",{value:"16:9",children:"16:9"}),t.jsx("option",{value:"9:16",children:"9:16"}),t.jsx("option",{value:"4:3",children:"4:3"}),t.jsx("option",{value:"3:4",children:"3:4"}),t.jsx("option",{value:"auto",children:"自动"})]})]}),t.jsx(lr,{children:t.jsx(ol,{onClick:()=>void ve(),disabled:d,children:d?"检测中...":"检测图片模型"})})]})]}),t.jsxs(Xo,{children:[t.jsxs(Zo,{children:[t.jsx(Qo,{children:"论文与文献预设"}),t.jsx(es,{children:"设置默认论文类型、写作语言、文献年份范围，以及候选池、分析窗口和最终引用目标。"})]}),t.jsxs(ts,{children:[t.jsxs(lr,{children:[t.jsxs(zn,{children:[t.jsx(Tt,{children:"默认文章类型"}),t.jsxs(ri,{value:Ke,onChange:ie=>Be(ie.target.value),children:[t.jsx("option",{value:"review",children:"综述论文"}),t.jsx("option",{value:"research",children:"研究论文"}),t.jsx("option",{value:"thesis_research",children:"学位论文"})]})]}),t.jsxs(zn,{children:[t.jsx(Tt,{children:"默认写作语言"}),t.jsxs(ri,{value:je,onChange:ie=>Le(ie.target.value),children:[t.jsx("option",{value:"zh",children:"中文"}),t.jsx("option",{value:"en",children:"English"})]})]})]}),t.jsxs(sl,{children:[t.jsxs(al,{children:[t.jsx(ll,{children:"默认无图模式"}),t.jsx(cl,{children:"开启后，按当前预设发起的整篇生成会跳过自动配图；关闭后允许正文里自动插图。"})]}),t.jsx(dl,{type:"button",$active:!mt,onClick:()=>He(ie=>!ie),children:mt?"无图模式":"自动配图"})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"默认引用策略"}),t.jsxs(ri,{value:dt,onChange:ie=>Xe(ie.target.value),children:[t.jsx("option",{value:"deferred",children:"先写后引"}),t.jsx("option",{value:"inline",children:"边写边引"})]})]}),t.jsxs(lr,{children:[t.jsxs(zn,{children:[t.jsx(Tt,{children:"整篇生成文献起始年份"}),t.jsx(Jt,{value:Re,onChange:ie=>tt(ie.target.value),placeholder:"如 2021"})]}),t.jsxs(zn,{children:[t.jsx(Tt,{children:"整篇生成文献截止年份"}),t.jsx(Jt,{value:ue,onChange:ie=>ze(ie.target.value),placeholder:"如 2026"})]})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"默认引文检索主题"}),t.jsx(Jt,{value:me,onChange:ie=>Ie(ie.target.value),placeholder:"为空时使用当前选中文本检索"})]}),t.jsxs(lr,{children:[t.jsxs(zn,{children:[t.jsx(Tt,{children:"引文检索起始年份"}),t.jsx(Jt,{value:Fe,onChange:ie=>Z(ie.target.value),placeholder:"如 2018"})]}),t.jsxs(zn,{children:[t.jsx(Tt,{children:"引文检索截止年份"}),t.jsx(Jt,{value:X,onChange:ie=>ye(ie.target.value),placeholder:"如 2026"})]})]}),t.jsxs(lr,{children:[t.jsxs(zn,{children:[t.jsx(Tt,{children:"最终目标引用条数"}),t.jsx(Jt,{type:"number",min:1,max:80,value:Ee,onChange:ie=>G(Number(ie.target.value)||nt.refTargetCount)})]}),t.jsxs(zn,{children:[t.jsx(Tt,{children:"Soft 模式最低达成比例"}),t.jsx(Jt,{type:"number",min:0,max:100,value:F,onChange:ie=>se(Number(ie.target.value)||0)})]})]}),t.jsx(Xt,{children:t.jsx(Ki,{children:"仅在 soft 模式下生效。比如目标 40、比例 80%，则系统会尽量保证最终不少于 32 条唯一参考文献，同时仍保持“相关性优先、不强行凑满”的策略。"})}),t.jsxs(lr,{children:[t.jsxs(zn,{children:[t.jsx(Tt,{children:"候选池检索条数"}),t.jsx(Jt,{type:"number",min:20,max:1e3,value:_e,onChange:ie=>de(Number(ie.target.value)||nt.refCandidatePoolSize)})]}),t.jsxs(zn,{children:[t.jsx(Tt,{children:"每轮引用分析窗口"}),t.jsx(Jt,{type:"number",min:5,max:120,value:oe,onChange:ie=>Te(Number(ie.target.value)||nt.refAnalysisWindow)})]})]}),t.jsx(Xt,{children:t.jsx(Ki,{children:"候选池只检索一次；正文每轮只从其中抽取这个窗口大小的文献喂给引用分析，避免全文生成明显变慢。"})}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"补充说明"}),t.jsx(tm,{value:re,onChange:ie=>pe(ie.target.value),placeholder:"例如：强调临床应用、必须包含方法比较、限制引用近五年文献"})]})]})]}),t.jsxs(Xo,{children:[t.jsxs(Zo,{children:[t.jsx(Qo,{children:"续写与重写预设"}),t.jsx(es,{children:"统一设置续写字数、续写目标和重写要求，编辑器右键动作会直接读取这些配置。"})]}),t.jsxs(ts,{children:[t.jsxs(Xt,{children:[t.jsx(Tt,{children:"续写目标"}),t.jsx(Jt,{value:C,onChange:ie=>E(ie.target.value),placeholder:"如：补全方法与讨论部分"})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"默认续写字数"}),t.jsx(Jt,{type:"number",min:80,max:1e4,value:K,onChange:ie=>_(Number(ie.target.value)||nt.continueWords)})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"重写语言"}),t.jsxs(ri,{value:N,onChange:ie=>M(ie.target.value),children:[t.jsx("option",{value:"auto",children:"自动保持原文语言"}),t.jsx("option",{value:"zh",children:"中文"}),t.jsx("option",{value:"en",children:"English"})]})]}),t.jsxs(Xt,{children:[t.jsx(Tt,{children:"重写要求"}),t.jsx(tm,{value:A,onChange:ie=>ee(ie.target.value),placeholder:"如：保留术语，增强逻辑衔接，避免口语化表达"})]}),t.jsx(Ki,{children:"这里保存的是默认预设。真正生成时，底部终端输入的任务主题会覆盖当前任务的主题描述。"})]})]}),t.jsx(lr,{children:t.jsx(ol,{$primary:!0,onClick:()=>void ne(),disabled:i,children:i?"保存中...":"保存全部设置"})}),t.jsx("div",{style:{marginTop:14,textAlign:"center"},children:t.jsx("button",{type:"button",onClick:()=>window.dispatchEvent(new CustomEvent("open-sidebar-tab",{detail:{tab:"account"}})),style:{background:"none",border:"none",color:"#0e639c",fontSize:14,cursor:"pointer",textDecoration:"underline",padding:0},children:"内部账号设置 →"})})]})},z8=l.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
  background: #f4f7fb;
`,D8=l.nav`
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #e0e8f2;
  padding: 20px 0 12px;
`,R8=l.div`
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #1f3142;
  padding: 0 16px 12px;
  border-bottom: 1px solid #e7edf4;
  margin-bottom: 8px;
`,ns=l.button`
  width: 100%;
  text-align: left;
  padding: 9px 18px;
  border: none;
  background: ${e=>e.$active?"#eef4ff":"transparent"};
  color: ${e=>e.$active?"#1a5fb4":"#304255"};
  font-size: var(--font-size-xs);
  font-weight: ${e=>e.$active?"600":"400"};
  cursor: pointer;
  border-left: ${e=>e.$active?"3px solid #1a5fb4":"3px solid transparent"};
  transition: background 0.12s;

  &:hover {
    background: ${e=>e.$active?"#eef4ff":"#f5f8ff"};
  }
`,M8=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  min-width: 0;
`,Cs=l.h1`
  font-size: 20px;
  font-weight: 700;
  color: #1f3142;
  margin: 0 0 4px;
`,Ps=l.p`
  font-size: var(--font-size-xs);
  color: #627385;
  margin: 0 0 24px;
`,F8=[{label:"100%（默认）",value:"1"},{label:"110%",value:"1.1"},{label:"125%",value:"1.25"},{label:"150%",value:"1.5"}],B8=l.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 16px;
`,L8=l.button`
  padding: 14px 18px;
  border: 2px solid ${e=>e.$selected?"#1a5fb4":"#dde3ec"};
  border-radius: 10px;
  background: ${e=>e.$selected?"#eef4ff":"#ffffff"};
  color: ${e=>e.$selected?"#1a5fb4":"#304255"};
  font-size: 14px;
  font-weight: ${e=>e.$selected?"700":"400"};
  cursor: pointer;
  text-align: left;
  transition: border-color 0.13s, background 0.13s;
  &:hover {
    border-color: ${e=>e.$selected?"#1a5fb4":"#96b8dc"};
    background: ${e=>e.$selected?"#eef4ff":"#f5f9ff"};
  }
`,N8=l.p`
  font-size: var(--font-size-xs);
  color: #627385;
  margin: 12px 0 0;
`;function O8(){const e=localStorage.getItem("aioffice.displayScale")??"1",[n,r]=Ct.useState(e);function i(o){r(o),localStorage.setItem("aioffice.displayScale",o),document.documentElement.style.zoom=o}return t.jsxs(t.Fragment,{children:[t.jsx(Cs,{children:"显示与缩放"}),t.jsx(Ps,{children:"调整整体界面缩放比例，适合高分辨率屏幕或大屏全屏使用。"}),t.jsx(B8,{children:F8.map(o=>t.jsx(L8,{$selected:n===o.value,onClick:()=>i(o.value),children:o.label},o.value))}),t.jsx(N8,{children:"缩放设置立即生效，重启应用后仍保持。"})]})}function W8(){return t.jsxs(t.Fragment,{children:[t.jsx(Cs,{children:"Skill 管理中心"}),t.jsx(Ps,{children:"Skill 商店、已购 Skill 包、下载、安装和启用状态已移到左侧侧边栏的 Skill 中心。"}),t.jsxs("div",{style:{padding:"16px 18px",background:"#f0f6ff",border:"1px solid #c5d9f5",borderRadius:10,fontSize:14,color:"#1a3a5c",lineHeight:1.7},children:["请点击左侧侧边栏的 ",t.jsx("strong",{children:"🧩 Skill 中心"})," 入口，管理已购 Skill 包、下载 .aoskin 文件、打开 Skill 商店。"]})]})}function U8(){const[e,n]=c.useState("ai");return t.jsxs(z8,{children:[t.jsxs(D8,{children:[t.jsx(R8,{children:"设置"}),t.jsx(ns,{$active:e==="ai",onClick:()=>n("ai"),children:"AI 与服务配置"}),t.jsx(ns,{$active:e==="display",onClick:()=>n("display"),children:"显示与缩放"}),t.jsx(ns,{$active:e==="skills",onClick:()=>n("skills"),children:"Skill 管理中心"}),t.jsx(ns,{$active:e==="about",onClick:()=>n("about"),children:"关于"})]}),t.jsxs(M8,{children:[e==="ai"&&t.jsxs(t.Fragment,{children:[t.jsx(Cs,{children:"AI 与服务配置"}),t.jsx(Ps,{children:"配置 AI 模型、API 密钥、图片生成服务和邮件服务。"}),t.jsx(E8,{})]}),e==="display"&&t.jsx(O8,{}),e==="skills"&&t.jsx(W8,{}),e==="about"&&t.jsxs(t.Fragment,{children:[t.jsx(Cs,{children:"关于 AI-Office"}),t.jsx(Ps,{children:"版本信息与系统状态。"}),t.jsxs("div",{style:{fontSize:14,color:"#304255",lineHeight:1.8},children:[t.jsxs("div",{children:["AI-Office ",t.jsx("strong",{children:"3.0"})]}),t.jsx("div",{style:{marginTop:8,color:"#627385"},children:"基于 Electron + React 构建的智能办公平台。"})]})]})]})]})}const Hc=l.section`
  border: 1px solid #dde3ec;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
`,Kc=l.div`
  padding: 12px 14px;
  border-bottom: 1px solid #e7edf4;
  background: #f8fbff;
`,Gc=l.div`
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #1f3142;
`,qc=l.div`
  padding: 14px;
`,rm=l.div`
  margin-top: 10px;
`,im=l.label`
  font-size: var(--font-size-xs);
  color: #627385;
  display: block;
  margin-bottom: 6px;
`,om=l.input`
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #d6e0ea;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  outline: none;
  color: #304255;
  background: #ffffff;
  box-sizing: border-box;
`,Vc=l.button`
  width: 100%;
  margin-top: 10px;
  padding: 10px 14px;
  border: ${e=>e.$primary||e.$danger?"none":"1px solid #d6e0ea"};
  border-radius: 8px;
  background: ${e=>e.$danger?"#c64b4b":e.$primary?"#0e639c":"#ffffff"};
  color: ${e=>e.$primary||e.$danger?"#fff":"#304255"};
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`,ax=l.button`
  padding: 7px 14px;
  border: ${e=>e.$primary?"none":"1px solid #d6e0ea"};
  border-radius: 8px;
  background: ${e=>e.$primary?"#0e639c":"#ffffff"};
  color: ${e=>e.$primary?"#fff":"#304255"};
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`,Dn=l.div`
  padding: 10px 12px;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid ${e=>e.$error?"#f1c5c5":e.$warn?"#f5ddb0":e.$ok?"#b3dfc3":"#cfe0ef"};
  background: ${e=>e.$error?"#fff6f6":e.$warn?"#fffbf2":e.$ok?"#f2fbf5":"#f5fbff"};
  color: ${e=>e.$error?"#b33838":e.$warn?"#7a5a10":e.$ok?"#1a6336":"#2a5f8f"};
  font-size: var(--font-size-xs);
  line-height: 1.6;
`,kn=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid #f0f4f8;
  font-size: var(--font-size-xs);
  color: #304255;
  &:last-child { border-bottom: none; }
`,jn=l.span`
  color: #627385;
  flex-shrink: 0;
`,In=l.span`
  color: #1f3142;
  font-weight: 600;
  word-break: break-all;
  text-align: right;
`,hs=l.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  background: ${e=>e.$ok?"#e7f6ec":e.$warn?"#fff4e0":"#f4f4f4"};
  color: ${e=>e.$ok?"#125f36":e.$warn?"#7a5a10":"#627385"};
`,H8=l.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
`;function sm(e){if(!e)return t.jsx(hs,{children:"未创建"});const n=e.status==="active",r=e.syncStatus??"—",i=e.syncStatus==="synced";return t.jsxs("span",{style:{display:"inline-flex",gap:4},children:[t.jsx(hs,{$ok:n,$warn:!n,children:e.status}),t.jsx(hs,{$ok:i,$warn:!i&&!!e.syncStatus,children:r})]})}function K8(){const{state:e,login:n}=rn(),[r,i]=c.useState(""),[o,s]=c.useState(""),a=e.phase==="loading",d=c.useCallback(async u=>{u.preventDefault(),await n(r.trim(),o)},[n,r,o]);return t.jsxs("form",{onSubmit:d,children:[e.phase==="error"&&t.jsx(Dn,{$error:!0,children:e.message}),t.jsxs(rm,{children:[t.jsx(im,{children:"用户名"}),t.jsx(om,{type:"text",autoComplete:"username",value:r,onChange:u=>i(u.target.value),placeholder:"输入内部账号用户名",disabled:a})]}),t.jsxs(rm,{children:[t.jsx(im,{children:"密码"}),t.jsx(om,{type:"password",autoComplete:"current-password",value:o,onChange:u=>s(u.target.value),placeholder:"输入密码",disabled:a})]}),t.jsx("div",{style:{fontSize:14,color:"#8a9db5",marginTop:8},children:"登录后将自动配置内部邮箱和内部通讯。"}),t.jsx(Vc,{$primary:!0,type:"submit",disabled:a||!r||!o,children:a?"登录中...":"登录内部账号"})]})}function G8(){const{state:e,logout:n,loadBindings:r}=rn(),[i,o]=c.useState(!1);if(e.phase!=="logged_in")return null;const{user:s,bindings:a,bindingsPhase:d,bindingsError:u}=e.session,f=async()=>{o(!0);try{await r()}catch{}finally{o(!1)}};return t.jsxs(t.Fragment,{children:[s.mustChangePassword&&t.jsx(Dn,{$warn:!0,children:"⚠ 请尽快修改初始密码"}),t.jsxs("div",{style:{marginTop:10},children:[t.jsxs(kn,{children:[t.jsx(jn,{children:"用户名"}),t.jsx(In,{children:s.username})]}),t.jsxs(kn,{children:[t.jsx(jn,{children:"显示名"}),t.jsx(In,{children:s.displayName})]}),t.jsxs(kn,{children:[t.jsx(jn,{children:"邮箱"}),t.jsx(In,{children:s.email})]}),t.jsxs(kn,{children:[t.jsx(jn,{children:"角色"}),t.jsx(In,{children:(s.roles||[]).join(", ")||"-"})]}),t.jsxs(kn,{children:[t.jsx(jn,{children:"AccountCenter 状态"}),t.jsx(In,{children:t.jsx(hs,{$ok:s.status==="active",$warn:s.status!=="active",children:s.status})})]})]}),t.jsxs("div",{style:{marginTop:12},children:[d==="loading"||!d?t.jsx(Dn,{children:"正在读取服务绑定..."}):d==="error"?t.jsx(Dn,{$warn:!0,children:u||"服务绑定状态读取失败"}):a?t.jsxs(t.Fragment,{children:[t.jsxs(kn,{children:[t.jsx(jn,{children:"mail"}),t.jsx(In,{children:sm(a.mail)})]}),t.jsxs(kn,{children:[t.jsx(jn,{children:"office"}),t.jsx(In,{children:sm(a.office)})]})]}):t.jsx(Dn,{$warn:!0,children:"服务绑定状态不可用"}),t.jsx(H8,{children:t.jsx(ax,{type:"button",onClick:f,disabled:i||d==="loading",children:i?"刷新中...":"刷新绑定状态"})})]}),t.jsx(Vc,{$danger:!0,type:"button",onClick:n,style:{marginTop:12},children:"退出登录"})]})}function q8(){const{state:e,applyEmailConfig:n,getSessionPassword:r}=rn(),[i,o]=c.useState(!1),[s,a]=c.useState(null),[d,u]=c.useState(null);if(e.phase!=="logged_in")return null;const{user:f,emailAutoStatus:p,emailAutoError:m}=e.session,g=c.useCallback(async()=>{o(!0),a(null),u(null);try{await n();const h=r();if(h){const x={providerType:"internal-imap",label:"内部邮箱",user:f.email,email:f.email,username:f.email,password:h,imapHost:ai,imapPort:Og,imapSecure:!0,smtpHost:ai,smtpPort:Wg,smtpSecure:!0,smtpStartTls:!1,allowSelfSignedCerts:!0},[k,v]=await Promise.all([window.electronAPI.emailTestConnection(x),window.electronAPI.emailTestSmtp(x)]);a(k),u(v)}else a({ok:!1,message:"会话密码不可用，请重新登录后测试"}),u({ok:!1,message:"会话密码不可用，请重新登录后测试"})}catch(h){a({ok:!1,message:h instanceof Error?h.message:"重新应用失败"})}finally{o(!1)}},[n,r,f]);return t.jsxs(Hc,{style:{marginTop:14},children:[t.jsx(Kc,{children:t.jsx(Gc,{children:"📧 内部邮箱"})}),t.jsxs(qc,{children:[t.jsxs(kn,{children:[t.jsx(jn,{children:"邮箱地址"}),t.jsx(In,{children:f.email})]}),t.jsxs(kn,{children:[t.jsx(jn,{children:"IMAP"}),t.jsxs(In,{children:[ai,":993 (SSL)"]})]}),t.jsxs(kn,{children:[t.jsx(jn,{children:"SMTP"}),t.jsxs(In,{children:[ai,":465 (SSL)"]})]}),t.jsxs(kn,{children:[t.jsx(jn,{children:"Webmail"}),t.jsx(In,{children:t.jsx("a",{href:Ug,target:"_blank",rel:"noopener noreferrer",style:{color:"#0e639c"},children:"打开 SOGo"})})]}),s||d?t.jsxs(t.Fragment,{children:[s&&t.jsxs(Dn,{$ok:s.ok,$error:!s.ok,style:{marginTop:10},children:["IMAP: ",s.ok?"✓ 连接成功":"✗ "+s.message]}),d&&t.jsxs(Dn,{$ok:d.ok,$error:!d.ok,style:{marginTop:4},children:["SMTP: ",d.ok?"✓ 连接成功":"✗ "+d.message]})]}):p==="applying"?t.jsx(Dn,{style:{marginTop:10},children:"正在自动配置内部邮箱..."}):p==="applied"?t.jsx(Dn,{$ok:!0,style:{marginTop:10},children:"✓ 内部邮箱已自动配置"}):p==="error"?t.jsxs(Dn,{$error:!0,style:{marginTop:10},children:["邮箱自动配置失败：",m||"未知错误"]}):null,i&&t.jsx("div",{style:{fontSize:14,color:"#8a9db5",marginTop:8},children:"正在重新应用并测试连接..."}),p!=="applying"&&!i&&t.jsx(ax,{type:"button",onClick:()=>void g(),disabled:i,style:{marginTop:8},children:p==="applied"||s?"重新应用并测试连接":"应用内部邮箱配置"}),t.jsx("div",{style:{fontSize:14,color:"#8a9db5",marginTop:6},children:"邮箱 SMTP/IMAP 密码使用邮箱初始密码（与 AccountCenter 登录密码独立管理，修改登录密码不影响邮箱连接）。"})]})]})}function V8(){const{state:e}=rn();return e.phase!=="logged_in"?null:t.jsxs(Hc,{style:{marginTop:14},children:[t.jsx(Kc,{children:t.jsx(Gc,{children:"💬 内部通讯"})}),t.jsxs(qc,{children:[t.jsx("div",{style:{fontSize:14,color:"#627385",lineHeight:1.6,marginBottom:10},children:"支持单聊与群聊，基于 AccountCenter Chat 服务。"}),t.jsx(Vc,{$primary:!0,type:"button",onClick:()=>window.dispatchEvent(new CustomEvent("open-chat-window")),children:"打开内部通讯"})]})]})}function Y8(){const{state:e}=rn(),n=e.phase==="logged_in";return t.jsxs(t.Fragment,{children:[t.jsxs(Hc,{children:[t.jsx(Kc,{children:t.jsx(Gc,{children:"🔐 内部账号（AccountCenter）"})}),t.jsx(qc,{children:n?t.jsx(G8,{}):t.jsx(K8,{})})]}),n&&t.jsxs(t.Fragment,{children:[t.jsx(q8,{}),t.jsx(V8,{})]})]})}const J8=l.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
  background: #f4f7fb;
`,X8=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  max-width: 680px;
`,Z8=l.h1`
  font-size: 20px;
  font-weight: 700;
  color: #1f3142;
  margin: 0 0 4px;
`,Q8=l.p`
  font-size: var(--font-size-xs);
  color: #627385;
  margin: 0 0 24px;
`;function e6(){return t.jsx(J8,{children:t.jsxs(X8,{children:[t.jsx(Z8,{children:"账号"}),t.jsx(Q8,{children:"管理当前登录账号、绑定状态和退出登录。"}),t.jsx(Y8,{})]})})}const oc=new Map,t6=new Map;function n6(){return Array.from(oc.values())}function _3(e){const n=oc.get(e);if(n)return n;const r=t6.get(e);if(r)return oc.get(r)}function lx(e){return{createSession(n={}){return{profile:e,...n}},toArtifact(n){return bg({id:n.artifactId,profile:e,document:n.document,sourceRefs:n.sourceRefs,exportRefs:n.exportRefs,metadata:{...n.metadata||{},command:n.command,session:n.session}})}}}const E3=lx("freewrite"),cx=lx("paper");function r6(e={}){return cx.createSession(e)}function i6(e){return cx.toArtifact(e)}const o6=/^(?:#{1,6}\s*)?(?:任务说明|任务要求|写作要求|输出要求|操作要求|生成要求|注意事项|系统提示|提示词|prompt|instructions?|requirements?|task|goal|output|status|执行状态|状态说明)\s*[:：]?$/i,s6=/^(?:任务说明|任务要求|写作要求|输出要求|操作要求|生成要求|注意事项|系统提示|提示词|prompt|instructions?|requirements?|task|goal|output|status|执行状态|状态说明)\s*[:：]/i,a6=/^(?:当前)?(?:任务|流程)?(?:状态|进度)\s*[:：]|^(?:正在|开始|继续|准备|已完成|已经完成|已生成|生成完成|处理中|执行中|本次任务已)(?:全文|文稿|正文|论文|内容|任务|结果|整文|生成)/,l6=/^(?:好的[，,。:]?|下面(?:是|将为你|给出)?[：:]?|以下(?:是|为)?[：:]?|根据(?:你的|以上)?(?:要求|内容|主题)[，,:：]?|我将(?:为你)?[：:]?|让我们(?:先)?[：:]?|先说明一下[：:]?|说明如下[：:]?)/,c6=/^(?:如需|如果你(?:还)?需要|若需|欢迎继续|以上(?:为|就是)|希望(?:这|以上)|你可以继续|请告诉我|是否需要我|还可以继续|后续如需)/;function ho(e){return String(e||"").replace(/\r\n?/g,`
`)}function d6(e){return o6.test(e)}function As(e){return s6.test(e)||a6.test(e)||/^(?:prompt|instruction|instructions|requirements|task|goal|output)\s*[:：]/i.test(e)||/^(?:已打开|已保存|已写入|已同步|打开目录|打开文稿|下载文稿)\b/.test(e)}function u6(e){return/^(?:[-*+]\s+|\d+[.)、]\s+|[A-Za-z][.)]\s+|\[[ xX]\]\s+)/.test(e)||/^(?:请|需|需要|必须|禁止|避免|保留|只清掉|只清理|输出|注意|不要|不得)\b/.test(e)||/^(?:should|must|need to|do not|don't|keep|remove|avoid|preserve|output)\b/i.test(e)||As(e)}function p6(e){return l6.test(e)}function f6(e){return c6.test(e)||As(e)}function m6(e,n){for(let r=n;r<e.length;r+=1){const i=e[r].trim();if(i)return i}return""}function g6(e){return/^#{1,6}\s+\S/.test(e)||/^!\[[^\]]*\]\([^)]+\)/.test(e)||/^(?:[-*+]\s+|\d+[.)、]\s+|[A-Za-z][.)]\s+)/.test(e)||/^(?:图|表|Figure|Table)\s*\d+/i.test(e)||/^\[\d+(?:\s*[,\-]\s*\d+)*\]\s+\S/.test(e)||/^\|.*\|$/.test(e)}function dx(e){const n=ho(e).split(`
`);let r=0;for(;r<n.length;){const i=n[r].trim();if(!i){r+=1;continue}if(d6(i)){for(r+=1;r<n.length;){const o=n[r].trim();if(!o){r+=1;break}if(u6(o)){r+=1;continue}break}continue}if(As(i)){r+=1;continue}if(p6(i)){const o=m6(n,r+1);if(!o||g6(o)||!As(o)){r+=1;continue}}break}return n.slice(r).join(`
`)}function ux(e){const n=ho(e).split(`
`);let r=n.length-1;for(;r>=0;){const i=n[r].trim();if(!i){r-=1;continue}if(f6(i)){r-=1;continue}break}return n.slice(0,r+1).join(`
`)}function h6(e){return ho(e).replace(/\n[ \t]+\n/g,`

`).replace(/\n{3,}/g,`

`)}function x6(e){const n=ho(Ur(String(e||""))).trim();if(!n)return!1;const r=dx(n);return ux(r)!==n}function b6(e){let n=ho(Ur(String(e||"")));return n=dx(n),n=ux(n),n=h6(n),n.trim()}const y6="__AI_WRITER_EMBEDDED_DOC_V1__:";function am(e){const n=String(e||"").trim();return!n||n.length>180||/^(摘要|abstract|关键词|关键字|keywords?|参考文献|references)$/i.test(n)?!1:!/[。！？.!?；;:]$/.test(n)}function v6(e){const r=String(e||"").trim().match(/^!\[([^\]]*)\]\((\S+?)(?:\s+["'](.+?)["'])?\)$/);return r?{alt:String(r[1]||"").trim(),src:String(r[2]||"").trim(),title:r[3]?String(r[3]).trim():void 0}:null}function px(e){return/^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(String(e||"").trim())}function sc(e){return String(e||"").trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(n=>n.trim())}function lm(e){return/^(图|表|figure|fig\.?|table)\s*\d+[\s.:：-]/i.test(String(e||"").trim())}function w6(e){return/^(脚注|注释|footnotes?|notes?)$/i.test(String(e||"").trim())}function S6(e){return/^(参考文献|references)$/i.test(String(e||"").trim())}function cm(e){const n=String(e||"").trim().match(/^\[\^([^\]]+)\]:\s+(.+)$/);return n?{id:String(n[1]||"").trim(),text:String(n[2]||"").trim()}:null}function k6(e,n){const i=String(e||"").trim().match(/^(?:\[(\d+)\]|(\d+)[.)])\s+(.+)$/);if(!i)return null;const o=Number(i[1]||i[2]||0)||void 0,s=String(i[3]||"").trim(),a=o&&(n!=null&&n[o-1])?n[o-1]:void 0;return{text:s,citationNumber:o,title:a==null?void 0:a.title,year:(a==null?void 0:a.year)??null,doi:(a==null?void 0:a.doi)??null}}function j6(e,n){const r=e.citationNumber||n+1,i=String(e.text||"").trim();if(i)return`[${r}] ${i}`;const o=[e.title?String(e.title).trim():"",e.year?`(${e.year})`:"",e.doi?`DOI: ${e.doi}`:""].filter(Boolean);return`[${r}] ${o.join(" ").trim()||"Untitled reference"}`}function I6(e,n){const r=sc(e);return Array.from({length:n},(i,o)=>{const s=String(r[o]||"").trim();return/^:-+:$/.test(s)?"center":/^-+:$/.test(s)?"right":/^:-+$/.test(s)?"left":null})}function $6(e){if(e.length<2||!px(e[1]))return null;const n=sc(e[0]);if(!n.length)return null;const r=e.slice(2).map(sc).filter(a=>a.length>0),i=Math.max(n.length,...r.map(a=>a.length)),o=(a,d,u=!1)=>({text:a,paragraphs:[{text:a}],colspan:1,rowspan:1,header:u,column:d}),s=[Array.from({length:i},(a,d)=>o(n[d]||"",d,!0)),...r.map(a=>Array.from({length:i},(d,u)=>o(a[u]||"",u,!1)))];return{type:"table",rows:s.length,cols:i,tableRows:s,columnAlignments:I6(e[1],i),sourceMarkdown:e.join(`
`)}}function T6(e,n={}){const r=String(e||"").replace(/\r/g,"").trim();if(!r)return[{type:"paragraph",text:""}];const i=r.split(`
`),o=[],s=[];let a=!1,d=null,u=0;const f=[],p=()=>{const m=s.join(`
`).trim();s.length=0,m&&o.push({type:"paragraph",text:m,paragraphStyle:d==="abstract"?"Abstract":d==="keywords"?"Keywords":void 0,alignment:d==="abstract"?"justify":d==="keywords"?"left":"justify",semanticRole:d==="abstract"?"abstract-body":d==="keywords"?"keywords-body":"paragraph"})};for(;u<i.length;){const m=i[u],g=String(m||"").trim();if(!g){p(),u+=1;continue}const h=cm(g);if(h){p(),f.push(h),u+=1;continue}const x=g.match(/^\$\$(.*)$/);if(x){p();const y=[];let j=x[1]||"";j.trim()&&y.push(j),u+=1;let S=/\$\$$/.test(g);for(S&&j.replace(/\$\$$/,"").trim()&&(y[0]=j.replace(/\$\$$/,"").trim());!S&&u<i.length;){const z=String(i[u]||"");if(/\$\$$/.test(z.trim())){const P=z.trim().replace(/\$\$$/,"").trim();P&&y.push(P),S=!0,u+=1;break}y.push(z),u+=1}o.push({type:"formula",latex:y.join(`
`).trim(),display:"block"});continue}if(u+1<i.length&&g.includes("|")&&px(i[u+1])){p();const y=[g,String(i[u+1]||"").trim()];for(u+=2;u<i.length&&String(i[u]||"").trim().includes("|");)y.push(String(i[u]||"").trim()),u+=1;const j=$6(y);if(j){for(;u<i.length&&!String(i[u]||"").trim();)u+=1;u<i.length&&lm(i[u])?(j.caption=String(i[u]||"").trim(),o.push(j),o.push({type:"caption",text:j.caption,targetType:"table"}),u+=1):o.push(j),d=null;continue}}const k=v6(g);if(k){for(p(),o.push({type:"image",alt:k.alt||"image",title:k.title,sourceId:k.src,previewSrc:k.src});u+1<i.length&&!String(i[u+1]||"").trim();)u+=1;if(u+1<i.length&&lm(i[u+1])){const y=String(i[u+1]||"").trim(),j=o[o.length-1];(j==null?void 0:j.type)==="image"&&(j.caption=y),o.push({type:"caption",text:y,targetType:"image"}),u+=1}u+=1;continue}const v=g.match(/^(#{1,6})\s+(.+)$/);if(v){p();const y=Math.max(1,Math.min(v[1].length,6)),j=v[2].trim();if(!a&&y===1&&am(j)){o.push({type:"paragraph",text:j,paragraphStyle:"Title",alignment:"center"}),a=!0,d=null,u+=1;continue}if(/^(摘要|abstract)$/i.test(j)){o.push({type:"heading",level:1,text:j,paragraphStyle:"AbstractHeading",alignment:"center",semanticRole:"abstract-heading"}),d="abstract",u+=1;continue}if(/^(关键词|关键字|keywords?)$/i.test(j)){o.push({type:"heading",level:1,text:j,paragraphStyle:"KeywordsHeading",alignment:"left",semanticRole:"keywords-heading"}),d="keywords",u+=1;continue}if(S6(j)){p();const S=[];for(u+=1;u<i.length;){const z=String(i[u]||"").trim();if(!z){u+=1;continue}if(/^#{1,6}\s+/.test(z))break;const P=k6(z,n.references);if(!P)break;S.push(P),u+=1}o.push({type:"reference-list",heading:j,items:S}),d=null;continue}if(w6(j)){p();const S=[];for(u+=1;u<i.length;){const z=String(i[u]||"").trim();if(!z){u+=1;continue}if(/^#{1,6}\s+/.test(z))break;const P=cm(z);if(P){S.push(P),u+=1;continue}S.push({id:String(S.length+1),text:z}),u+=1}o.push({type:"footnote-list",heading:j,items:S}),d=null;continue}o.push({type:"heading",level:y,text:j,paragraphStyle:`Heading${y}`}),a=!0,d=null,u+=1;continue}if(!a&&am(g)){p(),o.push({type:"paragraph",text:g,paragraphStyle:"Title",alignment:"center",semanticRole:"title"}),a=!0,u+=1;continue}s.push(g),u+=1}return p(),f.length>0&&o.push({type:"footnote-list",heading:"Footnotes",items:f}),o.length?o:[{type:"paragraph",text:""}]}function C6(e){return`${y6}${JSON.stringify({version:1,source:"paper-generation",blocks:e})}`}function P6(e){return C6(e)}function A6(e){var s;if((s=e.sourceMarkdown)!=null&&s.trim())return e.sourceMarkdown.trim();if(!Array.isArray(e.tableRows)||e.tableRows.length===0)return"";const n=e.tableRows.map(a=>a.map(d=>String((d==null?void 0:d.text)||"").replace(/\n/g,"<br>").trim())),r=n[0]||Array.from({length:e.cols},()=>""),i=Array.from({length:r.length||e.cols||1},(a,d)=>{var f;const u=(f=e.columnAlignments)==null?void 0:f[d];return u==="center"?":---:":u==="right"?"---:":u==="left"?":---":"---"}),o=n.slice(1);return[`| ${r.join(" | ")} |`,`| ${i.join(" | ")} |`,...o.map(a=>`| ${a.join(" | ")} |`)].join(`
`)}function dm(e,n){const r=String(e||"").trim();return r?/^#{1,6}\s+/.test(r)?r:`## ${r}`:n}function fx(e){return e.map(n=>{if(n.type==="paragraph")return n.text;if(n.type==="heading")return`${"#".repeat(Math.max(1,Math.min(n.level||1,6)))} ${n.text}`;if(n.type==="image")return`![${n.alt||"image"}](${n.previewSrc||n.sourceId||""})`;if(n.type==="formula")return n.display==="inline"?`$${n.latex}$`:`$$
${n.latex}
$$`;if(n.type==="table")return A6(n);if(n.type==="caption")return n.text;if(n.type==="reference-list"){const r=n.items.map((i,o)=>j6(i,o));return[dm(n.heading,"## References"),...r].join(`

`)}if(n.type==="footnote-list"){const r=n.items.map((i,o)=>`[^${i.id||o+1}]: ${i.text}`);return[dm(n.heading,"## Footnotes"),...r].join(`
`)}return""}).filter(Boolean).join(`

`).trim()}function _6(e){return String(e||"").replace(/<\/p>/gi,`

`).replace(/<br\s*\/?>/gi,`
`).replace(/<\/h[1-6]>/gi,`

`).replace(/<\/div>/gi,`
`).replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\n{3,}/g,`

`).trim()}function mx(e){const n=e,r=typeof(n==null?void 0:n.html)=="string"?n.html.trim():"";return r?_6(r):typeof(n==null?void 0:n.plainText)=="string"?n.plainText.trim():""}function E6(e){const n=e;return typeof(n==null?void 0:n.html)=="string"?n.html.trim():""}function z3(e,n,r){const i=E6(r),o=mx(r),s=n&&n.length>0?fx(n):"",a=b6(String(e||"").trim()||s),d=ng();return d.id!=="embedded-office-engine"&&a?Ul(a):i&&!x6(o)?i:d.id==="embedded-office-engine"?P6(n&&n.length>0?n:T6(a)):Ul(a)}function Ws(e){return e?Array.isArray(e.structured_blocks)?e.structured_blocks:Array.isArray(e.structuredBlocks)?e.structuredBlocks:[]:[]}function At(e){return String(e||"").trim()||void 0}function ul(...e){const n=[];for(const r of e){if(Array.isArray(r)){for(const o of r){const s=At(o);s&&n.push(s)}continue}const i=At(r);i&&n.push(i)}return Array.from(new Set(n))}function z6(e){if(e)return{title:At(e.title),sections:Array.isArray(e.sections)?e.sections.map(n=>String(n||"").trim()).filter(Boolean):[]}}function D6(e){const n=String(e||"").split(/\r?\n/).map(i=>i.trim()).filter(Boolean),r=n.filter(i=>i.length>48?!1:!!(/^#{1,6}\s+/.test(i)||/^(第[一二三四五六七八九十百]+[章节部分]|[0-9]{1,2}(\.[0-9]{1,2})*|[一二三四五六七八九十]+[、.])/.test(i)||/^(摘要|引言|背景|概述|方法|研究方法|结果|讨论|结论|建议|附录|Abstract|Introduction|Background|Method|Methods|Results|Discussion|Conclusion|Recommendations|Appendix)$/i.test(i)));return r.length>=3?r.slice(0,10).map(i=>i.replace(/^#{1,6}\s+/,"").trim()):n.filter(i=>i.length>=4&&i.length<=28).slice(0,8)}function R6(e){const n=At(e);if(!n)return;const r=Math.max(n.lastIndexOf("/"),n.lastIndexOf("\\")),i=n.lastIndexOf(".");return i>r?`${n.slice(0,i)}.references.json`:`${n}.references.json`}function M6(e){return e.status||e.current_structured_blocks||e.current_ooxml_snapshot||e.current_content||e.result?"compat-task":"compat-result"}function F6(e,n){switch(e){case"select-topic":case"analyze-topic":return"analyze-topic";case"retrieve-references":return"retrieve-references";case"draft-outline":case"generate-outline":return"generate-outline";case"generate-sections":case"generate-section-draft":return"generate-section-draft";case"generate-body":return"generate-body";case"sync-citation-sidecar":return"sync-citation-sidecar";case"resume-task":return"resume-task";default:return n==="compat-task"?"resume-task":"generate-body"}}function B6(e,n,r){if(r)return z6(r);const i=Array.isArray(e.outline)?e.outline.map(a=>String(a||"").trim()).filter(Boolean):[],o=i.length>0?i.slice(0,10):D6(n),s=At(e.title)??At(e.paperTitle);if(!(!s&&o.length===0))return{title:s,sections:o}}function L6(e){const n=Us(e),r=Array.isArray(e.current_structured_blocks)?e.current_structured_blocks:Ws(e),i=e.current_ooxml_snapshot??e.currentOoxmlSnapshot??e.ooxml_snapshot??e.ooxmlSnapshot,o=Array.isArray(e.reference_list)?e.reference_list:Array.isArray(e.references)?e.references:[],s=Array.isArray(e.figures)?e.figures:Array.isArray(e.images)?e.images.map(a=>({url:a.path??a.url,image_url:a.path??a.url,path:a.path??a.url,caption:a.caption??a.section??"",markdown:a.markdown,filename:String(a.path||a.url||"").split(/[\\/]/).pop()})):[];return{title:At(e.title),markdown:At(n),paperMarkdown:At(e.paper_markdown)??At(n),structuredBlocks:r.length>0?r:void 0,ooxmlSnapshot:i&&typeof i=="object"?i:void 0,referenceList:o.length>0?o:void 0,figures:s.length>0?s:void 0}}function gx(e){if(!(!e||typeof e=="string"))return e}function hx(e,n={}){if(!e)return null;const r=M6(e),i=L6(e),o=At(n.taskId)??At(e.task_id)??At(e.taskId),s=At(n.topic)??At(e.topic),a=ul(n.referenceDocumentIds,e.referenceDocumentIds),d=At(n.citationSidecarPath)??R6(n.manuscriptPath),u=r6({topic:s,outline:B6(e,i.markdown||"",n.outline),referenceDocumentIds:a,taskId:o,citationSidecarPath:d,lastKnowledgeTaskId:At(n.lastKnowledgeTaskId)??At(e.lastKnowledgeTaskId)}),f=ul(n.sourceRefs,a),p=ul(n.exportRefs,At(n.manuscriptPath),d),m=e.documentSchema??e.document_schema,g=m||L0({id:`document:${At(n.artifactId)??o??"paper-compat"}`,profile:"paper",title:s||"论文",text:i.paperMarkdown||i.markdown||Us(e),sourceType:"compat"});return i6({artifactId:At(n.artifactId)??`paper:${o||"compat"}:${r}`,command:F6(typeof n.command=="string"?n.command:void 0,r),session:u,document:g,sourceRefs:f,patches:[],exportRefs:p.length>0?p:void 0,metadata:{manuscriptPath:At(n.manuscriptPath),artifactBoundary:r,resultFragments:i}})}function Us(e,n=""){if(!e)return String(n||"");const r=typeof e.paper_markdown=="string"&&e.paper_markdown.trim()?e.paper_markdown:typeof e.markdown=="string"&&e.markdown.trim()?e.markdown:"";if(r)return r;const i=Array.isArray(e.current_structured_blocks)?e.current_structured_blocks:Ws(e);if(i.length>0)return fx(i);const o=e.ooxml_snapshot??e.ooxmlSnapshot??e.current_ooxml_snapshot??e.currentOoxmlSnapshot,s=mx(o);return s||(typeof e.current_content=="string"&&e.current_content.trim()?e.current_content:typeof e.content=="string"&&e.content.trim()?e.content:"")||String(n||"")}function xx(e,n){if(!e)return e;const r=Ws(e),i=e.ooxml_snapshot??e.ooxmlSnapshot,o=Us({...e,ooxml_snapshot:i}),s={...e,markdown:o,paper_markdown:o,ooxml_snapshot:i,reference_list:e.reference_list??e.references??[],structured_blocks:r,structuredBlocks:r,figures:Array.isArray(e.figures)?e.figures:Array.isArray(e.images)?e.images.map(d=>({url:d.url||d.path,image_url:d.url||d.path,path:d.path,caption:d.caption||"",markdown:d.markdown||(d.url||d.path?`![${d.caption||"figure"}](${d.url||d.path})`:""),filename:String(d.path||"").split(/[\\/]/).pop()})):[]},a=hx(s,n);return a?{...s,documentArtifact:a}:s}function bx(e,n){if(!e)return e;const r=xx(e.result,n),i=e.current_ooxml_snapshot??e.currentOoxmlSnapshot??(r==null?void 0:r.ooxml_snapshot),o=Array.isArray(e.current_structured_blocks)?e.current_structured_blocks:Ws(r),s=Us({...e,current_ooxml_snapshot:i,current_structured_blocks:o}),a={...e,current_structured_blocks:o.length>0?o:void 0,current_ooxml_snapshot:i,paper_markdown:s||void 0,result:r},d=hx(a,n);return d?{...a,documentArtifact:d}:a}function D3(e,n){const r=String(e||"").toLowerCase(),i=["research","review","thesis_research"].includes(n)?n:"review";return/(实证研究论文|原创研究|研究论文|original\s+research|research\s+article|research\s+paper)/i.test(r)?"research":/(综述论文|文献综述|review\s+paper|literature\s+review|survey\s+paper)/i.test(r)?"review":/(开题报告|学位论文|毕业论文|thesis|dissertation)/i.test(r)?"thesis_research":i}async function yx(e){const n=await window.electronAPI.compatSubmitTask(e);if(n.status!=="success")throw new Error(n.error||"提交失败");return String(n.task_id)}async function vx(e,n){const r=gx(n),i=await window.electronAPI.compatGetTaskStatus(e);return i.status==="success"&&i.task?{...i,task:bx(i.task,{...r,taskId:e})}:i}async function wx(e,n){const r=gx(n),i=await window.electronAPI.compatGetTaskResult(e);return i.status==="success"&&i.result?{...i,result:xx(i.result,{...r,taskId:e})}:i}async function R3(){const e=await window.electronAPI.compatGetActiveTasks();return e.status==="success"?{...e,tasks:Array.isArray(e.tasks)?e.tasks.map(n=>bx(n)):[]}:e}async function Yc(e){return window.electronAPI.compatStopTask(e)}function Hs(e,n){return String((e==null?void 0:e.scope)||"").trim()===n}function Sx(e,n,r){return window.electronAPI.onAiEvent(i=>{const o=i;o.scope===e&&String(o.taskId||"").trim()===String(n||"").trim()&&r(o)})}async function M3(e){return yx({...e,scope:"daily-report",paperType:"review",citationMode:"deferred"})}async function F3(e,n){const r=await vx(e,n);return(r==null?void 0:r.status)==="success"&&!Hs(r==null?void 0:r.task,"daily-report")?{status:"failed",error:"任务类型不匹配"}:r}async function B3(e,n){const r=await wx(e,n);return(r==null?void 0:r.status)==="success"&&!Hs(r==null?void 0:r.result,"daily-report")?{status:"failed",error:"任务类型不匹配"}:r}function L3(e,n){return Sx("daily-report",e,n)}function N3(e){return Yc(e)}async function O3(e){return yx({...e,scope:"essay-writing",citationMode:"deferred"})}async function W3(e,n){const r=await vx(e,n);return(r==null?void 0:r.status)==="success"&&!Hs(r==null?void 0:r.task,"essay-writing")?{status:"failed",error:"任务类型不匹配"}:r}async function U3(e,n){const r=await wx(e,n);return(r==null?void 0:r.status)==="success"&&!Hs(r==null?void 0:r.result,"essay-writing")?{status:"failed",error:"任务类型不匹配"}:r}function H3(e,n){return Sx("essay-writing",e,n)}function K3(e){return Yc(e)}async function G3(e){return window.electronAPI.compatPauseTask(e)}async function q3(e){return window.electronAPI.compatResumeTask(e)}const N6=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #f4f7fb;
`,O6=l.div`
  display: flex;
  align-items: stretch;
  border-bottom: 2px solid #e0e8f2;
  background: #ffffff;
  flex-shrink: 0;
  padding: 0 24px;
`,um=l.button`
  padding: 13px 22px;
  border: none;
  border-bottom: ${e=>e.$active?"3px solid #1a5fb4":"3px solid transparent"};
  margin-bottom: -2px;
  background: transparent;
  color: ${e=>e.$active?"#1a5fb4":"#627385"};
  font-size: 14px;
  font-weight: ${e=>e.$active?"700":"500"};
  cursor: pointer;
  transition: color 0.13s;
  white-space: nowrap;
  &:hover { color: #1a5fb4; }
  &:disabled { color: #aab4c0; cursor: not-allowed; }
`,W6=l.span`
  align-self: center;
  margin-left: 12px;
  font-size: var(--font-size-xs);
  color: #8a9ab0;
`,U6=l.span`
  align-self: center;
  margin-left: 12px;
  font-size: var(--font-size-xs);
  color: #c0392b;
  max-width: 380px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,H6=l.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,pm=l.div`
  display: ${e=>e.$active?"flex":"none"};
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`,K6=l.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 40px;
`,G6=l.iframe`
  flex: 1;
  width: 100%;
  min-height: 0;
  border: none;
  display: block;
  background: #fff;
`,pl=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #627385;
  font-size: 14px;
  padding: 40px;
`,q6=l.button`
  padding: 7px 22px;
  background: #1a5fb4;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #154e9c; }
`,V6=l.div`
  display: grid;
  gap: 10px;
`,Y6=l.div`
  border: 1px solid #dde3ec;
  border-radius: 8px;
  padding: 12px 14px;
  background: #ffffff;
`,J6=l.div`
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #1f3142;
`,fl=l.div`
  font-size: var(--font-size-xs);
  color: #627385;
  margin-top: 4px;
`,xi=l.code`
  font-size: var(--font-size-xs);
  background: #f0f4fa;
  border-radius: 4px;
  padding: 1px 6px;
  color: #3563a0;
`;function X6(e,n){const r=new Map,i=new Map;for(const a of n??[]){const d=String(a.skill_id??"");d&&(r.set(d,String(a.name??d)),i.set(d,String(a.description??"")))}const o=[],s=new Set;for(const a of(e==null?void 0:e.to_install)??[]){const d=String(a.skill_id??"");!d||s.has(d)||(s.add(d),o.push({skill_id:d,package_id:String(a.package_id??""),target_version:String(a.version??""),status:"to_install",display_name:r.get(d),description:i.get(d)}))}for(const a of(e==null?void 0:e.to_update)??[]){const d=String(a.skill_id??"");!d||s.has(d)||(s.add(d),o.push({skill_id:d,package_id:String(a.package_id??""),current_version:String(a.from_version??""),target_version:String(a.to_version??""),status:"to_update",display_name:r.get(d),description:i.get(d)}))}for(const a of(e==null?void 0:e.already_latest)??[]){const d=String(a.skill_id??"");!d||s.has(d)||(s.add(d),o.push({skill_id:d,target_version:String(a.version??""),current_version:String(a.version??""),status:"already_latest",display_name:r.get(d),description:i.get(d)}))}for(const a of(e==null?void 0:e.to_disable)??[]){const d=String(a.skill_id??"");!d||s.has(d)||(s.add(d),o.push({skill_id:d,package_id:String(a.package_id??""),current_version:String(a.version??""),target_version:String(a.version??""),status:"to_disable",display_name:r.get(d),description:i.get(d)}))}return o}function Z6(e){return e==="to_install"?"已购待安装":e==="to_update"?"待更新":e==="already_latest"?"已是最新":"已禁用"}function Q6(e){return e==="to_install"?"安装":e==="to_update"?"更新":e==="to_disable"?"启用":"管理"}function eD(e){return e<=0?"":e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/1024/1024).toFixed(2)} MB`}const fm=l.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
`,tD=l.button`
  padding: 8px 20px;
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #256427; }
  &:disabled { background: #8fb890; cursor: not-allowed; }
`,ii=l.span`
  padding: 3px 10px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: ${e=>e.$color};
  color: #fff;
`,nD=l.span`
  display: inline-block;
  padding: 2px 9px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  background: ${e=>e.$status==="to_install"?"#e67700":e.$status==="to_update"?"#0066cc":e.$status==="already_latest"?"#2e7d32":"#888"};
  color: #fff;
`,rD=l.div`display: grid; gap: 8px;`,iD=l.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 10px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #dde3ec;
  border-radius: 8px;
`,oD=l.div`min-width: 0;`,sD=l.div`font-size: var(--font-size-sm); font-weight: 600; color: #1f3142; margin-bottom: 3px;`,ml=l.div`font-size: var(--font-size-xs); color: #627385; line-height: 1.6;`,aD=l.div`display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;`,ac=l.button`
  padding: 5px 12px;
  font-size: var(--font-size-xs);
  border: 1px solid #dde3ec;
  border-radius: 6px;
  background: #f5f7fa;
  color: #aab4c0;
  cursor: not-allowed;
  white-space: nowrap;
`,mm=l.div`
  padding: 28px 0;
  text-align: center;
  font-size: var(--font-size-sm);
  color: #8a9ab0;
`,gm=l.div`
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #f0c040;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  color: #7a5500;
  white-space: pre-wrap;
`,lD=l.button`
  padding: 8px 20px;
  background: #1a5fb4;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #154e9c; }
  &:disabled { background: #7fa8d8; cursor: not-allowed; }
`,cD=l.div`display: grid; gap: 8px; margin-top: 12px;`,dD=l.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafe;
  border: 1px solid #d0ddf0;
  border-radius: 8px;
`,uD=l.div`min-width: 0;`,pD=l.div`font-size: var(--font-size-sm); font-weight: 700; color: #1a2e45; margin-bottom: 3px;`,Gi=l.div`font-size: var(--font-size-xs); color: #5a6e85; line-height: 1.7;`,fD=l.div`display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;`,mD=l.span`
  padding: 2px 9px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: ${e=>e.$available?"#d4edda":"#f8d7da"};
  color: ${e=>e.$available?"#1a6632":"#842029"};
`,kx=l.div`
  margin: 20px 0 16px;
  border-top: 1px solid #e4e9f0;
  padding-top: 14px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #8a9ab0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`,hm=l.button`
  padding: 5px 12px;
  font-size: var(--font-size-xs);
  border: 1px solid ${e=>e.$available?"#1a5fb4":"#dde3ec"};
  border-radius: 6px;
  background: ${e=>e.$available?"#eef4ff":"#f5f7fa"};
  color: ${e=>e.$available?"#1a5fb4":"#aab4c0"};
  cursor: ${e=>e.$available?"pointer":"not-allowed"};
  font-weight: ${e=>e.$available?"600":"400"};
  white-space: nowrap;
  transition: background 0.12s;
  &:hover:not(:disabled) { background: #d8e8ff; }
  &:disabled { cursor: not-allowed; }
`,xm=l.div`
  font-size: var(--font-size-xs);
  color: #1a6632;
  background: #d4edda;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,bm=l.div`
  font-size: var(--font-size-xs);
  color: #842029;
  background: #f8d7da;
  padding: 2px 8px;
  border-radius: 6px;
  max-width: 200px;
  word-break: break-all;
`,ym=l.div`
  flex-shrink: 0;
  width: 88px;
  height: 58px;
  border-radius: 5px;
  overflow: hidden;
  border: 1.5px solid #c8d4e8;
  background: #fff;
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
`,vm=l.div`
  flex-shrink: 0;
  height: 18px;
  background: ${e=>e.$bg};
  display: flex;
  align-items: center;
  padding: 0 6px;
  gap: 3px;
`,wm=l.div`
  width: 3px;
  height: 10px;
  border-radius: 1px;
  background: ${e=>e.$bg};
`,Sm=l.div`
  flex: 1;
  height: 5px;
  border-radius: 2px;
  background: rgba(255,255,255,0.65);
`,km=l.div`
  flex: 1;
  padding: 5px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`,cr=l.div`
  height: 4px;
  width: ${e=>e.$w};
  border-radius: 2px;
  background: ${e=>e.$bg??"#d0d8e6"};
`;function gD({skillId:e}){return e==="ppt_template_cuhk_business"?t.jsxs(ym,{title:"港中大商务汇报模板 – 绿色商务风",children:[t.jsxs(vm,{$bg:"#276221",children:[t.jsx(wm,{$bg:"#d4a017"}),t.jsx(Sm,{})]}),t.jsxs(km,{children:[t.jsx(cr,{$w:"70%",$bg:"#276221"}),t.jsx(cr,{$w:"90%"}),t.jsx(cr,{$w:"80%"}),t.jsx(cr,{$w:"55%",$bg:"#d4a017"})]})]}):e==="ppt_template_academic_defense"?t.jsxs(ym,{title:"学术答辩模板 – 深蓝学术风",children:[t.jsxs(vm,{$bg:"#1a237e",children:[t.jsx(wm,{$bg:"#FFC107"}),t.jsx(Sm,{})]}),t.jsxs(km,{children:[t.jsx(cr,{$w:"65%",$bg:"#1a237e"}),t.jsx(cr,{$w:"88%"}),t.jsx(cr,{$w:"75%"}),t.jsx(cr,{$w:"45%",$bg:"#FFC107"})]})]}):null}function hD({skin:e}){const[n,r]=Ct.useState({status:"idle"}),[i,o]=Ct.useState({status:"idle"});async function s(){var f,p;r({status:"downloading"});try{const m=await((p=(f=window.electronAPI).downloadSkillPackage)==null?void 0:p.call(f,{skillId:e.skill_id,packageHash:e.package_hash??void 0}));if(!m){r({status:"error",error:"downloadSkillPackage 接口未暴露，请检查 preload 配置。"});return}m.ok?r({status:"done",path:m.path,filename:m.filename}):r({status:"error",error:m.error})}catch(m){r({status:"error",error:m instanceof Error?m.message:"下载失败"})}}async function a(){var f,p;if(n.path){o({status:"loading"});try{const m=await((p=(f=window.electronAPI).recognizeSkillPackage)==null?void 0:p.call(f,{skillId:e.skill_id,localPath:n.path}));if(!m){o({status:"error",error:"识别接口未暴露，请检查 preload 配置。"});return}m.ok?o({status:"done",skill_type:m.skill_type,name:m.name}):o({status:"error",error:m.error})}catch(m){o({status:"error",error:m instanceof Error?m.message:"识别失败"})}}}const d=n.status==="downloading",u=n.status==="done";return t.jsxs(dD,{children:[t.jsxs(uD,{children:[e.skill_id.startsWith("ppt_template")&&t.jsx(gD,{skillId:e.skill_id}),t.jsx(pD,{children:e.name}),t.jsxs(Gi,{children:["ID：",t.jsx(xi,{children:e.skill_id}),"  版本：",e.version]}),e.package_id&&t.jsxs(Gi,{children:["包 ID：",t.jsx(xi,{children:e.package_id})]}),e.package_hash&&t.jsxs(Gi,{children:["Hash：",t.jsxs(xi,{children:[e.package_hash.slice(0,16),"…"]})]}),e.package_file&&t.jsxs(Gi,{children:["文件：",e.package_file,e.size>0&&` (${eD(e.size)})`]}),e.description&&t.jsx(Gi,{children:e.description}),u&&n.filename&&t.jsxs(xm,{title:n.path,children:["✓ 已下载：",n.filename]}),n.status==="error"&&t.jsx(bm,{children:n.error}),i.status==="done"&&t.jsx(xm,{children:i.skill_type==="ppt_template"?"🧩 PPT 模板 ✓":`✓ 已识别：${i.skill_type??"unknown"}`}),i.status==="error"&&t.jsx(bm,{children:i.error})]}),t.jsxs(fD,{children:[t.jsx(mD,{$available:e.download_available,children:u?"已下载":e.download_available?"可下载":"暂不可下载"}),t.jsx(hm,{$available:e.download_available&&!d&&!u,disabled:!e.download_available||d||u,onClick:s,title:u?`已保存至：${n.path}`:void 0,children:d?"下载中...":u?"已下载 ✓":"下载 Skill 包"}),u&&i.status!=="done"&&t.jsx(hm,{$available:i.status!=="loading",disabled:i.status==="loading",onClick:()=>{a()},children:i.status==="loading"?"识别中...":"识别并启用"}),t.jsx(ac,{disabled:!0,title:"下一阶段支持",children:"安装"}),t.jsx(ac,{disabled:!0,title:"下一阶段支持",children:"启用/禁用"})]})]})}function xD(){const[e,n]=Ct.useState(!1),[r,i]=Ct.useState(null),[o,s]=Ct.useState(null),[a,d]=Ct.useState(0),[u,f]=Ct.useState(!1),[p,m]=Ct.useState(null),[g,h]=Ct.useState(null);async function x(){var y,j;i(null),s(null),n(!0);try{const S=await((j=(y=window.electronAPI).getSkillSyncPlan)==null?void 0:j.call(y));if(!S){i("getSkillSyncPlan 接口未暴露，请检查 preload 配置。");return}if(!S.ok){i(S.error??"检查失败，请确认 skill_platform_next 目录存在且依赖已安装。");return}s(X6(S.plan,S.entitlements??null)),d((S.entitlements??[]).length)}catch{i("检查已购 Skill 失败，请检查 skill_platform_next 目录是否存在且依赖已安装。")}finally{n(!1)}}async function k(){var y,j;m(null),h(null),f(!0);try{const S=await((j=(y=window.electronAPI).listMySkins)==null?void 0:j.call(y));if(!S){m("listMySkins 接口未暴露，请检查 preload 配置。");return}if(!S.ok){m(S.error??"获取已购 Skill 失败，请确认 skill_platform_next 目录存在且依赖已安装。");return}h(S.skins??[])}catch{m("刷新已购 Skill 包失败，请检查 skill_platform_next 目录是否存在且依赖已安装。")}finally{f(!1)}}const v={to_install:(o==null?void 0:o.filter(y=>y.status==="to_install").length)??0,to_update:(o==null?void 0:o.filter(y=>y.status==="to_update").length)??0,already_latest:(o==null?void 0:o.filter(y=>y.status==="already_latest").length)??0,to_disable:(o==null?void 0:o.filter(y=>y.status==="to_disable").length)??0};return t.jsxs("div",{style:{marginBottom:24},children:[t.jsxs(fm,{children:[t.jsx(lD,{onClick:k,disabled:u,children:u?"正在加载...":"刷新已购 Skill 包"}),g!==null&&t.jsxs(ii,{$color:"#1a5fb4",children:["已购 ",g.length," 个"]})]}),p&&t.jsx(gm,{children:p}),g!==null&&t.jsxs(cD,{children:[g.length===0&&t.jsx(mm,{children:"暂无已购 Skill 包。"}),g.map(y=>t.jsx(hD,{skin:y},y.skill_id))]}),t.jsx(kx,{children:"同步计划诊断"}),t.jsx("div",{style:{fontSize:14,color:"#8a9ab0",marginBottom:10,lineHeight:1.6},children:"仅用于开发调试，显示平台包与本地安装状态差异，不代表已购买列表。"}),t.jsxs(fm,{children:[t.jsx(tD,{onClick:x,disabled:e,children:e?"正在检查...":"同步计划诊断"}),o!==null&&a>0&&t.jsxs(ii,{$color:"#1a5fb4",children:["授权 ",a]}),o!==null&&v.to_install>0&&t.jsxs(ii,{$color:"#e67700",children:["待安装 ",v.to_install]}),o!==null&&v.to_update>0&&t.jsxs(ii,{$color:"#0066cc",children:["待更新 ",v.to_update]}),o!==null&&v.already_latest>0&&t.jsxs(ii,{$color:"#2e7d32",children:["已最新 ",v.already_latest]}),o!==null&&v.to_disable>0&&t.jsxs(ii,{$color:"#888",children:["已禁用 ",v.to_disable]})]}),r&&t.jsx(gm,{children:r}),o!==null&&t.jsxs(rD,{children:[o.length===0&&t.jsx(mm,{children:"暂无已购 Skill 记录。"}),o.map(y=>t.jsxs(iD,{children:[t.jsxs(oD,{children:[t.jsx(sD,{children:y.display_name??y.skill_id}),t.jsxs(ml,{children:[t.jsx(xi,{children:y.skill_id}),y.package_id&&t.jsxs(t.Fragment,{children:["  包：",t.jsx(xi,{children:y.package_id})]})]}),t.jsx(ml,{children:y.current_version&&y.current_version!==y.target_version?t.jsxs(t.Fragment,{children:["版本：",y.current_version," → ",y.target_version]}):t.jsxs(t.Fragment,{children:["版本：",y.target_version]})}),y.description&&t.jsx(ml,{children:y.description})]}),t.jsxs(aD,{children:[t.jsx(nD,{$status:y.status,children:Z6(y.status)}),t.jsx(ac,{disabled:!0,title:"下一阶段支持",children:Q6(y.status)})]})]},y.skill_id))]})]})}function bD(){const e=n6(),[n,r]=Ct.useState("manage"),[i,o]=Ct.useState("idle"),[s,a]=Ct.useState(null),[d,u]=Ct.useState(null);async function f(){var p,m;if(r("store"),!(i==="ready"&&d)){o("loading"),a(null);try{const g=await((m=(p=window.electronAPI).getSkillStoreEmbedUrl)==null?void 0:m.call(p));if(!g||!g.ok){o("error"),a((g==null?void 0:g.error)??"Skill Store 连接失败，请检查网络或服务器是否在线。");return}u(g.url),o("ready")}catch(g){o("error"),a(g instanceof Error?g.message:"启动失败")}}}return t.jsxs(N6,{children:[t.jsxs(O6,{children:[t.jsx(um,{$active:n==="manage",onClick:()=>r("manage"),children:"🧩 我的 Skill 包"}),t.jsx(um,{$active:n==="store",onClick:f,disabled:i==="loading",children:"🛒 Skill 商店"}),i==="loading"&&t.jsx(W6,{children:"正在启动 Skill Store 服务，请稍候..."}),i==="error"&&s&&t.jsxs(U6,{title:s,children:["⚠ ",s]})]}),t.jsxs(H6,{children:[t.jsx(pm,{$active:n==="manage",children:t.jsxs(K6,{children:[t.jsxs("div",{style:{marginBottom:20},children:[t.jsx("h1",{style:{fontSize:22,fontWeight:700,color:"#1f3142",margin:"0 0 4px"},children:"Skill 中心"}),t.jsx("p",{style:{fontSize:14,color:"#627385",margin:"0 0 0"},children:'管理已购买和授权的 AI Skill 包，或切换到"Skill 商店"标签浏览购买。'})]}),t.jsx(xD,{}),e.length>0&&t.jsxs(t.Fragment,{children:[t.jsx(kx,{children:"本地已注册 Skill"}),t.jsx(V6,{children:e.map(p=>t.jsxs(Y6,{children:[t.jsx(J6,{children:p.manifest.name}),t.jsxs(fl,{children:["类别：",p.manifest.category,"　版本：",p.manifest.version]}),t.jsx(fl,{children:t.jsx(xi,{children:p.manifest.id})}),p.manifest.description&&t.jsx(fl,{children:p.manifest.description})]},p.manifest.id))})]})]})}),t.jsxs(pm,{$active:n==="store",children:[i==="loading"&&t.jsx(pl,{children:t.jsx("div",{children:"正在连接 Skill Store..."})}),i==="error"&&t.jsxs(pl,{children:[t.jsxs("div",{style:{color:"#c0392b",textAlign:"center",maxWidth:480},children:["⚠ ",s]}),t.jsx(q6,{onClick:f,children:"重试"})]}),i==="idle"&&t.jsx(pl,{children:t.jsx("div",{style:{color:"#8a9ab0"},children:'点击"Skill 商店"标签载入商店'})}),d&&t.jsx(G6,{src:d,title:"Skill 商店",style:{display:i==="ready"?"block":"none"}})]})]})]})}const yD=[{key:"today",label:"今天"},{key:"week",label:"本周"},{key:"pending",label:"待确认日程"},{key:"from-email",label:"来自邮件"},{key:"conflict",label:"有冲突"},{key:"deadline",label:"截止事项"}],rs={tentative:"待确认",confirmed:"已确认",declined:"已拒绝",cancelled:"已取消",ignored:"已忽略"},qi={meeting:"会议",interview:"面试",deadline:"截止事项",reminder:"提醒",focus:"专注",task:"任务"},$e={pageBg:"#F7F8FA",panelBg:"#FFFFFF",border:"#E5E7EB",borderStrong:"#D1D5DB",textPrimary:"#111827",textSecondary:"#4B5563",textTertiary:"#9CA3AF",primary:"#2563EB",primaryHover:"#1D4ED8",primarySoft:"#EFF6FF",successSoft:"#DCFCE7",warningSoft:"#FEF3C7",danger:"#DC2626",dangerSoft:"#FEE2E2",info:"#2563EB",infoSoft:"#DBEAFE",neutralSoft:"#F9FAFB"};function gl(e){return e==="manual"?"手动创建":e==="email_ai"?"邮件识别":e==="email_user_confirmed"?"邮件确认":"导入"}function jm(e){return e==="confirmed"?"success":e==="tentative"?"warning":e==="ignored"?"muted":e==="declined"||e==="cancelled"?"danger":"muted"}function Im(e){return e==="deadline"?"warning":e==="reminder"?"info":e==="meeting"||e==="interview"?"indigo":"muted"}function $m(e){return e==="email_ai"||e==="email_user_confirmed"?"info":"muted"}function _s(e,n){return e.getFullYear()===n.getFullYear()&&e.getMonth()===n.getMonth()&&e.getDate()===n.getDate()}function Yn(e){if(!e)return null;const n=new Date(e);return Number.isFinite(n.getTime())?n:null}function Zi(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function Jc(e){const n=new Date(e),r=n.getDay()||7;n.setHours(0,0,0,0),n.setDate(n.getDate()-r+1);const i=new Date(n);return i.setDate(n.getDate()+7),{start:n,end:i}}function lc(e,n){const r=new Date(e);return r.setDate(r.getDate()+n),r}function vD(e){const{start:n}=Jc(e);return Array.from({length:7},(r,i)=>lc(n,i))}function wD(e){const{start:n}=Jc(e),r=Math.floor((n.getDate()-1)/7)+1;return`${n.getFullYear()}年${n.getMonth()+1}月第${r}周`}function SD(e){const n=Yn(e);return n?n.toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"long"}):"未设置日期"}function Tm(e){const n=Yn(e.startTime);if(!n)return"时间待确认";if(e.allDay)return`${n.toLocaleDateString("zh-CN")} 全天`;const r=n.toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});if(!e.endTime)return r;const i=Yn(e.endTime);if(!i)return r;const o=_s(n,i)?i.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"}):i.toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});return`${r} - ${o}`}function kD(e){const n=Yn(e.startTime);if(!n)return"时间待确认";if(e.allDay)return"全天";const r=n.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});if(!e.endTime)return r;const i=Yn(e.endTime);return i?`${r} - ${i.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}`:r}function jD(e){const n=Yn(e.startTime);return n?n.getHours()<12?"morning":"afternoon":null}function Cm(e){const n=new Date(e);if(!Number.isFinite(n.getTime()))return"";const r=n.getTimezoneOffset()*6e4;return new Date(n.getTime()-r).toISOString().slice(0,16)}function is(e){return new Date(e).toISOString()}function Pm(e,n,r=new Date){const i=new Date,{start:o,end:s}=Jc(r);return e.filter(a=>{var u;const d=Yn(a.startTime);return n==="today"?!!d&&_s(d,i):n==="week"?!!d&&d>=o&&d<s:n==="pending"?a.status==="tentative"||a.needsUserConfirmation===!0:n==="from-email"?a.source==="email_ai"||a.source==="email_user_confirmed":n==="conflict"?!!((u=a.conflictEventIds)!=null&&u.length):n==="deadline"?a.eventType==="deadline":!0})}function ID(e){const n=new Map;for(const r of e){const i=Yn(r.startTime),o=i?Zi(i):(r.startTime||"unknown-date").slice(0,10);n.set(o,[...n.get(o)??[],r])}return[...n.entries()].sort(([r],[i])=>r.localeCompare(i)).map(([r,i])=>{var o;return{dateKey:r,label:SD(((o=i[0])==null?void 0:o.startTime)??r),events:i}})}const $D=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: ${$e.pageBg};
`,TD=l.div`
  padding: 26px 24px 18px;
  flex-shrink: 0;
  background: ${$e.pageBg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`,CD=l.h1`
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 800;
  color: ${$e.textPrimary};
`,PD=l.p`
  margin: 0;
  font-size: 14px;
  color: ${$e.textSecondary};
`,AD=l.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid ${$e.primary};
  border-radius: 10px;
  background: ${$e.primary};
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.08);
  &:hover { background: ${$e.primaryHover}; }
`,_D=l.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
  gap: 16px;
  padding: 0 24px 24px;
`,ED=l.aside`
  width: 192px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 10px;
  gap: 4px;
  border: 1px solid ${$e.border};
  border-radius: 16px;
  background: ${$e.panelBg};
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
  overflow-y: auto;
`,zD=l.span`
  font-size: 11px;
  font-weight: 700;
  color: ${$e.textTertiary};
  letter-spacing: 0.04em;
  padding: 0 10px 8px;
`,DD=l.button`
  position: relative;
  width: 100%;
  padding: 10px 12px 10px 16px;
  border: none;
  border-radius: 10px;
  background: ${e=>e.$active?$e.primarySoft:"transparent"};
  color: ${e=>e.$active?$e.primaryHover:"#374151"};
  font-size: 14px;
  font-weight: ${e=>e.$active?700:500};
  text-align: left;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 999px;
    background: ${e=>e.$active?$e.primary:"transparent"};
  }

  &:hover {
    background: ${e=>e.$active?$e.primarySoft:"#F3F4F6"};
  }
`,RD=l.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 18px 20px 20px;
  border: 1px solid ${$e.border};
  border-radius: 16px;
  background: ${$e.panelBg};
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
  gap: 16px;
`,MD=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border: 1px solid ${$e.border};
  border-radius: 12px;
  background: ${$e.neutralSoft};
`,Am=l.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`,FD=l.span`
  font-size: 13px;
  font-weight: 700;
  color: ${$e.textSecondary};
`,Vi=l.button`
  height: 32px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid ${e=>e.$active?$e.primary:$e.borderStrong};
  background: ${e=>e.$active?$e.primary:$e.panelBg};
  color: ${e=>e.$active?"#ffffff":"#334155"};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 1px rgba(17, 24, 39, 0.03);
  &:hover {
    border-color: ${e=>e.$active?$e.primaryHover:$e.borderStrong};
    background: ${e=>e.$active?$e.primaryHover:$e.neutralSoft};
  }
`,BD=l.div`
  min-width: 160px;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: ${$e.textPrimary};
`,LD=l.div`
  display: grid;
  grid-template-columns: 86px repeat(7, minmax(120px, 1fr));
  grid-template-rows: auto repeat(2, minmax(220px, auto));
  border: 1px solid ${$e.border};
  border-radius: 14px;
  overflow: hidden;
  background: ${$e.panelBg};
`,ND=l.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-right: 1px solid ${$e.border};
  border-bottom: 1px solid ${$e.border};
  background: ${$e.neutralSoft};
  font-size: 12px;
  font-weight: 800;
  color: ${$e.textSecondary};
`,OD=l.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 10px;
  border-right: 1px solid ${$e.border};
  border-bottom: 1px solid ${$e.border};
  background: ${e=>e.$today?"#F8FBFF":$e.panelBg};
  &:last-child { border-right: none; }
`,WD=l.div`
  font-size: 13px;
  font-weight: 800;
  color: #374151;
`,UD=l.div`
  font-size: 12px;
  color: ${$e.textTertiary};
`,HD=l.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-right: 1px solid ${$e.border};
  border-bottom: 1px solid ${$e.border};
  background: ${$e.neutralSoft};
  font-size: 13px;
  font-weight: 800;
  color: #374151;
`,KD=l.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: ${e=>e.$today?"#FBFDFF":$e.panelBg};
  border-right: ${e=>e.$lastColumn?"none":`1px solid ${$e.border}`};
  border-bottom: ${e=>e.$lastRow?"none":`1px solid ${$e.border}`};
  min-height: 220px;
  transition: background 0.12s ease;

  &:hover {
    background: #FAFCFF;
  }
`,GD=l.div`
  margin-top: -4px;
  align-self: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: ${$e.neutralSoft};
  border: 1px solid ${$e.border};
  font-size: 13px;
  color: ${$e.textSecondary};
`,qD=l.div`
  font-size: 12px;
  font-weight: 800;
  color: ${$e.primaryHover};
  margin-bottom: 5px;
`,VD=l.div`
  font-size: 13px;
  line-height: 1.35;
  font-weight: 800;
  color: #1E293B;
  margin-bottom: 6px;
`,YD=l.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`,JD=l.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #334155;
`,jx=l.button`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${e=>e.$active?$e.primary:e.$conflict?"#FCA5A5":e.$fromEmail?"#BFDBFE":$e.border};
  border-radius: 12px;
  background: ${e=>e.$active?$e.primarySoft:e.$fromEmail?"#F8FBFF":$e.panelBg};
  text-align: left;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
  &:hover {
    border-color: ${e=>e.$conflict?$e.danger:$e.info};
    background: ${e=>e.$fromEmail?"#F4F9FF":"#FAFCFF"};
    box-shadow: 0 2px 6px rgba(17, 24, 39, 0.06);
  }
`,XD=l(jx)`
  padding: 10px 11px;
  border-radius: 10px;
`,ZD=l.div`
  font-size: 14px;
  font-weight: 700;
  color: ${$e.textPrimary};
  margin-bottom: 6px;
`,QD=l.div`
  font-size: 12px;
  font-weight: 700;
  color: ${$e.textSecondary};
  margin-bottom: 8px;
`,_m=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`,dr=l.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 700;
  background: ${e=>e.$tone==="warning"?$e.warningSoft:e.$tone==="success"?$e.successSoft:e.$tone==="info"?$e.infoSoft:e.$tone==="danger"?$e.dangerSoft:e.$tone==="indigo"?"#E0E7FF":$e.neutralSoft};
  color: ${e=>e.$tone==="warning"?"#92400E":e.$tone==="success"?"#166534":e.$tone==="info"?"#1D4ED8":e.$tone==="danger"?"#B91C1C":e.$tone==="indigo"?"#3730A3":"#6B7280"};
  border: 1px solid ${e=>e.$tone==="warning"?"#FCD34D":e.$tone==="success"?"#BBF7D0":e.$tone==="info"?"#BFDBFE":e.$tone==="danger"?"#FECACA":e.$tone==="indigo"?"#C7D2FE":$e.border};
`,eR=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 24px;
  text-align: center;
`,tR=l.div`
  width: 80px;
  height: 80px;
  border-radius: 18px;
  background: ${$e.neutralSoft};
  color: ${$e.borderStrong};
  border: 1px solid ${$e.border};
  display: flex;
  align-items: center;
  justify-content: center;
`,nR=l.h3`
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: ${$e.textSecondary};
`,rR=l.p`
  margin: 0;
  font-size: 14px;
  color: ${$e.textTertiary};
  line-height: 1.7;
  max-width: 380px;
`,iR=l.aside`
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: ${$e.panelBg};
  border: 1px solid ${$e.border};
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
`,oR=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  color: ${$e.borderStrong};
`,sR=l.span`
  font-size: 15px;
  font-weight: 700;
  color: ${$e.textSecondary};
  text-align: center;
`,aR=l.span`
  font-size: 13px;
  color: ${$e.textTertiary};
  text-align: center;
`,lR=l.div`
  padding: 22px;
`,cR=l.h2`
  margin: 0 0 14px;
  font-size: 22px;
  font-weight: 800;
  color: ${$e.textPrimary};
`,yn=l.div`
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid ${$e.border};
  font-size: 13px;
`,vn=l.span`
  color: #6B7280;
  font-weight: 700;
`,wn=l.span`
  color: ${$e.textPrimary};
  word-break: break-word;
`,hl=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
`,Wn=l.button`
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid ${e=>e.$variant==="danger"?"#FECACA":e.$variant==="primary"?$e.primary:$e.borderStrong};
  background: ${e=>e.$variant==="danger"?$e.dangerSoft:e.$variant==="primary"?$e.primary:$e.panelBg};
  color: ${e=>e.$variant==="danger"?$e.danger:e.$variant==="primary"?"#FFFFFF":"#334155"};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: ${e=>e.$variant==="primary"?"0 1px 2px rgba(17, 24, 39, 0.08)":"none"};
  &:hover {
    background: ${e=>e.$variant==="danger"?"#FECACA":e.$variant==="primary"?$e.primaryHover:$e.neutralSoft};
  }
`,Ix=l.form`
  margin: 0 0 18px;
  padding: 16px;
  border: 1px solid ${$e.border};
  border-radius: 14px;
  background: ${$e.panelBg};
  display: grid;
  gap: 12px;
`,Em=l.div`
  font-size: 15px;
  font-weight: 800;
  color: ${$e.textPrimary};
`,zm=l.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`,an=l.label`
  display: grid;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: #64748B;
`,ur=l.input`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${$e.borderStrong};
  border-radius: 9px;
  padding: 9px 10px;
  font-size: 13px;
  color: ${$e.textPrimary};
  background: ${$e.panelBg};
  outline: none;

  &:focus {
    border-color: ${$e.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`,os=l.select`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${$e.borderStrong};
  border-radius: 9px;
  padding: 9px 10px;
  font-size: 13px;
  color: ${$e.textPrimary};
  background: ${$e.panelBg};
  outline: none;

  &:focus {
    border-color: ${$e.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`,Dm=l.textarea`
  width: 100%;
  min-height: 70px;
  box-sizing: border-box;
  border: 1px solid ${$e.borderStrong};
  border-radius: 9px;
  padding: 9px 10px;
  font-size: 13px;
  color: ${$e.textPrimary};
  background: ${$e.panelBg};
  resize: vertical;
  outline: none;

  &:focus {
    border-color: ${$e.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`,xl=l.div`
  padding: 10px 12px;
  border-radius: 10px;
  background: ${$e.warningSoft};
  border: 1px solid #FCD34D;
  color: #92400E;
  font-size: 13px;
  line-height: 1.5;
`,dR=l.div`
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.36);
`,uR=l.div`
  width: min(640px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  border-radius: 18px;
  background: ${$e.panelBg};
  border: 1px solid ${$e.border};
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.24);
`,pR=l(Ix)`
  margin: 0;
  border: none;
  border-radius: 18px;
`,bl={title:"",startTime:"",endTime:"",location:"",description:"",eventType:"meeting",status:"confirmed"};function fR(){var J,H;const[e,n]=c.useState("week"),[r,i]=c.useState("week"),[o,s]=c.useState(()=>new Date),[a,d]=c.useState([]),[u,f]=c.useState(null),[p,m]=c.useState(!1),[g,h]=c.useState(bl),[x,k]=c.useState(null),[v,y]=c.useState(bl),[j,S]=c.useState(null),[z,P]=c.useState(null),I=c.useCallback(async()=>{const T=await ji();d(T),f(w=>w&&T.some(L=>L.id===w)?w:null)},[]);c.useEffect(()=>{I()},[I]),c.useEffect(()=>{P(null)},[u]);const b=c.useMemo(()=>a.find(T=>T.id===u)??null,[a,u]),$=c.useMemo(()=>ID(Pm(a,e,o)),[a,e,o]),O=c.useMemo(()=>Pm(a,e,o),[a,e,o]),D=c.useMemo(()=>vD(o),[o]),R=c.useMemo(()=>{const T=new Map;for(const w of D)T.set(Zi(w),{morning:[],afternoon:[]});for(const w of O){const L=Yn(w.startTime);if(!L)continue;const N=Zi(L),M=jD(w);if(!M||!T.has(N))continue;const A=T.get(N)??{morning:[],afternoon:[]};T.set(N,{...A,[M]:[...A[M],w]})}for(const[w,L]of T)T.set(w,{morning:[...L.morning].sort((N,M)=>N.startTime.localeCompare(M.startTime)),afternoon:[...L.afternoon].sort((N,M)=>N.startTime.localeCompare(M.startTime))});return T},[O,D]),V=c.useMemo(()=>[...R.values()].some(T=>T.morning.length>0||T.afternoon.length>0),[R]),te=T=>{y({title:T.title,startTime:Cm(T.startTime),endTime:T.endTime?Cm(T.endTime):"",location:T.location??"",description:T.description??"",eventType:T.eventType,status:T.status}),S(null),k(T.id)},q=async T=>{if(T.preventDefault(),!g.title.trim()||!g.startTime){S("请填写标题和开始时间。");return}const w={title:g.title.trim(),description:g.description.trim()||void 0,startTime:is(g.startTime),endTime:g.endTime?is(g.endTime):void 0,location:g.location.trim()||void 0,status:g.status,eventType:g.eventType,source:"manual",needsUserConfirmation:!1,conflictEventIds:[]},L=vr({id:"",...w},a),N=await Mc({...w,conflictEventIds:L.map(M=>M.eventId)});S(L.length?`检测到 ${L.length} 个时间冲突，已保存并标记冲突。`:null),h(bl),m(!1),await I(),f(N.id)},W=async T=>{T.preventDefault();const w=a.find(A=>A.id===x);if(!w)return;if(!v.title.trim()||!v.startTime){S("请填写标题和开始时间。");return}const L={title:v.title.trim(),description:v.description.trim()||void 0,startTime:is(v.startTime),endTime:v.endTime?is(v.endTime):void 0,location:v.location.trim()||void 0,eventType:v.eventType,status:v.status,conflictEventIds:[]},N=vr({id:w.id,...L},a),M=await va(w.id,{...L,conflictEventIds:N.map(A=>A.eventId)});if(!M){S("保存失败，未找到该日程。");return}P(N.length?`检测到 ${N.length} 个时间冲突，已保存并标记冲突。`:"日程已更新。"),S(null),k(null),await I(),f(M.id)},fe=async T=>{await va(T.id,{status:"confirmed",needsUserConfirmation:!1,source:T.source==="email_ai"?"email_user_confirmed":T.source})&&await I()},le=async T=>{await va(T.id,{status:"ignored",needsUserConfirmation:!1})&&await I()},Q=async T=>{await dj(T.id)&&await I()},ge=T=>{T.sourceMessageId&&(sessionStorage.setItem("aioffice.pendingSourceMailId",JSON.stringify({messageId:T.sourceMessageId,subject:T.sourceEmailSubject??T.title})),window.dispatchEvent(new CustomEvent("open-calendar-source-mail",{detail:{messageId:T.sourceMessageId,subject:T.sourceEmailSubject??T.title}})))};return t.jsxs($D,{children:[t.jsxs(TD,{children:[t.jsxs("div",{children:[t.jsx(CD,{children:"日程管理"}),t.jsx(PD,{children:"管理会议、截止事项、待确认日程和邮件识别出的时间安排。"})]}),t.jsxs(AD,{type:"button",onClick:()=>m(T=>!T),children:[t.jsx(Gm,{size:16})," 新建日程"]})]}),t.jsxs(_D,{children:[t.jsxs(ED,{children:[t.jsx(zD,{children:"筛选"}),yD.map(T=>t.jsx(DD,{$active:e===T.key,onClick:()=>n(T.key),children:T.label},T.key))]}),t.jsxs(RD,{children:[t.jsxs(MD,{children:[t.jsxs(Am,{children:[t.jsx(Vi,{type:"button",onClick:()=>s(new Date),children:"今天"}),t.jsx(Vi,{type:"button",onClick:()=>s(T=>lc(T,-7)),children:"上一周"}),t.jsx(BD,{children:wD(o)}),t.jsx(Vi,{type:"button",onClick:()=>s(T=>lc(T,7)),children:"下一周"})]}),t.jsxs(Am,{children:[t.jsx(FD,{children:"视图："}),t.jsx(Vi,{type:"button",$active:r==="week",onClick:()=>i("week"),children:"日程表"}),t.jsx(Vi,{type:"button",$active:r==="list",onClick:()=>i("list"),children:"列表"})]})]}),p&&t.jsxs(Ix,{onSubmit:T=>void q(T),children:[t.jsx(Em,{children:"新建日程"}),j&&t.jsx(xl,{children:j}),t.jsxs(an,{children:["标题",t.jsx(ur,{value:g.title,onChange:T=>h(w=>({...w,title:T.target.value}))})]}),t.jsxs(zm,{children:[t.jsxs(an,{children:["开始时间",t.jsx(ur,{type:"datetime-local",value:g.startTime,onChange:T=>h(w=>({...w,startTime:T.target.value}))})]}),t.jsxs(an,{children:["结束时间",t.jsx(ur,{type:"datetime-local",value:g.endTime,onChange:T=>h(w=>({...w,endTime:T.target.value}))})]}),t.jsxs(an,{children:["地点",t.jsx(ur,{value:g.location,onChange:T=>h(w=>({...w,location:T.target.value}))})]}),t.jsxs(an,{children:["类型",t.jsx(os,{value:g.eventType,onChange:T=>h(w=>({...w,eventType:T.target.value})),children:Object.entries(qi).map(([T,w])=>t.jsx("option",{value:T,children:w},T))})]}),t.jsxs(an,{children:["状态",t.jsxs(os,{value:g.status,onChange:T=>h(w=>({...w,status:T.target.value})),children:[t.jsx("option",{value:"confirmed",children:"已确认"}),t.jsx("option",{value:"tentative",children:"待确认"})]})]})]}),t.jsxs(an,{children:["描述",t.jsx(Dm,{value:g.description,onChange:T=>h(w=>({...w,description:T.target.value}))})]}),t.jsxs(hl,{children:[t.jsx(Wn,{$variant:"primary",type:"submit",children:"保存"}),t.jsx(Wn,{type:"button",onClick:()=>{m(!1),S(null)},children:"取消"})]})]}),r==="week"?t.jsxs(t.Fragment,{children:[t.jsxs(LD,{children:[t.jsx(ND,{children:"时段"}),D.map(T=>t.jsxs(OD,{$today:_s(T,new Date),children:[t.jsx(WD,{children:T.toLocaleDateString("zh-CN",{weekday:"short"})}),t.jsxs(UD,{children:[T.getMonth()+1,"/",T.getDate()]})]},Zi(T))),["morning","afternoon"].map((T,w)=>t.jsxs(c.Fragment,{children:[t.jsx(HD,{children:T==="morning"?"上午":"下午"},`label-${T}`),D.map((L,N)=>{const M=Zi(L),ee=(R.get(M)??{morning:[],afternoon:[]})[T];return t.jsx(KD,{$today:_s(L,new Date),$lastColumn:N===D.length-1,$lastRow:w===1,children:ee.map(me=>{var Ie,Fe;return t.jsxs(XD,{type:"button",$active:me.id===u,$conflict:!!((Ie=me.conflictEventIds)!=null&&Ie.length),$fromEmail:me.source==="email_ai"||me.source==="email_user_confirmed",onClick:()=>f(me.id),children:[t.jsx(qD,{children:kD(me)}),t.jsx(VD,{children:me.title}),t.jsxs(_m,{children:[t.jsx(dr,{$tone:jm(me.status),children:rs[me.status]}),t.jsx(dr,{$tone:Im(me.eventType),children:qi[me.eventType]}),t.jsx(dr,{$tone:$m(me.source),children:gl(me.source)}),!!((Fe=me.conflictEventIds)!=null&&Fe.length)&&t.jsx(dr,{$tone:"danger",children:"有冲突"})]})]},me.id)})},`${M}-${T}`)})]},T))]}),!V&&t.jsx(GD,{children:"本周暂无日程"})]}):$.length===0?t.jsxs(eR,{children:[t.jsx(tR,{children:t.jsx(Ym,{size:40,strokeWidth:1.4})}),t.jsx(nR,{children:"暂无日程安排。"}),t.jsxs(rR,{children:["当邮件中识别到会议、截止时间或候选时间后，",t.jsx("br",{}),"会在这里显示待确认日程。"]})]}):$.map(T=>t.jsxs(YD,{children:[t.jsx(JD,{children:T.label}),T.events.map(w=>{var L,N;return t.jsxs(jx,{type:"button",$active:w.id===u,$conflict:!!((L=w.conflictEventIds)!=null&&L.length),$fromEmail:w.source==="email_ai"||w.source==="email_user_confirmed",onClick:()=>f(w.id),children:[t.jsx(ZD,{children:w.title}),t.jsx(QD,{children:Tm(w)}),t.jsxs(_m,{children:[t.jsx(dr,{$tone:jm(w.status),children:rs[w.status]}),t.jsx(dr,{$tone:Im(w.eventType),children:qi[w.eventType]}),t.jsx(dr,{$tone:$m(w.source),children:gl(w.source)}),!!((N=w.conflictEventIds)!=null&&N.length)&&t.jsx(dr,{$tone:"danger",children:"有冲突"})]})]},w.id)})]},T.dateKey))]}),t.jsx(iR,{children:b?t.jsxs(lR,{children:[t.jsx(cR,{children:b.title}),t.jsxs(yn,{children:[t.jsx(vn,{children:"时间"}),t.jsx(wn,{children:Tm(b)})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"地点"}),t.jsx(wn,{children:b.location||"未填写"})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"会议链接"}),t.jsx(wn,{children:b.meetingLink||"未填写"})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"描述"}),t.jsx(wn,{children:b.description||"无"})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"状态"}),t.jsx(wn,{children:rs[b.status]})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"类型"}),t.jsx(wn,{children:qi[b.eventType]})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"来源"}),t.jsx(wn,{children:gl(b.source)})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"来源邮件"}),t.jsx(wn,{children:b.sourceEmailSubject||"无"})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"发件人"}),t.jsx(wn,{children:b.sourceEmailFrom||"无"})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"冲突状态"}),t.jsx(wn,{children:(J=b.conflictEventIds)!=null&&J.length?`与 ${b.conflictEventIds.length} 个日程冲突`:"无冲突"})]}),t.jsxs(yn,{children:[t.jsx(vn,{children:"参会人"}),t.jsx(wn,{children:(H=b.attendees)!=null&&H.length?b.attendees.map(T=>T.name||T.email).filter(Boolean).join("、"):"无"})]}),z&&t.jsx(xl,{children:z}),t.jsxs(hl,{children:[b.source!=="manual"&&b.status!=="confirmed"&&b.status!=="ignored"&&t.jsx(Wn,{$variant:"primary",type:"button",onClick:()=>void fe(b),children:"确认加入日程"}),b.status!=="ignored"&&t.jsx(Wn,{type:"button",onClick:()=>te(b),children:"修改时间"}),b.source!=="manual"&&b.status!=="ignored"&&t.jsx(Wn,{type:"button",onClick:()=>void le(b),children:"忽略"}),b.status!=="ignored"&&(b.source==="email_ai"||b.source==="email_user_confirmed")&&b.sourceMessageId&&t.jsx(Wn,{type:"button",onClick:()=>ge(b),children:"查看来源邮件"}),t.jsx(Wn,{$variant:"danger",type:"button",onClick:()=>void Q(b),children:"删除"})]})]}):t.jsxs(oR,{children:[t.jsx(Ib,{size:32,strokeWidth:1.3}),t.jsx(sR,{children:"请选择一个日程查看详情"}),t.jsx(aR,{children:"选中后可查看时间、来源邮件与可执行操作。"})]})})]}),x&&t.jsx(dR,{children:t.jsx(uR,{children:t.jsxs(pR,{onSubmit:T=>void W(T),children:[t.jsx(Em,{children:"修改日程"}),j&&t.jsx(xl,{children:j}),t.jsxs(an,{children:["标题",t.jsx(ur,{value:v.title,onChange:T=>y(w=>({...w,title:T.target.value}))})]}),t.jsxs(zm,{children:[t.jsxs(an,{children:["开始时间",t.jsx(ur,{type:"datetime-local",value:v.startTime,onChange:T=>y(w=>({...w,startTime:T.target.value}))})]}),t.jsxs(an,{children:["结束时间",t.jsx(ur,{type:"datetime-local",value:v.endTime,onChange:T=>y(w=>({...w,endTime:T.target.value}))})]}),t.jsxs(an,{children:["地点",t.jsx(ur,{value:v.location,onChange:T=>y(w=>({...w,location:T.target.value}))})]}),t.jsxs(an,{children:["类型",t.jsx(os,{value:v.eventType,onChange:T=>y(w=>({...w,eventType:T.target.value})),children:Object.entries(qi).map(([T,w])=>t.jsx("option",{value:T,children:w},T))})]}),t.jsxs(an,{children:["状态",t.jsx(os,{value:v.status,onChange:T=>y(w=>({...w,status:T.target.value})),children:Object.entries(rs).map(([T,w])=>t.jsx("option",{value:T,children:w},T))})]})]}),t.jsxs(an,{children:["描述",t.jsx(Dm,{value:v.description,onChange:T=>y(w=>({...w,description:T.target.value}))})]}),t.jsxs(hl,{children:[t.jsx(Wn,{$variant:"primary",type:"submit",children:"保存修改"}),t.jsx(Wn,{type:"button",onClick:()=>{k(null),S(null)},children:"取消"})]})]})})})]})}const yl=Z_.replace(/^\//,""),Qi=!1,Rm=Qi?c.lazy(()=>co(()=>import("./SkillDevPanel-DnPH36S0.js"),__vite__mapDeps([7,1,2,3,6,4,5]))):null,Mm=l.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f7f8fb;
`;l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;const mR=l.div`
  flex: 1;
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`,gR=l.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`,hR=l.div`
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
`;l.div`
  width: 380px;
  border-left: 1px solid #dde3ec;
  background: #ffffff;
  flex-shrink: 0;
`;const xR=l.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
`,bR=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`,yR=l.div`
  flex: 1;
  display: ${e=>e.$visible?"flex":"none"};
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`,vR=l.div`
  height: 44px;
  background: #1a2840;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 10px;
  flex-shrink: 0;
`,wR=l.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  color: rgba(200,220,240,0.9);
  font-size: var(--font-size-xs);
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: rgba(255,255,255,0.15); color: #fff; }
`,SR=l.span`
  font-size: var(--font-size-sm);
  color: rgba(180,205,230,0.7);
  font-weight: 500;
  flex-shrink: 0;
`,kR=l.div`
  flex: 1;
`,Fm=l.span`
  font-size: var(--font-size-xs);
  color: rgba(180,205,230,0.65);
  flex-shrink: 0;
`,jR=l.select`
  height: 30px;
  padding: 0 4px 0 6px;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 4px;
  background: rgba(40,60,90,0.8);
  color: rgba(200,220,240,0.9);
  font-size: var(--font-size-xs);
  cursor: pointer;
  max-width: 160px;
  &:focus { outline: none; }
  option { background: #1a2840; color: #e0f0ff; }
`,IR=l.div`
  width: 1px;
  height: 18px;
  background: rgba(255,255,255,0.15);
  flex-shrink: 0;
`,$R=l.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 8px 0 10px;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
  color: rgba(180,205,230,0.7);
  font-size: var(--font-size-xs);
  flex-shrink: 0;
`,TR=l.span`
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(220,235,250,0.95);
`,CR=l.button`
  flex-shrink: 0;
  height: 26px;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 3px;
  background: rgba(255,255,255,0.1);
  color: rgba(200,220,240,0.9);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.2); color: #fff; }
`,Sn=l.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`,PR=l.div`
  height: 30px;
  background: #ffffff;
  border-top: 1px solid #dde3ec;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  color: #304255;
`,AR=l.div`
  display: flex;
  align-items: center;
  gap: 12px;
`,_R=l.div`
  display: flex;
  align-items: center;
  gap: 10px;
`,ER=l.span`
  cursor: pointer;
  padding: 0 4px;
  &:hover { background: #eef3f9; }
`,Bm=l.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid ${e=>e.$active?"#9fc2e6":"#cad6e2"};
  border-radius: 4px;
  background: ${e=>e.$active?"#eaf2fb":"#ffffff"};
  color: #304255;
  font-size: var(--font-size-xs);
  cursor: pointer;
  &:hover { background: #eef4fb; }
`,zR=l.span`
  padding: 0 6px;
  font-size: var(--font-size-xs);
  color: #4a5f73;
  font-weight: 600;
`,DR=l.button`
  height: 26px;
  padding: 0 8px;
  border: 1px solid #e0c8c8;
  border-radius: 4px;
  background: #fff5f5;
  color: #a03030;
  font-size: var(--font-size-xs);
  cursor: pointer;
  &:hover { background: #ffe8e8; }
`,RR=l.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 6px 0 8px;
  border: 1px solid #c8d8ea;
  border-radius: 10px;
  background: #edf4fc;
  font-size: var(--font-size-xs);
  color: #2a4a6e;
  font-weight: 500;
  max-width: 180px;
  overflow: hidden;
`,MR=l.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
`,FR=l.button`
  flex-shrink: 0;
  height: 24px;
  padding: 0 7px;
  border: 1px solid #b0c8e0;
  border-radius: 7px;
  background: #ffffff;
  color: #1f6fd6;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #e8f0fb; }
`;l.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid #cad6e2;
  border-radius: 4px;
  background: ${e=>e.$active?"#eaf2fb":"#ffffff"};
  color: #304255;
  font-size: var(--font-size-xs);
  cursor: pointer;
  &:hover { background: #eef4fb; }
`;const BR=l.div`
  height: 240px;
  border-top: 1px solid #dde3ec;
  background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 0;
`,LR=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #e3e9f1;
`,NR=l.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`,OR=l.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: #1f3447;
`,WR=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: #6e8295;
`,UR=l.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`,Lm=l.button`
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #304255;
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #f4f8fb;
  }
`,HR=l.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #e8edf3;

  @media (max-width: 1120px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`,KR=l.div`
  min-width: 0;
  border: 1px solid #dce5ef;
  border-radius: 10px;
  background: #fbfdff;
  padding: 10px;
  display: grid;
  gap: 6px;
`,GR=l.div`
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #7a8ea2;
`,qR=l.div`
  min-width: 0;
  font-size: var(--font-size-xs);
  line-height: 1.55;
  color: #243447;
  font-weight: 700;
  word-break: break-word;
`,VR=l.div`
  min-height: 0;
  overflow: auto;
  padding: 10px 14px 14px;
  display: grid;
  gap: 8px;
`,Nm=l.div`
  border: 1px solid ${({$tone:e})=>e==="error"?"#f0cccc":e==="success"?"#cfead8":e==="running"?"#cfe0f4":"#dde5ee"};
  border-radius: 10px;
  background: ${({$tone:e})=>e==="error"?"#fff6f6":e==="success"?"#f3fbf6":e==="running"?"#f4f9ff":"#ffffff"};
  padding: 10px 12px;
  display: grid;
  gap: 6px;
`,YR=l.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`,JR=l.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-xs);
  font-weight: 800;
  color: #4f6478;
`,XR=l.div`
  font-size: var(--font-size-xs);
  color: #8093a6;
`,Om=l.div`
  font-size: var(--font-size-xs);
  line-height: 1.65;
  color: #233648;
  white-space: pre-wrap;
  word-break: break-word;
`;function ss(e){return e==="document"?"文稿":e==="image"?"图片":e==="ppt"?"PPT":e==="daily-report"?"日报":e==="homework"?"作业":e==="ai-class"?"AI课堂":e==="ai-forum"?"AI论坛":e==="paper"?"论文":e==="data"?"数据分析":e==="model"?"模型开发":e==="daily-feed"?"科学资讯":"邮件"}function ZR(e){return e==="running"?"运行中":e==="completed"?"已完成":e==="error"?"出错":"空闲"}function QR(e){return e==="paper"?"论文任务":e==="image"?"图片任务":e==="assistant"?"写作助手":e==="continue"?"续写任务":e==="rewrite"?"改写任务":"AI任务"}function e3(e){const n=new Date(e);return Number.isNaN(n.getTime())?"--:--:--":n.toLocaleTimeString("zh-CN",{hour12:!1})}const t3=l.select`
  padding: 1px 4px;
  border: none;
  background: transparent;
  color: #304255;
  font-size: var(--font-size-xs);
  cursor: pointer;
  outline: none;
  option { background: #ffffff; color: #304255; }
`,n3=l.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 32px;
`,r3=l.h1`
  margin: 0 0 8px;
  font-size: 28px;
  color: #1f3142;
`;function i3({statusMessage:e,runtimeStatus:n,activeWorkspacePath:r,closeWorkspace:i,language:o,setLanguage:s,markdown:a,onLogout:d}){var Z;const{mode:u,currentMode:f,generationMode:p}=Cn(),{generationStatus:m}=kr(),{departments:g,selectedDepartmentId:h,selectDepartment:x,loading:k}=Ii(),v=go(),y=(Z=v==null?void 0:v.user)==null?void 0:Z.username,{activeWorkspaceName:j}=Ft(),[S,z]=c.useState(yl),[P,I]=c.useState(yl),b=c.useCallback(X=>{z(X)},[]),$=c.useCallback(()=>{I(S),z("workspace")},[S]),[O,D]=c.useState(!1),[R,V]=c.useState([]),[te,q]=c.useState(null),[W,fe]=c.useState(!1),[le,Q]=c.useState(()=>{try{const X=`aioffice.kbSelection.${p}`,ye=localStorage.getItem(X);if(ye)return JSON.parse(ye)}catch{}return h?[h]:[]}),[ge,J]=c.useState(!1);c.useEffect(()=>{try{const X=`aioffice.kbSelection.${p}`,ye=localStorage.getItem(X);if(ye){Q(JSON.parse(ye));return}}catch{}Q(h?[h]:[])},[p]),c.useEffect(()=>{const X=le[0];X&&X!==h&&x(X)},[le,h,x]);const H=c.useCallback(X=>{Q(X),J(!1);try{const ye=`aioffice.kbSelection.${p}`;localStorage.setItem(ye,JSON.stringify(X))}catch{}},[p]),{workspaceKbIds:T,setWorkspaceKbIds:w}=a0(),[L,N]=c.useState(!1),M=c.useCallback(X=>{w(X),N(!1)},[w]),A=c.useCallback(X=>{const ye=X.createdAt||new Date().toISOString();V(Ee=>{const G={...X,createdAt:ye,id:`${ye}-${Ee.length}`},F=Ee[Ee.length-1];return F&&F.source===G.source&&F.message===G.message&&(F.step??null)===(G.step??null)?Ee:[...Ee,G].slice(-120)})},[]);c.useEffect(()=>{A({source:"工作台",message:`已切换到${ss(p)}模式`,tone:"neutral"})},[A,p]),c.useEffect(()=>{e.trim()&&A({source:"状态栏",message:e,tone:e.includes("失败")||e.includes("出错")?"error":"neutral"})},[A,e]),c.useEffect(()=>{m.message.trim()&&A({source:`${ss(f)}流程`,message:m.message,tone:m.phase==="error"?"error":m.phase==="completed"?"success":m.phase==="running"?"running":"neutral",createdAt:m.updatedAt||void 0})},[A,f,m]),c.useEffect(()=>{const X=window.electronAPI;if(!(X!=null&&X.onAiEvent))return;const ye=X.onAiEvent(Ee=>{const G=Ee,F=String(G.type||"").trim();if(!["start","status","progress","done","error"].includes(F))return;const se=typeof G.step=="number"&&Number.isFinite(G.step)?G.step:null;se!==null&&q(se);let _e=String(G.message||"").trim();_e||(F==="start"?_e="任务已启动":F==="done"?_e="任务已完成":F==="error"&&(_e="任务执行失败")),_e&&A({source:QR(G.scope),message:_e,tone:F==="error"?"error":F==="done"?"success":"running",step:se})});return()=>ye()},[A]),c.useEffect(()=>{const X=()=>b("chat");return window.addEventListener("open-chat-window",X),()=>window.removeEventListener("open-chat-window",X)},[b]),c.useEffect(()=>{const X=()=>b("account");return window.addEventListener("open-account-center",X),()=>window.removeEventListener("open-account-center",X)},[b]),c.useEffect(()=>{const X=()=>b("calendar");return window.addEventListener("open-calendar-workspace",X),()=>window.removeEventListener("open-calendar-workspace",X)},[b]),c.useEffect(()=>{const X=ye=>{const Ee=ye.detail;$(),window.dispatchEvent(new CustomEvent("open-communication-workbench")),window.setTimeout(()=>{window.dispatchEvent(new CustomEvent("open-communication-workbench")),window.dispatchEvent(new CustomEvent("open-calendar-source-mail-select",{detail:Ee}))},0)};return window.addEventListener("open-calendar-source-mail",X),()=>window.removeEventListener("open-calendar-source-mail",X)},[$]),c.useEffect(()=>{const X=()=>{$(),window.dispatchEvent(new CustomEvent("open-communication-workbench"))};return window.addEventListener("open-email-compose",X),()=>window.removeEventListener("open-email-compose",X)},[$]),c.useEffect(()=>{const X=ye=>{const Ee=ye.detail;(Ee==null?void 0:Ee.tab)==="account"?b("account"):((Ee==null?void 0:Ee.tab)==="settings"||(Ee==null?void 0:Ee.tab)==="image"||(Ee==null?void 0:Ee.tab)==="tools")&&b("settings")};return window.addEventListener("open-sidebar-tab",X),()=>window.removeEventListener("open-sidebar-tab",X)},[b]);const ee=R[R.length-1]||null,me=m.message||e||n||"当前没有新的输出",Ie=te!==null?`步骤 ${te}`:m.phase==="running"?"进行中":"未开始",Fe=c.useMemo(()=>[{label:"当前模式",value:ss(f)},{label:"当前阶段",value:ZR(m.phase)},{label:"当前步骤",value:Ie},{label:"最新输出",value:me}],[f,me,Ie,m.phase]);return t.jsxs(t.Fragment,{children:[t.jsxs(xR,{children:[t.jsx(oE,{section:S,onNavigate:b,username:y}),t.jsxs(bR,{children:[S==="home"&&t.jsx(Sn,{children:t.jsx(SE,{onNavigate:b})}),S==="work"&&t.jsx(Sn,{children:t.jsx(NE,{onGoToWorkspace:$,onNavigate:b})}),S==="calendar"&&t.jsx(Sn,{children:t.jsx(fR,{})}),S==="study"&&t.jsx(Sn,{children:t.jsx(GE,{onGoToWorkspace:$})}),S==="life"&&t.jsx(Sn,{children:t.jsx(ZE,{onGoToWorkspace:$})}),S==="resource"&&t.jsx(Sn,{children:t.jsx(I8,{onGoToWorkspace:$})}),S==="chat"&&t.jsx(Sn,{children:t.jsx(N4,{inline:!0,onClose:()=>b(yl)})}),S==="contacts"&&t.jsx(Sn,{children:t.jsx(D_,{})}),S==="settings"&&t.jsx(Sn,{children:t.jsx(U8,{})}),S==="account"&&t.jsx(Sn,{children:t.jsx(e6,{})}),S==="skill-center"&&t.jsx(Sn,{children:t.jsx(bD,{})}),t.jsxs(yR,{$visible:S==="workspace",children:[t.jsxs(vR,{children:[t.jsx(wR,{onClick:()=>b(P),children:"← 返回"}),t.jsx(SR,{children:u==="free"?"文稿":ss(p)}),t.jsx(kR,{}),u==="free"&&t.jsx(yd,{departments:g,selectedIds:T,loading:k,error:null,onOpenPicker:()=>N(!0)}),u!=="free"&&p!=="email"&&p!=="document"&&p!=="ai-class"&&p!=="ai-forum"&&p!=="data"&&p!=="model"&&p!=="daily-feed"&&t.jsx(yd,{departments:g,selectedIds:le,loading:k,error:null,onOpenPicker:()=>J(!0)}),u==="generation"&&p==="document"&&t.jsxs(t.Fragment,{children:[t.jsx(Fm,{children:"模板"}),t.jsxs(jR,{value:"",onChange:()=>{},children:[t.jsx("option",{value:"",children:"无模板"}),t.jsx("option",{disabled:!0,children:"通知（待接入）"}),t.jsx("option",{disabled:!0,children:"工作报告（待接入）"}),t.jsx("option",{disabled:!0,children:"会议纪要（待接入）"}),t.jsx("option",{disabled:!0,children:"公文（待接入）"})]})]}),t.jsx(IR,{}),j&&t.jsxs($R,{title:r??"",children:[t.jsx(Fm,{children:"工作区"}),t.jsx(TR,{children:j}),t.jsx(CR,{onClick:i,children:"切换"})]})]}),t.jsxs(mR,{children:[u==="free"&&t.jsx(s_,{}),t.jsxs(gR,{children:[t.jsx(hR,{children:t.jsx(u2,{ghostTextEnabled:!1})}),u!=="free"&&p!=="ai-class"&&p!=="ai-forum"&&p!=="daily-feed"&&t.jsx(b4,{})]})]})]})]})]}),ge&&t.jsx(Sd,{departments:g,selectedIds:le,onApply:H,onClose:()=>J(!1)}),L&&t.jsx(Sd,{departments:g,selectedIds:T,onApply:M,onClose:()=>N(!1),title:"选择文稿知识库"}),Qi&&O?t.jsxs(BR,{"data-testid":"runtime-output-drawer",children:[t.jsxs(LR,{children:[t.jsxs(NR,{children:[t.jsxs(OR,{children:[t.jsx(md,{size:15})," 终端输出"]}),t.jsx(WR,{children:"集中展示当前任务输出、阶段状态和最近的 AI 运行记录，方便测试时看现在卡在哪一步。"})]}),t.jsxs(UR,{children:[t.jsx(Lm,{type:"button",onClick:()=>V([]),children:"清空记录"}),t.jsx(Lm,{type:"button",onClick:()=>D(!1),title:"收起输出面板",children:t.jsx(Rn,{size:14})})]})]}),t.jsx(HR,{children:Fe.map(X=>t.jsxs(KR,{children:[t.jsx(GR,{children:X.label}),t.jsx(qR,{children:X.value})]},X.label))}),t.jsx(VR,{children:R.length>0?R.slice().reverse().map(X=>t.jsxs(Nm,{$tone:X.tone,children:[t.jsxs(YR,{children:[t.jsxs(JR,{children:[t.jsx("span",{children:X.source}),typeof X.step=="number"?t.jsxs("span",{children:["步骤 ",X.step]}):null]}),t.jsx(XR,{children:e3(X.createdAt)})]}),t.jsx(Om,{children:X.message})]},X.id)):t.jsx(Nm,{children:t.jsx(Om,{children:ee?ee.message:"当前还没有输出记录。开始生成、导入或切换流程后，这里会持续追加状态。"})})})]}):null,Qi&&W&&Rm&&t.jsx(c.Suspense,{fallback:null,children:t.jsx(Rm,{onClose:()=>fe(!1)})}),t.jsxs(PR,{children:[t.jsx(AR,{children:r&&j&&t.jsxs(RR,{title:r,children:[t.jsx(MR,{children:j}),t.jsx(FR,{onClick:i,title:"切换工作区",children:"切换"})]})}),t.jsxs(_R,{children:[Qi&&t.jsxs(Bm,{type:"button",$active:O,onClick:()=>D(X=>!X),title:O?"收起调试输出面板":"打开调试输出面板",children:[t.jsx(md,{size:13})," 调试输出"]}),Qi&&t.jsx(Bm,{type:"button",$active:W,onClick:()=>fe(X=>!X),title:"Skill Dev Panel",children:"🧠 Skills"}),t.jsx(ER,{title:"AI-Office 3.0",children:"AI-Office 3.0"}),t.jsxs(t3,{value:o,onChange:X=>s(X.target.value),children:[t.jsx("option",{value:"zh",children:"中文"}),t.jsx("option",{value:"en",children:"English"})]}),y&&t.jsx(zR,{children:y}),t.jsx(DR,{type:"button",onClick:d,title:"退出登录",children:"退出"})]})]})]})}function o3({onLogout:e}){var g,h;const{markdown:n,statusMessage:r,setStatusMessage:i}=Jn(),{language:o,setLanguage:s}=O4(),{initialized:a,activeWorkspacePath:d,closeWorkspace:u}=Ft(),f=go(),[p,m]=c.useState("本地模式已就绪");return c.useEffect(()=>{const x=window.electronAPI,k=x!=null&&x.onAiEvent?x.onAiEvent(v=>{const y=v,j={paper:"论文","paper-section":"论文","daily-report":"日报","essay-writing":"散文",image:"图片",continue:"续写",rewrite:"重写"};if((y.type==="progress"||y.type==="content"||y.type==="status")&&y.message){const S=`${j[y.scope||""]||"AI"}: ${y.message}`;m(S),i(S)}else if(y.type==="start"&&y.scope){const S=`${j[y.scope]||"AI"}任务启动`;m(S),i(S)}else if(y.type==="done"&&y.scope){const S=`${j[y.scope]||"AI"}任务已完成`;m(S),i(S)}}):()=>{};return()=>{k()}},[i]),c.useEffect(()=>{const x=window.electronAPI;x!=null&&x.getSettings&&x.getSettings().then(k=>{Zl(k)}).catch(()=>{})},[]),c.useEffect(()=>{if(!d)return;const x=window.electronAPI;if(!(x!=null&&x.activityTakeSnapshot))return;const k=d;x.activityTakeSnapshot(k).then(()=>{var v;(v=x.activityGetActivity)==null||v.call(x,{workspacePath:k}).catch(()=>{})}).catch(()=>{})},[d]),a?d?t.jsx(q4,{userId:((g=f==null?void 0:f.user)==null?void 0:g.id)??null,username:((h=f==null?void 0:f.user)==null?void 0:h.username)??null,activeWorkspacePath:d,children:t.jsx(Mm,{children:t.jsx(Uy,{children:t.jsx(Vy,{children:t.jsx($0,{children:t.jsx(P0,{children:t.jsx(C0,{children:t.jsx(i3,{statusMessage:r,runtimeStatus:p,activeWorkspacePath:d,closeWorkspace:u,language:o,setLanguage:s,markdown:n,onLogout:e})})})})})})})}):t.jsx(X_,{}):t.jsx(Mm,{children:t.jsx(n3,{children:t.jsx(r3,{children:"正在加载工作区..."})})})}const s3=l.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #eef2f8 0%, #f5f8fc 60%, #e8eef7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  font-size: 18px;
  color: #4a5f73;
`;function a3(){const{state:e,logout:n}=rn(),r=e.phase==="logged_in"||e.phase==="must_change_password"&&Pl;{if(e.phase==="restoring")return t.jsx(s3,{children:"AI Office · 正在启动..."});if(e.phase==="must_change_password"&&!Pl)return t.jsx(I_,{});if(!r)return t.jsx(h_,{})}return t.jsx(o3,{onLogout:n})}class l3 extends Ct.Component{constructor(){super(...arguments);dd(this,"state",{error:null})}static getDerivedStateFromError(r){return{error:r}}componentDidCatch(r,i){console.error("Renderer crashed:",r,i)}render(){if(!this.state.error)return this.props.children;const r=this.state.error;return t.jsx("div",{style:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"32px",background:"#1e1e1e",boxSizing:"border-box"},children:t.jsxs("div",{style:{width:"min(760px, 100%)",border:"1px solid #4a2f2f",borderRadius:"14px",background:"#241a1a",color:"#f5d7d7",padding:"24px",boxShadow:"0 20px 60px rgba(0,0,0,0.35)"},children:[t.jsx("h1",{style:{margin:"0 0 10px",fontSize:"22px"},children:"应用界面加载失败"}),t.jsx("p",{style:{margin:"0 0 12px",fontSize:"13px",lineHeight:1.7,color:"#e9c1c1"},children:"这不是正常状态。请把下面的错误信息发回来，可以继续精确修复。"}),t.jsx("pre",{style:{margin:0,padding:"14px",borderRadius:"10px",background:"#161012",color:"#ffd8d8",fontSize:"12px",lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:"360px",overflow:"auto"},children:r.stack||r.message})]})})}}const c3=3,d3="ai-writer-stop-writing-for-tab";function Wm(e){return{tabId:e,mode:"idle",writingComposerDraft:"",writingStatus:"",writingRunning:!1,writingPaused:!1,taskPhase:"idle",activeTaskId:null,taskStatusMessage:"",selectedKnowledgeBaseIds:[],replyPaneCollapsed:!0,replyPaneTemporaryExpand:!1,lastActiveAt:Date.now()}}const $x=c.createContext(null);function u3({children:e}){const{tabs:n}=Jn(),[r,i]=c.useState({}),o=c.useRef(r);o.current=r;const s=c.useCallback(g=>{g&&i(h=>h[g]?h:{...h,[g]:Wm(g)})},[]),a=c.useCallback(g=>o.current[g],[]),d=c.useCallback((g,h)=>{g&&i(x=>{const k=x[g]||Wm(g);return{...x,[g]:{...k,...h,tabId:g,lastActiveAt:Date.now()}}})},[]),u=c.useCallback(g=>Object.values(o.current).filter(h=>h.writingRunning&&h.tabId!==g).length,[]),f=c.useCallback((g,h)=>g?h?!0:u(g)<c3:!1,[u]),p=c.useCallback(async g=>{var x;if(!g)return;const h=(x=o.current[g])==null?void 0:x.activeTaskId;h&&await Yc(h).catch(()=>{}),d(g,{mode:"idle",writingRunning:!1,writingPaused:!1,activeTaskId:null,taskPhase:"stopped"}),window.dispatchEvent(new CustomEvent(d3,{detail:{tabId:g}}))},[d]);c.useEffect(()=>{const g=new Set(n.map(h=>h.id));i(h=>{let x=!1;const k={};return Object.entries(h).forEach(([v,y])=>{g.has(v)?k[v]=y:x=!0}),x?k:h})},[n]);const m=c.useMemo(()=>({sessions:r,ensureSession:s,getSession:a,patchSession:d,countPeerRunningWritingTasks:u,canStartWritingTask:f,stopWritingForTab:p}),[f,u,s,a,d,r,p]);return t.jsx($x.Provider,{value:m,children:e})}function V3(){const e=c.useContext($x);if(!e)throw new Error("useEditorSession 必须在 EditorSessionProvider 内使用");return e}Tb();window.addEventListener("error",e=>{console.error("[GlobalError]",e.error??e.message),e.preventDefault()});window.addEventListener("unhandledrejection",e=>{console.error("[UnhandledRejection]",e.reason),e.preventDefault()});const Um=localStorage.getItem("aioffice.displayScale");Um&&(document.documentElement.style.zoom=Um);Ux.createRoot(document.getElementById("root"),{onRecoverableError(e,n){console.error("[ReactRecoverableError]",e,n)}}).render(t.jsx(Ct.StrictMode,{children:t.jsx(l3,{children:t.jsx(U4,{children:t.jsx(B1,{children:t.jsx(Nj,{children:t.jsx(T0,{children:t.jsx(j0,{children:t.jsx(u3,{children:t.jsx(Ab,{children:t.jsx(I0,{children:t.jsx(Gz,{children:t.jsx(s0,{children:t.jsx(a3,{})})})})})})})})})})})})}));export{Us as $,bg as A,b6 as B,G3 as C,Cl as D,d3 as E,q3 as F,I3 as G,C3 as H,N3 as I,M3 as J,L3 as K,K3 as L,O3 as M,H3 as N,Lp as O,ia as P,C2 as Q,as as R,Un as S,_i as T,un as U,c3 as V,I2 as W,pi as X,$3 as Y,T3 as Z,vx as _,fx as a,wx as a0,hx as a1,B0 as a2,Yc as a3,D3 as a4,yx as a5,R3 as a6,wA as a7,SA as a8,kA as a9,mv as aA,zg as aB,v3 as aC,R2 as aD,k3 as aE,sv as aF,uu as aG,Lh as aa,Nh as ab,uA as ac,pA as ad,fA as ae,Yp as af,Gl as ag,z3 as ah,F3 as ai,B3 as aj,W3 as ak,U3 as al,y3 as am,j3 as an,Sd as ao,lA as ap,O4 as aq,S3 as ar,Fs as as,oy as at,w3 as au,P3 as av,cx as aw,E3 as ax,Mg as ay,co as az,Jn as b,ky as c,kr as d,Cn as e,Sr as f,Ii as g,qz as h,wc as i,V3 as j,a0 as k,n6 as l,Ul as m,$c as n,K4 as o,Dh as p,mr as q,_3 as r,Ur as s,eo as t,Ft as u,$2 as v,A3 as w,z2 as x,Rs as y,b3 as z};
