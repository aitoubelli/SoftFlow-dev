const mongoose = require('mongoose');

const documentationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },

    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    type: {
        type: String,
        enum: ['admin', 'user'],
        required: true
    }

});

module.exports = mongoose.model('Documentation', documentationSchema);
