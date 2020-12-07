namespace com.raprincis.schema;

context models {
    entity Product {
        key ID : Integer;
        name : String(30);
        description : String;
        imageUrl : String;
        type : String;
    }

    entity SoldProduct {
        key product : Association to Product;
        key sale : Association to Sale;
        number : Integer;
    }

    entity Sale {
        key ID: Integer;
        items : Association to many SoldProduct on items.sale = $self;
    }
}