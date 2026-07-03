import { Heading, Link, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";

export interface VerifyEmailProps {
  name: string;
  verificationUrl: string;
}

export default function VerifyEmail({
  name = "Matheus",
  verificationUrl = "http://localhost:3000/api/auth/verify-email?token=preview",
}: VerifyEmailProps) {
  return (
    <EmailLayout preview="Confirme seu email para ativar sua conta no InvestHub.">
      <Heading style={styles.heading}>Confirme seu email</Heading>
      <Text style={styles.text}>Olá, {name}.</Text>
      <Text style={styles.text}>
        Confirme seu endereço de email para ativar sua conta e acessar o InvestHub.
      </Text>
      <EmailButton href={verificationUrl}>Verificar email</EmailButton>
      <Text style={styles.help}>
        Se o botão não funcionar, copie e cole este endereço no navegador:
      </Text>
      <Link href={verificationUrl} style={styles.link}>
        {verificationUrl}
      </Link>
      <Text style={styles.help}>
        Se você não criou esta conta, ignore esta mensagem.
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
  help: {
    color: "#687970",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "20px 0 6px",
  },
  link: {
    color: "#12673f",
    fontSize: "13px",
    lineHeight: "20px",
    overflowWrap: "anywhere" as const,
  },
} as const;
