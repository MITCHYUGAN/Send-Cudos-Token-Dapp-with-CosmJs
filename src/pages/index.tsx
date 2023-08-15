import { TokenSender } from '@/component/Send-Token'
import styles from '@/styles/Home.module.css'

export default function Home() {
  return (
    <TokenSender 
      rpcUrl='https://rpc.testnet.cudos.org:443'
    />
  )
}
