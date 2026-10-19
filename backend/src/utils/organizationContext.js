const { AsyncLocalStorage } = require('async_hooks');

const organizationStorage = new AsyncLocalStorage();

const getOrganizationId = () => organizationStorage.getStore() || null;

const runWithOrganization = (organizationId, callback) => {
    if (!organizationId) {
        throw new Error('An organization is required for this request');
    }
    return organizationStorage.run(String(organizationId), callback);
};

module.exports = { getOrganizationId, runWithOrganization };