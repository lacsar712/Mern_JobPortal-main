import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Banner from "../components/Banner";
import Sidebar from "../Sidebar/Sidebar";
import Jobs from "./Jobs";
import Card from "../components/Card";
import Newsletter from "../components/Newsletter";
import ShortlistPanel from "../components/ShortlistPanel";
import CompareView from "../components/CompareView";
import toast from "react-hot-toast";
import { FiBookmark } from "react-icons/fi";
import { useJobShortlist } from "../hooks/useJobShortlist";

const parseCompareIds = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
};

const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [searchParams, setSearchParams] = useSearchParams();

  // Shortlist business logic (localStorage, validation, median, sorting)
  const shortlist = useJobShortlist();

  const panelOpen = searchParams.get("shortlist") === "1";
  const compareParam = searchParams.get("compare") || "";
  const compareIds = useMemo(() => parseCompareIds(compareParam), [compareParam]);

  // Track whether the initial deep-link restore has run, to avoid repeat toasts
  const restoredRef = useRef(false);

  // ----------- Jobs fetch -----------
  useEffect(() => {
    setIsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/all-jobs`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("职位加载失败，请稍后重试。");
        setIsLoading(false);
      });
  }, []);

  // ----------- Handle Filter Changes -----------
  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
    setCurrentPage(1);
  };

  const handleChange = (event) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handleClick = (event) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  // ----------- Filtering Logic -----------
  const getFilteredJobs = () => {
    let filteredJobs = jobs;

    if (query) {
      filteredJobs = filteredJobs.filter(
        (job) => job.jobTitle.toLowerCase().indexOf(query.toLowerCase()) !== -1
      );
    }

    if (location) {
      filteredJobs = filteredJobs.filter(
        (job) => job.jobLocation.toLowerCase().indexOf(location.toLowerCase()) !== -1
      );
    }

    if (selectedCategory) {
      filteredJobs = filteredJobs.filter(
        ({
          jobLocation,
          salaryType,
          experienceLevel,
          maxPrice,
          postingDate,
          employmentType,
        }) => {
          const isLocationMatch = jobLocation?.toLowerCase() === selectedCategory.toLowerCase();
          const isSalaryTypeMatch = salaryType?.toLowerCase() === selectedCategory.toLowerCase();
          const isExperienceMatch = experienceLevel?.toLowerCase() === selectedCategory.toLowerCase();
          const isEmploymentMatch = employmentType?.toLowerCase() === selectedCategory.toLowerCase();

          const isNumericalSelection = !isNaN(selectedCategory) && !selectedCategory.includes("-");
          const isSalaryRangeMatch = isNumericalSelection && parseInt(maxPrice) <= parseInt(selectedCategory);

          const isDateMatch = postingDate >= selectedCategory;

          return (
            isLocationMatch ||
            isSalaryTypeMatch ||
            isExperienceMatch ||
            isEmploymentMatch ||
            isSalaryRangeMatch ||
            isDateMatch
          );
        }
      );
    }

    return filteredJobs;
  };

  const filteredJobs = getFilteredJobs();

  // ----------- Pagination Logic -----------
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // ----------- URL helpers -----------
  const updateUrl = ({ shortlist: nextShortlist, compare: nextCompare }) => {
    const params = new URLSearchParams(searchParams);
    if (nextShortlist) {
      params.set("shortlist", "1");
    } else {
      params.delete("shortlist");
    }
    if (nextCompare && nextCompare.length) {
      params.set("compare", nextCompare.join(","));
    } else {
      params.delete("compare");
    }
    setSearchParams(params, { replace: true });
  };

  // ----------- Shortlist handlers -----------
  const handleToggleShortlist = (job) => {
    const result = shortlist.toggle(job);
    if (result.added) {
      toast.success("已加入短名单");
    }
  };

  const openPanel = () => updateUrl({ shortlist: true, compare: compareIds });
  const closePanel = () => updateUrl({ shortlist: false, compare: null });

  const startCompare = (selectedIds) => {
    if (!shortlist.validateCompareSelection(selectedIds)) return;
    const { missing } = shortlist.getByIds(selectedIds);
    if (missing.length) {
      toast.error("部分职位不在短名单中");
    }
    updateUrl({ shortlist: true, compare: selectedIds });
  };

  const closeCompare = () => updateUrl({ shortlist: panelOpen, compare: null });
  const backToPanel = () => updateUrl({ shortlist: true, compare: null });

  const handleClear = () => {
    shortlist.clear();
    toast.success("短名单已清空");
    updateUrl({ shortlist: panelOpen, compare: null });
  };

  const handleRemoveFromList = (id) => {
    shortlist.remove(id);
  };

  const handleRemoveFromCompare = (id) => {
    shortlist.remove(id);
  };

  // Derive compare jobs from URL ids in the order they appear in the URL
  const compareJobs = useMemo(() => {
    if (!compareIds.length) return null;
    const { found } = shortlist.getByIds(compareIds);
    if (!found.length) return null;
    return found;
  }, [compareIds, shortlist]);

  const isComparing = compareJobs != null;

  // Panel checkbox selection: when in compare mode, reflect URL ids; otherwise local
  const [panelSelected, setPanelSelected] = useState([]);
  const selectedIds = isComparing ? compareIds : panelSelected;

  const handleToggleSelect = (id) => {
    setPanelSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompareClick = () => startCompare(panelSelected);

  // When a compared item is removed from shortlist, prune it from the URL
  useEffect(() => {
    if (!isComparing) return;
    const { missing } = shortlist.getByIds(compareIds);
    if (missing.length > 0) {
      const remaining = compareIds.filter((id) => !missing.includes(id));
      if (remaining.length >= 2) {
        updateUrl({ shortlist: true, compare: remaining });
      } else {
        updateUrl({ shortlist: true, compare: null });
        if (remaining.length < 2) {
          toast.error("对比需至少 2 个职位，已返回短名单");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortlist.items, isComparing]);

  // ----------- Deep-link restore on first load -----------
  useEffect(() => {
    if (restoredRef.current) return;
    if (compareIds.length === 0) {
      // No compare query: nothing to restore beyond the panel flag (already read from URL).
      if (panelOpen) restoredRef.current = true;
      return;
    }
    restoredRef.current = true;

    const { found, missing } = shortlist.getByIds(compareIds);
    if (missing.length > 0) {
      toast.error("部分职位不在短名单中");
    }
    if (found.length >= 2 && found.length <= 4) {
      setPanelSelected(found.map((item) => item.id));
      return;
    }
    if (found.length > 4) {
      toast.error("最多只能对比 4 个职位，请减少勾选数量");
    } else if (found.length < 2) {
      toast.error("请至少勾选 2 个职位再进行对比");
    }
    updateUrl({ shortlist: true, compare: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortlist.items]);

  // Set of ids currently being compared (for Card highlighting)
  const comparingIdSet = useMemo(
    () => new Set(compareJobs ? compareJobs.map((j) => j.id) : []),
    [compareJobs]
  );

  // Map result to Card components
  const result = useMemo(
    () =>
      paginatedJobs.map((data) => {
        const shortlisted = shortlist.has(data._id);
        const comparing = comparingIdSet.has(String(data._id));
        return (
          <Card
            key={data._id}
            data={data}
            isShortlisted={shortlisted}
            isComparing={comparing}
            onToggleShortlist={handleToggleShortlist}
          />
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginatedJobs, shortlist, comparingIdSet]
  );

  return (
    <div>
      <Banner
        query={query}
        handleInputChange={handleInputChange}
        location={location}
        handleLocationChange={handleLocationChange}
      />

      {/* main content */}
      <div className="bg-[#FAFAFA] md:grid grid-cols-4 gap-8 lg:px-24 px-4 py-12">
        <div className="bg-white p-4 rounded">
          <Sidebar handleChange={handleChange} handleClick={handleClick} />
        </div>
        <div className="col-span-2 bg-white p-4 rounded">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">
              {isLoading ? "加载中..." : `${result.length} 个职位`}
            </h3>
            <button
              type="button"
              onClick={openPanel}
              className="relative inline-flex items-center gap-2 text-sm font-medium text-blue border border-blue px-3 py-1.5 rounded hover:bg-blue/5"
              aria-label={`打开短名单，当前 ${shortlist.count} 个职位`}
              aria-pressed={panelOpen}
            >
              <FiBookmark />
              短名单
              <span
                className="inline-flex items-center justify-center min-w-[20px] h-5 text-xs font-semibold bg-blue text-white rounded-full px-1.5"
                aria-hidden="true"
              >
                {shortlist.count}
              </span>
            </button>
          </div>

          {isLoading ? (
            <p className="font-medium">加载中...</p>
          ) : result.length > 0 ? (
            <Jobs result={result} />
          ) : (
            <p>暂无数据</p>
          )}

          {result.length > 0 && (
            <div className="flex justify-center mt-4 space-x-8">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="hover:underline disabled:text-gray-400"
              >
                上一页
              </button>
              <span className="mx-2">
                第 {currentPage} / {totalPages || 1} 页
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="hover:underline disabled:text-gray-400"
              >
                下一页
              </button>
            </div>
          )}
        </div>
        <div className="bg-white p-4 rounded">
          <Newsletter />
        </div>
      </div>

      {/* Floating shortcut button */}
      <button
        type="button"
        onClick={openPanel}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 bg-blue text-white shadow-lg rounded-full px-4 py-3 hover:bg-blue/90 md:hidden"
        aria-label={`打开短名单，当前 ${shortlist.count} 个职位`}
      >
        <FiBookmark size={18} />
        <span className="text-sm font-medium">{shortlist.count}</span>
      </button>

      <ShortlistPanel
        open={panelOpen}
        onClose={closePanel}
        items={shortlist.items}
        count={shortlist.count}
        maxItems={shortlist.maxItems}
        storageAvailable={shortlist.storageAvailable}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onRemove={handleRemoveFromList}
        onClear={handleClear}
        onCompare={handleCompareClick}
      />

      {isComparing && (
        <CompareView
          jobs={compareJobs}
          onClose={closeCompare}
          onBack={backToPanel}
          onRemove={handleRemoveFromCompare}
        />
      )}
    </div>
  );
};

export default Home;
