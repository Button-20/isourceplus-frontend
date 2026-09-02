import { assets } from "@/assets/assets";
import { AppContext } from "@/contexts/app.context";
import React, { useContext } from "react";
import { FaPlay } from "react-icons/fa6";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { SlideLeft, SlideRight } from "@/utility/animation";
import Lottie from "lottie-react";

const Hero = () => {

  const primaryText = "text-brand";

  const primaryBtn =
    "bg-brand-gradient text-white font-semibold py-[2vw] px-[4vw] sm:py-[1vw] sm:px-[3vw] md:py-4 md:px-8 rounded-md hover:scale-110! duration-300 text-[max(1.2vw,14px)] sm:text-[max(1.5vw,16px)] md:text-[1rem] lg:text-[0.9rem]";

  const navigate = useNavigate();

  return (
    <div>
      <section>
        <div className="container pt-10 grid grid-cols-1 lg:grid-cols-2  relative ">
          {/* company info */}
          <div className="flex flex-col justify-center  md:py-0 font-montserrat">
            <div className="text-center md:text-left space-y-6">
              <motion.h1
                variants={SlideRight(0.6)}
                initial="hidden"
                animate="visible"
                className="text-3xl sm:text-4xl text-center lg:text-left   font-medium leading-relaxed xl:leading-normal"
              >
                Optimize Your Procurement Workflow with{" "}
                <span className={primaryText}> iSource Plus</span>
              </motion.h1>
              <motion.p
                variants={SlideRight(1.2)}
                initial="hidden"
                animate="visible"
                className="text-muted-foreground xl:max-w-[500px] text-center lg:text-left"
              >
                Connecting Buyers and Suppliers Seamlessly for Efficient
                Sourcing, Tenders, and Transactions
              </motion.p>
              {/* button section */}
              <motion.div
                variants={SlideRight(1.5)}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center items-center gap-4 lg:justify-start mt-4! mb-4!"
                >
                <button
                  onClick={() => {
                  navigate("/onboarding");
                  }}
                  className={`${primaryBtn} flex items-center gap-2`}
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate("/watch-now")}
                  className={`flex justify-center items-center gap-2 text-[0.9rem]`}
                >

                  <FaPlay />
                  Take a Quick Tour
                </button>
              </motion.div>
            </div>
          </div>
          {/* hero image */}
          <div className="flex justify-center items-center">
            {/* <motion.img
              variants={SlideLeft(0.6)}
              initial="hidden"
              animate="visible"
              src={assets.heroImgRmvBg}
              alt=""
              className="w-[550px]  md:[700px] xl:w-[1400px] drop-shadow-sm"
            /> */}
            <motion.div
              variants={SlideLeft(0.6)}
              initial="hidden"
              animate="visible"
              className=""
            >
              <Lottie animationData={assets.animationHero} />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
