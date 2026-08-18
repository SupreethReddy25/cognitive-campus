const InterviewExperience = require('../models/InterviewExperience');
const Company = require('../models/Company');
const User = require('../models/User');
const axios = require('axios');
const mongoose = require('mongoose');

// @desc    Get all experiences for a company
// @route   GET /api/companies/:slug/experiences
// @access  Public
exports.getCompanyExperiences = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const experiences = await InterviewExperience.find({ companyId: company._id, status: 'Published' })
      .populate('userId', 'name')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: experiences.length, data: experiences });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Submit new experience
// @route   POST /api/experiences
// @access  Private
exports.createExperience = async (req, res) => {
  try {
    const experienceData = { ...req.body };
    
    // Attach userId if the token is present and user didn't choose anonymous
    if (req.user && !experienceData.isAnonymous) {
      experienceData.userId = req.user.userId;
    }

    // Attach collegeId: prefer explicit form value, then fall back to user profile
    if (!experienceData.collegeId && req.user) {
      const userDoc = await User.findById(req.user.userId).select('collegeId').lean();
      if (userDoc?.collegeId) {
        experienceData.collegeId = userDoc.collegeId;
      }
    }

    // Validate collegeId if provided
    if (experienceData.collegeId) {
      const College = require('../models/College');
      const college = await College.findById(experienceData.collegeId).lean();
      if (!college) {
        delete experienceData.collegeId; // Don't reject — just drop invalid value silently
      }
    }

    experienceData.status = 'Published';
    experienceData.source = experienceData.source || 'self-reported';

    const experience = await InterviewExperience.create(experienceData);

    // Award 200 XP for contributing intel
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { xp: 200 }
      });
    }

    res.status(201).json({ success: true, data: experience });
  } catch (error) {
    console.error('createExperience error:', error.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


// @desc    Toggle upvote on experience (per-user, idempotent)
// @route   POST /api/experiences/:id/upvote
// @access  Private
exports.upvoteExperience = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ success: false, error: 'Experience not found' });
    }

    if (userId) {
      const alreadyUpvoted = experience.upvotedBy.some(id => id.toString() === userId.toString());
      if (alreadyUpvoted) {
        // Toggle off
        experience.upvotedBy = experience.upvotedBy.filter(id => id.toString() !== userId.toString());
        experience.upvotes = Math.max(0, experience.upvotes - 1);
      } else {
        // Toggle on
        experience.upvotedBy.push(userId);
        experience.upvotes += 1;
      }
    } else {
      // Anonymous upvote (no dedup)
      experience.upvotes += 1;
    }

    await experience.save();
    const userUpvoted = userId ? experience.upvotedBy.some(id => id.toString() === userId.toString()) : false;
    res.status(200).json({ success: true, data: { upvotes: experience.upvotes, userUpvoted } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Parse raw interview dump using Groq AI
// @route   POST /api/experiences/ai-parse
// @access  Private/Public
exports.parseRawDump = async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) {
      return res.status(400).json({ success: false, error: 'Please provide raw text' });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    const prompt = `
      You are an expert technical recruiter, fraud analyst, and AI data extraction assistant.
      Extract structured data from the following raw interview experience text.
      CRITICAL RULE: You must detect if the text is excessively generic, hallucinated, or lacks substantive detail.
      Calculate a "qualityScore" from 0 to 100 based on the specificity of the questions, the depth of the tips, and realistic round durations.
      If the text appears made up or lacks any real questions, score it below 50.
      
      Respond with ONLY valid JSON and no markdown formatting (no \`\`\`json).
      
      Required schema:
      {
        "role": "string (e.g. SDE-1, Data Engineer. Infer if missing)",
        "year": "number (e.g. 2024)",
        "month": "string (e.g. July)",
        "offerReceived": "Yes|No|Pending",
        "college": "string",
        "cgpa": "string",
        "qualityScore": "number (0-100)",
        "validationMessage": "string (brief feedback on what is missing or if it looks fake)",
        "rounds": [
          {
            "type": "OA|Technical|Managerial|HR|GD",
            "duration": "string",
            "questions": [
              {
                "text": "string (exact question asked if possible)",
                "questionType": "DSA|System Design|CS Fundamentals|Behavioral|Role-specific",
                "topicTags": ["string"]
              }
            ],
            "tips": "string",
            "vibe": "Conversational|Grilling|Friendly"
          }
        ],
        "overallTips": "string",
        "resourcesUsed": "string"
      }
      
      Raw Text:
      "${rawText}"
    `;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const parsedData = JSON.parse(response.data.choices[0].message.content);
    res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Groq AI Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to parse raw text' });
  }
};
