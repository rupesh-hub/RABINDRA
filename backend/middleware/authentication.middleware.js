import jwt from 'jsonwebtoken';

export const authenticationMiddleware = (req, res, next) => {

  const token = req.cookies?.access_token;
  
  if (!token) {
    console.log('No token found in cookies');
    return res.status(401).json({
      success: false,
      message: "No token provided. Access denied!",
    });
  }

  try {
    if (!process.env.SECRET_KEY) {
      console.error("SECRET_KEY is missing in environment variables");
      return res.status(500).json({
        success: false,
        message: "Internal server error: Missing secret key",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Full Token Verification Error:", error);
    return res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError"
        ? "Unauthorized: Token has expired"
        : "Unauthorized: Invalid token",
    });
  }
};