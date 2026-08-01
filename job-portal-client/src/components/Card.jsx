import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiBookmark,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const Card = ({ data, isShortlisted, isComparing, onToggleShortlist }) => {
  const {
    _id,
    companyLogo,
    jobTitle,
    companyName,
    jobLocation,
    employmentType,
    minPrice,
    maxPrice,
    postingDate,
  } = data;

  const selected = Boolean(isShortlisted);
  const comparing = Boolean(isComparing);

  const handleToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof onToggleShortlist === "function") {
      onToggleShortlist(data);
    }
  };

  const borderClass = comparing
    ? "border-blue ring-2 ring-blue/30"
    : selected
    ? "border-blue"
    : "border-[#ededed]";

  return (
    <div>
      <section className={`card ${borderClass}`}>
        {comparing && (
          <span className="inline-block mb-2 text-xs font-medium text-white bg-blue px-2 py-0.5 rounded">
            对比中
          </span>
        )}
        {!comparing && selected && (
          <span className="inline-block mb-2 text-xs font-medium text-blue bg-blue/10 px-2 py-0.5 rounded">
            已在短名单
          </span>
        )}
        <Link
          to={`/jobs/${_id}`}
          className="flex gap-4 flex-col sm:flex-row items-start"
        >
          <img src={companyLogo} alt={jobTitle} className="w-16 h-16 mb-4" />
          <div className="card-details flex-1">
            <h4 className="text-primary mb-1">{companyName}</h4>
            <h3 className="text-lg font-semibold mb-2">{jobTitle}</h3>

            <div className="text-primary/70 text-base flex flex-wrap gap-2 mb-2">
              <span className="flex items-center gap-2">
                <FiMapPin /> {jobLocation}
              </span>
              <span className="flex items-center gap-2">
                <FiClock /> {employmentType}
              </span>
              <span className="flex items-center gap-2">
                <FiDollarSign /> {minPrice}-{maxPrice}k
              </span>
              <span className="flex items-center gap-2">
                <FiCalendar /> {postingDate}
              </span>
            </div>
          </div>
        </Link>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleToggle}
            aria-pressed={selected}
            aria-label={selected ? "移出短名单" : "加入短名单"}
            className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded border transition-colors ${
              selected
                ? "bg-blue text-white border-blue"
                : "bg-white text-blue border-blue hover:bg-blue/5"
            }`}
          >
            <FiBookmark
              className={selected ? "fill-white" : ""}
              aria-hidden="true"
            />
            {selected ? "移出短名单" : "加入短名单"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Card;
