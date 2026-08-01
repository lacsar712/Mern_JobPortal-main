import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import toast from "react-hot-toast";

const SignUp = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const { createUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignUp = async (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      setErrorMessage("两次输入的密码不一致");
      return;
    }

    try {
      await createUser(email, password);
      toast.success("账号创建成功！");
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "注册失败。");
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="h-screen mx-auto container flex items-center justify-center">
      <div className="w-full max-w-xs mx-auto">
        <form
          onSubmit={handleSignUp}
          className="bg-white shadow-md rounded px-8 pt-8 pb-8 mb-4"
        >
          <h3 className="text-xl font-semibold mb-4">注册</h3>
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
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              密码
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="******************"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              确认密码
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="confirmPassword"
              type="password"
              placeholder="******************"
            />
            {errorMessage && (
              <p className="text-red-500 text-xs italic">{errorMessage}</p>
            )}
          </div>
          <div className="flex items-center justify-center">
            <button
              className="bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white font-bold py-1.5 px-10 rounded focus:outline-none focus:ring focus:ring-violet-300 ..."
              type="submit"
            >
              注册
            </button>
          </div>
        </form>
        <p className="text-center text-gray-500 text-xs">
          &copy;2023 求职门户. 保留所有权利。
        </p>
      </div>
    </div>
  );
};

export default SignUp;
