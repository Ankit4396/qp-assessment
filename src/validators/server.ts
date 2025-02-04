import Joi from "joi";
interface statusSchema { message: string;};
const status=Joi.object<statusSchema,true>({
    message:Joi.string().required().trim().example("Running status of the server").description("Success message"),
}).label('running-server-response').description("Shows if the server is accessible");
export {
    status
}