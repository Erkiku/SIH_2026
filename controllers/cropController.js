const { supabase } = require("../config/db");
const CropModel = require("../models/Crop");

/**
 * POST /api/crops
 * Add a new crop
 */
const createCrop = async (req, res, next) => {
  try {
    const farmerId = req.farmerId;
    const data = req.body;

    // Validate
    const validation = CropModel.validate(data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    // Create crop
    const dbRow = CropModel.toDbRow(data, farmerId);
    const { data: crop, error } = await supabase
      .from(CropModel.tableName)
      .insert(dbRow)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Crop added successfully.",
      data: CropModel.format(crop),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/crops
 * Get all crops for the logged-in farmer
 */
const getCrops = async (req, res, next) => {
  try {
    const farmerId = req.farmerId;

    const { data: crops, error } = await supabase
      .from(CropModel.tableName)
      .select("*")
      .eq("farmer_id", farmerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: (crops || []).map(CropModel.format),
      count: crops ? crops.length : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/crops/:id
 * Get specific crop details
 */
const getCropById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;

    const { data: crop, error } = await supabase
      .from(CropModel.tableName)
      .select("*")
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .single();

    if (error || !crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found.",
      });
    }

    res.json({
      success: true,
      data: CropModel.format(crop),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/crops/:id
 * Update a crop
 */
const updateCrop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;
    const data = req.body;

    // Check ownership
    const { data: existing } = await supabase
      .from(CropModel.tableName)
      .select("id")
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Crop not found or not owned by you.",
      });
    }

    // Build update object (only allowed fields)
    const updateData = {};
    if (data.cropName !== undefined) updateData.crop_name = data.cropName;
    if (data.name !== undefined) updateData.crop_name = data.name;
    if (data.cropVariety !== undefined)
      updateData.crop_variety = data.cropVariety;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.quantityKg !== undefined) updateData.quantity = data.quantityKg;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.harvestDate !== undefined)
      updateData.harvest_date = data.harvestDate;
    if (data.storageLocation !== undefined)
      updateData.storage_location = data.storageLocation;
    if (data.moistureContent !== undefined)
      updateData.moisture_content = data.moistureContent;
    if (data.photos !== undefined) updateData.photos = data.photos;
    if (data.pricePerKg !== undefined)
      updateData.price_per_kg = data.pricePerKg;
    if (data.qualityGrade !== undefined)
      updateData.quality_grade = data.qualityGrade;

    const { data: updated, error } = await supabase
      .from(CropModel.tableName)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Crop updated successfully.",
      data: CropModel.format(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/crops/:id
 * Delete a crop
 */
const deleteCrop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmerId = req.farmerId;

    const { data: existing } = await supabase
      .from(CropModel.tableName)
      .select("id")
      .eq("id", id)
      .eq("farmer_id", farmerId)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Crop not found or not owned by you.",
      });
    }

    const { error } = await supabase
      .from(CropModel.tableName)
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Crop deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCrop, getCrops, getCropById, updateCrop, deleteCrop };
