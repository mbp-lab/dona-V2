import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";

import { LinkButton } from "@/components/LinkButton";

export const FooterButton = styled(LinkButton)(({ theme }) => ({
  textTransform: "none",
  fontSize: "0.875rem",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.75rem",
    padding: "4px 8px"
  }
}));

export const ChartControlButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontSize: "0.875rem",
  minWidth: "100px",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.75rem",
    padding: "4px 8px"
  }
}));
