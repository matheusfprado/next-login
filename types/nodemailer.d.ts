declare module "nodemailer" {
  interface TransportAuth {
    user: string
    pass: string
  }

  interface TransportOptions {
    host: string
    port: number
    secure?: boolean
    auth?: TransportAuth
  }

  interface SendMailOptions {
    from?: string
    to: string
    subject: string
    text?: string
    html?: string
  }

  interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<unknown>
  }

  export function createTransport(options: TransportOptions): Transporter

  const nodemailer: {
    createTransport: typeof createTransport
  }

  export default nodemailer
}
