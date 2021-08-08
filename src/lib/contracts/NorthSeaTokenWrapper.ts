/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3 from 'web3';
import * as NorthSeaTokenJSON from '../../../build/contracts/NorthSeaToken.json';
import { NorthSeaToken } from '../../types/NorthSeaToken';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

const SUDT_ID = '450'; // Replace this with SUDT ID received from depositing SUDT to Layer 2. This should be a number.
const SUDT_NAME = 'NorthSea';
const SUDT_SYMBOL = 'NSE';
const SUDT_TOTAL_SUPPLY = 100000000000000000000n;

export class NorthSeaTokenWrapper {
    web3: Web3;

    contract: NorthSeaToken;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(NorthSeaTokenJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getTotalSupply() {
        const value = await this.contract.methods.totalSupply().call();
        return value;
    }

    async getTokenSymbol() {
        const value = await this.contract.methods.symbol().call();
        return value;
    }

    async getTokenName() {
        const value = await this.contract.methods.name().call();
        return value;
    }

    async getBalanceOf(account: string) {
        const value = await this.contract.methods.balanceOf(account).call();
        return value;
    }

    async setTransferToken(fromAddress: string, toAddress: string, amount: number) {
        const tx = await this.contract.methods
            .transfer(toAddress, this.web3.utils.toWei(this.web3.utils.toBN(amount)))
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress
            });

        return tx;
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: NorthSeaTokenJSON.bytecode,
                arguments: [SUDT_NAME, SUDT_SYMBOL, SUDT_TOTAL_SUPPLY, SUDT_ID]
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
