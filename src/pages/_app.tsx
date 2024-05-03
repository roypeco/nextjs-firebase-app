import type { AppProps } from "next/app";
import { RecoilRoot } from 'recoil'
import "../styles/globals.scss"
import '../lib/firebase'



export default function App({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <Component {...pageProps} />
    </RecoilRoot>
  )
}
