import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import type { ReactNode } from "react";

import { EmailFooter } from "./EmailFooter";
import { EmailHeader } from "./EmailHeader";

interface EmailLayoutProps {
  children: ReactNode;
  preview: string;
}

export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />
          <Section style={styles.content}>{children}</Section>
          <Hr style={styles.divider} />
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f4f7f5",
    color: "#17231d",
    fontFamily: "Arial, Helvetica, sans-serif",
    margin: "0",
    padding: "32px 12px",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #dfe7e2",
    borderRadius: "12px",
    boxShadow: "0 4px 16px rgba(23, 35, 29, 0.06)",
    margin: "0 auto",
    maxWidth: "560px",
    overflow: "hidden",
    width: "100%",
  },
  content: {
    padding: "8px 32px 24px",
  },
  divider: {
    borderColor: "#e6ece8",
    margin: "0 32px",
  },
} as const;
