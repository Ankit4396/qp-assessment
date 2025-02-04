import {Joi,Common,_} from '../config/routeImporter';

const emailTemplateRequest:  Joi.ObjectSchema = Joi.object().keys({
    code: Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'EMAIL_TEMPLATE_CODE_IS_REQUIRED')}).example("UNIQUE_CODE").description('Code to uniquely identify email template'),
    title:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'EMAIL_TITLE_SUBJECT_IS_REQUIRED')}).example("Title for template").description('Template title'),
    subject:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'EMAIL_TEMPLATE_SUBJECT_IS_REQUIRED')}).example("Subject line").description('Subject of email with replacement placeholders'),
    message:Joi.string().trim().required().error(errors=>{return Common.routeError(errors,'EMAIL_TEMPLATE_MESSAGE_IS_REQUIRED')}).example("Email content").description('Email content with replacement placeholders'),
    replacements:Joi.string().trim().optional().allow(null,'').example("Replacement tokens").description('Comma separated keywords for replacements')
}).label('email-template-request').description('Request objest for email template')

const emailTemplteIdentity=Joi.object().keys({
    id:Joi.number().required().example(1).description("Unique identifier for the email template"),
}).label('category-type-identiry').description('Identifier for the content type')

const emailTemplate:  Joi.ObjectSchema = Joi.object().keys({
    id:Joi.number().example(1).description("Unique identifier for the email template"),
    code:Joi.string().example('template-code').description("Unique code for email template"),
    title:Joi.string().example("Email template title").description('Title of email template'),
    subject:Joi.string().trim().example("Subject line").description('Subject of email with replacement placeholders'),
    message:Joi.string().trim().example("Email content").description('Email content with replacement placeholders'),
    replacements:Joi.string().trim().example("NAME,CODE").description('Raplacement tokens for the email template'),
    userId:Joi.number().allow(null).example(1).description("Identity of the user who has created the record"),
    status:Joi.number().example(1).valid(0,1).description("activation status"),
    isRevision:Joi.boolean().example(true).allow(null).description("If the entry is stored as revision or not"),
    revisionId:Joi.number().example(1).allow(null).description("ref to the revision entity"),
    createdAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("creation date"),
    updatedAt:Joi.date().example("2023-01-02T12:18:55.000Z").description("last update date")
}).label('email-template').description('Email templare object')

const emailTemplateListRequest={
    page : Joi.number().optional().default(1),
    perPage:Joi.number().optional().min(1).default(process.env.PAGINATION_LIMIT!),
}

const emailTemplateStatusRequest :  Joi.ObjectSchema = Joi.object().keys({
    status:Joi.boolean().required().error(errors=>{return Common.routeError(errors,'EMAIL_TEMPLATE_STATUS_IS_REQUIRED')}).valid(true,false).description("Status of the email template").default(true)
}).label('email-template-status-request').description("Request to updated status of the email template")


const emailTemplateResponse={
    userId: Joi.number().allow(null),
    lastUpdatedById: Joi.number().allow(null),
    isRevision: Joi.boolean(),
    revisionId: Joi.number().allow(null),
    id: Joi.number(),
    code: Joi.string(),
    replacements: Joi.string(),
    accountId: Joi.number().allow(null),
    status: Joi.number(),
    updatedAt: Joi.string(),
    createdAt: Joi.string(),
    title:Joi.string(),
    subject: Joi.string(),
    message: Joi.string()
}

export{
    emailTemplateRequest,
    emailTemplteIdentity,
    emailTemplate,
    emailTemplateListRequest,
    emailTemplateStatusRequest,
    emailTemplateResponse
}