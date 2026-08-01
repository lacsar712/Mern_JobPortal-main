import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

// ————————————————————————————————————————————————
// PRD-SL-2026：职位短名单与对比 · 唯一业务逻辑模块
// 所有短名单/对比相关的读写、校验、派生计算都集中在此，
// 页面组件（Card / Home / ShortlistPanel / CompareView）只负责渲染与事件绑定。
// ————————————————————————————————————————————————

// §5.1 唯一数据源键名（必须严格为此值）
export const SHORTLIST_KEY = "jp_shortlist_v1";

// 业务上限与对比区间（§业务规则）
export const MAX_SHORTLIST = 8;
export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

// §10 字段字典 —— 单条 localStorage 结构必须严格包含以下键
export const ENTRY_FIELDS = [
  "id",
  "jobTitle",
  "companyName",
  "companyLogo",
  "jobLocation",
  "employmentType",
  "experienceLevel",
  "minPrice",
  "maxPrice",
  "salaryType",
  "postingDate",
  "description",
  "addedAt",
];

// 写入前的“字段齐套检查”所要求的源字段（§5.2）。
// companyLogo / description 允许为空串，其余关键字段必须存在且非空。
const REQUIRED_SOURCE_FIELDS = [
  "jobTitle",
  "companyName",
  "jobLocation",
  "employmentType",
  "experienceLevel",
  "minPrice",
  "maxPrice",
  "salaryType",
  "postingDate",
];

// ————————————————————————————————————————————————
// 模块级共享存储：保证所有使用本 hook 的组件（多个 Card、面板、对比视图）
// 共享同一份状态并即时同步，而无需引入 Context 或第三方状态库。
// ————————————————————————————————————————————————
let store = null; // 懒加载的短名单数组
let usingFallback = false; // §7.1 本地存储不可用时的内存降级标志
const listeners = new Set();

function ensureLoaded() {
  if (store !== null) return;
  try {
    const raw = localStorage.getItem(SHORTLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    store = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // localStorage 不可用（隐私模式 / 配额满等）：降级为内存态
    usingFallback = true;
    store = [];
  }
}

function persist() {
  if (usingFallback) return; // 内存降级模式下不落盘
  try {
    localStorage.setItem(SHORTLIST_KEY, JSON.stringify(store));
  } catch (e) {
    // 写入失败（配额满等）→ 切换为内存降级并提示（§7.1）
    if (!usingFallback) {
      usingFallback = true;
      toast.error("本地存储不可用");
    }
  }
}

function emit() {
  listeners.forEach((fn) => fn());
}

// ————————————————————————————————————————————————
// 纯函数：派生计算 / 校验（可独立测试）
// ————————————————————————————————————————————————

// 中位薪资：median = (Number(minPrice) + Number(maxPrice)) / 2
// 若 min/max 任一无法解析为数字，则记为 null。
export function computeMedian(minPrice, maxPrice) {
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return (min + max) / 2;
}

// 中位薪资展示（§6.3）：有值时 `{median}k`（保留 1 位小数），无值显示「—」。
export function formatMedian(median) {
  if (median === null || median === undefined) return "—";
  return `${median.toFixed(1)}k`;
}

// 相对最高中位薪资的差值展示：保留 1 位小数，正数补 + 号；null 显示「—」。
// 与 formatMedian 同源，供对比表与导出摘要复用，保证口径一致。
export function formatMedianDiff(diff) {
  if (diff === null || diff === undefined) return "—";
  const v = diff.toFixed(1);
  return diff > 0 ? `+${v}k` : `${v}k`;
}

// 判断源职位对象字段是否齐套（§5.2）
export function hasRequiredFields(job) {
  if (!job || typeof job !== "object") return false;
  return REQUIRED_SOURCE_FIELDS.every((key) => {
    const val = job[key];
    return val !== undefined && val !== null && String(val).trim() !== "";
  });
}

// §5.3 将 /all-jobs 的职位映射为短名单条目（id 取 _id 的字符串形式）
export function mapJobToEntry(job) {
  return {
    id: String(job._id ?? ""),
    jobTitle: job.jobTitle ?? "",
    companyName: job.companyName ?? "",
    companyLogo: job.companyLogo ?? "",
    jobLocation: job.jobLocation ?? "",
    employmentType: job.employmentType ?? "",
    experienceLevel: job.experienceLevel ?? "",
    minPrice: job.minPrice ?? "",
    maxPrice: job.maxPrice ?? "",
    salaryType: job.salaryType ?? "",
    postingDate: job.postingDate ?? "",
    description: job.description ?? "",
    addedAt: new Date().toISOString(),
  };
}

// addedAt 倒序（新的在前）
function byAddedAtDesc(a, b) {
  return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
}

// §4.3 对比排序：按 median 降序；median 为 null 的沉底，沉底组内按 addedAt 倒序。
export function sortForCompare(items) {
  return [...items].sort((a, b) => {
    const ma = computeMedian(a.minPrice, a.maxPrice);
    const mb = computeMedian(b.minPrice, b.maxPrice);
    if (ma === null && mb === null) return byAddedAtDesc(a, b);
    if (ma === null) return 1; // a 沉底
    if (mb === null) return -1; // b 沉底
    if (mb !== ma) return mb - ma; // 中位值降序
    return byAddedAtDesc(a, b);
  });
}

// 解析 postingDate → 时间戳；无法解析返回 null。
export function parsePostingDate(value) {
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

// 对比视图排序（仅影响呈现，不改写 localStorage）：
//   "median" 中位薪资降序（默认，复用 sortForCompare）
//   "date"   发布日期降序，无法解析沉底
//   "title"  职位名升序（中文本地化比较）
export function sortCompareItems(items, sortKey) {
  const arr = [...items];
  if (sortKey === "date") {
    return arr.sort((a, b) => {
      const da = parsePostingDate(a.postingDate);
      const db = parsePostingDate(b.postingDate);
      if (da === null && db === null) return byAddedAtDesc(a, b);
      if (da === null) return 1;
      if (db === null) return -1;
      if (db !== da) return db - da;
      return byAddedAtDesc(a, b);
    });
  }
  if (sortKey === "title") {
    return arr.sort((a, b) =>
      (a.jobTitle || "").localeCompare(b.jobTitle || "", "zh-Hans-CN")
    );
  }
  return sortForCompare(arr);
}

// 相对「当前对比集合中最高 median」的差值（保留 1 位小数）。
// 复用 computeMedian 的同一口径；median 为 null 的条目 diff 记为 null。
// 返回 { maxMedian, diffs: { [id]: number|null } }
export function computeMedianDiffs(items) {
  const medians = items.map((it) => computeMedian(it.minPrice, it.maxPrice));
  const valid = medians.filter((m) => m !== null);
  const maxMedian = valid.length ? Math.max(...valid) : null;
  const diffs = {};
  items.forEach((it, i) => {
    const m = medians[i];
    diffs[it.id] = m === null || maxMedian === null ? null : m - maxMedian;
  });
  return { maxMedian, diffs };
}

// 生成「职位对比摘要」纯文本（导出到剪贴板用）。
// median / 差值口径复用 computeMedian + computeMedianDiffs，与前两轮完全一致。
// items 顺序即摘要行顺序（由调用方传入当前对比呈现顺序）。
export function buildCompareSummary(items) {
  const { diffs } = computeMedianDiffs(items);
  const lines = [
    "【职位对比摘要】",
    `生成时间: ${new Date().toISOString()}`,
    `条目数: ${items.length}`,
    "----",
  ];
  items.forEach((item, i) => {
    const median = computeMedian(item.minPrice, item.maxPrice);
    lines.push(
      `${i + 1}. ${item.jobTitle} | ${item.companyName} | ${item.jobLocation} | ` +
        `${item.minPrice}-${item.maxPrice}k | 中位:${formatMedian(median)} | ` +
        `差值:${formatMedianDiff(diffs[item.id])}`
    );
  });
  return lines.join("\n");
}

// ————————————————————————————————————————————————
// React Hook：对外暴露状态与操作
// ————————————————————————————————————————————————
export function useJobShortlist() {
  ensureLoaded();
  const [items, setItems] = useState(store);

  useEffect(() => {
    const listener = () => setItems([...store]);
    listeners.add(listener);
    // 挂载时同步一次，避免在其他实例已改动后错过更新
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isShortlisted = useCallback(
    (id) => store.some((entry) => entry.id === String(id)),
    []
  );

  // 加入短名单，返回是否成功
  const addItem = useCallback((job) => {
    const id = String(job?._id ?? "");
    // 同一 _id 不可重复
    if (store.some((entry) => entry.id === id)) return false;
    // §5.2 字段齐套检查
    if (!hasRequiredFields(job)) {
      toast.error("职位数据不完整");
      return false;
    }
    // 上限校验：第 9 条不得写入
    if (store.length >= MAX_SHORTLIST) {
      toast.error(`短名单最多保存 ${MAX_SHORTLIST} 条，请先移除部分职位`);
      return false;
    }
    store = [...store, mapJobToEntry(job)];
    persist();
    emit();
    toast.success("已加入短名单");
    return true;
  }, []);

  const removeItem = useCallback((id) => {
    const key = String(id);
    if (!store.some((entry) => entry.id === key)) return;
    store = store.filter((entry) => entry.id !== key);
    persist();
    emit();
  }, []);

  // §4.1 Toggle：已加入 → 移出；未加入 → 加入
  const toggleItem = useCallback(
    (job) => {
      const id = String(job?._id ?? "");
      if (store.some((entry) => entry.id === id)) {
        store = store.filter((entry) => entry.id !== id);
        persist();
        emit();
        toast("已移出短名单");
        return false;
      }
      return addItem(job);
    },
    [addItem]
  );

  const clearAll = useCallback(() => {
    store = [];
    persist();
    emit();
  }, []);

  // 面板展示：按 addedAt 倒序（新加入在上）
  const sortedItems = [...items].sort(byAddedAtDesc);

  // 校验对比所选数量（§业务规则 / A4），返回 { ok, message }
  const validateCompareSelection = useCallback((ids) => {
    const count = ids.length;
    if (count < COMPARE_MIN) {
      return { ok: false, message: `请至少勾选 ${COMPARE_MIN} 个职位再进行对比` };
    }
    if (count > COMPARE_MAX) {
      return { ok: false, message: `最多可对比 ${COMPARE_MAX} 个职位，请减少勾选` };
    }
    return { ok: true, message: "" };
  }, []);

  // 依据勾选 id 取出条目并按对比规则排序
  const getCompareItems = useCallback(
    (ids) => {
      const set = new Set(ids.map(String));
      const picked = items.filter((entry) => set.has(entry.id));
      return sortForCompare(picked);
    },
    [items]
  );

  // 按给定 id 顺序取出条目（保持勾选顺序，不做对比排序）。
  // URL 深链恢复 / 对比视图数据源使用；排序切换由视图层用 sortCompareItems 处理。
  const getItemsByIds = useCallback(
    (ids) => {
      const map = new Map(items.map((entry) => [entry.id, entry]));
      return ids.map((id) => map.get(String(id))).filter(Boolean);
    },
    [items]
  );

  // 过滤出仍存在于短名单中的 id（保持原顺序），并报告失效 id。
  // 用于 URL compare query 恢复与失效 id 处理。返回 { valid, missing }
  const resolveShortlistIds = useCallback(
    (ids) => {
      const set = new Set(items.map((entry) => entry.id));
      const valid = [];
      const missing = [];
      ids.map(String).forEach((id) => {
        if (set.has(id)) valid.push(id);
        else missing.push(id);
      });
      return { valid, missing };
    },
    [items]
  );

  return {
    items: sortedItems,
    count: items.length,
    usingFallback,
    isShortlisted,
    addItem,
    removeItem,
    toggleItem,
    clearAll,
    validateCompareSelection,
    getCompareItems,
    getItemsByIds,
    resolveShortlistIds,
  };
}

export default useJobShortlist;
