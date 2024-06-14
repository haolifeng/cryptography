const axios = require('axios');
const parseUrl = require('parse-url');
const StellearSdk = require('@stellar/stellar-sdk');
const MAIN_NET = "https://horizon.stellar.org/";
const TEST_NET = "https://horizon-testnet.stellar.org/";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**/
const tunnel =require('tunnel');

const hlf_agent = tunnel.httpsOverHttp({
    proxy:{ host:'127.0.0.1', port: 7890 }
});
/**/

let ReqApiObj = {
    LEDGERS:'ledgers',
    TRANSACTIONS:'transactions',
    ACCOUNTS:'accounts',
    ASSETS:'assets',
    PAYMENTS:'payments',
}
const ReqLimit = 3;
class tempLogger {
    debug(...params){
        console.log(...params)
    }
    error(...params){
        console.log(...params)
    }
    info(...params) {
        console.log(...params)
    }

    warn(...params) {
        console.log(...params)
    }
}


class HorizonClient {
    constructor(nodeUrl, logger){
        if(nodeUrl){
            this.nodeUrl = nodeUrl;
        }else{
            this.nodeUrl = TEST_NET;
        }


        if(logger){
            this.logger = logger
        }else{
            this.logger = new tempLogger();
        }

    }
    async getAccountObjOnChain(accountPubkey){
        let accountOnChain = await this.getAccountbyID(accountPubkey);
        let sequence = accountOnChain.sequence;
        let Account = new StellearSdk.Account(accountPubkey, sequence);
        return Account;
    }
    async getLastLedgerSequence(){
        let url = this.nodeUrl + ReqApiObj.LEDGERS;
        try{
            let config = {
                ethod: 'get',
                url: url,
                params: {
                    cursor:"",
                    order : 'desc',
                    limit : 1
                },
                httpAgent:hlf_agent,
                httpsAgent:hlf_agent,
                proxy:false,

                headers: {
                    'Accept': 'application/json'
                },

            }
            let resp = await axios(config)

            this.logger.debug('resp.data: ', resp.data);

            let data = resp.data;
            let ledger = data._embedded.records[0];
            this.logger.debug('ledger: ', ledger);

            return ledger.sequence
        }catch (e) {
            this.logger.error('e: ',e)
            throw (e)
        }

    }
    async getTxsInLedger(sequence){
        let url = this.nodeUrl + ReqApiObj.LEDGERS + '/' + sequence + '/' + ReqApiObj.TRANSACTIONS;
        let cursor = 0;
        let limit = ReqLimit;
        let config = {
            ethod: 'get',
            url: url,
            params: {
                cursor:cursor,
                order : 'asc',
                limit : limit,
                include_failed:true
            },
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
            headers: {
                'Accept': 'application/json'
            },

        }
        let allTxs = [];
        try{
            let size = 0;
            do {
                console.log('config: ', config);
                let resp = await axios(config);

                if(resp && resp.data && resp.data._embedded){
                    let data = resp.data;
                    console.log('data: ', data);
                    let records = data._embedded.records;

                    size = records.length;

                    this.logger.debug('getTxsInLedger , size: ', size)

                    for(let i = 0; i < size;i++){

                        allTxs.push(records[i]);
                    }
                    let nextLink = data._links.next.href;
                    let netLinkObj = parseUrl(nextLink);
                    cursor = netLinkObj.query.cursor;
                    this.logger.debug('cursor : ', cursor);
                    config.params.cursor = cursor;
                }else{
                    break;
                }

            }while (size === limit);

            return allTxs;

        }catch (e) {
            throw(e)
        }
    }
    async getPaymentsInLedger(sequence){
        let url = this.nodeUrl + ReqApiObj.LEDGERS + '/' + sequence + '/' + ReqApiObj.PAYMENTS;
        let cursor = 0;
        let limit = ReqLimit;
        let config = {
            ethod: 'get',
            url: url,
            maxBodyLength: Infinity,
            params: {
                cursor:cursor,
                order : 'asc',
                limit : limit,
                include_failed:false
            },
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
            headers: {
                'Accept': 'application/json'
            },

        }
        let allPaymentss = [];
        try{
            let size = 0;
            do {
                //console.log('config: ', config);
                let resp = await axios(config);

                if(resp && resp.data && resp.data._embedded){
                    let data = resp.data;
                    console.log('data: ', data);
                    let records = data._embedded.records;

                    size = records.length;

                    this.logger.debug('getPaymentInLedger , size: ', size)

                    for(let i = 0; i < size;i++){

                        allPaymentss.push(records[i]);
                    }
                    let nextLink = data._links.next.href;
                    let netLinkObj = parseUrl(nextLink);
                    cursor = netLinkObj.query.cursor;
                    this.logger.debug('cursor : ', cursor);
                    config.params.cursor = cursor;
                }else{
                    break;
                }

            }while (size === limit);

            return allPaymentss;

        }catch (e) {
            throw(e)
        }
    }
    async getAccountbyID(account_id){
        let url = this.nodeUrl + ReqApiObj.ACCOUNTS + '/' + account_id;
        let config = {
            method: 'get',
            url: url,
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await axios(config);
            return resp.data;

        }
        catch (e) {
            throw e;
        }



    }
    async getBalanceOfXLM(account_id){
        let url = this.nodeUrl + ReqApiObj.ACCOUNTS + '/' + account_id;
        let config = {
            method: 'get',
            url: url,
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await axios(config);
            if(resp && resp.data && resp.data.balances){

                let xlmIndex = -1;
                for(let i=0; i< resp.data.balances.length; i++){
                    let balanceObj = resp.data.balances[i];
                    if(balanceObj.asset_type === 'native'){
                        xlmIndex = i;
                        break;
                    }
                }
                if(xlmIndex === -1){
                    return "0.0"
                }
                else {
                    return resp.data.balances[xlmIndex].balance;
                }
            }

        }
        catch (e) {
            throw e;
        }

    }

    async getBalanceOfAsset(account_id, asset_code, asset_issuer){
        let url = this.nodeUrl + ReqApiObj.ACCOUNTS + '/' + account_id;
        let config = {
            method: 'get',
            url: url,
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await axios(config);
            if(resp && resp.data && resp.data.balances){

                let xlmIndex = -1;
                for(let i=0; i< resp.data.balances.length; i++){
                    let balanceObj = resp.data.balances[i];
                    if(balanceObj.asset_code === asset_code && balanceObj.asset_issuer == asset_issuer){
                        xlmIndex = i;
                        break;
                    }
                }
                if(xlmIndex === -1){
                    return "0.0000000";
                }
                else {
                    return resp.data.balances[xlmIndex].balance;
                }
            }

        }
        catch (e) {
            throw e;
        }
    }
    async getAllBalance(account_id){
        let url = this.nodeUrl + ReqApiObj.ACCOUNTS + '/' + account_id;
        let config = {
            method: 'get',
            url: url,
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
            headers: {
                'Accept': 'application/json'
            }
        };
        try{
            let resp = await axios(config);
            if(resp && resp.data && resp.data.balances){
                return resp.data.balances;
            }

        }
        catch (e) {
            throw e;
        }
    }


    async sendSignedTx(tx){
        let url = this.nodeUrl + ReqApiObj.TRANSACTIONS ;
        let config = {
            method: 'post',
            url: url,
            headers: {
                'Accept': 'application/json'
            },
            params:{
                tx: tx
            },
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
        };
        try{
            let resp = await axios(config);
            if(resp && resp.data ){
                this.logger.debug('data: ', resp.data)
            }
            return resp.data;

        }
        catch (e) {
            throw e;
        }



    }

    async getAsset(asset_code, asset_issuer){
        let url = this.nodeUrl + ReqApiObj.ASSETS;

        let config = {
            method: 'get',
            url: url,
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
            headers: {
                'Accept': 'application/json'
            },
            params: {
                asset_code: asset_code,
                asset_issuer:asset_issuer,
                cursor:"",
                order : 'desc',
                limit : 1
            },
        };
        try{
            let resp = await axios(config);
            return resp.data;

        }
        catch (e) {
            throw e;
        }
    }

    async getTransactionByTxHash(transaction_hash){
        let url = this.nodeUrl + ReqApiObj.TRANSACTIONS + '/' + transaction_hash
        let config = {
            method: 'get',
            url: url,
            maxBodyLength: Infinity,
            httpAgent:hlf_agent,
            httpsAgent:hlf_agent,
            proxy:false,
            headers: {
                'Accept': 'application/json'
            },

        };
        try{
            let resp = await axios(config);
            return resp.data;

        }
        catch (e) {
            throw e;
        }
    }
    async getTransactionStatus(transaction_hash){
        try{
            let data = await this.getTransactionByTxHash(transaction_hash);
            return data.successful
        }catch(e){
            throw e;
        }

    }
    async feeStats(){
        try{
            let url = this.nodeUrl + 'fee_stats';
            let config = {
                method: 'get',
                url: url,
                maxBodyLength: Infinity,
                httpAgent:hlf_agent,
                httpsAgent:hlf_agent,
                proxy:false,
                headers: {
                    'Accept': 'application/json'
                },
            }

            let resp = await axios(config);
            return resp.data;


        }
        catch (e) {
            throw e;
        }
    }
}

module.exports = HorizonClient;