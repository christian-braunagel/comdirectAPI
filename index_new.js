import fetch from 'node-fetch'
import {ComdirectOauth} from './ComdirectOauth.js'
import * as readline from "readline"

let base_path = 'https://api.comdirect.de/api';

let comdirectOauth = new ComdirectOauth();

let details = comdirectOauth.details;

let sessionId = comdirectOauth.sessionId;
let requestId = comdirectOauth.requestId;

let formBody = comdirectOauth.createBody(details);


async function performCdOauth(){

    try{
        console.log('1. Get token')

        // Working now because function call returns a promise and not the access token
        comdirectOauth.accessToken = await comdirectOauth.fetchToken(formBody)

        console.log('2. Get session with ' + comdirectOauth.accessToken)
    
        let sessionRes = await comdirectOauth.fetchSessionState()
        
        console.log('3. Validate session')

        await comdirectOauth.validateSession(sessionRes)

        // wait for approvement from app
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('Approved in app?', ans => {

            comdirectOauth.postTanApproveManager()

            rl.close()
        })

    }

    catch(error){
        console.log("Some error" + error)
    }

}

performCdOauth()