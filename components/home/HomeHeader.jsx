import BigNumber from "bignumber.js";
import { Fragment, useEffect, useRef, useState } from "react"
import Web3 from "web3";
import _ from 'lodash';
import axios from "axios";
import $ from 'jquery';
import toastr from 'toastr';
import { useRouter } from "next/router"
import { CHAINID, CHARGE_PER } from "../../config/abi-config";
import { uiMetaData } from "../../data";

const styles = {
    btnGradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-yellow-500"
}

const {name, tokenSymbol, inputTokenText, styles: uiStyle} = uiMetaData;

const HomeHeader = (props) => {
    const router = useRouter();
    const fileInput = useRef();
    const textareaNum = useRef(null);
    const [csvState, setCsvState] = useState({
        isPageOneBtnDisabled: true,
        batchLen: 0,
        csvData: null,
        csvArray: [],
        uploadTotal: 0,
        addresses: [],
        values: [],
        duplicateAddr: [],
        invalidRows: [],
        isViewChange: false,
    });
    const [tokenList, setTokenList] = useState(null);
    const [selectedTokenDetail, setSelectedTokenDetail] = useState(null);
    const [selectedTokenId, setSelectedTokenId] = useState(null);

    useEffect(() => {
        if (props.pastData) {
            console.log("Has DAta:::::::", props.pastData)
            setCsvState(props.pastData?.csvState)
            setSelectedTokenDetail(props.pastData?.selectedTokenDetail)
            setSelectedTokenId(props.pastData?.selectedTokenDetail)
            setTimeout(async () => {
                append_line_numbers('textarea-num')
            });
        }
    }, [props.pastData]);

    useEffect(() => {
        getTokensInAccount()
    }, [props.connectionDetails.account]);

    const handleFileUpload = (files, event) => {
        console.log("first-files> ", files);
        if (files.length == 1) {
            const re = /(\.txt|\.csv)$/i;
            if (!re.exec(files[0].name)) {
                alert("File extension not supported! Please upload TXT or CSV file.");
                // toastr.error("File extension not supported! Please upload TXT or CSV file.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = async () => {
                let csvData = new TextDecoder("utf-8").decode(reader.result);

                setCsvState(prevState => ({
                    ...prevState,
                    batchLen: 0,
                    csvData: null,
                    csvArray: [],
                    uploadTotal: 0,
                    addresses: [],
                    values: [],
                    isViewChange: true,
                }))

                await onValidateInputs(csvData)
                setTimeout(async () => {
                    await append_line_numbers('textarea-num');
                })
            }
            reader.readAsArrayBuffer(files[0]);
            fileInput.value = "";
        } else {
            alert("Multiple file upload not possible.")
            // toastr.error("Multiple file upload not possible.")
        }
    }

    const onValidateInputs = (csvData) => {
        if (!csvData) {
            setCsvState(prevState => ({
                ...prevState,
                isPageOneBtnDisabled: true,
                batchLen: 0,
                csvData: csvData,
                csvArray: [],
                uploadTotal: 0,
                addresses: [],
                values: [],
                duplicateAddr: [],
                invalidRows: []
            }));
            return false;
        }
        let allValuesValid = null;
        let values = null;

        const csvArray = csvDataToArrays(csvData) || [];
        const addresses = csvArray.map((vals) => vals[0].trim());

        try {
            values = csvArray.map(vals => {
                if (vals.length === 1) return "-1"; // No value has been supplied
                if (vals.length === 2 && !vals[1]) return "-1"; // Empty value supplied
                if (vals.length > 2) return "-1"; // Too many delimiters / values supplied
                return vals[1];
            })

            const invalidValues = values.filter(
                (value) => value.toString() === "-1"
            );
            allValuesValid = !invalidValues.length;
        } catch (e) {
            allValuesValid = false;
        }

        let allAddressesValid = addresses.every((addrToCheck) => {
            if (!addrToCheck) return false;
            try {
                //console.log(addrToCheck)
                let web3 = new Web3();
                return web3.utils.isAddress(addrToCheck);
            } catch (e) {
                //console.error(e);
                return false;
            }
        })

        let valid = allAddressesValid && allValuesValid;
        let duplicateAddr = duplicateAddresses(csvArray);

        if (valid) {
            let totalValue = new BigNumber(0);
            for (let i = 0; i < values.length; i++) {
                totalValue = totalValue.plus(new BigNumber(values[i]));
                //console.log(totalValue)
            }
            totalValue = Number(totalValue);
            let batchLen = Math.ceil(values.length / CHARGE_PER);
            setCsvState(prevState => ({
                ...prevState,
                isPageOneBtnDisabled: selectedTokenId != -1 ? false : true,
                batchLen: batchLen,
                csvData: csvData,
                csvArray: csvArray,
                uploadTotal: totalValue,
                addresses: addresses,
                values: values,
                duplicateAddr: duplicateAddr,
                invalidRows: []
            }));
            console.log(batchLen);
        } else {
            let invalidRowItems = invalidRows(csvArray);
            setCsvState(prevState => ({
                ...prevState,
                isPageOneBtnDisabled: true,
                csvData: csvData,
                csvArray: csvArray,
                duplicateAddr: duplicateAddr,
                invalidRows: invalidRowItems
            }))
        }
    }

    const csvDataToArrays = (data) => {
        return data.split("\n").map((v) => {
            if (v.includes('\r')) {
                v = v.replace(/(\r\n|\n|\r)/gm, '')
            }
            return v.split(",")
        });
    }

    const duplicateAddresses = (csvArray) => {
        const duplicateAddresses = [];
        const addressCount = {};
        csvDataFilteredForValidRowsOnly(csvArray).forEach((row, idx) => {
            const address = row[0];
            if (!addressCount[address]) {
                addressCount[address] = 1;
            } else if (addressCount[address] === 1) {
                duplicateAddresses.push(address);
                addressCount[address] = addressCount[address] + 1;
            }
        });

        return duplicateAddresses;
    }

    const csvDataFilteredForValidRowsOnly = (csvArray) => {
        return csvArray.filter((row) => {
            // Row invalid if true
            if (row.length === 1) {
                return false;
            }

            if (row.length === 2 && !row[1]) {
                // Empty value supplied
                return false;
            }

            if (row.length > 2) return false;

            const address = row[0] && row[0].trim() ? row[0].trim() : null;
            if (!address) return false;
            try {
                let web3 = new Web3();
                return web3.utils.isAddress(address);
            } catch (e) {
                return false;
            }
        });
    }

    const invalidRows = (csvArray) => {
        const validRows = [];
        const invalidRows = [];
        csvArray.forEach((row, idx) => {
            // Row invalid if true
            if (row.length === 1) {
                invalidRows.push([
                    row[0] && row[0].trim() ? row[0].trim() : "Unknown",
                    "Unknown",
                    idx + 1,
                ]);
                return;
            }

            // Check address
            const address = row[0] && row[0].trim() ? row[0].trim() : null;
            if (!address) {
                invalidRows.push([...row, idx + 1]);
                return;
            }

            try {
                let web3 = new Web3();
                let isValid = web3.utils.isAddress(address);
                if (!isValid) {
                    invalidRows.push([...row, idx + 1]);
                }
            } catch (e) {
                invalidRows.push([...row, idx + 1]);
                return;
            }

            //Validate value supplied
            if (row.length === 2 && !row[1]) {
                // Empty value supplied
                invalidRows.push([row[0], "Unknown", idx + 1]);
                return;
            }

            if (row.length > 2) {
                // Too many delimiters / values supplied
                invalidRows.push(["Unknown", "Unknown", idx + 1]);
                return;
            }
        })
        return invalidRows;
    }

    const eventList = {};
    const append_line_numbers = (id) => {
        const ta = document.getElementById(id);
        console.log(ta, id, textareaNum.current);
        if (ta == null) {
            return;
        }
        if (ta.className.indexOf("my-num-active") != -1) { return; }
        ta.classList.add("my-num-active");
        ta.style = {};

        // Create line numbers wrapper, insert it before <textarea>
        const el = document.createElement("div");
        el.className = "my-num-wrapper";
        el.id = "text-nums"
        console.log("elm: ", el);
        ta.parentNode.insertBefore(el, ta);
        // Call update to actually insert line numbers to the wrapper
        update_line_numbers(ta, el);
        eventList[id] = [];

        // Constant list of input event names so we can iterate
        const __change_evts = [
            "propertychange", "input", "keydown", "keyup"
        ];

        let that = this;
        // Default handler for input events
        const __change_hdlr = function (ta, el) {
            return function (e) {
                if ((+ta.scrollLeft == 10 && (e.keyCode == 37 || e.which == 37
                    || e.code == "ArrowLeft" || e.key == "ArrowLeft"))
                    || e.keyCode == 36 || e.which == 36 || e.code == "Home" || e.key == "Home"
                    || e.keyCode == 13 || e.which == 13 || e.code == "Enter" || e.key == "Enter"
                    || e.code == "NumpadEnter")
                    ta.scrollLeft = 0;
                update_line_numbers(ta, el);
            }
        }(ta, el);

        for (let i = __change_evts.length - 1; i >= 0; i--) {
            ta.addEventListener(__change_evts[i], __change_hdlr);
            eventList[id].push({
                evt: __change_evts[i],
                hdlr: __change_hdlr
            });
        }

        // Constant list of scroll event names so we can iterate
        const __scroll_evts = ["change", "mousewheel", "scroll"];
        // Default handler for scroll events (pretty self explanatory)
        const __scroll_hdlr = function (ta, el) {
            return function () { el.scrollTop = ta.scrollTop; }
        }(ta, el);
        // Just like before, iterate and add listeners to <textarea> and to list
        /// TODO: Also just like before: performance?
        for (let i = __scroll_evts.length - 1; i >= 0; i--) {
            ta.addEventListener(__scroll_evts[i], __scroll_hdlr);
            eventList[id].push({
                evt: __scroll_evts[i],
                hdlr: __scroll_hdlr
            });
        }
    }

    const update_line_numbers = (ta, el) => {
        // Let's check if there are more or less lines than before
        const line_count = ta.value.split("\n").length;
        const child_count = el?.children.length;
        let difference = line_count - child_count;
        // If there is any positive difference, we need to add more line numbers
        if (difference > 0) {
            // Create a fragment to work with so we only have to update DOM once
            const frag = document.createDocumentFragment();
            // For each new line we need to add,
            while (difference > 0) {
                // Create a <span>, add class name, append to fragment and
                // update difference
                const line_number = document.createElement("span");
                line_number.className = "my-num-line";
                line_number.innerText = `${line_count - difference + 1}`;
                frag.appendChild(line_number);
                difference--;
            }
            // Append fragment (with <span> children) to our wrapper element
            el.appendChild(frag);
        }
        // If, however, there's negative difference, we need to remove line numbers
        while (difference < 0) {
            // Simple stuff, remove last child and update difference
            el.removeChild(el.lastChild);
            difference++;
        }
    }

    const csvTextDataChange = async (e) => {
        setCsvState(prevState => ({
            ...prevState,
            csvData: e.target.value
        }))
        await onValidateInputs(e.target.value)
    }

    const getDuplicateAddr = () => {
        return csvState.duplicateAddr.map((e, i) => {
            return <tr key={i} className="odd:bg-red-400">
                <td className="p-2 text-left text-sm sm:text-base">{e}</td>
            </tr>
        })
    }

    const getInvalidRows = () => {
        return csvState.invalidRows.map((e, i) => {
            return (<tr key={i} className="odd:bg-red-400">
                <td className="p-2 text-left text-sm sm:text-base">{e[0]}</td>
                <td className="p-2 text-left text-sm sm:text-base">{e[1]}</td>
                <td className="p-2 text-left text-sm sm:text-base">{e[2]}</td>
            </tr>)
        })
    }

    const removeInvalidRows = () => {
        let csvData = csvArrayToString(
            csvDataFilteredForValidRowsOnly(csvState.csvArray)
        );
        onValidateInputs(csvData);
        setTimeout(() => {
            const ta = document.getElementById('textarea-num');
            const el = document.getElementById("text-nums");
            update_line_numbers(ta, el);
        }, 100)

    }

    const csvArrayToString = (csvArray) => {
        return _.join(
            csvArray.map((row) => _.join(row, ",")),
            "\n"
        );
    }

    const keepFirstAddressFromAddressDuplicates = () => {
        const firstAddressFound = {};
        const csvDataWithFirstDuplicateKept = csvDataFilteredForValidRowsOnly(csvState.csvArray).filter(
            (row) => {
                const address = row[0];
                let include = true;
                if (!firstAddressFound[address]) {
                    firstAddressFound[address] = true;
                } else {
                    include = !_.includes(duplicateAddresses(csvState.csvArray), row[0]);
                }

                return include;
            }
        );
        let csvData = csvArrayToString(csvDataWithFirstDuplicateKept);
        onValidateInputs(csvData);
        let ele = document.getElementById("upload");
        window.scrollTo(ele?.offsetLeft, ele?.offsetTop);
    }

    const combineBalancesFromAddressDuplicates = () => {
        const totalBalances = {};
        csvDataFilteredForValidRowsOnly(csvState.csvArray).forEach((row) => {
            const address = row[0];
            const value = parseFloat(row[1]);

            if (!totalBalances[address]) {
                totalBalances[address] = value;
            } else {
                totalBalances[address] = totalBalances[address] + value;
            }
        });

        let csvData = csvArrayToString(
            Object.keys(totalBalances).map((address) => [
                address,
                totalBalances[address],
            ])
        );
        onValidateInputs(csvData);
    }

    const changeView = (isViewChange) => {
        checkConnection()
        setCsvState(prevState => ({
            ...prevState,
            isPageOneBtnDisabled: true,
            batchLen: 0,
            csvData: null,
            csvArray: [],
            uploadTotal: 0,
            addresses: [],
            values: [],
            duplicateAddr: [],
            invalidRows: [],
            isViewChange: isViewChange
        }), canLoad(isViewChange));
    }

    const checkConnection = () => { }

    const canLoad = (isViewChange) => {
        if (isViewChange) {
            setTimeout(() => {
                append_line_numbers('textarea-num')
            })
        }
    }

    const getTokensInAccount = async () => {
        if (!props.connectionDetails.account) return;
        if (CHAINID.indexOf(Number(props.connectionDetails.chainId)) == -1) return;

        let rootPath = 'https://api.covalenthq.com/v1/' + Number(props.connectionDetails.chainId) + '/address/' + props.connectionDetails.account + '/balances_v2/?key=' + process.env.NEXT_PUBLIC_COVALENTHQ_API_KEY;

        console.log(`Using ${rootPath}`);
        const { data } = await axios.get(`${rootPath}`, {
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
        if (data && data.data && data.data.items) {
            let tempData = [];
            for (let obj of data.data.items) {
                if (obj.contract_address == '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
                    tempData = [obj].concat(tempData)//tempData.splice(0, 0, obj)
                } else {
                    tempData.push(obj);
                }
            }
            setTokenList(tempData)
        }
    }

    const getSelectOptionsToken = (list) => {
        if (!list || (list && list.length <= 0)) {
            return;
        }
        return list.map((e, key) => {
            return <option key={key} value={e.contract_ticker_symbol}>{e.contract_name} ({e.contract_ticker_symbol})</option>;
        })
    }

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

    const changeToken = async (e) => {
        // console.log(e.target.value)
        if (e.target.value == -1) {
            toastr.error("Please select valid token.")
            setIsPageOneBtnDisabled(true);
            return;
        }
        if (!isValidConnection()) {
            return;
        }
        let selectedToken = {};
        let token = e.target.value;
        let temp = await props.connectionDetails.web3.eth.getBalance(props.connectionDetails.account);

        let walletBalance = Number((Number(props.connectionDetails.web3.utils.fromWei((temp).toString(), "ether"))).toFixed(6));
        let i = 0;
        for (let obj of tokenList) {
            if (obj.contract_ticker_symbol == token) {
                selectedToken = obj;
                selectedToken['index'] = i;
                selectedToken['walletBalance'] = walletBalance;
                let tokenBalance = (new BigNumber(selectedToken['balance'])).dividedBy(new BigNumber(10) ** new BigNumber(selectedToken['contract_decimals']));
                selectedToken['tokenBalance'] = tokenBalance.toFixed(2);
                break;
            }
            i = i + 1;
        }
        setCsvState(prevState => ({
            ...prevState,
            isPageOneBtnDisabled: (csvState.csvArray && csvState.csvArray.length > 0) ? false : true,
        }))
        setSelectedTokenId(token)
        setSelectedTokenDetail(selectedToken)
    }

    const downloadSample = (type) => {
        //console.log("Download sample.");
        const rows = [
            ["0x67361A524Df98Af1dE26808E27d0E74A1F0b7a4F", "0.13"],
            ["0x8B14BEb458b885de64A16e5e9576729da38A28D0", "0.16"],
            ["0xcD43d0BD50B26F2E0064F77114DD0e5528c456d8", "0.99"],
            ["0xd360056DC45ab107d283c785ACdb87Efd4323646", "1.890"]
        ];

        let csvContent = type == 'csv' ? "data:text/csv;charset=utf-8," : "data:text/txt;charset=utf-8,";

        rows.forEach(function (rowArray) {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sample." + type);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const pageOneNextClick = () => {
        if (csvState.isPageOneBtnDisabled) {
            return;
        }
        if (selectedTokenDetail && selectedTokenId && csvState.csvArray && csvState.csvArray.length > 0) {
            props.setPastData({
                'csvState': csvState,
                'selectedTokenDetail': selectedTokenDetail,
                'selectedTokenId': selectedTokenId,
            })
            router.push('/approval')
        } else {
            //console.log("No uploaded data found.");
            toastr.error("Something went wrong.")
        }
    }

    const removeTexts = () => {
        const ta = document.querySelectorAll(".my-num-wrapper");
        ta.forEach((e) => {
            e.style.display = "none";
        });
        
        const ta2 = document.querySelectorAll(".my-num-line");
        ta2.forEach((e) => {
            e.style.display = "none";
        });
        changeView(false);
    }

    return (
        <Fragment>
            <p className="bg-[#1A1A1A] text-center px-2 py-4 text-sm mt-1" data-aos="zoom-in">
                {name} is a tool for distributing {tokenSymbol} tokens to multiple wallet
                addresses from a CSV or TXT file
            </p>

            <div>
                <div className="max-w-[939px] m-2 md:m-auto md:py-16 shadow-lg relative mb-[68px] md:mb-14">
                    <div className="hidden lg:block w-full h-full absolute left-[-240px] top-0">
                        <div className="header-bg header-bg-position" data-aos="zoom-in"></div>
                    </div>

                    <div className="bg-[#3c3c3c] mb-5  px-8 py-2 top-11 rounded-lg relative z-10" data-aos="fade-left">
                        <div className="text-center py-3">
                            <h3 className="text-xl md:text-2xl font-semibold">Get started here</h3>
                            <p className="text-sm">Select token and add data to proceed</p>
                        </div>

                        <select name="" id="" className="bg-black text-white px-4 py-3 rounded-md mt-4 mb-6 w-full border border-fb" value={selectedTokenDetail ? selectedTokenDetail['contract_ticker_symbol'] : -1} onChange={(e) => changeToken(e)}>
                            <option key={-1} value={-1}>Select a Token</option>
                            {getSelectOptionsToken(tokenList)}
                        </select>

                        <div className="block md:flex items-center justify-between">
                            <div className="box-data">
                                <label htmlFor="token" className="block">Token</label>
                                <div className="tbx w-full md:w-96 bg-black text-lg placeholder:text-white  font-medium px-6 py-4 rounded-lg my-2 text-fb">
                                    <span>{selectedTokenDetail?.contract_name ? selectedTokenDetail?.contract_name + "(" + selectedTokenDetail?.contract_ticker_symbol + ")" : inputTokenText}</span>
                                </div>
                            </div>
                            <div className="box-data">
                                <label htmlFor="decimals" className="block">Decimals</label>
                                <div className="tbx w-full md:w-96 bg-black text-lg placeholder:text-white  font-medium px-6 py-4 rounded-lg my-2 text-fb">
                                    <span>{selectedTokenDetail?.contract_decimals ? selectedTokenDetail?.contract_decimals : 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black p-4 rounded-md mt-4 h-52 flex flex-col items-center justify-center relative">
                            {!csvState.isViewChange ? <div className="w-full h-full flex flex-col items-center justify-center relative">
                                <p className="text-lg font-medium">Drag {"&"} drop the CSV</p>
                                <p className="text-sm">.. or click to select a file from your computer</p>
                                <input
                                    type="file"
                                    className="absolute top-0 left-0 w-full h-full cursor-pointer opacity-0"
                                    onChange={(event) => { handleFileUpload(event.target.files, event) }}
                                />
                            </div> : <div className="w-full h-full">
                                <textarea
                                    id="textarea-num"
                                    className="w-full h-full flex flex-col items-center justify-center resize-none bg-gray-900"
                                    value={csvState.csvData}
                                    onChange={e => { csvTextDataChange(e) }}
                                    ref={textareaNum}
                                ></textarea>
                            </div>}
                        </div>

                        <div className="flex justify-end">
                            {csvState.isViewChange
                                ? <button className="text-fb" onClick={removeTexts}>Upload File</button>
                                : <button className="text-fb" onClick={() => changeView(true)}>Insert manually</button>}
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between my-4">
                            <input type="file" id="file_upload" ref={_fileInput => (fileInput = _fileInput)} style={{ display: 'none' }} onChange={(event) => { handleFileUpload(event.target.files, event) }} />
                            <button
                                className="bg-fb text-black px-8 py-2 rounded-md font-semibold my-3 text-sm md:text-base"
                                onClick={() => { $('#file_upload').trigger('click') }}>
                                Upload CSV
                        </button>

                            <p>
                                Download Sample &nbsp;
                            <button className="text-fb underline" onClick={() => { downloadSample('csv') }} >CSV</button>
                            &nbsp;/&nbsp;
                            <button className="text-fb underline" onClick={() => { downloadSample('txt') }} >TXT</button>
                            </p>
                        </div>

                        {(csvState.invalidRows && csvState.invalidRows.length > 0) ? <div className="px-3 py-4 bg-red-200 rounded">
                            <div className="text-red-600 text-sm font-semibold">
                                The following rows will not be part of the {name} as they are invalid:
                        </div>

                            <table className="my-3 w-full text-gray-900 border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-2 text-left text-sm sm:text-base">Address</th>
                                        <th className="p-2 text-left text-sm sm:text-base">Value</th>
                                        <th className="p-2 text-left text-sm sm:text-base">Line</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getInvalidRows()}
                                </tbody>
                            </table>

                            <button
                                className={`${styles.btnGradient} px-4 py-2 rounded font-semibold`}
                                onClick={removeInvalidRows}
                            >Delete Invalids</button>
                        </div> : ''}

                        {(csvState.duplicateAddr && csvState.duplicateAddr.length > 0) ? <div className="bg-red-200 rounded px-4 py-2 mt-4">
                            <p className="text-red-600">Duplicate addresses have been found:</p>

                            <table className="my-3 w-full text-gray-900 border-collapse">
                                <tbody>
                                    {getDuplicateAddr()}
                                </tbody>
                            </table>

                            <div className="text-center text-purple-700 text-sm sm:text-base mb-3">
                                <button className="font-semibold hover:underline" onClick={keepFirstAddressFromAddressDuplicates}>Keep the first one</button>
                                <span className="mx-2">|</span>
                                <button className="font-semibold hover:underline" onClick={combineBalancesFromAddressDuplicates}> Combine balances</button>
                            </div>
                        </div> : ''}

                        <div className="text-center">
                            {csvState.isPageOneBtnDisabled ?
                                (<button className={uiStyle.approveBtn} style={{ cursor: 'not-allowed' }} disabled={csvState.isPageOneBtnDisabled}>Approve & Send</button>)
                                :
                                (<button className={uiStyle.approveBtn} style={{ cursor: csvState.isPageOneBtnDisabled ? 'not-allowed' : 'pointer' , background: 'green'}} disabled={csvState.isPageOneBtnDisabled} onClick={() => pageOneNextClick()} >Approve & Send</button>)
                            }
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default HomeHeader;