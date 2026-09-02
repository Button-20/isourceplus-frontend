import React from "react";
import AnimatedHeading from "../animated_heading.components";
import Slider from "react-slick";
import { testimonials } from "@/assets/assets";

const Testimonial = () => {
  const settings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 500,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    cssEase: "linear",
    pauseOnHover: true,
    pauseOnFocus: true,
    responsive: [
      {
        breakpoint: 10000,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="bg-background py-16 lg:py-24 font-montserrat">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <AnimatedHeading
            text={"What People Say About Us"}
            class_name="text-4xl lg:text-5xl font-medium text-foreground"
          />
        </div>

        {/* Testimonials Slider */}
        <div>
          <Slider {...settings}>
            {testimonials.map((item, id) => (
              <div key={id} className="px-4 ">
                <div className="bg-card shadow-lg rounded-lg p-6 flex flex-col  items-center space-y-4 text-center">
                  {/* Avatar */}
                  <img
                    src={item.image}
                    alt={`Testimonial from ${item.name}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-brand"
                  />
                  {/* Name */}
                  <h3 className="text-lg font-medium text-foreground">
                    {item.name}
                  </h3>
                  {/* Role */}
                  <p className="text-sm text-brand">{item.position}</p>
                  {/* rating */}
                  <p>{item.rating}</p>
                  {/* Testimonial */}
                  <p className="text-sm text-muted-foreground italic leading-relaxed ">
                    "{item.quote}"
                  </p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
