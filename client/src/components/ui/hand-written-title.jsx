"use client";

import React from "react";
import { motion } from "framer-motion";

export function HandWrittenTitle({ title, subtitle }) {
  const drawLine = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.2, type: "spring", duration: 2.5, bounce: 0 },
        opacity: { delay: 0.2, duration: 0.5 },
      },
    },
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-6 w-full cursor-default select-none pointer-events-none">
      {/* Hand-drawn underline SVG */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center w-full z-0 overflow-visible pointer-events-none">
        <motion.svg
          width="480"
          height="120"
          viewBox="0 0 480 120"
          className="overflow-visible"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Main swooping underline */}
          <motion.path
            d="M 20 80 Q 120 110, 240 90 T 460 70"
            fill="transparent"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="3"
            strokeLinecap="round"
            variants={drawLine}
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          />
          {/* Secondary flourish */}
          <motion.path
            d="M 180 100 Q 240 125, 300 105"
            fill="transparent"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              visible: {
                pathLength: 1,
                opacity: 1,
                transition: { delay: 1.2, duration: 1.5, ease: "easeOut" },
              },
            }}
          />
        </motion.svg>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-tight text-white mb-2"
          style={{ textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
        >
          {title}
        </motion.h2>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-white/40 max-w-sm text-[15px] leading-relaxed m-0"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}
