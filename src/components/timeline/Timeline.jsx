import React from "react";
import { motion } from "framer-motion";
import { GiArchiveRegister } from "react-icons/gi";
import { IoMdCloudUpload } from "react-icons/io";
import { AiFillInteraction } from "react-icons/ai";
import { TbTransactionDollar } from "react-icons/tb";
import { MdPayments } from "react-icons/md";
import { MdRateReview } from "react-icons/md";
import AnimatedHeading from "../animated_heading.components";

const Timeline = () => {
  const Steps = [
    {
      title: "Step 1: Register",
      description: "Sign up as a buyer or supplier to create your account.",
      icon: <GiArchiveRegister />,
    },
    {
      title: "Step 2: Post and Upload",
      description:
        "Buyers post requests for products, and suppliers upload their product lists.",
      icon: <IoMdCloudUpload />,
    },
    {
      title: "Step 3: Review and Choose",
      description:
        "Buyers look at offers from suppliers, and suppliers reply to requests.",
      icon: <AiFillInteraction />,
    },
    {
      title: "Step 4: Confirm and Order",
      description:
        "Buyers pick suppliers, place orders, and confirm agreements.",
      icon: <TbTransactionDollar />,
    },
    {
      title: "Step 5: Pay and Document",
      description:
        "Make payments, get receipts, and upload necessary documents.",
      icon: <MdPayments />,
    },
    {
      title: "Step 6: Finish and Review",
      description:
        "Track the order, leave feedback, and close the transaction.",
      icon: <MdRateReview />,
    },
  ];

  return (
    <div className="container timeline relative mx-auto px-4 sm:px-6 lg:px-8 font-montserrat">
      {/* heading */}
      <AnimatedHeading
        text="Journey Through the Process"
        color="white"
        underlineColor="indigo-600"
        size="text-4xl font-medium"
        class_name=""
      />

      {/* Animated line */}
      <motion.div
        className="absolute top-13 left-[50%] z-0 hidden lg:block"
        style={{
          width: "6px",
          background: "#4F46E5",
          marginLeft: "-3px",
        }}
        initial={{ height: "0%" }}
        whileInView={{ height: "90%" }}
        transition={{ duration: 3, ease: "linear" }}
      ></motion.div>
      {/* Timeline steps */}
      {Steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.5 }}
          className={`relative my-5 ${
            index % 2 === 0
              ? "lg:leftcont lg:right-0 lg:w-[50%]"
              : "lg:rightcont lg:left-[50%] lg:w-[50%]"
          } w-full`}
        >
          <div className="bg-white mx-auto lg:mx-10 rounded-lg shadow-md">
            {/* icon */}
            <motion.div
              className={`lg:absolute inline-block m-4 lg:m-0 text-white bg-indigo-600 p-2 rounded-full text-[30px] lg:text-[40px] top-[20px] lg:top-[32px] z-10 ${
                index % 2 === 0 ? "lg:right-[-20px]" : "lg:left-[-20px]"
              }`}
              whileHover={{ scale: 1.2 }}
            >
              {step.icon}
            </motion.div>
            {/* textbox */}
            <div className="textbox shadow-lg px-6 py-6 lg:px-8 lg:py-8 relative rounded-md text-[15px]">
              <h2 className="font-medium text-lg">{step.title}</h2>
              <p className="mt-3 text-sm text-gray-600">{step.description}</p>
              <span
                className={`hidden lg:block ${
                  index % 2 === 0
                    ? "absolute top-[28px] z-[10] border-t-[15px] border-t-transparent border-b-transparent border-b-[15px] border-l-[20px] border-l-white right-[-15px]"
                    : "absolute top-[28px] z-[10] border-t-[15px] border-t-transparent border-b-transparent border-b-[15px] border-r-[20px] border-r-white left-[-15px]"
                }`}
              ></span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Timeline;
