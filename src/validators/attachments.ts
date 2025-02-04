import {Joi,Common,_} from '../config/routeImporter';

// const attachment: Joi.ObjectSchema = Joi.object().keys({
//     id: Joi.number().example(1).description("Unique identifier for the file"),
//     userId: Joi.number().example(1).allow(null).description("User who has uploaded the file"),
//     accountId: Joi.number().example(1).allow(null).description("User account who has uploaded the file"),
//     uniqueName: Joi.string().example('uniquename.ext').description("Unique name for the file"),
//     fileName: Joi.string().example('originalName.ext').description("original file name"),
//     extension: Joi.string().example('ext').description("extension of file name"),
//     filePath: Joi.string().example('/path/to/file.ext').description("path at which file has been stored"),
//     type: Joi.number().example(1).description("If file is stored in local file system or s3, 1=> local 2=> S3 bucket"),
//     size: Joi.number().example(1024).description("Size of file in bytes"),
//     status: Joi.number().example(0).description("If uploaded file has been utilized or not"),
//     createdAt: Joi.date().example("2023-01-02T12:18:55.000Z").description("creation date"),
//     updatedAt: Joi.date().example("2023-01-02T12:18:55.000Z").description("last update date"),
//     thumbnailPath: Joi.string().example('/path/to/thumbnail.ext').description("path at which thumbnail has been stored"),
// }).label('attachment').description("Attachment object");

const attachment: Joi.ObjectSchema = Joi.object().keys({
    id: Joi.number().example(1).description("Unique identifier for the file"),
    userId: Joi.number().example(1).allow(null).description("User who has uploaded the file"),
    accountId: Joi.number().example(1).allow(null).description("User account who has uploaded the file"),
    uniqueName: Joi.string().example('uniquename.ext').description("Unique name for the file"),
    fileName: Joi.string().example('originalName.ext').description("Original file name"),
    extension: Joi.string().example('ext').description("Extension of file name"),
    filePath: Joi.string().example('/path/to/file.ext').description("Path at which file has been stored"),
    type: Joi.number().example(1).description("If file is stored in local file system or s3, 1=> local 2=> S3 bucket"),
    size: Joi.number().example(1024).description("Size of file in bytes"),
    status: Joi.number().example(0).description("If uploaded file has been utilized or not"),
    createdAt: Joi.date().example("2023-01-02T12:18:55.000Z").description("Creation date"),
    updatedAt: Joi.date().example("2023-01-02T12:18:55.000Z").description("Last update date"),
    thumbnailId: Joi.number().allow(null).example(1).description("ID of the generated thumbnail").optional(),
    thumbnailFilePath: Joi.string().allow(null).example('/path/to/thumbnail.ext').description("Path at which thumbnail has been stored").optional()
}).label('attachment').description("Attachment object");

const uploadRequest: Joi.ObjectSchema = Joi.object().keys({
    file: Joi.any().meta({ swaggerType: 'file' }).example("upload file").required().description('File to be uploaded on server')
}).label('upload-attachment').description("Request to upload a file on server");

const uploadResponse: Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData: attachment
}).label('upload-response').description('Upload attachment response');

const getSignedUrl: Joi.ObjectSchema = Joi.object().keys({
    fileName: Joi.string().required().error(errors =>{
         return Common.routeError(errors, 'FILE_NAME_IS_REQUIRED') }).description("Name of file required to be uploaded"),
    encryptDataFlag: Joi.boolean().default(false).example(false).optional().allow(null).description('If document is to be encrypted'),
    fileSize: Joi.number().optional().allow(null).default(0)
}).label("get-signed-url").description("Get signed url from server for S3 bucket");


const decryptDataRequest: Joi.ObjectSchema = Joi.object().keys({
    uniqueName: Joi.string().required().error(errors => { return Common.routeError(errors, 'FILE_NAME_IS_REQUIRED') }).description("Unique name of file is required"),
}).label("decrypt-file-data").description("Get decryption data for encrypted file");

const getSignedUrlResponse: Joi.ObjectSchema = Joi.object().keys({
    message: Joi.string().example("Request status message").description("Message to confirm the operation"),
    responseData: Joi.object().keys({
        id: Joi.number(),
        signedUrl: Joi.string(),
        fileName: Joi.string(),
        uniqueName: Joi.string(),
        dataKey: Joi.object().keys().allow(null)
    }).label('signed-url-data').description("Signedurl Response")
}).label("signed-url").description("Signed url from server for S3 bucket");

const requestWithIdentifier: Joi.ObjectSchema = Joi.object().keys({
    uniqueName: Joi.string().required().error(errors => { return Common.routeError(errors, 'FILE_UNIQUE_NAME_IS_REQUIRED') }).description("Unique name of file is required")
}).label("attachemnt-identifier").description("Request object to find a file");

export {
    uploadRequest,
    uploadResponse,
    attachment,
    requestWithIdentifier,
    getSignedUrl,
    getSignedUrlResponse,
    decryptDataRequest
};
