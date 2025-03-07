import { features, security } from "@/assets/assets";
import { AppContext } from "@/contexts/app.context";
import React, { useContext } from "react";
import Card from "./CardFeatures";
import { motion } from "framer-motion";
import { SlideLeft } from "@/utility/animation";
import AnimatedHeading from "../animated_heading.components";

const SecurityFeatures = () => {
  const { primaryBg } = useContext(AppContext);

  const fallbackData = [
    {
      title: "Two-Factor Authentication",
      content:
        "iSource Plus offers two-factor authentication to secure administrator accounts with dual identity verification.",
      image: "lock_phone",
    },
  ];

  const data = security?.length ? security : fallbackData;

  return (
    <div>
      <div className="container font-montserrat">
        <h1 className="text-center">
          <AnimatedHeading
            text={"Your"}
            text2={"Security"}
            text2class_name={"text-indigo-600"}
            size="text-4xl"
            class_name="font-montserrat font-medium pt-8 sm:pt-10 lg:pt-12"
          />
        </h1>

        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-6 ">
          {data.map((item) => {
            return (
              <div className="flex flex-col h-full">
                <motion.div
                  variants={SlideLeft(item.delay)}
                  initial="hidden"
                  whileInView="visible"
                  className={`space-y-4 ${primaryBg} text-white p-10 rounded-lg flex flex-col justify-between h-full `}
                >
                  <img
                    src={item.image}
                    alt=""
                    className="lg:w-14 w-14 mx-auto bg-white p-2 rounded-lg"
                  />
                  <p className="text-xl font-medium text-center">
                    {item.title}
                  </p>
                  <p className="text-gray-200  text-sm text-center">
                    {item.content}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* mobile card */}
        <div className=" flex md:hidden sm:justify-center gap-4  w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
          {data.map((item, index) => (
            <Card
              key={index}
              icon={item.image}
              title={item.title}
              description={item.content}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityFeatures;
