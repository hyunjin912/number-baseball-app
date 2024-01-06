import React, { useCallback } from 'react';
import './RoomList.css';
import RoomItem from '../RoomItem';
import { useSocketContext, Room } from '../../contexts/SocketContext';

export default function RoomList() {
  const { roomRegisterInfo, updateRoomRegisterInfo, rooms, registerRoom } =
    useSocketContext();

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateRoomRegisterInfo({
        ...roomRegisterInfo,
        [e.target.name]: e.target.value,
      });
    },
    [roomRegisterInfo],
  );

  return (
    <div className="room">
      <div className="room_box">
        <ul className={rooms.length > 0 ? 'room_list' : 'room_list empty'}>
          {rooms.length > 0
            ? rooms.map((room: Room) => (
                <RoomItem key={room.roomNumber} room={room} />
              ))
            : '입장할 방이 없습니다.'}
        </ul>
        <div className="romm_creater">
          <input
            type="text"
            className="input_roomname"
            name="roomname"
            placeholder="방 이름"
            autoComplete="off"
            onChange={onChange}
          />
          <button className="btn_create_room" onClick={registerRoom}>
            방 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
