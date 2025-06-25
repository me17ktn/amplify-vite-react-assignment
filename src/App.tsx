import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import "./App.css"

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [children, setChildren] = useState<Array<Schema["Children"]["type"]>>([]);
  const [text, setText] = useState("")
  const [date, setDate] = useState("");
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
            <button className="childrenBtn" onClick={() => createChild(todo.id)}>子タスク</button>
            {children.map((child) => (
            <div key={child.id}>
              <input type="checkbox" onChange={() => deleteChild(child.id)} />
              <span className="todoText">{child.content}  by {child.deadline}</span>
            </div>
            ))}
          </div>
        ))}
      </div>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
