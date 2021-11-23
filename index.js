const homedir = require('os').homedir()
const home = process.env.HOME || homedir
const p = require('path')
const dbPath = p.join(home, '.todo')
const fs = require('fs')
const db = require('./db.js')
const inquirer = require('inquirer')

module.exports.add = async (title) => {
  //读取之前的任务
  const list = await db.read()
  //往里面添加一个任务
  list.push({ title, done: false })
  //存储任务到文件
  db.write(list)
}

module.exports.clear = async (title) => {
  await db.write([])
}
function markAsDone(list,index) {
  list[index].done = true
  db.write(list)
}
function markAsUndone(list,index) {
  list[index].done = false
  db.write(list)
}
function updateTitle(list,index) {
  inquirer.prompt({
    type: 'input',
    name: 'title',
    message: '新的标题',
    default: list[index].title
  }).then(answers => {
    list[index].title = answers.title
    db.write(list)
  })
}
function remove(list,index) {
  list.splice(index, 1)
  db.write(list)
}
function askForAction(list, index) {
  const actions = {
    markAsUndone,
    markAsDone,
    remove,
    updateTitle
}

  inquirer.prompt({
    type: 'list', name: 'action',
    message: '请选择操作',
    choices: [
      { name: '退出', value: 'quit' },
      { name: '已完成', value: 'markAsDone' },
      { name: '未完成', value: 'markAsUndone' },
      { name: '改标题', value: 'updateTitle' },
      { name: '删除', value: 'remove' }
    ]
  }).then(answer2 => {
    const action = actions[answer2.action]
    action && action(list,index)
  })
}

function askForCreateTask(list) {
  inquirer.prompt({
    type: 'input',
    name: 'title',
    message: '输入任务标题'
  }).then(answers => {
    list.push({
      title: answers.title,
      done: false
    })
    db.write(list)
  })
}
function printTasks(list) {
  inquirer
    .prompt({
      type: 'list',
      name: 'index',
      message: 'What do you want to choose?',
      choices: [{ name: '退出', value: '-1' }, ...list.map((task, index) => {
        return { name: `${task.done ? '[x]' : '[_]'} ${index + 1} - ${task.title}`, value: index.toString() }
      }), { name: '创建任务', value: '-2' }]
    })
    .then((answers) => {
      const index = parseInt(answers.index)
      if (index >= 0) {
        askForAction(list, index)

      } else if (index === -2) {
        askForCreateTask(list)
      }
    });
}

module.exports.showAll = async (title) => {
  //读取之前的任务
  const list = await db.read()
  //打印之前的任务
  printTasks(list)
}