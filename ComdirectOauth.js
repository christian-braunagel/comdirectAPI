import fetch from 'node-fetch'
import * as readline from "readline"

export class ComdirectOauth {

    constructor(){

        // personal data stored in environmental variables should never be part of the code
        this.client_id = process.env.ENV_comdirect_client_id
        this.client_secret = process.env.ENV_comdirect_client_secret
        this.username = process.env.ENV_comdirect_username
        this.password = process.env.ENV_comdirect_password

        this.grant_type = 'password'

        // session and request ids are random
        this.sessionId = '550e8400e29b1a4a716446655440000'
        
        this.requestId = '146113250'
        /* create a timestamp related id
        let timestamp = new Date( Date.now() );
         timestamp.getFullYear().toString()
                        + ((timestamp.getMonth()+1).toString()
                        + timestamp.getDay().toString()
                        + timestamp.getHours().toString()
                        + timestamp.getMinutes().toString()
                        + timestamp.getSeconds().toString()
        */

        this.clientRqId = '{"clientRequestId":{"sessionId":"' + this.sessionId + '","requestId":"' + this.requestId + '"}}'

        this.base_path = 'https://api.comdirect.de/api'

        this.accessToken = null
        this.authInfo = null
        this.sessionBody = null
        this.responseTan = null

        this.joinDetails()
    }

    joinDetails(){
        this.details = {
            'client_id': this.client_id,
            'client_secret': this.client_secret,
            'username': this.username,
            'password': this.password,
            'grant_type': this.grant_type
        }
    }

    createBody(details){
        var formBody = [];

        for (var property in details) {
            let encodedKey = encodeURIComponent(property);
            let encodedValue = encodeURIComponent(details[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }

        formBody = formBody.join("&");

        return formBody
    }

    async performCdOauth(){

        let formBody = this.createBody(this.details)

        try{
            console.log('1. Get token')
    
            // Working now because function call returns a promise and not the access token
            this.accessToken = await this.fetchOauthToken(formBody)
    
            console.log('2. Get session with ' + this.accessToken)
        
            let sessionRes = await this.fetchSessionState()
            
            console.log('3. Validate session')
    
            await this.doTanChallenge(sessionRes)
    
            // wait for approvement from app
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
    
            rl.question('Approved in app?', ans => {
    
                this.postTanApprovedManager()
    
                rl.close()
            })
    
        }
    
        catch(error){
            console.log("Some error" + error)
        }
    
    }

    async fetchOauthToken(formBody){

        // return new Promise( (resolve, reject) => {

            return fetch('https://api.comdirect.de/oauth/token', {
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
                let accessToken = data.access_token
                return accessToken
            })

        // })


    }

    async fetchSessionState(){

        return fetch(this.base_path + '/session/clients/' + this.client_id + '/v1/sessions', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.accessToken,
                'x-http-request-info': this.clientRqId,
                'Content-Type': 'application/json'
            },
        }).then(sessionState => {

            return sessionState.json()
        }).then(sessionRes => {

            return sessionRes
        })

    }

    async doTanChallenge(sessionRes){

        this.sessionBody = '{"identifier":"' + sessionRes[0].identifier + '","sessionTanActive":true,"activated2FA":true}'

            return fetch(this.base_path + '/session/clients/' + this.client_id + '/v1/sessions/' + this.sessionId + '/validate', {
                method: 'POST',
                redirect: 'error',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + this.accessToken,
                    'x-http-request-info': this.clientRqId,
                    'Content-Type': 'application/json'
                },
                body: this.sessionBody
            }).then(session => {
                
                this.authInfo = JSON.parse(session.headers.get('x-once-authentication-info'))
            })

    }

    async activateSessionTan(){

        return fetch(this.base_path + '/session/clients/' + this.client_id + '/v1/sessions/' + this.sessionId, {
            method: 'PATCH',
            headers: {
               'Accept': 'application/json',
               'Authorization': 'Bearer ' + this.accessToken,
               'x-http-request-info': this.clientRqId,
               'Content-Type': 'application/json',
               'x-once-authentication-info': '{"id":"' + this.authInfo.id + '"}'
            },
            body: this.sessionBody
          
          }).then( responseTan => {

            this.responseTan = responseTan
          })
    }

    async postTanApprovedManager(){

        console.log('Response tan')

        await this.activateSessionTan()

        console.log('Refresh token')

        await this.performCdSecondFlow()
    }

    async performCdSecondFlow(){
        
        let formBody = "client_id=" + this.client_id + "&client_secret=" + this.client_secret + "&grant_type=cd_secondary&token=" + this.accessToken;

        return fetch('https://api.comdirect.de/oauth/token', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody
        }).then(finalAccess => {
            
            return finalAccess.json()
        }).then( finalAccessJson => {

            let refreshToken = finalAccessJson.refresh_token;

            console.log("Refresh:" + refreshToken)
        })
    }
}