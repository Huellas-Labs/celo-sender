import { Fragment, useState, useEffect } from "react";
import Head from 'next/head';
import Link from 'next/link';
import Image from "next/image";
import { tokenData } from '../data/tokenData';
import BigNumber from "bignumber.js";
import toastr from 'toastr';
import { useRouter } from "next/router"
import ERC20_ABI from '../config/abi/erc20.json';
import SENDER_ABI from '../config/abi/sender_abi.json';
import { ADDRESS_SENDER, CHARGE_VALUE, CHARGE_PER, CHAINID } from "../config/abi-config";

const Approval = (props) => {
  const router = useRouter();
  let batchCompleteLen = 0;
  let batchCompleteList = [];

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [isPageTwoBtnDisabled, setIsPageTwoBtnDisabled] = useState(true);
  const [isPageThreeBtnDisabled, setIsPageThreeBtnDisabled] = useState(true);
  const [remainingBalance, setRemainingBalance] = useState();

  const isValidConnection = () => {
    if (!props.connectionDetails.account) {
      return false;
    }
    if (!props.connectionDetails.web3) {
      return false;
    }
    if (CHAINID.indexOf(Number(props.connectionDetails.chainId)) == -1) {
      return false;
    }
    return true;
  }

  useEffect(() => {
    if (props.pastData) {
      console.log("Has DAta:::::::", props.pastData)
      if (props.pastData.selectedTokenDetail['contract_address'] && props.pastData.selectedTokenDetail['contract_ticker_symbol'] != "FTM") {
        console.log("Yes::1")
        setLoading(true);
        setStep(0);
        allowance();
      } else if (!props.pastData.selectedTokenDetail['contract_address'] || props.pastData.selectedTokenDetail['contract_ticker_symbol'] == "FTM") {
        setStep(3)
        setLoading(false);
        setIsPageThreeBtnDisabled(checkDataAtStageThree());
      }
    }
  }, [props.pastData])

  const allowance = () => {
    try {
      if (isValidConnection()) {
        let web3_ERC20 = new props.connectionDetails.web3.eth.Contract(ERC20_ABI, props.pastData.selectedTokenDetail.contract_address);
        web3_ERC20.methods.allowance(props.connectionDetails.account, ADDRESS_SENDER).call().then(async (res) => {
          let temp = props.pastData.selectedTokenDetail;
          let decimal = ((new BigNumber(10)) ** (new BigNumber(temp['contract_decimals'])))

          temp['remaining'] = res;
          temp['remainingBalance'] = (new BigNumber(res)).dividedBy(decimal).toFixed(0);
          let isTokenGretter = (new BigNumber(temp.tokenBalance)).gte(new BigNumber(props.pastData.csvState.uploadTotal));
          let isRemainingGretter = (new BigNumber(temp['remaining'])).gte(new BigNumber(props.pastData.csvState.uploadTotal).multipliedBy(decimal))
          if (isTokenGretter && isRemainingGretter) {
            setTimeout(() => {
              setStep(3)
              setLoading(false);
              setRemainingBalance(temp['remainingBalance'])
              setIsPageThreeBtnDisabled(checkDataAtStageThree());
            }, 1000)
          } else {
            setTimeout(() => {
              setStep(2)
              setLoading(false);
              setRemainingBalance(temp['remainingBalance'])
              setIsPageTwoBtnDisabled((isTokenGretter ? false : true))
            }, 1000)
          }
        }, err => {
          toastr.error(err.message);
          router.push('/')
          // this.setState({ currentScreen: 1 }) Return to main
        })
      } else {
        toastr.info("You are not connected. Please connect your wallet first!")
        router.push('/')
        // this.setState({ currentScreen: 1 }) Return to main
      }
    } catch (error) {
      console.log("Error occure::" + error)
      toastr.error("Somthing went wrong. Please try again.")
      router.push('/')
      // this.setState({ currentScreen: 1 }) Return to main
    }
  }

  const checkDataAtStageThree = () => {
    if (Number(props.pastData.selectedTokenDetail.walletBalance) <= 0) {
      return true;
    }

    if ((props.pastData.csvState.uploadTotal) > Number(props.pastData.selectedTokenDetail.tokenBalance)) {
      return true;
    }

    if (Number(props.pastData.selectedTokenDetail.walletBalance) < (Number(CHARGE_VALUE) + Number(0.0001))) {
      return true;
    }

    return false;
  }

  const toPlainString = (num) => {
    return ('' + +num).replace(/(-?)(\d*)\.?(\d*)e([+-]\d+)/,
      function (a, b, c, d, e) {
        return e < 0
          ? b + '0.' + Array(1 - e - c.length).join(0) + c + d
          : b + c + d + Array(e - d.length + 1).join(0);
      });
  }

  const pageTwoNextClick = () => {
    if (isPageTwoBtnDisabled) {
      return;
    }
    setLoading(true);
    setStep(0)
    approve();
  }

  const approve = () => {
    try {
      if (isValidConnection()) {
        let web3_ERC20 = new props.connectionDetails.web3.eth.Contract(ERC20_ABI, props.pastData.selectedTokenDetail.contract_address);

        let decimal = new BigNumber(10) ** (new BigNumber(props.pastData.selectedTokenDetail['contract_decimals']));
        let valueList = [].concat(props.pastData.csvState.values);
        let total = new BigNumber(0);
        for (let i = 0; i < valueList.length; i++) {
          console.log("======", valueList[i])
          console.log(decimal)
          console.log("BUM::", (new BigNumber(valueList[i])).multipliedBy(decimal).toString())
          total = total.plus((new BigNumber(valueList[i])).multipliedBy(decimal));
        }
        console.log('=========::>>', total.toString())
        console.log(toPlainString(Number(total.toString())))
        web3_ERC20.methods.approve(ADDRESS_SENDER, toPlainString(Number(total.toString()))).send({
          from: props.connectionDetails.account,
          value: 0
        }).then(async (res) => {
          console.log(res)
          setTimeout(() => {
            setStep(3);
            setLoading(false);
            setIsPageThreeBtnDisabled(checkDataAtStageThree());
          }, 1000)
        }, err => {
          console.log(err)
          toastr.error(err.message);
          setStep(2)
          setLoading(false);
        })
      } else {
        toastr.info("You are not connected. Please connect your wallet first!")
        setStep(2)
        setLoading(false);
      }
    } catch (error) {
      console.log(error)
      toastr.error("Error occure::" + error)
      setStep(2)
      setLoading(false);
    }
  }

  const pageThreeNextClick = () => {
    if (isPageThreeBtnDisabled) {
      return;
    }
    setStep(0);
    setLoading(true);
    if (props.pastData.selectedTokenDetail && props.pastData.selectedTokenId && props.pastData.csvState.csvArray && props.pastData.csvState.csvArray.length > 0) {
      if (props.pastData.selectedTokenDetail['contract_address'] && props.pastData.selectedTokenDetail['contract_ticker_symbol'] != "FTM") {
        //console.log("First:3")
        send(3);
      } else if (!props.pastData.selectedTokenDetail['contract_address'] || props.pastData.selectedTokenDetail['contract_ticker_symbol'] == "FTM") {
        //console.log("Second:3")
        send(1)
      }
    } else {
      //console.log("No record found.")
      setStep(3);
      setLoading(true);
    }
  }

  const send = (type) => {
    try {
      if (isValidConnection()) {
        let web3_Main = new props.connectionDetails.web3.eth.Contract(SENDER_ABI, ADDRESS_SENDER);
        let tempDataAddr = [].concat(props.pastData.csvState.addresses);
        let tempDataValue = [].concat(props.pastData.csvState.values);
        for (let i = 0; i < props.pastData.csvState.batchLen; i++) {
          let addressList = tempDataAddr.splice(0, CHARGE_PER);
          let valueList = tempDataValue.splice(0, CHARGE_PER);
          let decimal = (new BigNumber(10) ** new BigNumber(props.pastData.selectedTokenDetail['contract_decimals']));
          let total = new BigNumber(0);
          let decimal18 = new BigNumber("1000000000000000000");
          for (let i = 0; i < valueList.length; i++) {
            let res = new BigNumber(valueList[i].toString()).multipliedBy(decimal);
            total = total.plus(res);
            valueList[i] = "0x" + res.toString(16);
            console.log("utils.hexToNumber", props.connectionDetails.web3.utils.toBN(valueList[i]).toString())
          }
          console.log("valueList[i]", valueList)
          if (type == 1) {
            let fee = (new BigNumber(CHARGE_VALUE)).multipliedBy(decimal);
            total = total.plus(fee);
            web3_Main.methods.multiSendEth(addressList, valueList).send({
              from: props.connectionDetails.account,
              value: total.toString(),
              gasPrice: 0
            }).then(async (res) => {
              // console.log(res)
              batchCompleteList.push(res);
              batchCompleteLen = batchCompleteLen + 1;
              if (props.pastData.csvState.batchLen == batchCompleteLen) {
                setLoading(false)
                setStep(4)
              }
            }, err => {
              console.log("ERROR:::::", err)
              toastr.error(err.message);
              setLoading(false)
              setStep(3)
            })
          } else if (type == 3) {
            let fee = (new BigNumber(CHARGE_VALUE)).multipliedBy(decimal18);
            web3_Main.methods.multiSendToken(props.pastData.selectedTokenDetail.contract_address, addressList, valueList).send({
              from: props.connectionDetails.account,
              value: fee.toString(),
              gasPrice: 0
            }).then(async (res) => {
              batchCompleteList.push(res);
              batchCompleteLen = batchCompleteLen + 1;
              if (props.pastData.csvState.batchLen == batchCompleteLen) {
                setLoading(false)
                setStep(4)
              }
            }, err => {
              toastr.error(err.message);
              setLoading(false)
              setStep(3)
            })
          }
        }
      } else {
        toastr.info("You are not connected. Please connect your wallet first!")
        setLoading(false)
        setStep(3)
      }
    } catch (error) {
      toastr.error("Error occure::" + error)
      setLoading(false)
      setStep(3)
    }
  }

  const getErrorMessage = () => {
    if (!(Number(props.pastData.selectedTokenDetail.walletBalance) > 0)) {
      return '* Insufficient FTM balance';
    } else if (Number(props.pastData.csvState.uploadTotal) > Number(props.pastData.selectedTokenDetail.tokenBalance)) {
      return '* Insufficient token balance';
    } else if (Number(props.pastData.selectedTokenDetail.walletBalance) < (Number(CHARGE_VALUE) + Number(0.001))) {
      return '* Insufficient FTM balance for fee';
    }
  }

  const getLinkList = () => {
    let link = "https://ftmscan.com/tx/";
    return batchCompleteList.map((e, index, key) => {
      return <div key={key} className="bg-black px-4 py-2 flex items-center justify-between rounded-lg shadow my-2">
        <p>Transaction {index + 1} successful</p>
        <p><a href={link + e.transactionHash} target="_blank" rel="noopener noreferrer">Link</a></p>
      </div>;
    })
  }

  const backToHome = () => {
    props.setPastData();
    router.push('/')
  }

  {/* =================== Loading Page ==================== */ }
  if (loading) {
    return <div className="max-w-[939px] mx-auto md:py-16 shadow-lg relative flex">
      <div className="hidden lg:block w-full h-full absolute left-[-220px] top-0">
        <div className="header-bg approval-bg-position"></div>
      </div>

      <div className="w-full md:w-[939px] m-3 md:m-auto bg-[#3c3c3c] px-4 py-20 rounded-lg text-center relative">
        <Image src={tokenData.tokenIcon} alt="" width={191} height={191} />
        <p className="text-xl lg:text-2xl font-semibold my-6">Loading...</p>
        <p className="text-sm">This can take several minutes. Please be patient and do not close this page.</p>
      </div>
    </div>
  }

  return (
    <Fragment>
      <Head>
        <title>{tokenData.tokenName} SENDER</title>
        <meta name="description" content={`${tokenData.tokenName} SENDER`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-[939px] mx-auto md:py-16 shadow-lg relative flex">
        <div className="hidden lg:block w-full h-full absolute left-[-220px] top-0">
          <div className="header-bg approval-bg-position"></div>
        </div>

        <div className="w-full md:w-[939px] m-3 md:m-auto">
          <div className="bg-[#3c3c3c] mb-5  px-8 py-4 rounded-lg relative z-10 text-center" data-aos="zoom-in">
            {/* =================== Step 2: Approval Page ==================== */}
            {step === 2 && <>
              <p className="text-xl lg:text-2xl font-semibold my-4">Approval</p>
              <p className="text-sm">This will authorise the amount of tokens you wish to send - once you have completed this step you will be taken to the next step</p>
              <div className="grid gap-x-2 gap-y-6 grid-cols-2 md:grid-cols-3 mt-8 mb-4">
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{remainingBalance}</p>
                  <p className="text-xs">Your current {tokenData.tokenName} SENDER approval</p>
                </div>
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{props.pastData.csvState.uploadTotal.toLocaleString('fullwide', { useGrouping: false })}</p>
                  <p className="text-xs">Total number of tokens to send</p>
                </div>
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{props.pastData.selectedTokenDetail.tokenBalance}</p>
                  <p className="text-xs">Your token balance</p>
                </div>
              </div>
              <p className="text-lg token-text">{(props.pastData.selectedTokenDetail.tokenBalance >= props.pastData.csvState.uploadTotal) ? '' : '* Insufficient token balance'}</p>
              <div className="mb-">
                <button onClick={() => { router.push('/') }} className="token-btn-bg text-lg token-btn-color  px-16 py-2 rounded-lg font-semibold my-3 md:text-base">Back</button>
                <button disabled={isPageTwoBtnDisabled} onClick={() => pageTwoNextClick()} className="token-btn-bg text-lg token-btn-color ml-2 px-16 py-2 rounded-lg font-semibold my-3 md:text-base">Next</button>
              </div>
            </>}

            {/* =================== Step 3: Send Tokens ==================== */}
            {step === 3 && <>
              <p className="text-xl lg:text-2xl font-semibold my-4">Send tokens</p>
              <p className="text-sm">Check your {tokenData.tokenName} send information below, one happy all the information is correct, click send to confirm your transactions.</p>
              <div className="grid gap-x-2 gap-y-6 grid-cols-2 md:grid-cols-3 mt-8 mb-4">
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{props?.pastData?.csvState?.csvArray ? props?.pastData?.csvState?.csvArray.length : 0}</p>
                  <p className="text-xs">Total number of addresses</p>
                </div>
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{props?.pastData?.csvState?.uploadTotal.toLocaleString('fullwide', { useGrouping: false })}</p>
                  <p className="text-xs">Total number of tokens to send</p>
                </div>
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{props?.pastData?.selectedTokenDetail.tokenBalance}</p>
                  <p className="text-xs">Your token balance</p>
                </div>
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{props?.pastData?.csvState?.batchLen}</p>
                  <p className="text-xs">Total number of transactions needed</p>
                </div>
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{props?.pastData?.selectedTokenDetail.walletBalance}</p>
                  <p className="text-xs">Your {tokenData.tokenNameShort} balance</p>
                </div>
                <div className="bg-black p-4 rounded-lg shadow text-center">
                  <p className="text-2xl token-text font-semibold my-1">{props?.pastData?.csvState?.batchLen * CHARGE_VALUE} FTM + network fees</p>
                  <p className="text-xs">Cost of operation</p>
                </div>
              </div>
              <p className="text-lg token-text">{getErrorMessage()}</p>
              <div className="mb-">
                <button className="token-btn-bg text-lg token-btn-color px-16 py-2 rounded-lg font-semibold my-3 md:text-base" onClick={() => setStep(2)}>Back</button>
                <button className="token-btn-bg text-lg token-btn-color ml-2 px-16 py-2 rounded-lg font-semibold my-3 md:text-base" disabled={isPageThreeBtnDisabled} onClick={() => pageThreeNextClick()}>Next</button>
              </div>
            </>}

            {/* ================ Step 4: Confirmation Page =================== */}
            {step === 4 &&
              <>
                <p className="text-xl lg:text-2xl font-semibold mb-4">Congratulations! {tokenData.tokenName} send complete.</p>
                <p className="text-sm">View your transactions on the {tokenData.tokenName} explorer</p>
                {getLinkList()}
                <button onClick={() => { backToHome() }} className="token-btn-bg text-lg token-btn-color  px-6 py-2 rounded-lg font-semibold my-3 md:text-base">
                  Return to home
                  </button>
              </>
            }
          </div>
        </div>
      </div>
    </Fragment>
  )
}

export default Approval;