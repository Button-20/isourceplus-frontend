import { SlideLeft } from "@/utility/animation";
import { motion } from "framer-motion";

const Card = ({ icon, title, description, delay }) => (
  <div className="flex flex-col items-center  p-4 bg-indigo-600 text-white rounded-lg w-64 cursor-pointer shrink-0  transition-all duration-500">
    <img className="w-16 sm:w-24 mb-4" src={icon} alt={title} />
    <p className="text-lg font-semibold">{title}</p>
    <p className="text-sm">{description}</p>
  </div>
);

export default Card;
