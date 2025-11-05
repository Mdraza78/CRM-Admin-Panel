const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Handle both 'Bearer token' and raw token
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded.user;
    
    console.log("Auth middleware - User authenticated:", req.user.id);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;