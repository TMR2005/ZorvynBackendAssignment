import  prisma  from "../lib/prisma.js";

export const getSummary = async (req, res) => {
  try {
    const ownerFilter = req.user.role === "ADMIN" ? {} : { createdBy: req.user.id };

    const [income, expense] = await Promise.all([
      prisma.record.aggregate({
        where: { ...ownerFilter, type: "INCOME", isDeleted: false },
        _sum: { amount: true },
      }),
      prisma.record.aggregate({
        where: { ...ownerFilter, type: "EXPENSE", isDeleted: false },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;

    res.json({
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const ownerFilter = req.user.role === "ADMIN" ? {} : { createdBy: req.user.id };

    const data = await prisma.record.groupBy({
      by: ["category", "type"],
      where: { ...ownerFilter, isDeleted: false },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMonthlyTrends = async (req, res) => {
  try {
    const ownerFilter = req.user.role === "ADMIN" ? {} : { createdBy: req.user.id };

    const records = await prisma.record.findMany({
      where: { ...ownerFilter, isDeleted: false },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    const trends = {};

    records.forEach((r) => {
      const month = new Date(r.date).toISOString().slice(0, 7); // YYYY-MM

      if (!trends[month]) {
        trends[month] = {
          income: 0,
          expense: 0,
        };
      }

      if (r.type === "INCOME") {
        trends[month].income += r.amount;
      } else {
        trends[month].expense += r.amount;
      }
    });

    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getWeeklyTrends = async (req, res) => {
  try {
    const ownerFilter = req.user.role === "ADMIN" ? {} : { createdBy: req.user.id };

    const records = await prisma.record.findMany({
      where: { ...ownerFilter, isDeleted: false },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    const trends = {};

    records.forEach((r) => {
      const week = new Date(r.date);
      const firstDay = new Date(week.setDate(week.getDate() - week.getDay()));
      const weekKey = `${firstDay.toISOString().slice(0, 10)}`;

      if (!trends[weekKey]) {
        trends[weekKey] = { income: 0, expense: 0 };
      }

      if (r.type === "INCOME") {
        trends[weekKey].income += r.amount;
      } else {
        trends[weekKey].expense += r.amount;
      }
    });

    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const ownerFilter = req.user.role === "ADMIN" ? {} : { createdBy: req.user.id };

    const records = await prisma.record.findMany({
      where: { ...ownerFilter, isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

