"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { Sparkles } from "lucide-react";

export function DisplayCard({
  className,
  icon = <Sparkles className="w-4 h-4 text-cyan-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-cyan-400",
  titleClassName = "text-cyan-400",
}) {
  return (
    <div
      className={cn(
        // Use our standard app-wide glass classes mixed with the animation
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[24px] px-5 py-4 transition-all duration-700",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-[#080810] after:to-transparent after:content-['']",
        "hover:border-white/20 hover:bg-white/10 hover:-translate-y-2 hover:skew-y-0",
        "[&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)"
      }}
    >
      <div className="relative z-10">
        <span className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 shadow-[0_0_12px_rgba(0,212,255,0.15)]">
          {icon}
        </span>
        <p className={cn("text-[1.15rem] font-semibold tracking-tight", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-[14px] text-white/50 leading-relaxed relative z-10">{description}</p>
      <p className="text-[11px] font-bold tracking-widest uppercase text-white/30 relative z-10">{date}</p>
    </div>
  );
}

export default function DisplayCards({ cards }) {
  const defaultCards = [
    {
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className:
        "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
