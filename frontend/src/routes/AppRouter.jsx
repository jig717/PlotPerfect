import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";


import LoginPage from "../Components/LoginPage";
import SignupPage from "../Components/Signup";
import "../App.css";

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
]);

const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;
