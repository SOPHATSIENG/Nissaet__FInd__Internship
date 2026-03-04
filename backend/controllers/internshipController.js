exports.getAllInternships = async (req, res) => {
  return res.status(200).json([]);
};

exports.getInternshipById = async (req, res) => {
  return res.status(404).json({ message: 'Internship not found' });
};

exports.createInternship = async (req, res) => {
  return res.status(501).json({ message: 'Create internship not implemented yet' });
};
