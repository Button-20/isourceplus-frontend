import { NavBarMenu } from "@/assets/data";
import { AppContext } from "@/contexts/app.context";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { useContext } from "react";
import AnchorLink from "react-anchor-link-smooth-scroll";
import { Link } from "react-router";

const ResponsiveMenu = ({ open, setOpen }) => {
  const { tailwindValues, token } = useContext(AppContext);

  const renderNavLink = (item) => {
    if (item.link.startsWith('#')) {
      return <AnchorLink href={item.link}>{item.title}</AnchorLink>;
    } else {
      return <Link to={item.link}>{item.title}</Link>;
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.1 }}
            className="absolute top-20 left-0 w-full h-screen z-20"
          >
            <div
              className={`text-2xl font-semibold uppercase bg-black text-white py-10 m-6 rounded-3xl`}
            >
              <ul className="flex flex-col justify-center items-center gap-10">
                {NavBarMenu.map((item) => (
                  <li
                  key={item.id}
                  className={`cursor-pointer hover:text-brand`}
                  onClick={() => setOpen(false)}
                  >
                  {renderNavLink(item)}
                  </li>
                ))}

                {token ? (
                  <div>
                    <Link
                      to={"/dashboard"}
                      className={`px-5  py-3 bg-brand hover:bg-white/50 text-white rounded-md text-sm font-medium  `}
                    >
                      Dashboard
                    </Link>
                  </div>
                ) : (
                  <div onClick={() => scrollTo(0, 1000)}>
                    <Link
                      to={"/signup"}
                      className={`px-5  py-3 bg-white hover:bg-white/50 hover:text-white text-black rounded-md text-sm font-medium  `}
                    >
                      Sign In / Register
                    </Link>
                  </div>
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResponsiveMenu;
