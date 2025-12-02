const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'SoftFlow API',
        description: 'API for managing software production: tasks, sprints, releases, tests and documentation',
        version: '1.0.0',
        contact: {
            name: 'SoftFlow Team',
            email: 'support@softflow.com'
        }
    },
    servers: [
        {
            url: 'http://localhost:8000/api',
            description: 'Development server'
        }
    ],
    tags: [
        {
            name: 'Authentication',
            description: 'Authentication endpoints'
        },
        {
            name: 'Users',
            description: 'User management endpoints'
        },
        {
            name: 'Profile',
            description: 'User profile endpoints'
        },
        {
            name: 'Projects',
            description: 'Project management endpoints'
        },
        {
            name: 'Tasks',
            description: 'Task management endpoints'
        },
        {
            name: 'Issues',
            description: 'Issue management endpoints'
        },
        {
            name: 'Sprints',
            description: 'Sprint management endpoints'
        },
        {
            name: 'Health',
            description: 'Health check endpoints'
        },
        {
            name: 'Documentation',
            description: 'Documentation management endpoints'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            User: {
                type: 'object',
                required: ['email', 'name', 'role'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'User ID'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'User email address'
                    },
                    name: {
                        type: 'string',
                        description: 'User full name'
                    },
                    role: {
                        type: 'string',
                        enum: ['admin', 'owner', 'developer'],
                        description: 'User role in the system'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'User creation timestamp'
                    }
                }
            },
            Project: {
                type: 'object',
                required: ['name'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'Project ID'
                    },
                    name: {
                        type: 'string',
                        description: 'Project name'
                    },
                    description: {
                        type: 'string',
                        description: 'Project description'
                    },
                    owner: {
                        $ref: '#/components/schemas/User'
                    },
                    members: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                user: {
                                    $ref: '#/components/schemas/User'
                                },
                                role: {
                                    type: 'string',
                                    enum: ['dev', 'lead', 'manager'],
                                    description: 'User role within the project'
                                }
                            }
                        }
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Project creation timestamp'
                    }
                }
            },
            Sprint: {
                type: 'object',
                required: ['name', 'project', 'startDate', 'endDate'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'Sprint ID'
                    },
                    name: {
                        type: 'string',
                        description: 'Sprint name'
                    },
                    project: {
                        $ref: '#/components/schemas/Project'
                    },
                    startDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Sprint start date'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Sprint end date'
                    },
                    tasks: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/Task'
                        },
                        description: 'Tasks assigned to the sprint'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Sprint creation timestamp'
                    }
                }
            },
            Task: {
                type: 'object',
                required: ['title', 'status'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'Task ID'
                    },
                    title: {
                        type: 'string',
                        description: 'Task title'
                    },
                    description: {
                        type: 'string',
                        description: 'Task description'
                    },
                    status: {
                        type: 'string',
                        enum: ['todo', 'in-progress', 'done'],
                        description: 'Task status'
                    },
                    assignee: {
                        $ref: '#/components/schemas/User'
                    },
                    issue: {
                        $ref: '#/components/schemas/Issue'
                    },
                    estimatedHours: {
                        type: 'number',
                        description: 'Estimated hours to complete'
                    },
                    actualHours: {
                        type: 'number',
                        description: 'Actual hours spent'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Task creation timestamp'
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Task last update timestamp'
                    }
                }
            },
            Issue: {
                type: 'object',
                required: ['title', 'type', 'status', 'priority'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'Issue ID'
                    },
                    title: {
                        type: 'string',
                        description: 'Issue title'
                    },
                    description: {
                        type: 'string',
                        description: 'Issue description'
                    },
                    type: {
                        type: 'string',
                        enum: ['bug', 'feature', 'enhancement', 'task'],
                        description: 'Issue type'
                    },
                    status: {
                        type: 'string',
                        enum: ['open', 'in-progress', 'closed'],
                        description: 'Issue status'
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'urgent'],
                        description: 'Issue priority'
                    },
                    assignee: {
                        $ref: '#/components/schemas/User'
                    },
                    project: {
                        $ref: '#/components/schemas/Project'
                    },
                    estimatedHours: {
                        type: 'number',
                        description: 'Estimated hours to complete'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Issue creation timestamp'
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Issue last update timestamp'
                    }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error message'
                    }
                }
            },
            Documentation: {
                type: 'object',
                required: ['title', 'content', 'project', 'type'],
                properties: {
                    _id: {
                        type: 'string',
                        description: 'Documentation ID'
                    },
                    title: {
                        type: 'string',
                        description: 'Documentation title'
                    },
                    content: {
                        type: 'string',
                        description: 'Documentation content (Markdown)'
                    },
                    project: {
                        $ref: '#/components/schemas/Project'
                    },
                    type: {
                        type: 'string',
                        enum: ['admin', 'user'],
                        description: 'Documentation type'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Creation timestamp'
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last update timestamp'
                    }
                }
            }
        }
    }
};

const path = require('path');

const options = {
    swaggerDefinition,
    apis: [path.resolve(__dirname, '../routes/*.js')]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
