/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { MyERC20TokenWrapper } from '../lib/contracts/MyERC20TokenWrapper';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum && (window as any).ethereum.isMetaMask) {
        const web3 = new Web3((window as any).ethereum);

        try {
            // Request account access if needed
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<MyERC20TokenWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [toAddressInputValue, setToAddressInputValue] = useState<string>();
    const [amountInputValue, setAmountInputValue] = useState<number>();
    const [tokenName, setTokenName] = useState<string | undefined>();
    const [tokenSymbol, setTokenSymbol] = useState<string | undefined>();
    const [totalSupplyToken, setTotalSupplyToken] = useState<string | undefined>();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new MyERC20TokenWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getTotalSupplyToken() {
        const value = await contract.getTotalSupply();
        setTotalSupplyToken(value);
    }

    async function getTokenSymbolValue() {
        const value = await contract.getTokenSymbol();
        setTokenSymbol(value);
    }

    async function getTokenNameValue() {
        const value = await contract.getTokenName();
        setTokenName(value);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new MyERC20TokenWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
    }

    async function setTransferTokenAmount() {
        try {
            setTransactionInProgress(true);
            await contract.setTransferToken(account, toAddressInputValue, amountInputValue);
            toast('Successfully tranfer token', { type: 'success' });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />
            <p>The button below will deploy a ERC20 token.</p>
            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <button onClick={getTokenNameValue} disabled={!contract}>
                Get token name
            </button>
            {tokenName ? <>&nbsp;Token Name: {tokenName}</> : null}
            <br />
            <br />
            <button onClick={getTokenSymbolValue} disabled={!contract}>
                Get token symbol
            </button>
            {tokenSymbol ? <>&nbsp;Token Symbol: {tokenSymbol}</> : null}
            <br />
            <br />
            <button onClick={getTotalSupplyToken} disabled={!contract}>
                Get total supply
            </button>
            {totalSupplyToken ? (
                <>&nbsp;Total Supply: {web3.utils.fromWei(totalSupplyToken)}</>
            ) : null}
            <br />
            <br />
            <input
                type="text"
                placeholder="To Address"
                onChange={e => setToAddressInputValue(e.target.value)}
            />{' '}
            <input
                type="text"
                placeholder="Amount"
                onChange={e => setAmountInputValue(Number(e.target.value))}
            />{' '}
            <button onClick={setTransferTokenAmount} disabled={!contract}>
                Transfer
            </button>
            <br />
            <br />
            <hr />
            The contract is deployed on Nervos Layer 2 - Godwoken + Polyjuice. After each
            transaction you might need to wait up to 120 seconds for the status to be reflected.
            <ToastContainer />
        </div>
    );
}
