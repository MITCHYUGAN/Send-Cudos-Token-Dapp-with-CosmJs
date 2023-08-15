import { Component, ChangeEvent, ReactNode, MouseEvent, useState } from "react";
import { SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { AccountData, OfflineSigner } from "@cosmjs/proto-signing"
import { ChainInfo, Window as KeplrWindow } from "@keplr-wallet/types";
import styles from '@/styles/Home.module.css'

declare global {
    interface Window extends KeplrWindow {}
}

interface TokenSenderState {
    denom: string
    chainId: string
    myAddress: string
    myBalance: string
    amountToSend: string
    addressToSend: string
    TxHash: string
    gasUsed: number
    gasWanted: number
    TxHeight: number
    TXResult: string
}


export interface TokenSenderProps {
    rpcUrl: string
}

export class TokenSender extends Component<TokenSenderProps, TokenSenderState> {
    // Set the Initial State
    constructor(props: TokenSenderProps){
        super(props)
        this.state = {
            denom: "acudos",
            chainId: "Loading...",
            myAddress: "Connect Wallet!",
            myBalance: "Connect Wallet!",
            amountToSend: "0",
            addressToSend: "Input Address",
            TxHash: "Send Token First",
            gasUsed: 0,
            gasWanted: 0,
            TxHeight: 0,
            TXResult: "No",
        }
        setTimeout(this.init, 300)
    }

    init = async () => this.getChainID(await StargateClient.connect(this.props.rpcUrl))

    // Get Chain Id
    getChainID = async (client: StargateClient) => {
        const updatedChainId = await client.getChainId()

        this.setState({
            chainId: updatedChainId
        })
    }

    // Adding Chain To Keplr
    ConnectKeplrWallet = async() => {
        const { keplr } = window
        if (!keplr) {
            alert("You need to install or unlock Keplr")
            return
        }
         // Suggest the testnet chain to Keplr
        await window.keplr!.experimentalSuggestChain(this.getTestnetChainInfo())

        // Get the current state
        const { chainId, denom } = this.state
        const { rpcUrl } = this.props

        // Creating a client by connecting to the ChainId
        const offLineSigner = window.getOfflineSigner!(chainId)

        // Connecting to the stargate client
        const signingClient = SigningStargateClient.connectWithSigner(
            rpcUrl,
            offLineSigner,
        )

        // Get my address and balance from the signing client
        const account: AccountData = (await offLineSigner.getAccounts())[0]
        // Update the state of my address and balance
        this.setState({
            myAddress: account.address,
            myBalance: (await (await signingClient).getBalance(account.address, denom)).amount
        })
        console.log("Signing Successfull")
    }

    // Defining Cudos chain 
    getTestnetChainInfo = (): ChainInfo => ({
        chainId: this.state.chainId,
        chainName: this.state.chainId,
        rpc: this.props.rpcUrl,
        rest: this.props.rpcUrl, // Use the same rpcUrl for REST endpoint
        bip44: {
            coinType: 118, // Update with Cudos coinType
        },
        bech32Config: {
            bech32PrefixAccAddr: "cudos",
            bech32PrefixAccPub: "cudos" + "pub",
            bech32PrefixValAddr: "cudos" + "valoper",
            bech32PrefixValPub: "cudos" + "valoperpub",
            bech32PrefixConsAddr: "cudos" + "valcons",
            bech32PrefixConsPub: "cudos" + "valconspub",
        },
        currencies: [
            {
                coinDenom: "CUDOS", 
                coinMinimalDenom: "acudos", 
                coinDecimals: 18, 
                coinGeckoId: "cudos", // Update with the correct CoinGecko ID
            },
        ], 
        feeCurrencies: [
            {
                coinDenom: "CUDOS",
                coinMinimalDenom: "acudos", // Update with Cudos coin denom
                coinDecimals: 18, // Update with Cudos coinDecimals
                coinGeckoId: "cudos",
                gasPriceStep: {
                    low: 1,
                    average: 1,
                    high: 1,
                },
            },
        ],
        stakeCurrency: {
            coinDenom: "CUDOS",
            coinMinimalDenom: "acudos", // Update with Cudos coin denom
            coinDecimals: 18, // Update with Cudos coinDecimals
            coinGeckoId: "cudos",
        },
        coinType: 118, // Update with Cudos coinType
        features: ["stargate", "ibc-transfer", "no-legacy-stdTx"],
    })

    // Update the Amount when it changes
    amountToSendChange = (e: ChangeEvent<HTMLInputElement>) => this.setState({
        amountToSend: e.currentTarget.value
    })

    // Update the Address when it changes
    addressToSendChange = (e: ChangeEvent<HTMLInputElement>) => this.setState({
        addressToSend: e.currentTarget.value
    })

    // Send Token Function
    SendToken = async () => {
        // Get the current state and amount of tokens that we want to transfer
        const { denom, amountToSend, addressToSend, myAddress, TXResult} = this.state
        const { rpcUrl } = this.props 
        console.log("Tx Result", TXResult)

        // const [Txresult, displayResult] = useState(TXResult)

        if(myAddress !== "Connect Wallet!"){
            console.log("Address To send: ", addressToSend)
            if(addressToSend !== "Input Address" && amountToSend !== "0"){

                // Create the signing client
                const offlineSigner: OfflineSigner =
                window.getOfflineSigner!("cudos-testnet-public-3")
                const signingClient = await SigningStargateClient.connectWithSigner(
                    rpcUrl,
                    offlineSigner,
                )

                const account: AccountData = (await offlineSigner.getAccounts())[0]

                // Send Token transaction
                const sendtoken = await signingClient.sendTokens(
                    account.address,
                    addressToSend,
                    [
                        {
                            denom: denom,
                            amount: amountToSend,
                        },
                    ],
                    {
                        amount: [{ denom: "acudos", amount: "500" }],
                        gas: "200000",
                    },
                )
                console.log(sendtoken)
                // Update Balance to the state
                this.setState({
                    myBalance: (await signingClient.getBalance(account.address, denom)).amount,
                    TxHash: sendtoken.transactionHash,
                    gasUsed: sendtoken.gasUsed,
                    gasWanted: sendtoken.gasWanted,
                    TxHeight: sendtoken.height,
                    TXResult: "Yes"
                })

            } else{
                alert("Enter Address and amount above 0")
            }
        } else{
            alert("Connect Wallet First!")
        }
    }

    render() {
        const { denom, chainId, myAddress, myBalance, TxHeight, TxHash, gasWanted, gasUsed, addressToSend, amountToSend, TXResult} = this.state

        return(
            <section className={styles.body}>
                <div className={styles.main}>
                    <h1>Send Cudos Token Dapp with CosmJs</h1>
                    <fieldset className={styles.card}>
                        <legend>Cudos ChainId</legend>
                        <p>{chainId}</p>
                    </fieldset>
                    <fieldset className={styles.card}>
                        <legend>Your Wallet</legend>
                        <p>Address: <span>{myAddress}</span></p>
                        <p>Balance: <span className={styles.balance}>{myBalance}</span></p>
                        <button className={styles.button} onClick={this.ConnectKeplrWallet}>Connect Wallet</button>
                    </fieldset>
                    <fieldset className={styles.card}>
                        <legend>Send Tokens</legend>
                        <br />
                        <input placeholder="Input Address" onChange={this.addressToSendChange} type="text" />
                        <br />
                        <br />
                        <input className={styles.inputAmount} placeholder="Amount" onChange={this.amountToSendChange} type="number" /> 
                        <span className={styles.balance}>{denom}</span>
                        <br />
                        <br />
                        <button className={styles.button} onClick={this.SendToken}>Send</button>
                    </fieldset>
                </div>

                {
                    TXResult === "No" ? <h1>Result is Empty</h1> : 
                    <div className={styles.results}>
                    <h1>Results</h1>
                    <div>
                        <p>From: <span>{myAddress}</span></p>
                        <p>To: <span>{addressToSend}</span></p>
                        <p>Amount Sent: <span>{amountToSend}</span></p>
                        <p>Height: <span>{TxHeight}</span></p>
                        <p>Transaction Hash: <span>{TxHash}</span></p>
                        <p>Gas Used: <span>{gasUsed}</span></p>
                        <p>Gas Wanted: <span>{gasWanted}</span></p>
                    </div>
                </div>
                }
            </section>
        )
    }
}