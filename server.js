// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://Amit4321:amit4321@cluster0.8keuyqs.mongodb.net', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    referralCode: String,
    referredBy: String,
    telegramId: { type: String, unique: true, sparse: true },
    active: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    balances: {
        refer: { type: Number, default: 0 },
        gmail: { type: Number, default: 0 },
        job: { type: Number, default: 0 }
    },
    referrals: [String],
    referralCount: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    freeJobsCompleted: [Number],
    typingJobUnlocked: { type: Boolean, default: false },
    typingJobsCompleted: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Withdraw Schema
const withdrawSchema = new mongoose.Schema({
    userId: String,
    username: String,
    amount: Number,
    wallet: String,
    method: String,
    account: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Gmail Request Schema
const gmailRequestSchema = new mongoose.Schema({
    userId: String,
    username: String,
    gmail: String,
    password: String,
    amount: Number,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Gift Code Schema
const giftCodeSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    amount: Number,
    claimed: { type: Boolean, default: false },
    claimedBy: String,
    createdAt: { type: Date, default: Date.now }
});

// Settings Schema
const settingsSchema = new mongoose.Schema({
    activeBonus: { type: Number, default: 10 },
    gmailRate: { type: Number, default: 10 },
    minWithdrawRefer: { type: Number, default: 50 },
    minWithdrawGmail: { type: Number, default: 30 },
    minWithdrawJob: { type: Number, default: 20 },
    notice: { type: String, default: 'Welcome!' }
});

// Models
const User = mongoose.model('User', userSchema);
const Withdraw = mongoose.model('Withdraw', withdrawSchema);
const GmailRequest = mongoose.model('GmailRequest', gmailRequestSchema);
const GiftCode = mongoose.model('GiftCode', giftCodeSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, referralCode } = req.body;
        
        // Check duplicate
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const user = new User({
            username,
            email,
            password,
            referralCode: 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase()
        });
        
        // Process referral
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
                user.referredBy = referrer._id;
                referrer.referrals.push(user._id);
                referrer.referralCount++;
                await referrer.save();
            }
        }
        
        await user.save();
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ 
            $or: [{ email }, { username: email }], 
            password 
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        if (user.banned) {
            return res.status(403).json({ error: 'Account banned' });
        }
        
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));