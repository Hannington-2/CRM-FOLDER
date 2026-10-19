const { getOrganizationId } = require('./organizationContext');

const QUERY_OPERATIONS = [
    'find',
    'findOne',
    'countDocuments',
    'distinct',
    'updateOne',
    'updateMany',
    'replaceOne',
    'deleteOne',
    'deleteMany',
    'findOneAndUpdate',
    'findOneAndReplace',
    'findOneAndDelete'
];

const organizationScopePlugin = (schema) => {
    if (!schema.path('organization')) return;

    for (const operation of QUERY_OPERATIONS) {
        schema.pre(operation, function () {
            const organizationId = getOrganizationId();
            if (!organizationId) {
                const options = this.getOptions();
                if (options.organizationScopeBypass === true) {
                    delete options.organizationScopeBypass;
                    this.setOptions(options);
                    return;
                }
                throw new Error(`Organization scope required for ${this.model.modelName}.${operation}`);
            }

            this.setQuery({
                $and: [this.getFilter(), { organization: organizationId }]
            });

            const update = this.getUpdate();
            if (!update) return;

            if (Array.isArray(update)) {
                this.setUpdate([
                    ...update,
                    { $set: { organization: organizationId } }
                ]);
                return;
            }

            const hasOperators = Object.keys(update).some(key => key.startsWith('$'));
            if (hasOperators) {
                for (const value of Object.values(update)) {
                    if (value && typeof value === 'object') {
                        delete value.organization;
                    }
                }
                update.$set = { ...update.$set, organization: organizationId };
            } else {
                update.organization = organizationId;
            }
            this.setUpdate(update);
        });
    }

    schema.pre('aggregate', function () {
        const organizationId = getOrganizationId();
        if (!organizationId) {
            throw new Error(`Organization scope required for ${this._model.modelName}.aggregate`);
        }

        const pipeline = this.pipeline();
        if (pipeline[0]?.$geoNear) {
            pipeline[0].$geoNear.query = {
                ...(pipeline[0].$geoNear.query || {}),
                organization: organizationId
            };
        } else {
            pipeline.unshift({ $match: { organization: organizationId } });
        }
    });

    schema.pre('estimatedDocumentCount', function () {
        throw new Error('Use countDocuments for organization-scoped models');
    });

    schema.pre('validate', function () {
        const organizationId = getOrganizationId();
        if (!organizationId) {
            if (this.isNew && this.get('organization')) return;
            throw new Error('Organization scope required to save this document');
        }

        if (this.isNew) {
            this.set('organization', organizationId);
            return;
        }

        if (String(this.get('organization')) !== organizationId) {
            throw new Error('Cannot save a document outside its organization');
        }
    });

    schema.pre('insertMany', function (next, documents) {
        const organizationId = getOrganizationId();
        if (organizationId) {
            for (const document of documents) {
                document.organization = organizationId;
            }
        } else if (documents.some(document => !document.organization)) {
            return next(new Error('Organization scope required to insert documents'));
        }
        next();
    });
};

module.exports = organizationScopePlugin;