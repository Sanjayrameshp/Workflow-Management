const User = require('../models/User');
const Project = require('../models/Project');
const emailService = require('../services/emailService');
const mongoose = require('mongoose');
const Task = require('../models/Tasks')

var createProject = async function(projectData, user) {
    try {
        const projectFound = await Project.findOne({ name : projectData.name , createdBy : user._id, organization: user.organization});

        if(projectFound) {
            return { success: false, message : 'Project name is already exist'};
        }

        const newProject = new Project({
            organization: user.organization,
            name : projectData.name,
            description : projectData.description,
            status : 'active',
            startDate : projectData.startDate,
            endDate : projectData.endDate,
            createdBy : user._id
        })

        const savedProject = await newProject.save();

        await User.findByIdAndUpdate(user._id, {
            $addToSet: { projects: savedProject._id }
        });

        await emailService.sendProjectCreationEmail(savedProject, user);
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
            sortBy = 'createdAt',
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

var projectTasksByStatus = async function (projectId) {

  try {
    const result = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return ({ success:true, message: 'success', result: result});
  } catch (err) {
    return ({ success:false, message: 'An error occured', result: null});
  }
};

var projectTasksByProgress = async function (projectId) {

  try {
    const result = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: "$progress",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return ({ success:true, message: 'success', result: result})
  } catch (err) {
    return ({ success:false, message: 'An error occured', result: null})
  }
};

var projectTasksByPriority = async function (projectId) {

  try {
   const result = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return ({ success:true, message: 'success', result: result})
  } catch (err) {
    return ({ success:false, message: 'An error occured', result: null})
  }
};

var groupTasksByAssignedUser = async (projectId) => {

  try {
    const result = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: "$assignedTo",
          taskCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$userInfo.firstname",
          email: "$userInfo.email",
          taskCount: 1
        }
      }
    ]);

    return ({ success:true, message: 'success', result: result})
  } catch (err) {
    return ({ success:false, message: 'error occured', result: null})
  }
};

var addUserToProject = async function(data) {
    try {
    // First, check if user already has the project
    const existingUser = await User.findOne({
      _id: new mongoose.Types.ObjectId(data.userId),
      email: data.email,
      organization: new mongoose.Types.ObjectId(data.org),
      projects: new mongoose.Types.ObjectId(data.projectId)
    });

    if (existingUser) {
      return { success: true, message: 'Project already assigned to user' };
    }

    // If not, now find user again and push projectId
    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId(data.userId),
      email: data.email,
      organization: new mongoose.Types.ObjectId(data.org)
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    user.projects.push(data.projectId);
    await user.save();

    return { success: true, message: 'Project assigned successfully' };
  } catch (error) {
    return { success: false, message: 'Error while assigning project'};
  }
}


module.exports.createProject = createProject;
module.exports.getProjects = getProjects;
module.exports.updateProject = updateProject;
module.exports.projectDetails = projectDetails;
module.exports.projectTasksByStatus = projectTasksByStatus;
module.exports.projectTasksByProgress = projectTasksByProgress;
module.exports.projectTasksByPriority = projectTasksByPriority;
module.exports.groupTasksByAssignedUser = groupTasksByAssignedUser;
module.exports.addUserToProject = addUserToProject;