import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useContext(AuthContext);

  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    try {
      await login(email, password);
      toast.success("登录成功！");
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage("请输入正确的邮箱和密码！");
    }
  };

  return (
    <div className="h-screen mx-auto container flex items-center justify-center">
      <div className="w-full max-w-xs mx-auto">
        <form
          onSubmit={handleLogin}
          className="bg-white shadow-md rounded px-8 pt-8 pb-8 mb-4"
        >
          <h3 className="text-xl font-semibold mb-4">请登录</h3>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              邮箱地址
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="name@email.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              密码
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="******************"
            />

            {errorMessage && (
              <p className="text-red-500 text-xs italic">
                请输入正确的邮箱和密码。
              </p>
            )}
          </div>
          <div className="flex items-center justify-center mb-6 ">
            <input
              className="bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white font-bold py-1.5 px-10 rounded focus:outline-none focus:ring focus:ring-violet-300 ..."
              type="submit"
              value="登录"
            />
          </div>
          <div className="flex items-center justify-center ml-2">
            或
            <a
              href="/sign-up"
              className="ml-2 px-2 py-2 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white font-bold  rounded focus:outline-none focus:ring focus:ring-violet-300 ..."
            >
              注册
            </a>
          </div>
        </form>
        <p className="text-center text-gray-500 text-xs">
          &copy;2023 求职门户. 保留所有权利。
        </p>
      </div>
    </div>
  );
};

export default Login;
