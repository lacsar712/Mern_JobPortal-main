import React, { useEffect, useState } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import useJobShortlist from "../hooks/useJobShortlist";
import useShortlistUrlSync from "../hooks/useShortlistUrlSync";
import CompareView from "./CompareView";

// 短名单面板：展示已加入职位摘要，支持勾选、对比、单项移除与一键清空。
// 面板 / 对比的开合状态由 URL 协议驱动（useShortlistUrlSync），业务规则来自 useJobShortlist。
// 本组件仅负责渲染与事件绑定，不自建并行状态机。
const ShortlistPanel = () => {
  const {
    items,
    count,
    usingFallback,
    removeItem,
    clearAll,
    validateCompareSelection,
    getItemsByIds,
    resolveShortlistIds,
  } = useJobShortlist();

  const {
    panelOpen,
    inCompare,
    compareIds,
    togglePanel,
    closePanel,
    enterCompare,
    exitCompare,
    removeFromCompare,
  } = useShortlistUrlSync(resolveShortlistIds, { manageUrl: true });

  // 勾选态为纯 UI 局部状态；进入对比后以 URL 的 compareIds 为准。
  const [selectedIds, setSelectedIds] = useState([]);

  // 深链恢复：当 URL 处于对比态时，用有效 compareIds 回填勾选。
  useEffect(() => {
    if (inCompare) {
      setSelectedIds(compareIds);
    }
  }, [inCompare, compareIds]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    // A4：数量必须在 2~4 之间
    const { ok, message } = validateCompareSelection(selectedIds);
    if (!ok) {
      toast.error(message);
      return;
    }
    enterCompare(selectedIds); // 写入 URL，视图切换由 inCompare 驱动
  };

  const handleClear = () => {
    if (window.confirm("确定要清空短名单吗？此操作不可恢复。")) {
      clearAll();
      setSelectedIds([]);
      closePanel();
    }
  };

  // 单项移除时同步清理勾选态
  const handleRemove = (id) => {
    removeItem(id);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  // 从对比结果一键移出：仅退出对比集合（保留在短名单），并同步勾选与 URL。
  // 剩余 < 2 时由 removeFromCompare 自动退回面板（非对比态）。
  const handleRemoveFromCompare = (id) => {
    removeFromCompare(id);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  // 对比视图数据源：按 URL 顺序取出有效条目（排序切换在 CompareView 内处理）
  const compareItems = getItemsByIds(compareIds);

  return (
    <div className="mb-6">
      {/* 面板入口 + 数量徽章 */}
      <button
        type="button"
        onClick={togglePanel}
        aria-label={`短名单，当前 ${count} 个职位`}
        className="inline-flex items-center gap-2 bg-blue text-white px-4 py-2 rounded font-semibold"
      >
        <span>短名单</span>
        <span
          className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1 rounded-full bg-white text-blue text-sm font-bold"
          aria-hidden="true"
        >
          {count}
        </span>
      </button>

      {panelOpen && (
        <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          {usingFallback && (
            <p className="mb-3 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
              本地存储不可用，当前为临时模式，刷新后短名单将丢失。
            </p>
          )}

          {inCompare ? (
            <CompareView
              items={compareItems}
              onBack={exitCompare}
              onRemove={handleRemoveFromCompare}
            />
          ) : (
            <>
              {count === 0 ? (
                <p className="text-primary/60 py-6 text-center">
                  还没有加入任何职位
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-primary">
                      我的短名单（{count}/8）
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCompare}
                        aria-label="对比所选职位"
                        className="text-sm bg-blue text-white px-3 py-1 rounded"
                      >
                        对比所选（{selectedIds.length}）
                      </button>
                      <button
                        type="button"
                        onClick={handleClear}
                        aria-label="清空短名单"
                        className="flex items-center gap-1 text-sm text-red-500 hover:underline"
                      >
                        <FiTrash2 /> 清空
                      </button>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 border border-gray-100 rounded p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          aria-label={`勾选 ${item.jobTitle}`}
                        />
                        {item.companyLogo ? (
                          <img
                            src={item.companyLogo}
                            alt={item.companyName}
                            className="w-10 h-10 object-contain"
                          />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-primary truncate">
                            {item.jobTitle}
                          </p>
                          <p className="text-sm text-primary/70 truncate">
                            {item.companyName} · {item.jobLocation}
                          </p>
                          <p className="text-xs text-primary/60">
                            {item.employmentType} · {item.minPrice}-
                            {item.maxPrice}k
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          aria-label={`移除 ${item.jobTitle}`}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ShortlistPanel;
