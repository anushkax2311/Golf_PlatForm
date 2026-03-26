const Draw = require('../models/Draw');
const Score = require('../models/Score');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// Generate random numbers 1-45 (5 unique numbers)
const generateRandomNumbers = () => {
  const nums = new Set();
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return [...nums].sort((a, b) => a - b);
};

// Algorithmic draw: weighted by frequency across all user scores
const generateAlgorithmicNumbers = async () => {
  const scores = await Score.find({});
  const freq = {};
  
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  
  scores.forEach(doc => {
    doc.scores.forEach(s => {
      freq[s.value] = (freq[s.value] || 0) + 1;
    });
  });

  // Weight: more frequent scores have higher probability
  const weighted = [];
  for (let num = 1; num <= 45; num++) {
    const weight = Math.max(1, freq[num]);
    for (let w = 0; w < weight; w++) weighted.push(num);
  }

  const selected = new Set();
  let attempts = 0;
  while (selected.size < 5 && attempts < 1000) {
    const idx = Math.floor(Math.random() * weighted.length);
    selected.add(weighted[idx]);
    attempts++;
  }

  // Fallback to random if not enough selected
  while (selected.size < 5) {
    selected.add(Math.floor(Math.random() * 45) + 1);
  }

  return [...selected].sort((a, b) => a - b);
};

// Check matches between user scores and winning numbers
const checkMatches = (userScores, winningNumbers) => {
  const userVals = userScores.map(s => s.value);
  const matches = userVals.filter(v => winningNumbers.includes(v));
  return matches.length;
};

// Calculate prize pools from active subscriber count
const calculatePrizePools = async (rollover = 0) => {
  const activeUsers = await User.countDocuments({ 'subscription.status': 'active' });
  // Assume £10/month per subscriber goes to prize pool (adjust as needed)
  const PRIZE_CONTRIBUTION_PER_USER = 10;
  const total = (activeUsers * PRIZE_CONTRIBUTION_PER_USER) + rollover;

  return {
    total,
    fiveMatch: Math.floor(total * 0.40),
    fourMatch: Math.floor(total * 0.35),
    threeMatch: Math.floor(total * 0.25),
    activeSubscribers: activeUsers
  };
};

// @desc    Get all draws (public: published only)
// @route   GET /api/draws
exports.getDraws = async (req, res) => {
  try {
    const query = req.user?.role === 'admin' ? {} : { status: 'published' };
    const draws = await Draw.find(query)
      .sort({ year: -1, month: -1 })
      .limit(12)
      .populate('winners.user', 'name email');

    res.json({ success: true, draws });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get current/upcoming draw
// @route   GET /api/draws/current
exports.getCurrentDraw = async (req, res) => {
  try {
    const now = new Date();
    let draw = await Draw.findOne({
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });

    if (!draw) {
      // Auto-create for this month
      const pools = await calculatePrizePools();
      draw = await Draw.create({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        prizePool: pools,
        activeSubscribers: pools.activeSubscribers,
        status: 'upcoming'
      });
    }

    res.json({ success: true, draw });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Simulate a draw (admin)
// @route   POST /api/draws/simulate
exports.simulateDraw = async (req, res) => {
  try {
    const { month, year, drawType = 'random' } = req.body;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();

    let draw = await Draw.findOne({ month: m, year: y });
    
    const pools = await calculatePrizePools();
    const winningNumbers = drawType === 'algorithmic'
      ? await generateAlgorithmicNumbers()
      : generateRandomNumbers();

    if (!draw) {
      draw = new Draw({ month: m, year: y });
    }

    draw.drawType = drawType;
    draw.winningNumbers = winningNumbers;
    draw.prizePool = pools;
    draw.activeSubscribers = pools.activeSubscribers;
    draw.status = 'simulated';
    draw.simulatedAt = new Date();
    draw.winners = [];

    // Find winners
    const activeUsers = await User.find({ 'subscription.status': 'active' });
    const fiveWinners = [], fourWinners = [], threeWinners = [];

    for (const user of activeUsers) {
      const scoreDoc = await Score.findOne({ user: user._id });
      if (!scoreDoc || scoreDoc.scores.length === 0) continue;

      const matchCount = checkMatches(scoreDoc.scores, winningNumbers);
      if (matchCount >= 3) {
        const entry = { user: user._id, matchType: `${matchCount}-match`, paymentStatus: 'pending' };
        if (matchCount === 5) fiveWinners.push(entry);
        else if (matchCount === 4) fourWinners.push(entry);
        else threeWinners.push(entry);
      }
    }

    // Assign prize amounts
    const assignPrizes = (winners, pool) => {
      if (winners.length === 0) return winners;
      const share = Math.floor(pool / winners.length);
      return winners.map(w => ({ ...w, prizeAmount: share }));
    };

    draw.winners = [
      ...assignPrizes(fiveWinners, pools.fiveMatch + draw.jackpotRolledOver),
      ...assignPrizes(fourWinners, pools.fourMatch),
      ...assignPrizes(threeWinners, pools.threeMatch)
    ];

    draw.participantCount = activeUsers.length;
    await draw.save();

    res.json({ success: true, draw, message: 'Draw simulated successfully' });
  } catch (err) {
    console.error('Simulate draw error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Publish a draw (admin)
// @route   POST /api/draws/:id/publish
exports.publishDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id).populate('winners.user', 'name email');
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    if (draw.status === 'published') {
      return res.status(400).json({ success: false, message: 'Draw already published' });
    }

    // Check jackpot rollover
    if (draw.winners.filter(w => w.matchType === '5-match').length === 0) {
      // No 5-match winner — rollover jackpot
      const nextMonth = draw.month === 12 ? 1 : draw.month + 1;
      const nextYear = draw.month === 12 ? draw.year + 1 : draw.year;
      
      let nextDraw = await Draw.findOne({ month: nextMonth, year: nextYear });
      if (!nextDraw) {
        nextDraw = new Draw({ month: nextMonth, year: nextYear });
      }
      nextDraw.jackpotRolledOver = (nextDraw.jackpotRolledOver || 0) + draw.prizePool.fiveMatch;
      await nextDraw.save();
    }

    draw.status = 'published';
    draw.publishedAt = new Date();
    await draw.save();

    // Notify winners via email
    for (const winner of draw.winners) {
      if (winner.user?.email) {
        try {
          await sendEmail({
            to: winner.user.email,
            subject: '🏆 You Won! Golf Platform Draw Results',
            html: `<h2>Congratulations ${winner.user.name}!</h2>
              <p>You matched ${winner.matchType} in this month's draw!</p>
              <p>Prize amount: £${winner.prizeAmount}</p>
              <p>Please log in to your dashboard to submit your proof and claim your prize.</p>`
          });
        } catch (emailErr) {
          console.error('Winner email failed:', emailErr);
        }
      }
    }

    res.json({ success: true, draw, message: 'Draw published and winners notified' });
  } catch (err) {
    console.error('Publish draw error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cron job handler
exports.runScheduledDraw = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const existing = await Draw.findOne({ month, year, status: 'published' });
  if (existing) return;

  // Auto-simulate with random
  const fakeReq = { body: { month, year, drawType: 'random' } };
  const fakeRes = {
    json: (data) => console.log('Scheduled draw result:', data.message),
    status: () => fakeRes
  };

  await exports.simulateDraw(fakeReq, fakeRes);
};
