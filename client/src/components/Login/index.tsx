import React, { useState, useEffect } from 'react';
import './Login.css';
import Notice from '../Notice';
import { useAuthContext } from '../../contexts/AuthContext';

const noticeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '105%',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '40px',
  left: '50%',
  transform: 'translateX(-50%)',
  whiteSpace: 'nowrap',
};

export default function LoginBox() {
  const { registerInfo, updateRegisterInfo, errorMessage, registerUser } =
    useAuthContext();
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRegisterInfo({ ...registerInfo, [e.target.name]: e.target.value });
  };

  return (
    <div className="login">
      <div className="login_box">
        {errorMessage && <Notice msg={errorMessage} style={noticeStyle} />}
        <form onSubmit={registerUser}>
          <div className="form_field">
            <label htmlFor="nickname" className="sr_only">
              nickname
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              className="input_nickname"
              placeholder="Nickname"
              autoComplete="off"
              onChange={onChange}
            />
          </div>
          <div className="form_field">
            <button type="submit" className="btn_admission">
              입장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
