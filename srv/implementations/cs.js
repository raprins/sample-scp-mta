const cds = require('@sap/cds');
const xsenv = require('@sap/xsenv');
const {default : axios} = require('axios')

const {getDestinationByName } = require('../libraries/connection')

const destination = xsenv.filterCFServices({
    name : "sample-destination"
})[0]

module.exports = cds.service.impl(async service => {
    service.on("READ","Customers", async context => {
        const customers = await getCustomers()
        return customers
    })
})

async function getCustomers() {
    const {credentials} = destination
    const northwindDestination = await getDestinationByName(credentials, 'Northwind')
    const {destinationConfiguration} = northwindDestination
    const result = await axios.get(`${destinationConfiguration.URL}/Customers`, {
        headers : {
            'Accept': 'application/json'
        }
    })

    return result.data.value.map(({CustomerID,ContactName,ContactTitle,Address,City}) => ({
        CustomerID,
        ContactName,
        ContactTitle,
        Address, 
        City
    }))
}