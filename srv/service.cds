using { com.raprincis.schema.models } from '../db/schema';

@path : 'manufacturing'
service Manufacturing {

    //Configure some fields as mandatory
    entity Products as projection on models.Product {
        ID,
        name @mandatory,
        description @mandatory,
        imageUrl,
        type
    };
}

@path : 'sales-services'
service Sales {

    // The product has to be in read only in Sales Context
    @readonly
    entity Products as projection on models.Product;

    entity Sales as projection on models.Sale;
    entity SaleItems as projection on models.SoldProduct;
} 
