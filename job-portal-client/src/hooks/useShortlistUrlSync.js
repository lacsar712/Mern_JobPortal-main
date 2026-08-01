import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useJobShortlist,
  resolveShortlistIds,
  getItemsByIds,
  validateCompareCount,
  removeJob,
  COMPARE_MIN,
  COMPARE_MAX,
} from "./useJobShortlist";

// ---------------------------------------------------------------------------
// URL 状态同步（深度链接）—— 短名单面板 / 对比视图
// 协议：
//   ?shortlist=1                     面板打开
//   ?shortlist=1&compare=<id1>,<id2> 对比视图（id 顺序 = 勾选顺序）
// 条目数据永远以 localStorage["jp_shortlist_v1"] 为准，URL 只存 id。
// ---------------------------------------------------------------------------

const parseCompareParam = (raw) =>
  raw
    ? raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : null;

/** 供列表卡片等只读场景使用：当前 URL compare 中的 id 列表（不做存在性校验） */
export function useCompareIds() {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("compare");
  return useMemo(() => parseCompareParam(raw) || [], [raw]);
}

/**
 * 面板 / 对比视图的 URL 驱动状态机：
 * - 打开/关闭面板、进入/退出对比都通过改写 query 完成（replace，不污染历史）；
 * - 带 query 直接进入首页时恢复面板 / 对比视图与勾选；
 * - compare 中失效 id 被忽略，并 toast 一次「部分职位不在短名单中」；
 * - 解析后的有效 id 数量不在 2～4 时回退为仅面板态并清理 compare 参数。
 */
export function useShortlistUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { shortlist } = useJobShortlist();
  const [selectedIds, setSelectedIds] = useState([]);
  const toastedSignatureRef = useRef(null);

  const shortlistOpen = searchParams.get("shortlist") === "1";
  const compareRaw = searchParams.get("compare");
  const compareIds = useMemo(() => parseCompareParam(compareRaw), [compareRaw]);

  const updateParams = (mutate) => {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    setSearchParams(next, { replace: true });
  };

  const openPanel = () => updateParams((params) => params.set("shortlist", "1"));

  const closePanel = () =>
    updateParams((params) => {
      params.delete("shortlist");
      params.delete("compare");
    });

  const exitCompare = () => updateParams((params) => params.delete("compare"));

  /** 面板「对比所选」入口：先做 2～4 数量校验，失败 toast 且不写 URL */
  const enterCompare = (ids) => {
    const error = validateCompareCount(ids.length);
    if (error) {
      toast.error(error);
      return;
    }
    updateParams((params) => {
      params.set("shortlist", "1");
      params.set("compare", ids.join(","));
    });
  };

  /**
   * 从对比结果一键移出：同步从短名单删除该 id。
   * 剩余可对比项 ≥ 2 时更新 compare query 为剩余 id；< 2 时清理 compare
   * 自动退回短名单面板态。
   */
  const removeFromCompare = (id) => {
    if (!compareIds) return;
    const remaining = compareIds.filter((compareId) => compareId !== String(id));
    removeJob(id);
    // 勾选状态同步为剩余 id（回退面板态时避免残留已移除的勾选）
    setSelectedIds(remaining);
    if (remaining.length >= COMPARE_MIN && remaining.length <= COMPARE_MAX) {
      updateParams((params) => params.set("compare", remaining.join(",")));
    } else {
      exitCompare();
    }
  };

  // 按当前短名单解析 compare id（found 保持 URL 中的勾选顺序）
  const resolved = useMemo(
    () => (compareIds ? resolveShortlistIds(compareIds) : { found: [], missing: [] }),
    [compareIds, shortlist]
  );

  // 从 URL 恢复勾选；失效 id 汇总提示一次；数量不合法时清理 compare 回退面板态
  useEffect(() => {
    if (!compareIds) {
      toastedSignatureRef.current = null;
      return;
    }
    if (resolved.missing.length > 0 && toastedSignatureRef.current !== compareRaw) {
      toastedSignatureRef.current = compareRaw;
      toast.error("部分职位不在短名单中");
    }
    setSelectedIds((prev) =>
      prev.length === resolved.found.length && prev.every((id, i) => id === resolved.found[i])
        ? prev
        : resolved.found
    );
    if (resolved.found.length < COMPARE_MIN || resolved.found.length > COMPARE_MAX) {
      exitCompare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareRaw, resolved]);

  const compareActive =
    Boolean(compareIds) &&
    resolved.found.length >= COMPARE_MIN &&
    resolved.found.length <= COMPARE_MAX;

  // 对比条目按 URL 勾选顺序传入，呈现层排序由 CompareView 负责
  const compareItems = compareActive ? getItemsByIds(resolved.found) : null;

  // 对比态下保持 shortlist=1，但面板隐藏在对比叠加层之后
  const panelOpen = shortlistOpen && !compareActive;

  return {
    panelOpen,
    compareActive,
    compareItems,
    selectedIds,
    setSelectedIds,
    openPanel,
    closePanel,
    enterCompare,
    exitCompare,
    removeFromCompare,
  };
}
