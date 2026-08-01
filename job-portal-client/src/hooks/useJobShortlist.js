import { useSyncExternalStore } from "react";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// 职位短名单（Job Shortlist）业务逻辑模块 —— PRD-SL-2026
// 唯一数据源：localStorage["jp_shortlist_v1"]（JSON 数组）
// 页面组件只负责渲染与事件绑定，所有读写 / 校验 / 派生计算集中在此模块。
// ---------------------------------------------------------------------------

export const SHORTLIST_STORAGE_KEY = "jp_shortlist_v1";
export const SHORTLIST_MAX = 8;
export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

// localStorage 单条结构必须严格包含以下字段（§5 / §10）
export const SHORTLIST_FIELDS = [
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

// 从 /all-jobs 职位对象映射到短名单条目时需要的原始字段（§5.2 齐套检查）
const REQUIRED_JOB_FIELDS = [
  "_id",
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
];

// ---------------------------------------------------------------------------
// 模块级 store：跨组件共享同一份短名单状态（Card / 面板 / 详情页保持一致）
// ---------------------------------------------------------------------------
let storageAvailable = true;
let snapshot = { items: [], tempMode: false };
const listeners = new Set();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

const setState = (items, tempMode = snapshot.tempMode) => {
  // 展示顺序固定为 addedAt 倒序（新加入的在上）
  const sorted = [...items].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  snapshot = { items: sorted, tempMode };
  emitChange();
};

// ---------------------------------------------------------------------------
// 校验与映射
// ---------------------------------------------------------------------------

/** 检查短名单条目 schema 字段是否齐套（§5.2） */
export function isValidShortlistItem(item) {
  if (!item || typeof item !== "object") return false;
  if (typeof item.id !== "string" || item.id === "") return false;
  return SHORTLIST_FIELDS.every((field) => item[field] !== undefined && item[field] !== null);
}

/**
 * 将 /all-jobs 职位对象映射为短名单条目（§5.3：id 取 _id 字符串形式）。
 * 缺字段时返回 null，调用方应 toast「职位数据不完整」并拒绝写入。
 */
export function toShortlistItem(job) {
  if (!job || typeof job !== "object") return null;
  const missing = REQUIRED_JOB_FIELDS.some((field) => job[field] === undefined || job[field] === null);
  if (missing) return null;

  const item = {
    id: String(job._id),
    jobTitle: String(job.jobTitle),
    companyName: String(job.companyName),
    companyLogo: String(job.companyLogo),
    jobLocation: String(job.jobLocation),
    employmentType: String(job.employmentType),
    experienceLevel: String(job.experienceLevel),
    minPrice: String(job.minPrice),
    maxPrice: String(job.maxPrice),
    salaryType: String(job.salaryType),
    postingDate: String(job.postingDate),
    description: String(job.description),
    addedAt: new Date().toISOString(),
  };
  return isValidShortlistItem(item) ? item : null;
}

// ---------------------------------------------------------------------------
// 派生计算：中位薪资（median）
// ---------------------------------------------------------------------------

/**
 * 中位薪资：median = (Number(minPrice) + Number(maxPrice)) / 2。
 * min/max 无法解析为数字时返回 null（对比表中显示「—」）。
 */
export function computeMedian(item) {
  if (!item) return null;
  const min = Number(item.minPrice);
  const max = Number(item.maxPrice);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return (min + max) / 2;
}

/** 中位薪资展示格式：有值时 `{median}k`（保留 1 位小数），无值显示「—」（§6.3） */
export function formatMedian(item) {
  const median = computeMedian(item);
  return median === null ? "—" : `${median.toFixed(1)}k`;
}

/** 原始薪资区间文案（min/max 缺失时显示「—」） */
export function formatSalaryRange(item) {
  if (!item || item.minPrice === "" || item.maxPrice === "") return "—";
  return `${item.minPrice}-${item.maxPrice}k`;
}

/**
 * 对比排序（§4.3）：按 median 降序；median 为 null 的条目沉底，
 * 沉底组内按 addedAt 倒序。
 */
export function sortForCompare(items) {
  return [...items].sort((a, b) => {
    const medianA = computeMedian(a);
    const medianB = computeMedian(b);
    if (medianA === null && medianB === null) {
      return a.addedAt < b.addedAt ? 1 : -1;
    }
    if (medianA === null) return 1;
    if (medianB === null) return -1;
    return medianB - medianA;
  });
}

/** 对比视图可选排序模式（仅影响呈现，不改写 localStorage 的 addedAt 顺序） */
export const COMPARE_SORT_MODES = { MEDIAN: "median", DATE: "date", TITLE: "title" };

/** 解析 postingDate 为时间戳；无法解析返回 null（排序时沉底） */
export function parsePostingDate(item) {
  const time = Date.parse(item?.postingDate);
  return Number.isNaN(time) ? null : time;
}

/**
 * 对比视图统一排序入口：
 * - median：中位薪资降序，null 沉底（§4.3 默认）；
 * - date：发布日期降序，无法解析的沉底；
 * - title：职位名按中文 locale 升序。
 */
export function sortCompareItems(items, mode = COMPARE_SORT_MODES.MEDIAN) {
  if (mode === COMPARE_SORT_MODES.DATE) {
    return [...items].sort((a, b) => {
      const dateA = parsePostingDate(a);
      const dateB = parsePostingDate(b);
      if (dateA === null && dateB === null) return a.addedAt < b.addedAt ? 1 : -1;
      if (dateA === null) return 1;
      if (dateB === null) return -1;
      return dateB - dateA;
    });
  }
  if (mode === COMPARE_SORT_MODES.TITLE) {
    return [...items].sort((a, b) =>
      String(a.jobTitle).localeCompare(String(b.jobTitle), "zh-Hans-CN")
    );
  }
  return sortForCompare(items);
}

/** 当前对比集合中的最大 median（全部无法解析时为 null） */
export function getMaxMedian(items) {
  return items.reduce((max, item) => {
    const median = computeMedian(item);
    if (median === null) return max;
    return max === null ? median : Math.max(max, median);
  }, null);
}

/**
 * 「相对最高中位薪资的差值」：median - maxMedian（保留 1 位小数）。
 * 复用 computeMedian 同一套口径；median 为 null 时显示「—」。
 */
export function formatMedianDiff(item, items) {
  const median = computeMedian(item);
  const maxMedian = getMaxMedian(items);
  if (median === null || maxMedian === null) return "—";
  return `${(median - maxMedian).toFixed(1)}k`;
}

/**
 * 生成「导出对比摘要」纯文本（median / 差值复用本模块同一口径）。
 * 条目顺序由调用方（对比视图当前排序）决定。
 */
export function buildCompareSummaryText(items) {
  const lines = items.map(
    (item, index) =>
      `${index + 1}. ${item.jobTitle} | ${item.companyName} | ${item.jobLocation} | ` +
      `${item.minPrice}-${item.maxPrice}k | 中位:${formatMedian(item)} | 差值:${formatMedianDiff(item, items)}`
  );
  return [
    "【职位对比摘要】",
    `生成时间: ${new Date().toISOString()}`,
    `条目数: ${items.length}`,
    "----",
    ...lines,
  ].join("\n");
}

/** 发起对比前的数量校验（2～4 含边界），返回错误文案或 null */
export function validateCompareCount(count) {
  if (count < COMPARE_MIN) return `请至少勾选 ${COMPARE_MIN} 个职位再发起对比`;
  if (count > COMPARE_MAX) return `最多只能同时对比 ${COMPARE_MAX} 个职位`;
  return null;
}

// ---------------------------------------------------------------------------
// localStorage 读写（§7.1：不可用时降级为会话内存 + 临时模式提示）
// ---------------------------------------------------------------------------
const enterTempMode = () => {
  storageAvailable = false;
  setState(snapshot.items, true);
  toast.error("本地存储不可用");
};

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidShortlistItem);
  } catch {
    enterTempMode();
    return [];
  }
}

function persist(items) {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    enterTempMode();
  }
}

// 模块加载时读取一次
setState(loadFromStorage(), !storageAvailable);

// ---------------------------------------------------------------------------
// 变更操作
// ---------------------------------------------------------------------------

export function isInShortlist(id) {
  return snapshot.items.some((item) => item.id === String(id));
}

/**
 * 加入 / 移出短名单开关：
 * - 已存在同一 id → 移出；
 * - 已达 8 条上限 → toast 提示且不写入；
 * - 字段不齐 → toast「职位数据不完整」且不写入。
 */
export function toggleJob(job) {
  const id = job && job._id !== undefined && job._id !== null ? String(job._id) : null;
  if (!id) {
    toast.error("职位数据不完整");
    return false;
  }

  if (isInShortlist(id)) {
    removeJob(id);
    return true;
  }

  if (snapshot.items.length >= SHORTLIST_MAX) {
    toast.error(`短名单最多保存 ${SHORTLIST_MAX} 个职位，请先移除其他职位`);
    return false;
  }

  const item = toShortlistItem(job);
  if (!item) {
    toast.error("职位数据不完整");
    return false;
  }

  const next = [item, ...snapshot.items];
  persist(next);
  setState(next);
  toast.success("已加入短名单");
  return true;
}

export function removeJob(id) {
  const next = snapshot.items.filter((item) => item.id !== String(id));
  persist(next);
  setState(next);
  toast.success("已移出短名单");
}

/** 清空短名单（含 localStorage 对应键），调用方负责二次确认 */
export function clearShortlist() {
  persist([]);
  setState([]);
  toast.success("短名单已清空");
}

/**
 * 将一组 id 与当前短名单对照：found 保持入参顺序，missing 为 localStorage 中
 * 找不到的 id（用于 URL 恢复时忽略失效 id 并汇总提示一次）。
 */
export function resolveShortlistIds(ids) {
  const existing = new Set(snapshot.items.map((item) => item.id));
  const found = [];
  const missing = [];
  ids.forEach((id) => {
    (existing.has(String(id)) ? found : missing).push(String(id));
  });
  return { found, missing };
}

/** 按给定 id 顺序取出短名单条目（忽略不存在的 id） */
export function getItemsByIds(ids) {
  const byId = new Map(snapshot.items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
}

// ---------------------------------------------------------------------------
// React Hook：订阅共享 store
// ---------------------------------------------------------------------------
export function useJobShortlist() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return {
    shortlist: state.items,
    count: state.items.length,
    tempMode: state.tempMode,
    isInShortlist,
    toggleJob,
    removeJob,
    clearShortlist,
  };
}
