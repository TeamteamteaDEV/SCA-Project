import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { Routes, Route } from "react-router-dom";
import Display from './pages/Display';
import Page404 from './pages/Page404';
import Task from './pages/Task';

function App() {

  return (
    
      <Routes>
        <Route path="/">
          <Route index element={<Display />} />
          <Route path="display" element={<Display />} />
          <Route path=":projectId" element={<Task />} />
          <Route path="*" element={<Page404 />} />
        </Route>
      </Routes>

  )
}

export default App;
