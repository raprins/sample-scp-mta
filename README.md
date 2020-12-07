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