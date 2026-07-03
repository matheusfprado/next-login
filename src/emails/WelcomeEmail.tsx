import { Heading, Text } from "@react-email/components";

import { EmailLayout } from "./components/EmailLayout";

export interface WelcomeEmailProps {
  name: string;
}

export default function WelcomeEmail({ name = "Matheus" }: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Sua conta InvestHub está pronta para uso.">
      <Heading style={styles.heading}>Boas-vindas ao InvestHub</Heading>
      <Text style={styles.text}>Olá, {name}.</Text>
      <Text style={styles.text}>
        Sua conta está ativa. Agora você pode organizar sua carteira, acompanhar seus
        investimentos e definir suas metas financeiras em um só lugar.
      </Text>
      <Text style={styles.highlight}>
        Comece adicionando seus investimentos para ter uma visão completa da sua carteira.
      </Text>
    </EmailLayout>
  );
}

const styles = {
  heading: {
    color: "#17231d",
    fontSize: "26px",
    lineHeight: "34px",
    margin: "8px 0 20px",
  },
  text: {
    color: "#34473d",
    fontSize: "16px",
    lineHeight: "26px",
    margin: "0 0 16px",
  },
  highlight: {
    backgroundColor: "#edf8f1",
    borderLeft: "4px solid #16794a",
    borderRadius: "6px",
    color: "#294c39",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "24px 0 0",
    padding: "16px",
  },
} as const;
