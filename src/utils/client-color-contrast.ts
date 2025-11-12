"use client";

import { useEffect, useState } from "react";
import tinycolor from "tinycolor2";

/**
 * Hook to get the current theme background color from CSS variables
 */
export function useThemeBackground(): string {
  const [bgColor, setBgColor] = useState<string>("#ffffff");

  useEffect(() => {
    const updateBgColor = () => {
      if (typeof window === "undefined") return;
      
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      const bg = computedStyle.getPropertyValue("--background").trim();
      
      // Convert to hex if it's a CSS variable or rgb/rgba
      const color = tinycolor(bg);
      if (color.isValid()) {
        setBgColor(color.toHexString());
      }
    };

    updateBgColor();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateBgColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return bgColor;
}

/**
 * Adjust gradient colors to ensure sufficient contrast against the background
 * Returns adjusted colors if needed, or original colors if contrast is sufficient
 */
export function adjustColorsForContrast(
  gradientStart: string,
  gradientEnd: string,
  backgroundColor: string
): { gradientStart: string; gradientEnd: string } {
  const startColor = tinycolor(gradientStart);
  const endColor = tinycolor(gradientEnd);
  const bgColor = tinycolor(backgroundColor);

  // Check contrast ratio (WCAG AA requires 4.5:1 for normal text, 3:1 for large text)
  // For gradients, we'll check the darker end color against background
  const contrastRatio = tinycolor.readability(endColor, bgColor);

  // If contrast is too low (< 2.5), adjust the colors
  if (contrastRatio < 2.5) {
    // Lighten the darker end color to improve contrast
    const adjustedEnd = endColor.lighten(15).saturate(10);
    
    // Adjust start color proportionally to maintain gradient feel
    const adjustedStart = startColor.lighten(10).saturate(5);
    
    return {
      gradientStart: adjustedStart.toHexString(),
      gradientEnd: adjustedEnd.toHexString(),
    };
  }

  return { gradientStart, gradientEnd };
}

/**
 * Create a more modern, subtle gradient:
 * - Desaturate vivid colors slightly
 * - Blend a bit with the background to reduce harshness
 * - Ensure the end color is a touch darker for depth
 */
export function makeModernGradient(
  gradientStart: string,
  gradientEnd: string,
  backgroundColor: string
): { gradientStart: string; gradientEnd: string } {
  const bg = tinycolor(backgroundColor);
  const start = tinycolor(gradientStart).desaturate(20);
  const end = tinycolor(gradientEnd).desaturate(25).darken(5);

  // Softly blend with background (15%) to avoid overly playful colors
  const mixedStart = tinycolor.mix(start, bg, 15);
  const mixedEnd = tinycolor.mix(end, bg, 15);

  return {
    gradientStart: mixedStart.toHexString(),
    gradientEnd: mixedEnd.toHexString(),
  };
}

