/**
 * Vidyouth Intelligence Institute — circular badge logo.
 *
 * Same shape as the SVG fallback baked into login.html / signup.html on the
 * web side: green ring, curved "VIDYOUTH INTELLIGENCE" and "INSTITUTE PVT. LTD."
 * text, a stylised V mark with bulb and circuit dots. Theme-aware via the
 * `accent` prop so it tints with the chosen palette but defaults to the
 * brand green.
 */

import React from 'react';
import Svg, { Circle, Defs, Path, Polygon, Rect, Text as SvgText, TextPath } from 'react-native-svg';

interface VidyouthLogoSvgProps {
  /** Render diameter in px. */
  size?: number;
  /** Ring + glyph colour. Falls back to the brand green. */
  accent?: string;
  /** Inner disc colour (text sits on this). Defaults to white. */
  background?: string;
}

export default function VidyouthLogoSvg({
  size = 128,
  accent = '#22C55E',
  background = '#FFFFFF',
}: VidyouthLogoSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        {/* react-native-svg supports textPath via inline <Path id="..."/> in <Defs> */}
        <Path id="vy-top-arc"    d="M 30,100 A 70,70 0 0 1 170,100" fill="none" />
        <Path id="vy-bottom-arc" d="M 30,100 A 70,70 0 0 0 170,100" fill="none" />
      </Defs>

      {/* Outer ring + inner disc */}
      <Circle cx="100" cy="100" r="92" fill={accent} />
      <Circle cx="100" cy="100" r="78" fill={background} />

      {/* Curved text — VIDYOUTH INTELLIGENCE on top */}
      <SvgText fill={background} fontFamily="Helvetica, Arial, sans-serif" fontSize="14" fontWeight="800" letterSpacing="2">
        <TextPath href="#vy-top-arc" startOffset="50%" textAnchor="middle">
          VIDYOUTH  INTELLIGENCE
        </TextPath>
      </SvgText>

      {/* Curved text — INSTITUTE PVT. LTD. on the bottom */}
      <SvgText fill={background} fontFamily="Helvetica, Arial, sans-serif" fontSize="13" fontWeight="800" letterSpacing="2">
        <TextPath href="#vy-bottom-arc" startOffset="50%" textAnchor="middle">
          INSTITUTE  PVT.  LTD.
        </TextPath>
      </SvgText>

      {/* Stylised V mark — inverted triangle with V cutout */}
      <Polygon points="60,72 140,72 100,148" fill={accent} />
      <Polygon points="78,72 122,72 100,118" fill={background} />

      {/* Lightbulb top-right of V */}
      <Circle cx="128" cy="74" r="7" fill={accent} />
      <Rect x="125" y="80" width="6" height="3" rx="1" fill={accent} />

      {/* Circuit-board dots on either side of the V */}
      <Circle cx="46"  cy="100" r="2" fill={accent} />
      <Circle cx="52"  cy="106" r="2" fill={accent} />
      <Circle cx="52"  cy="94"  r="2" fill={accent} />
      <Circle cx="154" cy="100" r="2" fill={accent} />
      <Circle cx="148" cy="106" r="2" fill={accent} />
      <Circle cx="148" cy="94"  r="2" fill={accent} />
    </Svg>
  );
}
