import Document, {
  Head,
  Html,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from "next/document";

interface SimulatorDocumentProps {
  nonce?: string;
}

export default class SimulatorDocument extends Document<SimulatorDocumentProps> {
  static async getInitialProps(
    context: DocumentContext,
  ): Promise<DocumentInitialProps & SimulatorDocumentProps> {
    const initialProps = await Document.getInitialProps(context);
    const nonce = context.req?.headers["x-nonce"];

    return {
      ...initialProps,
      nonce: typeof nonce === "string" ? nonce : undefined,
    };
  }

  render() {
    const { nonce } = this.props;

    return (
      <Html lang="en">
        <Head nonce={nonce} />
        <body>
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}
