import React from "react";

export default function StarRating({ value=0, onChange }) {
  const [hover, setHover] = React.useState(0);
  const v = hover || value;

  return (
    <div className="rating" onMouseLeave={() => setHover(0)}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className={"star " + (n <= v ? "active" : "inactive")}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange?.(n)}
          title={`${n} estrella${n>1?"s":""}`}
        >
          ★
        </span>
      ))}
      <small className="helper">{v}/5</small>
    </div>
  );
}
