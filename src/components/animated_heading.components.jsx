import React from "react";
import { motion } from "framer-motion";

const AnimatedHeading = ({
  text,
  text2,
  text2class_name,
  color = "indigo-600",
  underlineColor = "indigo-500",
  size = "text-3xl",
  alignment = "text-center",
  class_name = "",
}) => {
  return (
    <h1
      className={`${size} font-bold ${alignment} text-${color} mb-20 relative ${class_name}`}
    >
      {text} <span className={text2class_name}>{text2}</span>
      <motion.div
        className={`absolute w-[80px] h-[5px] bg-${underlineColor} left-[40%] lg:left-[46%] bottom-[-20px] rounded-lg`}
        style={{ transform: "translateX(-50%)" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 4 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </h1>
  );
};

export default AnimatedHeading;
