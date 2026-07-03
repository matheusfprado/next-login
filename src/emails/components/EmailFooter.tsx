import { Section, Text } from "@react-email/components";

export function EmailFooter() {
  return (
    <Section style={style.wrapper}>
      <Text style={style.text}>
        Esta é uma mensagem automática do InvestHub. Não responda a este email.
      </Text>
      <Text style={style.text}>© {new Date().getFullYear()} InvestHub</Text>
    </Section>
  );
}

const style = {
  wrapper: {
    padding: "20px 32px 28px",
  },
  text: {
    color: "#687970",
    fontSize: "12px",
    lineHeight: "18px",
    margin: "0 0 4px",
  },
} as const;
