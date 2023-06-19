import React, { useEffect, useState } from 'react';
import { Auth, API, graphqlOperation } from 'aws-amplify';
import { listTasks } from './graphql/queries';
import { createTask, updateTask, deleteTask } from './graphql/mutations';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchTasks = async () => {
    const apiData = await API.graphql(graphqlOperation(listTasks));
    console.log(apiData);
    setTasks(apiData.data.listTasks);
  }

  const addTask = async () => {
    await API.graphql(
      graphqlOperation(createTask, {
        input: { title: newTaskTitle, description: newDescription }
      }));
    await fetchTasks();
    setNewTaskTitle("");
  }

  const updateCompleted = async (toDoID) => {
    await API.graphql(
      graphqlOperation(updateTask, {
        input: { ToDoID: toDoID, completed: true }
      }));
    await fetchTasks();
  }

  const deleteToDoTask = async (toDoID) => {
    await API.graphql(
      graphqlOperation(deleteTask, {
        ToDoID: toDoID
      }));
    await fetchTasks();
  }

  useEffect(() => {
    // ログインチェック
    Auth.currentAuthenticatedUser()
      .then(user => {
        // タスクを取得
        setIsAuthenticated(true);
        fetchTasks();
      })
      .catch(err => { });
  }, []);

  return (
    <>
      {isAuthenticated ? (
        <div>
          <p>ユーザーはログインしています。</p>
          {/* サインアウトボタン */}
          <button onClick={() => Auth.signOut().then(() => setIsAuthenticated(false))}>サインアウト</button>
          <br /><br />
          <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="New Task" />
          <br />
          <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows="5" cols="33"></textarea>
          <br />
          <button onClick={addTask}>Add Task</button>
          <ul>
            {tasks.map((task) => (
              <li key={task.ToDoID}>
                <h2>{task.title}</h2>
                <p>{task.description}</p>
                <p>{task.completed ? 'Completed' : (<><button onClick={() => updateCompleted(task.ToDoID)}>Not completed</button></>)}</p>
                <p><button onClick={() => deleteToDoTask(task.ToDoID)}>Delete</button></p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <p>ユーザーはログインしていません。</p>
          {/* ログインボタン */}
          <button onClick={() => Auth.federatedSignIn().then(() => setIsAuthenticated(true))}>ログイン/サインアップ</button>
        </>
      )}
    </>
  );
}

export default App;
