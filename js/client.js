
if (typeof window.web3 !== 'undefined') {
    window.web3 = new Web3(web3.currentProvider);   
}
else {
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
}

const contractABI = [{"anonymous":false,"inputs":[{"indexed":false,"name":"ipfsHash","type":"string"}],"name":"VotingEnded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ipfsHash","type":"string"},{"indexed":false,"name":"voter","type":"address"}],"name":"Voted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ipfsHash","type":"string"},{"indexed":false,"name":"accepted","type":"bool"}],"name":"Accepted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"author","type":"address"},{"indexed":false,"name":"reputation","type":"uint256"}],"name":"ReputationUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ipfsHash","type":"string"},{"indexed":false,"name":"author","type":"address"}],"name":"ArticleAdded","type":"event"},{"constant":false,"inputs":[{"name":"ipfsHash","type":"string"},{"name":"duration","type":"uint256"}],"name":"addArticle","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"ipfsHash","type":"string"},{"name":"castVote","type":"bool"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"ipfsHash","type":"string"}],"name":"getVotes","outputs":[{"name":"yays","type":"uint256"},{"name":"nays","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"ipfsHash","type":"string"}],"name":"checkDeadline","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_author","type":"address"}],"name":"getReputation","outputs":[{"name":"reputation","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const contractAddress = '0xec05fe41ad1360b214377396c9a95b806b608f5e';

var account;
var mining;
const web3Events = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws'));
var miningEvent = new web3Events.eth.Contract(contractABI, contractAddress);

window.web3.eth.getAccounts((error, accounts) => {
    account = accounts[0];
    mining = new web3.eth.Contract(contractABI, contractAddress, {from: account});
});

var keyphrase = createPhrase(32);
document.getElementById("submitBtn").addEventListener('click', (event) => {
    event.preventDefault();
});

function toHex(s) {
    var hex = '';
    for(var i=0;i<s.length;i++) { 
        hex += ''+s.charCodeAt(i).toString(16);
    }
    return `0x${hex}`;
}

function createPhrase(n) {
    var phrase = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < n; i++)
      phrase += characters.charAt(Math.floor(Math.random()*characters.length));
  
    return phrase;
}

function sign(phrase, callback){
    //Actually submits the form after signing
    window.web3.eth.getAccounts((error, accounts) => {
        if(error) {
            throw error;
        }
        window.web3.eth.sign(phrase, accounts[0], (err, sign) => {
            if(err) {
                throw err;
            }
            // console.log(sign);
            callback(sign);
            // document.getElementById("address").value = accounts[0];
        });
    });
}

//For uploading news 
function submit() {
    if(document.getElementById("title").value == "") {
        alert("Title cannot be empty");
    }
    else {
        sign(toHex(keyphrase), function(sign) {
            const server = "http://localhost:3000/upload";
            var form = $('#uploadForm')[0];
            document.getElementById("sign").value = sign;
            document.getElementById("phrase").value = keyphrase;
            var data = new FormData(form);

            $.ajax({
                type: 'POST',
                enctype: 'multipart/form-data',
                url: server,
                data: data,
                processData: false,
                contentType: false,
                cache: false,
                timeout: 600000,
                success: function(data) {
                    console.log(JSON.stringify(data));
                    writeToBlockchain(data.hash, 2);
                    //Write to the blockchain

                },
                error: function(err) {
                    console.log(err);
                }
            });
            // document.getElementById("sign").value = sign;
            // document.getElementById("phrase").value = keyphrase;
            // var form = document.getElementById("uploadForm");
            // form.submit();
        });
    }
}

//To be called when user signs up or logs in
function login() {
    const name = document.getElementById("name").value;
    const bio = document.getElementById("bio").value;
    console.log(name+" "+bio);
    const keyphrase = createPhrase(32);
    sign(toHex(keyphrase), function(sign) {
        console.log("Sign: " + sign);
        const server = "http://localhost:3000/login";
        postData("name="+name+"&bio="+bio+"&sign="+sign+"&phrase="+keyphrase, server);
    });
}

function subscribe() {
    const phrase = createPhrase(32);
    const channel = "0x2a5F493594eF5E7d81448c237dFB87003485fce5"; //window.sessionStorage.getItem("channel");
    sign(toHex(phrase), function(sign) {
        const server = "http://localhost:3000/channel/subscribe";
        postData("sign="+sign+"&phrase="+phrase+"&channel="+channel, server);
    });
}

function getNews() {
    // const phrase = createPhrase(32);
    const channel = "0x2a5f493594ef5e7d81448c237dfb87003485fce5";
    // sign(toHex(phrase), function(sign) {
    // });

        const url = "http://localhost:3000/news/"+channel;
        getRequest(url, function(resp) {
            document.getElementById("articles").innerText = resp;
        });
}

function getAllNews() {
    const phrase = createPhrase(32);
    sign(toHex(phrase), function(sign) {
        const server = "http://localhost:3000/news/getNews";
        const mined = "false";
        postData("sign="+sign+"&phrase="+phrase+"&mined="+mined, server);
    });
}

function searchNews() {
    const keyword = document.getElementById("query").value
    const server = "http://localhost:3000/news/search/"+keyword;
    getRequest(server, function(val) {
        console.log("Resp: "+val);
    });
}

function postData(data, server) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", server);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send(data);
    xhttp.onreadystatechange = function() {
        if(xhttp.readyState === 4 && xhttp.status === 200) {
            // alert("Successful!");
            console.log("Successful");
        }
        // console.log(xhttp.responseText);
    }
}

function getRequest(url, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    console.log(url);
    xhttp.send();
    xhttp.onreadystatechange = function() {
        if(xhttp.readyState === 4 && xhttp.status === 200) {
            // alert("Successful!");
            console.log("Successful");
        }
        // console.log(xhttp.responseText);
        callback(xhttp.responseText);
    }
}

function writeToBlockchain(hash, duration) {
    mining.methods.addArticle(hash, duration).send().then((tx) => console.log(tx));
}

//Events Listeners
miningEvent.events.ArticleAdded(function(err, res) {
    console.log(res.returnValues.ipfsHash);
});
