import { Button } from "@react-email/components";
import type { ReactNode } from "react";

interface EmailButtonProps {
  children: ReactNode;
  href: string;
}

export function EmailButton({ children, href }: EmailButtonProps) {
  return (
    <Button href={href} style={style}>
      {children}
    </Button>
  );
}

const style = {
  backgroundColor: "#16794a",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "700",
  lineHeight: "24px",
  padding: "12px 24px",
  textAlign: "center" as const,
  textDecoration: "none",
};
