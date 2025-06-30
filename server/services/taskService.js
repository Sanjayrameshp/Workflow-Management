const Task = require('../models/Tasks');
const User = require('../models/User');
const Project = require('../models/Project')
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');

var createTask = async function(taskData, user) {
    try {
      console.log("taskData >> ", taskData);
        const newTask = new Task({
            title : taskData.title,
            description : taskData.description,
            status : taskData.status,
            priority : taskData.priority,
            endDate : taskData.endDate,
            startDate: taskData.startDate,
            customMessage: taskData.customMessage,
            project : taskData.projectId,
            assignedTo : taskData.assignedTo,
            createdBy : user._id,
        })

        newTask.save();
        return { success: true, message: 'Task created successfully' }
    
    } catch (error) {
      console.log("errror 22 >> ", error);
        return { success: fasle, message: error.message || 'Error while creating new task' }
    }
}

var getTasks = async function(options, user) {
    try {
        let {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'startDate',
            sortOrder = 'asc',
            status = '',
            projectId
        } = options;

        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        let filter = {
            project: projectId
        };

        if (user.role === 'admin') {
            filter.createdBy = user._id;
        } else if (user.role === 'user') {
            filter.assignedTo = user._id;
        }

        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        if (status) {
            filter.status = status;
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [tasks, total] = await Promise.all([
                                    Task.find(filter)
                                        .sort(sort)
                                        .skip(skip)
                                        .limit(limit).populate('assignedTo'),
                                    Task.countDocuments(filter)
                                ]);
                                console.log("TASKSSS > ", tasks);
                                
        return { success: true, message: 'Successfully fetched tasks', data: tasks, meta: {
                                                                                            total,
                                                                                            page,
                                                                                            limit,
                                                                                            totalPages: Math.ceil(total / limit),
                                                                                            hasNext: skip + tasks.length < total
                                                                                        }}
        
    } catch (error) {
        console.log("error > ", error);
        
        return {success: false, message : 'Error while fetching tasks', data: [], meta: {
                                                                                            total :0,
                                                                                            page :1,
                                                                                            limit: 10,
                                                                                            totalPages: 0,
                                                                                            hasNext: false
                                                                                        }}
    }
}

var getTaskDetails = async function(taskId, user) {
    try {
        let filter = { _id : taskId}
        if(user.role === 'admin') {
            filter.createdBy = user._id
        } else if (user.role === 'user') {
            filter.assignedTo = user._id
        }
        let task = await Task.findOne(filter).populate('createdBy').populate('assignedTo');

        return { success: true, message: 'Task fetched successfully', task:task }
    
    } catch (error) {
        return { success: false, message: error.message || 'Error while fetching task', task:[] }
    }
}

var updateTask = async function(taskId, taskData) {
    try {
        const updateFields = {
          status: taskData.status,
          progress: taskData.progress,
          endDate: taskData.endDate ? new Date(taskData.endDate) : undefined,
          customMessage: taskData.customMessage ? taskData.customMessage : ''
        };
        if (taskData.assignedTo) {
          updateFields.assignedTo = taskData.assignedTo;
        }
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          updateFields,
          { new: true, runValidators: true }
        );
         if (!updatedTask) {
            return res.send({ success: false, message: 'Task not found' });
        }

        return { success: true, message: 'Task updated successfully' }
    
    } catch (error) {
        console.log("err > ". error);
        
        return { success: false, message: error.message || 'Error while updating task' }
    }
}

var groupTasksByStatus = async function(data) {
    try {

        const groupByStatus = await Task.aggregate([
                                        { $match: {
                    assignedTo: new mongoose.Types.ObjectId(data.userId),
                    project: new mongoose.Types.ObjectId(data.projectId)
                }},
                                        { $group: {
                                            _id: "$status",
                                            tasks: { $push: "$$ROOT" },
                                            count: { $sum: 1 }
                                            }
                                        },
                                        { $sort: { _id: 1 } }
                                    ])

                                    console.log("group > ", groupByStatus);
                                    

        return { success: true, message:'Successfully fetched the tasks by status', result : groupByStatus }
    
    } catch (error) {
        return { success: false, message: error.message || 'Error while fetching', result : [] }
    }
}

var groupTasksByProgress = async function(data) {
    try {

        const groupByProgress = await Task.aggregate([
                                        { $match: {
                    assignedTo: new mongoose.Types.ObjectId(data.userId),
                    project: new mongoose.Types.ObjectId(data.projectId)
                } },
                                        {
                                            $group: {
                                            _id: "$progress",
                                            tasks: { $push: "$$ROOT" },
                                            count: { $sum: 1 }
                                            }
                                        },
                                        { $sort: { _id: 1 } }
                                        ]);

        return { success: true, message:'Successfully fetched the tasks by progress', result : groupByProgress }
    
    } catch (error) {
        return { success: false, message: error.message || 'Error while fetching', result : [] }
    }
}

var groupTasksByPriority = async function(data) {
    try {

        const groupByPriority = await Task.aggregate([
                                        { $match: {
                    assignedTo: new mongoose.Types.ObjectId(data.userId),
                    project: new mongoose.Types.ObjectId(data.projectId)
                } },
                                        {
                                            $group: {
                                            _id: "$priority",
                                            tasks: { $push: "$$ROOT" },
                                            count: { $sum: 1 }
                                            }
                                        },
                                        { $sort: { _id: 1 } }
                                        ]);

        return { success: true, message:'Successfully fetched the tasks by priority', result : groupByPriority }
    
    } catch (error) {
        return { success: false, message: error.message || 'Error while fetching', result : [] }
    }
}

var groupTasksByMonth = async function(data) {
    try {

        const groupByMonth = await Task.aggregate([
                                    { $match: {
                    assignedTo: new mongoose.Types.ObjectId(data.userId),
                    project: new mongoose.Types.ObjectId(data.projectId),
                    startDate: { $ne: null }
                } },
                                    {
                                        $group: {
                                        _id: { $month: "$startDate" },
                                        tasks: { $push: "$$ROOT" },
                                        count: { $sum: 1 }
                                        }
                                    },
                                    {
                                        $addFields: {
                                        month: {
                                            $arrayElemAt: [
                                            [ "", "January", "February", "March", "April", "May", "June", "July",
                                                "August", "September", "October", "November", "December"
                                            ],
                                            "$_id"
                                            ]
                                        }
                                        }
                                    },
                                    { $sort: { _id: 1 } }
                                    ]);


        return { success: true, message:'Successfully fetched the tasks by month', result : groupByMonth }
    
    } catch (error) {
        return { success: false, message: error.message || 'Error while fetching', result : [] }
    }
}

var generatePdf = async function (data) {
  try {
    const { userId, projectId } = data;

    const user = await User.findById(userId);
    const project = await Project.findById(projectId);
    const tasks = await Task.find({ project: projectId, assignedTo: userId });

    if (!user || !project) {
      throw new Error('User or project not found');
    }

    const taskCount = tasks.length;
    const statusCount = {};
    const priorityCount = {};

    tasks.forEach(task => {
      statusCount[task.status] = (statusCount[task.status] || 0) + 1;
      priorityCount[task.priority] = (priorityCount[task.priority] || 0) + 1;
    });

    const html = `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            position: relative;
          }

          /* Watermark container */
          .watermark-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
          }

          .watermark {
            position: absolute;
            font-size: 40px;
            color: rgba(150, 150, 150, 0.08);
            transform: rotate(-30deg);
            white-space: nowrap;
          }

          .card {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            background: white;
            position: relative;
            z-index: 1;
          }

          h1 {
            font-size: 28px;
            background: linear-gradient(to right, #e74c3c, #3498db);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          h2 {
            color: #0a3d62;
            margin-bottom: 10px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th, td {
            padding: 10px;
            border: 1px solid #ccc;
            text-align: left;
          }

          th {
            background-color: #f0f0f0;
          }
        </style>
      </head>
      <body>

        <!-- Watermark Overlay -->
        <div class="watermark-container">
          ${[...Array(5)].map((_, i) =>
            [...Array(3)].map((_, j) =>
              `<div class="watermark" style="top:${i * 200}px; left:${j * 300}px;">Quantivio</div>`
            ).join('')
          ).join('')}
        </div>

        <h1>User Analytics Report</h1>

        <div class="card">
          <h2>User Info</h2>
          <p><strong>Name:</strong> ${user.firstname} ${user.lastname}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
        </div>

        <div class="card">
          <h2>Project Info</h2>
          <p><strong>Name:</strong> ${project.name}</p>
          <p><strong>Status:</strong> ${project.status}</p>
          <p><strong>Description:</strong> ${project.description || 'N/A'}</p>
          <p><strong>Start:</strong> ${project.startDate.toDateString()}</p>
          <p><strong>End:</strong> ${project.endDate ? project.endDate.toDateString() : 'N/A'}</p>
        </div>

        <div class="card">
          <h2>Task Summary</h2>
          <p><strong>Total Tasks:</strong> ${taskCount}</p>
          <p><strong>By Status:</strong></p>
          <ul>
            ${Object.entries(statusCount).map(([k, v]) => `<li>${k}: ${v}</li>`).join('')}
          </ul>
          <p><strong>By Priority:</strong></p>
          <ul>
            ${Object.entries(priorityCount).map(([k, v]) => `<li>${k}: ${v}</li>`).join('')}
          </ul>
        </div>

        <div class="card">
          <h2>Task List</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map((task, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${task.title}</td>
                  <td>${task.status}</td>
                  <td>${task.priority}</td>
                  <td>${task.progress}%</td>
                  <td>${new Date(task.startDate).toLocaleDateString()}</td>
                  <td>${task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </body>
    </html>`;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};


module.exports.createTask = createTask;
module.exports.getTasks = getTasks;
module.exports.getTaskDetails = getTaskDetails;
module.exports.updateTask = updateTask;
module.exports.groupTasksByStatus = groupTasksByStatus;
module.exports.groupTasksByProgress = groupTasksByProgress;
module.exports.groupTasksByPriority = groupTasksByPriority;
module.exports.groupTasksByMonth = groupTasksByMonth;
module.exports.generatePdf = generatePdf;