import fetch from 'node-fetch'
import {ComdirectOauth} from './ComdirectOauth.js'
import * as readline from "readline"

let base_path = 'https://api.comdirect.de/api';

let comdirectOauth = new ComdirectOauth();

let details = comdirectOauth.details;

let sessionId = comdirectOauth.sessionId;
let requestId = comdirectOauth.requestId;

let formBody = comdirectOauth.createBody(details);
console.log(formBody);

console.log(comdirectOauth.client_id)

//getToken(formBody)

// async function getToken(formBody){

//     let data = await accessFlow.fetchToken(formBody);
//     console.log(data)
// }

// fetch('https://api.comdirect.de/oauth/token', {
//     method: 'POST',
//     headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/x-www-form-urlencoded'
//     },
//     body: formBody
//     })
//     .then(res => {
//         return res.json()
//     })
//     .then(data => {
//         let accessToken = data.access_token

//         fetch('https://api.comdirect.de/api/session/clients/User_599C2931ACF1400F879317ED55311AB5/v1/sessions', {
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
//                 'Authorization': 'Bearer ' + accessToken,
//                 'x-http-request-info': '{"clientRequestId":{"sessionId":"' + sessionId + '","requestId":"' + requestId + '"}}',
//                 'Content-Type': 'application/json'
//             },
//         }).then(sessionState => {
//             return sessionState.json()
//         }).then(sessionRes => {
//             //console.log(sessionRes[0])

//             let bodyContent = '{"identifier":"' + sessionRes[0].identifier + '","sessionTanActive":true,"activated2FA":true}'
//         })
//     })