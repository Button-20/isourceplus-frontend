import React from "react";
import PropTypes from "prop-types"; // Optional but recommended for type checking

const Button = ({ label, onClick, style }) => {
  return (
    <button
      onClick={onClick}
      style={style}
      className="px-5  py-3 bg-black text-white rounded-md text-sm font-medium"
    >
      {label}
    </button>
  );
};

// Default props
Button.defaultProps = {
  label: "Click Me",
  onClick: () => alert("Button clicked!"),
  style: {}, // Empty object for custom inline styles
};

// Prop types (optional but good for validation)
Button.propTypes = {
  label: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
};

export default Button;
