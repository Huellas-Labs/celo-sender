import { uiMetaData } from "../../data";

const {name, siteName, title} = uiMetaData;

const Referral = () => {
  return (
    <div className="bg-[#1A1A1A]">
      <div className="max-w-4xl m-auto px-3 py-6 md:pl-0" data-aos="fade-up">
        <h2 className="text-2xl md:text-3xl font-semibold mb-1 py-1 text-fb">
          Referral system
        </h2>
        <p className="text-sm py-1">
          Earn {title} by referring people to {siteName}
        </p>

        {/*<h1 className="text-fb font-extrabold text-4xl" data-aos="zoom-in">{name} Referral System Coming Soon</h1>*/}
        
        <p className="text-sm py-1">
          Insert the {title} address you would like to receive your {title}
          tokens, and generate your unique referral address.
        </p>
        <p className="text-sm py-1">
          You will earn 300 {title} every time someone uses {name} using
          your unique referral link.
        </p>

        <button className="bg-fb text-black px-4 py-2 rounded-md font-semibold my-3">
          Generate referral link
        </button>
        <br />
        <input
          type="text"
          placeholder={`Input ${title} address`}
          className="bg-black text-white px-4 py-3 rounded-md my-2 md:w-[300px] placeholder-fb"
        /> 
      </div>
    </div>
  );
};

export default Referral;
