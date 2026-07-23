// routes/materialRoutes.js
const express = require("express");
const { db } = require("../config/firebase");

const router = express.Router();

// Save material
router.post("/save", async (req, res) => {
  try {
    const { material, userId } = req.body;

    if (!material) {
      return res.status(400).json({
        success: false,
        message: "Material is required",
      });
    }

    console.log("💾 Saving material to Firebase:", material.fileName);

    const savedDoc = await db.collection("userMaterials").add({
      userId: userId || "guest",
      material: material,
      createdAt: new Date(),
    });

    console.log("✅ Material saved with ID:", savedDoc.id);

    res.status(200).json({
      success: true,
      id: savedDoc.id,
      message: "Material saved successfully",
    });
  } catch (error) {
    console.error("❌ Save material error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all materials for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("📚 Fetching materials for user:", userId);

    const snapshot = await db
      .collection("userMaterials")
      .where("userId", "==", userId || "guest")
      .orderBy("createdAt", "desc")
      .get();

    const materials = [];
    snapshot.forEach((doc) => {
      materials.push({ id: doc.id, ...doc.data().material });
    });

    console.log("✅ Found", materials.length, "materials");

    res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error("❌ Get materials error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete material
router.delete("/delete", async (req, res) => {
  try {
    const { materialId, userId } = req.body;

    if (!materialId) {
      return res.status(400).json({
        success: false,
        message: "Material ID is required",
      });
    }

    console.log("🗑️ Deleting material:", materialId);

    // Verify ownership
    const doc = await db.collection("userMaterials").doc(materialId).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    if (doc.data().userId !== (userId || "guest")) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this material",
      });
    }

    await db.collection("userMaterials").doc(materialId).delete();

    res.status(200).json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete material error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;