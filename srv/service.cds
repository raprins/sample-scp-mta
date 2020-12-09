using {com.raprincis.schema.models} from '../db/schema';

@path : 'manufacturing'
service Manufacturing {

    //Configure some fields as mandatory
    entity Products as projection on models.Product {
        ID, 
        name @mandatory, 
        description @mandatory, 
        imageUrl, createdAt, modifiedAt
    };
}

@path : 'sales-services'
service Sales {

    // The product has to be in read only in Sales Context
    @readonly
    entity Products  as projection on models.Product {
        ID, name, description, imageUrl, type
    };

    entity Sales     as projection on models.Sale;
    entity SaleItems as projection on models.SoldProduct;
}

@path : 'customer-services'
@impl: './implementations/cs.js'
service Customer {

    @readonly
    entity Customers as projection on models.Customers;

}
