const axios = require('axios');

const TestNet = "https://soroban-testnet.stellar.org";
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

function getRandomInt() {
    return Math.floor(Math.random() * 100000000000);
}
class SorobanClient {
    constructor(nodeUrl, logger){
        if(nodeUrl){
            this.nodeUrl = nodeUrl;
        }else{
            this.nodeUrl = TestNet;
        }


        if(logger){
            this.logger = logger
        }else{
            this.logger = new tempLogger();
        }

    }
    async getEvents(startLedger, contractsId, topics){
        try{
            let messageId = getRandomInt();
            let requestBody = {
                "jsonrpc": "2.0",
                "id": messageId,
                "method": "getEvents",
                "params": {
                    "startLedger": startLedger,
                    "filters": [
                        {
                            "type": "contract",
                            "contractIds": [
                                contractsId
                            ],
                            "topics": [
                                [topics]
                            ]
                        }
                    ],
                    "pagination": {
                        "limit": 100
                    }
                }
            }

            let res = await axios.post(this.nodeUrl, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if(res && res.data){
                this.logger.debug('res.data is: ', res.data);


            }
        }catch (e) {
            this.logger.error('getEvents, e: ', e);
        }

    }

}

module.exports = SorobanClient;