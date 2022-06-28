import fetch from 'node-fetch'
import {ComdirectOauth} from './ComdirectOauth.js'
import * as readline from "readline"

let base_path = 'https://api.comdirect.de/api';


let accessFlow = new ComdirectOauth();

let details = accessFlow.details;

let sessionId = accessFlow.sessionId;
let requestId = accessFlow.requestId;

var formBody = [];
for (var property in details) {
  var encodedKey = encodeURIComponent(property);
  var encodedValue = encodeURIComponent(details[property]);
  formBody.push(encodedKey + "=" + encodedValue);
}
formBody = formBody.join("&");

//console.log(formBody);

//getToken(formBody)

// async function getToken(formBody){

//     let data = await accessFlow.fetchToken(formBody);
//     console.log(data)
// }

fetch('https://api.comdirect.de/oauth/token', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formBody
})
    .then(res => {
        return res.json()
    })
    .then(data => {
        //console.log(data)
        //console.log('Bearer ' + data.access_token)
        fetch('https://api.comdirect.de/api/session/clients/User_599C2931ACF1400F879317ED55311AB5/v1/sessions', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + data.access_token,
                'x-http-request-info': '{"clientRequestId":{"sessionId":"' + sessionId + '","requestId":"' + requestId + '"}}',
                'Content-Type': 'application/json'
            },
        }).then(sessionState => {
            return sessionState.json()
        }).then(sessionRes => {
            //console.log(sessionRes[0])

            let bodyContent = '{"identifier":"' + sessionRes[0].identifier + '","sessionTanActive":true,"activated2FA":true}'

            fetch(base_path + '/session/clients/' + details['client_id'] + '/v1/sessions/' + sessionId + '/validate', {
                method: 'POST',
                redirect: 'error',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + data.access_token,
                    'x-http-request-info': '{"clientRequestId":{"sessionId":"' + sessionId + '","requestId":"' + requestId + '"}}',
                    'Content-Type': 'application/json'
                },
                body: bodyContent
            }).then(session => {
                //console.log(session)
                //console.log(session.headers)
                let authInfo = JSON.parse(session.headers.get('x-once-authentication-info'))

                //let x = await pushTanInterrupt();

                //console.log(authInfo.typ)

                // wait for approvement from app
                const rl = readline.createInterface({
                  input: process.stdin,
                  output: process.stdout,
                });

                rl.question('Approved in app?', ans => {

                  fetch(base_path + '/session/clients/' + details['client_id'] + '/v1/sessions/' + sessionId, {
                    method: 'PATCH',
                    headers: {
                       'Accept': 'application/json',
                       'Authorization': 'Bearer ' + data.access_token,
                       'x-http-request-info': '{"clientRequestId":{"sessionId":"' + sessionId + '","requestId":"' + requestId + '"}}',
                       'Content-Type': 'application/json',
                       'x-once-authentication-info': '{"id":"' + authInfo.id + '"}'
                    },
                    body: bodyContent
                  
                  }).then( responseTan => {
                    //console.log(responseTan)
                    
                    formBody = "client_id=" + details.client_id + "&client_secret=" + details.client_secret + "&grant_type=cd_secondary&token=" + data.access_token;

                    fetch('https://api.comdirect.de/oauth/token', {
                      method: 'POST',
                      headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                      },
                      body: formBody
                    }).then(finalAccess => {
                      //console.log(finalAccess)
                      return finalAccess.json()
                    }).then( finalAccessJson => {

                      console.log(finalAccessJson)
                      let refreshToken = finalAccessJson.refresh_token;

                      console.log("Refresh:" + refreshToken)
                    })
                    
                  rl.close();
                    
                })

            })
        })
    })
  })
