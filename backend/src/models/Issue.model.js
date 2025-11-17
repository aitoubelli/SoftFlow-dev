const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Issue', issueSchema);
