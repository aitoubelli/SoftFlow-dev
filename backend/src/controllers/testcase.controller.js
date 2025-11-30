const TestCase = require('../models/TestCase.model');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');

// Create a new test case
exports.createTestCase = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, taskId, release } = req.body;

        // Verify project exists and user is owner or admin
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner or admin
        if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to create test cases for this project' });
        }

        // If taskId is provided, verify it belongs to the project
        if (taskId) {
            const task = await Task.findById(taskId);
            if (!task || task.project.toString() !== projectId) {
                return res.status(404).json({ message: 'Task not found in this project' });
            }
        }

        // Create test case
        const testCaseData = {
            name,
            description,
            release,
            project: projectId,
            createdBy: req.user.id
        };

        if (taskId) {
            testCaseData.task = taskId;
        }

        let testCase = new TestCase(testCaseData);

        await testCase.save();

        // Populate references before sending response
        testCase = await testCase.populate('createdBy', 'name email');
        testCase = await testCase.populate({
            path: 'task',
            select: 'title assignee',
            populate: {
                path: 'assignee',
                select: 'name email'
            }
        });

        res.status(201).json(testCase);
    } catch (error) {
        console.error('Error creating test case:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all test cases for a project
exports.getTestCasesByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const testCases = await TestCase.find({ project: projectId })
            .populate('createdBy', 'name email')
            .populate({
                path: 'task',
                select: 'title assignee',
                populate: {
                    path: 'assignee',
                    select: 'name email'
                }
            })
            .sort({ createdAt: -1 });

        res.json(testCases);
    } catch (error) {
        console.error('Error fetching test cases:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get test cases for a specific task
exports.getTestCasesByTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        const testCases = await TestCase.find({ 
            project: projectId,
            task: taskId 
        })
            .populate('createdBy', 'name email')
            .populate({
                path: 'task',
                select: 'title assignee',
                populate: {
                    path: 'assignee',
                    select: 'name email'
                }
            })
            .sort({ createdAt: -1 });

        res.json(testCases);
    } catch (error) {
        console.error('Error fetching test cases:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a test case
exports.updateTestCase = async (req, res) => {
    try {
        const { projectId, testCaseId } = req.params;
        const { name, description, status, release } = req.body;

        // Find test case
        const testCase = await TestCase.findById(testCaseId);
        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        // Verify project ownership or membership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check authorization based on role and action
        const isOwner = project.owner.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isMember = project.members.some(member => member.user.toString() === req.user.id);
        
        // Developers must be project members to update status
        if (req.user.role === 'dev' && !isMember && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update test cases for this project' });
        }
        
        // For non-admins and non-owners, check authorization
        if (!isAdmin && !isOwner && !isMember) {
            return res.status(403).json({ message: 'Not authorized to update test cases for this project' });
        }

        // Update fields
        if (name !== undefined) testCase.name = name;
        if (description !== undefined) testCase.description = description;
        if (status !== undefined) testCase.status = status;
        if (release !== undefined) testCase.release = release;

        await testCase.save();

        // Populate references before sending response
        let populatedTestCase = await testCase.populate('createdBy', 'name email');
        populatedTestCase = await populatedTestCase.populate({
            path: 'task',
            select: 'title assignee',
            populate: {
                path: 'assignee',
                select: 'name email'
            }
        });

        res.json(populatedTestCase);
    } catch (error) {
        console.error('Error updating test case:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a test case
exports.deleteTestCase = async (req, res) => {
    try {
        const { projectId, testCaseId } = req.params;

        // Find test case
        const testCase = await TestCase.findById(testCaseId);
        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        // Verify project ownership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete test cases for this project' });
        }

        await TestCase.findByIdAndDelete(testCaseId);

        res.json({ message: 'Test case deleted successfully' });
    } catch (error) {
        console.error('Error deleting test case:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
