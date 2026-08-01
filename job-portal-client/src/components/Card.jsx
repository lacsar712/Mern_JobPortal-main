import {
  FiBookmark,
  FiCalendar,
  FiCheck,
  FiClock,
  FiColumns,
  FiDollarSign,
  FiMapPin,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useJobShortlist } from "../hooks/useJobShortlist";

const Card = ({ data }) => {
  const { isShortlisted, isInCompare, toggleShortlist } = useJobShortlist();
  const selected = isShortlisted(data);
  const comparing = isInCompare(data);
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
    description,
  } = data;

  return (
    <div>
      <section
        className={`card relative ${
          comparing
            ? "!border-blue !border-2 bg-blue/[0.04]"
            : selected
            ? "!border-blue/50"
            : ""
        }`}
      >
        {comparing && (
          <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-blue px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
            <FiColumns />
            对比中
          </span>
        )}
        {!comparing && selected && (
          <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-blue/10 px-2.5 py-0.5 text-xs font-medium text-blue ring-1 ring-inset ring-blue/30">
            <FiBookmark />
            已收藏
          </span>
        )}
        <Link
          to={`/jobs/${_id}`}
          className="flex gap-4 flex-col sm:flex-row items-start"
        >
          <img src={companyLogo} alt={jobTitle} className="w-16 h-16 mb-4" />
          <div className="card-details">
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

            <p className="text-base text-primary/70 ">{description}</p>
          </div>
        </Link>
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => toggleShortlist(data)}
            aria-label={selected ? "移出短名单" : "加入短名单"}
            className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition ${
              selected
                ? "bg-blue text-white hover:opacity-90"
                : "border border-gray-300 text-primary hover:border-blue hover:text-blue"
            }`}
          >
            {selected ? <FiCheck /> : <FiBookmark />}
            {selected ? "移出短名单" : "加入短名单"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Card;
