const prisma = require("../config/prisma");

const getActivityTypes = async (req, res) => {
  try {
    const activityTypes = await prisma.activityType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json(activityTypes);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch activity types",
    });
  }
};

module.exports = {
  getActivityTypes,
};
