const mongoose = require('mongoose');
const Issue = require('../models/Issue.model');
const Project = require('../models/Project.model');

// Get all issues for a project
const getIssuesByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }



        const issues = await Issue.find({ project: projectId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new issue
const createIssue = async (req, res) => {
    try {
        const { title, description, projectId } = req.body;

        // Check if project exists
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // Check if user is the project owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied. Only project owners can create issues.' });
        }

        const issue = new Issue({
            title,
            description,
            project: projectId,
            createdBy: req.user._id,
            status: 'open'
        });

        await issue.save();
        await issue.populate('createdBy', 'name email');

        res.status(201).json(issue);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update an issue (especially to close it)
const updateIssue = async (req, res) => {
    try {
        const { id, issueId } = req.params;
        const issueIdToUse = id || issueId;
        const { status, title, description } = req.body;

        const issue = await Issue.findById(issueIdToUse).populate('project');
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found.' });
        }

        // Check if user is the project owner
        if (issue.project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the project owner can modify issues.' });
        }

        // Update fields
        if (title) issue.title = title;
        if (description !== undefined) issue.description = description;
        if (status) {
            issue.status = status;
            issue.closedAt = status === 'closed' ? new Date() : null;
        }

        await issue.save();
        await issue.populate('createdBy', 'name email');

        res.json(issue);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete an issue
const deleteIssue = async (req, res) => {
    try {
        const { id, issueId } = req.params;
        const issueIdToUse = id || issueId;

        const issue = await Issue.findById(issueIdToUse).populate('project');
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found.' });
        }

        // Check if user is the project owner
        if (issue.project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the project owner can delete issues.' });
        }

        await Issue.findByIdAndDelete(issueIdToUse);
        res.json({ message: 'Issue deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = {
    getIssuesByProject,
    createIssue,
    updateIssue,
    deleteIssue
};
