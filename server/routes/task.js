const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

const userAuth = require('../middlewares/auth');
const AdminAuth = require('../middlewares/adminAuth');
const projectService = require('../services/projectService');
const taskService = require('../services/taskService');
const adminAuth = require('../middlewares/adminAuth');

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// })
const upload = multer({ storage: multer.memoryStorage() });

router.post('/createTask', AdminAuth ,async (req, res) => {
    try {
        if(!req.user) {
            return res.send({success: false, message : 'Authentication failed'});
        }
        const taskData = req.body.taskData;

        const createTask = await taskService.createTask(taskData, req.user);

        if(createTask.success) {
            res.send({ success: true, message: createTask.message || 'Task created successfully' });
        } else {
            res.send({ success: false, message: createTask.message || 'Error while creating new task' });
        }
    } catch (error) {
        return res.send({ success: false, message : error.message || 'Error while creating new task' })
    }
    
}); 

router.get('/getTasks', userAuth ,async (req, res) => {
    try {
        
        const user = req.user;
        
        if(!user)  return res.send({success: false, message : 'Authorization failed'});
        const getTasks = await taskService.getTasks(req.query, user);
        
        if( getTasks.success) {
           return res.send({success: true, message : getTasks.message || 'Tasks fetched successfully', tasks : getTasks.data, meta : getTasks.meta})
        } else {
            return res.send({success: false, message : getTasks.message || 'Error while fetching tasks', tasks : getTasks.data, meta : getTasks.meta })
        }
    } catch (error) {
        return res.send({success: false, message : error.message || 'Error while fetching tasks', tasks : [],meta: {
                                                                                            total :0,
                                                                                            page :1,
                                                                                            limit: 10,
                                                                                            totalPages: 0,
                                                                                            hasNext: false
                                                                                        } })
    }
    
});

router.post('/getTaskDetails', userAuth ,async (req, res) => {
    try {
        if(!req.user) {
            return res.send({success: false, message : 'Authentication failed'});
        }
        const taskId = req.body.taskData;

        const getTaskDetails = await taskService.getTaskDetails(taskId, req.user);

        if(getTaskDetails.success) {
            res.send({ success: true, message: getTaskDetails.message || 'Task fetched successfully', task : getTaskDetails.task });
        } else {
            res.send({ success: false, message: getTaskDetails.message || 'Error while fetching task details', task : getTaskDetails.task });
        }
    } catch (error) {
        return res.send({ success: false, message : error.message || 'Error while fetching task details', task : [] })
    }
    
});

router.post('/updateTask', userAuth ,async (req, res) => {
    try {
        if(!req.user) {
            return res.send({success: false, message : 'Authentication failed'});
        }
        const taskData = req.body.taskData;
        const taskId = req.body.taskId;

        const updateTask = await taskService.updateTask(taskId, taskData);

        if(updateTask.success) {
            res.send({ success: true, message: updateTask.message || 'Task updated successfully' });
        } else {
            res.send({ success: false, message: updateTask.message || 'Error while updating task' });
        }
    } catch (error) {
        return res.send({ success: false, message : error.message || 'Error while updating task' });
    }
    
});

router.post('/getTasksByStatus', userAuth ,async (req, res) => {
    try {
        if(!req.user) {
            return res.send({success: false, message : 'Authentication failed'});
        }
        const data = req.body;

        const getTasks = await taskService.groupTasksByStatus(data);
        if(getTasks.success) {
            res.send({ success: true, message: getTasks.message || 'Task fetched successfully', result : getTasks.result});
        } else {
            res.send({ success: false, message: getTasks.message || 'Error while fetching tasks', result : getTasks.result });
        }
    } catch (error) {
        return res.send({ success: false, message : error.message || 'Error while fetching tasks', result : [] })
    }
    
});

router.post('/getTasksByProgress', userAuth ,async (req, res) => {
    try {
        if(!req.user) {
            return res.send({success: false, message : 'Authentication failed'});
        }
        const data = req.body;

        const getTasks = await taskService.groupTasksByProgress(data);

        if(getTasks.success) {
            res.send({ success: true, message: getTasks.message || 'Task fetched successfully', result : getTasks.result});
        } else {
            res.send({ success: false, message: getTasks.message || 'Error while fetching tasks', result : getTasks.result });
        }
    } catch (error) {
        return res.send({ success: false, message : error.message || 'Error while fetching tasks', result : [] })
    }
    
});

router.post('/getTasksByPriority', userAuth ,async (req, res) => {
    try {
        if(!req.user) {
            return res.send({success: false, message : 'Authentication failed'});
        }
        const data = req.body;

        const getTasks = await taskService.groupTasksByPriority(data);

        if(getTasks.success) {
            res.send({ success: true, message: getTasks.message || 'Task fetched successfully', result : getTasks.result});
        } else {
            res.send({ success: false, message: getTasks.message || 'Error while fetching tasks', result : getTasks.result });
        }
    } catch (error) {
        return res.send({ success: false, message : error.message || 'Error while fetching tasks', result : [] })
    }
    
});

router.post('/getTasksByMonth', userAuth ,async (req, res) => {
    try {
        if(!req.user) {
            return res.send({success: false, message : 'Authentication failed'});
        }
        
        const data = req.body;

        const getTasks = await taskService.groupTasksByMonth(data);

        if(getTasks.success) {
            res.send({ success: true, message: getTasks.message || 'Task fetched successfully', result : getTasks.result});
        } else {
            res.send({ success: false, message: getTasks.message || 'Error while fetching tasks', result : getTasks.result });
        }
    } catch (error) {
        return res.send({ success: false, message : error.message || 'Error while fetching tasks', result : [] })
    }
    
});

router.post('/generatePdf', userAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.send({ success: false, message: 'Authentication failed' });
    }

    const data = req.body;
    const pdfBuffer = await taskService.generatePdf(data);

    if (!pdfBuffer) {
      return res.send({ success: false, message: 'PDF generation failed' });
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="task_report.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error in PDF route:', error);
    res.send({ success: false, message: error.message });
  }
});

router.post('/uploadTasksFromCSV', upload.single('file'), adminAuth ,async (req, res) => {
    try {
        
        if(!req.user) {
            return res.send({success: false, message : 'Authentication failed'});
        } 
        if(!req.file) {
            return res.send({success: false, message : 'File not found'});
        }

        const projectId = req.body.projectId;
        const buffer = req.file.buffer;

        const parsedData = await parseCSV(buffer);
        
        const uploadtask = await taskService.uploadTasksFromCSV(parsedData, projectId, req.user);

        res.send({success: true, response : uploadtask})

    } catch (error) {
        return res.send({ success: false, message : error.message || 'Error while uploading tasks', response : [] })
    }
    
});

function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

module.exports = router;