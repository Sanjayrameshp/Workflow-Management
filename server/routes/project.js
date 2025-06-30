const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken')

const userAuth = require('../middlewares/auth');
const AdminAuth = require('../middlewares/adminAuth')
const projectService = require('../services/projectService');
const adminAuth = require('../middlewares/adminAuth');

router.post('/createProject', AdminAuth ,async (req, res) => {
    try {
        const projectData = req.body;

        const createProject = await projectService.createProject(projectData, req.user);
        if( createProject.success) {
            res.send({success: true, message : createProject.message || 'Project created successfully'})
        } else {
            res.send({success: false, message : createProject.message || 'Error while creating new project'})
        }
    } catch (error) {
        res.send({success: false, message : error.message || 'Error while creating new project'})
    }
    
});

router.get('/getProjects', userAuth ,async (req, res) => {
    try {

        const user = req.user;
        if(!user)  return res.send({success: false, message : 'Authorization failed'});
        const getProjects = await projectService.getProjects(req.query, user);

        if( getProjects.success) {
            res.send({success: true, message : getProjects.message || 'Project fetched successfully', projects : getProjects.data, meta : getProjects.meta})
        } else {
            res.send({success: false, message : getProjects.message || 'Error while fetching project', projects : getProjects.data, meta : getProjects.meta })
        }
    } catch (error) {
        res.send({success: false, message : error.message || 'Error while fetching project', projects : [],meta: {
                                                                                            total :0,
                                                                                            page :1,
                                                                                            limit: 10,
                                                                                            totalPages: 0,
                                                                                            hasNext: false
                                                                                        } })
    }
    
});

router.post('/updateProject', AdminAuth ,async (req, res) => {
    try {
        const projectData = req.body.projectData;

        const updateProject = await projectService.updateProject(projectData, req.user);
        if( updateProject.success) {
            res.send({success: true, message : updateProject.message || 'Project updated successfully'});
        } else {
            res.send({success: false, message : updateProject.message || 'Error while updating project'});
        }
    } catch (error) {
        res.send({success: false, message : error.message || 'Error while updating project'});
    }
    
});

router.post('/getProjectDetails', userAuth ,async (req, res) => {
    try {
        const projectId = req.body.projectId;
        console.log("req >> ", req.body);
        

        const projectDetails = await projectService.projectDetails(projectId, req.user);
        if( projectDetails.success) {
            res.send({success: true, message: projectDetails.message || 'Project updated successfully', project: projectDetails.project });
        } else {
            res.send({success: false, message: projectDetails.message || 'Error while updating project', project: projectDetails.project || null});
        }
    } catch (error) {
        res.send({success: false, message : error.message || 'Error while updating project', project: null});
    }
    
});

router.post('/projectTasksByStatus', userAuth ,async (req, res) => {
    try {
        const projectId = req.body.projectId;

        const data = await projectService.projectTasksByStatus(projectId);
        res.send({success: true, message : data.message || 'success', result: data});

    } catch (error) {
        res.send({success: false, message : error.message || 'Error while fetching task', result: null})
    }
    
});

router.post('/projectTasksByProgress', userAuth ,async (req, res) => {
    try {
        const projectId = req.body.projectId;

        const data = await projectService.projectTasksByProgress(projectId);
        res.send({success: true, message : data.message || 'success', result: data});

    } catch (error) {
        res.send({success: false, message : error.message || 'Error while fetching task', result: null});
    }
    
});

router.post('/projectTasksByPriority', userAuth ,async (req, res) => {
    try {
        const projectId = req.body.projectId;

        const data = await projectService.projectTasksByPriority(projectId);
        res.send({success: true, message : data.message || 'success', result: data});

    } catch (error) {
        res.send({success: false, message : error.message || 'Error while fetching task', result: null});
    }
    
});

router.post('/groupTasksByAssignedUser', userAuth ,async (req, res) => {
    try {
        const projectId = req.body.projectId;

        const data = await projectService.groupTasksByAssignedUser(projectId);
        res.send({success: true, message : data.message || 'success', result: data});

    } catch (error) {
        res.send({success: false, message : error.message || 'Error while fetching task', result: null});
    }
    
});

router.post('/addUserToProject', adminAuth ,async (req, res) => {
    try {
        const data = req.body;

        const addProject = await projectService.addUserToProject(data);
        res.send({success: true, message : addProject.message || 'successfully added to project'});

    } catch (error) {
        res.send({success: false, message : error.message || 'unable to add the user to the project'});
    }
    
});

module.exports = router;