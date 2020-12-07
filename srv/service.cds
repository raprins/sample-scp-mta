using { com.raprincis.schema.models } from '../db/schema';

@path : 'manufacturing'
service Manufacturing {
    entity Products as projection on models.Product;
}
