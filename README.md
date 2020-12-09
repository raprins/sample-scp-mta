# Sample Cloud Application Model

## Initialize
- Run `cds init` puis `npm install`
- Add some services & db

### Add some Data Structure in Database
```js
entity Product {
        key ID : Integer;
        name : String(30);
        description : String;
        imageUrl : String;
        type : String;
    }
```

- Add database for persistance : `cds add hana`, as a result in **package.json**
```json
...
    "cds": {
        "requires": {
            "db": {
                "kind": "sql" //This has to be changed to hana for deploiment
            }
        }
    }
```

### Expose some Service

```js
using { com.raprincis.schema.models } from '../db/schema';

@path : 'manufacturing'
service Manufacturing {
    entity Products as projection on models.Product;
}

```

### Configure for first deployment
- Add MTA for bundler : `cds add mta`
- A file called **mta.yml** appears
- I change : 

#### Change Service URI
the service host (corresponding to cloud foundry **route**, see : parameters/host)
```yml
type: nodejs
   path: gen/srv
   requires:
    # Resources extracted from CAP configuration
    - name: sample-service-db
   parameters:
     host: store-api
   provides:
    - name: srv-api      # required by consumers of CAP services (e.g. approuter)
      properties:
        srv-url: ${default-url}
```


#### Change Database provider type
The database type since I use hana trial

```yml
type: com.sap.xs.hdi-container
   parameters:
     service: hanatrial #on trial landscapes
     service-plan: hdi-shared
```


- Bundle application `mbt build -t ./`
- Deploy using `cf deploy [something].mtar`


### Set up Local development
#### Bind Service to local development
Setup environment for **local-dev**. Create or grab info of service binding, and put it inside file called **default-env.json**
- Execute `cf env sample-service-srv > default-env.json` 
- The file has to have the structure below :
```json
{
    "VCAP_SERVICES" : {...},
    "VCAP_APPLICATION" : {...}
}
```
- Change **package.json** to requires **"hana"**

```json
"cds": {
        "requires": {
            "db": {
                "kind": "hana"
            }
        }
    }
```

- When launching the project by `cds watch`

```js
[cds] - using bindings from: { registry: '~/.cds-services.json' }
[cds] - connect to db > hana { certificate: '...',
  driver: 'com.sap.db.jdbc.Driver',
  hdi_password: '...',
  hdi_user:
   '70B68B5681E343219C61DE60CB25DE34_4DN7TEM4TSU7G6S8AN1E0N02G_DT',
  host: 'zeus.hana.prod.us-east-1.whitney.dbaas.ondemand.com',
  password: '...',
  port: '21022',
  schema: '70B68B5681E343219C61DE60CB25DE34',
  url:
   'jdbc:sap://zeus.hana.prod.us-east-1.whitney.dbaas.ondemand.com:21022?encrypt=true&validateCertificate=true&currentschema=70B68B5681E343219C61DE60CB25DE34',
  user:
   '70B68B5681E343219C61DE60CB25DE34_4DN7TEM4TSU7G6S8AN1E0N02G_RT' }
[cds] - serving Manufacturing { at: '/manufacturing' }
```

#### Create test script
- For that, create file with [filename].http

```curl
###
GET http://localhost:4004/manufacturing/Products
Accept: application/json


###
POST http://localhost:4004/manufacturing/Products
Content-Type: application/json

{
    "ID": 1,
    "name": "Air Jordan 11",
    "description": "The one that the Airness wore in the movie Space Jam",
    "imageUrl" : "https://images.wave.fr/images//air-jordan-11-concord-date-de-sortie-2.jpg"
}
```

## Upgrade Data to inject aspects, behavior


To upgrade those fields, we can inject aspects : predefined fields that is already filled (AOP in java, I think)

```js
    using { cuid, managed } from '@sap/cds/common';
    ...
    entity Product : cuid, managed{
        name : String(30);
        description : String;
        imageUrl : String;
        type : String;
    }
```

If we want to see the definition of **managed** in **'@sap/cds/common'**

```js
    /*
    * Aspect to capture changes by user and name.
    */
    aspect managed {
        createdAt  : Timestamp @cds.on.insert : $now;
        createdBy  : User      @cds.on.insert : $user;
        modifiedAt : Timestamp @cds.on.insert : $now  @cds.on.update : $now;
        modifiedBy : User      @cds.on.insert : $user @cds.on.update : $user;
    }
```

## Link to another service (use of another OData)

### Import definition
Import a service metadata inside the project and import it `cds import srv/external/Northwind.edmx`

> When importing, there are a lot of problem in the so called csn.json 

As a result, the package.json has changed and it creates file **Northwind.csn**

```json
    ...
    "scripts": {
        "start": "npx cds run"
    },
    "cds": {
        "requires": {
        "db": {
            "kind": "hana"
        },
        "Northwind": {
            "kind": "odata",
            "model": "srv/external/Northwind"
        }
        }
    }
    }
```

The terminal will prompt :
```
    user: sample-service $ cds import srv/external/Northwind.edmx
    [cds] - updated ./package.json
    [cds] - imported API to srv/external/Northwind.csn
    > use it in your CDS models through the like of:

    using { Northwind as external } from './external/Northwind.csn';
```

### Use Destination
To use a service, import the following package :
- @sap/xsenv


#### Connect to a service 
To connect to service, we have to connect via Oauth Service, in the VCAP_SERVICE (credentials)

- Get the authentication config : in credential>url plus open id config
```js
    async function getDiscovery(url) {
        const response = await axios.get(`${url}/.well-known/openid-configuration`)
        return response.data
    }
```
- Use [Token Logon](https://docs.cloudfoundry.org/api/uaa/version/74.29.0/index.html#token)

```js
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
```

-  After that [see this](https://api.sap.com/api/SAP_CP_CF_Connectivity_Destination/resource)
```js

    const DESTINATION_BASE_PATH = '/destination-configuration/v1'

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
```

### Call the service

```js
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
```
