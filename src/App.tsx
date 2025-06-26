import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { Button, Flex, Loader, Text, TextAreaField, useAuthenticator } from '@aws-amplify/ui-react';
import { uploadData, list, remove } from 'aws-amplify/storage'
import {StorageImage} from '@aws-amplify/ui-react-storage'
import { useAIGeneration } from "./client";
import "./App.css"

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [children, setChildren] = useState<Array<Schema["Children"]["type"]>>([]);
  const [text, setText] = useState("")
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [fetchedFiles, setFetchedFiles] = useState<any[]>([]);
  const [description, setDescription] = useState("");
  const { user, signOut } = useAuthenticator();
  const [{ data, isLoading }, generateTodo] = useAIGeneration("generateTodo");
  
  
  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });

    client.models.Children.observeQuery().subscribe({
      next: (data) => setChildren([...data.items]),
    });

    fetchFiles();
  }, []);
  

  function createTodo() {
    client.models.Todo.create({ content: text, deadline: date });
  }

  function createChild(id: string) {
    client.models.Children.create({ content: window.prompt("Todo"), deadline: window.prompt("deadline(yyyy-MM-DD)"), todoId:id });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  function deleteChild(id: string) {
    client.models.Children.delete({ id })
  }

  const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  }

  const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  }

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if(files) {
      setFile(files[0]);
    };
  }
  
  const handleClick = async(id: string) => {
    if (!file) {
      return;
    }
    uploadData({
      path: `photos/${id}`,
      data: file,
    });

    fetchFiles();
  };

  const fetchFiles = async () => {
    const result = await list({
      path: 'photos/',
    });
    setFetchedFiles(result.items);
  };

  const removeImg = async(id: string) => {
    try {
      await remove({
        path: `photos/${id}`
      })
    } catch (error) {
      console.log('Error', error);
    }
    fetchFiles()
  }

  const handleClickAi = async () => {
    generateTodo({ description });
  };
  
  return (
    <main className="main">
      <h1>{user?.signInDetails?.loginId}'s todos</h1>
      <Flex direction="column">
      <Flex direction="row">
        <TextAreaField
          autoResize
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          label="Description"
        />
        <Button onClick={handleClickAi}>Generate Todo</Button>
      </Flex>
      {isLoading ? (
        <Loader variation="linear" />
      ) : (
        <>
          <Text fontWeight="bold">{data?.content}</Text>
          <Text>{data?.deadline}</Text>
        </>
      )}
    </Flex>
      <input type="text" placeholder="todo" value={text} onChange={handleChangeText}/>
      <input type="text" placeholder="yyyy-MM-DD" value={date} onChange={handleChangeDate}/>
      <button onClick={createTodo}>add</button>
      <div className="uploadImg">
        <label htmlFor="uploadFile" className="uploadLabel">Img</label>
        <input type="file" id="uploadFile" onChange={handleChangeFile} />
        <span className="fileName">{file?.name}</span>
        <span className="note">Refresh this page after pressing "Up" button.</span>
      </div>
      <div>
        {todos.map((todo) => (
          <div key={todo.id}>
            <input type="checkbox" onChange={() => deleteTodo(todo.id)} />
            <span className="todoText">{todo.content}  by {todo.deadline}</span>
            <button className="childrenBtn" onClick={() => createChild(todo.id)}>+ child task</button>
            {children.map((child) => (
              child.todoId === todo.id ?
              <div key={child.id} className="children">
                <div>
                  <input type="checkbox" onChange={() => deleteChild(child.id)} />
                  <span>{child.content}  by {child.deadline}</span>
                </div>
                {
                fetchedFiles.length !== 0
                ?
                  fetchedFiles.map((item) => (
                    item.path === `photos/${child.id}` 
                    ? <div className="childImg" key={item.path} onClick={() => removeImg(child.id)}>
                        <StorageImage alt="child-img" path={`photos/${child.id}`}/>
                      </div>
                    : <div key={child.id} className="uploader">
                        <button className="uploadBtn" onClick={() => handleClick(child.id)}>Up</button>
                      </div>))
                : 
                  <div className="uploader">
                    <button className="uploadBtn" onClick={() => handleClick(child.id)}>Up</button>
                  </div>
                }
              </div>
            : ""
            ))}
          </div>
        ))}
      </div>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
