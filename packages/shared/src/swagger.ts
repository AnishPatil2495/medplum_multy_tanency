import swaggerJsdoc from 'swagger-jsdoc';

export interface SwaggerConfig {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  routePrefix: string;
  apiPaths: string[];
}

export function createSwaggerSpec(config: SwaggerConfig): object {
  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
      },
      servers: [{ url: config.baseUrl }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: config.apiPaths,
  };

  return swaggerJsdoc(options);
}
