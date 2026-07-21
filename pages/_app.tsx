import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import "@/styles/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <main className={poppins.variable}>
        <Component {...pageProps} />
      </main>
    </ToastProvider>
  );
}
