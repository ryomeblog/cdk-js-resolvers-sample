import React, { useEffect, useState } from 'react';
import { Auth, API, graphqlOperation } from 'aws-amplify';
import { listTasks } from './graphql/queries';
import { createTask, updateTask, deleteTask } from './graphql/mutations';
import { Button, TextField, List, ListItem, Typography, Checkbox, Container, ListItemText, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchTasks = async () => {
    const apiData = await API.graphql(graphqlOperation(listTasks));
    setTasks(apiData.data.listTasks);
  }

  const addTask = async () => {
    await API.graphql(
      graphqlOperation(createTask, {
        input: { title: newTaskTitle, description: newDescription }
      }));
    await fetchTasks();
    setNewTaskTitle('');
    setNewDescription('');
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
    <Container>
      {isAuthenticated ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4">ユーザーはログインしています。</Typography>
          {/* サインアウトボタン */}
          <Button variant="contained" color="primary" onClick={() => Auth.signOut().then(() => setIsAuthenticated(false))}>サインアウト</Button>
          <Box sx={{ mt: 4 }}>
            <TextField value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} label="New Task" fullWidth/>
            <TextField value={newDescription} onChange={(e) => setNewDescription(e.target.value)} label="Description" rows={5} multiline fullWidth/>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={addTask}>Add Task</Button>
          </Box>
          <List>
            {tasks.map((task) => (
              <ListItem key={task.ToDoID} secondaryAction={
                <IconButton edge="end" onClick={() => deleteToDoTask(task.ToDoID)}>
                  <DeleteIcon />
                </IconButton>
              }>
                <Checkbox checked={task.completed} onClick={() => updateCompleted(task.ToDoID)} />
                <ListItemText primary={task.title} secondary={task.description} />
              </ListItem>
            ))}
          </List>
        </Box>
      ) : (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4">ユーザーはログインしていません。</Typography>
          {/* ログインボタン */}
          <Button variant="contained" color="primary" onClick={() => Auth.federatedSignIn()}>ログイン/サインアップ</Button>
        </Box>
      )}
    </Container>
  );
}

export default App;
