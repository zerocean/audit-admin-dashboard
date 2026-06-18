import { createContext, useContext, useState } from 'react';
import { PROJECTS } from '../mock/data';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(''); // '' = all

  return (
    <ProjectContext.Provider value={{ project, setProject, projects: PROJECTS }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}

// ─── Dashboard / Statistics 用的时间范围 + 日期选择器共享 hook ───

export const TIME_RANGES = [
  { key: '7d', label: '近7天', days: 7 },
  { key: '30d', label: '近30天', days: 30 },
  { key: '90d', label: '近90天', days: 90 },
  { key: 'today', label: '今天', days: 1 },
];

export function getRangeLabel(key) {
  return TIME_RANGES.find(r => r.key === key)?.label || key;
}

export function prepareChartData(dailyStats, timeRange) {
  const range = TIME_RANGES.find(r => r.key === timeRange);
  if (!range) return { filtered: dailyStats, aggregated: dailyStats, dimensionLabel: '天' };

  const nowDate = new Date();
  const cutoff = new Date(nowDate);
  cutoff.setDate(cutoff.getDate() - range.days);

  const filtered = dailyStats.filter(d => new Date(d.date) >= cutoff);

  if (range.days > 30) {
    // 聚合成周
    const weekMap = {};
    filtered.forEach(d => {
      const dObj = new Date(d.date);
      const weekStart = new Date(dObj);
      weekStart.setDate(dObj.getDate() - dObj.getDay());
      const wk = weekStart.toISOString().slice(0, 10);
      if (!weekMap[wk]) {
        weekMap[wk] = { label: wk, task_count: 0, total_tokens: 0, total_cost: 0,
          audit_tokens: 0, taxfill_tokens: 0, dashscope_tokens: 0, deepseek_tokens: 0,
          parser_tokens: 0, inspector_tokens: 0, audit_step_tokens: 0 };
      }
      const w = weekMap[wk];
      w.task_count += d.task_count;
      w.total_tokens += d.total_tokens;
      w.total_cost += d.total_cost;
      w.audit_tokens += d.audit_tokens || 0;
      w.taxfill_tokens += d.taxfill_tokens || 0;
      w.dashscope_tokens += d.dashscope_tokens || 0;
      w.deepseek_tokens += d.deepseek_tokens || 0;
      w.parser_tokens += d.parser_tokens || 0;
      w.inspector_tokens += d.inspector_tokens || 0;
      w.audit_step_tokens += d.audit_tokens || 0;
    });
    return { filtered, aggregated: Object.values(weekMap), dimensionLabel: '周' };
  }

  return {
    filtered,
    aggregated: filtered.map(d => ({
      ...d,
      label: d.date.slice(5),
      parser_tokens: d.parser_tokens || 0,
      inspector_tokens: d.inspector_tokens || 0,
      audit_step_tokens: d.audit_tokens || 0,
    })),
    dimensionLabel: '天',
  };
}

export function calcFilteredSummary(dailyStats, timeRange) {
  const { filtered } = prepareChartData(dailyStats, timeRange);
  const total_tokens = filtered.reduce((s, d) => s + d.total_tokens, 0);
  const total_cost = filtered.reduce((s, d) => s + d.total_cost, 0);
  return {
    task_count: filtered.reduce((s, d) => s + d.task_count, 0),
    total_tokens,
    total_cost,
    parser_tokens: filtered.reduce((s, d) => s + (d.parser_tokens || 0), 0),
    inspector_tokens: filtered.reduce((s, d) => s + (d.inspector_tokens || 0), 0),
    audit_tokens: filtered.reduce((s, d) => s + (d.audit_tokens || d.audit_step_tokens || 0), 0),
    dashscope_tokens: filtered.reduce((s, d) => s + (d.dashscope_tokens || 0), 0),
    deepseek_tokens: filtered.reduce((s, d) => s + (d.deepseek_tokens || 0), 0),
  };
}
