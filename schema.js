const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required().min(0),
        roleType: Joi.string().allow("").optional(),
        workersNeeded: Joi.number().integer().min(1).optional(),
        shiftDate: Joi.date().optional(),
        startTime: Joi.string().allow("").optional(),
        endTime: Joi.string().allow("").optional(),
        skillTags: Joi.alternatives().try(
            Joi.array().items(Joi.string().allow("")),
            Joi.string().allow("")
        ).optional(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        image: Joi.object({
            url: Joi.string().allow("").optional(),
            filename: Joi.string().allow("").optional(),
        }).optional(),
        lat: Joi.number().optional(),
        lng: Joi.number().optional(),
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});
