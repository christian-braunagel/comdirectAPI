import fetch from 'node-fetch'

export class ComdirectOauth {

    constructor(){

        // personal data stored in environmental variables should never be part of the code
        this.client_id = process.env.ENV_comdirect_client_id
        this.client_secret = process.env.ENV_comdirect_client_secret
        this.username = process.env.ENV_comdirect_username
        this.password = process.env.ENV_comdirect_password

        this.grant_type = 'password'

        // session and request ids are random
        this.sessionId = '550e8400e29b11d4a716446655440000'
        this.requestId = '146113250'

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

    async fetchToken(formBody){

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

        return fetch('https://api.comdirect.de/api/session/clients/' + this.client_id + '/v1/sessions', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.accessToken,
                'x-http-request-info': '{"clientRequestId":{"sessionId":"' + this.sessionId + '","requestId":"' + this.requestId + '"}}',
                'Content-Type': 'application/json'
            },
        }).then(sessionState => {

            return sessionState.json()
        }).then(sessionRes => {

            return sessionRes
        })

    }

    async validateSession(sessionRes){

        this.sessionBody = '{"identifier":"' + sessionRes[0].identifier + '","sessionTanActive":true,"activated2FA":true}'

            return fetch(this.base_path + '/session/clients/' + this.client_id + '/v1/sessions/' + this.sessionId + '/validate', {
                method: 'POST',
                redirect: 'error',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + this.accessToken,
                    'x-http-request-info': '{"clientRequestId":{"sessionId":"' + this.sessionId + '","requestId":"' + this.requestId + '"}}',
                    'Content-Type': 'application/json'
                },
                body: this.sessionBody
            }).then(session => {
                
                this.authInfo = JSON.parse(session.headers.get('x-once-authentication-info'))
            })

    }

    async fetchResponseTan(){

        return fetch(this.base_path + '/session/clients/' + this.client_id + '/v1/sessions/' + this.sessionId, {
            method: 'PATCH',
            headers: {
               'Accept': 'application/json',
               'Authorization': 'Bearer ' + this.accessToken,
               'x-http-request-info': '{"clientRequestId":{"sessionId":"' + this.sessionId + '","requestId":"' + this.requestId + '"}}',
               'Content-Type': 'application/json',
               'x-once-authentication-info': '{"id":"' + this.authInfo.id + '"}'
            },
            body: this.sessionBody
          
          }).then( responseTan => {

            this.responseTan = responseTan
          })
    }

    async postTanApproveManager(){

        console.log('Response tan')

        await this.fetchResponseTan()

        console.log('Refresh token')

        await this.fetchRefreshToken()
    }

    async fetchRefreshToken(){
        
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