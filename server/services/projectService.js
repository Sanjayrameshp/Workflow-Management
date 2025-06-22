const User = require('../models/User');
const Project = require('../models/Project');

var createProject = async function(projectData, user) {
    try {
        const projectFound = await Project.findOne({ name : projectData.name , createdBy : user._id});

        if(projectFound) {
            return { success: false, message : 'Project name is already exist'};
        }

        const newProject = new Project({
            name : projectData.name,
            description : projectData.description,
            status : projectData.status,
            startDate : projectData.startDate,
            endDate : projectData.endDate,
            createdBy : user._id
        })

        const savedProject = await newProject.save();

        await User.findByIdAndUpdate(user._id, {
            $addToSet: { projects: savedProject._id }
        });
        return { success: true, message : 'Project created successfully'}
    } catch (error) {
        return {success: false, message : 'Error while creating new project'}
    }
}

var getProjects = async function(options, user) {
    try {
        let {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            sortBy = 'startDate',
            sortOrder = 'asc'
        } = options;

        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        const userData = await User.findById(user._id).select('projects');
        if (!userData) {
            return { success: false, message: 'User not found', data: [], meta: {} };
        }

        const filter = {
            _id: { $in: userData.projects }
        };
        if (search) {
            filter.name = { $regex: search, $options: 'i' }; // case-insensitive
        }
        if (status) {
            filter.status = status;
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [projects, total] = await Promise.all([
                                    Project.find(filter)
                                        .sort(sort)
                                        .skip(skip)
                                        .limit(limit),
                                    Project.countDocuments(filter)
                                ]);
        return { success: true, message: 'Successfully fetched projects', data: projects, meta: {
                                                                                            total,
                                                                                            page,
                                                                                            limit,
                                                                                            totalPages: Math.ceil(total / limit),
                                                                                            hasNext: skip + projects.length < total
                                                                                        }}
        
    } catch (error) {
        return {success: false, message : 'Error while fetching project', data: [], meta: {
                                                                                            total :0,
                                                                                            page :1,
                                                                                            limit: 10,
                                                                                            totalPages: 0,
                                                                                            hasNext: false
                                                                                        }}
    }
}

var updateProject = async function(projectData, user) {
    try {
        
        const projectFound = await Project.findByIdAndUpdate(projectData.projectId, { description : projectData.description, endDate : projectData.endDate, status: projectData.status})
        return { success: true, message : 'Project updated successfully'}
    } catch (error) {
        return {success: false, message : 'Error while creating new project'}
    }
}

var projectDetails = async function(projectId, user) {
    try {
        
        const projectFound = await Project.findOne({ _id : projectId});
        if(!projectFound) {
            return { success: fasle, message : 'Project not found', project: null}
        }
        return { success: true, message : 'Project found successfully', project : projectFound}
    } catch (error) {
        return {success: false, message : 'Error while fetching project', project: null}
    }
}

module.exports.createProject = createProject;
module.exports.getProjects = getProjects;
module.exports.updateProject = updateProject;
module.exports.projectDetails = projectDetails;