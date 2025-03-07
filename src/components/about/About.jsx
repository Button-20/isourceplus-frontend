import { assets } from "@/assets/assets";
import { AppContext } from "@/contexts/app.context";
import React, { useContext } from "react";
import { FaPlay } from "react-icons/fa6";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { SlideLeft, SlideRight } from "@/utility/animation";
import AnimatedHeading from "../animated_heading.components";

const About = () => {
  const { tailwindValues, primaryBtn, primaryText } = useContext(AppContext);

  const navigate = useNavigate();

  const Btn =
    "bg-black text-gray-500 font-semibold py-[2vw] px-[4vw] sm:py-[1vw] sm:px-[3vw] md:py-[1rem] md:px-[2rem] rounded-md hover:!scale-110 duration-300 text-[max(1.2vw,14px)] sm:text-[max(1.5vw,16px)] md:text-[1rem] lg:text-[1.2rem]";

  return (
    <section className=" pb-16 lg:py-20 font-montserrat">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.h1
          variants={SlideLeft(0.2)}
          initial="hidden"
          whileInView="visible"
          className="text-center lg:text-left  text-6xl lg:text-7xl  text-black "
        >
          <AnimatedHeading
            text={"Discover "}
            text2={"iSource Plus"}
            text2class_name={"text-indigo-600"}
            size="text-5xl font-medium"
            class_name=" pt-10"
          />
        </motion.h1>

        {/* About Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Company Info */}
          <div className="flex flex-col space-y-8">
            <motion.p
              variants={SlideRight(0.2)}
              initial="hidden"
              whileInView="visible"
              className="text-2xl lg:text-3xl text-gray-800 leading-relaxed xl:leading-normal"
            >
              iSource Plus is a platform designed to simplify the buying and
              selling process for businesses. It connects buyers with reliable
              suppliers and offers smooth, secure payment options.
            </motion.p>
            <p className="text-xl text-gray-600">
              The platform offers two main features: buyers can compare prices
              from different suppliers, while suppliers can bid for projects.
              iSource Plus helps businesses save time, reduce costs, and find
              the best offers in the market.
            </p>
          </div>

          {/* Hero Image */}
          <div className="relative w-full h-[450px] lg:h-[600px]">
            <motion.img
              variants={SlideLeft(0.4)}
              initial="hidden"
              whileInView="visible"
              src={assets.aboutIMG2}
              alt="iSource Plus"
              className="object-cover w-full h-full rounded-lg shadow-xl"
            />
          </div>
        </div>

        {/* Call to Action Button */}
        <div className="text-center mt-12 flex justify-center gap-4">
          {/* <button
          onClick={() => navigate("/signup")}
          className={`${Btn} text-white py-3 px-8 rounded-full font-semibold text-xl transition-all hover:bg-indigo-700 hover:shadow-lg`}
          >
          Register now
          </button> */}
          <button
            onClick={() => {
              navigate("/marketplace"), scrollTo(0, 0);
            }}
            className={`${Btn} bg-black text-white py-3 px-8 rounded-full font-semibold text-xl transition-all  hover:shadow-lg`}
          >
            View Marketplace
          </button>
        </div>
      </div>
    </section>
  );
};

export default About;
