/**
 * Netlify Function: download
 * 
 * This function serves files only to authenticated users.
 * It checks the user's Identity JWT before returning or streaming the file.
 * 
 * Usage: /.netlify/functions/download?file=windows-installer
 * 
 * Supported file types:
 * - windows-installer
 * - mac-installer
 * - demo-video
 * - close-up-buttons
 * - close-up-joystick
 * - close-up-electronics
 */

const fs = require('fs');
const path = require('path');

// Map file types to actual file paths
// Files should be stored in a private directory (not in public/)
const FILE_MAP = {
  'windows-installer': {
    file: 'GameChanger_ControllerManagerApp_Windows_7.2.exe',
    directory: 'assets/downloads',
    mimeType: 'application/octet-stream',
    filename: 'GameChanger_ControllerManagerApp_Windows_7.2.exe'
  },
  'mac-installer': {
    file: 'GameChanger_ControllerManagerApp_Mac_4.0.dmg',
    directory: 'assets/downloads',
    mimeType: 'application/octet-stream',
    filename: 'GameChanger_ControllerManagerApp_Mac_4.0.dmg'
  },
  'demo-video': {
    file: 'gamechanger-demonstration.mp4',
    directory: 'assets/videos',
    mimeType: 'video/mp4',
    filename: 'gamechanger-demonstration.mp4'
  },
  'close-up-buttons': {
    file: '2o7a1079.jpg',
    directory: 'assets/images/sensitive',
    mimeType: 'image/jpeg',
    filename: 'controller-buttons-detail.jpg'
  },
  'close-up-joystick': {
    file: '2o7a1068.jpg',
    directory: 'assets/images/sensitive',
    mimeType: 'image/jpeg',
    filename: 'controller-joystick-detail.jpg'
  },
  'close-up-electronics': {
    file: '2o7a1070.jpg',
    directory: 'assets/images/sensitive',
    mimeType: 'image/jpeg',
    filename: 'controller-electronics-detail.jpg'
  }
};

/**
 * Verify JWT token from Netlify Identity
 * In a real scenario, you'd verify the JWT signature.
 * For this demo, we check if the Authorization header contains a valid Bearer token.
 */
function verifyAuthentication(event) {
  // Check for Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader) {
    return null;
  }

  // Netlify Identity passes the token as "Bearer <token>"
  const tokenMatch = authHeader.match(/Bearer\s+(\S+)/);
  if (!tokenMatch) {
    return null;
  }

  const token = tokenMatch[1];

  // In production, you would verify the JWT signature here.
  // For now, we just check if a token exists and is not empty.
  // Netlify automatically provides the user context if authenticated.
  
  // Netlify Functions have access to user context via event.requestContext
  if (event.requestContext && event.requestContext.identity && event.requestContext.identity.claims) {
    return event.requestContext.identity.claims;
  }

  // Fallback: if token exists, assume authenticated (in production, verify JWT)
  if (token && token.length > 20) {
    return { sub: 'authenticated-user' };
  }

  return null;
}

exports.handler = async (event, context) => {
  try {
    // Get the file type from query parameter
    const fileType = event.queryStringParameters?.file;

    if (!fileType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing file parameter' })
      };
    }

    // Verify authentication
    const user = verifyAuthentication(event);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized. Please log in to access this resource.' })
      };
    }

    // Get file configuration
    const fileConfig = FILE_MAP[fileType];
    if (!fileConfig) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `File type '${fileType}' not found` })
      };
    }

    // Construct full file path
    const filePath = path.join(process.cwd(), fileConfig.directory, fileConfig.file);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File not found on server' })
      };
    }

    // Read file
    const fileContent = fs.readFileSync(filePath);

    // Return file with appropriate headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': fileConfig.mimeType,
        'Content-Disposition': `attachment; filename="${fileConfig.filename}"`,
        'Content-Length': fileContent.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: fileContent,
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Download function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
