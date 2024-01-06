import React from 'react';
import './RoomItem.css';
import { Room, useSocketContext } from '../../contexts/SocketContext';

type RoomItemProps = {
  room: Room;
};

export default function RoomItem({ room }: RoomItemProps) {
  const { enterRoom } = useSocketContext();
  const onEnter = () => {
    console.log(room);
    enterRoom(room);
  };

  if (room.usersInTheRoom.length >= 2) {
    return (
      <li className="room_item full">
        <div>
          <div className="room_tit">
            <span>{room.roomName}</span>
          </div>
          <div className="room_author">{room.author.nickname}</div>
        </div>
      </li>
    );
  } else {
    return (
      <li className="room_item" onClick={onEnter}>
        <div>
          <div className="room_tit">
            <span>{room.roomName}</span>
          </div>
          <div className="room_author">{room.author.nickname}</div>
        </div>
      </li>
    );
  }
}
