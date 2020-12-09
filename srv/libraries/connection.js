const { default : axios } = require('axios')


/**
 * @typedef {object} Credentials
 * @property {string} clientid
 * @property {string} clientsecret
 * @property {string} identityzone
 * @property {string} instanceid
 * @property {string} tenantid
 * @property {string} tenantmode
 * @property {string} uaadomain
 * @property {string} uri - Service Url
 * @property {string} url - Authentication Url
 * @property {string} verificationkey
 * @property {string} xsappname
 */


 
/**
 * @typedef {object} DestinationOwner
 * @property {string} SubaccountId
 * @property {string} Type
 * @property {string} URL
 * @property {string} Authentication
 * @property {string} ProxyType
 * @property {string} Description
 */

/**
 * @typedef {object} DestinationConfiguration
 * @property {string} Name
 * @property {string} InstanceId
 */


/**
 * @typedef {object} DestinationDefinition
 * @typedef {DestinationOwner} owner
 * @typedef {DestinationConfiguration} destinationConfiguration
 */

module.exports = {
    getDiscovery,
    getToken,
    getDestinationByName
}

/**
 * Get Authentication Token
 * @param {Credentials} credentials 
 */
async function getToken(credentials) {

    const {url, clientid, clientsecret} = credentials
    const discovery = await getDiscovery(url)
    const {token_endpoint} = discovery
    const token = await _getClientCredentialToken(token_endpoint, clientid, clientsecret)
    return token
}


async function _getClientCredentialToken(oauthTokenUrl, clientId, cliendSecret) {
    const data = new URLSearchParams()
    data.append('client_id', clientId)
    data.append('client_secret', cliendSecret)
    data.append('grant_type', 'client_credentials')

    const response = await axios.post(`${oauthTokenUrl}`,data.toString(), {
        headers : {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
    })

    return response.data
}

async function getDiscovery(url) {
    const response = await axios.get(`${url}/.well-known/openid-configuration`)
    return response.data
}


const DESTINATION_BASE_PATH = '/destination-configuration/v1'

/**
 * Get Authentication Token
 * @param {Credentials} credentials
 * @param {string} destinationName 
 * @returns {DestinationDefinition}
 */
async function getDestinationByName(credentials, destinationName) {
    const token = await getToken(credentials)
    const {access_token, token_type, expires_in, scope, jti} = token
    const {uri} = credentials
    const response = await axios.get(`${uri}${DESTINATION_BASE_PATH}/destinations/${destinationName}`, {
        headers : {
            'Authorization' : `${token_type} ${access_token}`
        }
    })

    return response.data
}


