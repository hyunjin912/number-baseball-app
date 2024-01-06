import React from 'react';
import './UserItem.css';
import { User, useAuthContext } from '../../contexts/AuthContext';

type UserItemProps = {
  user: User;
};

export default function UserItem({ user }: UserItemProps) {
  const {
    user: currentUser
  } = useAuthContext();
  const isSameUser = currentUser!.nickname === user.nickname;

  return (
    <li className={isSameUser ? 'user_item myself' : 'user_item'}>
      {user.nickname}
    </li>
  );
}
