const currentDate = new Date().toUTCString();


const identifierConfig = {
    '001': { hostname: 'adultswim-vodlive.cdn.turner.com', port: 8080 , headers: { host: 'adultswim-vodlive.cdn.turner.com', connection: 'keep-alive', 'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"', 'sec-ch-ua-mobile': '?0', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0', 'sec-ch-ua-platform': '"Windows"', accept: '*/*', origin: 'https://livepush.io', 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty', 'accept-encoding': 'gzip, deflate, br', 'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8', 'if-none-match': '"65b3f985-207"', 'if-modified-since': currentDate } },
}

module.exports = identifierConfig;