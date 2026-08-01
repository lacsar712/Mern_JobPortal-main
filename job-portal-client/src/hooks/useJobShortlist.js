import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const STORAGE_KEY = "jp_shortlist_v1";
const MAX_ITEMS = 8;

const SCHEMA_FIELDS = [
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
];

const readStorage = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ok: false, data: [] };
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ok: true, data: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { ok: true, data: [] };
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, data: [] };
  }
};

const writeStorage = (list) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
};

const isValidString = (value) => typeof value === "string" && value.trim().length > 0;

const toShortlistEntry = (job) => {
  if (!job || typeof job !== "object") return null;
  const id = job._id ?? job.id;
  const entry = {
    id: id != null ? String(id) : "",
    jobTitle: job.jobTitle != null ? String(job.jobTitle) : "",
    companyName: job.companyName != null ? String(job.companyName) : "",
    companyLogo: job.companyLogo != null ? String(job.companyLogo) : "",
    jobLocation: job.jobLocation != null ? String(job.jobLocation) : "",
    employmentType: job.employmentType != null ? String(job.employmentType) : "",
    experienceLevel: job.experienceLevel != null ? String(job.experienceLevel) : "",
    minPrice: job.minPrice != null ? String(job.minPrice) : "",
    maxPrice: job.maxPrice != null ? String(job.maxPrice) : "",
    salaryType: job.salaryType != null ? String(job.salaryType) : "",
    postingDate: job.postingDate != null ? String(job.postingDate) : "",
    description: job.description != null ? String(job.description) : "",
    addedAt: new Date().toISOString(),
  };
  return entry;
};

const isCompleteEntry = (entry) =>
  SCHEMA_FIELDS.every((field) => isValidString(entry[field]));

export const calcMedian = (minPrice, maxPrice) => {
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }
  return (min + max) / 2;
};

export const formatMedian = (median) => {
  if (median == null || !Number.isFinite(median)) return "—";
  return `${median.toFixed(1)}k`;
};

export const sortByMedian = (entries) => {
  return [...entries].sort((a, b) => {
    const ma = calcMedian(a.minPrice, a.maxPrice);
    const mb = calcMedian(b.minPrice, b.maxPrice);

    if (ma == null && mb == null) {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
    if (ma == null) return 1;
    if (mb == null) return -1;
    if (mb !== ma) return mb - ma;
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });
};

export const parsePostingDate = (postingDate) => {
  if (postingDate == null) return null;
  const ts = new Date(postingDate).getTime();
  return Number.isFinite(ts) ? ts : null;
};

export const sortByPostingDate = (entries) => {
  return [...entries].sort((a, b) => {
    const ta = parsePostingDate(a.postingDate);
    const tb = parsePostingDate(b.postingDate);
    if (ta == null && tb == null) {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
    if (ta == null) return 1;
    if (tb == null) return -1;
    if (tb !== ta) return tb - ta;
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });
};

export const sortByJobTitle = (entries) => {
  return [...entries].sort((a, b) => {
    const cmp = (a.jobTitle || "").localeCompare(b.jobTitle || "", "zh-Hans-CN");
    if (cmp !== 0) return cmp;
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });
};

export const COMPARE_SORTS = {
  median: { label: "按中位薪资", sort: sortByMedian },
  postingDate: { label: "按发布日期", sort: sortByPostingDate },
  jobTitle: { label: "按职位名", sort: sortByJobTitle },
};

export const sortCompareEntries = (entries, mode) => {
  const sorter = COMPARE_SORTS[mode]?.sort || sortByMedian;
  return sorter(entries);
};

export const calcMaxMedian = (entries) => {
  const medians = entries
    .map((entry) => calcMedian(entry.minPrice, entry.maxPrice))
    .filter((value) => value != null && Number.isFinite(value));
  return medians.length ? Math.max(...medians) : null;
};

export const formatMedianDiff = (diff) => {
  if (diff == null || !Number.isFinite(diff)) return "—";
  if (diff === 0) return "0.0k";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}k`;
};

export const buildCompareSummary = (entries) => {
  const list = Array.isArray(entries) ? entries : [];
  const maxMedian = calcMaxMedian(list);
  const lines = list.map((entry, index) => {
    const median = calcMedian(entry.minPrice, entry.maxPrice);
    const delta =
      median != null && maxMedian != null ? median - maxMedian : null;
    return `${index + 1}. ${entry.jobTitle || ""} | ${entry.companyName || ""} | ${
      entry.jobLocation || ""
    } | ${entry.minPrice || ""}-${entry.maxPrice || ""}k | 中位:${formatMedian(
      median
    )} | 差值:${formatMedianDiff(delta)}`;
  });

  return [
    "【职位对比摘要】",
    `生成时间: ${new Date().toISOString()}`,
    `条目数: ${list.length}`,
    "----",
    ...lines,
  ].join("\n");
};

export const useJobShortlist = () => {
  const [items, setItems] = useState([]);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const { ok, data } = readStorage();
    setStorageAvailable(ok);
    const valid = data.filter((entry) =>
      SCHEMA_FIELDS.every(
        (field) =>
          entry &&
          Object.prototype.hasOwnProperty.call(entry, field) &&
          isValidString(entry[field])
      )
    );
    setItems(valid);
  }, []);

  const persist = useCallback(
    (next) => {
      setItems(next);
      const wrote = writeStorage(next);
      if (!wrote && storageAvailable) {
        setStorageAvailable(false);
        toast.error("本地存储不可用");
      }
      return wrote;
    },
    [storageAvailable]
  );

  const has = useCallback(
    (id) => items.some((entry) => entry.id === String(id)),
    [items]
  );

  const toggle = useCallback(
    (job) => {
      const entry = toShortlistEntry(job);
      if (!entry || !isValidString(entry.id)) {
        toast.error("职位数据不完整");
        return { added: false };
      }
      if (!isCompleteEntry(entry)) {
        toast.error("职位数据不完整");
        return { added: false };
      }

      if (items.some((item) => item.id === entry.id)) {
        const next = items.filter((item) => item.id !== entry.id);
        persist(next);
        return { added: false };
      }

      if (items.length >= MAX_ITEMS) {
        toast.error(`短名单最多保存 ${MAX_ITEMS} 条，请先移除部分职位`);
        return { added: false };
      }

      const next = [entry, ...items];
      persist(next);
      return { added: true };
    },
    [items, persist]
  );

  const remove = useCallback(
    (id) => {
      const next = items.filter((item) => item.id !== String(id));
      persist(next);
    },
    [items, persist]
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const count = items.length;

  const compareList = useCallback(
    (selectedIds) => {
      if (!Array.isArray(selectedIds)) return [];
      const selected = items.filter((item) =>
        selectedIds.map(String).includes(item.id)
      );
      return sortByMedian(selected);
    },
    [items]
  );

  const getByIds = useCallback(
    (ids) => {
      if (!Array.isArray(ids)) return { found: [], missing: [] };
      const normalized = ids.map((id) => String(id));
      const byId = new Map(items.map((item) => [item.id, item]));
      const found = [];
      const missing = [];
      normalized.forEach((id) => {
        if (byId.has(id)) {
          found.push(byId.get(id));
        } else {
          missing.push(id);
        }
      });
      return { found, missing };
    },
    [items]
  );

  const validateCompareSelection = useCallback(
    (selectedIds) => {
      const total = Array.isArray(selectedIds) ? selectedIds.length : 0;
      if (total < 2) {
        toast.error("请至少勾选 2 个职位再进行对比");
        return false;
      }
      if (total > 4) {
        toast.error("最多只能对比 4 个职位，请减少勾选数量");
        return false;
      }
      return true;
    },
    []
  );

  const isFull = count >= MAX_ITEMS;

  const sortedByAdded = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      ),
    [items]
  );

  return {
    items: sortedByAdded,
    count,
    isFull,
    storageAvailable,
    maxItems: MAX_ITEMS,
    storageKey: STORAGE_KEY,
    has,
    toggle,
    remove,
    clear,
    compareList,
    getByIds,
    validateCompareSelection,
    calcMedian,
    formatMedian,
  };
};

export default useJobShortlist;
