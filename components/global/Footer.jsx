import { SocialData, uiMetaData } from "../../data"
import Image from "next/image";

const { name } = uiMetaData;

const Footer = () => {
  return (
    <footer className="bg-[#1A1A1A] text-center px-3 py-6 text-sm">
      © Copyright {name} {new Date().getFullYear()}. All Rights Reserved |{" "}
      <a href="/Privacy-Policy-Fantom-Sender.pdf" target="_blank"><span className="text-fb">Privacy Policy</span></a>
      <span>{" "}|{" "}</span>
      <span className="text-fb">Blogs</span>
      <div className="flex items-center justify-center md:hidden my-2">
        {SocialData?.map((social, i) => (
          <a
            key={i}
            href={social.link}
            rel="noreferrer"
            target="_blank"
            className="mr-3"
          >
            <Image src={social.icon} alt="" height={18} />
          </a>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
