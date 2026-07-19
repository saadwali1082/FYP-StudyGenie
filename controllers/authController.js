const { auth, db } = require("../config/firebase");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await auth.createUser({
      displayName: name,
      email,
      password,
    });

    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      name,
      email,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      uid: user.uid,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await auth.getUserByEmail(email);

    res.json({
      success: true,
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  signup,
  login,
};
