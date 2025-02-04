'use strict';
import Hapi, { RequestEvent, RequestOrig, ResponseToolkit } from "@hapi/hapi";
import { Server } from "@hapi/hapi";
import dotenv from "dotenv";
dotenv.config({encoding: 'utf8'});
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as HapiSwagger from 'hapi-swagger';
import * as auth_jwt from 'hapi-auth-jwt2';
import * as auth_cookie from '@hapi/cookie';
import * as Path from 'path';
import * as i18n from 'hapi-i18n';
import {sequelize, Models} from './models';
const _ = require('underscore'); 

let socketInstance = require('socket.io');
import * as Jwt from 'jsonwebtoken';
import * as routes from 'hapi-auto-routes'
import {validateToken,decodeToken,decryptData,encryptData} from "./controllers/common"
import { Socket, SocketOptions, SocketType } from "dgram";
import { SocketConstructorOpts, TcpSocketConnectOpts } from "net";
const Cron = require('hapi-cron');



const Agenda = require("agenda");
export let server: Server;
export const init = async function(): Promise<Server> {
    server = Hapi.server({
        port: process.env.NODE_PORT! || 3000,
        host: process.env.NODE_HOST! || '0.0.0.0',
        routes:{
            cors:{
                origin: ["*"],
                credentials:true,
                // additionalHeaders:['language', 'timezone', 'latitude', 'longitude', 'apikey', 'connection']
                additionalHeaders:['language','timezone','countrycode']
            }
        }
    });
  
 
    await server.register([auth_jwt,auth_cookie]);
    await server.auth.strategy('session', 'cookie',
        {
            cookie: { name:'authorization',password: process.env.COOKIE_PASSWORD,isSecure: true,isSameSite:false},
            keepAlive:true,
            validate:(request:object, session:string)=>{
                return validateToken(decodeToken(session),'authorization')
            }
        }
    )  
    await server.auth.strategy("jwt", "jwt", {
        complete: true,
        key: process.env.JWT_PRIVATE_KEY, // secret key
        validate: validateToken, // validate function defined in common function for timestamp check
        verifyOptions: { algorithms: [process.env.JWT_ALGO] } // algorithm
    });
    server.auth.default("jwt");
    const swaggerOptions: HapiSwagger.RegisterOptions = {
        info: {
            title: process.env.APPLICATION_TITLE!
        },
        securityDefinitions: {
            Bearer: {
              type: "apiKey",
              name: "authorization",
              in: "header"
            },
            session:
            {
                "type": "apiKey",
                "name": "authorization",
                "in": "cookie"
            }
        },
        basePath:"/",
        host:process.env.SERVER_HOST,
        schemes:["https","http"],
        grouping: "tags",
        sortEndpoints: "method",
        consumes: ["application/json"],
        produces: ["application/json"]
    };
    const plugins: Array<Hapi.ServerRegisterPluginObject<any>> = [
        {plugin: Inert},
        {plugin: Vision},
        {plugin: HapiSwagger,options: swaggerOptions},
        {
            plugin: i18n,
            options: {
                locales: process.env.VALID_LANGUAGE_CODES!.split(','),
                directory: __dirname + "/locales",
                languageHeaderField: "language",
                defaultLocale:process.env.DEFAULT_LANGUAGE_CODE!
            }
        },
        // {   
        //     plugin: Cron,
        //     options: { 
        //         jobs: require("./cron")
        //     }
        // }
    ];
    await server.register(plugins);
    routes.bind(server).register({
        pattern: __dirname + '/routes/**/!(_)*.*',
    });
    server.ext('onPostAuth',(request:Hapi.RequestQuery, h:ResponseToolkit) => {
        if(process.env.ENABLE_API_ENCRYPTION){
            switch(request.method.toLowerCase()){
                case 'put':
                case 'post':
                case 'delete':
                    if(request.payload && ("payload" in request.payload) && !("event" in request.payload)){
                        request.payload=decryptData(request.payload.payload);
                    }
                    break;
                case 'get':
                    if(request.query && "query" in request.query){
                        request.query=decryptData(request.query);
                    }
                    break;

            }
            if(request.params && "params" in request.params){
                request.params=decryptData(request.params);
            }
        }
        return h.continue
    });
    let mode=false;
    let alter=false;
    
    return server;
};

export const startServer = async(server:Server) =>{
    try{
        let mode:boolean=false;
        let alter:boolean=false;
        if(process.env.NODE_ENV=='TEST'){
            mode=true;
            alter=true;
        }
        
        global.io = socketInstance(server.listener,{cors: {origin: '*', methods: ['*']}});
        
        
        // global.io = require('socket.io')(server.listener, 
        //     {
        //     //allowEIO3: false,
        //     cors: {
        //         origin:["*"],
        //         methods: ["*"],
        //         allowedHeaders:[
        //             "accept",
        //             "authorization",
        //             "Content-Type",
        //             "If-None-Match",
        //             "language",
        //             "utcoffset",
        //             "Access-Control-Allow-Origin", 
        //             "Access-Control-Allow-Headers",
        //              "Origin, X-Requested-With, Content-Type",
        //             "*"
        //         ]
        //         }
        //     }
        // );

        if(+process.env.SYNCDB!){
            await sequelize.sync({force:mode,alter:alter})
        }else{
            await sequelize.authenticate();
        }
        console.log(`Listening on ${server.settings.host}:${server.settings.port}`);
        await server.start();
        console.log('starting server in '+process.env.NODE_ENV!+' mode');


       
        

      
        io.on("connect", async(socket:any) => {
            let tdata:any;
            let initializeFor: any;
            let timezone: any;
            console.log("this is socket driver ----------------------------------------------------------------")
            if(typeof socket?.handshake?.query?.token != "undefined" && socket?.handshake?.query?.token != '' && socket?.handshake?.query?.token != "undefined"){
                let token = Jwt.decode(socket?.handshake?.query?.token);    
                tdata = await validateToken(token,'authoriztion');
                console.log("The tdata us :==",tdata)
                console.log("The tdata us  :==",tdata.credentials)
                initializeFor = tdata.credentials?.userData?.id;
                timezone = tdata.credentials?.userData?.timezone;
                
            }else if (typeof socket?.handshake?.headers?.authorization != "undefined" && socket?.handshake?.headers?.authorization!='') {
                let token = Jwt.decode(socket?.handshake?.headers?.authorization);
                
                tdata = await validateToken(token,'authoriztion');
                console.log("The tdata us 00000 :==",tdata)
                console.log("The tdata us 00000 :==",tdata.credentials)
                initializeFor = tdata.credentials?.userData?.id;
                timezone = tdata.credentials?.userData?.timezone;
                // if(initializeFor){
                //     socket.join("user_" + initializeFor);
                //     console.log("User connected at: user_" + initializeFor)
                // }
                //socket.join("user_" + initializeFor);
                
            }

            

            if(initializeFor){
                socket.join("user_" + initializeFor);
                
                console.log("User connected at: user_" + initializeFor)
            }
           
            socket.on("disconnect", async () => {
                //console.log("llllll", tdata)
                
                console.log("Client disonnected from server at socket - " + socket.id);
                
                
            });

            
            
            
            socket.on("error", (err:Error) => {
                console.log('socket_error')
                console.log(err);
            });
        });
    
       
    }catch(err){
        console.log(err)
    }
    console.log('Server running on %s', server.info.uri);
    console.log('MySql Server connected', process.env.MYSQL_DEVELOPMENT_HOST)
    console.log('NODE ENV', process.env.NODE_ENV);
}
export const start = async function (): Promise<void> {
    return startServer(server);
};
process.on('unhandledRejection', (err) => {
    console.error("unhandledRejection");
    console.error(err);
    process.exit(1);
});
init().then(() => start());


