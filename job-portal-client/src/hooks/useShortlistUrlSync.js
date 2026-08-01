import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { COMPARE_MIN, COMPARE_MAX } from "./useJobShortlist";

// ————————————————————————————————————————————————
// 短名单 / 对比 的「URL 协议状态机」（深度链接）
//
// URL 字段映射（唯一真源为 localStorage；URL 只承载视图状态）：
//   ?shortlist=1                      面板打开
//   ?shortlist=1&compare=<id1>,<id2>  进入对比视图，逗号分隔，顺序=勾选顺序
//
// 关闭面板 → 清 shortlist + compare；退出对比 → 只清 compare。
// 本 hook 不重复实现任何短名单业务规则，只把 URL <-> 视图状态双向同步。
// resolveShortlistIds 负责失效 id 过滤（由 useJobShortlist 提供，保持单一口径）。
// ————————————————————————————————————————————————

const SHORTLIST_PARAM = "shortlist";
const COMPARE_PARAM = "compare";

function parseCompareParam(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// resolveShortlistIds: (ids) => { valid, missing }，由调用方（hook 消费方）注入，
// 以复用 useJobShortlist 中已有的短名单集合判断，避免另造一套口径。
// options.manageUrl：是否负责 URL 自净化（失效 id 清理 / 非法数量退出）。
//   仅面板（唯一 owner）应设为 true，避免多个 Card 实例重复写 URL。
export function useShortlistUrlSync(resolveShortlistIds, options = {}) {
  const { manageUrl = false } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  // 是否曾对失效 id 提示过，避免每次渲染重复 toast
  const missingToastRef = useRef("");

  const panelOpen =
    searchParams.get(SHORTLIST_PARAM) === "1" ||
    searchParams.has(COMPARE_PARAM);

  // 原始 compare id（可能含失效 id）
  const rawCompareIds = useMemo(
    () => parseCompareParam(searchParams.get(COMPARE_PARAM)),
    [searchParams]
  );

  const hasCompareParam = searchParams.has(COMPARE_PARAM);

  // 过滤失效 id（保持顺序）
  const { valid: compareIds, missing } = useMemo(
    () => resolveShortlistIds(rawCompareIds),
    [resolveShortlistIds, rawCompareIds]
  );

  const inCompare = hasCompareParam && compareIds.length >= COMPARE_MIN;

  // ——— URL 写操作 ———
  const openPanel = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(SHORTLIST_PARAM, "1");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const closePanel = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(SHORTLIST_PARAM);
        next.delete(COMPARE_PARAM);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const togglePanel = useCallback(() => {
    if (panelOpen) closePanel();
    else openPanel();
  }, [panelOpen, openPanel, closePanel]);

  // 进入对比：写入 shortlist=1 & compare=ids（数量校验由调用方完成）
  const enterCompare = useCallback(
    (ids) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(SHORTLIST_PARAM, "1");
          next.set(COMPARE_PARAM, ids.join(","));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const exitCompare = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(COMPARE_PARAM);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // 从对比集合移出单个 id：更新 compare query；
  // 若剩余有效项 < 2，自动退回面板（删除 compare，保留 shortlist=1）。
  const removeFromCompare = useCallback(
    (id) => {
      const remaining = compareIds.filter((x) => x !== String(id));
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(SHORTLIST_PARAM, "1");
          if (remaining.length >= COMPARE_MIN) {
            next.set(COMPARE_PARAM, remaining.join(","));
          } else {
            next.delete(COMPARE_PARAM);
          }
          return next;
        },
        { replace: true }
      );
    },
    [compareIds, setSearchParams]
  );

  // ——— URL 自净化：处理深链恢复时的失效 id / 非法数量 ———
  // 仅由 owner（面板）执行，避免多实例重复写 URL / 重复 toast。
  useEffect(() => {
    if (!manageUrl) return;
    if (!hasCompareParam) {
      missingToastRef.current = "";
      return;
    }

    // 汇总提示一次失效 id
    if (missing.length > 0) {
      const key = missing.join(",");
      if (missingToastRef.current !== key) {
        missingToastRef.current = key;
        toast.error("部分职位不在短名单中");
      }
    }

    // 失效 id 从 URL 清除；若有效数量不足或超限则退出对比（保留面板打开）
    const sanitized = compareIds.slice(0, COMPARE_MAX);
    const needCleanup =
      missing.length > 0 ||
      sanitized.length !== rawCompareIds.length ||
      sanitized.length < COMPARE_MIN;

    if (needCleanup) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(SHORTLIST_PARAM, "1");
          if (sanitized.length >= COMPARE_MIN) {
            next.set(COMPARE_PARAM, sanitized.join(","));
          } else {
            next.delete(COMPARE_PARAM);
          }
          return next;
        },
        { replace: true }
      );
    }
  }, [
    manageUrl,
    hasCompareParam,
    missing,
    compareIds,
    rawCompareIds,
    setSearchParams,
  ]);

  return {
    panelOpen,
    inCompare,
    compareIds, // 已过滤失效 id 的有效勾选（顺序保持）
    openPanel,
    closePanel,
    togglePanel,
    enterCompare,
    exitCompare,
    removeFromCompare,
  };
}

export default useShortlistUrlSync;
