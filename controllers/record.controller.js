import  prisma  from "../lib/prisma.js";

export const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    if (typeof amount !== "number" || !["INCOME", "EXPENSE"].includes(type) || !category || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: "Invalid record payload" });
    }

    const record = await prisma.record.create({
      data: {
        amount,
        type,
        category,
        date: new Date(date),
        notes,
        createdBy: req.user.id,
      },
    });

    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRecords = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;

    const ownerFilter = req.user.role === "ADMIN" ? {} : { createdBy: req.user.id };

    const records = await prisma.record.findMany({
      where: {
        ...ownerFilter,
        type: type || undefined,
        category: category || undefined,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
        isDeleted: false,
      },
      orderBy: { date: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//
// UPDATE RECORD
//
export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date, notes } = req.body;

    const existing = await prisma.record.findUnique({
      where: { id },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({ error: "Record not found" });
    }

    const updated = await prisma.record.update({
      where: { id },
      data: {
        amount,
        type,
        category,
        date: date ? new Date(date) : undefined,
        notes,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.record.findUnique({
      where: { id },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({ error: "Record not found" });
    }

    await prisma.record.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    return res.json({ message: "Record deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};