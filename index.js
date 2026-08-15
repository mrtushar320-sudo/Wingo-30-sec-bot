const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const token = '8800231061:AAE6t07bone8iIdChBVpAWUxLc-l8_UDd6c';
const chatId = '@wingo_Predict_30';

const bot = new TelegramBot(token, { polling: true });

function calculateNextNumber(list) {
    if (!list || list.length < 10) return { num: 5, type: "SMALL" };

    const numbers = list.map(item => parseInt(item.number));
    const lastNumber = numbers[0];

    let nextNumCounts = {};
    for (let i = 0; i <= 9; i++) nextNumCounts[i] = 0;

    let patternFoundCount = 0;
    for (let i = 1; i < numbers.length - 1; i++) {
        if (numbers[i] === lastNumber) {
            const whatCameNext = numbers[i - 1];
            nextNumCounts[whatCameNext]++;
            patternFoundCount++;
        }
    }

    let predictedNum = -1;
    let maxCount = -1;
    for (let i = 0; i <= 9; i++) {
        if (nextNumCounts[i] > maxCount) {
            maxCount = nextNumCounts[i];
            predictedNum = i;
        }
    }

    if (patternFoundCount === 0 || maxCount === 0) {
        predictedNum = (lastNumber >= 5) ? 2 : 7;
    }

    const predType = (predictedNum >= 5) ? "BIG" : "SMALL";
    return { num: predictedNum, type: predType };
}

let lastProcessedIssue = "";

async function updateSignal() {
    try {
        const url = `https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json?pageSize=50&t=${Date.now()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://dkwin.org/',
                'Origin': 'https://dkwin.org',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site'
            }
        });

        const text = await response.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.log("Server IP temporarily restricted by Wingo. Retrying next cycle...");
            return;
        }

        const list = data?.data?.list;
        if (!list || list.length < 5) return;

        const latestFinishedIssue = list[0].issueNumber;
        const currentIssue = (BigInt(latestFinishedIssue) + 1n).toString();

        if (lastProcessedIssue !== currentIssue) {
            lastProcessedIssue = currentIssue;
            const prediction = calculateNextNumber(list);

            const msg = `🔥 **NAHID VIP FREQUENCY ENGINE** 🔥\n\n` +
                        `📌 **Period:** \`${currentIssue}\`\n` +
                        `🎯 **Predicted Number:** ${prediction.num}\n` +
                        `📊 **Result Type:** **${prediction.type}**`;

            bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error("Fetch Error:", error.message);
    }
}

setInterval(updateSignal, 10000);
