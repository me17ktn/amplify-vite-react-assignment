import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { uploadData } from 'aws-amplify/storage'
import "./App.css"

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [children, setChildren] = useState<Array<Schema["Children"]["type"]>>([]);
  const [text, setText] = useState("")
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const { user, signOut } = useAuthenticator();
  
  
  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });

    client.models.Children.observeQuery().subscribe({
      next: (data) => setChildren([...data.items]),
    });
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
  
  const handleClick = () => {
    if (!file) {
      return;
    }
    uploadData({
      path: `photos/${file.name}`,
      data: file,
    });
  };

  return (
    <main>
      <h1>{user?.signInDetails?.loginId}'s todos</h1>
      <input type="text" placeholder="todo" value={text} onChange={handleChangeText}/>
      <input type="text" placeholder="yyyy-MM-DD" value={date} onChange={handleChangeDate}/>
      <button onClick={createTodo}>add</button>
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
                <div className="uploader">
                  <label htmlFor="uploadFile" className="uploadLabel">Img</label>
                  <input type="file" id="uploadFile" onChange={handleChangeFile} />
                  <button className="uploadBtn" onClick={handleClick}>Up</button>
                </div>
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
