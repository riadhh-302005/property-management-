const Property = require('../models/Property');
const User = require('../models/User');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Private
exports.getProperties = async (req, res) => {
  try {
    let query = {};

    // 🔥 ROLE BASED FILTER
    if (req.user.role === 'landlord') {
      query.landlord = req.user._id;
    } else if (req.user.role === 'tenant') {
      query.currentTenant = req.user._id;
    } else if (req.user.role === 'manager') {
      query.assignedManager = req.user._id;
    }

    const properties = await Property.find(query)
      .populate('landlord', 'name email phone')
      .populate('currentTenant', 'name email phone')
      .populate('assignedManager', 'name email phone')
      .sort({ createdAt: -1 });

    // ✅ RETURN ARRAY DIRECTLY (IMPORTANT FIX)
    res.json(properties);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Private
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name email phone')
      .populate('currentTenant', 'name email phone')
      .populate('assignedManager', 'name email phone');
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check authorization - allow landlord, assigned tenant, and assigned manager
    const isAuthorized = 
      req.user.role === 'landlord' && property.landlord._id.toString() === req.user._id.toString() ||
      req.user.role === 'tenant' && property.currentTenant && property.currentTenant._id.toString() === req.user._id.toString() ||
      req.user.role === 'manager' && property.assignedManager && property.assignedManager._id.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this property' });
    }
    
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create property
// @route   POST /api/properties
// @access  Private (Landlord only)
exports.createProperty = async (req, res) => {
  try {
    // Normalize multipart fields similar to update
    const raw = req.body || {};
    const data = { landlord: req.user._id };
    const address = {};
    const amenitiesMap = new Map();

    for (const [key, value] of Object.entries(raw)) {
      // Never allow overriding landlord from client payload
      if (key === 'landlord') continue;
      const addrMatch = key.match(/^address\[(.+)\]$/);
      const amenityMatch = key.match(/^amenities\[(\d+)\]$/);
      if (addrMatch) {
        address[addrMatch[1]] = value;
      } else if (amenityMatch) {
        amenitiesMap.set(parseInt(amenityMatch[1], 10), value);
      } else if (key === 'address' && typeof value === 'string') {
        try { Object.assign(address, JSON.parse(value)); } catch {}
      } else if (key === 'amenities') {
        try {
          const arr = typeof value === 'string' ? JSON.parse(value) : value;
          if (Array.isArray(arr)) arr.forEach((v, i) => amenitiesMap.set(i, v));
        } catch {
          amenitiesMap.set(0, value);
        }
      } else {
        data[key] = value;
      }
    }

    if (Object.keys(address).length) {
      data.address = address;
    }
    if (amenitiesMap.size) {
      data.amenities = Array.from(amenitiesMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, v]) => v)
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    }

    ['bedrooms','bathrooms','squareFeet','yearBuilt','rentAmount','depositAmount']
      .forEach((f) => {
        if (data[f] !== undefined && data[f] !== '') {
          data[f] = Number(data[f]);
        }
      });

    if (data.isAvailable !== undefined) {
      if (typeof data.isAvailable === 'string') {
        data.isAvailable = data.isAvailable === 'true';
      }
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(file => file.path);
    }

    const property = await Property.create(data);
    
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Landlord only)
exports.updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }
    
    // Normalize multipart FormData fields (address[street], amenities[0], etc.)
    const raw = req.body || {};
    const updateData = {};
    const address = {};
    const amenitiesMap = new Map();

    for (const [key, value] of Object.entries(raw)) {
      // Never allow overriding landlord from client payload
      if (key === 'landlord') continue;
      const addrMatch = key.match(/^address\[(.+)\]$/);
      const amenityMatch = key.match(/^amenities\[(\d+)\]$/);
      if (addrMatch) {
        address[addrMatch[1]] = value;
      } else if (amenityMatch) {
        amenitiesMap.set(parseInt(amenityMatch[1], 10), value);
      } else if (key === 'address' && typeof value === 'string') {
        try { Object.assign(address, JSON.parse(value)); } catch {}
      } else if (key === 'amenities') {
        try {
          const arr = typeof value === 'string' ? JSON.parse(value) : value;
          if (Array.isArray(arr)) arr.forEach((v, i) => amenitiesMap.set(i, v));
        } catch {
          // Single string amenity fallback
          amenitiesMap.set(0, value);
        }
      } else {
        updateData[key] = value;
      }
    }

    if (Object.keys(address).length) {
      updateData.address = address;
    }
    if (amenitiesMap.size) {
      updateData.amenities = Array.from(amenitiesMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, v]) => v)
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    }

    // Coerce numeric/boolean fields
    ['bedrooms','bathrooms','squareFeet','yearBuilt','rentAmount','depositAmount']
      .forEach((f) => {
        if (updateData[f] !== undefined) {
          updateData[f] = Number(updateData[f]);
        }
      });
    if (updateData.isAvailable !== undefined) {
      if (typeof updateData.isAvailable === 'string') {
        updateData.isAvailable = updateData.isAvailable === 'true';
      }
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updateData.images = [...(property.images || []), ...newImages];
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('landlord currentTenant assignedManager', 'name email phone');
    
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Landlord only)
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }
    
    // Check if property has active tenant
    if (property.currentTenant) {
      return res.status(400).json({ 
        message: 'Cannot delete property with active tenant. Please remove tenant first.' 
      });
    }
    
    await property.deleteOne();
    
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign tenant to property
// @route   PUT /api/properties/:id/tenant
// @access  Private (Landlord only)
exports.assignTenant = async (req, res) => {
  try {
    const { tenantId } = req.body;
    
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if tenant exists and has correct role
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'Invalid tenant' });
    }
    
    property.currentTenant = tenantId;
    property.status = 'occupied';
    property.isAvailable = false;
    
    await property.save();
    
    await property.populate('currentTenant', 'name email phone');
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove tenant from property
// @route   DELETE /api/properties/:id/tenant
// @access  Private (Landlord only)
exports.removeTenant = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    property.currentTenant = null;
    property.status = 'available';
    property.isAvailable = true;
    
    await property.save();
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign manager to property
// @route   PUT /api/properties/:id/manager
// @access  Private (Landlord only)
exports.assignManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if manager exists and has correct role
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(400).json({ message: 'Invalid manager' });
    }
    
    property.assignedManager = managerId;
    await property.save();
    
    await property.populate('assignedManager', 'name email phone');
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
