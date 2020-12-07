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