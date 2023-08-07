import { Server } from "http";
import Koa from 'koa';
import logger from 'logger';
import koaLogger from 'koa-logger';
import config from 'config';
import koaBody from 'koa-body';
import router from 'routes/service.router'
import { RWAPIMicroservice } from 'rw-api-microservice-node';
import ErrorSerializer from "serializers/error.serializer";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import koaSimpleHealthCheck from 'koa-simple-healthcheck';
import process from "process";

interface IInit {
    server: Server;
    app: Koa;
}

const init: () => Promise<IInit> = async (): Promise<IInit> => {
    return new Promise((resolve: (value: IInit | PromiseLike<IInit>) => void
    ): void => {
        const app: Koa = new Koa();

        app.use(koaBody({
            multipart: true,
            jsonLimit: '50mb',
            formLimit: '50mb',
            textLimit: '50mb'
        }));

        app.use(koaSimpleHealthCheck());

        app.use(async (ctx: { status: number; response: { type: string; }; body: any; }, next: () => any) => {
            try {
                await next();
            } catch (error) {
                ctx.status = error.status || 500;

                if (ctx.status >= 500) {
                    logger.error(error);
                } else {
                    logger.info(error);
                }

                if (process.env.NODE_ENV === 'prod' && ctx.status === 500) {
                    ctx.response.type = 'application/vnd.api+json';
                    ctx.body = ErrorSerializer.serializeError(ctx.status, 'Unexpected error');
                    return;
                }

                ctx.response.type = 'application/vnd.api+json';
                ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
            }
        });

        app.use(koaLogger());

        app.use(RWAPIMicroservice.bootstrap({
            logger,
            gatewayURL: process.env.GATEWAY_URL,
            microserviceToken: process.env.MICROSERVICE_TOKEN,
            fastlyEnabled: process.env.FASTLY_ENABLED as boolean | 'true' | 'false',
            fastlyServiceId: process.env.FASTLY_SERVICEID,
            fastlyAPIKey: process.env.FASTLY_APIKEY,
            requireAPIKey: process.env.REQUIRE_API_KEY as boolean | 'true' | 'false' || true,
            awsRegion: process.env.AWS_REGION,
            awsCloudWatchLogStreamName: config.get('service.name'),
            awsCloudWatchLoggingEnabled: process.env.AWS_CLOUD_WATCH_LOGGING_ENABLED as boolean | 'true' | 'false' || true,
        }));

        // load API routes
        app.use(router.middleware());

        const port: string = config.get('server.port') || '9000';

        const server: Server = app.listen(port);

        logger.info('Server started in ', process.env.PORT);

        resolve({ app, server });
    });
};


export { init };
