export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { password } = JSON.parse(event.body);
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (password === correctPassword) {
            // Default to 30 minutes if not set
            const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT) || 30;
            
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true,
                    timeout: timeoutMinutes
                })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: 'Invalid password' })
            };
        }
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Invalid request' })
        };
    }
};
