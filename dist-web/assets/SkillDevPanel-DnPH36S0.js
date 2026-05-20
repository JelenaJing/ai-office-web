import{r as d,j as e}from"./vendor-react-DEJtDRDc.js";import{c as o}from"./vendor-ui-ByQTPyrL.js";import{r as w,u as y,l as z}from"./index.web-Bxp8mTKT.js";import"./vendor-editor-MHqHwKWZ.js";import"./vendor-shared-BcAh3SHW.js";import"./vendor-doc-GoCDVH9j.js";async function P(r){const{skillId:i,input:a,context:l}=r,n=w(i);if(!n)return{status:"failed",error:{code:"SKILL_NOT_FOUND",message:`未找到 Skill: ${i}`}};try{return await n.execute(a,l)}catch(s){return{status:"failed",error:{code:"SKILL_EXECUTION_ERROR",message:s instanceof Error?s.message:String(s),detail:s instanceof Error?{name:s.name,stack:s.stack}:s}}}}function I(){const{activeWorkspacePath:r}=y(),[i,a]=d.useState(null),[l,n]=d.useState(!1),[s,c]=d.useState(null),h=d.useCallback(async g=>{var t;n(!0),c(null);const m={...g,context:{workspacePath:r??void 0,...g.context}},x=await P(m);return a(x),x.status==="failed"&&c(((t=x.error)==null?void 0:t.message)??"执行失败"),n(!1),x},[r]),u=d.useCallback(()=>{a(null),c(null),n(!1)},[]);return{execute:h,result:i,loading:l,error:s,reset:u}}const R=o.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 420px;
  max-height: 70vh;
  overflow-y: auto;
  background: #0d1b2a;
  color: #c8d8e8;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: var(--font-size-xs);
  z-index: 9999;
`,C=o.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  background: #1a2d42;
  border-radius: 10px 10px 0 0;
  font-weight: 700;
  font-size: var(--font-size-sm);
  color: #7ab8f5;
  border-bottom: 1px solid #263d57;
`,E=o.div`
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`,D=o.div`
  padding: 8px 10px;
  background: #162230;
  border-radius: 6px;
  border-left: 3px solid #3a7cbf;
`,L=o.div`
  color: #7ab8f5;
  font-weight: 600;
`,O=o.div`
  color: #8aa3ba;
  margin-top: 2px;
`,f=o.div`
  border-top: 1px solid #263d57;
  padding-top: 10px;
`,p=o.div`
  color: #7ab8f5;
  font-weight: 700;
  margin-bottom: 8px;
`,k=o.div`
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
`,v=o.input`
  flex: 1;
  padding: 5px 8px;
  background: #0d1b2a;
  border: 1px solid #263d57;
  border-radius: 4px;
  color: #c8d8e8;
  font-family: inherit;
  font-size: var(--font-size-xs);
  &::placeholder { color: #4a6a82; }
`,b=o.button`
  padding: 5px 12px;
  background: #1e5794;
  color: #c8d8e8;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--font-size-xs);
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #2568ab; }
`,j=o.pre`
  background: #0a1520;
  border-radius: 6px;
  padding: 8px 10px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  font-size: var(--font-size-xs);
  color: #8fc9a8;
  margin: 0;
`,T=o(j)`
  color: #f07070;
`;function U({onClose:r}){const i=z(),{execute:a,result:l,loading:n,error:s}=I(),[c,h]=d.useState("请写一段关于人工智能的简短介绍。"),[u,g]=d.useState("一幅宁静的山水画，水墨风格"),m=async()=>{await a({skillId:"knowledge.writing.legacy",input:{instruction:c},context:{onStatus:t=>console.log("[SkillDevPanel] status:",t),onDelta:(t,S)=>console.log("[SkillDevPanel] delta len:",S.length)}})},x=async()=>{await a({skillId:"image.generate.legacy",input:{prompt:u},context:{onStatus:t=>console.log("[SkillDevPanel] status:",t)}})};return e.jsxs(R,{children:[e.jsxs(C,{children:["🧠 Skill Dev Panel (",i.length," skills)",r&&e.jsx(b,{style:{padding:"2px 8px",fontSize:"var(--font-size-xs)"},onClick:r,children:"✕"})]}),e.jsxs(E,{children:[e.jsxs("div",{children:[e.jsx(p,{children:"已注册 Skills"}),i.map(t=>e.jsxs(D,{children:[e.jsx(L,{children:t.manifest.id}),e.jsxs(O,{children:["[",t.manifest.category,"] v",t.manifest.version," — ",t.manifest.description]})]},t.manifest.id))]}),e.jsxs(f,{children:[e.jsx(p,{children:"测试: knowledge.writing.legacy"}),e.jsx(k,{children:e.jsx(v,{value:c,onChange:t=>h(t.target.value),placeholder:"输入写作指令..."})}),e.jsx(b,{disabled:n,onClick:()=>void m(),children:n?"执行中...":"执行"})]}),e.jsxs(f,{children:[e.jsx(p,{children:"测试: image.generate.legacy"}),e.jsx(k,{children:e.jsx(v,{value:u,onChange:t=>g(t.target.value),placeholder:"输入图片描述..."})}),e.jsx(b,{disabled:n,onClick:()=>void x(),children:n?"执行中...":"执行"})]}),s&&e.jsxs(f,{children:[e.jsx(p,{style:{color:"#f07070"},children:"执行错误"}),e.jsx(T,{children:s})]}),l&&e.jsxs(f,{children:[e.jsxs(p,{children:["执行结果 [",l.status,"]"]}),e.jsx(j,{children:JSON.stringify(l,null,2)})]})]})]})}export{U as default};
