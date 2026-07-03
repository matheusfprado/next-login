import { Heading, Link, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";

export interface ResetPasswordProps {
  name: string;
  resetUrl: string;
}

export default function ResetPassword({
  name = "Matheus",
  resetUrl = "http://localhost:3000/reset-password?token=preview",
}: ResetPasswordProps) {
  return (
    <EmailLayout preview="Use este link seguro para redefinir sua senha do InvestHub.">
      <Heading style={styles.heading}>Redefina sua senha</Heading>
      <Text style={styles.text}>Olá, {name}.</Text>
      <Text style={styles.text}>
        Recebemos uma solicitação para redefinir sua senha. O link expira em uma hora.
      </Text>
      <EmailButton href={resetUrl}>Redefinir senha</EmailButton>
      <Text style={styles.help}>
        Se o botão não funcionar, copie e cole este endereço no navegador:
      </Text>
      <Link href={resetUrl} style={styles.link}>
        {resetUrl}
      </Link>
      <Text style={styles.help}>
        Não solicitou a alteração? Ignore esta mensagem; sua senha continuará a mesma.
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
