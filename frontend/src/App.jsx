import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Messages from "./pages/Messages";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./lib/axios";
import NotificationsPage from "./pages/NotificationsPage";
import NetworkPage from "./pages/NetworkPage";
import PostPage from "./pages/PostPage";
import ProfilePage from "./pages/ProfilePage";
import Landing from "./Landing/Landing";
import LoginForm from "./components/auth/LoginForm";
import ManageUsers from "./components/admin/ManageUsers";
import ViewUserPosts from "./components/admin/ViewUserPosts";
import NotFoundPage from "./NotFoundPage";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import EditPost from "./components/EditPost";
import { useContext } from "react";
import { AppContext } from "./AppContext.jsx";

function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
      } catch (err) {
        if (err.response && err.response.status === 401) {
          return null;
        }
        toast.error(err.response.data.message || "Something went wrong");
      }
    },
  });
  console.log("authUser", authUser);
  if (isLoading) return null; // Show nothing or a loader while checking authentication
  const role = localStorage.getItem("userRole");
  const { isDark, setIsDark } = useContext(AppContext);

  return (
    <div className={`${isDark ? "dark" : ""}`}>
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
        <Route
          path="/"
          element={
            authUser ? (
              role !== "admin" ? (
                <Layout>
                  <HomePage />
                </Layout>
              ) : (
                <ManageUsers />
              )
            ) : (
              <Landing />
            )
          }
        />
        <Route path="edit" element={<EditPost />} />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/forgotPassword"
          element={!authUser ? <ForgotPasswordForm /> : <Navigate to="/" />}
        />
        <Route
          path="/reset-password/:id"
          element={!authUser ? <ResetPasswordForm /> : <Navigate to="/" />}
        />
        <Route
          path="/resetPassword"
          element={!authUser ? <ResetPasswordForm /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />

        {role === "admin" && (
          <>
            <Route path="/admin/posts/:userId" element={<ViewUserPosts />} />
          </>
        )}
        {role === "user" && (
          <>
            <Route
              path="/messages"
              element={
                authUser ? (
                  <Layout>
                    <Messages />
                  </Layout>
                ) : (
                  <Landing />
                )
              }
            />
            <Route
              path="/notifications"
              element={
                authUser ? (
                  <Layout>
                    <NotificationsPage />
                  </Layout>
                ) : (
                  <Landing />
                )
              }
            />
            <Route
              path="/network"
              element={
                authUser ? (
                  <Layout>
                    <NetworkPage />
                  </Layout>
                ) : (
                  <Landing />
                )
              }
            />
            <Route
              path="/post/:postId"
              element={
                authUser ? (
                  <Layout>
                    <PostPage />
                  </Layout>
                ) : (
                  <Landing />
                )
              }
            />
            <Route
              path="/profile/:username"
              element={
                authUser ? (
                  <Layout>
                    <ProfilePage />
                  </Layout>
                ) : (
                  <Landing />
                )
              }
            />
          </>
        )}
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
