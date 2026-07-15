const { auth, db } = require("../config/firebase");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await auth.createUser({
      displayName: name,
      email,
      password,
    });

    // Save user in Firestore
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await auth.getUserByEmail(email);

    res.json({
      success: true,
      uid: user.uid,
      email: user.email,
      name: user.displayName,
    });
  } catch (error) {
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