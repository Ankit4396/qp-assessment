import * as AWS from 'aws-sdk';
AWS.config.update({signatureVersion: 'v4',accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_ACCESS_SECRET,region:process.env.S3_REGION})
import * as uuid from 'uuid';
// import * as Models from '../models';
import Hapi from "@hapi/hapi"
import * as Common from './common';
import * as Constants from '../constants';
import * as Moment from 'moment';
import * as _ from 'lodash';
import { Sequelize, Op } from '../config/dbImporter';
import * as Path from 'path';
import * as Fs from 'file-system';
import { Readable } from 'stream';
import * as extensions from '../config/extensions';
import sharp from 'sharp';
import * as crypto from 'crypto-js';
import { object } from 'joi';
import Attachment from '../models/Attachment';
import { Models } from '../models';
import { Response } from 'aws-sdk';
import {Stream} from "stream";

import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { pipeline } from 'stream';
import os from 'os';
const streamPipeline = promisify(pipeline);

interface fileOptions {
    dest:string,
    userId:number;
}

const attributes: string[] = ['id', 'filePath', 'uniqueName', 'fileName', 'extension', 'type'];

/** Create directory structure */
const createFolderIfNotExists = (createDirectory: boolean): string => {
    const dt = new Date();
    const folder = dt.getUTCFullYear() + "/" + dt.getUTCMonth() + "/" + dt.getUTCDate() + '/';
    const targetDir = 'resources/attachments/' + folder;
    if (createDirectory)
        Fs.mkdirSync(targetDir, { recursive: true }, 0o777);
    return targetDir;
}

/** Check file is array or object and call respective functions */
const uploader = (files: Stream, options: fileOptions) => {
    return fileHandler(files, options);
}

// /** Function to upload multiple files */
// const filesHandler = (files: any[], options: any) => {
//     const promises = files.map(x => fileHandler(x, options));
//     return Promise.all(promises);
// }

/** unlink file from path */
const unlinkFile = (path: string) => {
    Fs.unlink(path, (err: string) => {
        if (err) {
            console.error(err)
            return
        }
    })
}

const encryptAES = (key: any, message: string): string => {
    var iv = crypto.enc.Hex.parse(process.env.IV);
    var ciphertext = crypto.AES.encrypt(message, key.toString(), { iv: iv, mode: crypto.mode.ECB, padding: crypto.pad.NoPadding }).toString();
    return ciphertext;
}

const decryptAES = (key: any, message: string): string => {
    var iv = crypto.enc.Hex.parse(process.env.IV);
    var text = crypto.AES.decrypt(message, key.toString(), { iv: iv, mode: crypto.mode.ECB, padding: crypto.pad.NoPadding }).toString(crypto.enc.Utf8);
    return text;
}

/** Function to upload single file */
const fileHandler = async (file: Hapi.RequestQuery, options: fileOptions): Promise<any> => {
    try {
        const extension = Path.extname(file.hapi.filename);
        const name = uuid.v1() + extension;
        const Resizedname = 'thumb_' + name;
        const destinationPath = `${options.dest}${name}`;
        const destinationPathResized = `${options.dest}${Resizedname}`;
        const fileStream = await Fs.createWriteStream(destinationPath);
        let imageFileExtensions = ['.jpeg', '.png', '.jpg', '.svg', '.webp'];
        return new Promise((resolve, reject) => {
            file.on('error', (err:string) => {
                reject(err);
            });
            file.pipe(fileStream);
            file.on('end', async () => {
                setTimeout(async () => {
                    if (imageFileExtensions.includes(extension.toLowerCase())) {
                        let imageMeta = await sharp(destinationPath).metadata();
                        if (imageMeta.width != undefined &&  imageMeta.width > 800 || imageMeta.height != undefined && imageMeta.height > 800) {
                            if (extension == '.png') {
                                sharp(destinationPath).resize({ fit: sharp.fit.inside, width: 800, height: 800  }).png({ compressionLevel: 9,quality: 90 }).toFile(destinationPathResized).then(() => {
                                    Fs.unlink(destinationPath, (() => {
                                        Fs.rename(destinationPathResized, destinationPath, (() => { }));
                                    }));
                                });
                             }
                             else {
                                sharp(destinationPath).resize({ fit: sharp.fit.inside, width: 800, height: 800 }).toFile(destinationPathResized).then(() => {
                                    Fs.unlink(destinationPath, (() => {
                                        Fs.rename(destinationPathResized, destinationPath, (() => { }));
                                    }));
                                });
                            }
                        }
                    }
                    const { size } = Fs.statSync(destinationPath);
                    const fileDetails = {
                        uniqueName: name,
                        fileName: file.hapi.filename,
                        extension: extension.replace('.', ''),
                        filePath: destinationPath,
                        size: size,
                        userId: options.userId,
                        status: Constants.STATUS.INACTIVE
                    }
                    resolve(fileDetails);
                }, 100);
            });
        });
    } catch (err) {
        return {}
    }
}

export const createS3Attachment = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
        let userId = null;
        let accountId = null;
        let dataKey = null;
        let extension;
        let uniqueName = null;
        if (request.auth.isAuthenticated) {
            userId = request.auth.credentials.userData.id;
            accountId = request.auth.credentials.userData.accountId;
            dataKey = request.auth.credentials.userData.dataKey;
            extension = request.auth.credentials.userData.extension;
            uniqueName = request.auth.credentials.userData.uniqueName;
        }
        let { key, fileName } = request.payload;
        const bucketName = process.env.S3_BUCKET_NAME;
        const s3 = new AWS.S3()
        var params: AWS.S3.GetObjectRequest ={
            Bucket: `${bucketName}`,
            Key:key
        }
        var object = await s3.getObject(params).promise();
        if (object.ContentLength) {
            let keyParts = key.split('/');
            let uniqueName = keyParts.at(-1);
            
                
            let attachment = await Models.Attachment.create({
                userId: userId,
                accountId: accountId,
                fileName: fileName,
                filePath: key,
                size: object.ContentLength,
                type: Constants.ATTACHMENT_TYPE.S3_BUCKET,
                status: Constants.STATUS.INACTIVE,
                uniqueName: uniqueName,
                dataKey: dataKey,
                extension: extension         
            });
            if (attachment) {
                return h.response({
                    message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_UPLOADED_SUCCESSFULLY")),
                    responseData: attachment
                }).code(200)
            } else {
                return Common.generateError(request, 400, 'ERROR_WHILE_STORING_FILE_DATA', {});
            }
        } else {
            return Common.generateError(request, 404, 'FILE_NOT_FOUND', {});
        }
    } catch (err) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// export const gets3SignedUrl = async (request: any, h: any) => {
//     try {
//         let userId = null;
//         let accountId = null;
//         if (request.auth.isAuthenticated) {
//             userId = request.auth.credentials.userData.id;
//             accountId = request.auth.credentials.userData.accountId;
//         }
//         const { fileName, encryptDataFlag, fileSize } = request.query;
//         const extension = Path.extname(fileName);
//         const uniqueName = uuid.v1() + extension;
//         const s3 = new AWS.S3()
//         const dt = new Date();
//         const folder = dt.getUTCFullYear() + "/" + dt.getUTCMonth() + "/" + dt.getUTCDate() + '/';
//         const filePath = process.env.S3_KEY_PREFIX + folder + uniqueName;
//         const myBucket = process.env.S3_BUCKET_NAME;
//         const myKey = filePath;
//         const signedUrlExpireSeconds = +process.env.S3_URL_EXPIRATION_TIME;
//         let checkPrerequisites = await Common.checkPrerequisites(userId, accountId, fileSize);
//         if (!checkPrerequisites) {
//             return Common.generateError(request, 400, 'STORAGE_LIMIT_EXCEEDS', {});
//         }
//         const url = await s3.getSignedUrl('putObject', {
//             Bucket: myBucket,
//             Key: myKey,
//             Expires: signedUrlExpireSeconds
//         })
//         if (encryptDataFlag) {
//             const cmk = new AWS.KMS();
//             const params = {
//                 KeyId: process.env.CMK_KEY_ID, // AWS KMS ID
//                 KeySpec: process.env.CMK_KEY_SPEC // Specifies the type of data key to return.
//             };
//             let dataKey = await cmk.generateDataKey(params).promise();
//             if (dataKey) {
//                 const params = {
//                     CiphertextBlob: dataKey.CiphertextBlob
//                 };
//                 let regen = await cmk.decrypt(params).promise();
//                 let attachment = await Models.Attachment.create({
//                     userId: userId,
//                     accountId: accountId,
//                     uniqueName: uniqueName,
//                     fileName: fileName,
//                     extension: extension.trim(),
//                     filePath: filePath,
//                     size: 0,
//                     status: Constants.STATUS.INACTIVE,
//                     type: Constants.ATTACHMENT_TYPE.S3_BUCKET,
//                     dataKey: dataKey.CiphertextBlob.toString('base64')
//                 })
//                 return h.response({
//                     message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("SIGNED_URL_CREATED_SUCCESSFULLY"),
//                     responseData: {
//                         id: attachment.id,
//                         signedUrl: url,
//                         fileName: fileName,
//                         uniqueName: uniqueName,
//                         dataKey: {
//                             Plaintext: regen.Plaintext.toString('base64')
//                         }
//                     }
//                 }).code(200)
//             } else {
//                 return Common.generateError(request, 400, 'ERROR_WHILE_GENERATING_DATA_KEY', {});
//             }
//         } else {
//             return h.response({
//                 message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("SIGNED_URL_CREATED_SUCCESSFULLY"),
//                 responseData: { signedUrl: url, fileName: fileName, uniqueName: uniqueName }
//             }).code(200)
//         }
//     } catch (err) {
//         return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
//     }
// }

// export const getDecryptionData = async (request: any, h: any) => {
//     try {
//         let userId = request.auth.credentials.userData.id;
//         let accountId = request.auth.credentials.userData.accountId;
//         let { uniqueName } = request.query;
//         let attachment = await Models.Attachment.findOne({
//             where: {
//                 uniqueName: uniqueName, [Op.or]: [
//                     { userId: null },// attachment is uploaded as public content
//                     { userId: userId }, // user is owner of the document
//                     {
//                         [Op.and]: [
//                             [Sequelize.where(Sequelize.col('`Document->nominees->sharedWithNominees`.`invitee_id`'), '=', userId)],
//                             [Sequelize.where(Sequelize.col('`Document`.`shared_with_nominee`'), '=', 1)]
//                         ]
//                     },
//                     {
//                         [Op.and]: [
//                             [Sequelize.where(Sequelize.col('`Document->author->userNominees`.`invitee_id`'), '=', userId)],
//                             [Sequelize.where(Sequelize.col('`Document`.`shared_with_universal_nominee`'), '=', 1)]
//                         ]
//                     }
//                 ]
//             },
//             include: [
//                 {
//                     model: Models.Document,
//                     include: [
//                         {
//                             model: Models.DocumentSharing, as: 'nominees',
//                             include: [
//                                 { model: Models.Nominee, as: 'sharedWithNominees' }
//                             ]
//                         },
//                         {
//                             model: Models.User, as: 'author',
//                             include: [
//                                 {
//                                     model: Models.Nominee, as: 'userNominees',
//                                     where: { isUniversalNominee: 1 }
//                                 }
//                             ]
//                         }
//                     ]
//                 },
//             ],
//             subQuery: false
//         });
//         if (attachment) {
//             const cmk = new AWS.KMS();
//             const s3 = new AWS.S3()
//             const signedUrlExpireSeconds = +process.env.S3_URL_EXPIRATION_TIME;
//             const params = {
//                 CiphertextBlob: Buffer.from(attachment.dataKey, "base64")
//             };
//             let regen = await cmk.decrypt(params).promise();
//             const myBucket = process.env.S3_BUCKET_NAME;
//             const url = await s3.getSignedUrl('getObject', {
//                 Bucket: myBucket,
//                 Key: attachment.filePath,
//                 Expires: signedUrlExpireSeconds
//             })
//             return h.response({
//                 message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("SIGNED_URL_CREATED_SUCCESSFULLY"),
//                 responseData: {
//                     id: attachment.id,
//                     signedUrl: url,
//                     fileName: attachment.fileName,
//                     uniqueName: uniqueName,
//                     dataKey: {
//                         Plaintext: regen.Plaintext.toString('base64')
//                     }
//                 }
//             }).code(200)
//         } else {
//             return Common.generateError(request, 400, 'FILE_NOT_FOUND', {});
//         }
//     } catch (err) {
//         return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
//     }
// }

export const verifyS3Upload = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
      let key = request.query.key;
      const bucketName = process.env.S3_BUCKET_NAME;
      const s3 = new AWS.S3();
  
      var params: AWS.S3.GetObjectRequest = {
        Bucket: `${bucketName}`,
        Key: key,
      };
  
      var object = await s3.getObject(params).promise();
  
      if (object.ContentLength !== undefined) {
        return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_EXISTS_IN_S3")) }).code(200);
      } else {
        return Common.generateError(request, 404, 'FILE_NOT_FOUND', {});
      }
    } catch (err) {
      return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
  };

  const probeVideo = (videoFilePath: string) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata.format.duration);
                // console.log("----->metadataofVideo",metadata);
            }
        });
    });
}

  const generateThumbnail = async (videoFilePath: string, thumbnailFilePath: string) => {
    const duration = await probeVideo(videoFilePath);
    const screenshotTimes  = (duration as number * 50) / 100;
    console.log("screenshotTimes----->",screenshotTimes);

    return new Promise((resolve, reject) => {
        ffmpeg(videoFilePath)
            // .seekInput(screenshotTime)
            .screenshots({
                count: 1,
                folder: Path.dirname(thumbnailFilePath),
                filename: Path.basename(thumbnailFilePath),
                size: '1080x?',
                timestamps: [screenshotTimes]
            })
            .on('end',() => resolve(thumbnailFilePath))
            .on('error', reject);
    });
}


const isVideoFile = (extension: string) => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
    return videoExtensions.includes(extension.toLowerCase());
}

export const upload = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
        let userId = null;
        let accountId = null;
        if (request.auth.isAuthenticated) {
            userId = request.auth.credentials.userData.id;
            accountId = request.auth.credentials.userData.accountId;
        }

        if (request.payload && request.payload['file']) {

            if (+process.env.USE_FILE_SYSTEM!) {
                console.log('--- USED_FILE_SYSTEM ---', process.env.USE_FILE_SYSTEM);
                const extension = Path.extname(request.payload.file.hapi.filename);
                const filePath = createFolderIfNotExists(true);
                const uploadInfo = { dest: filePath, userId: userId };
                let fileDetails = await uploader(request.payload['file'], uploadInfo);
                console.log("--------> fileDetails", fileDetails);

                if (fileDetails && fileDetails.hasOwnProperty('uniqueName')) {
                    let respData = await Models.Attachment.create(fileDetails);
                    respData = JSON.parse(JSON.stringify(respData));
                    if (respData) {
                        delete respData['dataKey'];
                    }
                    respData['filePath'] = process.env.API_PATH + respData.uniqueName;

                    if (isVideoFile(extension)) {
                        const videoFilePath = Path.join(filePath, fileDetails.uniqueName);
                        fs.writeFileSync(videoFilePath, Buffer.from(request.payload.file._data, 'binary'));

                        const thumbnailFileName = uuid.v1() + '.png';
                        const thumbnailFilePath = Path.join(filePath, thumbnailFileName);
                        let thumbnail;
                        try {
                            thumbnail = await generateThumbnail(videoFilePath, thumbnailFilePath);
                            console.log('Thumbnail generated at:', thumbnail);
                        } catch (error) {
                            console.error('Error generating thumbnail:', error);
                            throw error;
                        }

                        if (fs.existsSync(thumbnailFilePath)) {
                            const thumbnailSize = fs.statSync(thumbnailFilePath).size;
                            const thumbnailDetails = {
                                uniqueName: thumbnailFileName,
                                fileName: thumbnailFileName,
                                extension: 'png',
                                filePath: thumbnailFilePath,
                                size: thumbnailSize,
                                userId: userId,
                                accountId: accountId,
                                status: Constants.STATUS.INACTIVE,
                                type: Constants.ATTACHMENT_TYPE.LOCAL,
                                dataKey: undefined,
                            }
                            console.log("thumbnailDetails----->", thumbnailDetails);

                            let thumbnailResponseData = await Models.Attachment.create(thumbnailDetails);
                            thumbnailResponseData = JSON.parse(JSON.stringify(thumbnailResponseData));
                            thumbnailResponseData['filePath'] = process.env.API_PATH + thumbnailResponseData.uniqueName;

                            console.log("thumbnailResponseData----->", thumbnailResponseData);

                            await Models.Attachment.update({ thumbnailId: thumbnailResponseData.id }, { where: { id: respData.id } });

                            // fs.unlinkSync(videoFilePath);

                            const finalResponseData = {
                                id: respData.id,
                                thumbnailId: thumbnailResponseData.id,
                                uniqueName: respData.uniqueName,
                                filePath: respData.filePath,
                                thumbnailFilePath: thumbnailResponseData.filePath,
                                extension: respData.extension,
                                size: respData.size,
                                userId: respData.userId,
                                accountId: respData.accountId,
                                status: respData.status,
                                type: respData.type,
                                updatedAt: respData.updatedAt,
                                createdAt: respData.createdAt,
                            }
                            console.log("-------------> finalResponseData ", finalResponseData);
                            return h.response({
                                responseData: finalResponseData,
                                message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_UPLOADED_SUCCESSFULLY"))
                            }).code(200);
                        } else {
                            console.error('Thumbnail file does not exist at:', thumbnailFilePath);
                            throw new Error('Thumbnail generation failed');
                        }
                    } else {
                        return h.response({
                            message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_UPLOADED_SUCCESSFULLY")),
                            responseData: respData
                        }).code(200);
                    }
                } else {
                    return Common.generateError(request, 400, 'ERROR_WHILE_UPLOADING_FILE', {});
                }
            } else {
                console.log('--- USED_S3 ---', process.env.USE_FILE_SYSTEM)
                const extension = Path.extname(request.payload.file.hapi.filename);
                const uniqueName = uuid.v1() + extension;
                const bucketName = process.env.S3_BUCKET_NAME;
                const fileName = createFolderIfNotExists(false);
                const fileContent = Buffer.from(request.payload.file._data, 'binary');

                /*----------- Quality reduction code -------------*/

                // const tempDir = Path.join(__dirname, '../../temp'); // Temp directory for intermediate files
                // const imageFileExtensions = ['.jpeg', '.png', '.jpg', '.svg', '.webp'];
    
                // if (!fs.existsSync(tempDir)) {
                //     fs.mkdirSync(tempDir, { recursive: true });
                // }
    
                // let processedFilePath;
                // if (imageFileExtensions.includes(extension)) {
                //     const tempResizedFilePath = Path.join(tempDir, 'resized_' + uniqueName);
                //     const originalBuffer = Buffer.from(request.payload.file._data, 'binary');
                //     try {
                //         console.log('--- Quality reduction started ---');
                //         await sharp(originalBuffer)
                //             .resize({ fit: sharp.fit.inside, width: 1600, height: 1600 })
                //             // .toFormat('jpeg', { compressionLevel: 9,quality: 90 })
                //             // .png({ compressionLevel: 9,quality: 90 })
                //             .toFile(tempResizedFilePath);
                //         processedFilePath = tempResizedFilePath;
                //     } catch (err) {
                //         console.error('Error resizing image with sharp:', err);
                //         return Common.generateError(request, 400, 'ERROR_WHILE_RESIZING_FILE', {});
                //     }
                // } else {
                //     // Save non-image files directly
                //     processedFilePath = Path.join(tempDir, uniqueName);
                //     fs.writeFileSync(processedFilePath, Buffer.from(request.payload.file._data, 'binary'));
                // }
    
                // const fileContent = fs.readFileSync(processedFilePath);

                const s3 = new AWS.S3();
                const s3Params = {
                    Bucket: `${bucketName}`,
                    Key: process.env.S3_KEY_PREFIX + fileName + uniqueName,
                    Body: fileContent
                };

                // Upload file to S3
                const uploadedFile = await s3.upload(s3Params).promise();

                // // Clean up temporary file
                // if (fs.existsSync(processedFilePath)) {
                //     fs.unlinkSync(processedFilePath);
                // }

                /* ----------- Quality reduction code end-------------*/

                // Get file metadata to fetch ContentLength
                const headParams = {
                    Bucket: `${bucketName}`,
                    Key: process.env.S3_KEY_PREFIX + fileName + uniqueName
                };
                const fileMetadata = await s3.headObject(headParams).promise();
                const fileSize = fileMetadata.ContentLength !== undefined ? fileMetadata.ContentLength : 0;

                const dataKey = request?.auth?.credentials?.userData?.dataKey || null;
                const filePath = process.env.S3_KEY_PREFIX + fileName + uniqueName;

                const fileDetails = {
                    uniqueName: uniqueName,
                    fileName: request.payload.file.hapi.filename,
                    extension: extension.replace('.', ''),
                    filePath: filePath,
                    size: fileSize,
                    userId: userId,
                    accountId: accountId,
                    status: Constants.STATUS.INACTIVE,
                    type: Constants.ATTACHMENT_TYPE.S3_BUCKET,
                    dataKey: dataKey,
                    thumbnailPath: null
                };

                if (isVideoFile(extension)) {
                    // Process video for thumbnail generation
                    const baseDir = Path.resolve(__dirname, '../../');
                    const thumbnailDir = Path.join(baseDir, 'thumbnails');
                    if (!fs.existsSync(thumbnailDir)) {
                        fs.mkdirSync(thumbnailDir, { recursive: true });
                    }

                    const videoTempPath = Path.join(thumbnailDir, uniqueName);
                    fs.writeFileSync(videoTempPath, fileContent);

                    // Generate thumbnail
                    const thumbnailFileName = uuid.v1() + '.png';
                    const thumbnailFilePath = Path.join(thumbnailDir, thumbnailFileName);
                    let thumbnail;
                    try {
                        thumbnail = await generateThumbnail(videoTempPath, thumbnailFilePath);
                        console.log('Thumbnail generated at:', thumbnail);
                    } catch (error) {
                        console.error('Error generating thumbnail:', error);
                        throw error;
                    }

                    if (fs.existsSync(thumbnailFilePath)) {
                        // Upload thumbnail to S3
                        const thumbnailContent = fs.readFileSync(thumbnailFilePath);
                        const s3ThumbnailParams = {
                            Bucket: `${bucketName}`,
                            Key: process.env.S3_KEY_PREFIX + fileName + thumbnailFileName,
                            Body: thumbnailContent
                        };
                        const uploadedThumbnail = await s3.upload(s3ThumbnailParams).promise();

                        // Clean up temporary video file
                        fs.unlinkSync(videoTempPath);

                        // Create DB entry for the video file
                        let responseData = await Models.Attachment.create(fileDetails);
                        responseData = JSON.parse(JSON.stringify(responseData));
                        responseData = _.omit(responseData, ['dataKey']);
                        responseData['filePath'] = process.env.API_PATH + responseData.uniqueName;


                        const headThumbnailParams = {
                            Bucket: `${bucketName}`,
                            Key: process.env.S3_KEY_PREFIX + fileName + thumbnailFileName
                        };
                        const fileMetadata = await s3.headObject(headThumbnailParams).promise();
                        console.log("----------> fileMetadata", fileMetadata);
                        const fileSize = fileMetadata.ContentLength !== undefined ? fileMetadata.ContentLength : 0;

                        // create DB entry for thumbnail file
                        const thumbnailDetails = {
                            uniqueName: thumbnailFileName,
                            fileName: thumbnailFileName,
                            extension: 'png',
                            filePath: process.env.S3_KEY_PREFIX + fileName + thumbnailFileName,
                            size: fileSize,
                            userId: userId,
                            accountId: accountId,
                            status: Constants.STATUS.INACTIVE,
                            type: Constants.ATTACHMENT_TYPE.S3_BUCKET,
                            dataKey: dataKey
                        }

                        let thumbnailResponseData = await Models.Attachment.create(thumbnailDetails);
                        thumbnailResponseData = JSON.parse(JSON.stringify(thumbnailResponseData));
                        thumbnailResponseData = _.omit(thumbnailResponseData, ['dataKey']);
                        thumbnailResponseData['filePath'] = process.env.API_PATH + thumbnailResponseData.uniqueName;

                        console.log("----------> thumbnailResponseData", thumbnailResponseData);
                        const thumbnailId = thumbnailResponseData.id;
                        console.log("----------> thumbnailId", thumbnailResponseData.id);

                        await Models.Attachment.update({ thumbnailId: thumbnailId }, { where: { id: responseData.id } });


                        // Clean up temporary thumbnail file
                        fs.unlinkSync(thumbnailFilePath);

                        const finalResponseData = {
                            id: responseData.id,
                            thumbnailId: thumbnailId,
                            uniqueName: responseData.uniqueName,
                            filePath: responseData.filePath,
                            thumbnailFilePath: thumbnailResponseData.filePath,
                            extension: responseData.extension,
                            size: responseData.size,
                            userId: responseData.userId,
                            accountId: responseData.accountId,
                            status: responseData.status,
                            type: responseData.type,
                            updatedAt: responseData.updatedAt,
                            createdAt: responseData.createdAt,
                        }
                        console.log("-------------> finalResponseData ", finalResponseData);
                        return h.response({
                            responseData: finalResponseData,
                            message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_UPLOADED_SUCCESSFULLY"))
                        }).code(200);
                    } else {
                        console.error('Thumbnail file does not exist at:', thumbnailFilePath);
                        throw new Error('Thumbnail generation failed');
                    }
                } else {
                    // Create DB entry for non-video file
                    let responseData = await Models.Attachment.create(fileDetails);
                    responseData = JSON.parse(JSON.stringify(responseData));
                    responseData = _.omit(responseData, ['dataKey']);
                    responseData['filePath'] = process.env.API_PATH + responseData.uniqueName;
                    console.log("-------------> ResponseDATA ", responseData);
                    return h.response({
                        responseData: responseData,
                        message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_UPLOADED_SUCCESSFULLY"))
                    }).code(200);
                }
            }
        } else {
            return Common.generateError(request, 400, 'ERROR_WHILE_UPLOADING_FILE', {});
        }
    } catch (err) {
        console.error('Error uploading file:', err);
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
};

// Delete uploaded file by unique name
export const deleteAttachment = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
        let userId = request.auth.credentials.userData.id;
        let accountId = request.auth.credentials.userData.accountId;
        const attachment = await Models.Attachment.findOne({ where: { uniqueName: request.params.uniqueName, [Op.or]: [{ userId: userId },{userId:accountId}] }, attributes: attributes });
        if (attachment) {
            unlinkFile(attachment.filePath);
            await Models.Attachment.destroy({ where: { id: attachment.id } });
            return h.response({ message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_DELETED_SUCCESSFULLY")), responseData: attachment }).code(200);
        } else {
            return Common.generateError(request, 404, 'FILE_NOT_FOUND', {});
        }
    } catch (err) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// Download uploaded file by unique name
export const download = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
        const attachment = await Models.Attachment.findOne({ where: { uniqueName: request.params.uniqueName }, attributes: attributes });
        if (attachment) {
            if (attachment.type == Constants.ATTACHMENT_TYPE.LOCAL) {
                const stream = Fs.createReadStream(attachment.filePath);
                const streamData = new Readable().wrap(stream);
                const contentType = extensions.getContentType(attachment.extension);
                return h.response(streamData)
                    .header('Content-Type', contentType)
                    .header('Content-Disposition', 'attachment; filename=' + attachment.fileName);
            } else if (attachment.type == Constants.ATTACHMENT_TYPE.S3_BUCKET) {
                const bucketName = process.env.S3_BUCKET_NAME;
                const s3 = new AWS.S3()
                var params: AWS.S3.GetObjectRequest  = {
                    Bucket: `${bucketName}`,
                    Key: `${attachment.filePath}`,
                };
                const contentType = extensions.getContentType(attachment.extension);
                var fileStream = await s3.getObject(params).createReadStream();
                return h.response(fileStream)
                    .header('Content-Type', contentType)
                    .header('Content-Disposition', 'attachment; filename=' + attachment.fileName);
            } else {
                return Common.generateError(request, 400, 'UNSUPPORTED_DOWNLOAD_OPTION', {});
            }
        } else {
            return Common.generateError(request, 404, 'FILE_NOT_FOUND', {});
        }
    } catch (err) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

 // View uploaded file by unique name
export const view = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
    try {
        const attachment = await Models.Attachment.findOne({ where: { uniqueName: request.params.uniqueName }, attributes: attributes });
        if (attachment) {
            console.log(attachment);
            if (attachment.type == Constants.ATTACHMENT_TYPE.LOCAL) {
                const stream = Fs.createReadStream(attachment.filePath);
                const streamData = new Readable().wrap(stream);
                console.log("----------------------------------------------------------------")
                const contentType = extensions.getContentType(attachment.extension);
                console.log("--------------------------",contentType)
                if (attachment.uniqueName.match(/.(mp4|avi|mp|m4a|MOV|svg|webp)$/i)) {
                    console.log("hello world-----")
                    return h.response(streamData)
                        .header('Content-Type', contentType)
                        .header('Content-Disposition', 'inline; filename=' + attachment.uniqueName)
                        .header('Content-Transfer-Encoding', 'chunked')
                        .header('accept-ranges', 'bytes')
                        .header('content-length', attachment.size.toString())
                }
                else if (!attachment.uniqueName.match(/.(jpg|jpeg|png|gif|mp4|MOV|svg|webp)$/i)) {
                    return h.response(streamData)
                        .header('Content-Type', contentType)
                        .header('Content-Disposition', 'attachment; filename=' + attachment.uniqueName);
                }
                return h.response(streamData)
                    .header('Content-Type', contentType)
            } else {
                const bucketName = process.env.S3_BUCKET_NAME;
                const s3 = new AWS.S3()
                var params: AWS.S3.GetObjectRequest = {
                    Bucket: `${bucketName}`,
                    Key: `${attachment.filePath}`,
                };
                const contentType = extensions.getContentType(attachment.extension);
                var fileStream = await s3.getObject(params).createReadStream();
                if (!attachment.uniqueName.match(/.(jpg|jpeg|png|gif|mp4|mov|svg|webp)$/i)) {
                    return h.response(fileStream)
                        .header('Content-Type', contentType)
                        .header('Content-Disposition', 'attachment; filename=' + attachment.uniqueName);
                }
                return h.response(fileStream)
                    .header('Content-Type', contentType)
            }
        } else {
            return Common.generateError(request, 404, 'FILE_NOT_FOUND', Error);
        }
    } catch (err) {
        return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
    }
}

// export const upload = async (request: Hapi.RequestQuery, h: Hapi.ResponseToolkit) => {
//     try {
//         let userId = null;
//         let accountId = null;
//         if (request.auth.isAuthenticated) {
//             userId = request.auth.credentials.userData.id;
//             accountId = request.auth.credentials.userData.accountId;
//         }
//         if (request.payload && request.payload['file']) {
//             console.log(process.env.USE_FILE_SYSTEM, 'ttttttttt')
//             if (+process.env.USE_FILE_SYSTEM!) {
//                 const extension = Path.extname(request.payload.file.hapi.filename);
//                 const filePath = createFolderIfNotExists(true);
//                 const uploadInfo = {
//                     dest: filePath,
//                     userId: userId
//                 }
//                 let fileDetails = await uploader(request.payload['file'], uploadInfo);
// //                const dataKey = request.auth.credentials.userData.dataKey;
//                 if ((fileDetails && fileDetails.hasOwnProperty('uniqueName')) || (Array.isArray(fileDetails) && fileDetails && fileDetails.length)) {
//                     fileDetails = Array.isArray(fileDetails) ? fileDetails : fileDetails;
//                     let respData = await Models.Attachment.create(fileDetails);
//                     respData = JSON.parse(JSON.stringify(respData));  
//                     if (respData ) {
//                         delete respData['dataKey'];
//                       }  
//                       console.log("--------> respData",respData)
//                     respData['filePath'] = process.env.API_PATH + respData.uniqueName
//                     return h.response({
//                         message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_UPLOADED_SUCCESSFULLY"),
//                         responseData: respData
//                     }).code(200);
//                 } else {
//                     return Common.generateError(request, 400, 'ERROR_WHILE_UPLOADING_FILE', {});
//                 }
//             } else {
//                 console.log("=======TEST with upload")
//                 const extension = Path.extname(request.payload.file.hapi.filename);
//                 const uniqueName = uuid.v1() + extension;
//                 const bucketName = process.env.S3_BUCKET_NAME;
//                 const fileName = createFolderIfNotExists(false);
//                 const fileContent = Buffer.from(request.payload.file._data, 'binary');
//                 const s3 = new AWS.S3()
                
//                 var params = {
//                     Bucket: `${bucketName}`,
//                     Key: process.env.S3_KEY_PREFIX + fileName + uniqueName,
//                     Body: fileContent
//                 };
//                 // Uploading files to the bucket
//                 let uploadedFile: AWS.S3.ManagedUpload = await s3.upload(params,function(err:Error,data: AWS.S3.ManagedUpload.SendData){
//                     if(err){
//                         return false;
//                     }else{
//                         return data;
//                     }
//                 });
//                 console.log(uploadedFile, 'uuuuuuuuu')
                
//                 const dataKey = request?.auth?.credentials?.userData?.dataKey || null;
//                 let filePath = process.env.S3_KEY_PREFIX + fileName + uniqueName;
//                 if (uploadedFile && (uploadedFile as any).totalBytes) {
//                     const fileDetails = {
//                         uniqueName: uniqueName,
//                         fileName: request.payload.file.hapi.filename,
//                         extension: extension.replace('.', ''),
//                         filePath: process.env.S3_KEY_PREFIX + fileName + uniqueName,
//                         size: (uploadedFile as any).totalBytes,
//                         userId: userId,
//                         accountId: accountId,
//                         status: Constants.STATUS.INACTIVE,
//                         type: Constants.ATTACHMENT_TYPE.S3_BUCKET,
//                         dataKey: dataKey
//                     }
//                     let responseData = await Models.Attachment.create(fileDetails);
//                     responseData = JSON.parse(JSON.stringify(responseData));
//                     responseData = _.omit(responseData, ['dataKey']);
//                     responseData['filePath'] = process.env.API_PATH + responseData.uniqueName;
//                     return h.response({
//                         responseData: responseData,
//                         message: request.i18n.__(Common.convertUnderscoreToSpaceAndCapitalizeFirst("FILE_UPLOADED_SUCCESSFULLY")
//                     }).code(200);
//                 } else {
//                     return Common.generateError(request, 400, 'ERROR_WHILE_UPLOADING_FILE', {});
//                 }
//             }
//         } else {
//             return Common.generateError(request, 400, 'ERROR_WHILE_UPLOADING_FILE', {});
//         }
//     } catch (err) {
//         return Common.generateError(request, 500, 'SOMETHING_WENT_WRONG_WITH_EXCEPTION', err);
//     }
// }