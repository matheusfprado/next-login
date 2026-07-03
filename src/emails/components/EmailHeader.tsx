import { Section, Text } from "@react-email/components";

export function EmailHeader() {
  return (
    <Section style={styles.wrapper}>
      <Text style={styles.brand}>InvestHub</Text>
      <Text style={styles.tagline}>Seus investimentos, em um só lugar.</Text>
    </Section>
  );
}

const styles = {
  wrapper: {
    padding: "28px 32px 20px",
  },
  brand: {
    color: "#16794a",
    fontSize: "24px",
    fontWeight: "700",
    lineHeight: "32px",
    margin: "0",
  },
  tagline: {
    color: "#52645a",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "2px 0 0",
  },
} as const;
