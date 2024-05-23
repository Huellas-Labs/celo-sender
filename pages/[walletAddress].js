import Web3 from 'web3';
import Home from './index';

export default function WalletAddressPage(props) {
  return <Home {...props} />;
}

export async function getServerSideProps(context) {
  const { walletAddress } = context.params;

  if (!Web3.utils.isAddress(walletAddress)) {
    return {
      notFound: true,
    };
  }

  return {
    props: {},
  };
}