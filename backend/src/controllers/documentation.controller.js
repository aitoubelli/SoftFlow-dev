const Documentation = require('../models/Documentation.model');
const Project = require('../models/Project.model');

exports.createDocumentation = async (req, res) => {
    try {
        const { title, content, projectId, type } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if documentation of this type already exists for the project
        const existingDoc = await Documentation.findOne({ project: projectId, type });
        if (existingDoc) {
            return res.status(400).json({ message: `Documentation of type ${type} already exists for this project` });
        }

        const documentation = new Documentation({
            title,
            content,
            project: projectId,
            type
        });

        await documentation.save();

        res.status(201).json(documentation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDocumentationByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const documentations = await Documentation.find({ project: projectId });
        res.status(200).json(documentations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDocumentation = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const documentation = await Documentation.findByIdAndUpdate(
            id,
            { title, content },
            { new: true }
        );

        if (!documentation) {
            return res.status(404).json({ message: 'Documentation not found' });
        }

        res.status(200).json(documentation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
