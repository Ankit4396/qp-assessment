const constants = {
    STATUS:{
        ACTIVE:1,
        INACTIVE:0
    },
    LANGUAGE:{
        en:1,
        fr:3
    },
    ATTACHMENT_TYPE:{
        LOCAL:1,
        S3_BUCKET:2
    },
    UserProfileAttributes:['name'],
    AttachmentAttributes:['id','uniqueName','filePath','fileName'],
    PAYMENT_STATUS:{
        created:0,
        captured:2,
        refunded:3,
        failed:4,
        authorized:5
    },
}

export default constants;