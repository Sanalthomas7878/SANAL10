const Location = require('../models/Location');
const { OPERATING_MODES } = require('../data/seedData');

exports.getServiceableLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isServiceable: true }).sort({ city: 1, areaName: 1 });
    res.json({
      operatingModes: OPERATING_MODES,
      locations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkServiceability = async (req, res) => {
  const { pinCode } = req.params;
  try {
    const loc = await Location.findOne({ pinCode });
    if (loc && loc.isServiceable) {
      res.json({
        serviceable: true,
        area: loc.areaName,
        city: loc.city,
        state: loc.state,
        operatingModes: OPERATING_MODES,
      });
    } else {
      res.json({ serviceable: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
