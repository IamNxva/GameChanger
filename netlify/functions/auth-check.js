/**
 * Netlify Function: auth-check
 * 
 * This function checks if the current user is authenticated via Netlify Identity.
 * Used by the frontend to verify authentication status.
 * 
 * Returns: { authenticated: boolean, email: string }
 */

exports.handler = async (event, context) => {
  try {
    // Check if user context is available
    if (event.requestContext && event.requestContext.identity) {
      const identity = event.requestContext.identity;
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
          authenticated: true,
          email: identity.claims?.email || 'user@example.com',
          user_id: identity.claims?.sub || null
        })
      };
    }

    // Check for Authorization header as fallback
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.includes('Bearer')) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
          authenticated: true,
          email: 'authenticated-user@gamechanger.local'
        })
      };
    }

    // Not authenticated
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({
        authenticated: false,
        email: null
      })
    };

  } catch (error) {
    console.error('Auth check error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        authenticated: false,
        error: error.message
      })
    };
  }
};
