"use client";

import Box from "@mui/material/Box";
import { SvgIconProps } from "@mui/material/SvgIcon";
import Image from "next/image";
import React from "react";

// Use SVG files directly as image sources - Next.js 15+ recommended approach
export const WhatsAppIcon = React.forwardRef<HTMLDivElement, SvgIconProps>((props, ref) => {
  const { sx, fontSize = "1.5rem" } = props;
  return (
    <Box
      ref={ref}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: fontSize,
        height: fontSize,
        ...sx
      }}
    >
      <Image src="/images/logos/icons8-whatsapp.svg" alt="" width={24} height={24} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
});
WhatsAppIcon.displayName = "WhatsAppIcon";

export const InstagramIcon = React.forwardRef<HTMLDivElement, SvgIconProps>((props, ref) => {
  const { sx, fontSize = "1.5rem" } = props;
  return (
    <Box
      ref={ref}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: fontSize,
        height: fontSize,
        ...sx
      }}
    >
      <Image src="/images/logos/icons8-instagram.svg" alt="" width={24} height={24} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
});
InstagramIcon.displayName = "InstagramIcon";

export const FacebookIcon = React.forwardRef<HTMLDivElement, SvgIconProps>((props, ref) => {
  const { sx, fontSize = "1.5rem" } = props;
  return (
    <Box
      ref={ref}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: fontSize,
        height: fontSize,
        ...sx
      }}
    >
      <Image src="/images/logos/icons8-facebook.svg" alt="" width={24} height={24} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
});
FacebookIcon.displayName = "FacebookIcon";

export const IMessageIcon = React.forwardRef<HTMLDivElement, SvgIconProps>((props, ref) => {
  const { sx, fontSize = "1.5rem" } = props;
  return (
    <Box
      ref={ref}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: fontSize,
        height: fontSize,
        ...sx
      }}
    >
      <Image src="/images/logos/icons8-messages.svg" alt="" width={24} height={24} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
});
IMessageIcon.displayName = "IMessageIcon";
