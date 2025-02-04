import * as Hapi from "@hapi/hapi";
import {tcpPingPort} from "tcp-ping-port";
import {Models,Sequelize,sequelize} from '../models';
import * as Common from "./common"

const status=async(request:Hapi.RequestQuery,h:Hapi.ResponseToolkit)=>{
    try{
        // let options={ 
        //     socketTimeout: +process.env.SOCKET_TIMEOUT!, 
        //     dnsTimeout: +process.env.DNS_TIMEOUT!,
        //     dnsServers: [process.env.DNS_SERVER!]  // google DNS
        // }
        await Models.User.findOne({where:{email:'test@tets.com'},include:[{model:Models.UserProfile}]})
        await Models.User.findOne({where:{id:0}});
        //let apiServer = await tcpPingPort(process.env.HOST_SERVER!,process.env.PROTOCOL=='http'?4000:443,options);
        //let apiServer = await tcpPingPort('localhost',4000,options);
        return h.response({message:request.i18n.__("SERVER_RUNNING")}).code(200)
    }catch(err:unknown){
        console.log(err)
        return Common.generateError(request,500,'SOMETHING_WENT_WRONG_WITH_EXCEPTION',err);
    }
}
export {
    status
}