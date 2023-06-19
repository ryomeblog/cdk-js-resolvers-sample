/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUser = /* GraphQL */ `
  query GetUser($ToDoID: String!) {
    getUser(ToDoID: $ToDoID) {
      ToDoID
      username
      __typename
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers {
    listUsers {
      ToDoID
      username
      __typename
    }
  }
`;
export const getTask = /* GraphQL */ `
  query GetTask($ToDoID: String!) {
    getTask(ToDoID: $ToDoID) {
      ToDoID
      title
      description
      completed
      ownerId
      __typename
    }
  }
`;
export const listTasks = /* GraphQL */ `
  query ListTasks {
    listTasks {
      ToDoID
      title
      description
      completed
      ownerId
      __typename
    }
  }
`;
