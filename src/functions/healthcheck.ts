import { app, HttpRequest, InvocationContext } from '@azure/functions';
import type { HttpResponseInit } from '@azure/functions';

export async function healthCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    return {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'YeaBuddy Bot'
        })
    };
}
