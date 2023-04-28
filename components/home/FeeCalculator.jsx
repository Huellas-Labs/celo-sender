import BigNumber from "bignumber.js";
import { useState } from "react";
import { CHARGE_VALUE, CHARGE_PER } from "../../config/abi-config";
import { uiMetaData } from "../../data";

const {title} = uiMetaData;

const FeeCalculator = () => {

  const [addrCount, setAddrCount] = useState(CHARGE_PER)
  const [cost, setCost] = useState(CHARGE_VALUE)

  const handleChange = (event) => {
    var num = new Number(event.target.value);
    if (!isNaN(num) && num >= 0) {
      let calcCost = new BigNumber(Math.ceil(Number(new BigNumber(num).dividedBy(new BigNumber(CHARGE_PER))))).multipliedBy(new BigNumber(CHARGE_VALUE));
      setAddrCount(num);
      setCost(Number(calcCost.toFixed(4)));
    }
  }
  
  return (
    <div>
      <div className="max-w-4xl m-auto px-3 py-12 md:pl-0" data-aos="fade-up">
        <h2 className="text-2xl md:text-3xl font-semibold mb-1 py-1 text-fb">
          Fee calculator
        </h2>

        <div className="rounded-md px-8 py-4 bg-[#1A1A1A]">
          <p className="text-sm py-1">Enter the number of addresses:</p>
          <input
            type="text"
            placeholder="1000"
            className="bg-black text-white px-4 py-3 rounded-md my-2 md:w-[400px] placeholder-fb"
            value={addrCount} onChange={($event) => { handleChange($event) }}
          />
          <p className="text-sm py-1">Rate: {CHARGE_VALUE} {title} / {CHARGE_PER} addresses</p>
          <p className="text-sm text-fb">Fees: {cost} {title} + network charges</p>
        </div>
      </div>
    </div>
  );
};

export default FeeCalculator;