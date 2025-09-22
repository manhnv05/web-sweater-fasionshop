import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import PropTypes from "prop-types";

const ProductSlideshow = ({ product }) => {
  const images =
    product.listUrlImage && product.listUrlImage.length > 0
      ? product.listUrlImage
      : ["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80"];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  console.log(product.listUrlImage);
  useEffect(() => {
    let interval;
    if (isHovered) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 1000); // 2s đổi ảnh
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: `${images.length * 100}%`,
          transform: `translateX(-${currentIndex * (100 / images.length)}%)`,
          transition: "transform 0.6s ease-in-out",
        }}
      >
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index}`}
            style={{
              width: `${100 / images.length}%`,
              height: "100%",
              objectFit: "cover",
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

ProductSlideshow.propTypes = {
  product: PropTypes.object.isRequired,
};

export default ProductSlideshow;
