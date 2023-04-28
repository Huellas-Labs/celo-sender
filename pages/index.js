import Head from "next/head";
import { Fragment } from "react";
import Faqs from "../components/home/Faqs";
import FeeCalculator from "../components/home/FeeCalculator";
import HomeHeader from "../components/home/HomeHeader";
import Referral from "../components/home/Referral";
import TutorialVideo from "../components/home/TutorialVideo";
import { faqsData, uiMetaData } from "../data";

const {name} = uiMetaData;

export default function Home(props) {
  return (
    <Fragment>
      <Head>
        <title>{name}</title>
        <meta name="description" content={`${name} is a tool for distributing FTM tokens to multiple wallet
                addresses from a CSV or TXT file`} />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <HomeHeader {...props} />
      <TutorialVideo />
      <FeeCalculator />
      <Referral />
      <Faqs faqs={faqsData} />
    </Fragment>
  );
}
