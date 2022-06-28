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

    // setTransactionHeader(){
    //     let header = '';
    //     header = 
    // }

    async fetchToken(formBody){
        console.log('test2')
        await fetch('https://api.comdirect.de/oauth/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody
        }).then(res => {
            return res
        })
        //     console.log('test1')
        //     const jsonContent = await res.json()
        //     return jsonContent
        // }).then(data => {
        //     console.log(data)
        //     return data
        // })

    }
}