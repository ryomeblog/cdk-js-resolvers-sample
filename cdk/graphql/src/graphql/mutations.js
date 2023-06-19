/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUser = /* GraphQL */ `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      ToDoID
      username
      __typename
    }
  }
`;
export const updateUser = /* GraphQL */ `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ToDoID
      username
      __typename
    }
  }
`;
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser($ToDoID: String!) {
    deleteUser(ToDoID: $ToDoID) {
      ToDoID
      username
      __typename
    }
  }
`;
export const createTask = /* GraphQL */ `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      ToDoID
      title
      description
      completed
      ownerId
      __typename
    }
  }
`;
export const updateTask = /* GraphQL */ `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      ToDoID
      title
      description
      completed
      ownerId
      __typename
    }
  }
`;
export const deleteTask = /* GraphQL */ `
  mutation DeleteTask($ToDoID: String!) {
    deleteTask(ToDoID: $ToDoID) {
      ToDoID
      title
      description
      completed
      ownerId
      __typename
    }
  }
`;
