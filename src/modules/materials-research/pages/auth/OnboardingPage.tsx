import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import type { ResearchDirection } from "../../types/user";

export function OnboardingPage() {
  const setOnboardingDone = useSessionStore((s) => s.setOnboardingDone);
  const navigate = useNavigate();
  const [direction, setDirection] = useState<ResearchDirection>("polymer");

  const finish = () => {
    setOnboardingDone(true);
    navigate("/research/dashboard");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-primary">首次登录 · 研究方向设置</h1>
      <p className="text-sm text-muted">完成后将生成个性化首页与论文推荐。</p>
      <label className="block text-sm">
        <span className="text-muted">研究方向</span>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as ResearchDirection)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="polymer">聚合物</option>
          <option value="battery">电池材料</option>
          <option value="polymer_battery">聚合物-电池交叉</option>
          <option value="other">其他</option>
        </select>
      </label>
      <button type="button" onClick={finish} className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90">
        完成设置
      </button>
    </div>
  );
}
