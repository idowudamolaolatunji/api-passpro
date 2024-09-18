const mongoose = require('mongoose');
const slugify = require('slugify');


const eventCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    eventCounts: Number,
    slug: String,
    image: String
}, {
    timestamps: true
});


eventCategorySchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true, replacement: '-' });
    next();
});


const EventCategory = mongoose.model('EventCategory', eventCategorySchema);
module.exports = EventCategory;