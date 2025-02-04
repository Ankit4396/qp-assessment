const STATUS = {
    ACTIVE: 1,
    INACTIVE: 0,
  };
  


const ATTACHMENT_TYPE = {
    LOCAL: 1,
    S3_BUCKET: 2,
  };

const DISCOUNT_TYPE = {
    PERCENTAGE:1,
    FIXED:2
}  

  
const UserProfileAttributes: string[] = ['name'];
  
const AttachmentAttributes: string[] = ['id', 'uniqueName', 'filePath', 'fileName'];
  
const PAYMENT_STATUS = {
    created: 0,
    captured: 2,
    refunded: 3,
    failed: 4,
    authorized: 5,
  };







const ORDER_STATUS={
  ORDER_IN_DRAFT: 0,
  ORDER_PLACED: 5,
  RIDER_STARTED_TO_THE_LOCATION: 8,
  RIDER_REACHED_AT_LOCATION: 10,
  ORDER_PICKED: 15,
  ORDER_DELIVERED: 20,
  ORDER_CANCELLED: 25
}





  export {
    STATUS,
    ATTACHMENT_TYPE,
    UserProfileAttributes,
    AttachmentAttributes,
    PAYMENT_STATUS,
    ORDER_STATUS,
    DISCOUNT_TYPE,
 
  }
  