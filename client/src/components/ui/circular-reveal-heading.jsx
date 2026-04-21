"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const sizeConfig = {
  sm: {
    container: "h-[300px] w-[300px]",
    fontSize: "text-xs",
    tracking: "tracking-[0.25em]",
    radius: 160,
    gap: 40,
    imageSize: "w-[75%] h-[75%]",
    textStyle: "font-medium",
  },
  md: {
    container: "h-[400px] w-[400px]",
    fontSize: "text-lg",
    tracking: "tracking-[0.3em]",
    radius: 160,
    gap: 30,
    imageSize: "w-[85%] h-[85%]",
    textStyle: "font-semibold",
  },
  lg: {
    container: "h-[500px] w-[500px]",
    fontSize: "text-base",
    tracking: "tracking-[0.35em]",
    radius: 160,
    gap: 20,
    imageSize: "w-[80%] h-[80%]",
    textStyle: "font-medium",
  },
};

const usePreloadImages = (images) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadImage = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = reject;
      });

    Promise.all(images.map(loadImage))
      .then(() => setLoaded(true))
      .catch((err) => console.error("Error preloading images:", err));
  }, [images]);

  return loaded;
};

const ImagePreloader = ({ images }) => (
  <div className="hidden" aria-hidden="true">
    {images.map((src, index) => (
      <img key={index} src={src} alt="" />
    ))}
  </div>
);

const ImageOverlay = ({ image, size = "md" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
  >
    <motion.img
      src={image}
      alt=""
      className={cn(sizeConfig[size].imageSize, "object-cover rounded-full shadow-[0_0_60px_rgba(34,211,238,0.25)] border-[1px] border-cyan-500/20")}
      style={{ filter: "brightness(1.1) contrast(1.1)" }}
    />
  </motion.div>
);

export const CircularRevealHeading = ({
  items,
  centerText,
  className,
  size = "md",
}) => {
  const [activeImage, setActiveImage] = useState(null);
  const config = sizeConfig[size];
  const imagesLoaded = usePreloadImages(items.map((item) => item.image));

  const createTextSegments = () => {
    const totalItems = items.length;
    const totalGapDegrees = config.gap * totalItems; // Total space for gaps
    const availableDegrees = 360 - totalGapDegrees; // Remaining space for text
    const segmentDegrees = availableDegrees / totalItems; // Space per text segment
    return items.map((item, index) => {
      const startPosition = index * (segmentDegrees + config.gap);
      const startOffset = `${(startPosition / 360) * 100}%`;
      return (
        <g key={index}>
          <text
            className={cn(
              config.fontSize,
              config.tracking,
              config.textStyle,
              "uppercase cursor-pointer transition-all duration-300"
            )}
            onMouseEnter={() => imagesLoaded && setActiveImage(item.image)}
            onMouseLeave={() => setActiveImage(null)}
            style={{
              transition: "all 0.3s ease",
            }}
          >
            <textPath
              href="#curve"
              className="fill-cyan-400/80 hover:fill-white focus:fill-white drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
              startOffset={startOffset}
              textLength={`${segmentDegrees * 1.8}`}
              lengthAdjust="spacingAndGlyphs"
            >
              {item.text}
            </textPath>
          </text>
        </g>
      );
    });
  };

  return (
    <>
      <ImagePreloader images={items.map((item) => item.image)} />
      <motion.div
        whileTap={{ scale: 0.98 }}
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "relative overflow-hidden",
          config.container,
          "rounded-full bg-[#0a0a1a]",
          "border-[1px] border-white/10",
          "shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)]",
          "transition-all duration-500 ease-out",
          className
        )}
      >
        <AnimatePresence>
          {activeImage && imagesLoaded && (
            <ImageOverlay image={activeImage} size={size} />
          )}
        </AnimatePresence>

        <motion.div
          className="absolute inset-[8px] rounded-full bg-transparent"
          style={{
            boxShadow:
              "inset 4px 4px 18px rgba(0,0,0,0.8), inset -4px -4px 12px rgba(255,255,255,0.03)",
          }}
        />

        <motion.div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence>
            {!activeImage && (
              <motion.div
                initial={{ opacity: 1, scale: 0.95 }}
                exit={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 p-6 rounded-full bg-transparent border border-white/5 backdrop-blur-md"
                style={{
                  boxShadow: "0 0 40px rgba(0,212,255,0.1), inset 0 0 20px rgba(255,255,255,0.05)"
                }}
              >
                {centerText}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="absolute inset-0"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <linearGradient
                id="textGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path
              id="curve"
              fill="none"
              d={`M 200,200 m -${config.radius},0 a ${
                config.radius
              },${config.radius} 0 1,1 ${config.radius * 2},0 a ${
                config.radius
              },${config.radius} 0 1,1 -${config.radius * 2},0`}
            />
            {createTextSegments()}
          </svg>
        </motion.div>
      </motion.div>
    </>
  );
};
