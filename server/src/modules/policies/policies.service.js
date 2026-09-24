const GlobalPolicy = require('../../models/GlobalPolicy');
const AuditLog = require('../../models/AuditLog');

const getAllPolicies = async () => {
  return GlobalPolicy.find().sort({ key: 1 });
};

const getPolicyByKey = async (key) => {
  return GlobalPolicy.findOne({ key });
};

const setPolicy = async ({ key, value, description }, actorId) => {
  const policy = await GlobalPolicy.findOneAndUpdate(
    { key },
    {
      value,
      description: description || '',
      updatedBy: actorId,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await AuditLog.create({
    user: actorId,
    action: 'POLICY_UPDATED',
    resource: 'GlobalPolicy',
    resourceId: policy._id.toString(),
    details: { key, value },
  });

  return policy;
};

module.exports = {
  getAllPolicies,
  getPolicyByKey,
  setPolicy,
};
