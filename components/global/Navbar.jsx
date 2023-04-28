import { Fragment } from "react";
import CeloIcon from "../../public/images/celo-logo.svg";
import Image from "next/image";
import Link from "next/link";
import { SocialData, uiMetaData } from "../../data";

const {title} = uiMetaData;

const Navbar = (props) => {
  const connectWallet = () => props.connectWallet();

  const idShortner = (address) => {
    if (address) {
      return (
        address.slice(0, 3) +
        "..." +
        address.slice(address.length - 4, address.length)
      );
    } else {
      return "";
    }
  };

  return (
    <Fragment>
      <nav className="bg-[#1A1A1A] shadow-xl z-10">
      <div className="max-w-6xl m-auto">
          <div className="flex flex-col md:flex-row items-center justify-between py-7">
            <div className="hidden lg:flex items-center">
              {SocialData?.map((social, i) => (
                <a
                  key={i}
                  href={social.link}
                  rel="noreferrer"
                  target="_blank"
                  className="mr-3"
                >
                  <Image src={social.icon} alt="" />
                </a>
              ))}
            </div>

            <Link href="/">
              <div className="flex items-center h-4 mb-5 md:mb-0 cursor-pointer">
                <Image src={CeloIcon} alt="" width={35} />
                <div className="text-4xl ml-1">
                  <h1 className="uppercase">{title}
                    <span className="text-fb">SENDER</span>
                  </h1>
                </div>
              </div>
            </Link>

            {!props.connectionDetails.account ? (
              <button className="wallet-button" onClick={connectWallet}>
                <span className="wallet-button-border"></span>Connect Wallet
              </button>
            ) : (
              <button className="wallet-button">
                <span className="wallet-button-border"></span>
                {idShortner(props.connectionDetails.account)}
              </button>
            )}
          </div>
        </div>
      </nav>
    </Fragment>
  );
};

export default Navbar;
