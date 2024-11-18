import {
    TonClient,
    WalletContractV4,
    toNano,
    WalletContractV5R1
} from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { DEX, pTON } from "@ston-fi/sdk";
import axios from 'axios';


async function get_jetton_price(address) {
    const response = await axios.get("https://api.ston.fi/v1/assets/" + address); // 替换为实际的 API 地址
    // 如果需要返回这个值
    return response.data.asset.dex_usd_price	;
}


async function main() {
    const args = process.argv.slice(2); // 从第3个参数开始是传入的自定义参数
    console.log(args);
    const JettonAddress = args[0]
    const ton_amount = args[1]
    const slippage = args[2]
    let min_jetton_amount = args[3]

    const client = new TonClient({
        endpoint: "https://toncenter.com/api/v2/jsonRPC?api_key=0f4bf7bbf8cd12c7e38071b65a6cb48d7d74f956cf2ad3b8211373738a18741a",
    });

    const mnemonics = ["xxx", "xxx"]

    const keyPair = await mnemonicToPrivateKey(mnemonics);

    const workchain = 0;
    const wallet = WalletContractV5R1.create({
        workchain,
        publicKey: keyPair.publicKey,
    });


    const contract = client.open(wallet);

    const dex = client.open(new DEX.v1.Router());

    const TonAddress = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"

    const jetton_price = await get_jetton_price(JettonAddress)
    console.log("jetton_price:   " + jetton_price)
    const ton_price = await get_jetton_price(TonAddress)
    console.log("ton_price:   " + ton_price)
    const jetton_amount = (ton_amount * ton_price / jetton_price) * (100 - slippage) / 100
    if (min_jetton_amount < jetton_amount){
        min_jetton_amount = jetton_amount;
    }
    console.log("jetton token min amount:   " + min_jetton_amount)

// swap 1 TON for a STON but not less than 0.1 STON
    const txArgs = {
        offerAmount: toNano(ton_amount),
        askJettonAddress: JettonAddress,
        minAskAmount: toNano(min_jetton_amount),
        proxyTon: new pTON.v1(),
        userWalletAddress: wallet.address.toString(),
    };



// you can instantly send the transaction using the router method with send suffix
    await dex.sendSwapTonToJetton(contract.sender(keyPair.secretKey), txArgs);


// or you can get the transaction parameters
//     const txParams = await dex.getSwapTonToJettonTxParams(txArgs);
//     await contract.sendTransfer({
//         seqno: await contract.getSeqno(),
//         secretKey: keyPair.secretKey,
//         messages: [internal(txParams)],
//     });
}


main()