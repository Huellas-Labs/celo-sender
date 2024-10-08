import "../styles/globals.css";
import "../styles/other.css";
import '../styles/toastr.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useState, useEffect } from "react";
import Navbar from "../components/global/Navbar";
import Footer from "../components/global/Footer";

import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import walletLinkModule from "@web3-onboard/walletlink";
import Web3 from 'web3';
import { CHAINID, RPC, CHAINID_HEX } from '../config/abi-config';
import { uiMetaData } from "../data";
import { useRouter } from "next/router";

const { wallet, tokenSymbol } = uiMetaData;

const injected = injectedModule();
const walletConnect = walletConnectModule();
const walletLink = walletLinkModule();

const onboard = Onboard({
  wallets: [walletLink, walletConnect, injected],
  chains: [
    {
      id: CHAINID_HEX, // chain ID must be in hexadecimel
      token: tokenSymbol, // main chain token
      namespace: "evm",
      label: "Moonbeam",
      rpcUrl: RPC,
    }
  ],
  appMetadata: {
    name: wallet.name,
    icon: wallet.icon,
    logo: wallet.logo,
    description: wallet.description,
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
  accountCenter: {
    desktop: {
      enabled: false,
    },
  },
});

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [account, setAccount] = useState();
  const [error, setError] = useState("");
  const [provider, setProvider] = useState();
  const [web3, setWeb3] = useState();
  const [chainId, setChainId] = useState();
  const [network, setNetwork] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [pastData, setPastData] = useState(null);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const wallets = await onboard.connectWallet();
      const { accounts, chains, provider } = wallets[0];
      let web3 = new Web3(provider);
      setWeb3(web3);
      setAccount(accounts[0].address);
      setProvider(provider);
      if (CHAINID.indexOf(Number(chains[0].id)) == -1) {
        switchNetworkToMainnet(provider, CHAINID[0]);
        return;
      }
      setChainId(chains[0].id);
      setIsLoading(false);
    } catch (error) {
      setError(error);
    }
  };

  const switchNetworkToMainnet = async (provider, chainId) => {
    if (provider) {
      setChainId(chainId);
      try {
        await provider.request({ method: "eth_requestAccounts" });
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: CHAINID_HEX,
              chainName: 'Celo Mainnet',
              nativeCurrency: {
                name: 'Celo Mainnet',
                symbol: tokenSymbol,
                decimals: 18
              },
              rpcUrls: [RPC],
            },
          ]
        })
      } catch (error) {
        if (error.code === 4902) {
          try {
            await provider
              .request({
                method: 'wallet_addEthereumChain',
                params: [CHAINID_HEX],
              });
          } catch (error) {
            toastr.error(error.message);
          }
        }
      }
    }
  }

  useEffect(() => {
    if (!account) router.push('/')
  }, [account])

  useEffect(() => {
    AOS.init({
      duration: 1200,
    })
  }, []);

  return (
    <div className="bg-black text-white flex flex-col justify-between h-screen">
      <Navbar
        connectWallet={connectWallet}
        connectionDetails={{
          account,
          error,
          chainId,
          provider,
          network,
          isLoading,
        }}
      />
      <Component {...pageProps} connectionDetails={{ account, error, chainId, provider, network, isLoading, web3 }}
        pastData={pastData}
        setPastData={setPastData}
      />
      <Footer />
    </div>
  );
}

export default MyApp;
