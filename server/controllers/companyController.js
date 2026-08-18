const Company = require('../models/Company');
const InterviewExperience = require('../models/InterviewExperience');
const Problem = require('../models/Problem');
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort('name');
    res.status(200).json({ success: true, count: companies.length, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single company by slug
// @route   GET /api/companies/:slug
// @access  Public
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get pre-aggregated stats for a company (offer rate, top topics, etc.)
// @route   GET /api/companies/:slug/stats
// @access  Public
exports.getCompanyStats = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const experiences = await InterviewExperience.find({
      companyId: company._id,
      status: 'Published'
    });

    const total = experiences.length;
    const offerYes = experiences.filter(e => e.offerReceived === 'Yes').length;
    const offerRate = total ? Math.round((offerYes / total) * 100) : null;

    // Topic frequency across all rounds
    const topicMap = {};
    experiences.forEach(exp => {
      exp.rounds?.forEach(round => {
        round.topics?.forEach(t => { topicMap[t] = (topicMap[t] || 0) + 1; });
        round.questions?.forEach(q => {
          q.topicTags?.forEach(t => { topicMap[t] = (topicMap[t] || 0) + 0.5; });
        });
      });
    });
    const topTopics = Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count: Math.round(count) }));

    // Question type distribution
    const qTypeMap = {};
    experiences.forEach(exp => {
      exp.rounds?.forEach(round => {
        round.questions?.forEach(q => {
          if (q.questionType) qTypeMap[q.questionType] = (qTypeMap[q.questionType] || 0) + 1;
        });
      });
    });

    // Round type frequency
    const roundTypeMap = {};
    experiences.forEach(exp => {
      exp.rounds?.forEach(round => {
        if (round.type) roundTypeMap[round.type] = (roundTypeMap[round.type] || 0) + 1;
      });
    });

    // Difficulty distribution
    const diffMap = {};
    experiences.forEach(exp => {
      if (exp.difficulty) diffMap[exp.difficulty] = (diffMap[exp.difficulty] || 0) + 1;
    });

    // Resource frequency
    const resourceMap = {};
    experiences.forEach(exp => {
      const raw = typeof exp.resourcesUsed === 'string' ? exp.resourcesUsed : '';
      raw.split(',').map(r => r.trim()).filter(Boolean).forEach(r => {
        resourceMap[r] = (resourceMap[r] || 0) + 1;
      });
    });
    const topResources = Object.entries(resourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([resource, count]) => ({ resource, count }));

    res.status(200).json({
      success: true,
      data: {
        totalReports: total,
        offerRate,
        offerYes,
        topTopics,
        questionTypeDistribution: qTypeMap,
        roundTypeDistribution: roundTypeMap,
        difficultyDistribution: diffMap,
        topResources,
      }
    });
  } catch (error) {
    console.error('getCompanyStats error:', error.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get problems related to a company based on community-reported topics
// @route   GET /api/companies/:slug/related-problems
// @access  Public
exports.getRelatedProblems = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    // Gather all topic tags from community experiences
    const experiences = await InterviewExperience.find({
      companyId: company._id,
      status: 'Published'
    });

    const topicFreq = {};
    experiences.forEach(exp => {
      exp.rounds?.forEach(round => {
        round.topics?.forEach(t => { topicFreq[t] = (topicFreq[t] || 0) + 2; });
        round.questions?.forEach(q => {
          q.topicTags?.forEach(t => { topicFreq[t] = (topicFreq[t] || 0) + 1; });
        });
      });
    });

    const topTopics = Object.entries(topicFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t);

    // Also include topics from the company's known process
    const companyTopics = [];
    company.interviewProcess?.rounds?.forEach(r => {
      if (r.description) {
        // Basic keyword extraction from descriptions
        ['DP', 'Graph', 'Tree', 'Array', 'String', 'Stack', 'Queue', 'Heap',
         'Binary Search', 'Recursion', 'Backtracking', 'Greedy', 'LinkedList'].forEach(kw => {
          if (r.description.toLowerCase().includes(kw.toLowerCase())) companyTopics.push(kw);
        });
      }
    });

    const allTopics = [...new Set([...topTopics, ...companyTopics])].slice(0, 10);

    let problems = [];
    if (allTopics.length > 0) {
      // Find skills whose names match the community-reported topics
      const Skill = require('../models/Skill');
      const matchedSkills = await Skill.find({
        name: { $in: allTopics.map(t => new RegExp(t, 'i')) }
      }).select('_id').lean();
      const skillIds = matchedSkills.map(s => s._id);

      problems = await Problem.find({
        $or: [
          { skillId: { $in: skillIds } },
          { title: { $in: allTopics.map(t => new RegExp(t, 'i')) } },
          { company: { $in: allTopics.map(t => new RegExp(t, 'i')) } },
        ],
        status: 'approved',
        isActive: true
      })
        .select('_id title difficulty skillId company')
        .populate('skillId', 'name')
        .limit(12)
        .lean();
    }

    // If we found fewer than 5, supplement with general problems of matching difficulty
    if (problems.length < 5) {
      const diff = company.interviewProcess?.difficulty;
      const diffMap = { Hard: ['hard'], Medium: ['medium', 'hard'], Easy: ['easy', 'medium'] };
      const diffs = diffMap[diff] || ['medium', 'hard'];
      const extra = await Problem.find({
        _id: { $nin: problems.map(p => p._id) },
        difficulty: { $in: diffs },
        status: 'approved',
        isActive: true
      })
        .select('_id title difficulty skillId')
        .populate('skillId', 'name')
        .limit(12 - problems.length)
        .lean();
      problems = [...problems, ...extra];
    }

    res.status(200).json({
      success: true,
      count: problems.length,
      matchedTopics: allTopics,
      data: problems
    });
  } catch (error) {
    console.error('getRelatedProblems error:', error.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Generate a prep plan using AI — enhanced with real community data
// @route   POST /api/companies/:slug/prep-plan
// @access  Public
exports.generatePrepPlan = async (req, res) => {
  try {
    const { days } = req.body;
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    // Pull real community data to enrich the prompt
    const experiences = await InterviewExperience.find({
      companyId: company._id,
      status: 'Published'
    });

    const numDays = days || 30;
    const rounds = company.interviewProcess?.rounds?.map(r => r.name).join(', ') || 'Unknown';
    const difficulty = company.interviewProcess?.difficulty || 'Unknown';
    const tips = company.interviewProcess?.tipsSummary || '';

    // Aggregate community intelligence
    const topicFreq = {};
    const allQuestions = [];
    const allResources = {};

    experiences.forEach(exp => {
      exp.rounds?.forEach(round => {
        round.topics?.forEach(t => { topicFreq[t] = (topicFreq[t] || 0) + 1; });
        round.questions?.forEach(q => {
          if (q.text?.trim() && q.questionType === 'DSA') allQuestions.push(q.text);
        });
      });
      const raw = typeof exp.resourcesUsed === 'string' ? exp.resourcesUsed : '';
      raw.split(',').map(r => r.trim()).filter(Boolean).forEach(r => {
        allResources[r] = (allResources[r] || 0) + 1;
      });
    });

    const topTopics = Object.entries(topicFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t, c]) => `${t} (mentioned ${c}x)`);

    const topQuestions = allQuestions.slice(0, 10);

    const topResources = Object.entries(allResources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([r, c]) => `${r} (used by ${c} candidates)`);

    const communitySection = experiences.length > 0 ? `

Community Intelligence (${experiences.length} real reports):
- Top topics asked: ${topTopics.join(', ') || 'N/A'}
- Real questions from interviews: ${topQuestions.slice(0, 5).map(q => `"${q}"`).join('; ') || 'N/A'}
- Resources candidates actually used: ${topResources.join(', ') || 'N/A'}
- Offer rate from community: ${Math.round((experiences.filter(e => e.offerReceived === 'Yes').length / experiences.length) * 100)}%
` : '';

    // Fetch user's BKT data to personalize the plan
    const userId = req.user.userId;
    const SkillState = require('../models/SkillState');
    const userSkills = await SkillState.find({ userId }).populate('skillId', 'name').lean();
    
    let bktSection = '';
    if (userSkills.length > 0) {
      const weaknesses = userSkills
        .filter(s => s.masteryP < 0.5)
        .sort((a, b) => a.masteryP - b.masteryP)
        .map(s => `${s.skillId?.name || 'Unknown'} (${Math.round(s.masteryP * 100)}% mastery)`);
        
      const strengths = userSkills
        .filter(s => s.masteryP >= 0.8)
        .sort((a, b) => b.masteryP - a.masteryP)
        .map(s => `${s.skillId?.name || 'Unknown'} (${Math.round(s.masteryP * 100)}% mastery)`);
        
      bktSection = `
User's Skill Profile (Bayesian Knowledge Tracing):
- Weaknesses (Needs Practice): ${weaknesses.slice(0, 5).join(', ') || 'None identified yet'}
- Strengths (Mastered): ${strengths.slice(0, 5).join(', ') || 'None identified yet'}
`;
    }

    const prompt = `Act as an expert technical interviewer and career coach.
Create a highly structured, day-by-day ${numDays}-day preparation plan for a software engineering interview at ${company.name}.

Company Context:
- Tier: ${company.tier}
- Difficulty: ${difficulty}
- Interview rounds: ${rounds}
- Official tips: ${tips}
${communitySection}
${bktSection}

Format your response in clean Markdown with day ranges (e.g. "Days 1-5: ..."). 
Make the plan hyper-specific to ${company.name}'s patterns AND the user's specific skill weaknesses.
${experiences.length > 0 ? `Prioritize the community-reported topics: ${topTopics.slice(0, 5).join(', ')}.` : ''}
${bktSection ? `Crucially, allocate extra time in the early days to cover the user's documented Weaknesses, while spending less time on their Strengths.` : ''}
Include: what to study each week, specific problem types to practice, behavioral prep (if relevant), and a final week mock interview schedule.`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': 'Bearer ' + GROQ_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const plan = response.data.choices[0].message.content;
    let returnedWeaknesses = [];
    if (userSkills.length > 0) {
      returnedWeaknesses = userSkills
        .filter(s => s.masteryP < 0.5)
        .sort((a, b) => a.masteryP - b.masteryP)
        .map(s => ({ name: s.skillId?.name, masteryP: s.masteryP }));
    }

    res.status(200).json({ success: true, data: { plan, weaknesses: returnedWeaknesses } });
  } catch (error) {
    console.error('Prep plan generation failed:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to generate prep plan' });
  }
};
