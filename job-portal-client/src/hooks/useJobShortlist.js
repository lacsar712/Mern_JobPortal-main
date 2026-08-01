import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

export const SHORTLIST_STORAGE_KEY = "jp_shortlist_v1";
export const MAX_SHORTLIST_ITEMS = 8;

export const COMPARE_SORT_MEDIAN = "median";
export const COMPARE_SORT_DATE = "date";
export const COMPARE_SORT_TITLE = "title";

const SHORTLIST_EVENT = "jp-shortlist-update";
const JOB_FIELDS = [
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
const ENTRY_FIELDS = ["id", ...JOB_FIELDS, "addedAt"];

let memoryShortlist = [];
let storageNoticeShown = false;
let toastedCompareKey = null;

const checkStorageAvailability = () => {
  try {
    const testKey = "__jp_shortlist_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

let storageAvailable =
  typeof window !== "undefined" ? checkStorageAvailability() : false;

const parsePrice = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  if (normalized === "") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const calculateSalaryMedian = (item) => {
  const minPrice = parsePrice(item?.minPrice);
  const maxPrice = parsePrice(item?.maxPrice);

  if (minPrice === null || maxPrice === null) {
    return null;
  }

  return (minPrice + maxPrice) / 2;
};

export const formatSalaryMedian = (median) => {
  if (median === null || median === undefined || !Number.isFinite(median)) {
    return "—";
  }

  return `${median.toFixed(1)}k`;
};

export const formatSalaryDiff = (median, maxMedian) => {
  if (
    median === null ||
    median === undefined ||
    maxMedian === null ||
    maxMedian === undefined ||
    !Number.isFinite(median) ||
    !Number.isFinite(maxMedian)
  ) {
    return "—";
  }

  return `${(median - maxMedian).toFixed(1)}k`;
};

export const getMaxMedian = (items) => {
  let max = null;
  for (const item of items) {
    const median = calculateSalaryMedian(item);
    if (median !== null && (max === null || median > max)) {
      max = median;
    }
  }
  return max;
};

export const getSalaryRangeText = (item) => {
  const minPrice = item?.minPrice ? String(item.minPrice) : "—";
  const maxPrice = item?.maxPrice ? String(item.maxPrice) : "—";
  const salaryType = item?.salaryType ? ` · ${item.salaryType}` : "";

  return `${minPrice}-${maxPrice}k${salaryType}`;
};

const parsePostingDate = (value) => {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const sortCompareItemsBy = (items, sort = COMPARE_SORT_MEDIAN) => {
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (sort === COMPARE_SORT_DATE) {
      const dateA = parsePostingDate(a.postingDate);
      const dateB = parsePostingDate(b.postingDate);
      if (dateA === null && dateB === null) {
        return b.addedAt.localeCompare(a.addedAt);
      }
      if (dateA === null) {
        return 1;
      }
      if (dateB === null) {
        return -1;
      }
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return b.addedAt.localeCompare(a.addedAt);
    }

    if (sort === COMPARE_SORT_TITLE) {
      const titleCompare = (a.jobTitle || "").localeCompare(
        b.jobTitle || "",
        "zh-Hans-CN"
      );
      if (titleCompare !== 0) {
        return titleCompare;
      }
      return b.addedAt.localeCompare(a.addedAt);
    }

    const medianA = calculateSalaryMedian(a);
    const medianB = calculateSalaryMedian(b);

    if (medianA === null && medianB === null) {
      return b.addedAt.localeCompare(a.addedAt);
    }

    if (medianA === null) {
      return 1;
    }

    if (medianB === null) {
      return -1;
    }

    if (medianB !== medianA) {
      return medianB - medianA;
    }

    return b.addedAt.localeCompare(a.addedAt);
  });
  return sorted;
};

export const sortCompareItems = (items) =>
  sortCompareItemsBy(items, COMPARE_SORT_MEDIAN);

export const buildCompareSummary = (items) => {
  const sortedItems = Array.isArray(items) ? items : [];
  const maxMedian = getMaxMedian(sortedItems);
  const lines = [
    "【职位对比摘要】",
    `生成时间: ${new Date().toISOString()}`,
    `条目数: ${sortedItems.length}`,
    "----",
  ];

  sortedItems.forEach((item, index) => {
    const median = calculateSalaryMedian(item);
    const minPrice = item?.minPrice ? String(item.minPrice) : "—";
    const maxPrice = item?.maxPrice ? String(item.maxPrice) : "—";
    lines.push(
      `${index + 1}. ${item?.jobTitle || "—"} | ${
        item?.companyName || "—"
      } | ${item?.jobLocation || "—"} | ${minPrice}-${maxPrice}k | 中位:${formatSalaryMedian(
        median
      )} | 差值:${formatSalaryDiff(median, maxMedian)}`
    );
  });

  return lines.join("\n");
};

const getJobId = (job) => {
  const rawId = job?._id ?? job?.id;
  return rawId === null || rawId === undefined || rawId === ""
    ? ""
    : String(rawId);
};

const isValidJob = (job) => {
  if (!job || typeof job !== "object" || Array.isArray(job)) {
    return false;
  }

  const id = getJobId(job);
  if (!id) {
    return false;
  }

  return JOB_FIELDS.every((field) => field in job);
};

const isValidStoredItem = (item) => {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return false;
  }

  return ENTRY_FIELDS.every((field) => field in item) && Boolean(item.id);
};

const normalizeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const createEntry = (job, addedAt = new Date().toISOString()) => ({
  id: getJobId(job),
  jobTitle: normalizeString(job.jobTitle),
  companyName: normalizeString(job.companyName),
  companyLogo: normalizeString(job.companyLogo),
  jobLocation: normalizeString(job.jobLocation),
  employmentType: normalizeString(job.employmentType),
  experienceLevel: normalizeString(job.experienceLevel),
  minPrice: normalizeString(job.minPrice),
  maxPrice: normalizeString(job.maxPrice),
  salaryType: normalizeString(job.salaryType),
  postingDate: normalizeString(job.postingDate),
  description: normalizeString(job.description),
  addedAt,
});

const normalizeStoredItem = (item) =>
  createEntry(item, normalizeString(item.addedAt) || new Date().toISOString());

const sortByAddedAtDesc = (items) =>
  [...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt));

const loadItems = () => {
  if (!storageAvailable) {
    return sortByAddedAtDesc(memoryShortlist);
  }

  try {
    const rawValue = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (!rawValue) {
      memoryShortlist = [];
      return [];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      memoryShortlist = [];
      return [];
    }

    const validItems = parsed
      .filter(isValidStoredItem)
      .map(normalizeStoredItem);

    memoryShortlist = sortByAddedAtDesc(validItems);
    return memoryShortlist;
  } catch {
    memoryShortlist = [];
    try {
      window.localStorage.removeItem(SHORTLIST_STORAGE_KEY);
    } catch {
      storageAvailable = false;
      toast.error("本地存储不可用");
    }
    return [];
  }
};

const saveItems = (items) => {
  const sortedItems = sortByAddedAtDesc(items);
  memoryShortlist = sortedItems;

  if (storageAvailable) {
    try {
      window.localStorage.setItem(
        SHORTLIST_STORAGE_KEY,
        JSON.stringify(sortedItems)
      );
    } catch {
      storageAvailable = false;
      toast.error("本地存储不可用");
    }
  }

  window.dispatchEvent(new Event(SHORTLIST_EVENT));
  return sortedItems;
};

const parseCompareIds = (compareParam) => {
  if (!compareParam) {
    return [];
  }
  return compareParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
};

export const useJobShortlist = () => {
  const [items, setItems] = useState(() => loadItems());
  const [storageDegraded, setStorageDegraded] = useState(!storageAvailable);
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareSort, setCompareSort] = useState(COMPARE_SORT_MEDIAN);

  const [searchParams, setSearchParams] = useSearchParams();

  const shortlistParam = searchParams.get("shortlist");
  const compareParam = searchParams.get("compare");
  const urlCompareIds = useMemo(
    () => parseCompareIds(compareParam),
    [compareParam]
  );

  const syncShortlist = useCallback(() => {
    setStorageDegraded(!storageAvailable);
    setItems(loadItems());
  }, []);

  useEffect(() => {
    if (!storageAvailable && !storageNoticeShown) {
      storageNoticeShown = true;
      toast.error("本地存储不可用");
    }
  }, []);

  useEffect(() => {
    window.addEventListener(SHORTLIST_EVENT, syncShortlist);
    window.addEventListener("storage", syncShortlist);

    return () => {
      window.removeEventListener(SHORTLIST_EVENT, syncShortlist);
      window.removeEventListener("storage", syncShortlist);
    };
  }, [syncShortlist]);

  useEffect(() => {
    const availableIds = new Set(items.map((item) => item.id));
    setSelectedIds((previous) => previous.filter((id) => availableIds.has(id)));
  }, [items]);

  const shortlistedIds = useMemo(
    () => new Set(items.map((item) => item.id)),
    [items]
  );

  const availableCompareIds = useMemo(() => {
    const availableIds = new Set(items.map((item) => item.id));
    return urlCompareIds.filter((id) => availableIds.has(id));
  }, [urlCompareIds, items]);

  const isComparing = availableCompareIds.length >= 2;
  const isPanelOpen = shortlistParam === "1" && !isComparing;

  const compareIds = useMemo(() => {
    if (!isComparing) {
      return [];
    }
    return availableCompareIds.slice(0, 4);
  }, [availableCompareIds, isComparing]);

  const sortedCompareItems = useMemo(() => {
    if (compareIds.length === 0) {
      return [];
    }
    const matched = compareIds
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean);
    return sortCompareItemsBy(matched, compareSort);
  }, [compareIds, items, compareSort]);

  const maxMedian = useMemo(
    () => getMaxMedian(sortedCompareItems),
    [sortedCompareItems]
  );

  useEffect(() => {
    if (!compareParam) {
      toastedCompareKey = null;
      return;
    }

    const availableIds = new Set(items.map((item) => item.id));
    const invalidIds = urlCompareIds.filter((id) => !availableIds.has(id));
    const validIds = urlCompareIds.filter((id) => availableIds.has(id));
    const finalIds = validIds.length > 4 ? validIds.slice(0, 4) : validIds;

    if (invalidIds.length > 0 && toastedCompareKey !== compareParam) {
      toast.error("部分职位不在短名单中");
      toastedCompareKey = compareParam;
    }

    const needsCleanup =
      invalidIds.length > 0 ||
      validIds.length > 4 ||
      (finalIds.length > 0 && finalIds.length < 2);

    if (needsCleanup) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (finalIds.length >= 2) {
            next.set("compare", finalIds.join(","));
          } else {
            next.delete("compare");
          }
          return next;
        },
        { replace: true }
      );
    }

    if (finalIds.length >= 2) {
      setSelectedIds((previous) => {
        const same =
          previous.length === finalIds.length &&
          previous.every((id, index) => id === finalIds[index]);
        return same ? previous : finalIds;
      });
    }
  }, [compareParam, urlCompareIds, items, setSearchParams]);

  const isShortlisted = useCallback(
    (jobOrId) => {
      const id = typeof jobOrId === "string" ? jobOrId : getJobId(jobOrId);
      return shortlistedIds.has(id);
    },
    [shortlistedIds]
  );

  const isInCompare = useCallback(
    (jobOrId) => {
      const id = typeof jobOrId === "string" ? jobOrId : getJobId(jobOrId);
      return compareIds.includes(id);
    },
    [compareIds]
  );

  const toggleShortlist = useCallback(
    (job) => {
      if (!isValidJob(job)) {
        toast.error("职位数据不完整");
        return false;
      }

      const id = getJobId(job);
      const exists = shortlistedIds.has(id);

      if (exists) {
        saveItems(items.filter((item) => item.id !== id));
        setSelectedIds((previous) =>
          previous.filter((itemId) => itemId !== id)
        );
        toast.success("已移出短名单");
        return true;
      }

      if (items.length >= MAX_SHORTLIST_ITEMS) {
        toast.error("短名单最多保存 8 条职位");
        return false;
      }

      saveItems([createEntry(job), ...items]);
      toast.success("已加入短名单");
      return true;
    },
    [items, shortlistedIds]
  );

  const removeShortlist = useCallback(
    (id) => {
      const nextItems = items.filter((item) => item.id !== id);
      if (nextItems.length === items.length) {
        return false;
      }

      saveItems(nextItems);
      setSelectedIds((previous) =>
        previous.filter((selectedId) => selectedId !== id)
      );

      if (compareParam && urlCompareIds.includes(id)) {
        const remainingCompareIds = urlCompareIds.filter(
          (compareId) => compareId !== id
        );
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (remainingCompareIds.length >= 2) {
              next.set("compare", remainingCompareIds.join(","));
            } else {
              next.delete("compare");
            }
            return next;
          },
          { replace: true }
        );
      }

      return true;
    },
    [items, compareParam, urlCompareIds, setSearchParams]
  );

  const clearShortlist = useCallback(() => {
    saveItems([]);
    setSelectedIds([]);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("shortlist");
        next.delete("compare");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const toggleCompareSelection = useCallback((id) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id]
    );
  }, []);

  const clearCompareSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const openPanel = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("shortlist", "1");
        next.delete("compare");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const closePanel = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("shortlist");
        next.delete("compare");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const startCompare = useCallback(() => {
    const selectedItems = items.filter((item) => selectedIds.includes(item.id));

    if (selectedItems.length < 2) {
      toast.error("请至少选择 2 个职位进行对比");
      return [];
    }

    if (selectedItems.length > 4) {
      toast.error("最多只能选择 4 个职位进行对比");
      return [];
    }

    const orderedIds = selectedIds.filter((id) =>
      selectedItems.some((item) => item.id === id)
    );

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("shortlist", "1");
        next.set("compare", orderedIds.join(","));
        return next;
      },
      { replace: true }
    );

    return selectedItems;
  }, [items, selectedIds, setSearchParams]);

  const closeCompare = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("shortlist", "1");
        next.delete("compare");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const changeCompareSort = useCallback((sort) => {
    setCompareSort(sort);
  }, []);

  return {
    items,
    count: items.length,
    isFull: items.length >= MAX_SHORTLIST_ITEMS,
    storageDegraded,
    selectedIds,
    selectedCount: selectedIds.length,
    compareIds,
    compareItems: sortedCompareItems,
    sortedCompareItems,
    maxMedian,
    compareSort,
    isComparing,
    isPanelOpen,
    isShortlisted,
    isInCompare,
    toggleShortlist,
    removeShortlist,
    clearShortlist,
    toggleCompareSelection,
    clearCompareSelection,
    openPanel,
    closePanel,
    startCompare,
    closeCompare,
    changeCompareSort,
  };
};
