import React, { useCallback, useEffect, useState } from 'react';
import './UserList.css';
import UserItem from '../UserItem';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSocketContext } from '../../contexts/SocketContext';

export default function UserList() {
  const { user: currentUser } = useAuthContext();
  const { users } = useSocketContext();
  const [toggle, setToggle] = useState(false);

  const onToggle = useCallback(() => {
    setToggle((prev) => !prev);
  }, []);

  if (!currentUser) {
    return null;
  } else {
    return (
      <div className="users">
        <button
          className={toggle ? 'btn_user_list cancel' : 'btn_user_list'}
          onClick={onToggle}
        ></button>

        {toggle && (
          <>
            <div className="list_box">
              <div className="my_nickname">{currentUser?.nickname}</div>
              <ul className="user_list">
                {users.map((user: typeof currentUser) => (
                  <UserItem key={user.token} user={user} />
                ))}
              </ul>
              <div className="user_list_dimmed" onClick={onToggle}></div>
            </div>
            <span className="total_users">Number of users: {users.length}</span>
          </>
        )}
      </div>
    );
  }
}
