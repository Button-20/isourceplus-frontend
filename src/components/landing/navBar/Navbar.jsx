import { NavBarMenu } from "@/assets/data";
import { AppContext } from "@/contexts/app.context";
import { Users } from "lucide-react";
import React, { useContext, useState } from "react";
import AnchorLink from "react-anchor-link-smooth-scroll";
import { Link, useNavigate } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose } from "react-icons/ai";
import ResponsiveMenu from "../ResponsiveMenu";
import { assets } from "@/assets/assets";

const NavBar = () => {
  // local tailwind variables
  const { tailwindValues, token } = useContext(AppContext);

  const navigate = useNavigate();

  const [menu, setMenu] = useState(NavBarMenu[0].title);
  const [open, setOpen] = useState(false);

  const renderNavLink = (item) => {
    if (item.link.startsWith('#')) {
      return (
        <AnchorLink
          href={item.link}
          className={`inline-block p-3 text-sm hover:bg-gray-300 rounded-lg font-medium`}
        >
          {item.title}
        </AnchorLink>
      );
    } else {
      return (
        <Link
          to={item.link}
          className={`inline-block p-3 text-sm hover:bg-gray-300 rounded-lg font-medium`}
        >
          {item.title}
        </Link>
      );
    }
  };

  return (
    <div className="font-montserrat">
      <nav className="">
        <div className="container flex justify-between  items-center py-8">
          {/* logo section */}
          <div
            onClick={() => navigate("/")}
            className={`text-2xl flex items-center gap-2 cursor-pointer font-bold uppercase`}
          >
            {/* <Users /> */}
            <img src={assets.ISlogo} alt="" className="w-32" />
          </div>
          {/* menu section */}
          <div className="hidden xl:block">
            <ul className="flex items-center space-x-5 text-gray-600 ">
                {NavBarMenu.map((item) => (
                <li key={item.id}>
                  <a onClick={() => setMenu(item.title)}>
                  {renderNavLink(item)}
                  </a>
                </li>
                ))}

            </ul>
          </div>

          {/* sign in section */}
          {token ? (
            <Link
              to={"/dashboard"}
              className={`px-5  py-3 bg-black hover:bg-black/50 text-white rounded-md text-sm font-medium hidden lg:block `}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to={"/signup"}
              className={`px-5  py-3 bg-black hover:bg-black/50 text-white rounded-md text-sm font-medium hidden xl:block `}
            >
              Sign In / Register
            </Link>
          )}

          {/* mobile hamburger menu section */}
          <div onClick={() => setOpen((prev) => !prev)} className="xl:hidden">
            {open ? (
              <AiOutlineClose className="text-3xl" />
            ) : (
              <GiHamburgerMenu className="text-3xl" />
            )}
          </div>
        </div>
      </nav>

      {/* mobile sidebar section */}
      <ResponsiveMenu open={open} setOpen={setOpen} />
    </div>
  );
};

export default NavBar;
