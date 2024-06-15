const SorobanClient = require('./SorobanClient');
const config = require('./config');
const HorizonClient = require('./HorizonClient');
const {
    Keypair,
    Contract,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,
    nativeToScVal,
    xdr
} = require("@stellar/stellar-sdk");

const run =  async () => {
 /*   const s_client = new SorobanClient();
    let ret = await s_client.getEvents(56920,config.msgCrossScAddr,["DISPATCH_", "dispatch"] );
    console.log('ret : ', ret);
    console.log('ret.result: ', ret.result.events);
*/
    const server = new SorobanRpc.Server(config.soroban_testUrl);
    let opt = {
        filters: [{
            "type": "contract",
            "contractIds": [
                config.msgCrossScAddr
            ],


        }],
        startLedger: 56920

    }
    let res = await server.getEvents(opt);
    console.log('res: ', res);
    console.log(res.events[0].value._value[0]._attributes.key);

}
let tx = "c551889b3023bdfdb5f0569fad4ac7e712b82754c3a428232e803e82c7dca7fe";

let raw_events = 'AAAAEQAAAAEAAAADAAAADwAAAARkYXRhAAAADQAAACDy9ihunyFG9dkkGOIodIfPn0QI+5pc5NAMs5QGYqxV7QAAAA8AAAACdG8AAAAAAA0AAAAgGc7j35WNOhxem80iGuLVmQz5mTpsewu8jaZU3mzuKpcAAAAPAAAAC3RvX2NoYWluX2lkAAAAAAUAAAAAAAAwOQ=='
/*
{
    type: 'contract',
        ledger: 56924,
    ledgerClosedAt: '2024-06-15T07:56:17Z',
    contractId: 'CCM6HOFSLKEPPVREYL37OSXGOILEA3SYO6T4UWRIX6CH4BHA7TVPZVNO',
    id: '0000244486718382080-0000000001',
    pagingToken: '0000244486718382080-0000000001',
    topic: [ 'AAAADwAAAAlESVNQQVRDSF8AAAA=', 'AAAADwAAAAhkaXNwYXRjaA==' ],
    value: 'AAAAEQAAAAEAAAADAAAADwAAAARkYXRhAAAADQAAACDy9ihunyFG9dkkGOIodIfPn0QI+5pc5NAMs5QGYqxV7QAAAA8AAAACdG8AAAAAAA0AAAAgGc7j35WNOhxem80iGuLVmQz5mTpsewu8jaZU3mzuKpcAAAAPAAAAC3RvX2NoYWluX2lkAAAAAAUAAAAAAAAwOQ==',
    inSuccessfulContractCall: true,
    txHash: 'c551889b3023bdfdb5f0569fad4ac7e712b82754c3a428232e803e82c7dca7fe'
}
*/

let cc = atob(raw_events);
console.log('cc: ', cc);


const gettx = async() => {
    const h_client = new HorizonClient();
    let ret = await h_client.getTransactionByTxHash(tx);
    console.log('ret :', ret);
}






