
const Jobs = ({ result, header = null }) => {
  return (
    <>
      {header}
      <section className="card-container">{result}</section>
    </>
  );
};

export default Jobs;
