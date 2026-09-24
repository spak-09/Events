const AiLog = require('../../models/AiLog');
const Session = require('../../models/Session');
const Registration = require('../../models/Registration');
const env = require('../../config/env');

/**
 * Deterministic template generators when external AI provider key is not provided.
 */
const generateTemplateEventDescription = ({ title, theme, targetAudience, highlights = [] }) => {
  const highlightList = highlights.length > 0
    ? highlights.map((h) => `- **${h}**`).join('\n')
    : '- Visionary keynotes and technical deep dives\n- Peer-to-peer breakout roundtables\n- Hands-on technology exhibitions';

  return `### About ${title}

Welcome to **${title}**${theme ? ` — *${theme}*` : ''}. Designed specifically for ${targetAudience || 'industry leaders, software engineers, and digital innovators'}, this conference offers an unparalleled forum for learning, collaboration, and high-impact technical discoveries.

#### Key Highlights & Tracks
${highlightList}

Join us for immersive workshops, interactive Q&A sessions, and exclusive networking opportunities designed to elevate your professional practice and roadmap.`;
};

const generateTemplateSpeakerBio = ({ name, title, company, expertise = [], tone = 'technical' }) => {
  const expertiseText = expertise.length > 0 ? expertise.join(', ') : 'software architecture and engineering';
  const roleText = [title, company].filter(Boolean).join(' at ');

  if (tone === 'inspiring') {
    return `${name} is a forward-thinking trailblazer${roleText ? ` serving as ${roleText}` : ''}. Renowned for transforming complex paradigms across ${expertiseText}, ${name} empowers global teams to innovate fearlessly and redefine what is possible.`;
  }

  if (tone === 'formal') {
    return `${name} serves as ${roleText || 'Senior Subject Matter Expert'}. With extensive research credentials spanning ${expertiseText}, ${name} frequently advises enterprise institutions on scalable system modernizations and strategic industry advancements.`;
  }

  // Default: technical
  return `${name} is a seasoned technologist${roleText ? ` currently ${roleText}` : ''}, specializing in ${expertiseText}. With deep expertise in production-grade systems and open-source contributions, ${name} focuses on resilient design patterns, automated developer workflows, and scalable architectures.`;
};

const generateTemplateAnnouncement = ({ eventTitle, keyMessage, audience = 'all', urgency = 'normal' }) => {
  const urgencyPrefix = urgency === 'urgent' ? '🚨 [URGENT UPDATE] ' : urgency === 'low' ? 'ℹ️ [Notice] ' : '📢 [Announcement] ';
  const audienceGreeting = audience === 'speakers'
    ? 'Dear Presenters & Speakers,'
    : audience === 'sponsors'
    ? 'Dear Valued Sponsors & Partners,'
    : audience === 'staff'
    ? 'Team Event Operations,'
    : 'Hello Attendees,';

  return `${urgencyPrefix}${eventTitle}

${audienceGreeting}

${keyMessage}

Please review your event itinerary in the EventForge portal. Should you have any questions or require logistical assistance, feel free to reach out to our on-site coordination desk.

Best regards,  
The ${eventTitle} Organizing Committee`;
};

const generateTemplateSessionSummary = ({ sessionTitle, speakerName, keyPoints = [] }) => {
  const bulletList = keyPoints.map((kp) => `* **Key Takeaway**: ${kp}`).join('\n');
  return `### Executive Summary: "${sessionTitle}"
${speakerName ? `*Presented by: ${speakerName}*\n` : ''}
#### Core Discussion Points & Actionable Insights
${bulletList}

#### Summary
This session explored architectural tradeoffs, empirical case studies, and practical implementation patterns to mitigate operational bottlenecks in production environments.`;
};

/**
 * Service Methods
 */
const generateEventDescription = async (payload, userId) => {
  const prompt = `Generate event description for title: ${payload.title}, theme: ${payload.theme}, audience: ${payload.targetAudience}`;
  const draft = generateTemplateEventDescription(payload);
  const estimatedTokens = Math.round((prompt.length + draft.length) / 4);

  await AiLog.create({
    user: userId,
    event: payload.eventId || null,
    type: 'event-description',
    prompt,
    output: draft,
    provider: env.AI_PROVIDER || 'template',
    tokens: estimatedTokens,
  });

  return {
    draft,
    provider: env.AI_PROVIDER || 'template',
    estimatedTokens,
    isDraftOnly: true,
  };
};

const generateSpeakerBio = async (payload, userId) => {
  const prompt = `Generate speaker bio for ${payload.name}, title: ${payload.title}, company: ${payload.company}, expertise: ${payload.expertise?.join(', ')}`;
  const draft = generateTemplateSpeakerBio(payload);
  const estimatedTokens = Math.round((prompt.length + draft.length) / 4);

  await AiLog.create({
    user: userId,
    type: 'speaker-bio',
    prompt,
    output: draft,
    provider: env.AI_PROVIDER || 'template',
    tokens: estimatedTokens,
  });

  return {
    draft,
    provider: env.AI_PROVIDER || 'template',
    estimatedTokens,
    isDraftOnly: true,
  };
};

const generateAnnouncement = async (payload, userId) => {
  const prompt = `Generate announcement for ${payload.eventTitle}, message: ${payload.keyMessage}, audience: ${payload.audience}`;
  const draft = generateTemplateAnnouncement(payload);
  const estimatedTokens = Math.round((prompt.length + draft.length) / 4);

  await AiLog.create({
    user: userId,
    event: payload.eventId || null,
    type: 'announcement',
    prompt,
    output: draft,
    provider: env.AI_PROVIDER || 'template',
    tokens: estimatedTokens,
  });

  return {
    draft,
    provider: env.AI_PROVIDER || 'template',
    estimatedTokens,
    isDraftOnly: true,
  };
};

const generateSessionSummary = async (payload, userId) => {
  const prompt = `Generate session summary for ${payload.sessionTitle}, points: ${payload.keyPoints?.join(', ')}`;
  const draft = generateTemplateSessionSummary(payload);
  const estimatedTokens = Math.round((prompt.length + draft.length) / 4);

  await AiLog.create({
    user: userId,
    type: 'session-summary',
    prompt,
    output: draft,
    provider: env.AI_PROVIDER || 'template',
    tokens: estimatedTokens,
  });

  return {
    draft,
    provider: env.AI_PROVIDER || 'template',
    estimatedTokens,
    isDraftOnly: true,
  };
};

/**
 * Hybrid Session Recommendations Engine
 * Hybrid Score = Tag Overlap (50%) + Co-Registration Popularity (30%) + Track Affinity (20%)
 */
const getHybridRecommendations = async (eventId, userId, limit = 5) => {
  // 1. Get user registration to discover personal interests & already picked sessions
  const userReg = await Registration.findOne({
    event: eventId,
    user: userId,
  });

  const attendeeInterests = userReg?.interests || [];
  const selectedSessionIds = (userReg?.selectedSessions || []).map((id) => id.toString());

  // 2. Fetch all sessions for this event
  const sessions = await Session.find({ event: eventId, status: 'confirmed' }).populate(
    'speakers',
    'name title company photo'
  );

  if (sessions.length === 0) {
    return [];
  }

  // 3. Compute co-registration counts: for each session, how many other attendees picked it?
  const otherRegistrations = await Registration.find({
    event: eventId,
    user: { $ne: userId },
    status: { $in: ['approved', 'checked_in'] },
  }).select('selectedSessions interests');

  const sessionPopularityMap = {};
  for (const reg of otherRegistrations) {
    for (const sid of reg.selectedSessions || []) {
      const sStr = sid.toString();
      sessionPopularityMap[sStr] = (sessionPopularityMap[sStr] || 0) + 1;
    }
  }

  // Determine user's track affinity from selected sessions
  const chosenTracks = new Set();
  for (const s of sessions) {
    if (selectedSessionIds.includes(s._id.toString())) {
      chosenTracks.add(s.track);
    }
  }

  // 4. Calculate Hybrid Score for each session
  const scoredSessions = sessions.map((session) => {
    const isAlreadySelected = selectedSessionIds.includes(session._id.toString());

    // a) Tag Overlap Score (0 - 50 points)
    let tagOverlapCount = 0;
    const matchedTags = [];
    if (attendeeInterests.length > 0 && session.tags && session.tags.length > 0) {
      for (const tag of session.tags) {
        if (attendeeInterests.some((i) => i.toLowerCase() === tag.toLowerCase())) {
          tagOverlapCount++;
          matchedTags.push(tag);
        }
      }
    }
    const tagScore = Math.min(50, tagOverlapCount * 25);

    // b) Co-Registration Popularity Score (0 - 30 points)
    const popularity = sessionPopularityMap[session._id.toString()] || 0;
    const coScore = Math.min(30, popularity * 6);

    // c) Track Affinity Score (0 - 20 points)
    let trackScore = 0;
    const hasTrackMatch = chosenTracks.has(session.track) ||
      attendeeInterests.some((i) => i.toLowerCase().includes(session.track.toLowerCase()));
    if (hasTrackMatch) {
      trackScore = 20;
    }

    const totalScore = tagScore + coScore + trackScore;

    // Construct human-readable "why" rationale
    const reasons = [];
    if (matchedTags.length > 0) {
      reasons.push(`Matches your interest in ${matchedTags.join(' & ')}`);
    }
    if (hasTrackMatch) {
      reasons.push(`Alignd with your preferred track "${session.track}"`);
    }
    if (popularity > 0) {
      reasons.push(`Popular among ${popularity} attendee(s) with similar interests`);
    }
    if (reasons.length === 0) {
      reasons.push('Curated featured session for this event');
    }

    const why = reasons.join(' • ');

    return {
      session,
      score: totalScore,
      breakdown: { tagScore, coScore, trackScore },
      why,
      isAlreadySelected,
    };
  });

  // Sort descending by score, prioritizing unselected sessions
  scoredSessions.sort((a, b) => {
    if (a.isAlreadySelected !== b.isAlreadySelected) {
      return a.isAlreadySelected ? 1 : -1;
    }
    return b.score - a.score;
  });

  const topRecommendations = scoredSessions.slice(0, limit);

  // Log recommendation telemetry
  await AiLog.create({
    user: userId,
    event: eventId,
    type: 'hybrid-recommendations',
    prompt: `Hybrid recommendations for attendee interests: [${attendeeInterests.join(', ')}]`,
    output: `Returned top ${topRecommendations.length} recommended sessions`,
    provider: 'hybrid-engine-v1',
    tokens: 42,
  });

  return topRecommendations;
};

module.exports = {
  generateEventDescription,
  generateSpeakerBio,
  generateAnnouncement,
  generateSessionSummary,
  getHybridRecommendations,
};
