import ChevronDown from "../../public/images/chevron-down.svg";
import Image from "next/image";
import { useState } from "react";

const SingleFaq = ({ faq }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleHandler = () => setIsVisible(!isVisible);

  return (
    <div className="border border-[#1A1A1A] rounded mb-3 overflow-hidden">
      <div
        className="flex justify-between items-center bg-[#1A1A1A] px-3 py-2 cursor-pointer hover:bg-gray-900"
        onClick={isVisibleHandler}
      >
        <h3 className="md:text-lg">{faq.ques}</h3>
        <div
          className={`transition-all duration-300 ${isVisible && "rotate-180"}`}
        >
          <Image src={ChevronDown} alt="" />
        </div>
      </div>
      {isVisible && <p className="px-2 pt-2 pb-6 text-md">{faq.answer}</p>}
    </div>
  );
};

export default SingleFaq;
