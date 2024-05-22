import Image from "next/image";
import { uiMetaData } from "../../data";
import { useState } from "react";
import Web3 from "web3";

const { name, siteName, title } = uiMetaData;

const Referral = () => {
  const [value, setValue] = useState("");
  const [referalLink, setReferalLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const generateRef = () => {
    if (Web3.utils.isAddress(value)) {
      setErrorMsg('');
      const refLink = `${process.env.NEXT_PUBLIC_LIVE_URL}${value.toLowerCase()}`;
      setReferalLink(refLink);
    } else {
      setErrorMsg('Please enter a valid wallet Address');
    }
  };
  return (
    <div className="bg-[#1A1A1A]">
      <div className="max-w-4xl m-auto px-3 py-6 md:pl-0" data-aos="fade-up">
        <h2 className="text-2xl md:text-3xl font-semibold mb-1 py-1 text-fb">
          Referral system
        </h2>
        <p className="text-sm py-1">
          Earn {title} by referring people to {siteName}
        </p>

        <p className="text-sm py-1">
          Insert the {title} address you would like to receive your {title}
          tokens, and generate your unique referral address.
        </p>
        <p className="text-sm py-1">
          You will earn 300 {title} every time someone uses {name} using
          your unique referral link.
        </p>

        {!referalLink ? <><button className="bg-fb text-black px-4 py-2 rounded-md font-semibold my-3" onClick={() => generateRef()}>
          Generate referral link
        </button>
          <br />
          <input
            type="text"
            placeholder={`Input ${title} address`}
            className="bg-black text-white px-4 py-3 rounded-md my-2 md:w-[300px] placeholder-fb"
            onChange={(e) => setValue(e.target.value)}
          />
          {errorMsg && <p className="text-red-700 font-bold mt-2 ml-1">{errorMsg}</p>}
        </> : <div>
          <button className="bg-fb text-black font-semibold rounded-md py-2 px-4 my-3 flex gap-2 items-center" data-aos="fade-up" onClick={() => window.open(referalLink, '_blank')}>
            Share referral link <Image src="/images/send.png" alt="" width={18} height={18} />
          </button>
        </div>}
      </div>
    </div>
  );
};

export default Referral;
